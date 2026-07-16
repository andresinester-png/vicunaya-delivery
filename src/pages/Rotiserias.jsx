import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Search, SlidersHorizontal, ChevronDown, X, Check } from 'lucide-react';
import RestaurantCard, { RestaurantSkeleton } from '../components/RestaurantCard.jsx';
import BottomNav from '../components/BottomNav.jsx';
import { supabase } from '../lib/supabase.js';
import bgImage from '../screen.png';

const DEMO_RESTAURANTS = [
  { id:'demo-1', name:'La Rotisería de Don Carlos', category:['Rotisería'], tags:'Rotisería, Milanesas, Pollos', rating:4.8, delivery_time:25, delivery_price:350, min_order:1500, is_active:true,  image_url:null },
  { id:'demo-2', name:'Rotisería Los Hermanos',     category:['Rotisería'], tags:'Rotisería, Minutas',          rating:4.6, delivery_time:35, delivery_price:400, min_order:1200, is_active:true,  image_url:null },
  { id:'demo-3', name:'El Buen Gusto',              category:['Empanadas'], tags:'Empanadas, Locro',            rating:4.9, delivery_time:30, delivery_price:250, min_order:800,  is_active:true,  image_url:null },
  { id:'demo-4', name:'Pizza & Co.',                category:['Pizza'],     tags:'Pizza, Pizzas a la piedra',   rating:4.5, delivery_time:20, delivery_price:300, min_order:1200, is_active:true,  image_url:null },
  { id:'demo-5', name:'La Parrilla del Sur',        category:['Parrilla'],  tags:'Parrilla, Asado, Carnes',     rating:4.7, delivery_time:40, delivery_price:500, min_order:2000, is_active:false, image_url:null },
];

const SORT_OPTIONS = [
  { id:'relevance',  label:'Relevancia'       },
  { id:'rating',     label:'Mejor puntuación' },
  { id:'time',       label:'Menor tiempo'     },
  { id:'delivery',   label:'Menor envío'      },
];

const ALL_CATS = ['Todos','Rotisería','Pizza','Empanadas','Parrilla','Sushi','Vegano','Bebidas'];

const CATEGORIES = [
  { label:'Todos',      icon:'🍽️' },
  { label:'Café & Deli',image:'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80' },
  { label:'Bebidas',    image:'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80' },
  { label:'Empanadas',  image:'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80' },
  { label:'Pizza',      image:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80' },
  { label:'Lomitos',    image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
];

const BANNERS = [
  { id:1, title:'¡Envío gratis!',   subtitle:'En tu primer pedido de Rotiserías',     gradient:'linear-gradient(135deg, #006a61 0%, #0F172A 100%)' },
  { id:2, title:'2x1 en Empanadas', subtitle:'Hoy en locales seleccionados',          gradient:'linear-gradient(135deg, #0F172A 0%, #0b1220 100%)' },
];

const cardVariants = {
  hidden: { opacity:0, y:18 },
  show:   { opacity:1, y:0, transition:{ type:'spring', stiffness:260, damping:22 } },
};

export default function Rotiserias() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState(DEMO_RESTAURANTS);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [sortBy, setSortBy]           = useState('relevance');
  const [catFilter, setCatFilter]     = useState('Todos');
  const [sortOpen, setSortOpen]       = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);
  const [hoveredCat, setHoveredCat]   = useState(null);
  const [banners, setBanners]         = useState(BANNERS);
  const touchStartX = useRef(null);

  useEffect(() => {
    if (activeBanner >= banners.length) setActiveBanner(0);
    const interval = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % banners.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    setLoading(true);
    supabase.from('restaurants').select('*').eq('is_active', true).order('name').then(({ data, error }) => {
      if (!error && data && data.length > 0) setRestaurants(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    supabase.from('banners').select('*').eq('active', true).order('sort_order').then(({ data, error }) => {
      if (!error && data && data.length > 0) setBanners(data);
    });
  }, []);

  // Categorías disponibles en los datos cargados
  const availableCats = useMemo(() => {
    const cats = new Set(restaurants.flatMap(r => Array.isArray(r.category) ? r.category : (r.category ? [r.category] : [])));
    return ['Todos', ...ALL_CATS.filter(c => c !== 'Todos' && cats.has(c))];
  }, [restaurants]);

  const filtered = useMemo(() => {
    let list = restaurants;

    // Búsqueda
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => {
        const cats = Array.isArray(r.category) ? r.category.join(' ') : (r.category || '');
        return r.name.toLowerCase().includes(q) ||
          cats.toLowerCase().includes(q) ||
          (r.tags || '').toLowerCase().includes(q) ||
          (r.description || '').toLowerCase().includes(q);
      });
    }

    // Categoría
    if (catFilter !== 'Todos') {
      list = list.filter(r => Array.isArray(r.category) ? r.category.includes(catFilter) : r.category === catFilter);
    }

    // Ordenar
    if (sortBy === 'rating')   list = [...list].sort((a,b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sortBy === 'time')     list = [...list].sort((a,b) => (a.delivery_time ?? 999) - (b.delivery_time ?? 999));
    if (sortBy === 'delivery') list = [...list].sort((a,b) => (a.delivery_price ?? 999) - (b.delivery_price ?? 999));

    return list;
  }, [restaurants, search, catFilter, sortBy]);

  const currentSort = SORT_OPTIONS.find(o => o.id === sortBy);

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', position:'relative' }}>

      {/* ── Animación de scroll para imágenes de categorías ── */}
      <style>{`
        @keyframes categoryScroll {
          0%   { transform: translateY(0%); opacity: 1; }
          35%  { transform: translateY(-100%); opacity: 0; }
          36%  { transform: translateY(100%); opacity: 0; }
          50%  { transform: translateY(0%); opacity: 1; }
          100% { transform: translateY(0%); opacity: 1; }
        }
        .category-scroll-img {
          animation: categoryScroll 3.5s linear infinite;
        }
      `}</style>

      {/* ── Fondo fijo ── */}
      <img
        src={bgImage}
        alt=""
        aria-hidden
        style={{
          position:'fixed', top:0, left:0,
          width:'100%', height:'100%',
          objectFit:'cover', objectPosition:'center top',
          zIndex:0,
        }}
      />
      {/* Overlay oscuro para legibilidad */}
      <div aria-hidden style={{
        position:'fixed', inset:0,
        background:'rgba(0,0,0,0.45)',
        zIndex:1, pointerEvents:'none',
      }} />

      {/* ── Header rojo ── */}
      <div style={{ background:'#0D9488', paddingBottom:14, position:'relative', zIndex:10 }}>
        {/* Fila título */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px 0' }}>
          <motion.button
            whileTap={{ scale:0.88 }}
            onClick={() => navigate(-1)}
            style={{
              width:36, height:36, borderRadius:'50%',
              background:'rgba(255,255,255,0.18)', border:'none',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', flexShrink:0,
            }}
          >
            <ChevronLeft size={20} color="#fff" strokeWidth={2.5} />
          </motion.button>

          <div style={{ flex:1 }}>
            <h1 style={{ color:'#fff', fontSize:19, fontWeight:900, letterSpacing:'-0.02em', lineHeight:1, margin:0 }}>
              Rotiserías
            </h1>
            <p style={{ color:'rgba(255,255,255,0.72)', fontSize:12, fontWeight:600, marginTop:2 }}>
              {loading ? 'Cargando…' : `${filtered.length} lugares`}
            </p>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div style={{ padding:'10px 16px 0', position:'relative' }}>
          <Search
            size={15}
            style={{
              position:'absolute', left:28, top:'50%',
              transform:'translateY(-50%)', color:'#9CA3AF', pointerEvents:'none',
            }}
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Restaurantes, platos..."
            style={{
              width:'100%', padding:'11px 36px 11px 38px',
              borderRadius:14, border:'none', outline:'none',
              fontSize:14, fontFamily:"'Plus Jakarta Sans', sans-serif",
              background:'rgba(255,255,255,0.97)',
              boxSizing:'border-box', color:'#111',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position:'absolute', right:28, top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none', cursor:'pointer', padding:2,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}
            >
              <X size={14} color="#9CA3AF" />
            </button>
          )}
        </div>
      </div>

      {/* ── Carrusel de banners ── */}
      <div style={{ background:'#fff', padding:'16px 16px 0', position:'relative', zIndex:9 }}>
        <div
          style={{ overflow:'hidden', borderRadius:16 }}
          onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={e => {
            if (touchStartX.current === null) return;
            const delta = touchStartX.current - e.changedTouches[0].clientX;
            if (delta > 50) setActiveBanner(prev => (prev + 1) % banners.length);
            else if (delta < -50) setActiveBanner(prev => (prev - 1 + banners.length) % banners.length);
            touchStartX.current = null;
          }}
        >
          <div style={{
            display:'flex',
            transform:`translateX(-${activeBanner * 100}%)`,
            transition:'transform 0.5s ease',
          }}>
            {banners.map((banner, idx) => (
              <div
                key={banner.id}
                onClick={() => {
                  if (idx === 0) { navigate('/anunciate'); return; }
                  if (idx === 1) { navigate('/sorteo'); return; }
                  if (banner.link_type === 'url' && banner.link_url) {
                    window.open(banner.link_url, '_blank');
                  } else if (banner.link_type === 'page') {
                    navigate(`/banner/${banner.id}`);
                  }
                }}
                style={{
                  flex:'0 0 100%',
                  height:160, borderRadius:16, overflow:'hidden', position:'relative',
                  background: banner.image_url ? '#000' : banner.gradient,
                  display:'flex', flexDirection:'column', justifyContent:'center',
                  cursor: (idx === 0 || idx === 1 || (banner.link_type && banner.link_type !== 'none')) ? 'pointer' : 'default',
                }}
              >
                {banner.image_url && (
                  <img
                    src={banner.image_url}
                    alt=""
                    style={{
                      position:'absolute', inset:0,
                      width:'100%', height:'100%',
                      objectFit:'cover', objectPosition:'center',
                      zIndex:0,
                    }}
                  />
                )}
                <div style={{ position:'relative', zIndex:1, padding:'0 24px', boxSizing:'border-box' }}>
                  {banner.title && (
                    <h3 style={{ color:'#fff', fontSize:20, fontWeight:900, margin:0, letterSpacing:'-0.02em', textShadow: banner.image_url ? '0 1px 6px rgba(0,0,0,0.4)' : 'none' }}>
                      {banner.title}
                    </h3>
                  )}
                  {banner.subtitle && (
                    <p style={{ color:'rgba(255,255,255,0.85)', fontSize:13, fontWeight:600, marginTop:6, textShadow: banner.image_url ? '0 1px 6px rgba(0,0,0,0.4)' : 'none' }}>
                      {banner.subtitle}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots de paginación */}
        <div style={{ display:'flex', justifyContent:'center', gap:6, padding:'10px 0' }}>
          {banners.map((_, i) => (
            <div
              key={i}
              style={{
                width:6, height:6, borderRadius:'50%',
                background: i === activeBanner ? '#0D9488' : '#E9D5D8',
                transition:'background 0.2s',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Grilla de categorías ── */}
      <div style={{ background:'#fff', padding:'16px 16px 6px', position:'relative', zIndex:9 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14 }}>
          {CATEGORIES.map((cat, idx) => {
            const active = catFilter === cat.label;
            return (
              <motion.button
                key={cat.label}
                whileTap={{ scale:0.92 }}
                onClick={() => setCatFilter(cat.label)}
                style={{
                  display:'flex', flexDirection:'column', alignItems:'center', gap:8,
                  background:'none', border:'none', cursor:'pointer', padding:0,
                  fontFamily:"'Plus Jakarta Sans', sans-serif",
                }}
              >
                <div
                  onMouseEnter={() => setHoveredCat(cat.label)}
                  onMouseLeave={() => setHoveredCat(null)}
                  onTouchStart={() => setHoveredCat(cat.label)}
                  onTouchEnd={() => setHoveredCat(null)}
                  style={{
                    width:88, height:88, borderRadius:16,
                    border: active ? '2px solid #0F172A' : '2px solid transparent',
                    boxSizing:'border-box', padding:2,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    overflow:'hidden', background: active ? '#fff0f0' : '#EFEFEF',
                    transform: hoveredCat === cat.label ? 'scale(1.08)' : 'scale(1)',
                    boxShadow: hoveredCat === cat.label ? '0 6px 16px rgba(0,0,0,0.15)' : '0 0 0 rgba(0,0,0,0)',
                    transition:'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.15s, background 0.15s',
                  }}
                >
                  {cat.image ? (
                    <img
                      className="category-scroll-img"
                      src={cat.image}
                      alt={cat.label}
                      style={{
                        width:'100%', height:'130%', objectFit:'cover', borderRadius:0,
                        animationDelay:`${idx * 0.4}s`,
                      }}
                    />
                  ) : (
                    <span style={{ fontSize:26 }}>{cat.icon}</span>
                  )}
                </div>
                <span style={{
                  fontSize:13, lineHeight:1.2, textAlign:'center',
                  fontWeight: active ? 800 : 600,
                  color: active ? '#0F172A' : '#374151',
                }}>
                  {cat.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Filtros ── */}
      <div style={{
        background:'#fff',
        borderBottom:'1px solid #EBEBEB',
        padding:'10px 16px',
        position:'sticky', top:0, zIndex:30,
        backdropFilter:'blur(8px)',
      }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>

          {/* Botón Ordenar */}
          <div style={{ position:'relative', flexShrink:0 }}>
            <motion.button
              whileTap={{ scale:0.94 }}
              onClick={() => setSortOpen(v => !v)}
              style={{
                display:'flex', alignItems:'center', gap:5,
                padding:'7px 12px', borderRadius:20,
                background: sortBy !== 'relevance' ? '#0D9488' : '#fff',
                color: sortBy !== 'relevance' ? '#fff' : '#374151',
                border: sortBy !== 'relevance' ? 'none' : '1.5px solid #E9D5D8',
                fontSize:13, fontWeight:700, cursor:'pointer',
                fontFamily:"'Plus Jakarta Sans', sans-serif",
                boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <SlidersHorizontal size={13} strokeWidth={2.5} />
              {currentSort?.label ?? 'Ordenar'}
              <ChevronDown size={12} strokeWidth={2.5} style={{ transform: sortOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }} />
            </motion.button>

            {/* Dropdown Ordenar */}
            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity:0, y:-6, scale:0.97 }}
                  animate={{ opacity:1, y:0,  scale:1 }}
                  exit={{ opacity:0, y:-6, scale:0.97 }}
                  transition={{ duration:0.15 }}
                  style={{
                    position:'absolute', top:'calc(100% + 6px)', left:0,
                    background:'#fff', borderRadius:14,
                    boxShadow:'0 8px 32px rgba(0,0,0,0.14)',
                    border:'1px solid #F3F4F6',
                    minWidth:190, zIndex:100,
                    overflow:'hidden',
                  }}
                >
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { setSortBy(opt.id); setSortOpen(false); }}
                      style={{
                        display:'flex', alignItems:'center', justifyContent:'space-between',
                        width:'100%', padding:'12px 16px',
                        background: sortBy === opt.id ? '#FFF8F8' : '#fff',
                        color: sortBy === opt.id ? '#0F172A' : '#374151',
                        border:'none', textAlign:'left',
                        fontSize:14, fontWeight: sortBy === opt.id ? 700 : 600,
                        cursor:'pointer', fontFamily:"'Plus Jakarta Sans', sans-serif",
                        borderBottom:'1px solid #F9FAFB',
                      }}
                    >
                      {opt.label}
                      {sortBy === opt.id && <Check size={15} color="#0F172A" strokeWidth={2.5} />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chips de categoría – scroll horizontal */}
          <div style={{ display:'flex', gap:6, overflowX:'auto', flex:1, scrollbarWidth:'none' }}>
            {availableCats.map(cat => {
              const active = catFilter === cat;
              return (
                <motion.button
                  key={cat}
                  whileTap={{ scale:0.92 }}
                  onClick={() => setCatFilter(cat)}
                  style={{
                    flexShrink:0,
                    padding:'7px 13px', borderRadius:20,
                    background: active ? '#0D9488' : '#fff',
                    color: active ? '#fff' : '#374151',
                    border: active ? 'none' : '1.5px solid #E9D5D8',
                    fontSize:13, fontWeight:700, cursor:'pointer',
                    fontFamily:"'Plus Jakarta Sans', sans-serif",
                    boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                    transition:'background 0.15s, color 0.15s',
                  }}
                >
                  {cat}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Lista ── */}
      <div style={{ flex:1, padding:'16px 16px 80px', position:'relative', zIndex:5 }} onClick={() => sortOpen && setSortOpen(false)}>
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[...Array(3)].map((_,i) => <RestaurantSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity:0, scale:0.92 }}
            animate={{ opacity:1, scale:1 }}
            style={{ textAlign:'center', padding:'64px 0', color:'#9CA3AF' }}
          >
            <div style={{ fontSize:48, marginBottom:12 }}>🍽️</div>
            <p style={{ fontWeight:700, color:'#6B7280', fontSize:15 }}>Sin resultados</p>
            <button
              onClick={() => { setSearch(''); setCatFilter('Todos'); }}
              style={{ marginTop:8, color:'#0D9488', fontWeight:700, fontSize:14, background:'none', border:'none', cursor:'pointer', fontFamily:"'Plus Jakarta Sans', sans-serif" }}
            >
              Limpiar filtros
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show:{ transition:{ staggerChildren:0.07 } } }}
            style={{ display:'flex', flexDirection:'column', gap:14 }}
          >
            {filtered.map(r => (
              <motion.div key={r.id} variants={cardVariants}>
                <RestaurantCard restaurant={r} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}