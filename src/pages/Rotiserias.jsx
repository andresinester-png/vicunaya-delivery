import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Search, SlidersHorizontal, ChevronDown, X, Check } from 'lucide-react';
import RestaurantCard, { RestaurantSkeleton } from '../components/RestaurantCard.jsx';
import { supabase } from '../lib/supabase.js';
import bgImage from '../screen.png';

const DEMO_RESTAURANTS = [
  { id:'demo-1', name:'La Rotisería de Don Carlos', category:'Rotisería', tags:'Rotisería, Milanesas, Pollos', rating:4.8, delivery_time:25, delivery_price:350, min_order:1500, is_active:true,  image_url:null },
  { id:'demo-2', name:'Rotisería Los Hermanos',     category:'Rotisería', tags:'Rotisería, Minutas',          rating:4.6, delivery_time:35, delivery_price:400, min_order:1200, is_active:true,  image_url:null },
  { id:'demo-3', name:'El Buen Gusto',              category:'Empanadas', tags:'Empanadas, Locro',            rating:4.9, delivery_time:30, delivery_price:250, min_order:800,  is_active:true,  image_url:null },
  { id:'demo-4', name:'Pizza & Co.',                category:'Pizza',     tags:'Pizza, Pizzas a la piedra',   rating:4.5, delivery_time:20, delivery_price:300, min_order:1200, is_active:true,  image_url:null },
  { id:'demo-5', name:'La Parrilla del Sur',        category:'Parrilla',  tags:'Parrilla, Asado, Carnes',     rating:4.7, delivery_time:40, delivery_price:500, min_order:2000, is_active:false, image_url:null },
];

const SORT_OPTIONS = [
  { id:'relevance',  label:'Relevancia'       },
  { id:'rating',     label:'Mejor puntuación' },
  { id:'time',       label:'Menor tiempo'     },
  { id:'delivery',   label:'Menor envío'      },
];

const ALL_CATS = ['Todos','Rotisería','Pizza','Empanadas','Parrilla','Sushi','Vegano','Bebidas'];

const CATEGORIES = [
  { label:'Todos',     icon:'🍽️' },
  { label:'Empanadas', image:'https://lh3.googleusercontent.com/aida/AP1WRLsF8g25q9zzjewJoYDuzt9P6VHhROMrTCzpRGxOFXz-KargpD9l9YqOD6MUq4xR9JAa2hRSi8tE29p5zbZiLBawIRhjTVjtMG4WakiipIGAN9vTMRLVhA0vH_gRCyesFMtH3_mSQwufLuTrMrGnVh9HCIZo5sEzlifBIEd0Km4XUom88DCmnDDRxgTyEDrf4HwcBTcHJF60M2a6XZN4_YCygxubUcd4XBGgQq7EZgRuiMA_DaWBDPpvawlC' },
  { label:'Pizza',     image:'https://lh3.googleusercontent.com/aida/AP1WRLt2hfS7nG_MPKcxQt5drIIWkmBiRFzXgV_iec3sO25LWTCKz-NBMW9ggjBGf6OcH0TB-bj1wCRrMMMg7wRxv2YYyx-rSNofBWqV8DP2rXZSfKcVUhvLm-xA4l76bdLaJdFbH-k4qIyqcf2OD_ga0F2ktQXDBgTEJX6AjzFt8oc8ky71kG0RBIOVjyl-dTixl15ai4e-v4rVpLSLTl1cHTPI4g0FtqMchU047MiXEoBN-3NTs2Es0PTCFCy9' },
  { label:'Parrilla',  image:'https://lh3.googleusercontent.com/aida/AP1WRLtJW0btAnqN6wtNQ9MxQ3jDa9tkruGHWwhM8asYCsnXDWN_LrPJw1tGCoKs--Ga3cZZPjI27CvLWQXgDvTLtX20Ti7dJq7n9Ln84VHXtGrrGqg-k2qxxk-eSa3kjO-0-qQX-gjhIAfF1u27cv9i529jLrdqXOrh3DWJWmY8e_NtqvKh8iM4OGGk-GAQP2zTGwWAt3VhZ5nbEIB9jM5xxx47tianzNJoyTnhXkfYrNHupZPI9xnttvMiwIcV' },
  { label:'Lomitos',   image:'https://lh3.googleusercontent.com/aida-public/AB6AXuDBXP96Yc857UOzW4XLmmeq_pYvR_gdQ3FlpHerjxep7D5AoakMWFDWsgjz9AymSzrjXBkDq_YfqgTY1SGZEv24mNUT9Rxjv14wO8wnzy1VDyrN6G5vvD-WYQO06PtKtLH0HxworEN2dTL9OGHv0CgkpDsvtDR-Xxi0_h6c0C_OOEiabYzcD0Aqk1-N35M6HMCHSE51mb9WhRPo5VsNPprptX6HXTMRBonbBqC3d5EQ4BmmoorGMWcr2aRnE2UVqTW6eVPBy6VUQQUh' },
  { label:'Bebidas',   image:'https://lh3.googleusercontent.com/aida-public/AB6AXuA4WfUPUZssd7XXSwzYFyEjk47A0IfsZZfhh--RSa4QXVizLe7YOSKnEBZBMfgXFFImJO3byCOD_Qdw_S8nJQ-mVnciz36O69pxiYYhfbygjp6u0oDGS3aClGz9QC1B3Q13NOhMe4T88C445IdDWIeWIfqQx-DhlZfg8lUX9vO9vPIn40734P1GgGnHCBYLetU8jFu4-tybQcSaMxLBntrh0NxPKzvkwklWpQSSIaGCOyW_vLQR9OvQ2pmx9MWxd1cvWF4PSNdFezAP' },
  { label:'Sushi',     icon:'🍣' },
  { label:'Vegano',    icon:'🥗' },
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

  useEffect(() => {
    setLoading(true);
    supabase.from('restaurants').select('*').order('name').then(({ data, error }) => {
      if (!error && data && data.length > 0) setRestaurants(data);
      setLoading(false);
    });
  }, []);

  // Categorías disponibles en los datos cargados
  const availableCats = useMemo(() => {
    const cats = new Set(restaurants.map(r => r.category).filter(Boolean));
    return ['Todos', ...ALL_CATS.filter(c => c !== 'Todos' && cats.has(c))];
  }, [restaurants]);

  const filtered = useMemo(() => {
    let list = restaurants;

    // Búsqueda
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.category || '').toLowerCase().includes(q) ||
        (r.tags || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q)
      );
    }

    // Categoría
    if (catFilter !== 'Todos') {
      list = list.filter(r => r.category === catFilter);
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
      <div style={{ background:'#e31b23', paddingBottom:14, position:'relative', zIndex:10 }}>
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

      {/* ── Grilla de categorías ── */}
      <div style={{ background:'#fff', padding:'16px 16px 6px', position:'relative', zIndex:9 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14 }}>
          {CATEGORIES.map(cat => {
            const active = catFilter === cat.label;
            return (
              <motion.button
                key={cat.label}
                whileTap={{ scale:0.92 }}
                onClick={() => setCatFilter(cat.label)}
                style={{
                  display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                  background:'none', border:'none', cursor:'pointer', padding:0,
                  fontFamily:"'Plus Jakarta Sans', sans-serif",
                }}
              >
                <div style={{
                  width:60, height:60, borderRadius:'50%',
                  border: active ? '2.5px solid #e31b23' : '2.5px solid #F3F4F6',
                  boxSizing:'border-box', padding:2,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  overflow:'hidden', background:'#F9FAFB',
                  transition:'border-color 0.15s',
                }}>
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.label}
                      style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }}
                    />
                  ) : (
                    <span style={{ fontSize:26 }}>{cat.icon}</span>
                  )}
                </div>
                <span style={{
                  fontSize:11.5, lineHeight:1.2, textAlign:'center',
                  fontWeight: active ? 800 : 600,
                  color: active ? '#e31b23' : '#374151',
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
                background: sortBy !== 'relevance' ? '#e31b23' : '#fff',
                color: sortBy !== 'relevance' ? '#fff' : '#374151',
                border: sortBy !== 'relevance' ? 'none' : '1.5px solid #E5E7EB',
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
                        background: sortBy === opt.id ? '#FEF2F2' : '#fff',
                        color: sortBy === opt.id ? '#e31b23' : '#374151',
                        border:'none', textAlign:'left',
                        fontSize:14, fontWeight: sortBy === opt.id ? 700 : 600,
                        cursor:'pointer', fontFamily:"'Plus Jakarta Sans', sans-serif",
                        borderBottom:'1px solid #F9FAFB',
                      }}
                    >
                      {opt.label}
                      {sortBy === opt.id && <Check size={15} color="#e31b23" strokeWidth={2.5} />}
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
                    background: active ? '#e31b23' : '#fff',
                    color: active ? '#fff' : '#374151',
                    border: active ? 'none' : '1.5px solid #E5E7EB',
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
      <div style={{ flex:1, padding:'16px 16px 24px', position:'relative', zIndex:5 }} onClick={() => sortOpen && setSortOpen(false)}>
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
              style={{ marginTop:8, color:'#e31b23', fontWeight:700, fontSize:14, background:'none', border:'none', cursor:'pointer', fontFamily:"'Plus Jakarta Sans', sans-serif" }}
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
    </div>
  );
}
