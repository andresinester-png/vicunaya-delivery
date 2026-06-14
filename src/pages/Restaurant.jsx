import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Star, ChevronLeft, ShoppingCart, Bike, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import MenuItem from '../components/MenuItem.jsx';
import ProductModal from '../components/ProductModal.jsx';
import { supabase } from '../lib/supabase.js';
import useCartStore from '../store/cartStore.js';
import { isRestaurantOpen } from '../lib/restaurantUtils.js';

const CAT_GRADIENT = {
  'Rotisería': ['#FF9A3C','#FF6B00'], 'Parrilla': ['#EF4444','#B91C1C'],
  'Pizza':     ['#F59E0B','#D97706'], 'Empanadas': ['#10B981','#059669'],
  'Sushi':     ['#6366F1','#4338CA'], 'Vegano': ['#22C55E','#15803D'],
  default:     ['#e31b23','#C2003C'],
};
const CAT_EMOJI = {
  'Rotisería':'🍗','Parrilla':'🥩','Pizza':'🍕','Empanadas':'🥟',
  'Sushi':'🍱','Vegano':'🥗', default:'🍽️',
};

// Height of the MainLayout sticky header
const HEADER_H = 56;
// Height of our sticky tabs bar
const TABS_H = 60;

const sectionVariants = {
  hidden: { opacity: 0, y: 22 },
  show:   { opacity: 1, y: 0,  transition: { type: 'spring', stiffness: 220, damping: 22 } },
};

export default function Restaurant() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [restaurant,     setRestaurant]     = useState(null);
  const [categories,     setCategories]     = useState([]);
  const [items,          setItems]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [modalItem,      setModalItem]      = useState(null);
  const [searchQuery,    setSearchQuery]    = useState('');

  const sectionRefs = useRef({});
  const tabsRef     = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const [{ data: rest }, { data: cats }, { data: menuItems }] = await Promise.all([
        supabase.from('restaurants').select('*').eq('id', id).single(),
        supabase.from('menu_categories').select('*').eq('restaurant_id', id).order('sort_order'),
        supabase.from('menu_items').select('*').eq('restaurant_id', id).order('sort_order'),
      ]);
      setRestaurant(rest);
      setCategories(cats || []);
      setItems(menuItems || []);
      if (cats?.length) setActiveCategory(cats[0].id);
      setLoading(false);
    };
    load();
  }, [id]);

  // Track which section is in view as the user scrolls
  useEffect(() => {
    if (!categories.length) return;
    observerRef.current?.disconnect();

    const scrollEl = document.getElementById('main-scroll');
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (top.length) setActiveCategory(top[0].target.dataset.catId);
      },
      {
        root: scrollEl,
        rootMargin: `-${HEADER_H + TABS_H + 8}px 0px -55% 0px`,
        threshold: 0,
      }
    );

    Object.values(sectionRefs.current).forEach(el => {
      if (el) observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [categories]);

  // Auto-scroll active tab into view inside the tabs strip
  useEffect(() => {
    if (!activeCategory || !tabsRef.current) return;
    const btn = tabsRef.current.querySelector(`[data-tab="${activeCategory}"]`);
    btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeCategory]);

  const addItem = useCartStore(s => s.addItem);
  const count   = useCartStore(s => s.count());
  const total   = useCartStore(s => s.total());

  const handleAdd = (item) => {
    addItem(item, restaurant);
    toast.success(`${item.name} agregado`, {
      duration: 1200,
      style: { fontWeight: 600, fontSize: 13 },
    });
  };

  const scrollToCategory = (catId) => {
    setActiveCategory(catId);
    sectionRefs.current[catId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Loading skeleton ───────────────────────────────────────────
  if (loading) return (
    <div style={{ background: '#F8F8F8', minHeight: '100%' }}>
      <div style={{ height: 280 }} className="skeleton" />
      <div style={{ padding: '16px 16px 0', display: 'flex', gap: 8 }}>
        {[88, 110, 80].map((w, i) => (
          <div key={i} style={{ height: 36, width: w, borderRadius: 999 }} className="skeleton" />
        ))}
      </div>
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ height: 90, borderRadius: 20 }} className="skeleton" />
        ))}
      </div>
    </div>
  );

  if (!restaurant) return (
    <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', fontWeight: 600 }}>
      Restaurante no encontrado
    </div>
  );

  const isOpen = isRestaurantOpen(restaurant);
  const primaryCat = Array.isArray(restaurant.category) ? restaurant.category[0] : restaurant.category;
  const colors = CAT_GRADIENT[primaryCat] ?? CAT_GRADIENT.default;
  const emoji  = CAT_EMOJI[primaryCat]    ?? CAT_EMOJI.default;
  const itemsByCategory = categories.reduce((acc, cat) => {
    acc[cat.id] = items.filter(i => i.category_id === cat.id);
    return acc;
  }, {});

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredItems = normalizedQuery
    ? items.filter(i =>
        i.name?.toLowerCase().includes(normalizedQuery) ||
        i.description?.toLowerCase().includes(normalizedQuery)
      )
    : [];

  return (
    <div style={{ background: '#F8F8F8', minHeight: '100%' }}>

      {/* ──────────────────────────────────────────────────────────
          HERO
      ────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: 280, overflow: 'hidden' }}>

        {/* Background image / gradient placeholder */}
        {restaurant.image_url ? (
          <img
            src={restaurant.image_url}
            alt={restaurant.name}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover',
              objectPosition: restaurant.cover_position || '50% 50%',
              display: 'block',
            }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: `linear-gradient(145deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', right: -50, top: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
            <div style={{ position: 'absolute', left: -30, bottom: -50, width: 150, height: 150, borderRadius: '50%', background: 'rgba(0,0,0,0.10)' }} />
            <span style={{ fontSize: 80, position: 'relative', zIndex: 1 }}>{emoji}</span>
          </div>
        )}

        {/* Dark gradient — transparent top, strong bottom for text legibility */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.32) 40%, rgba(0,0,0,0.84) 100%)',
        }} />

        {/* Back button — glass morphism matching Home page style */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: 16, left: 16,
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={22} color="#fff" strokeWidth={2.5} />
        </motion.button>

        {/* Hero bottom — name + stats */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 20px' }}>

          {/* Status badge */}
          <div style={{ marginBottom: 8 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: isOpen ? 'rgba(22,163,74,0.88)' : 'rgba(0,0,0,0.55)',
              color: '#fff', fontSize: 11, fontWeight: 800,
              padding: '4px 10px', borderRadius: 999,
              backdropFilter: 'blur(4px)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', flexShrink: 0 }} />
              {isOpen ? 'Abierto' : 'Cerrado'}
            </span>
          </div>

          {/* Restaurant name */}
          <h1 style={{
            color: '#fff', fontSize: 28, fontWeight: 900,
            letterSpacing: '-0.03em', lineHeight: 1.1,
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            margin: '0 0 10px',
          }}>
            {restaurant.name}
          </h1>

          {/* Stats row */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            {restaurant.rating != null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fff', fontSize: 13, fontWeight: 700 }}>
                <Star size={13} fill="#F59E0B" color="#F59E0B" />
                {restaurant.rating.toFixed(1)}
              </span>
            )}
            {restaurant.delivery_time != null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.88)', fontSize: 13, fontWeight: 600 }}>
                <Clock size={13} color="rgba(255,255,255,0.65)" strokeWidth={2} />
                {restaurant.delivery_time}–{restaurant.delivery_time + 10} min
              </span>
            )}
            {restaurant.delivery_price != null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.88)', fontSize: 13, fontWeight: 600 }}>
                <Bike size={13} color="rgba(255,255,255,0.65)" strokeWidth={2} />
                {restaurant.delivery_price === 0
                  ? 'Envío gratis'
                  : `Envío $${restaurant.delivery_price.toLocaleString('es-AR')}`}
              </span>
            )}
            {restaurant.min_order != null && (
              <span style={{ color: 'rgba(255,255,255,0.68)', fontSize: 12, fontWeight: 600 }}>
                Mín. ${restaurant.min_order.toLocaleString('es-AR')}
              </span>
            )}
          </div>

          {/* Red accent bar — same pattern as Home page cards */}
          <div style={{ marginTop: 14, height: 3, width: 40, borderRadius: 2, background: '#e31b23' }} />
        </div>
      </div>

      {/* Description strip */}
      {restaurant.description && (
        <div style={{ background: '#fff', padding: '14px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <p style={{ fontSize: 13, color: '#6B7280', fontWeight: 500, lineHeight: 1.55, margin: 0 }}>
            {restaurant.description}
          </p>
        </div>
      )}

      {/* Closed banner */}
      {!isOpen && (
        <div style={{
          background: '#FEF2F2', borderBottom: '1px solid #FECACA',
          padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>🔒</span>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', margin: 0 }}>
            Este restaurante está cerrado
          </p>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          SEARCH BAR
      ────────────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#F3F4F6', borderRadius: 14,
          padding: '10px 14px',
        }}>
          <Search size={17} color="#9CA3AF" strokeWidth={2.5} style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar en el menú..."
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontSize: 14, fontWeight: 500, color: '#111',
              outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: '#D1D5DB', border: 'none', cursor: 'pointer',
                borderRadius: '50%', width: 20, height: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, padding: 0,
              }}
            >
              <X size={12} color="#6B7280" strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          STICKY CATEGORY TABS
      ────────────────────────────────────────────────────────── */}
      {categories.length > 0 && !normalizedQuery && (
        <div
          ref={tabsRef}
          style={{
            position: 'sticky',
            top: HEADER_H,
            zIndex: 20,
            background: '#F8F8F8',
            padding: '10px 0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
          }}
        >
          <div style={{
            display: 'flex', gap: 8,
            overflowX: 'auto', scrollbarWidth: 'none',
            padding: '0 16px',
          }}>
            {categories.map(cat => (
              <motion.button
                key={cat.id}
                data-tab={cat.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => scrollToCategory(cat.id)}
                style={{
                  flexShrink: 0,
                  padding: '8px 18px',
                  borderRadius: 999,
                  fontSize: 13, fontWeight: 700,
                  border: 'none', cursor: 'pointer',
                  transition: 'background 0.18s, color 0.18s, box-shadow 0.18s',
                  background: activeCategory === cat.id ? '#e31b23' : '#fff',
                  color:      activeCategory === cat.id ? '#fff'     : '#374151',
                  boxShadow:  activeCategory === cat.id
                    ? '0 4px 12px rgba(227,27,35,0.30)'
                    : '0 1px 6px rgba(0,0,0,0.08)',
                }}
              >
                {cat.name}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          MENU SECTIONS
      ────────────────────────────────────────────────────────── */}
      <motion.div
        variants={{ show: { transition: { staggerChildren: 0.07 } } }}
        initial="hidden"
        animate="show"
        style={{ padding: '20px 16px 120px' }}
      >
        {/* ── Search results mode ── */}
        {normalizedQuery ? (
          filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 0', color: '#9CA3AF', fontSize: 15, fontWeight: 600 }}>
              No encontramos productos con ese nombre
            </div>
          ) : (
            <motion.div variants={sectionVariants}>
              <div style={{
                background: '#fff',
                borderRadius: 20,
                boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
                padding: '0 16px',
              }}>
                {filteredItems.map((item, i, arr) => (
                  <MenuItem
                    key={item.id}
                    item={item}
                    onAdd={isOpen ? handleAdd : null}
                    onTap={setModalItem}
                    isLast={i === arr.length - 1}
                  />
                ))}
              </div>
            </motion.div>
          )
        ) : (
          /* ── Normal grouped mode ── */
          <>
            {categories.length === 0 && (
              <div style={{ textAlign: 'center', padding: '56px 0', color: '#9CA3AF', fontSize: 15, fontWeight: 600 }}>
                Sin categorías de menú todavía
              </div>
            )}

            {categories.map(cat => (
              <motion.div
                key={cat.id}
                variants={sectionVariants}
                ref={el => { sectionRefs.current[cat.id] = el; }}
                data-cat-id={cat.id}
                style={{
                  marginBottom: 24,
                  scrollMarginTop: HEADER_H + TABS_H + 8,
                }}
              >
                {/* Category header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingLeft: 4 }}>
                  <h2 style={{
                    fontSize: 20, fontWeight: 900, color: '#111',
                    letterSpacing: '-0.02em', margin: 0, lineHeight: 1,
                  }}>
                    {cat.name}
                  </h2>
                  {(itemsByCategory[cat.id]?.length ?? 0) > 0 && (
                    <span style={{
                      fontSize: 11, fontWeight: 800, color: '#e31b23',
                      background: '#fef2f2', padding: '2px 8px', borderRadius: 999,
                    }}>
                      {itemsByCategory[cat.id].length}
                    </span>
                  )}
                </div>

                {/* Items card */}
                <div style={{
                  background: '#fff',
                  borderRadius: 20,
                  boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
                  padding: '0 16px',
                }}>
                  {(itemsByCategory[cat.id] || []).length === 0 ? (
                    <p style={{ padding: '18px 0', fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', margin: 0 }}>
                      Sin productos en esta categoría
                    </p>
                  ) : (
                    (itemsByCategory[cat.id] || []).map((item, i, arr) => (
                      <MenuItem
                        key={item.id}
                        item={item}
                        onAdd={isOpen ? handleAdd : null}
                        onTap={setModalItem}
                        isLast={i === arr.length - 1}
                      />
                    ))
                  )}
                </div>
              </motion.div>
            ))}
          </>
        )}
      </motion.div>

      {/* ──────────────────────────────────────────────────────────
          PRODUCT MODAL
      ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalItem && (
          <ProductModal
            item={modalItem}
            restaurant={restaurant}
            onClose={() => setModalItem(null)}
          />
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────
          BARRA INFERIOR DE CARRITO
      ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 45,
              background: '#fff',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
              padding: '12px 16px',
              paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
            }}
          >
            <motion.button
              whileTap={{ scale: isOpen ? 0.97 : 1 }}
              onClick={() => isOpen && navigate('/carrito')}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: isOpen ? '#e31b23' : '#9CA3AF', color: '#fff',
                fontWeight: 800, fontSize: 15,
                padding: '14px 22px',
                borderRadius: 999, border: 'none', cursor: isOpen ? 'pointer' : 'not-allowed',
                boxShadow: isOpen ? '0 6px 20px rgba(227,27,35,0.35)' : 'none',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <ShoppingCart size={18} strokeWidth={2.2} />
              Ver carrito
            </motion.button>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: 19, fontWeight: 900, color: '#111', margin: 0, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                ${total.toLocaleString('es-AR')}
              </p>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', margin: 0 }}>
                {count} {count === 1 ? 'producto' : 'productos'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
