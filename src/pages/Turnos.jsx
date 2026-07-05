import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, X, ChevronRight, CalendarClock, LayoutGrid } from 'lucide-react';
import { supabase } from '../lib/supabase.js';

export const CATEGORY_INFO = {
  peluqueria:  { label: 'Peluquería',  emoji: '💇', bg: '#EFF6FF', color: '#2563EB' },
  barberia:    { label: 'Barbería',    emoji: '💈', bg: '#EFF6FF', color: '#2563EB' },
  estetica:    { label: 'Estética',    emoji: '💆', bg: '#FEF2F2', color: '#DC2626' },
  unas:        { label: 'Uñas',        emoji: '💅', bg: '#FFF1F2', color: '#E11D48' },
  spa:         { label: 'Spa',         emoji: '🧖', bg: '#ECFDF5', color: '#059669' },
  taller:      { label: 'Taller',      emoji: '🔧', bg: '#FFF7ED', color: '#EA580C' },
  medico:      { label: 'Médico',      emoji: '🩺', bg: '#EFF6FF', color: '#0284C7' },
  veterinaria: { label: 'Veterinaria', emoji: '🐾', bg: '#F0FDF4', color: '#16A34A' },
  gimnasio:    { label: 'Gimnasio',    emoji: '🏋️', bg: '#FEF2F2', color: '#DC2626' },
  lavadero:    { label: 'Lavadero',    emoji: '🚗', bg: '#ECFEFF', color: '#0891B2' },
  otro:        { label: 'Otro',        emoji: '📅', bg: '#F3F4F6', color: '#6B7280' },
};

// Imágenes ilustrativas por categoría, usadas cuando el negocio no tiene logo propio
const CATEGORY_IMAGES = {
  estetica:    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80',
  peluqueria:  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80',
  taller:      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=80',
  veterinaria: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&q=80',
};

const FILTER_CATEGORIES = [
  { key: 'peluqueria',  label: 'Peluquería',  image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80' },
  { key: 'estetica',    label: 'Estética',    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80' },
  { key: 'taller',      label: 'Taller',      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=80' },
  { key: 'veterinaria', label: 'Veterinaria', image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&q=80' },
  { key: 'lavadero',    label: 'Lavadero',    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' },
  { key: 'Todos',       label: 'Todos' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
};

export default function Turnos() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState('Todos');

  useEffect(() => {
    supabase.from('appointment_businesses').select('*').eq('is_active', true).order('name')
      .then(({ data, error }) => {
        if (!error && data) setBusinesses(data);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    let list = businesses;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.name.toLowerCase().includes(q) ||
        (b.description || '').toLowerCase().includes(q) ||
        (CATEGORY_INFO[b.category]?.label || b.category || '').toLowerCase().includes(q)
      );
    }

    if (catFilter !== 'Todos') list = list.filter(b => b.category === catFilter);

    return list;
  }, [businesses, search, catFilter]);

  return (
    <div style={{ background: '#FFF8F8', minHeight: '100%' }}>

      {/* Header rojo con título y buscador */}
      <div
        style={{ background: 'linear-gradient(180deg, #D32F2F 0%, #B71C1C 100%)' }}
        className="px-4 pt-4 pb-5"
      >
        <h1 className="text-white font-extrabold text-2xl tracking-tight mb-3">Turnos</h1>
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Peluquerías, talleres, turnos..."
            className="w-full bg-white rounded-xl text-sm border-none outline-none"
            style={{ padding: '11px 16px 11px 38px', boxSizing: 'border-box' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-4">

        {/* Grid de categorías */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {FILTER_CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setCatFilter(cat.key)}
              className="bg-white shadow-sm border border-slate-50 rounded-xl overflow-hidden flex flex-col active:scale-95 transition-transform duration-150"
            >
              <div className="aspect-square w-full p-2">
                {cat.image ? (
                  <img src={cat.image} alt={cat.label} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-primary-bg flex items-center justify-center">
                    <LayoutGrid size={26} className="text-primary" strokeWidth={2} />
                  </div>
                )}
              </div>
              <span className="text-[11px] font-semibold text-center text-slate-600 py-1.5 truncate px-1">
                {cat.label}
              </span>
            </button>
          ))}
        </div>

        {/* Chips de filtro */}
        <div
          className="sticky top-0 z-10 -mx-4 px-4 py-2 mb-4 flex gap-2 overflow-x-auto bg-[#FFF8F8]/80 backdrop-blur-sm"
          style={{ scrollbarWidth: 'none' }}
        >
          {FILTER_CATEGORIES.map(cat => {
            const active = catFilter === cat.key;
            return (
              <motion.button
                key={cat.key}
                whileTap={{ scale: 0.94 }}
                onClick={() => setCatFilter(cat.key)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                  active
                    ? 'bg-[#D32F2F] text-white shadow-[0_4px_12px_rgba(211,47,47,0.35)]'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {cat.label}
              </motion.button>
            );
          })}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl animate-pulse bg-gray-200" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CalendarClock size={48} strokeWidth={1} />
            <p className="mt-3 text-gray-500 font-medium">Sin resultados</p>
            {(search || catFilter !== 'Todos') && (
              <button
                onClick={() => { setSearch(''); setCatFilter('Todos'); }}
                className="mt-2 text-primary font-bold text-sm"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            className="space-y-3"
          >
            {filtered.map(b => {
              const info = CATEGORY_INFO[b.category] || CATEGORY_INFO.otro;
              const image = b.logo_url || CATEGORY_IMAGES[b.category];
              return (
                <motion.div key={b.id} variants={cardVariants}>
                  <Link
                    to={`/turnos/${b.id}`}
                    className="group flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-50 transition-shadow"
                    style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                  >
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl shrink-0 overflow-hidden"
                      style={{ background: info.bg }}
                    >
                      {image ? (
                        <img src={image} alt={b.name} className="w-full h-full object-cover" />
                      ) : info.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{b.name}</p>
                      {b.description && <p className="text-xs text-gray-400 truncate mt-0.5">{b.description}</p>}
                      <span className="inline-block text-xs mt-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        {info.label}
                      </span>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 shrink-0 transition-colors group-hover:text-primary" />
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
