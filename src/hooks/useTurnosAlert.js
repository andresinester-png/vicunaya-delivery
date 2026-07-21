import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { playNotificationBell, playCancellationSound } from '../lib/sounds.js';
import toast from 'react-hot-toast';

const MUTE_KEY = 'turnos_alert_muted';
const FF = "'Plus Jakarta Sans', sans-serif";

export function useTurnosAlert(negocioId) {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTE_KEY) === 'true');

  // Refs so the realtime callback always reads current values without re-subscribing
  const audioEnabledRef = useRef(audioEnabled);
  const mutedRef        = useRef(muted);

  useEffect(() => { audioEnabledRef.current = audioEnabled; }, [audioEnabled]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  useEffect(() => {
    if (!negocioId) return;

    const channel = supabase
      .channel(`turnos-alert-${negocioId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments', filter: `business_id=eq.${negocioId}` },
        (payload) => {
          const { eventType, new: curr, old: prev } = payload;

          // New pending appointment from a customer
          if (eventType === 'INSERT' && curr.status === 'pending') {
            if (audioEnabledRef.current && !mutedRef.current) playNotificationBell();
            toast(`📅 Nuevo turno: ${curr.customer_name || 'Cliente'}`, {
              duration: 6000,
              style: { fontFamily: FF, fontWeight: 700 },
            });
            return;
          }

          // Appointment cancelled (by customer from MisTurnos)
          if (eventType === 'UPDATE' && curr.status === 'cancelled') {
            const wasNotCancelled = !prev?.status || prev.status !== 'cancelled';
            if (!wasNotCancelled) return;
            if (audioEnabledRef.current && !mutedRef.current) playCancellationSound();
            toast(`Turno cancelado: ${curr.customer_name || 'Cliente'}`, {
              duration: 6000,
              style: {
                fontFamily: FF, fontWeight: 700,
                background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA',
              },
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [negocioId]); // Only re-subscribe when business changes

  const enableAudio = () => setAudioEnabled(true);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    localStorage.setItem(MUTE_KEY, String(next));
  };

  return { audioEnabled, muted, enableAudio, toggleMute };
}
