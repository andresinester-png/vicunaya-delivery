import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import bgImage from '../screen.png';

const SPLASH_KEY = 'vicunaya_splash_shown';
const DURATION   = 2600; // ms antes del fade-out

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
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#111',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Foto de fondo */}
          <img
            src={bgImage}
            alt=""
            aria-hidden
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center top',
            }}
          />

          {/* Overlay oscuro */}
          <div
            aria-hidden
            style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.38) 50%, rgba(0,0,0,0.68) 100%)',
            }}
          />

          {/* Contenido central */}
          <div style={{
            position: 'relative', zIndex: 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
          }}>

            {/* Logo con spin 3D en eje Y (efecto moneda) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.80 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{ perspective: '700px' }}
            >
              <motion.div
                animate={{ rotateY: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span style={{
                  color: '#fff', fontWeight: 900, fontSize: 46,
                  letterSpacing: '-0.04em', lineHeight: 1,
                  textShadow: '0 2px 18px rgba(0,0,0,0.55)',
                }}>
                  Vicuña
                </span>
                <span style={{
                  background: '#D32F2F', color: '#fff',
                  borderRadius: 12, padding: '3px 14px',
                  fontWeight: 900, fontSize: 46, letterSpacing: '-0.04em',
                }}>
                  Ya
                </span>
              </motion.div>
            </motion.div>

            {/* Localización */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              style={{
                color: 'rgba(255,255,255,0.58)', fontSize: 13, fontWeight: 600,
                margin: 0, letterSpacing: '0.01em',
              }}
            >
              Vicuña Mackenna, Córdoba
            </motion.p>
          </div>

          {/* Crédito */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            style={{
              position: 'absolute', bottom: 44,
              color: 'rgba(255,255,255,0.32)', fontSize: 11, fontWeight: 500,
              margin: 0, letterSpacing: '0.03em',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Idea: Joaquín Pellegrini
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
