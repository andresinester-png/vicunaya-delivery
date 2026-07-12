import webPush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const MESSAGES = {
  accepted:  { title: '¡Tu pedido fue aceptado! 🎉', body: 'Están preparando tu pedido.' },
  preparing: { title: 'Tu pedido está en preparación 👨‍🍳', body: 'Pronto estará listo.' },
  ready:     { title: 'Tu pedido está en camino 🛵',    body: 'El repartidor ya salió.' },
  delivered: { title: '¡Tu pedido fue entregado! ✅',   body: '¡Buen provecho!' },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const { orderId, newStatus } = req.body ?? {};

  if (!orderId || !MESSAGES[newStatus]) {
    return res.status(400).json({ error: 'orderId and a valid newStatus are required' });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data: order, error } = await supabase
    .from('orders')
    .select('client_push_subscription, delivery_method')
    .eq('id', orderId)
    .single();

  if (error || !order?.client_push_subscription) {
    return res.status(200).json({ sent: false, reason: 'no_subscription' });
  }

  webPush.setVapidDetails(
    'mailto:' + (process.env.VAPID_MAILTO || 'admin@vicunaya.com'),
    process.env.VITE_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  let { title, body } = MESSAGES[newStatus];
  if (newStatus === 'ready' && order.delivery_method === 'pickup') {
    title = 'Tu pedido está listo para retirar 🏪';
    body  = 'Podés pasar a buscarlo al local.';
  }
  const payload = JSON.stringify({
    title,
    body,
    data: { url: `/pedido/${orderId}` },
  });

  try {
    await webPush.sendNotification(order.client_push_subscription, payload);
    return res.status(200).json({ sent: true });
  } catch (err) {
    console.error('[push-client] send failed:', err.statusCode, err.message);
    if (err.statusCode === 410 || err.statusCode === 404) {
      // Subscription expired — clean it up
      await supabase
        .from('orders')
        .update({ client_push_subscription: null })
        .eq('id', orderId);
    }
    return res.status(200).json({ sent: false, error: err.message });
  }
}
