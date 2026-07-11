import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, ChevronDown,
  Star, Heart, ShoppingCart,
  Utensils, Sandwich, Pizza, GlassWater, Beef, CakeSlice,
} from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { isRestaurantOpen } from '../lib/restaurantUtils.js';
import useCartStore from '../store/cartStore.js';

const RED = '#D32F2F';

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

const CAT_COLOR = {
  'Rotisería': '#FF8C00', 'Parrilla': '#DC2626', 'Pizza': '#D97706',
  'Empanadas': '#16A34A', 'Sushi': '#4F46E5', 'Vegano': '#15803D', 'Bebidas': '#0284C7',
};

const DEMO = [
  { id: 'd1', name: 'La Rotisería de Don Carlos', category: ['Rotisería'], rating: 4.8, delivery_time: 25, delivery_price: 350, image_url: null, logo_url: null },
  { id: 'd2', name: 'Rotisería Los Hermanos',     category: ['Rotisería'], rating: 4.6, delivery_time: 35, delivery_price: 400, image_url: null, logo_url: null },
  { id: 'd3', name: 'El Buen Gusto',              category: ['Empanadas'], rating: 4.9, delivery_time: 30, delivery_price: 250, image_url: null, logo_url: null },
];

const PROMO_BANNERS = [
  {
    id: 'negocio',
    image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&auto=format&fit=crop&q=60',
    title: '¿Tenés un negocio?',
    subtitle: 'Llegá a miles de vecinos con VicuñaYa.',
    cta: '¡Sumate a VicuñaYa!',
    to: '/anunciate',
  },
  {
    id: 'descuento',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=60',
    title: '30% OFF en tu primer pedido',
    subtitle: 'Usá el código VICUÑA30 al pagar.',
    cta: 'Pedir ahora',
    to: '/delivery',
  },
  {
    id: 'envio',
    image: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=800&auto=format&fit=crop&q=60',
    title: 'Envío gratis',
    subtitle: 'En pedidos arriba de $3.000.',
    cta: 'Ver restaurantes',
    to: '/delivery',
  },
];

function catColor(category) {
  const primary = Array.isArray(category) ? category[0] : category;
  return CAT_COLOR[primary] ?? RED;
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
      style={{ background: '#FFF8F8', minHeight: '100%' }}
      onClick={() => sortOpen && setSortOpen(false)}
    >
      {/* ── Buscador ── */}
      <div style={{ padding: '14px 18px 0' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={16} color="#8A8580"
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar comidas, bebidas o tiendas..."
            style={{
              width: '100%', height: 46, padding: '0 14px 0 42px',
              background: '#fff', border: '1px solid #E9D5D8', borderRadius: 14,
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: '#241F1D',
              boxSizing: 'border-box', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', outline: 'none',
            }}
          />
        </div>
      </div>

      {/* ── Carrusel de banners ── */}
      <PromoBanner navigate={navigate} />

      {/* ── Categorías ── */}
      <div style={{ paddingTop: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 18px', marginBottom: 12 }}>
          <span style={{ fontWeight: 800, fontSize: 16.5, color: '#241F1D', letterSpacing: '-0.01em' }}>Categorías</span>
          <button
            onClick={() => setCatFilter('')}
            style={{ background: 'none', border: 'none', fontSize: 12.5, fontWeight: 700, color: RED, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Ver todas
          </button>
        </div>
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '0 18px 4px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
                  width: 60, height: 60, borderRadius: 18,
                  background: active ? RED : '#fff',
                  border: active ? 'none' : '1px solid #E9D5D8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: active ? '0 4px 10px rgba(211,47,47,0.3)' : 'none',
                  transition: 'background 0.15s, box-shadow 0.15s',
                }}>
                  <Icon size={24} color={active ? '#fff' : RED} strokeWidth={1.8} />
                </div>
                <span style={{ fontSize: 11.5, fontWeight: active ? 700 : 600, color: active ? '#241F1D' : '#5B5450' }}>
                  {label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Filtros ── */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '14px 18px 0', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Chip de orden con dropdown */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={e => { e.stopPropagation(); setSortOpen(v => !v); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: '#fff', border: '1px solid #E9D5D8',
              padding: '8px 14px', borderRadius: 99,
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12.5, fontWeight: 600, color: '#3A332F',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            <SlidersHorizontal size={13} color="#3A332F" strokeWidth={2.2} />
            {SORT_OPTIONS.find(o => o.id === sortBy)?.label ?? 'Relevancia'}
            <ChevronDown
              size={12} color="#3A332F" strokeWidth={2.6}
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
                  boxShadow: '0 8px 32px rgba(0,0,0,0.14)', border: '1px solid #F3F4F6',
                  minWidth: 180, overflow: 'hidden',
                }}
              >
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setSortBy(opt.id); setSortOpen(false); }}
                    style={{
                      display: 'block', width: '100%', padding: '11px 16px',
                      background: sortBy === opt.id ? '#FEF2F2' : '#fff',
                      color: sortBy === opt.id ? RED : '#374151',
                      border: 'none', textAlign: 'left',
                      fontSize: 14, fontWeight: sortBy === opt.id ? 700 : 600,
                      cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                      borderBottom: '1px solid #F9FAFB',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chips de categoría dinámicos desde datos */}
        {availableChips.map(chip => {
          const active = chip === 'Todos' ? catFilter === '' : catFilter === chip;
          return (
            <motion.button
              key={chip}
              whileTap={{ scale: 0.92 }}
              onClick={() => setCatFilter(chip === 'Todos' ? '' : chip)}
              style={{
                flexShrink: 0,
                background: active ? RED : '#fff',
                color: active ? '#fff' : '#5B5450',
                border: active ? 'none' : '1px solid #E9D5D8',
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
      <div style={{ padding: '22px 18px 80px' }}>
        <div style={{ fontWeight: 800, fontSize: 16.5, color: '#241F1D', marginBottom: 12, letterSpacing: '-0.01em' }}>
          {catFilter ? `${catFilter}s destacadas` : 'Rotiserías destacadas'}
        </div>

        {loading ? (
          <SkeletonSection />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontWeight: 700, color: '#6B7280', fontSize: 15 }}>Sin resultados</p>
            <button
              onClick={() => { setSearch(''); setCatFilter(''); setSortBy('relevance'); }}
              style={{ marginTop: 8, color: RED, fontWeight: 700, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <FeaturedCard r={filtered[0]} navigate={navigate} />
            {filtered.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
                {filtered.slice(1).map(r => <SmallCard key={r.id} r={r} navigate={navigate} />)}
              </div>
            )}
          </>
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
              background: RED, border: '2px solid #fff',
              boxShadow: '0 6px 16px rgba(255,59,92,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ShoppingCart size={22} color="#fff" strokeWidth={2.2} />
            <span style={{
              position: 'absolute', top: -2, right: -2,
              width: 18, height: 18, borderRadius: '50%',
              background: '#241F1D', color: '#fff',
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

function PromoBanner({ navigate }) {
  const [active, setActive]     = useState(0);
  const timerRef                = useRef(null);
  const pauseRef                = useRef(false);

  const goTo = useCallback((idx) => {
    setActive(idx);
    // Pausa el auto-avance 6 segundos tras interacción manual
    pauseRef.current = true;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { pauseRef.current = false; }, 6000);
  }, []);

  useEffect(() => {
    const tick = () => {
      if (!pauseRef.current) {
        setActive(i => (i + 1) % PROMO_BANNERS.length);
      }
    };
    const id = setInterval(tick, 5000);
    return () => { clearInterval(id); clearTimeout(timerRef.current); };
  }, []);

  const banner = PROMO_BANNERS[active];

  return (
    <div style={{ padding: '16px 18px 0' }}>
      <div style={{ position: 'relative', height: 190, borderRadius: 20, overflow: 'hidden', background: '#B71C1C', cursor: 'pointer' }}
        onClick={() => navigate(banner.to)}
      >
        {/* Fotos — AnimatePresence para cross-fade */}
        <AnimatePresence initial={false}>
          <motion.img
            key={banner.id}
            src={banner.image}
            alt=""
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
        </AnimatePresence>

        {/* Degradado rojo siempre encima */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, rgba(211,47,47,0.88) 12%, rgba(183,28,28,0.28) 60%)',
        }} />

        {/* Contenido del banner activo */}
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={banner.id + '-text'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'absolute', inset: 0, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 8 }}
          >
            <h2 style={{ margin: 0, color: '#fff', fontWeight: 800, fontSize: 22, lineHeight: 1.15, maxWidth: 210, letterSpacing: '-0.01em' }}>
              {banner.title}
            </h2>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 500, maxWidth: 220 }}>
              {banner.subtitle}
            </p>
            <button
              onClick={e => { e.stopPropagation(); navigate(banner.to); }}
              style={{
                marginTop: 4, alignSelf: 'flex-start',
                background: '#fff', color: RED, border: 'none',
                padding: '10px 18px', borderRadius: 99,
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13,
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)', cursor: 'pointer',
              }}
            >
              {banner.cta}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots indicadores */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingTop: 10 }}>
        {PROMO_BANNERS.map((b, i) => (
          <button
            key={b.id}
            onClick={() => goTo(i)}
            aria-label={`Banner ${i + 1}`}
            style={{
              width: i === active ? 20 : 6,
              height: 6, borderRadius: 99,
              background: i === active ? RED : '#D1C5C5',
              border: 'none', padding: 0, cursor: 'pointer',
              transition: 'width 0.3s ease, background 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function FeaturedCard({ r, navigate }) {
  const isOpen = isRestaurantOpen(r);
  const bg = catColor(r.category);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/restaurant/${r.id}`)}
      onKeyDown={e => e.key === 'Enter' && navigate(`/restaurant/${r.id}`)}
      style={{
        background: '#fff', borderRadius: 20, overflow: 'visible',
        boxShadow: '0 4px 14px rgba(0,0,0,0.06)', border: '1px solid #E9D5D8', cursor: 'pointer',
      }}
    >
      <div style={{ position: 'relative', height: 170, borderRadius: '20px 20px 0 0', overflow: 'hidden' }}>
        {r.image_url ? (
          <img
            src={r.image_url} alt={r.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: r.cover_position ?? '50% 50%' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: `linear-gradient(145deg, ${bg}cc 0%, ${bg}88 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 64, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '-0.04em' }}>
              {r.name.charAt(0)}
            </span>
          </div>
        )}
        <span style={{
          position: 'absolute', top: 12, left: 12,
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: isOpen ? '#2E7D32' : 'rgba(0,0,0,0.58)',
          color: '#fff', padding: '5px 10px', borderRadius: 99,
          fontSize: 10.5, fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', flexShrink: 0 }} />
          {isOpen ? 'Abierto' : 'Cerrado'}
        </span>
        {/* Avatar logo — sobresale abajo */}
        <div style={{
          position: 'absolute', bottom: -26, left: 14,
          width: 60, height: 60, borderRadius: '50%',
          background: r.logo_url ? '#f9fafb' : '#241F1D',
          border: '4px solid #fff', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(0,0,0,0.2)', zIndex: 1,
        }}>
          {r.logo_url
            ? <img src={r.logo_url} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ color: '#fff', fontWeight: 800, fontSize: 9, textAlign: 'center', lineHeight: 1.15, padding: '0 4px', whiteSpace: 'pre-line' }}>
                {r.name.split(' ').slice(0, 2).join('\n')}
              </span>
          }
        </div>
      </div>

      <div style={{ padding: '34px 14px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderRadius: '0 0 20px 20px', overflow: 'hidden' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#241F1D' }}>{r.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, fontSize: 12.5, color: '#8A8580', fontWeight: 500, flexWrap: 'wrap' }}>
            {r.rating != null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: RED, fontWeight: 700 }}>
                <Star size={12} fill={RED} color={RED} strokeWidth={0} />
                {r.rating.toFixed(1)}
              </span>
            )}
            {r.rating != null && <span>(100+)</span>}
            {r.delivery_time != null && <><span>·</span><span>{r.delivery_time}–{r.delivery_time + 10} min</span></>}
            {r.delivery_price != null && (
              <><span>·</span><span>{r.delivery_price === 0 ? 'Envío gratis' : `$${r.delivery_price.toLocaleString('es-AR')} envío`}</span></>
            )}
          </div>
        </div>
        <button
          onClick={e => e.stopPropagation()}
          style={{
            width: 38, height: 38, borderRadius: '50%', border: '1px solid #E9D5D8',
            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, cursor: 'pointer',
          }}
        >
          <Heart size={17} color={RED} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}


function SmallCard({ r, navigate }) {
  const bg = catColor(r.category);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/restaurant/${r.id}`)}
      onKeyDown={e => e.key === 'Enter' && navigate(`/restaurant/${r.id}`)}
      style={{ background: '#fff', borderRadius: 18, border: '1px solid #E9D5D8', padding: 10, cursor: 'pointer' }}
    >
      <div style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 14, overflow: 'hidden', marginBottom: 8 }}>
        {r.image_url ? (
          <img src={r.image_url} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: `linear-gradient(145deg, ${bg}cc 0%, ${bg}88 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: 'rgba(255,255,255,0.4)' }}>{r.name.charAt(0)}</span>
          </div>
        )}
      </div>
      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#241F1D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
      <div style={{ fontSize: 11.5, color: '#8A8580', fontWeight: 500, marginTop: 2 }}>
        {r.rating != null ? `${r.rating.toFixed(1)} · ` : ''}{r.delivery_time != null ? `${r.delivery_time} min` : ''}
      </div>
    </div>
  );
}

function SkeletonSection() {
  return (
    <>
      <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', border: '1px solid #E9D5D8' }}>
        <div style={{ height: 170 }} className="skeleton" />
        <div style={{ padding: '34px 14px 14px' }}>
          <div style={{ height: 16, width: '55%', borderRadius: 6, marginBottom: 8 }} className="skeleton" />
          <div style={{ height: 12, width: '80%', borderRadius: 6 }} className="skeleton" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
        {[0, 1].map(i => (
          <div key={i} style={{ background: '#fff', borderRadius: 18, border: '1px solid #E9D5D8', padding: 10 }}>
            <div style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 14, marginBottom: 8 }} className="skeleton" />
            <div style={{ height: 14, width: '70%', borderRadius: 6, marginBottom: 4 }} className="skeleton" />
            <div style={{ height: 11, width: '50%', borderRadius: 6 }} className="skeleton" />
          </div>
        ))}
      </div>
    </>
  );
}
