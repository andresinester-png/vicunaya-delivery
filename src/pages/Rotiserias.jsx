import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, SlidersHorizontal, ChevronDown, X, Check, Search, Bell, ShoppingBag, Star, Flame, Heart, DeliveryDining } from 'lucide-react';
import { supabase } from '../lib/supabase.js';

const DEMO_RESTAURANTS = [
  { id:'demo-1', name:'La Rotisería de Don Carlos', category:'Rotisería', tags:'Rotisería, Milanesas, Pollos', rating:4.8, delivery_time:25, delivery_price:0,   min_order:1500, is_active:true,  image_url:null, promo:'20% OFF', featured:true },
  { id:'demo-2', name:'Rotisería Los Hermanos',     category:'Rotisería', tags:'Rotisería, Minutas',          rating:4.6, delivery_time:35, delivery_price:400, min_order:1200, is_active:true,  image_url:null, promo:null,     featured:false },
  { id:'demo-3', name:'El Buen Gusto',              category:'Empanadas', tags:'Empanadas, Locro',            rating:4.9, delivery_time:30, delivery_price:250, min_order:800,  is_active:true,  image_url:null, promo:'10% OFF', featured:false },
  { id:'demo-4', name:'Pizza & Co.',                category:'Pizza',     tags:'Pizza, Pizzas a la piedra',   rating:4.5, delivery_time:20, delivery_price:300, min_order:1200, is_active:true,  image_url:null, promo:null,     featured:false },
  { id:'demo-5', name:'La Parrilla del Sur',        category:'Parrilla',  tags:'Parrilla, Asado, Carnes',     rating:4.7, delivery_time:40, delivery_price:500, min_order:2000, is_active:false, image_url:null, promo:null,     featured:false },
];

const SORT_OPTIONS = [
  { id:'relevance', label:'Relevancia' },
  { id:'rating',    label:'Mejor puntuación' },
  { id:'time',      label:'Menor tiempo' },
  { id:'delivery',  label:'Menor envío' },
];

const CATEGORIES = [
  { id:'Todos',     label:'Todos',     icon:'restaurant',         active: true  },
  { id:'Café',      label:'Café & Deli', img:'https://lh3.googleusercontent.com/aida-public/AB6AXuC644a3B293g3-fzwJUf-5nTko6ZGhRBZfc9uiyszTp4H94jQ-gETI_TFPxs1W7CiPeOxE4KrtGTIgWv0F-A_tfcg5kq9T1xZgrxld9fQApR4f1CAQEDTC4Qc5z4SfXXbfvrtrVqVg29LAQ2ipbsV9JSZz__YXhB0MW_llGsuvnhA-sZm6zqMAAnwQRTrKU3D2sAWfp6OyLKkQr-S2XGmMURhu4rf-DMAyjWYRcoMaImechqVDx0JCH2zrzV5rGU_6FDJibEpWeSxRI' },
  { id:'Empanadas', label:'Empanadas',  img:'https://lh3.googleusercontent.com/aida/AP1WRLsF8g25q9zzjewJoYDuzt9P6VHhROMrTCzpRGxOFXz-KargpD9l9YqOD6MUq4xR9JAa2hRSi8tE29p5zbZiLBawIRhjTVjtMG4WakiipIGAN9vTMRLVhA0vH_gRCyesFMtH3_mSQwufLuTrMrGnVh9HCIZo5sEzlifBIEd0Km4XUom88DCmnDDRxgTyEDrf4HwcBTcHJF60M2a6XZN4_YCygxubUcd4XBGgQq7EZgRuiMA_DaWBDPpvawlC' },
  { id:'Pizza',     label:'Pizza',      img:'https://lh3.googleusercontent.com/aida/AP1WRLt2hfS7nG_MPKcxQt5drIIWkmBiRFzXgV_iec3sO25LWTCKz-NBMW9ggjBGf6OcH0TB-bj1wCRrMMMg7wRxv2YYyx-rSNofBWqV8DP2rXZSfKcVUhvLm-xA4l76bdLaJdFbH-k4qIyqcf2OD_ga0F2ktQXDBgTEJX6AjzFt8oc8ky71kG0RBIOVjyl-dTixl15ai4e-v4rVpLSLTl1cHTPI4g0FtqMchU047MiXEoBN-3NTs2Es0PTCFCy9' },
  { id:'Parrilla',  label:'Parrilla',   img:'https://lh3.googleusercontent.com/aida/AP1WRLtJW0btAnqN6wtNQ9MxQ3jDa9tkruGHWwhM8asYCsnXDWN_LrPJw1tGCoKs--Ga3cZZPjI27CvLWQXgDvTLtX20Ti7dJq7n9Ln84VHXtGrrGqg-k2qxxk-eSa3kjO-0-qQX-gjhIAfF1u27cv9i529jLrdqXOrh3DWJWmY8e_NtqvKh8iM4OGGk-GAQP2zTGwWAt3VhZ5nbEIB9jM5xxx47tianzNJoyTnhXkfYrNHupZPI9xnttvMiwIcV' },
  { id:'Rotisería', label:'Lomitos',    img:'https://lh3.googleusercontent.com/aida-public/AB6AXuDBXP96Yc857UOzW4XLmmeq_pYvR_gdQ3FlpHerjxep7D5AoakMWFDWsgjz9AymSzrjXBkDq_YfqgTY1SGZEv24mNUT9Rxjv14wO8wnzy1VDyrN6G5vvD-WYQO06PtKtLH0HxworEN2dTL9OGHv0CgkpDsvtDR-Xxi0_h6c0C_OOEiabYzcD0Aqk1-N35M6HMCHSE51mb9WhRPo5VsNPprptX6HXTMRBonbBqC3d5EQ4BmmoorGMWcr2aRnE2UVqTW6eVPBy6VUQQUh' },
  { id:'Bebidas',   label:'Bebidas',    img:'https://lh3.googleusercontent.com/aida-public/AB6AXuA4WfUPUZssd7XXSwzYFyEjk47A0IfsZZfhh--RSa4QXVizLe7YOSKnEBZBMfgXFFImJO3byCOD_Qdw_S8nJQ-mVnciz36O69pxiYYhfbygjp6u0oDGS3aClGz9QC1B3Q13NOhMe4T88C445IdDWIeWIfqQx-DhlZfg8lUX9vO9vPIn40734P1GgGnHCBYLetU8jFu4-tybQcSaMxLBntrh0NxPKzvkwklWpQSSIaGCOyW_vLQR9OvQ2pmx9MWxd1cvWF4PSNdFezAP' },
  { id:'Helados',   label:'Helados',    img:'https://lh3.googleusercontent.com/aida-public/AB6AXuBv7yOHl7y0XboUsKxjWNmX1m9XRetNszCe1RaiZepbqkdISMo-zUU46A6j_EemDesBjBzYt-UUpVVbWS-s_NqqP2zyOOtCk6boPX0_hWxr1O_OzeSg2hcKodJ1b6Y8Ox1q4-iQwe-roKaBTKKo1ZsVJwvrBcER5t7Ih5NRLWi913Jpy12FCxoHpdFBJlkXPuRve_0BF4l-2VeE3SIBwmtDjem8YbOf5WG33n_i2q0ZJVR7t9mQyujE9coBulRjg5y-8DlNJL-Xvt5P' },
];

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #fb923c, #ef4444)',
  'linear-gradient(135deg, #f472b6, #e11d48)',
  'linear-gradient(135deg, #34d399, #0d9488)',
  'linear-gradient(135deg, #60a5fa, #6366f1)',
  'linear-gradient(135deg, #a78bfa, #7c3aed)',
];

const CARD_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBQSUDo0rrytzIN4OdAzOimyzl04-z2sL8iKj-U5aN-B5_hOHukgXojpTzr-t-srDx6GSqewr292Y83es-yjA3jruRQQFt9GJ8vkc7a4NDW_9tEntSgRNAw7A5GLfZHiQ8aJjtuzXgCxyngcESSaoJDp-YErfkI67OW2Mf0ayZNxs4Z4NfoJStTnsxaQpAYo9zrgL4RWmuA8z3nbFaWPM2oJIJ22mqWk8aqhJ_KftClsgyCA2JYlLj8sqB9PkiqgGAb5zMPu0C-fcYJ',
  'https://lh3.googleusercontent.com/aida/AP1WRLtJW0btAnqN6wtNQ9MxQ3jDa9tkruGHWwhM8asYCsnXDWN_LrPJw1tGCoKs--Ga3cZZPjI27CvLWQXgDvTLtX20Ti7dJq7n9Ln84VHXtGrrGqg-k2qxxk-eSa3kjO-0-qQX-gjhIAfF1u27cv9i529jLrdqXOrh3DWJWmY8e_NtqvKh8iM4OGGk-GAQP2zTGwWAt3VhZ5nbEIB9jM5xxx47tianzNJoyTnhXkfYrNHupZPI9xnttvMiwIcV',
];

function RestaurantCard({ restaurant, index, onClick }) {
  const r = restaurant;
  const closed = !r.is_active;
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const cardImg = r.image_url || CARD_IMAGES[index % CARD_IMAGES.length];

  return (
    <motion.article
      whileTap={{ scale: closed ? 1 : 0.98 }}
      onClick={() => !closed && onClick && onClick(r)}
      className="bg-white rounded-2xl overflow-hidden shadow-sm group"
      style={{ cursor: closed ? 'default' : 'pointer', opacity: closed ? 0.75 : 1 }}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: closed ? 0.75 : 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      {/* Imagen */}
      <div className="relative h-[150px] w-full flex items-center justify-center" style={{ background: gradient }}>
        <div className="absolute inset-0 bg-black/5" />
        <img
          src={cardImg}
          alt={r.name}
          className="w-40 h-40 object-contain group-hover:scale-110 transition-transform duration-300"
          onError={e => { e.target.style.display = 'none'; }}
        />

        {/* Overlay cerrado */}
        {closed && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="px-4 py-2 bg-white/90 backdrop-blur text-slate-900 text-sm font-semibold rounded-full shadow-lg">
              Abre a las 18:00 hs
            </span>
          </div>
        )}

        {/* Badges */}
        {!closed && (
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {r.promo && (
              <span className="px-2 py-1 bg-white text-red-600 text-[11px] font-bold rounded-lg shadow-sm">
                {r.promo}
              </span>
            )}
            {r.featured && (
              <span className="px-2 py-1 bg-amber-400 text-white text-[11px] font-bold rounded-lg shadow-sm flex items-center gap-1">
                <span style={{ fontSize: 12 }}>🔥</span> Más pedido
              </span>
            )}
          </div>
        )}

        <button
          className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white"
          onClick={e => e.stopPropagation()}
        >
          <span style={{ fontSize: 18 }}>♡</span>
        </button>
      </div>

      {/* Info */}
      <div className={`p-4 ${closed ? 'bg-slate-50/50' : ''}`}>
        <h4 className={`text-[18px] font-bold leading-tight ${closed ? 'text-slate-500' : 'text-slate-900'}`}>
          {r.name}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <span className={`flex items-center gap-1 ${closed ? 'text-slate-400' : 'text-amber-500'}`}>
            <span style={{ fontSize: 16 }}>★</span>
            <span className="text-sm font-semibold">{r.rating}</span>
          </span>
          <span className="text-slate-300">•</span>
          <span className={`text-sm ${closed ? 'text-slate-400' : 'text-slate-500'}`}>
            {closed ? 'Cerrado ahora' : `${r.delivery_time}–${r.delivery_time + 10} min`}
          </span>
        </div>
        {!closed && (
          <div className="mt-3">
            {r.delivery_price === 0 ? (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-full">
                Envío gratis
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-500 text-sm">
                🛵 Envío ${r.delivery_price}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}

function RestaurantSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
      <div className="h-[150px] bg-slate-200" />
      <div className="p-4 space-y-2">
        <div className="h-5 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
  );
}

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

  const filtered = useMemo(() => {
    let list = restaurants;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.category || '').toLowerCase().includes(q) ||
        (r.tags || '').toLowerCase().includes(q)
      );
    }
    if (catFilter !== 'Todos') list = list.filter(r => r.category === catFilter);
    if (sortBy === 'rating')   list = [...list].sort((a,b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sortBy === 'time')     list = [...list].sort((a,b) => (a.delivery_time ?? 999) - (b.delivery_time ?? 999));
    if (sortBy === 'delivery') list = [...list].sort((a,b) => (a.delivery_price ?? 999) - (b.delivery_price ?? 999));
    return list;
  }, [restaurants, search, catFilter, sortBy]);

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-[390px] overflow-hidden pb-24" style={{ background: '#F5F5F5', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Header ── */}
      <header className="px-4 pt-6 pb-6 shadow-sm" style={{ backgroundColor: '#e31b23' }}>
        <div className="flex items-center justify-between text-white mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-full transition-colors"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <span style={{ fontSize: 22 }}>←</span>
          </button>
          <img
            src="https://hvmdumuedqfoifgayleh.supabase.co/storage/v1/object/public/IMAGES/ChatGPT%20Image%2012%20may%202026,%2019_14_30.png"
            alt="VicuñaYa"
            className="h-14 w-auto object-contain"
            onError={e => { e.target.style.display='none'; }}
          />
          <div className="flex items-center gap-2">
            <button className="relative flex items-center justify-center w-10 h-10 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <span style={{ fontSize: 20 }}>🔔</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full" style={{ outline: '2px solid #e31b23' }} />
            </button>
            <button className="flex items-center justify-center w-10 h-10 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <span style={{ fontSize: 20 }}>🛍️</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-2">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: 18 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Locales, platos y productos"
            className="w-full h-12 pl-12 pr-10 bg-white border-none rounded-full shadow-lg text-sm focus:outline-none focus:ring-2 placeholder:text-slate-400"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#111' }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">✕</button>
          )}
        </div>
      </header>

      <div className="px-4 mt-6 space-y-6">

        {/* ── Promo Banner ── */}
        <section>
          <div className="relative rounded-2xl p-5 h-40 flex items-center justify-between overflow-hidden shadow-lg" style={{ background: 'linear-gradient(135deg, #e31b23, #be123c)' }}>
            <div className="relative z-10 max-w-[65%]">
              <p className="text-white/80 text-[11px] font-semibold uppercase tracking-wider mb-1">Oferta del día</p>
              <h3 className="text-white text-[18px] font-bold leading-tight">Envío gratis en tu primer pedido</h3>
              <p className="text-white/80 text-[13px] mt-1">Pedidos desde $3.000</p>
            </div>
            <button className="relative z-10 bg-white text-red-600 text-sm font-bold px-5 py-2.5 rounded-full shadow-sm active:scale-95 transition-transform">
              Lo quiero
            </button>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          </div>
        </section>

        {/* ── Categorías ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold text-slate-900">Categorías</h2>
            <span className="text-sm font-semibold" style={{ color: '#e31b23' }}>Ver todas</span>
          </div>
          <div className="grid grid-cols-4 gap-y-4 gap-x-2">
            {CATEGORIES.map(cat => {
              const active = catFilter === cat.id;
              return (
                <motion.div
                  key={cat.id}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setCatFilter(cat.id)}
                  className="flex flex-col items-center gap-1 cursor-pointer"
                >
                  <div
                    className="w-full aspect-square bg-white rounded-2xl flex items-center justify-center shadow-sm overflow-hidden transition-transform"
                    style={{ border: active ? '2px solid #e31b23' : '1px solid #f1f5f9', background: active ? '#fff5f5' : '#fff' }}
                  >
                    {cat.img ? (
                      <img src={cat.img} alt={cat.label} className="w-full h-full object-cover" />
                    ) : (
                      <span style={{ fontSize: 28 }}>🍽️</span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-center leading-tight" style={{ color: active ? '#e31b23' : '#64748b' }}>
                    {cat.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── Ordenar ── */}
        <div className="flex items-center gap-2 relative">
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => setSortOpen(v => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm text-sm font-semibold"
              style={{ color: sortBy !== 'relevance' ? '#e31b23' : '#374151', borderColor: sortBy !== 'relevance' ? '#e31b23' : '#e2e8f0' }}
            >
              ⚙️ {SORT_OPTIONS.find(o => o.id === sortBy)?.label}
              <span style={{ fontSize: 12, transform: sortOpen ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>▾</span>
            </motion.button>

            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-2 left-0 bg-white rounded-2xl shadow-xl border border-slate-100 min-w-[190px] z-50 overflow-hidden"
                >
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { setSortBy(opt.id); setSortOpen(false); }}
                      className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                      style={{ color: sortBy === opt.id ? '#e31b23' : '#374151', background: sortBy === opt.id ? '#fff5f5' : '#fff' }}
                    >
                      {opt.label}
                      {sortBy === opt.id && <span>✓</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm text-sm font-semibold text-slate-700">
            Filtros
          </button>

          <span className="ml-auto text-sm text-slate-400 font-medium">
            {loading ? '…' : `${filtered.length} lugares`}
          </span>
        </div>

        {/* ── Lista ── */}
        <section className="space-y-4 pb-4" onClick={() => sortOpen && setSortOpen(false)}>
          {loading ? (
            <>
              <RestaurantSkeleton />
              <RestaurantSkeleton />
              <RestaurantSkeleton />
            </>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 text-slate-400"
            >
              <div className="text-5xl mb-3">🍽️</div>
              <p className="font-bold text-slate-500">Sin resultados</p>
              <button
                onClick={() => { setSearch(''); setCatFilter('Todos'); }}
                className="mt-2 text-sm font-bold"
                style={{ color: '#e31b23', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Limpiar filtros
              </button>
            </motion.div>
          ) : (
            filtered.map((r, i) => (
              <RestaurantCard
                key={r.id}
                restaurant={r}
                index={i}
                onClick={() => navigate(`/rotiserias/${r.id}`)}
              />
            ))
          )}
        </section>
      </div>

      {/* ── Bottom Nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 mx-auto max-w-[390px] bg-white border-t border-slate-100 px-6 py-3 flex justify-around items-center z-50 rounded-t-2xl" style={{ boxShadow: '0 -4px 12px rgba(0,0,0,0.05)' }}>
        <button onClick={() => navigate('/')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-red-600 transition-colors">
          <span style={{ fontSize: 22 }}>🏠</span>
          <span className="text-[10px] font-medium">Inicio</span>
        </button>
        <button onClick={() => navigate('/encomiendas')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-red-600 transition-colors">
          <span style={{ fontSize: 22 }}>📦</span>
          <span className="text-[10px] font-medium">Envíos</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-white px-5 py-2 rounded-full -translate-y-4 shadow-lg" style={{ background: '#e31b23' }}>
          <span style={{ fontSize: 22 }}>🍽️</span>
          <span className="text-[10px] font-bold">Pedidos</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-red-600 transition-colors">
          <span style={{ fontSize: 22 }}>🛍️</span>
          <span className="text-[10px] font-medium">Tiendas</span>
        </button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-red-600 transition-colors">
          <span style={{ fontSize: 22 }}>👤</span>
          <span className="text-[10px] font-medium">Perfil</span>
        </button>
      </nav>
    </div>
  );
}
