import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ChevronLeft, Save, Clock, MapPin, Truck, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase.js';

/* ── Design tokens ─────────────────────────────────────────────── */
const T = {
  navy: '#0F172A', teal: '#0D9488', tealDark: '#0F766E',
  bg: '#F8FAFC', white: '#FFFFFF', textSec: '#64748B', textMuted: '#94A3B8', border: '#E2E8F0',
};
const FF    = "'Plus Jakarta Sans', sans-serif";
const GH    = 'linear-gradient(160deg, #061118 0%, #0A1E2A 28%, #0D3A35 55%, #0F172A 100%)';
const GTEAL = 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)';

const STYLES = `
  @keyframes kv-shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  .kv-shimmer {
    background: linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%);
    background-size: 200% 100%;
    animation: kv-shimmer 1.4s ease-in-out infinite;
  }

  /* Mobile: single column */
  .kvc-wrap { padding: 20px 16px 100px; }
  .kvc-grid { display: flex; flex-direction: column; gap: 12px; }
  .kvc-col  { display: flex; flex-direction: column; gap: 12px; }

  /* Desktop: 2-column, viewport-height fit */
  @media (min-width: 1024px) {
    .kvc-wrap {
      height: calc(100vh - 60px);
      box-sizing: border-box;
      padding: 16px 28px 80px;
    }
    .kvc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 16px;
      height: 100%;
      overflow: hidden;
    }
    .kvc-col {
      height: 100%;
      overflow-y: auto;
      scrollbar-width: none;
    }
    .kvc-col::-webkit-scrollbar { display: none; }
    /* Last section in each column stretches to fill remaining space */
    .kvc-col > div:last-child { flex: 1; }
    /* Textarea inside the stretched section grows with it */
    .kvc-col textarea { flex: 1; min-height: 60px; }
  }
`;

/* ── Constants ─────────────────────────────────────────────────── */
const DIAS_OPTS = [
  { val: 'lunes',     label: 'Lunes'     },
  { val: 'martes',    label: 'Martes'    },
  { val: 'miercoles', label: 'Miércoles' },
  { val: 'jueves',    label: 'Jueves'    },
  { val: 'viernes',   label: 'Viernes'   },
  { val: 'sabado',    label: 'Sábado'    },
  { val: 'domingo',   label: 'Domingo'   },
];

const DIAS_ABBR = [
  { val: 'lunes',     label: 'Lun' },
  { val: 'martes',    label: 'Mar' },
  { val: 'miercoles', label: 'Mié' },
  { val: 'jueves',    label: 'Jue' },
  { val: 'viernes',   label: 'Vie' },
  { val: 'sabado',    label: 'Sáb' },
  { val: 'domingo',   label: 'Dom' },
];

const HORAS = Array.from({ length: 24 }, (_, i) => {
  const h = String(i).padStart(2, '0');
  return [`${h}:00`, `${h}:30`];
}).flat();

/* ── Sub-components ────────────────────────────────────────────── */
function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <div style={{ background: T.white, borderRadius: 16, padding: '16px 18px', border: `1.5px solid ${T.border}`, boxShadow: '0 2px 8px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: subtitle ? 6 : 14, flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(13,148,136,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={16} color={T.teal} />
        </div>
        <p style={{ fontWeight: 800, fontSize: 14, color: T.navy, margin: 0, fontFamily: FF }}>{title}</p>
      </div>
      {subtitle && <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 12px', fontFamily: FF, lineHeight: 1.5, flexShrink: 0 }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function DayToggleRow({ label, fieldValues, onToggle }) {
  return (
    <div style={{ marginBottom: 12, flexShrink: 0 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: T.textSec, margin: '0 0 8px', fontFamily: FF }}>{label}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {DIAS_ABBR.map(d => {
          const active = fieldValues.includes(d.val);
          return (
            <button
              key={d.val}
              onClick={() => onToggle(d.val)}
              style={{ borderRadius: 8, padding: '6px 10px', background: active ? T.teal : T.white, color: active ? '#fff' : T.textSec, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: FF, border: `1.5px solid ${active ? T.teal : T.border}` }}
            >
              {d.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeSelect({ label, value, onChange }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: T.textSec, display: 'block', marginBottom: 4, fontFamily: FF }}>{label}</label>
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', border: `1.5px solid ${T.border}`, borderRadius: 10, padding: '9px 10px', fontSize: 13, outline: 'none', fontFamily: FF, background: T.white, color: T.navy, cursor: 'pointer' }}
      >
        <option value="">--</option>
        {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────── */
export default function EncomiendaConfig() {
  const empresa  = useOutletContext();
  const navigate = useNavigate();

  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [config, setConfig]   = useState({
    dias_trabajo:            [],
    dias_recepcion:          [],
    dias_entrega:            [],
    horario_recepcion_desde: '',
    horario_recepcion_hasta: '',
    horario_entrega_desde:   '',
    horario_entrega_hasta:   '',
    direccion_deposito:      '',
    condiciones_deposito:    '',
    condiciones_retiro:      '',
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('config_encomiendas')
        .select('*')
        .eq('empresa_id', empresa.id)
        .maybeSingle();
      if (data) {
        setConfig({
          dias_trabajo:            data.dias_trabajo            || [],
          dias_recepcion:          data.dias_recepcion          || [],
          dias_entrega:            data.dias_entrega            || [],
          horario_recepcion_desde: data.horario_recepcion_desde || '',
          horario_recepcion_hasta: data.horario_recepcion_hasta || '',
          horario_entrega_desde:   data.horario_entrega_desde   || '',
          horario_entrega_hasta:   data.horario_entrega_hasta   || '',
          direccion_deposito:      data.direccion_deposito      || '',
          condiciones_deposito:    data.condiciones_deposito    || '',
          condiciones_retiro:      data.condiciones_retiro      || '',
        });
      }
      setLoading(false);
    })();
  }, [empresa.id]);

  const setField = (k, v) => setConfig(prev => ({ ...prev, [k]: v }));

  const toggleDia = (val) => {
    setConfig(prev => ({
      ...prev,
      dias_trabajo: prev.dias_trabajo.includes(val)
        ? prev.dias_trabajo.filter(d => d !== val)
        : [...prev.dias_trabajo, val],
    }));
  };

  const toggleDiaField = (field, val) => {
    setConfig(prev => ({
      ...prev,
      [field]: prev[field].includes(val)
        ? prev[field].filter(d => d !== val)
        : [...prev[field], val],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('config_encomiendas')
      .upsert({
        empresa_id:              empresa.id,
        dias_trabajo:            config.dias_trabajo,
        dias_recepcion:          config.dias_recepcion,
        dias_entrega:            config.dias_entrega,
        horario_recepcion_desde: config.horario_recepcion_desde || null,
        horario_recepcion_hasta: config.horario_recepcion_hasta || null,
        horario_entrega_desde:   config.horario_entrega_desde   || null,
        horario_entrega_hasta:   config.horario_entrega_hasta   || null,
        direccion_deposito:      config.direccion_deposito.trim()   || null,
        condiciones_deposito:    config.condiciones_deposito.trim() || null,
        condiciones_retiro:      config.condiciones_retiro.trim()   || null,
        updated_at:              new Date().toISOString(),
      }, { onConflict: 'empresa_id' });

    setSaving(false);
    if (error) { toast.error('Error al guardar'); return; }
    toast.success('Configuración guardada');
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: FF }}>
      <style>{STYLES}</style>

      {/* Header */}
      <header style={{ background: GH, padding: '0 16px', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 2px 16px rgba(0,0,0,0.22)' }}>
        <div style={{ height: 60, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/encomiendas/panel')}
            style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ChevronLeft size={18} color="#fff" />
          </button>
          <div>
            <p style={{ color: '#fff', fontWeight: 900, fontSize: 16, margin: 0, letterSpacing: '-0.2px', fontFamily: FF }}>Configuración</p>
            <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: 11, margin: 0, fontFamily: FF }}>{empresa.nombre}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="kvc-wrap">
        {loading ? (
          <div className="kvc-grid">
            <div className="kvc-col">
              {[1, 2, 3].map(i => <div key={i} className="kv-shimmer" style={{ borderRadius: 16, height: 130 }} />)}
            </div>
            <div className="kvc-col">
              {[4, 5, 6].map(i => <div key={i} className="kv-shimmer" style={{ borderRadius: 16, height: 130 }} />)}
            </div>
          </div>
        ) : (
          <div className="kvc-grid">

            {/* ── Left column ── */}
            <div className="kvc-col">

              {/* Días de trabajo */}
              <Section icon={Calendar} title="Días que trabajás">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {DIAS_OPTS.map(d => {
                    const active = config.dias_trabajo.includes(d.val);
                    return (
                      <button
                        key={d.val}
                        onClick={() => toggleDia(d.val)}
                        style={{ border: `2px solid ${active ? T.teal : T.border}`, borderRadius: 10, padding: '7px 14px', background: active ? 'rgba(13,148,136,0.08)' : T.bg, color: active ? T.tealDark : T.textSec, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FF, transition: 'all 0.15s' }}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </Section>

              {/* Horario recepción */}
              <Section icon={Clock} title="Horario de recepción en depósito" subtitle="Horario en que recibís paquetes en tu depósito">
                <DayToggleRow
                  label="Días que aceptás paquetes"
                  fieldValues={config.dias_recepcion}
                  onToggle={val => toggleDiaField('dias_recepcion', val)}
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <TimeSelect label="Desde" value={config.horario_recepcion_desde} onChange={v => setField('horario_recepcion_desde', v)} />
                  <TimeSelect label="Hasta" value={config.horario_recepcion_hasta} onChange={v => setField('horario_recepcion_hasta', v)} />
                </div>
              </Section>

              {/* Condiciones depósito — stretches to fill remaining height */}
              <Section icon={MapPin} title="¿Qué se puede dejar en el depósito?" subtitle="Ej: Sobres, paquetes pequeños y medianos hasta 20kg">
                <textarea
                  value={config.condiciones_deposito}
                  onChange={e => setField('condiciones_deposito', e.target.value)}
                  placeholder="Sobres, paquetes pequeños y medianos hasta 20kg"
                  rows={3}
                  style={{ width: '100%', border: `1.5px solid ${T.border}`, borderRadius: 12, padding: '11px 14px', fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: FF, background: T.white, color: T.navy }}
                />
              </Section>

            </div>

            {/* ── Right column ── */}
            <div className="kvc-col">

              {/* Horario entregas */}
              <Section icon={Truck} title="Horario de entregas" subtitle="Franja horaria en que hacés entregas">
                <DayToggleRow
                  label="Días en que hacés entregas"
                  fieldValues={config.dias_entrega}
                  onToggle={val => toggleDiaField('dias_entrega', val)}
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <TimeSelect label="Desde" value={config.horario_entrega_desde} onChange={v => setField('horario_entrega_desde', v)} />
                  <TimeSelect label="Hasta" value={config.horario_entrega_hasta} onChange={v => setField('horario_entrega_hasta', v)} />
                </div>
              </Section>

              {/* Dirección depósito */}
              <Section icon={MapPin} title="Dirección del depósito" subtitle="Dónde los clientes pueden dejar paquetes. También se usa como punto de origen para la optimización de ruta.">
                <input
                  type="text"
                  value={config.direccion_deposito}
                  onChange={e => setField('direccion_deposito', e.target.value)}
                  placeholder="Ej: Av. San Martín 350, Vicuña Mackenna"
                  style={{ width: '100%', border: `1.5px solid ${T.border}`, borderRadius: 12, padding: '11px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: FF, background: T.white, color: T.navy }}
                />
              </Section>

              {/* Condiciones retiro — stretches to fill remaining height */}
              <Section icon={Truck} title="¿Qué retiro a domicilio?" subtitle="Ej: Muebles, electrodomésticos y paquetes grandes. Consultar disponibilidad.">
                <textarea
                  value={config.condiciones_retiro}
                  onChange={e => setField('condiciones_retiro', e.target.value)}
                  placeholder="Muebles, electrodomésticos y paquetes grandes. Consultar disponibilidad."
                  rows={3}
                  style={{ width: '100%', border: `1.5px solid ${T.border}`, borderRadius: 12, padding: '11px 14px', fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: FF, background: T.white, color: T.navy }}
                />
              </Section>

            </div>
          </div>
        )}
      </div>

      {/* Save button — fixed footer */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px 28px', background: T.white, borderTop: `1px solid ${T.border}`, zIndex: 30 }}>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: saving || loading ? T.textMuted : GTEAL, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 0', fontWeight: 800, fontSize: 15, cursor: saving || loading ? 'not-allowed' : 'pointer', fontFamily: FF, boxShadow: saving || loading ? 'none' : '0 4px 14px rgba(13,148,136,0.30)' }}
        >
          <Save size={16} />
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </div>
    </div>
  );
}
