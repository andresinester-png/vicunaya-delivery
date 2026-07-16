import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ChevronRight, Lock, MapPin, Navigation, Store, Smartphone, Package, Bike, CalendarDays, Flame, Car } from 'lucide-react';
import bgImage from '../screen.png';
import BottomNav from '../components/BottomNav.jsx';
import { useGeo } from '../context/GeoContext.jsx';

// ── Banners promocionales ────────────────────────────────────────────────────
const HUB_BANNERS = [
  {
    id: 'sumate',
    title: 'Sumate a Kyvra',
    subtitle: 'Registrá tu negocio y llegá a toda Vicuña Mackenna',
    Icon: Store,
    gradient: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
    subtitleColor: 'rgba(255,255,255,0.80)',
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
    gradient: 'linear-gradient(135deg, #0D9488 0%, #065F54 100%)',
    subtitleColor: 'rgba(255,255,255,0.80)',
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
    <div style={{ marginBottom: 22 }}>
      {/* Banner */}
      <div style={{ position: 'relative', height: 150, borderRadius: 20, overflow: 'hidden' }}>
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

            {/* Ícono arriba a la derecha */}
            <Icon
              size={32}
              color="rgba(255,255,255,0.30)"
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

      {/* Dots indicadores */}
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
              background: i === active ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.35)',
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'width 0.3s ease, background 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Tiles del grid principal (2×2) ──────────────────────────────────────────
const TILES = [
  { id: 'delivery',    label: 'Delivery',  sub: 'Comida y más',         Icon: Bike,        to: '/delivery',    geo: true  },
  { id: 'turnos',      label: 'Turnos',    sub: 'Turnos online',        Icon: CalendarDays, to: '/turnos',      geo: true  },
  { id: 'gas',         label: 'Gas',       sub: 'A domicilio',          Icon: Flame,       to: '/gas',         geo: false },
  { id: 'remises',     label: 'Remises',   sub: 'Viajes en la ciudad',  Icon: Car,         to: '/remises',     geo: true  },
];

// ── Card ancha: Encomiendas ──────────────────────────────────────────────────
const ENCOMIENDAS_CARD = {
  id: 'encomiendas',
  title: 'Encomiendas a Río Cuarto',
  subtitle: 'Servicio lunes a viernes',
  image: 'https://hvmdumuedqfoifgayleh.supabase.co/storage/v1/object/public/IMAGES/ChatGPT%20Image%2012%20may%202026,%2021_25_26.png',
  to: '/encomiendas',
};

const tileVariants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 240, damping: 22 } },
};
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

// ── Fondo parallax ───────────────────────────────────────────────────────────
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

// ── Componente principal ─────────────────────────────────────────────────────
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

  // ── GPS denegado ───────────────────────────────────────────────────────────
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
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 34, letterSpacing: '-0.04em', lineHeight: 1, textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
              Kyvra
            </span>
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
                También podés usar Encomiendas desde cualquier lugar sin necesidad de ubicación
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/encomiendas')}
              style={{
                width: '100%', background: '#0D9488', color: '#fff',
                border: 'none', borderRadius: 16, padding: '14px 20px',
                fontSize: 15, fontWeight: 800, cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 4px 18px rgba(13,148,136,0.45)',
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
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 34, letterSpacing: '-0.04em', lineHeight: 1, textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
            Kyvra
          </span>
          <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 13, fontWeight: 600, margin: '8px 0 0' }}>
            Vicuña Mackenna, Córdoba
          </p>
        </div>

        {/* Título */}
        <h1 style={{
          fontSize: 28, fontWeight: 900, color: '#fff',
          letterSpacing: '-0.03em', lineHeight: 1.1,
          textShadow: '0 2px 12px rgba(0,0,0,0.5)',
          margin: '0 0 18px',
        }}>
          ¿Qué necesitás hoy?
        </h1>

        {/* Carrusel de banners promocionales */}
        <HubBannerCarousel />

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
              Kyvra Delivery y Turnos están disponibles solo en Vicuña Mackenna y alrededores. Podés usar el módulo de Encomiendas desde cualquier lugar.
            </p>
          </motion.div>
        )}

        {/* ── Sección blanca: servicios + cerca de vos ─────────────── */}
        <div style={{
          background: '#F8F9FF',
          borderRadius: '28px 28px 0 0',
          margin: '4px -20px -104px',
          padding: '24px 20px 120px',
        }}>

          {/* Grid 2×2 de tiles */}
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px' }}>
            Servicios
          </p>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}
          >
            {TILES.map(tile => {
              const locked = outZone && tile.geo;
              return (
                <motion.button
                  key={tile.id}
                  variants={tileVariants}
                  whileTap={locked ? undefined : { scale: 0.96 }}
                  onClick={locked ? undefined : () => navigate(tile.to)}
                  style={{
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: 20,
                    padding: '18px 14px 16px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    cursor: locked ? 'default' : 'pointer',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {/* Icon box 56×56 */}
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: locked ? '#F1F5F9' : '#F0FDFA',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <tile.Icon
                      size={26}
                      color={locked ? '#94A3B8' : (tile.id === 'gas' ? '#0D9488' : '#0F172A')}
                      strokeWidth={1.9}
                    />
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 14, color: locked ? '#94A3B8' : '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
                      {tile.label}
                    </p>
                    <p style={{ fontSize: 11, color: '#94A3B8', margin: '3px 0 0', fontWeight: 500 }}>
                      {tile.sub}
                    </p>
                  </div>
                  {/* Lock badge */}
                  {locked && (
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'rgba(0,0,0,0.08)', borderRadius: 999,
                      padding: '2px 4px',
                    }}>
                      <Lock size={10} color="#94A3B8" strokeWidth={2} />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Encomiendas — card ancha */}
          <motion.div
            variants={tileVariants}
            initial="hidden"
            animate="show"
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(ENCOMIENDAS_CARD.to)}
            style={{
              position: 'relative', height: 110, borderRadius: 20,
              overflow: 'hidden', cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
              marginBottom: 28,
            }}
          >
            <img src={ENCOMIENDAS_CARD.image} alt={ENCOMIENDAS_CARD.title}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 100%)',
            }} />
            <div style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.28)',
              borderRadius: 999, width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ChevronRight size={14} color="#fff" strokeWidth={2.5} />
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 18px 16px' }}>
              <h2 style={{ color: '#fff', fontSize: 17, fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 3px', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
                {ENCOMIENDAS_CARD.title}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: 600, margin: 0 }}>
                {ENCOMIENDAS_CARD.subtitle}
              </p>
            </div>
          </motion.div>

          {/* ── Cerca de vos ─────────────────────────────────────────── */}
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px' }}>
            Cerca de vos
          </p>

          {/* Themtham Gas card */}
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 220, damping: 22 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/gas')}
            style={{
              width: '100%', background: '#fff',
              border: '1px solid #E2E8F0',
              borderRadius: 20, overflow: 'hidden',
              display: 'flex', alignItems: 'center',
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              textAlign: 'left', padding: 0,
            }}
          >
            {/* Logo */}
            <div style={{ width: 90, height: 90, flexShrink: 0, overflow: 'hidden', borderRadius: '20px 0 0 20px' }}>
              <img
                src="/themtham-gas.png"
                alt="Themtham Gas"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Info */}
            <div style={{ flex: 1, padding: '14px 14px 14px 16px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
                    Themtham Gas
                  </p>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '3px 0 8px', lineHeight: 1.4 }}>
                    Tubos de gas y agua a domicilio
                  </p>
                  {/* Badge */}
                  <span style={{
                    display: 'inline-block',
                    background: '#F0FDFA', color: '#0D9488',
                    fontSize: 11, fontWeight: 700,
                    borderRadius: 999, padding: '3px 10px',
                    border: '1px solid rgba(13,148,136,0.2)',
                  }}>
                    Gas · Agua
                  </span>
                </div>
                <ChevronRight size={16} color="#CBD5E1" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
              </div>
            </div>
          </motion.button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
