function ctx() {
  return new (window.AudioContext || window.webkitAudioContext)();
}

// Campana tipo "ding" para notificaciones entrantes
export function playNotificationBell() {
  if (typeof window === 'undefined' || document.hidden) return;
  try {
    const ac  = ctx();
    const now = ac.currentTime;

    // Fundamental + 2 armónicos con decay diferente (simula bronce)
    [
      { freq: 880,  gain: 0.28, decay: 1.8 },
      { freq: 1760, gain: 0.14, decay: 1.1 },
      { freq: 2200, gain: 0.07, decay: 0.65 },
    ].forEach(({ freq, gain, decay }) => {
      const osc = ac.createOscillator();
      const env = ac.createGain();
      osc.connect(env);
      env.connect(ac.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      env.gain.setValueAtTime(gain, now);
      env.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      osc.start(now);
      osc.stop(now + decay);
    });

    setTimeout(() => ac.close(), 2100);
  } catch (_) { /* audio no disponible */ }
}

// Dos notas descendentes (mi→la) para cancelación de turno
export function playCancellationSound() {
  if (typeof window === 'undefined' || document.hidden) return;
  try {
    const ac  = ctx();
    const now = ac.currentTime;

    [
      { freq: 660, t: 0,    decay: 0.40 }, // E5 (descending = negative signal)
      { freq: 440, t: 0.22, decay: 0.62 }, // A4
    ].forEach(({ freq, t, decay }) => {
      const osc = ac.createOscillator();
      const env = ac.createGain();
      osc.connect(env);
      env.connect(ac.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0.0001, now + t);
      env.gain.linearRampToValueAtTime(0.22, now + t + 0.015);
      env.gain.exponentialRampToValueAtTime(0.0001, now + t + decay);
      osc.start(now + t);
      osc.stop(now + t + decay + 0.02);
    });

    setTimeout(() => ac.close(), 1000);
  } catch (_) {}
}

// Dos notas ascendentes (do→sol) para confirmar pedido
export function playConfirmation() {
  if (typeof window === 'undefined' || document.hidden) return;
  try {
    const ac  = ctx();
    const now = ac.currentTime;

    [
      { freq: 523.25, t: 0,    decay: 0.35 }, // C5
      { freq: 783.99, t: 0.19, decay: 0.52 }, // G5
    ].forEach(({ freq, t, decay }) => {
      const osc = ac.createOscillator();
      const env = ac.createGain();
      osc.connect(env);
      env.connect(ac.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0.0001, now + t);
      env.gain.linearRampToValueAtTime(0.3, now + t + 0.012); // attack rápido
      env.gain.exponentialRampToValueAtTime(0.0001, now + t + decay);
      osc.start(now + t);
      osc.stop(now + t + decay + 0.02);
    });

    setTimeout(() => ac.close(), 900);
  } catch (_) {}
}
