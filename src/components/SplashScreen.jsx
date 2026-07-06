import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import bgImage from '../screen.png';

const SPLASH_KEY = 'vicunaya_splash_shown';
const DURATION   = 5000; // ms antes del fade-out

// Keyframes para la sombra dinámica que acompaña el giro del logo
const SPIN_TIMES   = [0, 0.25, 0.5, 0.75, 1];
const SPIN_FILTER  = [
  'drop-shadow(0px 6px 18px rgba(0,0,0,0.50))',
  'drop-shadow(-16px 3px 6px rgba(0,0,0,0.70))',
  'drop-shadow(0px 6px 18px rgba(0,0,0,0.50))',
  'drop-shadow(16px 3px 6px rgba(0,0,0,0.70))',
  'drop-shadow(0px 6px 18px rgba(0,0,0,0.50))',
];

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

            {/* Logo con spin 3D volumétrico */}
            <motion.div
              initial={{ opacity: 0, scale: 0.80 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{
                perspective: '280px',           // valor bajo = efecto 3D más pronunciado
                perspectiveOrigin: 'center center',
              }}
            >
              {/* Sombra dinámica que sigue el giro */}
              <motion.div
                animate={{
                  rotateY: [0, 90, 180, 270, 360],
                  filter: SPIN_FILTER,
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                  times: SPIN_TIMES,
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span style={{
                  color: '#fff', fontWeight: 900, fontSize: 46,
                  letterSpacing: '-0.04em', lineHeight: 1,
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

            {/* Barra de progreso de carga */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.35 }}
              style={{
                marginTop: 10,
                width: 210, height: 3,
                background: 'rgba(255,255,255,0.14)',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{
                  duration: (DURATION / 1000) - 0.6,
                  ease: 'linear',
                  delay: 0.5,
                }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #D32F2F 0%, #FF6B6B 100%)',
                  borderRadius: 999,
                  boxShadow: '0 0 8px rgba(211,47,47,0.7)',
                }}
              />
            </motion.div>
          </div>

          {/* Crédito — Playfair Display italic, efecto 3D en texto */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.55 }}
            style={{
              position: 'absolute', bottom: 44,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 700,
              fontSize: 15,
              color: 'rgba(255,255,255,0.93)',
              margin: 0,
              letterSpacing: '0.02em',
              textShadow: [
                '0 1px 0 rgba(255,255,255,0.12)',
                '0 2px 0 rgba(0,0,0,0.32)',
                '0 3px 0 rgba(0,0,0,0.22)',
                '0 4px 0 rgba(0,0,0,0.12)',
                '0 8px 22px rgba(0,0,0,0.55)',
              ].join(', '),
            }}
          >
            Idea: Joaquín Pellegrini
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
