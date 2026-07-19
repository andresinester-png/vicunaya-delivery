import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, X, ChevronRight, CalendarClock,
  LayoutGrid, Scissors, Eye, PawPrint, Car, Wrench,
} from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { KYVRA } from '../lib/theme.js';

const FF = "'Plus Jakarta Sans', sans-serif";

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

      {/* Premium dark branded header */}
      <div style={{
        background: 'linear-gradient(160deg, #061118 0%, #0A1E2A 28%, #0D3A35 55%, #0F172A 100%)',
        padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 16px 22px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Ambient teal glow */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.20) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* KYVRA eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, position: 'relative' }}>
          <div style={{ width: 22, height: 22, borderRadius: 7, background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CalendarClock size={12} color="#fff" />
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#5EEAD4', letterSpacing: '0.12em', fontFamily: FF }}>TURNOS · KYVRA</span>
        </div>

        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.02em', fontFamily: FF, position: 'relative' }}>
          ¿Qué servicio necesitás?
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, margin: '0 0 16px', lineHeight: 1.5, fontFamily: FF, position: 'relative' }}>
          Reservá turnos en negocios locales, sin llamadas.
        </p>

        {/* Search on dark background */}
        <div style={{ position: 'relative' }}>
          <Search
            size={15}
            color="rgba(255,255,255,0.40)"
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Peluquerías, talleres, turnos..."
            style={{
              width: '100%', height: 46, boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.10)',
              border: `1.5px solid ${search ? 'rgba(94,234,212,0.45)' : 'rgba(255,255,255,0.14)'}`,
              borderRadius: 14, padding: '0 40px 0 42px',
              fontSize: 14, color: '#fff', outline: 'none',
              fontFamily: FF,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              <X size={13} color="#fff" />
            </button>
          )}
        </div>
      </div>

      {/* Category filters */}
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
                border: `1.5px solid ${active ? KYVRA.teal : KYVRA.border}`,
                fontFamily: FF,
                fontWeight: active ? 700 : 500,
                fontSize: 13, cursor: 'pointer',
                transition: 'all 0.18s',
                boxShadow: active ? '0 2px 8px rgba(13,148,136,0.25)' : 'none',
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
            <style>{`@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }`}</style>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{
                background: KYVRA.white, borderRadius: 20, overflow: 'hidden',
                border: `1px solid ${KYVRA.border}`,
              }}>
                <div style={{ height: 170, background: 'linear-gradient(90deg,#f0f4f8 25%,#e2e8f0 50%,#f0f4f8 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
                <div style={{ padding: '14px' }}>
                  <div style={{ height: 13, width: '55%', borderRadius: 6, background: '#E2E8F0', marginBottom: 7 }} />
                  <div style={{ height: 10, width: '75%', borderRadius: 6, background: '#E2E8F0' }} />
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
            <p style={{ marginTop: 12, color: KYVRA.textSec, fontWeight: 600, fontSize: 15, fontFamily: FF }}>
              Sin resultados
            </p>
            {(search || catFilter !== 'Todos') && (
              <button
                onClick={() => { setSearch(''); setCatFilter('Todos'); }}
                style={{
                  marginTop: 8, color: KYVRA.teal, fontWeight: 700, fontSize: 14,
                  background: 'none', border: 'none', cursor: 'pointer', fontFamily: FF,
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
            style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 24 }}
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
                      background: KYVRA.white, borderRadius: 22,
                      border: `1px solid ${KYVRA.border}`,
                      boxShadow: '0 4px 18px rgba(0,0,0,0.07)',
                      overflow: 'hidden', cursor: 'pointer',
                    }}
                  >
                    {/* Cover image — taller */}
                    <div style={{ position: 'relative', height: 170, overflow: 'hidden' }}>
                      {coverImg ? (
                        <img
                          src={coverImg} alt={b.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          background: `linear-gradient(145deg, ${info.color}cc 0%, ${info.color}55 100%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {FallbackIcon
                            ? <FallbackIcon size={52} strokeWidth={1.2} color="rgba(255,255,255,0.45)" />
                            : <span style={{ fontSize: 56, opacity: 0.4 }}>{info.emoji}</span>
                          }
                        </div>
                      )}

                      {/* Dark overlay for text legibility */}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.60) 0%, transparent 55%)' }} />

                      {/* Category badge */}
                      <span style={{
                        position: 'absolute', top: 10, left: 10,
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                        color: '#fff', padding: '3px 9px', borderRadius: 99,
                        fontSize: 10, fontWeight: 700, border: '1px solid rgba(255,255,255,0.18)',
                      }}>
                        {info.emoji} {info.label}
                      </span>

                      {/* Business name overlaid on image */}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 14px 12px' }}>
                        <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.5)', letterSpacing: '-0.01em', fontFamily: FF, lineHeight: 1.2 }}>
                          {b.name}
                        </p>
                      </div>
                    </div>

                    {/* Card footer */}
                    <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      {b.description ? (
                        <p style={{ margin: 0, fontSize: 12.5, color: KYVRA.textSec, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FF }}>
                          {b.description}
                        </p>
                      ) : (
                        <span style={{ flex: 1 }} />
                      )}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
                        color: '#fff', borderRadius: 99, padding: '6px 13px',
                        fontSize: 12, fontWeight: 700, flexShrink: 0, fontFamily: FF,
                        boxShadow: '0 2px 8px rgba(13,148,136,0.30)',
                      }}>
                        Reservar <ChevronRight size={12} strokeWidth={2.5} />
                      </span>
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
