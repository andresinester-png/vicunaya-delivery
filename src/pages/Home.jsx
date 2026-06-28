import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, CalendarClock } from 'lucide-react';

const DISPLAY_FONT = "'Bricolage Grotesque', 'Plus Jakarta Sans', system-ui, sans-serif";

const CARDS = [
  {
    id: 'rotiserias',
    title: 'Rotiserías',
    subtitle: 'Pedí tu comida favorita',
    image: 'https://hvmdumuedqfoifgayleh.supabase.co/storage/v1/object/public/IMAGES/ChatGPT%20Image%2012%20may%202026,%2019_14_30.png',
    to: '/rotiserias',
  },
  {
    id: 'encomiendas',
    title: 'Encomiendas a Río Cuarto',
    subtitle: 'Lunes a viernes',
    image: 'https://hvmdumuedqfoifgayleh.supabase.co/storage/v1/object/public/IMAGES/ChatGPT%20Image%2012%20may%202026,%2021_25_26.png',
    to: '/encomiendas',
  },
  {
    id: 'turnos',
    title: 'Turnos',
    subtitle: 'Peluquerías, talleres y más',
    to: '/turnos',
    icon: CalendarClock,
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 22 } },
};

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100%', background: '#F5F5F6', padding: '24px 16px 32px' }}>

      {/* Saludo */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: '#8A8A8E', fontWeight: 600, marginBottom: 4 }}>
          Vicuña Mackenna, Córdoba
        </p>
        <h1 style={{
          fontFamily: DISPLAY_FONT,
          fontSize: 30, fontWeight: 800, color: '#1C1C1E',
          letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0,
        }}>
          ¿Qué necesitás hoy?
        </h1>
      </div>

      {/* Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        {CARDS.map(card => (
          <motion.div
            key={card.id}
            variants={cardVariants}
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 350, damping: 24 }}
            onClick={() => navigate(card.to)}
            style={{
              position: 'relative',
              height: 150,
              borderRadius: 20,
              overflow: 'hidden',
              cursor: 'pointer',
              background: card.image
                ? '#1C1C1E'
                : 'linear-gradient(155deg, #f5333b 0%, #e31b23 52%, #c01920 100%)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 18px rgba(0,0,0,0.08)',
            }}
          >
            {/* Imagen de la card */}
            {card.image && (
              <img
                src={card.image}
                alt={card.title}
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                }}
              />
            )}

            {/* Ícono decorativo (card sin imagen) */}
            {card.icon && (
              <card.icon
                size={130}
                strokeWidth={1.5}
                style={{ position: 'absolute', right: -22, bottom: -18, color: 'rgba(255,255,255,0.20)' }}
              />
            )}

            {/* Overlay para legibilidad del texto */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(160deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.42) 60%, rgba(0,0,0,0.66) 100%)',
            }} />

            {/* Flecha arriba-derecha */}
            <div style={{
              position: 'absolute', top: 14, right: 14,
              background: 'rgba(255,255,255,0.22)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 999,
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ChevronRight size={16} color="#fff" strokeWidth={2.5} />
            </div>

            {/* Texto inferior */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '16px 20px 18px',
            }}>
              <h2 style={{
                fontFamily: DISPLAY_FONT,
                color: '#fff', fontSize: 22, fontWeight: 800,
                letterSpacing: '-0.02em', lineHeight: 1.1,
                textShadow: '0 1px 6px rgba(0,0,0,0.35)',
                margin: 0,
              }}>
                {card.title}
              </h2>
              <p style={{
                color: 'rgba(255,255,255,0.88)', fontSize: 13, fontWeight: 600,
                marginTop: 4, textShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }}>
                {card.subtitle}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
