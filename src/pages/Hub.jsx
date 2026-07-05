import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import bgImage from '../screen.png';

const CARDS = [
  {
    id: 'delivery',
    title: 'Delivery',
    subtitle: 'Rotiserías, empanadas y más',
    image: 'https://hvmdumuedqfoifgayleh.supabase.co/storage/v1/object/public/IMAGES/ChatGPT%20Image%2012%20may%202026,%2019_14_30.png',
    to: '/delivery',
  },
  {
    id: 'turnos',
    title: 'Turnos',
    subtitle: 'Peluquerías, talleres y más',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
    to: '/turnos',
  },
  {
    id: 'encomiendas',
    title: 'Encomiendas a Río Cuarto',
    subtitle: 'Servicio lunes a viernes',
    image: 'https://hvmdumuedqfoifgayleh.supabase.co/storage/v1/object/public/IMAGES/ChatGPT%20Image%2012%20may%202026,%2021_25_26.png',
    to: '/encomiendas',
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

export default function Hub() {
  const navigate = useNavigate();

  const scrollY = useMotionValue(0);
  const bgY = useTransform(scrollY, v => v * 0.3);

  useEffect(() => {
    const el = document.getElementById('hub-scroll');
    if (!el) return;
    const onScroll = () => scrollY.set(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollY]);

  return (
    <div
      id="hub-scroll"
      style={{
        minHeight: '100dvh',
        position: 'relative',
        overflow: 'auto',
        background: '#111',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Fondo con parallax */}
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

      {/* Overlay oscuro */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.65) 100%)',
        }}
      />

      {/* Contenido */}
      <div style={{ position: 'relative', zIndex: 2, padding: '56px 20px 48px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              color: '#fff', fontWeight: 900, fontSize: 34,
              letterSpacing: '-0.04em', lineHeight: 1,
              textShadow: '0 2px 12px rgba(0,0,0,0.4)',
            }}>
              Vicuña
            </span>
            <span style={{
              background: '#D32F2F', color: '#fff',
              borderRadius: 10, padding: '2px 11px',
              fontWeight: 900, fontSize: 34, letterSpacing: '-0.04em',
            }}>
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

        {/* Cards de servicios */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {CARDS.map(card => (
            <motion.div
              key={card.id}
              variants={cardVariants}
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.015, y: -3 }}
              transition={{ type: 'spring', stiffness: 350, damping: 24 }}
              onClick={() => navigate(card.to)}
              style={{
                position: 'relative', height: 140, borderRadius: 28,
                overflow: 'hidden', cursor: 'pointer',
                boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
              }}
            >
              {/* Foto de fondo */}
              <img
                src={card.image}
                alt={card.title}
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%', objectFit: 'cover',
                }}
              />

              {/* Gradient overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(160deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.48) 60%, rgba(0,0,0,0.70) 100%)',
              }} />

              {/* Flecha glassmorphism */}
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
          ))}
        </motion.div>
      </div>
    </div>
  );
}
