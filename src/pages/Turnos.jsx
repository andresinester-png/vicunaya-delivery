import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, X, ChevronRight, CalendarClock } from 'lucide-react';
import { supabase } from '../lib/supabase.js';

export const CATEGORY_INFO = {
  peluqueria:  { label: 'Peluquería',  emoji: '💇', bg: '#FDF2F8', color: '#DB2777' },
  barberia:    { label: 'Barbería',    emoji: '💈', bg: '#EFF6FF', color: '#2563EB' },
  estetica:    { label: 'Estética',    emoji: '💆', bg: '#F5F3FF', color: '#7C3AED' },
  unas:        { label: 'Uñas',        emoji: '💅', bg: '#FFF1F2', color: '#E11D48' },
  spa:         { label: 'Spa',         emoji: '🧖', bg: '#ECFDF5', color: '#059669' },
  taller:      { label: 'Taller',      emoji: '🔧', bg: '#FFF7ED', color: '#EA580C' },
  medico:      { label: 'Médico',      emoji: '🩺', bg: '#EFF6FF', color: '#0284C7' },
  veterinaria: { label: 'Veterinaria', emoji: '🐾', bg: '#F0FDF4', color: '#16A34A' },
  gimnasio:    { label: 'Gimnasio',    emoji: '🏋️', bg: '#FEF2F2', color: '#DC2626' },
  otro:        { label: 'Otro',        emoji: '📅', bg: '#F3F4F6', color: '#6B7280' },
};

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

  const availableCats = useMemo(() => {
    const cats = new Set(businesses.map(b => b.category).filter(Boolean));
    return ['Todos', ...cats];
  }, [businesses]);

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
    <div className="px-4 py-4">
      {/* Búsqueda */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Peluquerías, talleres, turnos..."
          className="input"
          style={{ paddingLeft: 38, paddingRight: search ? 36 : 16 }}
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

      {/* Chips de categoría */}
      {availableCats.length > 1 && (
        <div className="flex gap-2 overflow-x-auto mb-4 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          {availableCats.map(cat => {
            const active = catFilter === cat;
            const info = CATEGORY_INFO[cat];
            return (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.94 }}
                onClick={() => setCatFilter(cat)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold transition-colors"
                style={{
                  background: active ? '#e31b23' : '#fff',
                  color: active ? '#fff' : '#374151',
                  border: active ? 'none' : '1.5px solid #E5E7EB',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                {cat !== 'Todos' && <span>{info?.emoji ?? '📅'}</span>}
                {cat === 'Todos' ? 'Todos' : (info?.label ?? cat)}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-200" />)}
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
            return (
              <motion.div key={b.id} variants={cardVariants}>
                <Link to={`/turnos/${b.id}`} className="card flex items-center gap-3 p-3 hover:shadow-card-hover transition-all">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 overflow-hidden"
                    style={{ background: info.bg }}
                  >
                    {b.logo_url ? (
                      <img src={b.logo_url} alt={b.name} className="w-full h-full object-cover" />
                    ) : info.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{b.name}</p>
                    {b.description && <p className="text-xs text-gray-500 truncate mt-0.5">{b.description}</p>}
                    <span className="badge text-xs mt-1.5" style={{ background: info.bg, color: info.color }}>
                      {info.label}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
