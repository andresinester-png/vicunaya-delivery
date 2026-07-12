import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ChevronRight, Lock, MapPin, Navigation } from 'lucide-react';
import bgImage from '../screen.png';
import BottomNav from '../components/BottomNav.jsx';
import { useGeo } from '../context/GeoContext.jsx';

const CARDS = [
  {
    id: 'delivery',
    title: 'Delivery',
    subtitle: 'Rotiserías, empanadas y más',
    image: 'https://hvmdumuedqfoifgayleh.supabase.co/storage/v1/object/public/IMAGES/ChatGPT%20Image%2012%20may%202026,%2019_14_30.png',
    to: '/delivery',
    geoRestricted: true,
  },
  {
    id: 'turnos',
    title: 'Turnos',
    subtitle: 'Peluquerías, talleres y más',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
    to: '/turnos',
    geoRestricted: true,
  },
  {
    id: 'encomiendas',
    title: 'Encomiendas a Río Cuarto',
    subtitle: 'Servicio lunes a viernes',
    image: 'https://hvmdumuedqfoifgayleh.supabase.co/storage/v1/object/public/IMAGES/ChatGPT%20Image%2012%20may%202026,%2021_25_26.png',
    to: '/encomiendas',
    geoRestricted: false,
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 22 } },
};

function HubBackground({ bgY }) {
  return (
    <>
      <motion.div
        aria-hidden
        style={{
          position: 'fixed', top: '-18%', left: 0, right: 0, bottom: '-18%',
          y: bgY, willChange: 'transform', zIndex: 0,
        }}
      >
        <img
          src={bgImage}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
        />
      </motion.div>
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.65) 100%)',
        }}
      />
    </>
  );
}

export default function Hub() {
  const navigate = useNavigate();
  const { geoState } = useGeo();

  const scrollY = useMotionValue(0);
  const bgY     = useTransform(scrollY, v => v * 0.3);

  useEffect(() => {
    const el = document.getElementById('hub-scroll');
    if (!el) return;
    const onScroll = () => scrollY.set(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollY]);

  const outZone = geoState === 'outZone';

  // ── GPS denegado ─────────────────────────────────────────────────────────────
  if (geoState === 'denied') {
    return (
      <div
        style={{
          minHeight: '100dvh', position: 'relative', overflow: 'auto',
          background: '#111', fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <HubBackground bgY={bgY} />

        <div style={{ position: 'relative', zIndex: 2, padding: '56px 20px 104px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 34, letterSpacing: '-0.04em', lineHeight: 1, textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
                Vicuña
              </span>
              <span style={{ background: '#D32F2F', color: '#fff', borderRadius: 10, padding: '2px 11px', fontWeight: 900, fontSize: 34, letterSpacing: '-0.04em' }}>
                Ya
              </span>
            </div>
          </div>

          {/* Card GPS requerido */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              width: '100%', maxWidth: 380,
              background: 'rgba(255,255,255,0.10)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 24, padding: '32px 24px',
              textAlign: 'center',
            }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Navigation size={28} color="rgba(255,255,255,0.9)" strokeWidth={1.8} />
            </div>

            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 20, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
              Ubicación requerida
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
              Para usar Delivery y Turnos necesitamos acceso a tu ubicación. Habilitá el GPS en la configuración de tu navegador y recargá la página.
            </p>

            <div style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 14, padding: '12px 16px',
              marginBottom: 20,
            }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, margin: 0 }}>
                💡 También podés usar Encomiendas desde cualquier lugar sin necesidad de ubicación
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/encomiendas')}
              style={{
                width: '100%', background: '#D32F2F', color: '#fff',
                border: 'none', borderRadius: 16, padding: '14px 20px',
                fontSize: 15, fontWeight: 800, cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 4px 18px rgba(211,47,47,0.45)',
              }}
            >
              Ir a Encomiendas
            </motion.button>
          </motion.div>
        </div>

        <BottomNav />
      </div>
    );
  }

  // ── Hub normal (inZone, loading, outZone) ─────────────────────────────────
  return (
    <div
      id="hub-scroll"
      style={{
        minHeight: '100dvh', position: 'relative', overflow: 'auto',
        background: '#111', fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <HubBackground bgY={bgY} />

      {/* Contenido */}
      <div style={{ position: 'relative', zIndex: 2, padding: '56px 20px 104px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 34, letterSpacing: '-0.04em', lineHeight: 1, textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
              Vicuña
            </span>
            <span style={{ background: '#D32F2F', color: '#fff', borderRadius: 10, padding: '2px 11px', fontWeight: 900, fontSize: 34, letterSpacing: '-0.04em' }}>
              Ya
            </span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 13, fontWeight: 600, margin: '8px 0 0' }}>
            Vicuña Mackenna, Córdoba
          </p>
        </div>

        {/* Título */}
        <h1 style={{
          fontSize: 28, fontWeight: 900, color: '#fff',
          letterSpacing: '-0.03em', lineHeight: 1.1,
          textShadow: '0 2px 12px rgba(0,0,0,0.5)',
          margin: '0 0 22px',
        }}>
          ¿Qué necesitás hoy?
        </h1>

        {/* Banner de restricción geográfica */}
        {outZone && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              background: 'rgba(255,255,255,0.10)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 16, padding: '14px 16px',
              marginBottom: 16,
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}
          >
            <MapPin size={18} color="rgba(255,255,255,0.8)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600, lineHeight: 1.55, margin: 0 }}>
              VicuñaYa Delivery y Turnos están disponibles solo en Vicuña Mackenna y alrededores. Podés usar el módulo de Encomiendas desde cualquier lugar.
            </p>
          </motion.div>
        )}

        {/* Cards de servicios */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {CARDS.map(card => {
            const locked = outZone && card.geoRestricted;

            return (
              <motion.div
                key={card.id}
                variants={cardVariants}
                whileTap={locked ? undefined : { scale: 0.97 }}
                whileHover={locked ? undefined : { scale: 1.015, y: -3 }}
                transition={{ type: 'spring', stiffness: 350, damping: 24 }}
                onClick={locked ? undefined : () => navigate(card.to)}
                style={{
                  position: 'relative', height: 140, borderRadius: 28,
                  overflow: 'hidden',
                  cursor: locked ? 'default' : 'pointer',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                  opacity: locked ? 0.72 : 1,
                  transition: 'opacity 0.2s ease',
                }}
              >
                {/* Foto de fondo */}
                <img
                  src={card.image}
                  alt={card.title}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Gradient overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(160deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.48) 60%, rgba(0,0,0,0.70) 100%)',
                }} />

                {/* Lock overlay */}
                {locked && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.45)',
                    backdropFilter: 'blur(1.5px)',
                    WebkitBackdropFilter: 'blur(1.5px)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 6, zIndex: 5,
                  }}>
                    <Lock size={22} color="rgba(255,255,255,0.9)" strokeWidth={2} />
                    <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Solo en Vicuña Mackenna
                    </span>
                  </div>
                )}

                {/* Flecha glassmorphism */}
                {!locked && (
                  <div style={{
                    position: 'absolute', top: 16, right: 16,
                    background: 'rgba(255,255,255,0.18)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.28)',
                    borderRadius: 999, width: 32, height: 32,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ChevronRight size={16} color="#fff" strokeWidth={2.5} />
                  </div>
                )}

                {/* Texto inferior */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px 22px' }}>
                  <h2 style={{
                    color: '#fff', fontSize: 22, fontWeight: 900,
                    letterSpacing: '-0.02em', lineHeight: 1.1,
                    textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    margin: '0 0 4px',
                  }}>
                    {card.title}
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: 600, margin: 0 }}>
                    {card.subtitle}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
