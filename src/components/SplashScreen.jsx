import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FF = "'Plus Jakarta Sans', sans-serif";
const SPLASH_KEY = 'kyvra_splash_shown';
const DURATION   = 5000;

export default function SplashScreen() {
  const [visible, setVisible] = useState(() => !sessionStorage.getItem(SPLASH_KEY));

  useEffect(() => {
    if (!visible) return;
    sessionStorage.setItem(SPLASH_KEY, '1');
    const t = setTimeout(() => setVisible(false), DURATION);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'linear-gradient(170deg, #061118 0%, #0A1E2A 28%, #0D3A35 56%, #0F172A 100%)',
            fontFamily: FF,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Teal atmosphere — radiates from mid-screen behind icon */}
          <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div style={{
              position: 'absolute',
              top: '10%', left: '50%', transform: 'translateX(-50%)',
              width: 700, height: 600,
              background: 'radial-gradient(ellipse, rgba(13,148,136,0.30) 0%, rgba(13,148,136,0.10) 38%, transparent 65%)',
              filter: 'blur(4px)',
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-5%', left: '50%', transform: 'translateX(-50%)',
              width: 900, height: 350,
              background: 'radial-gradient(ellipse, rgba(13,148,136,0.09) 0%, transparent 60%)',
            }} />
          </div>

          {/* Central content */}
          <div style={{
            position: 'relative', zIndex: 1,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 30,
          }}>

            {/* Icon mark with halo + pulse rings */}
            <motion.div
              initial={{ opacity: 0, scale: 0.58 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.70, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {/* Soft halo behind icon */}
              <div style={{
                position: 'absolute',
                width: 260, height: 260, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(13,148,136,0.45) 0%, rgba(13,148,136,0.14) 45%, transparent 68%)',
                filter: 'blur(12px)',
              }} />

              {/* Pulse ring 1 */}
              <motion.div
                animate={{ scale: [1, 1.85], opacity: [0.65, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  width: 124, height: 124, borderRadius: 36,
                  border: '1.5px solid rgba(13,148,136,0.62)',
                }}
              />
              {/* Pulse ring 2 */}
              <motion.div
                animate={{ scale: [1, 2.3], opacity: [0.38, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: 0.70 }}
                style={{
                  position: 'absolute',
                  width: 124, height: 124, borderRadius: 36,
                  border: '1px solid rgba(13,148,136,0.32)',
                }}
              />

              {/* Icon mark — official KYVRA app icon */}
              <motion.img
                src="/kyvra-app-icon.png"
                alt="Kyvra"
                animate={{ scale: [1, 1.038, 1] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'relative', zIndex: 1,
                  width: 124, height: 124,
                  borderRadius: 32,
                  boxShadow: '0 0 55px rgba(13,148,136,0.65), 0 0 110px rgba(13,148,136,0.22), 0 24px 64px rgba(0,0,0,0.65)',
                  display: 'block',
                }}
              />
            </motion.div>

            {/* Wordmark + tagline */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.60, ease: 'easeOut' }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
            >
              <span style={{
                color: '#fff', fontWeight: 900, fontSize: 52,
                letterSpacing: '-0.05em', lineHeight: 1,
                fontFamily: FF,
              }}>
                Kyvra
              </span>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65, duration: 0.45 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
              >
                <span style={{
                  color: 'rgba(255,255,255,0.52)',
                  fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.24em', textTransform: 'uppercase',
                  fontFamily: FF,
                }}>
                  Mackenna
                </span>
                <span style={{
                  color: 'rgba(255,255,255,0.28)',
                  fontSize: 9, fontWeight: 600,
                  letterSpacing: '0.20em', textTransform: 'uppercase',
                  fontFamily: FF,
                }}>
                  Todo en un solo lugar
                </span>
              </motion.div>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.68, duration: 0.35 }}
              style={{
                marginTop: 6,
                width: 240, height: 3,
                background: 'rgba(255,255,255,0.07)',
                borderRadius: 999, overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{
                  duration: (DURATION / 1000) - 0.9,
                  ease: 'linear',
                  delay: 0.75,
                }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #0D9488 0%, #5EEAD4 100%)',
                  borderRadius: 999,
                  boxShadow: '0 0 14px rgba(13,148,136,0.90)',
                }}
              />
            </motion.div>
          </div>

          {/* Attribution */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.70 }}
            style={{
              position: 'absolute',
              bottom: 'calc(36px + env(safe-area-inset-bottom, 0px))',
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 12,
              color: 'rgba(255,255,255,0.18)',
              margin: 0,
              letterSpacing: '0.03em',
            }}
          >
            Idea: Joaquín Pellegrini
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
