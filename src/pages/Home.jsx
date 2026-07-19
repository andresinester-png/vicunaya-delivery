import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, SlidersHorizontal, ChevronDown, ChevronRight,
  Star, ShoppingCart, MapPin, Clock, LayoutGrid, Check,
  Utensils, Sandwich, Pizza, GlassWater, Beef, CakeSlice,
} from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { isRestaurantOpen } from '../lib/restaurantUtils.js';
import useCartStore from '../store/cartStore.js';
import { KYVRA } from '../lib/theme.js';

// ── Design tokens ─────────────────────────────────────────────────────────────
const SHADOW = {
  card:    '0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.07)',
  banner:  '0 4px 12px rgba(0,0,0,0.08), 0 12px 36px rgba(0,0,0,0.14)',
  fab:     '0 4px 12px rgba(13,148,136,0.30), 0 10px 28px rgba(13,148,136,0.38)',
  popover: '0 4px 16px rgba(0,0,0,0.06), 0 16px 48px rgba(0,0,0,0.10)',
  chip:    '0 2px 8px rgba(13,148,136,0.22)',
  header:  '0 4px 20px rgba(0,0,0,0.08)',
};

// ── Data ──────────────────────────────────────────────────────────────────────
const CATEGORY_TILES = [
  { label: 'Todo',        filter: '',           Icon: LayoutGrid },
  { label: 'Empanadas',   filter: 'Empanadas',  Icon: Sandwich   },
  { label: 'Pizza',       filter: 'Pizza',      Icon: Pizza      },
  { label: 'Bebidas',     filter: 'Bebidas',    Icon: GlassWater },
  { label: 'Lomitos',     filter: 'Lomito',     Icon: Beef       },
  { label: 'Pastelerías', filter: 'Pastelería', Icon: CakeSlice  },
];

const SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevancia'       },
  { id: 'rating',    label: 'Mejor puntuación' },
  { id: 'time',      label: 'Menor tiempo'     },
  { id: 'delivery',  label: 'Menor envío'      },
];

const ALL_CATS = ['Rotisería', 'Pizza', 'Empanadas', 'Parrilla', 'Sushi', 'Vegano', 'Bebidas'];

const DEMO = [
  { id: 'd1', name: 'La Rotisería de Don Carlos', category: ['Rotisería'], rating: 4.8, delivery_time: 25, delivery_price: 350,  image_url: null },
  { id: 'd2', name: 'Rotisería Los Hermanos',     category: ['Rotisería'], rating: 4.6, delivery_time: 35, delivery_price: 400,  image_url: null },
  { id: 'd3', name: 'El Buen Gusto',              category: ['Empanadas'], rating: 4.9, delivery_time: 30, delivery_price: 0,    image_url: null },
];

const PROMO_BANNERS = [
  {
    id: 'sumate',
    title: 'Sumate a Kyvra',
    subtitle: 'Registrá tu negocio y llegá a toda la ciudad',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&auto=format&fit=crop',
    overlay: 'linear-gradient(135deg, rgba(13,148,136,0.92) 0%, rgba(6,95,84,0.55) 60%, transparent 100%)',
    to: '/anunciate',
  },
  {
    id: 'pedi',
    title: 'Pedí desde donde estés',
    subtitle: 'Comida, turnos y encomiendas en un solo lugar',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop',
    overlay: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.50) 60%, transparent 100%)',
    to: '/delivery',
  },
  {
    id: 'envios',
    title: 'Envíos a toda la ciudad',
    subtitle: 'Mandá y recibí encomiendas fácil y rápido',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop',
    overlay: 'linear-gradient(135deg, rgba(13,148,136,0.90) 0%, rgba(6,95,84,0.55) 60%, transparent 100%)',
    to: '/encomiendas',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
};

// ── Promo carousel ────────────────────────────────────────────────────────────
function PromoBanner({ navigate }) {
  const [active, setActive] = useState(0);
  const timerRef            = useRef(null);
  const pauseRef            = useRef(false);

  const goTo = useCallback((idx) => {
    setActive(idx);
    pauseRef.current = true;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { pauseRef.current = false; }, 6000);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (!pauseRef.current) setActive(i => (i + 1) % PROMO_BANNERS.length);
    }, 4500);
    return () => { clearInterval(id); clearTimeout(timerRef.current); };
  }, []);

  const banner = PROMO_BANNERS[active];

  return (
    <div>
      <motion.div
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        style={{
          position: 'relative', height: 172, borderRadius: 22, overflow: 'hidden',
          cursor: 'pointer', boxShadow: SHADOW.banner,
        }}
        onClick={() => navigate(banner.to)}
      >
        {/* Background image */}
        <img
          src={banner.image}
          alt={banner.title}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
          }}
        />

        {/* Directional gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: banner.overlay }} />

        {/* Bottom scrim for text legibility */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.42) 0%, transparent 55%)',
        }} />

        {/* Content */}
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'absolute', inset: 0,
              padding: '0 22px 22px',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            }}
          >
            {/* Eyebrow chip */}
            <span style={{
              display: 'inline-flex', alignSelf: 'flex-start',
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.28)',
              color: '#fff', padding: '3px 10px', borderRadius: 99,
              fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
              marginBottom: 8,
            }}>
              KYVRA
            </span>
            <h3 style={{
              color: '#fff', fontSize: 19, fontWeight: 900,
              letterSpacing: '-0.025em', lineHeight: 1.18, margin: '0 0 5px',
              textShadow: '0 1px 6px rgba(0,0,0,0.25)',
            }}>
              {banner.title}
            </h3>
            <p style={{
              color: 'rgba(255,255,255,0.88)', fontSize: 13,
              fontWeight: 600, margin: 0, lineHeight: 1.5,
              textShadow: '0 1px 4px rgba(0,0,0,0.20)',
            }}>
              {banner.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Arrow CTA — bottom right */}
        <div style={{
          position: 'absolute', bottom: 20, right: 20,
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(255,255,255,0.22)',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ChevronRight size={15} color="#fff" strokeWidth={2.5} />
        </div>
      </motion.div>

      {/* Dot indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, paddingTop: 12 }}>
        {PROMO_BANNERS.map((b, i) => (
          <motion.button
            key={b.id}
            onClick={() => goTo(i)}
            aria-label={`Banner ${i + 1}`}
            animate={{ width: i === active ? 20 : 5, background: i === active ? KYVRA.teal : KYVRA.border }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              height: 5, borderRadius: 99,
              border: 'none', padding: 0, cursor: 'pointer',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Restaurant card ───────────────────────────────────────────────────────────
function RestaurantCard({ r }) {
  const isOpen     = isRestaurantOpen(r);
  const primaryCat = Array.isArray(r.category) ? r.category[0] : (r.category ?? '');

  return (
    <motion.div
      variants={cardVariants}
      whileTap={{ scale: 0.982 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
    >
      <Link
        to={`/restaurant/${r.id}`}
        style={{
          display: 'block', textDecoration: 'none',
          background: KYVRA.white, borderRadius: 22,
          border: `1px solid ${KYVRA.border}`,
          boxShadow: SHADOW.card,
          overflow: 'hidden',
        }}
      >
        {/* Cover image */}
        <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
          {r.image_url ? (
            <img
              src={r.image_url} alt={r.name} loading="lazy"
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover',
                objectPosition: r.cover_position ?? 'center',
                filter: isOpen ? 'none' : 'grayscale(35%) brightness(0.85)',
                transition: 'filter 0.3s',
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: isOpen
                ? `linear-gradient(145deg, ${KYVRA.teal} 0%, ${KYVRA.tealDark} 100%)`
                : `linear-gradient(145deg, #94A3B8 0%, #64748B 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.3s',
            }}>
              <Utensils size={52} strokeWidth={1} color="rgba(255,255,255,0.38)" />
            </div>
          )}

          {/* Bottom scrim for overlay contrast */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.22) 0%, transparent 50%)',
            pointerEvents: 'none',
          }} />

          {/* Open/closed badge — top left */}
          <span style={{
            position: 'absolute', top: 11, left: 11,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: isOpen ? 'rgba(5,150,105,0.94)' : 'rgba(15,23,42,0.72)',
            backdropFilter: 'blur(6px)',
            color: '#fff', padding: '4px 10px', borderRadius: 99,
            fontSize: 10, fontWeight: 800, letterSpacing: '0.04em',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: isOpen ? '#6EE7B7' : '#94A3B8',
              flexShrink: 0,
            }} />
            {isOpen ? 'ABIERTO' : 'CERRADO'}
          </span>

          {/* Category badge — top right */}
          {primaryCat && (
            <span style={{
              position: 'absolute', top: 11, right: 11,
              background: 'rgba(255,255,255,0.94)',
              backdropFilter: 'blur(6px)',
              padding: '4px 10px', borderRadius: 99,
              fontSize: 10, fontWeight: 700, color: KYVRA.navy,
              boxShadow: '0 1px 6px rgba(0,0,0,0.12)',
            }}>
              {primaryCat}
            </span>
          )}

          {/* Rating pill — bottom right overlay */}
          {r.rating != null && (
            <span style={{
              position: 'absolute', bottom: 10, right: 11,
              display: 'inline-flex', alignItems: 'center', gap: 3,
              background: 'rgba(0,0,0,0.54)',
              backdropFilter: 'blur(6px)',
              color: '#fff', padding: '3px 8px', borderRadius: 99,
              fontSize: 11, fontWeight: 800,
              boxShadow: '0 1px 4px rgba(0,0,0,0.20)',
            }}>
              <Star size={10} fill="#FBBF24" color="#FBBF24" strokeWidth={0} />
              {r.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Content */}
        <div style={{
          padding: '14px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontWeight: 800, fontSize: 17, color: KYVRA.navy,
              marginBottom: 6, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}>
              {r.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              {r.delivery_time != null && (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 12, color: KYVRA.textSec, fontWeight: 500,
                }}>
                  <Clock size={11} color={KYVRA.textMuted} strokeWidth={2} />
                  {r.delivery_time}–{r.delivery_time + 10} min
                </span>
              )}
              {r.delivery_price != null && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  fontSize: 12,
                  fontWeight: r.delivery_price === 0 ? 700 : 500,
                  color: r.delivery_price === 0 ? '#059669' : KYVRA.textSec,
                  background: r.delivery_price === 0 ? 'rgba(5,150,105,0.08)' : 'transparent',
                  padding: r.delivery_price === 0 ? '2px 7px' : '0',
                  borderRadius: r.delivery_price === 0 ? 99 : 0,
                }}>
                  {r.delivery_price === 0 ? '✦ Envío gratis' : `Envío $${r.delivery_price.toLocaleString('es-AR')}`}
                </span>
              )}
            </div>
          </div>

          {/* Arrow — filled teal when open */}
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: isOpen ? KYVRA.teal : KYVRA.bg,
            border: `1px solid ${isOpen ? KYVRA.teal : KYVRA.border}`,
            boxShadow: isOpen ? SHADOW.chip : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginLeft: 12,
            transition: 'background 0.25s, border-color 0.25s, box-shadow 0.25s',
          }}>
            <ChevronRight size={15} color={isOpen ? '#fff' : KYVRA.textMuted} strokeWidth={2.4} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse" style={{
      background: KYVRA.white, borderRadius: 22,
      border: `1px solid ${KYVRA.border}`,
      boxShadow: SHADOW.card, overflow: 'hidden',
    }}>
      <div style={{ height: 180, background: '#EEF2F7' }} />
      <div style={{ padding: '14px 16px' }}>
        <div style={{ height: 15, width: '52%', borderRadius: 7, background: '#EEF2F7', marginBottom: 8 }} />
        <div style={{ height: 11, width: '72%', borderRadius: 7, background: '#EEF2F7' }} />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate  = useNavigate();
  const cartCount = useCartStore(s => s.count());

  const [restaurants, setRestaurants]   = useState(DEMO);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [catFilter, setCatFilter]       = useState('');
  const [sortBy, setSortBy]             = useState('relevance');
  const [sortOpen, setSortOpen]         = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [headerElevated, setHeaderElevated] = useState(false);

  // Scroll elevation for sticky sub-header
  useEffect(() => {
    const el = document.getElementById('main-scroll');
    if (!el) return;
    const onScroll = () => setHeaderElevated(el.scrollTop > 8);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    supabase.from('restaurants').select('*').eq('is_active', true).order('name').then(({ data, error }) => {
      if (!error && data?.length) setRestaurants(data);
      setLoading(false);
    });
  }, []);

  const mergedChips = useMemo(() => {
    const tileFilters = new Set(CATEGORY_TILES.filter(c => c.filter).map(c => c.filter.toLowerCase()));
    const extra = restaurants
      .flatMap(r => Array.isArray(r.category) ? r.category : r.category ? [r.category] : [])
      .filter((c, i, arr) => arr.indexOf(c) === i)
      .filter(c => ALL_CATS.includes(c) && !tileFilters.has(c.toLowerCase()))
      .map(c => ({ label: c, filter: c, Icon: null }));
    return [...CATEGORY_TILES, ...extra];
  }, [restaurants]);

  const filtered = useMemo(() => {
    let list = restaurants;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (Array.isArray(r.category) ? r.category.join(' ') : r.category ?? '').toLowerCase().includes(q) ||
        (r.tags ?? '').toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q)
      );
    }
    if (catFilter) {
      list = list.filter(r => {
        const cats = Array.isArray(r.category) ? r.category : r.category ? [r.category] : [];
        return cats.some(c => c.toLowerCase().includes(catFilter.toLowerCase()));
      });
    }
    if (sortBy === 'rating')   list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sortBy === 'time')     list = [...list].sort((a, b) => (a.delivery_time ?? 999) - (b.delivery_time ?? 999));
    if (sortBy === 'delivery') list = [...list].sort((a, b) => (a.delivery_price ?? 999) - (b.delivery_price ?? 999));
    return list;
  }, [restaurants, search, catFilter, sortBy]);

  const sectionLabel = catFilter
    ? `${catFilter}s cerca de vos`
    : search.trim()
    ? `Resultados para "${search.trim()}"`
    : 'Restaurantes cerca de vos';

  return (
    <div
      style={{ background: KYVRA.bg, minHeight: '100%' }}
      onClick={() => sortOpen && setSortOpen(false)}
    >

      {/* ── Sticky gradient header ──────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(160deg, #061118 0%, #0A1E2A 28%, #0D3A35 55%, #0F172A 100%)',
        padding: `calc(env(safe-area-inset-top, 0px) + 20px) 20px 20px`,
        position: 'sticky', top: 0, zIndex: 30,
        boxShadow: headerElevated ? '0 4px 28px rgba(0,0,0,0.38)' : 'none',
        transition: 'box-shadow 0.3s ease',
      }}>
        {/* Eyebrow location chip */}
        <div style={{ marginBottom: 10 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(13,148,136,0.18)', borderRadius: 99,
            padding: '4px 12px', border: '1px solid rgba(13,148,136,0.32)',
          }}>
            <MapPin size={11} color="#5EEAD4" strokeWidth={2.5} />
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#5EEAD4',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              DELIVERY · Vicuña Mackenna
            </span>
          </div>
        </div>

        {/* Heading */}
        <h1 style={{
          color: '#fff', fontSize: 26, fontWeight: 900,
          margin: '0 0 4px', letterSpacing: '-0.03em', lineHeight: 1.15,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          ¿Qué se te antoja hoy?
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.48)', fontSize: 13, margin: '0 0 16px',
          lineHeight: 1.55, fontWeight: 500,
        }}>
          Pedí comida de los mejores locales de la ciudad.
        </p>

        {/* Search — white input on dark header */}
        <div style={{ position: 'relative' }}>
          <Search
            size={16} color={searchFocused ? KYVRA.teal : '#94A3B8'}
            style={{
              position: 'absolute', left: 14, top: '50%',
              transform: 'translateY(-50%)', pointerEvents: 'none',
              transition: 'color 0.2s',
            }}
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Buscar comidas, restaurantes..."
            style={{
              width: '100%', height: 50,
              background: '#fff',
              border: `1.5px solid ${searchFocused || search ? KYVRA.teal : 'transparent'}`,
              borderRadius: 16, padding: '0 44px 0 42px',
              fontSize: 14, color: KYVRA.navy, outline: 'none',
              boxSizing: 'border-box',
              boxShadow: searchFocused
                ? '0 0 0 3px rgba(13,148,136,0.18), 0 4px 20px rgba(0,0,0,0.22)'
                : '0 4px 20px rgba(0,0,0,0.16)',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 500,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: '#E2E8F0', border: 'none', cursor: 'pointer',
                width: 22, height: 22, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={12} color={KYVRA.textSec} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* ── Category chip row ─────────────────────────────────────────── */}
      <div style={{
        background: KYVRA.white,
        overflowX: 'auto', scrollbarWidth: 'none',
        display: 'flex', gap: 8,
        padding: '14px 20px',
        borderBottom: `1px solid ${KYVRA.border}`,
      }}>
        {mergedChips.map(chip => {
          const active   = catFilter === chip.filter;
          const ChipIcon = chip.Icon;
          return (
            <motion.button
              key={chip.label}
              whileTap={{ scale: 0.93 }}
              onClick={() => setCatFilter(active && chip.filter !== '' ? '' : chip.filter)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '9px 16px', minHeight: 38, borderRadius: 99, flexShrink: 0,
                background: active ? KYVRA.teal : KYVRA.white,
                color: active ? KYVRA.white : KYVRA.textSec,
                border: `1.5px solid ${active ? KYVRA.teal : KYVRA.border}`,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: active ? 700 : 500,
                fontSize: 13, cursor: 'pointer',
                boxShadow: active ? SHADOW.chip : 'none',
                transition: 'all 0.18s ease',
              }}
            >
              {ChipIcon && <ChipIcon size={13} strokeWidth={active ? 2.5 : 2} />}
              {chip.label}
            </motion.button>
          );
        })}
      </div>

      {/* ── Page content ─────────────────────────────────────────────── */}
      <div style={{ padding: '20px 20px 0' }}>

        {/* Promo banner */}
        <PromoBanner navigate={navigate} />

        {/* Section header + sort */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 24, marginBottom: 14,
        }}>
          <span style={{
            fontWeight: 800, fontSize: 16, color: KYVRA.navy,
            letterSpacing: '-0.015em',
          }}>
            {sectionLabel}
          </span>

          <div style={{ position: 'relative', flexShrink: 0 }}>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={e => { e.stopPropagation(); setSortOpen(v => !v); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: sortBy !== 'relevance' ? KYVRA.tealBg : KYVRA.white,
                border: `1.5px solid ${sortBy !== 'relevance' ? KYVRA.teal : KYVRA.border}`,
                padding: '8px 13px', borderRadius: 99,
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12.5,
                fontWeight: 600,
                color: sortBy !== 'relevance' ? KYVRA.teal : KYVRA.textSec,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              <SlidersHorizontal size={12} strokeWidth={2.2} />
              {SORT_OPTIONS.find(o => o.id === sortBy)?.label ?? 'Relevancia'}
              <motion.span
                animate={{ rotate: sortOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex' }}
              >
                <ChevronDown size={11} strokeWidth={2.6} />
              </motion.span>
            </motion.button>

            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50,
                    background: KYVRA.white, borderRadius: 16,
                    boxShadow: SHADOW.popover,
                    border: `1px solid ${KYVRA.border}`,
                    minWidth: 190, overflow: 'hidden',
                  }}
                >
                  {SORT_OPTIONS.map((opt, idx) => (
                    <button
                      key={opt.id}
                      onClick={() => { setSortBy(opt.id); setSortOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', padding: '12px 16px',
                        background: sortBy === opt.id ? KYVRA.tealBg : KYVRA.white,
                        color: sortBy === opt.id ? KYVRA.teal : '#374151',
                        border: 'none',
                        borderBottom: idx < SORT_OPTIONS.length - 1 ? `1px solid ${KYVRA.bg}` : 'none',
                        textAlign: 'left',
                        fontSize: 13.5, fontWeight: sortBy === opt.id ? 700 : 500,
                        cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      {opt.label}
                      {sortBy === opt.id && <Check size={13} color={KYVRA.teal} strokeWidth={2.8} />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Restaurant list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 28 }}>
            {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '72px 0 28px', color: KYVRA.textMuted,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: KYVRA.bg, border: `1px solid ${KYVRA.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 14,
            }}>
              <Utensils size={32} strokeWidth={1.2} color={KYVRA.textMuted} />
            </div>
            <p style={{ margin: '0 0 4px', color: KYVRA.navy, fontWeight: 700, fontSize: 15 }}>
              Sin resultados
            </p>
            <p style={{ margin: '0 0 14px', color: KYVRA.textSec, fontSize: 13, textAlign: 'center' }}>
              Intentá con otro término o categoría
            </p>
            {(search || catFilter) && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => { setSearch(''); setCatFilter(''); setSortBy('relevance'); }}
                style={{
                  color: KYVRA.white, fontWeight: 700, fontSize: 13.5,
                  background: KYVRA.teal, border: 'none', cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  padding: '10px 20px', borderRadius: 99,
                  boxShadow: SHADOW.chip,
                }}
              >
                Limpiar filtros
              </motion.button>
            )}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 28 }}
          >
            {filtered.map(r => <RestaurantCard key={r.id} r={r} />)}
          </motion.div>
        )}
      </div>

      {/* ── FAB carrito ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            whileTap={{ scale: 0.88 }}
            onClick={() => navigate('/carrito')}
            style={{
              position: 'fixed', right: 20, bottom: 84, zIndex: 40,
              width: 54, height: 54, borderRadius: '50%',
              background: KYVRA.teal,
              border: '2.5px solid #fff',
              boxShadow: SHADOW.fab,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ShoppingCart size={22} color="#fff" strokeWidth={2.2} />
            <motion.span
              key={cartCount}
              initial={{ scale: 1.4 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              style={{
                position: 'absolute', top: -3, right: -3,
                minWidth: 20, height: 20, borderRadius: 99,
                background: KYVRA.navy, color: '#fff',
                fontSize: 10, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2.5px solid #fff',
                padding: '0 4px',
              }}
            >
              {cartCount}
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
