import webPush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Vercel Cron passes Authorization: Bearer <CRON_SECRET>
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  // Get today's date in Argentina time (UTC-3)
  const nowArgentina = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const todayDate = nowArgentina.toISOString().slice(0, 10); // "YYYY-MM-DD"

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('id, date, start_time, customer_user_id, appointment_businesses(name)')
    .in('status', ['pending', 'confirmed'])
    .eq('reminder_sent', false)
    .eq('date', todayDate)
    .not('customer_user_id', 'is', null);

  if (error) {
    console.error('[reminders] query error:', error);
    return res.status(500).json({ error: error.message });
  }

  if (!appointments || appointments.length === 0) {
    return res.status(200).json({ sent: 0, total: 0 });
  }

  webPush.setVapidDetails(
    'mailto:' + (process.env.VAPID_MAILTO || 'admin@vicunaya.com'),
    process.env.VITE_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  let sent = 0;
  const results = [];

  for (const appt of appointments) {
    const { data: sub } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', appt.customer_user_id)
      .maybeSingle();

    // Always mark as sent to avoid re-triggering even if no subscription
    await supabase.from('appointments').update({ reminder_sent: true }).eq('id', appt.id);

    if (!sub?.subscription) {
      results.push({ id: appt.id, sent: false, reason: 'no_subscription' });
      continue;
    }

    const businessName = appt.appointment_businesses?.name ?? 'el negocio';
    const time = String(appt.start_time).slice(0, 5); // "HH:MM"

    const payload = JSON.stringify({
      title: 'Recordatorio de turno',
      body: `Tenés un turno hoy a las ${time} en ${businessName}.`,
      data: { url: '/mis-turnos' },
    });

    try {
      await webPush.sendNotification(sub.subscription, payload);
      sent++;
      results.push({ id: appt.id, sent: true });
    } catch (err) {
      console.error('[reminders] push failed:', appt.id, err.statusCode, err.message);
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('user_id', appt.customer_user_id);
      }
      results.push({ id: appt.id, sent: false, error: err.message });
    }
  }

  return res.status(200).json({ sent, total: appointments.length, results });
}
