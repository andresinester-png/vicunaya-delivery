import { useEffect, useRef, useState } from 'react';

const MUTE_KEY = 'restaurant_alert_muted';

export function usePendingOrdersAlert(pendingCount) {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTE_KEY) === 'true');
  const originalTitleRef = useRef(document.title);
  const titleFlipRef = useRef(false);

  // Sound loop — recursive setTimeout so dings never overlap
  useEffect(() => {
    if (pendingCount === 0 || !audioEnabled || muted) return;
    let alive = true;
    const loop = () => {
      if (!alive) return;
      new Audio('/sounds/ding.wav').play().catch(() => {});
      setTimeout(loop, 2500);
    };
    loop();
    return () => { alive = false; };
  }, [pendingCount, audioEnabled, muted]);

  // Tab title flicker when document is hidden
  useEffect(() => {
    const original = originalTitleRef.current;
    if (pendingCount === 0) {
      document.title = original;
      return;
    }
    const id = setInterval(() => {
      if (document.hidden) {
        titleFlipRef.current = !titleFlipRef.current;
        document.title = titleFlipRef.current ? '🔴 Pedido nuevo' : original;
      } else {
        document.title = original;
      }
    }, 1000);
    const onVisible = () => { if (!document.hidden) document.title = original; };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      document.title = original;
    };
  }, [pendingCount]);

  const enableAudio = () => setAudioEnabled(true);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    localStorage.setItem(MUTE_KEY, String(next));
  };

  return { audioEnabled, muted, enableAudio, toggleMute };
}
