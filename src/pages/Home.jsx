import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, ChevronDown,
  Star, ShoppingCart, MapPin,
  Utensils, Sandwich, Pizza, GlassWater, Beef, CakeSlice,
} from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { isRestaurantOpen } from '../lib/restaurantUtils.js';
import useCartStore from '../store/cartStore.js';

const TEAL      = '#0D9488';
const TEAL_LT   = '#5EEAD4';
const NAVY      = '#0F172A';
const TEXT_MUTED = '#64748B';
const GRAY_FILL = '#F1F5F9';
const CARD_BG   = '#F8FAFC';

const CATEGORY_TILES = [
  { label: 'Todo',        filter: '',           Icon: Utensils   },
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
  { id: 'd1', name: 'La Rotisería de Don Carlos', category: ['Rotisería'], rating: 4.8, delivery_time: 25, delivery_price: 350, image_url: null },
  { id: 'd2', name: 'Rotisería Los Hermanos',     category: ['Rotisería'], rating: 4.6, delivery_time: 35, delivery_price: 400, image_url: null },
  { id: 'd3', name: 'El Buen Gusto',              category: ['Empanadas'], rating: 4.9, delivery_time: 30, delivery_price: 250, image_url: null },
];

const PROMO_BANNERS = [
  {
    id: 'sumate',
    title: 'Sumate a Kyvra',
    subtitle: 'Registrá tu negocio y llegá a toda la ciudad',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&auto=format&fit=crop',
    gradient: 'linear-gradient(to right, rgba(13,148,136,0.85), rgba(13,148,136,0.4))',
    subtitleColor: 'rgba(255,255,255,0.82)',
    to: '/anunciate',
  },
  {
    id: 'pedi',
    title: 'Pedí desde donde estés',
    subtitle: 'Comida, turnos y encomiendas en un solo lugar',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop',
    gradient: 'linear-gradient(to right, rgba(15,23,42,0.9), rgba(15,23,42,0.4))',
    subtitleColor: '#5EEAD4',
    to: '/delivery',
  },
  {
    id: 'envios',
    title: 'Envíos a toda la ciudad',
    subtitle: 'Mandá y recibí encomiendas fácil y rápido',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop',
    gradient: 'linear-gradient(to right, rgba(13,148,136,0.85), rgba(6,95,84,0.6))',
    subtitleColor: 'rgba(255,255,255,0.82)',
    to: '/encomiendas',
  },
];

function PromoBanner({ navigate }) {
  const [active, setActive]  = useState(0);
  const timerRef             = useRef(null);
  const pauseRef             = useRef(false);

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
      <div
        style={{
          position: 'relative', height: 150, borderRadius: 20, overflow: 'hidden',
          cursor: 'pointer',
        }}
        onClick={() => navigate(banner.to)}
      >
        {/* Imagen de fondo */}
        <img
          src={banner.image}
          alt={banner.title}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
          }}
        />

        {/* Degradé encima */}
        <div style={{ position: 'absolute', inset: 0, background: banner.gradient }} />

        {/* Texto animado */}
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.30 }}
            style={{
              position: 'absolute', inset: 0,
              padding: '0 20px 20px',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            }}
          >
            <h3 style={{
              color: '#fff', fontSize: 17, fontWeight: 800,
              letterSpacing: '-0.02em', lineHeight: 1.2,
              margin: '0 0 5px',
            }}>
              {banner.title}
            </h3>
            <p style={{
              color: banner.subtitleColor,
              fontSize: 12, fontWeight: 600,
              margin: 0, lineHeight: 1.5,
            }}>
              {banner.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots indicadores */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, paddingTop: 10 }}>
        {PROMO_BANNERS.map((b, i) => (
          <button
            key={b.id}
            onClick={() => goTo(i)}
            aria-label={`Banner ${i + 1}`}
            style={{
              width: i === active ? 18 : 5, height: 5,
              borderRadius: 99,
              background: i === active ? TEAL : '#CBD5E1',
              border: 'none', padding: 0, cursor: 'pointer',
              transition: 'width 0.3s ease, background 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function RestaurantCard({ r, navigate }) {
  const isOpen     = isRestaurantOpen(r);
  const primaryCat = Array.isArray(r.category) ? r.category[0] : (r.category ?? 'Restaurante');

  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      onClick={() => navigate(`/restaurant/${r.id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: CARD_BG, borderRadius: 16,
        padding: '12px 14px', cursor: 'pointer',
      }}
    >
      {/* Foto */}
      <div style={{ position: 'relative', width: 64, height: 64, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: GRAY_FILL }}>
        {r.image_url ? (
          <img
            src={r.image_url} alt={r.name} loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: r.cover_position ?? 'center' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: `linear-gradient(135deg, ${TEAL} 0%, #0F766E 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 900, fontSize: 24, letterSpacing: '-0.04em' }}>
              {r.name.charAt(0)}
            </span>
          </div>
        )}
        {/* Badge abierto/cerrado */}
        <div style={{
          position: 'absolute', bottom: 3, left: 3,
          background: isOpen ? 'rgba(13,148,136,0.92)' : 'rgba(0,0,0,0.60)',
          borderRadius: 6, padding: '2px 5px',
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff', flexShrink: 0 }} />
          <span style={{ color: '#fff', fontSize: 8.5, fontWeight: 800, letterSpacing: '0.03em' }}>
            {isOpen ? 'ABIERTO' : 'CERRADO'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: NAVY, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {r.name}
        </div>
        <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, marginTop: 2 }}>
          {primaryCat}{r.delivery_time ? ` · ${r.delivery_time}–${r.delivery_time + 10} min` : ''}
          {r.delivery_price != null ? ` · ${r.delivery_price === 0 ? 'Envío gratis' : `$${r.delivery_price.toLocaleString('es-AR')}`}` : ''}
        </div>
        {r.rating != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}>
            <Star size={11} fill={TEAL} color={TEAL} strokeWidth={0} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: TEAL }}>{r.rating.toFixed(1)}</span>
            <span style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 500 }}>(100+)</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: CARD_BG, borderRadius: 16, padding: '12px 14px' }}>
      <div style={{ width: 64, height: 64, borderRadius: 12, flexShrink: 0 }} className="skeleton" />
      <div style={{ flex: 1 }}>
        <div style={{ height: 14, width: '60%', borderRadius: 6, marginBottom: 7 }} className="skeleton" />
        <div style={{ height: 11, width: '80%', borderRadius: 6, marginBottom: 6 }} className="skeleton" />
        <div style={{ height: 11, width: '30%', borderRadius: 6 }} className="skeleton" />
      </div>
    </div>
  );
}

export default function Home() {
  const navigate  = useNavigate();
  const cartCount = useCartStore(s => s.count());

  const [restaurants, setRestaurants] = useState(DEMO);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [catFilter, setCatFilter]     = useState('');
  const [sortBy, setSortBy]           = useState('relevance');
  const [sortOpen, setSortOpen]       = useState(false);

  useEffect(() => {
    supabase.from('restaurants').select('*').eq('is_active', true).order('name').then(({ data, error }) => {
      if (!error && data?.length) setRestaurants(data);
      setLoading(false);
    });
  }, []);

  const availableChips = useMemo(() => {
    const cats = new Set(
      restaurants.flatMap(r =>
        Array.isArray(r.category) ? r.category : r.category ? [r.category] : []
      )
    );
    return ['Todos', ...ALL_CATS.filter(c => cats.has(c))];
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

  return (
    <div
      style={{ background: CARD_BG, minHeight: '100%' }}
      onClick={() => sortOpen && setSortOpen(false)}
    >
      {/* ── Bloque editorial ── */}
      <div style={{ padding: '20px 18px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
          <MapPin size={13} color={TEAL} strokeWidth={2.5} />
          <span style={{ fontSize: 11, fontWeight: 700, color: TEAL, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Vicuña Mackenna
          </span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: NAVY, letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0 }}>
          ¿Qué se te antoja hoy?
        </h1>
      </div>

      {/* ── Buscador ── */}
      <div style={{ padding: '14px 18px 0' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={17} color={TEXT_MUTED}
            style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar comidas, bebidas o tiendas..."
            style={{
              width: '100%', height: 50, padding: '0 16px 0 46px',
              background: GRAY_FILL, border: 'none', borderRadius: 16,
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: NAVY,
              boxSizing: 'border-box', outline: 'none',
            }}
          />
        </div>
      </div>

      {/* ── Categorías ── */}
      <div style={{ paddingTop: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 18px', marginBottom: 14 }}>
          <span style={{ fontWeight: 800, fontSize: 15.5, color: NAVY, letterSpacing: '-0.01em' }}>Categorías</span>
          <button
            onClick={() => setCatFilter('')}
            style={{ background: 'none', border: 'none', fontSize: 12.5, fontWeight: 700, color: TEAL, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Ver todas
          </button>
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 18px 4px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {CATEGORY_TILES.map(({ label, filter, Icon }) => {
            const active = catFilter === filter;
            return (
              <motion.button
                key={label}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCatFilter(active ? '' : filter)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                  minWidth: 64, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: active ? TEAL : GRAY_FILL,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: active ? '0 4px 12px rgba(13,148,136,0.35)' : 'none',
                  transition: 'background 0.15s, box-shadow 0.15s',
                }}>
                  <Icon size={22} color={active ? '#fff' : NAVY} strokeWidth={1.8} />
                </div>
                <span style={{ fontSize: 11, fontWeight: active ? 700 : 600, color: active ? NAVY : TEXT_MUTED }}>
                  {label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Banners ── */}
      <div style={{ padding: '22px 18px 0' }}>
        <PromoBanner navigate={navigate} />
      </div>

      {/* ── Filtros / chips ── */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '18px 18px 0', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Sort dropdown */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={e => { e.stopPropagation(); setSortOpen(v => !v); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: '#fff', border: `1px solid ${sortBy !== 'relevance' ? TEAL : '#E2E8F0'}`,
              padding: '8px 14px', borderRadius: 99,
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12.5,
              fontWeight: 600, color: sortBy !== 'relevance' ? TEAL : '#475569',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            <SlidersHorizontal size={13} strokeWidth={2.2} />
            {SORT_OPTIONS.find(o => o.id === sortBy)?.label ?? 'Relevancia'}
            <ChevronDown
              size={12} strokeWidth={2.6}
              style={{ transform: sortOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </motion.button>
          <AnimatePresence>
            {sortOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
                  background: '#fff', borderRadius: 14,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #F1F5F9',
                  minWidth: 180, overflow: 'hidden',
                }}
              >
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setSortBy(opt.id); setSortOpen(false); }}
                    style={{
                      display: 'block', width: '100%', padding: '11px 16px',
                      background: sortBy === opt.id ? '#F0FDFA' : '#fff',
                      color: sortBy === opt.id ? TEAL : '#374151',
                      border: 'none', textAlign: 'left',
                      fontSize: 14, fontWeight: sortBy === opt.id ? 700 : 600,
                      cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                      borderBottom: '1px solid #F8FAFC',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chips de categoría */}
        {availableChips.map(chip => {
          const active = chip === 'Todos' ? catFilter === '' : catFilter === chip;
          return (
            <motion.button
              key={chip}
              whileTap={{ scale: 0.92 }}
              onClick={() => setCatFilter(chip === 'Todos' ? '' : chip)}
              style={{
                flexShrink: 0,
                background: active ? TEAL : '#fff',
                color: active ? '#fff' : TEXT_MUTED,
                border: active ? 'none' : '1px solid #E2E8F0',
                padding: '8px 18px', borderRadius: 99,
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12.5,
                fontWeight: active ? 700 : 600, cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {chip}
            </motion.button>
          );
        })}
      </div>

      {/* ── Listado ── */}
      <div style={{ padding: '18px 18px 80px' }}>
        <div style={{ fontWeight: 800, fontSize: 15.5, color: NAVY, marginBottom: 12, letterSpacing: '-0.01em' }}>
          {catFilter ? `${catFilter}s cerca de vos` : 'Cerca de vos'}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontWeight: 700, color: '#6B7280', fontSize: 15 }}>Sin resultados</p>
            <button
              onClick={() => { setSearch(''); setCatFilter(''); setSortBy('relevance'); }}
              style={{ marginTop: 8, color: TEAL, fontWeight: 700, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(r => <RestaurantCard key={r.id} r={r} navigate={navigate} />)}
          </div>
        )}
      </div>

      {/* ── FAB carrito ── */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/carrito')}
            style={{
              position: 'fixed', right: 20, bottom: 80, zIndex: 40,
              width: 52, height: 52, borderRadius: '50%',
              background: TEAL, border: '2px solid #fff',
              boxShadow: '0 6px 16px rgba(13,148,136,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ShoppingCart size={22} color="#fff" strokeWidth={2.2} />
            <span style={{
              position: 'absolute', top: -2, right: -2,
              width: 18, height: 18, borderRadius: '50%',
              background: NAVY, color: '#fff',
              fontSize: 10, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #fff',
            }}>
              {cartCount}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
