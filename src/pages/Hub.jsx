import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Lock, MapPin, Navigation,
  Store, Smartphone, Package,
  UtensilsCrossed, CalendarDays, Car,
} from 'lucide-react';
import BottomNav from '../components/BottomNav.jsx';
import { useGeo } from '../context/GeoContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { KYVRA } from '../lib/theme.js';

// ── Banners promocionales (datos sin cambios) ────────────────────────────────
const HUB_BANNERS = [
  {
    id: 'sumate',
    title: 'Sumate a Kyvra',
    subtitle: 'Registrá tu negocio y llegá a toda Vicuña Mackenna',
    Icon: Store,
    gradient: 'linear-gradient(135deg, #044A43 0%, #0F766E 100%)',
    subtitleColor: 'rgba(255,255,255,0.92)',
  },
  {
    id: 'pedi',
    title: 'Pedí desde donde estés',
    subtitle: 'Comida, turnos y encomiendas en un solo lugar',
    Icon: Smartphone,
    gradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    subtitleColor: '#5EEAD4',
  },
  {
    id: 'envios',
    title: 'Envíos a toda la ciudad',
    subtitle: 'Mandá y recibí encomiendas fácil y rápido',
    Icon: Package,
    gradient: 'linear-gradient(135deg, #0F766E 0%, #044A43 100%)',
    subtitleColor: 'rgba(255,255,255,0.92)',
  },
];

const DIAGONAL_TEXTURE = 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 12px)';

// ── Carrusel de banners ──────────────────────────────────────────────────────
function HubBannerCarousel() {
  const [active, setActive] = useState(0);
  const timerRef = useRef(null);

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive(a => (a + 1) % HUB_BANNERS.length);
    }, 4500);
  }, []);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  const handleDotClick = (i) => {
    setActive(i);
    startTimer();
  };

  const { Icon, gradient, title, subtitle, subtitleColor } = HUB_BANNERS[active];

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Banner */}
      <div style={{
        position: 'relative', height: 150, borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(13,148,136,0.20)',
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
            style={{
              position: 'absolute', inset: 0,
              background: gradient,
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              padding: '0 20px 20px',
            }}
          >
            {/* Textura diagonal */}
            <div aria-hidden style={{
              position: 'absolute', inset: 0,
              background: DIAGONAL_TEXTURE,
              pointerEvents: 'none',
            }} />

            {/* Ícono decorativo */}
            <Icon
              size={32}
              color="rgba(255,255,255,0.40)"
              strokeWidth={1.8}
              style={{ position: 'absolute', top: 18, right: 18 }}
            />

            {/* Texto */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 style={{
                color: '#fff', fontWeight: 800, fontSize: 17,
                letterSpacing: '-0.02em', lineHeight: 1.2,
                margin: '0 0 5px',
              }}>
                {title}
              </h3>
              <p style={{
                color: subtitleColor,
                fontSize: 12, fontWeight: 600,
                margin: 0, lineHeight: 1.5,
              }}>
                {subtitle}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots — restyled para fondo claro */}
      <div style={{
        display: 'flex', justifyContent: 'center',
        alignItems: 'center', gap: 6, marginTop: 10,
      }}>
        {HUB_BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => handleDotClick(i)}
            aria-label={`Banner ${i + 1}`}
            style={{
              width: i === active ? 18 : 6,
              height: 6,
              borderRadius: 999,
              background: i === active ? KYVRA.teal : KYVRA.border,
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'width 0.3s ease, background 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Cards de servicios (datos sin cambios + icono asignado) ─────────────────
const CARDS = [
  {
    id: 'delivery',
    title: 'Delivery',
    subtitle: 'Rotiserías, empanadas y más',
    image: 'https://hvmdumuedqfoifgayleh.supabase.co/storage/v1/object/public/IMAGES/ChatGPT%20Image%2012%20may%202026,%2019_14_30.png',
    to: '/delivery',
    geoRestricted: true,
    Icon: UtensilsCrossed,
  },
  {
    id: 'turnos',
    title: 'Turnos',
    subtitle: 'Peluquerías, talleres y más',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
    to: '/turnos',
    geoRestricted: true,
    Icon: CalendarDays,
  },
  {
    id: 'encomiendas',
    title: 'Encomiendas a Río Cuarto',
    subtitle: 'Servicio lunes a viernes',
    image: 'https://hvmdumuedqfoifgayleh.supabase.co/storage/v1/object/public/IMAGES/ChatGPT%20Image%2012%20may%202026,%2021_25_26.png',
    to: '/encomiendas',
    geoRestricted: false,
    Icon: Package,
  },
  {
    id: 'remises',
    title: 'Remises',
    subtitle: 'Viajes en la ciudad y zona',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80',
    to: '/remises',
    geoRestricted: true,
    Icon: Car,
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 22 } },
};

// ── Componente principal ─────────────────────────────────────────────────────
export default function Hub() {
  const navigate  = useNavigate();
  const { geoState } = useGeo();
  const { profile } = useAuth();

  const outZone   = geoState === 'outZone';
  const rawNombre = profile?.nombre?.trim();
  const nombre    = rawNombre
    ? rawNombre.charAt(0).toUpperCase() + rawNombre.slice(1)
    : null;

  // ── Header compartido ──────────────────────────────────────────────────────
  const Header = () => (
    <header style={{
      position: 'sticky', top: 0, zIndex: 40,
      background: KYVRA.white,
      borderBottom: `1px solid ${KYVRA.border}`,
      paddingTop: 'env(safe-area-inset-top, 0px)',
    }}>
      <div style={{
        height: 68,
        display: 'flex', alignItems: 'center',
        padding: '0 20px',
        gap: 10,
      }}>
        {/* Wordmark */}
        <span style={{
          color: KYVRA.teal, fontWeight: 900, fontSize: 20,
          letterSpacing: '-0.04em', lineHeight: 1,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          Kyvra
        </span>

        {/* Separador */}
        <div style={{ width: 1, height: 14, background: KYVRA.border, flexShrink: 0 }} />

        {/* Ubicación */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <MapPin size={13} color={KYVRA.textSec} strokeWidth={2} />
          <span style={{
            color: KYVRA.textSec, fontSize: 12, fontWeight: 500,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            Vicuña Mackenna
          </span>
        </div>
      </div>
    </header>
  );

  // ── GPS denegado ───────────────────────────────────────────────────────────
  if (geoState === 'denied') {
    return (
      <div style={{
        minHeight: '100dvh',
        background: KYVRA.bg,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <Header />

        <div style={{
          padding: '40px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              width: '100%', maxWidth: 380,
              background: KYVRA.white,
              border: `1px solid ${KYVRA.border}`,
              borderRadius: 24,
              padding: '32px 24px',
              textAlign: 'center',
              boxShadow: '0 4px 24px rgba(15,23,42,0.08)',
            }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: KYVRA.tealBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Navigation size={28} color={KYVRA.teal} strokeWidth={1.8} />
            </div>

            <h2 style={{
              color: KYVRA.navy, fontWeight: 900, fontSize: 20,
              margin: '0 0 10px', letterSpacing: '-0.02em',
            }}>
              Ubicación requerida
            </h2>
            <p style={{
              color: KYVRA.textSec, fontSize: 14, lineHeight: 1.6,
              margin: '0 0 20px',
            }}>
              Para usar Delivery y Turnos necesitamos acceso a tu ubicación. Habilitá el GPS en la configuración de tu navegador y recargá la página.
            </p>

            <div style={{
              background: '#F0FDFA',
              border: '1px solid #99F6E4',
              borderRadius: 12, padding: '12px 14px',
              marginBottom: 20,
            }}>
              <p style={{
                color: KYVRA.navy, fontSize: 13, fontWeight: 600, margin: 0,
              }}>
                También podés usar Encomiendas desde cualquier lugar sin necesidad de ubicación
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/encomiendas')}
              style={{
                width: '100%', background: KYVRA.teal, color: KYVRA.white,
                border: 'none', borderRadius: 14, padding: '14px 20px',
                fontSize: 15, fontWeight: 800, cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 4px 18px rgba(13,148,136,0.30)',
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

  // ── Hub normal (inZone, loading, outZone) ──────────────────────────────────
  return (
    <div style={{
      minHeight: '100dvh',
      background: KYVRA.bg,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <Header />

      {/* Área desplazable */}
      <div id="hub-scroll" style={{ overflowY: 'auto', paddingBottom: 'calc(130px + env(safe-area-inset-bottom, 0px))' }}>

        {/* Saludo */}
        <div style={{ padding: '24px 20px 20px' }}>
          {nombre && (
            <p style={{
              color: KYVRA.textSec, fontSize: 14, fontWeight: 600,
              margin: '0 0 4px', lineHeight: 1,
            }}>
              Hola, {nombre} 👋
            </p>
          )}
          <h1 style={{
            color: KYVRA.navy, fontWeight: 900, fontSize: 24,
            letterSpacing: '-0.03em', lineHeight: 1.2,
            margin: 0,
          }}>
            ¿Qué necesitás hacer hoy?
          </h1>
        </div>

        {/* Carrusel */}
        <div style={{ padding: '0 20px' }}>
          <HubBannerCarousel />
        </div>

        {/* Aviso zona geográfica */}
        {outZone && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              margin: '0 20px 16px',
              background: '#F0FDFA',
              border: '1px solid #99F6E4',
              borderRadius: 14, padding: '12px 14px',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}
          >
            <MapPin size={16} color={KYVRA.teal} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{
              color: KYVRA.navy, fontSize: 13, fontWeight: 600,
              lineHeight: 1.55, margin: 0,
            }}>
              Kyvra Delivery y Turnos están disponibles solo en Vicuña Mackenna y alrededores. Podés usar el módulo de Encomiendas desde cualquier lugar.
            </p>
          </motion.div>
        )}

        {/* Etiqueta de sección */}
        <div style={{ padding: '0 20px 12px' }}>
          <p style={{
            color: KYVRA.textMuted, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0,
          }}>
            Servicios
          </p>
        </div>

        {/* Grilla 2×2 de servicios */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 12,
            padding: '0 20px 28px',
          }}
        >
          {CARDS.map(card => {
            const locked = outZone && card.geoRestricted;
            const { Icon } = card;

            return (
              <motion.div
                key={card.id}
                variants={cardVariants}
                whileTap={locked ? undefined : { scale: 0.97 }}
                whileHover={locked ? undefined : { scale: 1.015, y: -2 }}
                transition={{ type: 'spring', stiffness: 350, damping: 24 }}
                onClick={locked ? undefined : () => navigate(card.to)}
                style={{
                  position: 'relative',
                  background: KYVRA.white,
                  borderRadius: 20,
                  overflow: 'hidden',
                  cursor: locked ? 'default' : 'pointer',
                  boxShadow: '0 2px 16px rgba(15,23,42,0.07)',
                  border: `1px solid ${KYVRA.border}`,
                  opacity: locked ? 0.60 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Miniatura de imagen */}
                <div style={{ height: 68, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                  <img
                    src={card.image}
                    alt=""
                    aria-hidden
                    style={{
                      width: '100%', height: '100%',
                      objectFit: 'cover', display: 'block',
                    }}
                  />
                  {/* Degradado suave hacia el blanco de la tarjeta */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: 28,
                    background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.75))',
                    pointerEvents: 'none',
                  }} />
                </div>

                {/* Contenido de la tarjeta */}
                <div style={{
                  padding: '10px 12px 14px',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}>
                  {/* Ícono y flecha en la misma fila */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 9,
                      background: KYVRA.tealBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={16} color={KYVRA.teal} strokeWidth={1.9} />
                    </div>
                    {!locked && (
                      <ChevronRight size={14} color={KYVRA.teal} strokeWidth={2.5} />
                    )}
                  </div>

                  {/* Título y subtítulo */}
                  <div>
                    <p style={{
                      color: KYVRA.navy, fontWeight: 800, fontSize: 13,
                      lineHeight: 1.25, margin: '0 0 3px',
                    }}>
                      {card.title}
                    </p>
                    <p style={{
                      color: KYVRA.textSec, fontSize: 11, fontWeight: 500,
                      margin: 0, lineHeight: 1.4,
                    }}>
                      {card.subtitle}
                    </p>
                  </div>
                </div>

                {/* Overlay bloqueado */}
                {locked && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(248,250,252,0.82)',
                    backdropFilter: 'blur(1px)',
                    WebkitBackdropFilter: 'blur(1px)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 5, zIndex: 5,
                  }}>
                    <Lock size={18} color={KYVRA.textSec} strokeWidth={2} />
                    <span style={{
                      color: KYVRA.textSec, fontSize: 10, fontWeight: 800,
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                      textAlign: 'center', padding: '0 8px',
                    }}>
                      Solo en Vicuña Mackenna
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

      </div>

      <BottomNav />
    </div>
  );
}
