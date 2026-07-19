import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, X, ChevronRight, CalendarClock,
  LayoutGrid, Scissors, Eye, PawPrint, Car, Wrench,
} from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { KYVRA } from '../lib/theme.js';

export const CATEGORY_INFO = {
  peluqueria:  { label: 'Peluquería',  emoji: '💇', Icon: Scissors,   bg: '#EFF6FF', color: '#2563EB' },
  barberia:    { label: 'Barbería',    emoji: '💈', Icon: Scissors,   bg: '#EFF6FF', color: '#2563EB' },
  estetica:    { label: 'Estética',    emoji: '💆', Icon: Eye,        bg: '#FDF2F8', color: '#EC4899' },
  unas:        { label: 'Uñas',        emoji: '💅', Icon: null,       bg: '#FAF5FF', color: '#9333EA' },
  spa:         { label: 'Spa',         emoji: '🧖', Icon: null,       bg: '#ECFDF5', color: '#059669' },
  taller:      { label: 'Taller',      emoji: '🔧', Icon: Wrench,     bg: '#FFF7ED', color: '#EA580C' },
  medico:      { label: 'Médico',      emoji: '🩺', Icon: null,       bg: '#EFF6FF', color: '#0284C7' },
  veterinaria: { label: 'Veterinaria', emoji: '🐾', Icon: PawPrint,   bg: '#F0FDF4', color: '#16A34A' },
  gimnasio:    { label: 'Gimnasio',    emoji: '🏋️', Icon: null,       bg: '#FFFBEB', color: '#D97706' },
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
    <div style={{ background: KYVRA.bg, minHeight: '100%' }}>

      {/* Intro: title + search */}
      <div style={{
        background: KYVRA.white,
        padding: '20px 16px 16px',
        borderBottom: `1px solid ${KYVRA.border}`,
      }}>
        <span style={{
          display: 'block', color: KYVRA.teal,
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4,
        }}>
          RESERVAS
        </span>
        <h1 style={{
          color: KYVRA.navy, fontSize: 22, fontWeight: 900,
          margin: '0 0 4px', letterSpacing: '-0.02em',
        }}>
          ¿Qué servicio necesitás?
        </h1>
        <p style={{ color: KYVRA.textSec, fontSize: 13.5, margin: '0 0 16px', lineHeight: 1.5 }}>
          Reservá turnos en negocios locales, sin llamadas.
        </p>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            color={KYVRA.textMuted}
            style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Peluquerías, talleres, turnos..."
            style={{
              width: '100%', height: 44,
              background: KYVRA.bg,
              border: `1.5px solid ${search ? KYVRA.teal : KYVRA.border}`,
              borderRadius: 14, padding: '0 40px 0 40px',
              fontSize: 14, color: KYVRA.navy, outline: 'none',
              boxSizing: 'border-box', transition: 'border-color 0.2s',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                display: 'flex', alignItems: 'center',
              }}
            >
              <X size={14} color={KYVRA.textMuted} />
            </button>
          )}
        </div>
      </div>

      {/* Category filters — single icon+label chip row */}
      <div style={{
        background: KYVRA.white,
        overflowX: 'auto', scrollbarWidth: 'none',
        display: 'flex', gap: 8,
        padding: '12px 16px',
        borderBottom: `1px solid ${KYVRA.border}`,
      }}>
        {FILTER_CATS.map(cat => {
          const active  = catFilter === cat.key;
          const CatIcon = cat.Icon;
          return (
            <motion.button
              key={cat.key}
              whileTap={{ scale: 0.94 }}
              onClick={() => setCatFilter(cat.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '8px 14px', borderRadius: 99, flexShrink: 0,
                background: active ? KYVRA.teal : KYVRA.white,
                color: active ? KYVRA.white : KYVRA.navy,
                border: `1px solid ${active ? KYVRA.teal : KYVRA.border}`,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: active ? 700 : 500,
                fontSize: 13, cursor: 'pointer',
                transition: 'all 0.18s',
              }}
            >
              {CatIcon && <CatIcon size={13} strokeWidth={active ? 2.5 : 2} />}
              {cat.label}
            </motion.button>
          );
        })}
      </div>

      {/* Business list */}
      <div style={{ padding: '16px 16px 0' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 24 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse" style={{
                background: KYVRA.white, borderRadius: 20, overflow: 'hidden',
                border: `1px solid ${KYVRA.border}`,
              }}>
                <div style={{ height: 140, background: '#E2E8F0' }} />
                <div style={{ padding: '26px 14px 12px' }}>
                  <div style={{ height: 15, width: '55%', borderRadius: 6, background: '#E2E8F0', marginBottom: 7 }} />
                  <div style={{ height: 11, width: '75%', borderRadius: 6, background: '#E2E8F0' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '64px 0 24px', color: KYVRA.textMuted,
          }}>
            <CalendarClock size={48} strokeWidth={1} />
            <p style={{ marginTop: 12, color: KYVRA.textSec, fontWeight: 600, fontSize: 15 }}>
              Sin resultados
            </p>
            {(search || catFilter !== 'Todos') && (
              <button
                onClick={() => { setSearch(''); setCatFilter('Todos'); }}
                style={{
                  marginTop: 8, color: KYVRA.teal, fontWeight: 700, fontSize: 14,
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
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
            style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 24 }}
          >
            {filtered.map(b => {
              const info         = CATEGORY_INFO[b.category] || CATEGORY_INFO.otro;
              const coverImg     = b.logo_url || CATEGORY_IMAGES[b.category];
              const FallbackIcon = info.Icon;
              return (
                <motion.div key={b.id} variants={cardVariants}>
                  <Link
                    to={`/turnos/${b.id}`}
                    style={{
                      display: 'block', textDecoration: 'none',
                      background: KYVRA.white, borderRadius: 20,
                      border: `1px solid ${KYVRA.border}`,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                      overflow: 'hidden', cursor: 'pointer',
                    }}
                  >
                    {/* Cover image */}
                    <div style={{ position: 'relative', height: 140, overflow: 'hidden' }}>
                      {coverImg ? (
                        <img
                          src={coverImg} alt={b.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          background: `linear-gradient(145deg, ${info.color}cc 0%, ${info.color}66 100%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {FallbackIcon
                            ? <FallbackIcon size={48} strokeWidth={1.2} color="rgba(255,255,255,0.5)" />
                            : <span style={{ fontSize: 52, opacity: 0.45 }}>{info.emoji}</span>
                          }
                        </div>
                      )}

                      {/* Category badge */}
                      <span style={{
                        position: 'absolute', top: 10, left: 10,
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: info.color,
                        color: '#fff', padding: '4px 9px', borderRadius: 99,
                        fontSize: 10, fontWeight: 800, letterSpacing: '0.03em',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      }}>
                        {info.emoji} {info.label}
                      </span>
                    </div>

                    {/* Content */}
                    <div style={{
                      padding: '12px 14px 12px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: KYVRA.navy, marginBottom: 3 }}>
                          {b.name}
                        </div>
                        {b.description && (
                          <p style={{
                            margin: 0, fontSize: 12, color: KYVRA.textSec, fontWeight: 500,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {b.description}
                          </p>
                        )}
                      </div>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        border: `1px solid ${KYVRA.border}`,
                        background: KYVRA.white,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginLeft: 10,
                      }}>
                        <ChevronRight size={15} color={KYVRA.teal} strokeWidth={2.2} />
                      </div>
                    </div>
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
