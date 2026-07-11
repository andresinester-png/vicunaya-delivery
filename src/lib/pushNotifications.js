const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function getOrCreateSubscription() {
  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;
  return registration.pushManager.subscribe({
    userVisibleOnly:      true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
}

/**
 * Requests notification permission, registers the service worker,
 * subscribes to push, and saves the subscription to Supabase.
 *
 * Returns the PushSubscription or null if unavailable / denied.
 */
export async function subscribeToPush(userId, supabaseClient) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[push] Not supported in this browser');
    return null;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.warn('[push] VITE_VAPID_PUBLIC_KEY is not set');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  try {
    const subscription = await getOrCreateSubscription();

    // Persist to Supabase — one row per user, upsert on conflict
    await supabaseClient
      .from('push_subscriptions')
      .upsert(
        { user_id: userId, subscription: subscription.toJSON() },
        { onConflict: 'user_id' }
      );

    return subscription;
  } catch (err) {
    console.error('[push] Subscription failed:', err);
    return null;
  }
}

/**
 * Asks the client for notification permission and saves their push subscription
 * directly on the order row so the server can notify them on status changes.
 *
 * Returns true on success, false if permission was denied or an error occurred.
 */
export async function subscribeClientForOrder(orderId, supabaseClient) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  if (!VAPID_PUBLIC_KEY) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  try {
    const subscription = await getOrCreateSubscription();

    await supabaseClient
      .from('orders')
      .update({ client_push_subscription: subscription.toJSON() })
      .eq('id', orderId);

    return true;
  } catch (err) {
    console.error('[push] Client order subscription failed:', err);
    return false;
  }
}
