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
import { KYVRA } from '../lib/theme.js';

const CAT_GRADIENT = {
  'Rotisería': ['#FF9A3C','#FF6B00'], 'Parrilla': ['#EF4444','#B91C1C'],
  'Pizza':     ['#F59E0B','#D97706'], 'Empanadas': ['#10B981','#059669'],
  'Sushi':     ['#6366F1','#4338CA'], 'Vegano': ['#22C55E','#15803D'],
  default:     ['#0F172A','#C2003C'],
};
const CAT_EMOJI = {
  'Rotisería':'🍗','Parrilla':'🥩','Pizza':'🍕','Empanadas':'🥟',
  'Sushi':'🍱','Vegano':'🥗', default:'🍽️',
};

const HEADER_H = 56;
const TABS_H   = 60;

const sectionVariants = {
  hidden: { opacity: 0, y: 22 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 22 } },
};

export default function Restaurant() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [restaurant,     setRestaurant]     = useState(null);
  const [categories,     setCategories]     = useState([]);
  const [items,          setItems]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [modalItem,      setModalItem]      = useState(null);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [searchFocused,  setSearchFocused]  = useState(false);

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

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}>
      <div style={{ background: KYVRA.bg, minHeight: '100%' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ height: 320, background: '#D1D5DB' }} className="animate-pulse" />
          <div style={{ background: KYVRA.white, padding: '14px 20px', borderBottom: `1px solid ${KYVRA.border}` }}>
            <div style={{ height: 22, width: '60%', borderRadius: 8, background: '#EEF2F7', marginBottom: 8 }} className="animate-pulse" />
            <div style={{ height: 13, width: '40%', borderRadius: 6, background: '#EEF2F7' }} className="animate-pulse" />
          </div>
          <div style={{ background: KYVRA.white, padding: '12px 20px', borderBottom: `1px solid ${KYVRA.border}`, display: 'flex', gap: 8 }}>
            {[88, 110, 80].map((w, i) => (
              <div key={i} style={{ height: 38, width: w, borderRadius: 999, background: '#EEF2F7' }} className="animate-pulse" />
            ))}
          </div>
          <div style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ height: 96, borderRadius: 20, background: '#EEF2F7' }} className="animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (!restaurant) return (
    <div style={{
      padding: 48, textAlign: 'center',
      color: KYVRA.textMuted, fontWeight: 600, fontSize: 15,
    }}>
      Restaurante no encontrado
    </div>
  );

  const isOpen     = isRestaurantOpen(restaurant);
  const primaryCat = Array.isArray(restaurant.category) ? restaurant.category[0] : restaurant.category;
  const colors     = CAT_GRADIENT[primaryCat] ?? CAT_GRADIENT.default;
  const emoji      = CAT_EMOJI[primaryCat]    ?? CAT_EMOJI.default;

  const itemsByCategory = categories.reduce((acc, cat) => {
    acc[cat.id] = items.filter(i => i.category_id === cat.id);
    return acc;
  }, {});

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredItems   = normalizedQuery
    ? items.filter(i =>
        i.name?.toLowerCase().includes(normalizedQuery) ||
        i.description?.toLowerCase().includes(normalizedQuery)
      )
    : [];

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Full-viewport background; inner div constrains content width */}
      <div style={{ background: KYVRA.bg, minHeight: '100%' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', minHeight: '100%' }}>

          {/* ── Hero ─────────────────────────────────────────────────── */}
          <div style={{ position: 'relative', height: 320, overflow: 'hidden' }}>

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

            {/* KYVRA-branded scrim with teal atmosphere */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(6,17,24,0.18) 0%, rgba(13,148,136,0.17) 32%, rgba(13,148,136,0.05) 54%, rgba(15,23,42,0.93) 100%)',
            }} />

            {/* Back button */}
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

            {/* Hero bottom */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 22px' }}>

              {/* Status badge */}
              <div style={{ marginBottom: 9 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: isOpen ? 'rgba(5,150,105,0.94)' : 'rgba(15,23,42,0.72)',
                  backdropFilter: 'blur(6px)',
                  color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: '0.04em',
                  padding: '4px 10px', borderRadius: 999,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: isOpen ? '#6EE7B7' : '#94A3B8', flexShrink: 0,
                  }} />
                  {isOpen ? 'ABIERTO' : 'CERRADO'}
                </span>
              </div>

              {/* Restaurant name */}
              <h1 style={{
                color: '#fff', fontSize: 28, fontWeight: 900,
                letterSpacing: '-0.03em', lineHeight: 1.1,
                textShadow: '0 2px 16px rgba(0,0,0,0.45)',
                margin: '0 0 10px',
              }}>
                {restaurant.name}
              </h1>

              {/* Stats row */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                {restaurant.rating != null && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fff', fontSize: 13, fontWeight: 700 }}>
                    <Star size={13} fill="#FBBF24" color="#FBBF24" />
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
                  <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 600 }}>
                    Mín. ${restaurant.min_order.toLocaleString('es-AR')}
                  </span>
                )}
              </div>

              <div style={{ marginTop: 14, height: 3, width: 40, borderRadius: 2, background: KYVRA.teal }} />
            </div>
          </div>

          {/* ── Description strip ────────────────────────────────────── */}
          {restaurant.description && (
            <div style={{
              background: KYVRA.white,
              padding: '14px 20px',
              borderBottom: `1px solid ${KYVRA.border}`,
            }}>
              <p style={{
                fontSize: 13.5, color: KYVRA.textSec,
                fontWeight: 450, lineHeight: 1.6, margin: 0,
              }}>
                {restaurant.description}
              </p>
            </div>
          )}

          {/* ── Closed banner ────────────────────────────────────────── */}
          {!isOpen && (
            <div style={{
              background: KYVRA.bg,
              borderBottom: `1px solid ${KYVRA.border}`,
              padding: '12px 20px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: KYVRA.navy,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 14,
              }}>
                🔒
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: KYVRA.textSec, margin: 0, lineHeight: 1.45 }}>
                Cerrado ahora — podés explorar el menú pero no hacer pedidos
              </p>
            </div>
          )}

          {/* ── Search bar ───────────────────────────────────────────── */}
          <div style={{
            background: KYVRA.white,
            padding: '12px 20px',
            borderBottom: `1px solid ${KYVRA.border}`,
          }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                color={searchFocused ? KYVRA.teal : KYVRA.textMuted}
                style={{
                  position: 'absolute', left: 14, top: '50%',
                  transform: 'translateY(-50%)', pointerEvents: 'none',
                  transition: 'color 0.2s',
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Buscar en el menú..."
                style={{
                  width: '100%', height: 48,
                  background: KYVRA.bg,
                  border: `1.5px solid ${searchFocused || searchQuery ? KYVRA.teal : KYVRA.border}`,
                  borderRadius: 16, padding: '0 44px 0 42px',
                  fontSize: 14, fontWeight: 500, color: KYVRA.navy,
                  outline: 'none',
                  boxShadow: searchFocused ? '0 0 0 3px rgba(13,148,136,0.12)' : 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: KYVRA.border, border: 'none', cursor: 'pointer',
                    borderRadius: '50%', width: 22, height: 22,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, padding: 0,
                  }}
                >
                  <X size={12} color={KYVRA.textSec} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>

          {/* ── Sticky category tabs ─────────────────────────────────── */}
          {categories.length > 0 && !normalizedQuery && (
            <div
              ref={tabsRef}
              style={{
                position: 'sticky',
                top: HEADER_H,
                zIndex: 20,
                background: KYVRA.white,
                borderBottom: `1px solid ${KYVRA.border}`,
                padding: '10px 0',
              }}
            >
              <div style={{
                display: 'flex', gap: 8,
                overflowX: 'auto', scrollbarWidth: 'none',
                padding: '0 20px',
              }}>
                {categories.map(cat => (
                  <motion.button
                    key={cat.id}
                    data-tab={cat.id}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => scrollToCategory(cat.id)}
                    style={{
                      flexShrink: 0,
                      padding: '8px 16px', minHeight: 38,
                      borderRadius: 999,
                      fontSize: 13, fontWeight: activeCategory === cat.id ? 700 : 500,
                      border: `1.5px solid ${activeCategory === cat.id ? KYVRA.teal : KYVRA.border}`,
                      cursor: 'pointer',
                      transition: 'background 0.18s, color 0.18s, border-color 0.18s, box-shadow 0.18s',
                      background: activeCategory === cat.id ? KYVRA.teal : KYVRA.white,
                      color:      activeCategory === cat.id ? '#fff' : KYVRA.textSec,
                      boxShadow:  activeCategory === cat.id ? '0 2px 8px rgba(13,148,136,0.22)' : 'none',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {cat.name}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* ── Menu sections ────────────────────────────────────────── */}
          <motion.div
            variants={{ show: { transition: { staggerChildren: 0.07 } } }}
            initial="hidden"
            animate="show"
            style={{ padding: '20px 20px 120px' }}
          >
            {normalizedQuery ? (
              filteredItems.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '72px 0 24px',
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: KYVRA.bg, border: `1px solid ${KYVRA.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 14, fontSize: 28,
                  }}>
                    🔍
                  </div>
                  <p style={{ margin: '0 0 4px', color: KYVRA.navy, fontWeight: 700, fontSize: 15 }}>
                    Sin resultados
                  </p>
                  <p style={{ margin: 0, color: KYVRA.textSec, fontSize: 13, textAlign: 'center' }}>
                    Probá con otro término de búsqueda
                  </p>
                </div>
              ) : (
                <motion.div variants={sectionVariants}>
                  <div style={{
                    background: KYVRA.white,
                    borderRadius: 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.07)',
                    border: `1px solid ${KYVRA.border}`,
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
              <>
                {categories.length === 0 && (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '72px 0 24px',
                  }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: KYVRA.bg, border: `1px solid ${KYVRA.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 14, fontSize: 28,
                    }}>
                      🍽️
                    </div>
                    <p style={{ margin: 0, color: KYVRA.textSec, fontWeight: 600, fontSize: 15 }}>
                      Sin categorías de menú todavía
                    </p>
                  </div>
                )}

                {categories.map(cat => (
                  <motion.div
                    key={cat.id}
                    variants={sectionVariants}
                    ref={el => { sectionRefs.current[cat.id] = el; }}
                    data-cat-id={cat.id}
                    style={{
                      marginBottom: 28,
                      scrollMarginTop: HEADER_H + TABS_H + 8,
                    }}
                  >
                    {/* Category header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      marginBottom: 12, paddingLeft: 4,
                    }}>
                      <div style={{ width: 3, height: 22, borderRadius: 2, background: KYVRA.teal, flexShrink: 0 }} />
                      <h2 style={{
                        fontSize: 19, fontWeight: 900, color: KYVRA.navy,
                        letterSpacing: '-0.025em', margin: 0, lineHeight: 1,
                      }}>
                        {cat.name}
                      </h2>
                      {(itemsByCategory[cat.id]?.length ?? 0) > 0 && (
                        <span style={{
                          fontSize: 11, fontWeight: 700, color: KYVRA.teal,
                          background: KYVRA.tealBg,
                          padding: '2px 8px', borderRadius: 999,
                        }}>
                          {itemsByCategory[cat.id].length}
                        </span>
                      )}
                    </div>

                    {/* Items card */}
                    <div style={{
                      background: KYVRA.white,
                      borderRadius: 20,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.07)',
                      border: `1px solid ${KYVRA.border}`,
                      padding: '0 16px',
                    }}>
                      {(itemsByCategory[cat.id] || []).length === 0 ? (
                        <p style={{
                          padding: '18px 0', fontSize: 13,
                          color: KYVRA.textMuted, fontStyle: 'italic', margin: 0,
                        }}>
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

          {/* ── Product modal ─────────────────────────────────────────── */}
          <AnimatePresence>
            {modalItem && (
              <ProductModal
                item={modalItem}
                restaurant={restaurant}
                onClose={() => setModalItem(null)}
              />
            )}
          </AnimatePresence>

        </div>{/* /max-width container */}
      </div>{/* /bg wrapper */}

      {/* ── Cart bar — centered on desktop, full-width on mobile ──── */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed',
              bottom: 'calc(12px + env(safe-area-inset-bottom))',
              zIndex: 45,
              left: '50%', transform: 'translateX(-50%)',
              width: 'calc(100% - 32px)', maxWidth: 608,
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              boxShadow: '0 -4px 32px rgba(0,0,0,0.30), 0 8px 40px rgba(0,0,0,0.24), 0 0 0 1px rgba(255,255,255,0.06)',
              borderRadius: 20,
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
              padding: '10px 10px 10px 20px',
            }}
          >
            <motion.button
              whileTap={{ scale: isOpen ? 0.97 : 1 }}
              onClick={() => isOpen && navigate('/carrito')}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: isOpen
                  ? 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)'
                  : 'rgba(255,255,255,0.10)',
                color: isOpen ? '#fff' : 'rgba(255,255,255,0.35)',
                fontWeight: 800, fontSize: 15,
                padding: '14px 22px',
                borderRadius: 999, border: 'none',
                cursor: isOpen ? 'pointer' : 'not-allowed',
                boxShadow: isOpen ? '0 4px 20px rgba(13,148,136,0.45)' : 'none',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: 'background 0.18s, box-shadow 0.18s',
              }}
            >
              <ShoppingCart size={18} strokeWidth={2.2} />
              Ver carrito
            </motion.button>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{
                fontSize: 19, fontWeight: 900, color: '#5EEAD4',
                margin: 0, lineHeight: 1.15, letterSpacing: '-0.025em',
              }}>
                ${total.toLocaleString('es-AR')}
              </p>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                {count} {count === 1 ? 'producto' : 'productos'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
