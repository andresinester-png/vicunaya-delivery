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

const FF = "'Plus Jakarta Sans', sans-serif";

// ── Banners promocionales ────────────────────────────────────────────────────
const HUB_BANNERS = [
  {
    id: 'sumate',
    title: 'Sumate a Kyvra',
    subtitle: 'Registrá tu negocio y llegá a toda Vicuña Mackenna',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&auto=format&fit=crop',
    overlay: 'linear-gradient(135deg, rgba(13,148,136,0.92) 0%, rgba(6,95,84,0.55) 60%, transparent 100%)',
    to: '/anunciate',
    Icon: Store,
  },
  {
    id: 'pedi',
    title: 'Pedí desde donde estés',
    subtitle: 'Comida, turnos y encomiendas en un solo lugar',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop',
    overlay: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.50) 60%, transparent 100%)',
    to: '/delivery',
    Icon: Smartphone,
  },
  {
    id: 'envios',
    title: 'Envíos a toda la ciudad',
    subtitle: 'Mandá y recibí encomiendas fácil y rápido',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop',
    overlay: 'linear-gradient(135deg, rgba(13,148,136,0.90) 0%, rgba(6,95,84,0.55) 60%, transparent 100%)',
    to: '/encomiendas',
    Icon: Package,
  },
];

// ── Cards de servicios ───────────────────────────────────────────────────────
const CARDS = [
  {
    id: 'delivery',
    title: 'Delivery',
    subtitle: 'Rotiserías, empanadas y más',
    image: 'https://hvmdumuedqfoifgayleh.supabase.co/storage/v1/object/public/IMAGES/ChatGPT%20Image%2012%20may%202026,%2019_14_30.png',
    to: '/delivery',
    geoRestricted: true,
    Icon: UtensilsCrossed,
    overlay: 'linear-gradient(165deg, rgba(13,148,136,0.22) 0%, rgba(13,148,136,0.06) 38%, rgba(6,17,24,0.90) 100%)',
  },
  {
    id: 'turnos',
    title: 'Turnos',
    subtitle: 'Peluquerías, talleres y más',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
    to: '/turnos',
    geoRestricted: true,
    Icon: CalendarDays,
    overlay: 'linear-gradient(165deg, rgba(15,23,42,0.12) 0%, rgba(15,23,42,0.08) 42%, rgba(15,23,42,0.93) 100%)',
  },
  {
    id: 'encomiendas',
    title: 'Encomiendas a Río Cuarto',
    subtitle: 'Servicio lunes a viernes',
    image: 'https://hvmdumuedqfoifgayleh.supabase.co/storage/v1/object/public/IMAGES/ChatGPT%20Image%2012%20may%202026,%2021_25_26.png',
    to: '/encomiendas',
    geoRestricted: false,
    Icon: Package,
    overlay: 'linear-gradient(165deg, rgba(6,95,84,0.28) 0%, rgba(13,148,136,0.08) 38%, rgba(6,17,24,0.90) 100%)',
  },
  {
    id: 'remises',
    title: 'Remises',
    subtitle: 'Viajes en la ciudad y zona',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80',
    to: '/remises',
    geoRestricted: true,
    Icon: Car,
    overlay: 'linear-gradient(165deg, rgba(30,41,59,0.18) 0%, rgba(30,41,59,0.08) 42%, rgba(15,23,42,0.93) 100%)',
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 22 } },
};

// ── Banner carousel (photo-based) ────────────────────────────────────────────
function HubBannerCarousel({ navigate }) {
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

  const handleDotClick = (i) => { setActive(i); startTimer(); };

  const banner = HUB_BANNERS[active];

  return (
    <div style={{ marginBottom: 24 }}>
      <motion.div
        whileTap={{ scale: 0.985 }}
        onClick={() => navigate(banner.to)}
        style={{
          position: 'relative', height: 172, borderRadius: 22, overflow: 'hidden',
          cursor: 'pointer', boxShadow: '0 4px 24px rgba(0,0,0,0.16)',
        }}
      >
        <img
          src={banner.image} alt={banner.title}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: banner.overlay }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.42) 0%, transparent 55%)' }} />

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            style={{ position: 'absolute', inset: 0, padding: '0 20px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          >
            <span style={{
              display: 'inline-flex', alignSelf: 'flex-start',
              background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.28)',
              color: '#fff', padding: '3px 10px', borderRadius: 99,
              fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
              marginBottom: 8,
            }}>KYVRA</span>
            <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 4px', textShadow: '0 1px 6px rgba(0,0,0,0.25)' }}>
              {banner.title}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: 12, fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
              {banner.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        <div style={{
          position: 'absolute', bottom: 18, right: 18,
          width: 30, height: 30, borderRadius: '50%',
          background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.32)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ChevronRight size={14} color="#fff" strokeWidth={2.5} />
        </div>
      </motion.div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 10 }}>
        {HUB_BANNERS.map((_, i) => (
          <motion.button
            key={i}
            onClick={() => handleDotClick(i)}
            aria-label={`Banner ${i + 1}`}
            animate={{ width: i === active ? 20 : 5, background: i === active ? KYVRA.teal : KYVRA.border }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            style={{ height: 5, borderRadius: 99, border: 'none', padding: 0, cursor: 'pointer' }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Hero gradient (replaces sticky white header) ─────────────────────────────
function GradientHero({ nombre }) {
  return (
    <div style={{
      background: 'linear-gradient(160deg, #061118 0%, #0A1E2A 30%, #0D3A35 55%, #0F172A 100%)',
      position: 'relative',
      overflow: 'hidden',
      paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)',
      paddingBottom: 52,
    }}>
      {/* Ambient teal glow */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)',
          width: 520, height: 420,
          background: 'radial-gradient(ellipse, rgba(13,148,136,0.22) 0%, transparent 65%)',
          filter: 'blur(4px)',
        }} />
      </div>

      <div style={{ padding: '0 20px', position: 'relative', zIndex: 1 }}>
        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <img
            src="/kyvra-app-icon.png"
            alt="Kyvra"
            style={{ width: 38, height: 38, borderRadius: 11, boxShadow: '0 0 20px rgba(13,148,136,0.48), 0 4px 16px rgba(0,0,0,0.40)' }}
          />
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 22, letterSpacing: '-0.04em', fontFamily: FF, lineHeight: 1 }}>
            Kyvra
          </span>
          <div style={{ flex: 1 }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(13,148,136,0.18)', borderRadius: 99,
            padding: '5px 12px', border: '1px solid rgba(13,148,136,0.32)',
          }}>
            <MapPin size={11} color="#5EEAD4" strokeWidth={2.5} />
            <span style={{ color: '#5EEAD4', fontSize: 11, fontWeight: 700, letterSpacing: '-0.01em', fontFamily: FF }}>
              Vicuña Mackenna
            </span>
          </div>
        </div>

        {nombre && (
          <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: 14, fontWeight: 600, margin: '0 0 5px', fontFamily: FF }}>
            Hola, {nombre} 👋
          </p>
        )}
        <h1 style={{
          color: '#fff', fontWeight: 900, fontSize: 27,
          letterSpacing: '-0.03em', lineHeight: 1.18, margin: 0,
          fontFamily: FF,
        }}>
          ¿Qué necesitás hacer hoy?
        </h1>
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function Hub() {
  const navigate    = useNavigate();
  const { geoState } = useGeo();
  const { profile } = useAuth();

  const outZone   = geoState === 'outZone';
  const rawNombre = profile?.nombre?.trim();
  const nombre    = rawNombre
    ? rawNombre.charAt(0).toUpperCase() + rawNombre.slice(1)
    : null;

  // ── GPS denegado ─────────────────────────────────────────────────────────
  if (geoState === 'denied') {
    return (
      <div style={{ minHeight: '100dvh', background: KYVRA.bg, fontFamily: FF }}>
        <GradientHero nombre={nombre} />

        <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              width: '100%', maxWidth: 380,
              background: KYVRA.white,
              border: `1px solid ${KYVRA.border}`,
              borderRadius: 24, padding: '32px 24px',
              textAlign: 'center',
              boxShadow: '0 4px 32px rgba(15,23,42,0.10)',
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
            <h2 style={{ color: KYVRA.navy, fontWeight: 900, fontSize: 20, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
              Ubicación requerida
            </h2>
            <p style={{ color: KYVRA.textSec, fontSize: 14, lineHeight: 1.6, margin: '0 0 20px' }}>
              Para usar Delivery y Turnos necesitamos acceso a tu ubicación. Habilitá el GPS en la configuración de tu navegador y recargá la página.
            </p>
            <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 12, padding: '12px 14px', marginBottom: 20 }}>
              <p style={{ color: KYVRA.navy, fontSize: 13, fontWeight: 600, margin: 0 }}>
                También podés usar Encomiendas desde cualquier lugar sin necesidad de ubicación
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/encomiendas')}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
                color: '#fff', border: 'none', borderRadius: 14, padding: '14px 20px',
                fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: FF,
                boxShadow: '0 6px 20px rgba(13,148,136,0.32)',
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

  // ── Hub normal ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', background: KYVRA.bg, fontFamily: FF }}>

      <div id="hub-scroll" style={{ paddingBottom: 'calc(130px + env(safe-area-inset-bottom, 0px))' }}>

        {/* ── Gradient hero ──────────────────────────────────────────── */}
        <GradientHero nombre={nombre} />

        {/* ── Content surface overlapping the hero ───────────────────── */}
        <div style={{
          background: KYVRA.bg,
          borderRadius: '24px 24px 0 0',
          marginTop: -28,
          paddingTop: 28,
          position: 'relative',
          zIndex: 2,
        }}>

          {/* Out-of-zone notice */}
          {outZone && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                margin: '0 20px 20px',
                background: 'rgba(13,148,136,0.07)',
                border: `1px solid rgba(13,148,136,0.22)`,
                borderRadius: 16, padding: '13px 15px',
                display: 'flex', gap: 11, alignItems: 'flex-start',
              }}
            >
              <MapPin size={15} color={KYVRA.teal} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ color: KYVRA.navy, fontSize: 13, fontWeight: 600, lineHeight: 1.55, margin: 0 }}>
                Kyvra Delivery y Turnos están disponibles solo en Vicuña Mackenna y alrededores. Podés usar el módulo de Encomiendas desde cualquier lugar.
              </p>
            </motion.div>
          )}

          {/* Banner carousel */}
          <div style={{ padding: '0 20px' }}>
            <HubBannerCarousel navigate={navigate} />
          </div>

          {/* Section label */}
          <div style={{ padding: '0 20px 12px' }}>
            <p style={{ color: KYVRA.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
              Servicios
            </p>
          </div>

          {/* ── Service tiles — full-image premium cards ───────────── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
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
                    height: 155,
                    borderRadius: 20,
                    overflow: 'hidden',
                    cursor: locked ? 'default' : 'pointer',
                    boxShadow: locked
                      ? '0 2px 10px rgba(0,0,0,0.08)'
                      : '0 4px 22px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.08)',
                  }}
                >
                  {/* Background image */}
                  <img
                    src={card.image} alt="" aria-hidden
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />

                  {/* Service-specific tinted overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: card.overlay }} />

                  {/* Content */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    padding: '14px 14px 16px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  }}>
                    {/* Glass icon badge */}
                    <div style={{
                      width: 30, height: 30, borderRadius: 9,
                      background: 'rgba(255,255,255,0.18)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.28)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 9,
                    }}>
                      <Icon size={14} color="#fff" strokeWidth={2.2} />
                    </div>

                    <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, margin: '0 0 3px', letterSpacing: '-0.01em', lineHeight: 1.2, fontFamily: FF }}>
                      {card.title}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.70)', fontSize: 11, fontWeight: 500, margin: 0, lineHeight: 1.3, fontFamily: FF }}>
                      {card.subtitle}
                    </p>
                  </div>

                  {/* Arrow glass (top-right) */}
                  {!locked && (
                    <div style={{
                      position: 'absolute', top: 12, right: 12,
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.18)',
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255,255,255,0.28)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <ChevronRight size={14} color="#fff" strokeWidth={2.5} />
                    </div>
                  )}

                  {/* Lock overlay */}
                  {locked && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(15,23,42,0.62)',
                      backdropFilter: 'blur(2px)',
                      WebkitBackdropFilter: 'blur(2px)',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      gap: 6, zIndex: 5,
                    }}>
                      <Lock size={18} color="rgba(255,255,255,0.75)" strokeWidth={2} />
                      <span style={{
                        color: 'rgba(255,255,255,0.65)',
                        fontSize: 10, fontWeight: 800,
                        letterSpacing: '0.05em', textTransform: 'uppercase',
                        textAlign: 'center', padding: '0 12px',
                        fontFamily: FF,
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
      </div>

      <BottomNav />
    </div>
  );
}
