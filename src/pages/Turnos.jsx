import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, X, ChevronRight, CalendarClock,
  LayoutGrid, Scissors, Eye, PawPrint, Car, Wrench,
} from 'lucide-react';
import { supabase } from '../lib/supabase.js';

const RED = '#D32F2F';

export const CATEGORY_INFO = {
  peluqueria:  { label: 'Peluquería',  emoji: '💇', Icon: Scissors,   bg: '#EFF6FF', color: '#2563EB' },
  barberia:    { label: 'Barbería',    emoji: '💈', Icon: Scissors,   bg: '#EFF6FF', color: '#2563EB' },
  estetica:    { label: 'Estética',    emoji: '💆', Icon: Eye,        bg: '#FEF2F2', color: '#DC2626' },
  unas:        { label: 'Uñas',        emoji: '💅', Icon: null,       bg: '#FFF1F2', color: '#E11D48' },
  spa:         { label: 'Spa',         emoji: '🧖', Icon: null,       bg: '#ECFDF5', color: '#059669' },
  taller:      { label: 'Taller',      emoji: '🔧', Icon: Wrench,     bg: '#FFF7ED', color: '#EA580C' },
  medico:      { label: 'Médico',      emoji: '🩺', Icon: null,       bg: '#EFF6FF', color: '#0284C7' },
  veterinaria: { label: 'Veterinaria', emoji: '🐾', Icon: PawPrint,   bg: '#F0FDF4', color: '#16A34A' },
  gimnasio:    { label: 'Gimnasio',    emoji: '🏋️', Icon: null,       bg: '#FEF2F2', color: '#DC2626' },
  lavadero:    { label: 'Lavadero',    emoji: '🚗', Icon: Car,        bg: '#ECFEFF', color: '#0891B2' },
  otro:        { label: 'Otro',        emoji: '📅', Icon: null,       bg: '#F3F4F6', color: '#6B7280' },
};

const CATEGORY_IMAGES = {
  estetica:    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80',
  peluqueria:  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80',
  taller:      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=80',
  veterinaria: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&q=80',
};

const FILTER_CATS = [
  { key: 'Todos',       label: 'Todos',       Icon: LayoutGrid },
  { key: 'peluqueria',  label: 'Peluquería',  Icon: Scissors   },
  { key: 'estetica',    label: 'Estética',    Icon: Eye        },
  { key: 'veterinaria', label: 'Veterinaria', Icon: PawPrint   },
  { key: 'lavadero',    label: 'Lavadero',    Icon: Car        },
  { key: 'taller',      label: 'Taller',      Icon: Wrench     },
];

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
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

      {/* Sub-header: extends MainLayout's red bar with title + search */}
      <div style={{ background: RED, padding: '2px 18px 18px' }}>
        <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', margin: '0 0 12px' }}>
          Turnos
        </h1>
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#8A8580', pointerEvents: 'none' }}
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Peluquerías, talleres, turnos..."
            style={{
              width: '100%', height: 46,
              background: '#fff', border: '1px solid #E9D5D8',
              borderRadius: 14, padding: '0 40px 0 42px',
              fontSize: 14, color: '#241F1D', outline: 'none',
              boxSizing: 'border-box',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                color: '#8A8580', background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '0 18px' }}>

        {/* Promo banner */}
        <div
          style={{
            marginTop: 16, height: 190, borderRadius: 20, overflow: 'hidden',
            position: 'relative', display: 'flex', alignItems: 'flex-end',
            backgroundImage: 'url(https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80)',
            backgroundSize: 'cover', backgroundPosition: 'center',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, rgba(211,47,47,0.88) 12%, rgba(183,28,28,0.28) 60%)',
          }} />
          <div style={{ position: 'relative', padding: '0 20px 20px' }}>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: 22, margin: 0, lineHeight: 1.2 }}>
              Reservá tu turno<br />en segundos
            </p>
            <p style={{ color: 'rgba(255,255,255,0.90)', fontWeight: 500, fontSize: 13, margin: '6px 0 14px' }}>
              Peluquerías, talleres y más,<br />sin esperar en el local.
            </p>
            <button
              style={{
                background: '#fff', color: RED, fontWeight: 700, fontSize: 13,
                border: 'none', borderRadius: 99, padding: '8px 18px', cursor: 'pointer',
              }}
            >
              Buscar turno
            </button>
          </div>
        </div>

        {/* Categories — horizontal scroll circular tiles */}
        <div style={{ marginTop: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontWeight: 800, fontSize: 16.5, color: '#241F1D' }}>Categorías</span>
            <button
              onClick={() => setCatFilter('Todos')}
              style={{ fontWeight: 700, fontSize: 12.5, color: RED, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Ver todas
            </button>
          </div>
          <div
            style={{
              display: 'flex', gap: 18, overflowX: 'auto', paddingBottom: 4,
              scrollbarWidth: 'none', marginLeft: -18, marginRight: -18, paddingLeft: 18, paddingRight: 18,
            }}
          >
            {FILTER_CATS.map(cat => {
              const active = catFilter === cat.key;
              const CatIcon = cat.Icon;
              return (
                <button
                  key={cat.key}
                  onClick={() => setCatFilter(cat.key)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                    flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  }}
                >
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: active ? RED : '#fff',
                    border: active ? 'none' : '1px solid #E9D5D8',
                    boxShadow: active ? '0 4px 14px rgba(211,47,47,0.38)' : '0 2px 8px rgba(0,0,0,0.06)',
                    color: active ? '#fff' : RED,
                    transition: 'all 0.18s',
                  }}>
                    {CatIcon && <CatIcon size={22} strokeWidth={2} />}
                  </div>
                  <span style={{
                    fontSize: 11.5,
                    fontWeight: active ? 700 : 600,
                    color: active ? '#241F1D' : '#5B5450',
                    whiteSpace: 'nowrap',
                  }}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter chips */}
        <div
          style={{
            display: 'flex', gap: 8, overflowX: 'auto', padding: '14px 0',
            scrollbarWidth: 'none', marginLeft: -18, marginRight: -18, paddingLeft: 18, paddingRight: 18,
          }}
        >
          {FILTER_CATS.map(cat => {
            const active = catFilter === cat.key;
            return (
              <motion.button
                key={cat.key}
                whileTap={{ scale: 0.94 }}
                onClick={() => setCatFilter(cat.key)}
                style={{
                  flexShrink: 0, padding: '8px 16px', borderRadius: 99,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  border: active ? 'none' : '1px solid #E9D5D8',
                  background: active ? RED : '#fff',
                  color: active ? '#fff' : '#5B5450',
                  boxShadow: active ? '0 4px 12px rgba(211,47,47,0.30)' : 'none',
                  transition: 'all 0.18s',
                }}
              >
                {cat.label}
              </motion.button>
            );
          })}
        </div>

        {/* Business list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 24 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse" style={{ height: 84, borderRadius: 16, background: '#E9D5D8', opacity: 0.5 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0 24px', color: '#B7B0A8' }}>
            <CalendarClock size={48} strokeWidth={1} />
            <p style={{ marginTop: 12, color: '#8A8580', fontWeight: 600, fontSize: 15 }}>
              Sin resultados
            </p>
            {(search || catFilter !== 'Todos') && (
              <button
                onClick={() => { setSearch(''); setCatFilter('Todos'); }}
                style={{ marginTop: 8, color: RED, fontWeight: 700, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}
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
            style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 24 }}
          >
            {filtered.map(b => {
              const info = CATEGORY_INFO[b.category] || CATEGORY_INFO.otro;
              const image = b.logo_url || CATEGORY_IMAGES[b.category];
              const FallbackIcon = info.Icon;
              return (
                <motion.div key={b.id} variants={cardVariants}>
                  <Link
                    to={`/turnos/${b.id}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: 10,
                      background: '#fff', borderRadius: 16, border: '1px solid #E9D5D8',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.06)', textDecoration: 'none',
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      width: 64, height: 64, borderRadius: 12, flexShrink: 0, overflow: 'hidden',
                      background: info.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {image ? (
                        <img src={image} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : FallbackIcon ? (
                        <FallbackIcon size={28} strokeWidth={1.5} color={info.color} />
                      ) : (
                        <span style={{ fontSize: 24 }}>{info.emoji}</span>
                      )}
                    </div>

                    {/* Text block */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontWeight: 700, fontSize: 14.5, color: '#241F1D',
                        margin: '0 0 3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {b.name}
                      </p>
                      {b.description && (
                        <p style={{
                          fontSize: 12, color: '#8A8580', margin: '0 0 6px',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {b.description}
                        </p>
                      )}
                      <span style={{
                        display: 'inline-block', fontSize: 10.5, fontWeight: 700,
                        padding: '3px 8px', borderRadius: 99, background: '#FBEAEA', color: RED,
                      }}>
                        {info.label}
                      </span>
                    </div>

                    <ChevronRight size={18} color="#B7B0A8" style={{ flexShrink: 0 }} />
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
