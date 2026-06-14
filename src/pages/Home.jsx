import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ChevronRight, CalendarClock } from 'lucide-react';
import bgImage from '../screen.png';

const CARDS = [
  {
    id: 'rotiserias',
    title: 'Rotiserías',
    subtitle: 'Pedí tu comida favorita',
    image: 'https://hvmdumuedqfoifgayleh.supabase.co/storage/v1/object/public/IMAGES/ChatGPT%20Image%2012%20may%202026,%2019_14_30.png',
    to: '/rotiserias',
    accent: '#FF6B00',
  },
  {
    id: 'encomiendas',
    title: 'Encomiendas a Río Cuarto',
    subtitle: 'Lunes a viernes',
    image: 'https://hvmdumuedqfoifgayleh.supabase.co/storage/v1/object/public/IMAGES/ChatGPT%20Image%2012%20may%202026,%2021_25_26.png',
    to: '/encomiendas',
    accent: '#7C3AED',
  },
  {
    id: 'turnos',
    title: 'Turnos',
    subtitle: 'Peluquerías, talleres y más',
    to: '/turnos',
    accent: '#FFC700',
    gradient: 'linear-gradient(135deg, #ff5b5f 0%, #e31b23 55%, #8e0e13 100%)',
    icon: CalendarClock,
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

export default function Home() {
  const navigate = useNavigate();

  // ── Parallax ──────────────────────────────────────────────────
  const scrollY = useMotionValue(0);
  // La imagen se mueve al 30% de la velocidad del scroll → efecto parallax suave
  const bgY = useTransform(scrollY, v => v * 0.30);

  useEffect(() => {
    const el = document.getElementById('main-scroll');
    if (!el) return;
    const onScroll = () => scrollY.set(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollY]);

  return (
    <div style={{ position: 'relative', minHeight: '100%', background: '#111' }}>

      {/* ── Fondo con parallax ── */}
      <motion.div
        aria-hidden
        style={{
          position: 'absolute',
          top: '-18%',
          left: 0,
          right: 0,
          bottom: '-18%',
          y: bgY,
          willChange: 'transform',
          overflow: 'hidden',
        }}
      >
        <img
          src={bgImage}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            display: 'block',
          }}
        />
      </motion.div>

      {/* ── Overlay oscuro semitransparente ── */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.38) 50%, rgba(0,0,0,0.60) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Contenido sobre el fondo ── */}
      <div style={{ position: 'relative', zIndex: 2, padding: '24px 16px 32px' }}>

        {/* Saludo */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 600, marginBottom: 3 }}>
            Vicuña Mackenna, Córdoba
          </p>
          <h1 style={{
            fontSize: 28, fontWeight: 900, color: '#fff',
            letterSpacing: '-0.03em', lineHeight: 1.1,
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}>
            ¿Qué necesitás hoy?
          </h1>
        </div>

        {/* Cards */}
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
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.015, y: -3 }}
              transition={{ type: 'spring', stiffness: 350, damping: 24 }}
              onClick={() => navigate(card.to)}
              style={{
                position: 'relative',
                height: 140,
                borderRadius: 28,
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
              }}
            >
              {/* Imagen o fondo de la card */}
              {card.image ? (
                <img
                  src={card.image}
                  alt={card.title}
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div style={{ position: 'absolute', inset: 0, background: card.gradient }} />
              )}

              {/* Ícono decorativo */}
              {card.icon && (
                <card.icon
                  size={130}
                  strokeWidth={1.5}
                  style={{ position: 'absolute', right: -22, bottom: -18, color: 'rgba(255,255,255,0.18)' }}
                />
              )}

              {/* Overlay de la card */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(160deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.48) 60%, rgba(0,0,0,0.68) 100%)',
              }} />

              {/* Flecha arriba-derecha */}
              <div style={{
                position: 'absolute', top: 16, right: 16,
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.28)',
                borderRadius: 999,
                width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ChevronRight size={16} color="#fff" strokeWidth={2.5} />
              </div>

              {/* Texto inferior */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '16px 20px 22px',
              }}>
                <h2 style={{
                  color: '#fff', fontSize: 22, fontWeight: 900,
                  letterSpacing: '-0.02em', lineHeight: 1.1,
                  textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  margin: 0,
                }}>
                  {card.title}
                </h2>
                <p style={{
                  color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: 600,
                  marginTop: 4, textShadow: '0 1px 4px rgba(0,0,0,0.35)',
                }}>
                  {card.subtitle}
                </p>
                <div style={{
                  marginTop: 12, height: 3, width: 40, borderRadius: 2,
                  background: card.accent, opacity: 0.95,
                }} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
