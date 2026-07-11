import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';
import { playNotificationBell } from '../lib/sounds.js';

export default function useNotifications() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(false);

  const fetch = useCallback(async () => {
    if (!userId) { setNotifications([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data || []);
    setLoading(false);
  }, [userId]);

  // Carga inicial
  useEffect(() => { fetch(); }, [fetch]);

  // Realtime: INSERT → prepend
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notif-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT', schema: 'public', table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        ({ new: n }) => {
          setNotifications(prev => [n, ...prev]);
          playNotificationBell();
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const markAsRead = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    await supabase.from('notifications').update({ leida: true }).eq('id', id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
    await supabase
      .from('notifications')
      .update({ leida: true })
      .eq('user_id', userId)
      .eq('leida', false);
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.leida).length;

  return { notifications, loading, unreadCount, markAsRead, markAllAsRead };
}
