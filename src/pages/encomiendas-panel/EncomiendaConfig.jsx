import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ChevronLeft, Save, Clock, MapPin, Truck, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase.js';

const COLOR = '#e31b23';

const DIAS_OPTS = [
  { val: 'lunes',    label: 'Lunes'    },
  { val: 'martes',   label: 'Martes'   },
  { val: 'miercoles',label: 'Miércoles'},
  { val: 'jueves',   label: 'Jueves'   },
  { val: 'viernes',  label: 'Viernes'  },
  { val: 'sabado',   label: 'Sábado'   },
  { val: 'domingo',  label: 'Domingo'  },
];

const HORAS = Array.from({ length: 24 }, (_, i) => {
  const h = String(i).padStart(2, '0');
  return [`${h}:00`, `${h}:30`];
}).flat();

function Section({ icon: Icon, title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={COLOR} />
        </div>
        <p style={{ fontWeight: 800, fontSize: 14, color: '#111', margin: 0 }}>{title}</p>
      </div>
      {children}
    </div>
  );
}

function TimeSelect({ label, value, onChange }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>{label}</label>
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 10,
          padding: '9px 10px', fontSize: 13, outline: 'none',
          fontFamily: 'inherit', background: '#fff', color: '#111',
        }}
      >
        <option value="">--</option>
        {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
    </div>
  );
}

export default function EncomiendaConfig() {
  const empresa  = useOutletContext();
  const navigate = useNavigate();

  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [config, setConfig]   = useState({
    dias_trabajo:            [],
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
          dias_trabajo:            data.dias_trabajo || [],
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

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('config_encomiendas')
      .upsert({
        empresa_id:              empresa.id,
        dias_trabajo:            config.dias_trabajo,
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
    <div style={{ minHeight: '100vh', background: '#F8F8F8', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <header style={{ background: COLOR, padding: '0 16px', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 2px 12px rgba(227,27,35,0.25)' }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate('/encomiendas/panel')}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ChevronLeft size={18} color="#fff" />
          </button>
          <div>
            <p style={{ color: '#fff', fontWeight: 900, fontSize: 16, margin: 0, lineHeight: 1.2 }}>Configuración</p>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, margin: 0 }}>{empresa.nombre}</p>
          </div>
        </div>
      </header>

      <div style={{ padding: '16px 16px 100px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => <div key={i} style={{ background: '#fff', borderRadius: 16, height: 120, opacity: 0.5 }} />)}
          </div>
        ) : (
          <>
            {/* Días de trabajo */}
            <Section icon={Calendar} title="Días que trabajás">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DIAS_OPTS.map(d => {
                  const active = config.dias_trabajo.includes(d.val);
                  return (
                    <button
                      key={d.val}
                      onClick={() => toggleDia(d.val)}
                      style={{
                        border: `2px solid ${active ? COLOR : '#E5E7EB'}`,
                        borderRadius: 10, padding: '7px 14px',
                        background: active ? '#FFF0F0' : '#F9FAFB',
                        color: active ? COLOR : '#6B7280',
                        fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Horario recepción */}
            <Section icon={Clock} title="Horario de recepción en depósito">
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 10px' }}>Horario en que recibís paquetes en tu depósito</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <TimeSelect
                  label="Desde"
                  value={config.horario_recepcion_desde}
                  onChange={v => setField('horario_recepcion_desde', v)}
                />
                <TimeSelect
                  label="Hasta"
                  value={config.horario_recepcion_hasta}
                  onChange={v => setField('horario_recepcion_hasta', v)}
                />
              </div>
            </Section>

            {/* Horario entregas */}
            <Section icon={Truck} title="Horario de entregas">
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 10px' }}>Franja horaria en que hacés entregas</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <TimeSelect
                  label="Desde"
                  value={config.horario_entrega_desde}
                  onChange={v => setField('horario_entrega_desde', v)}
                />
                <TimeSelect
                  label="Hasta"
                  value={config.horario_entrega_hasta}
                  onChange={v => setField('horario_entrega_hasta', v)}
                />
              </div>
            </Section>

            {/* Dirección depósito */}
            <Section icon={MapPin} title="Dirección del depósito">
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 10px' }}>Dónde los clientes pueden dejar paquetes</p>
              <input
                type="text"
                value={config.direccion_deposito}
                onChange={e => setField('direccion_deposito', e.target.value)}
                placeholder="Ej: Av. San Martín 350, Vicuña Mackenna"
                style={{
                  width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 12,
                  padding: '11px 14px', fontSize: 14, outline: 'none',
                  boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff',
                }}
              />
            </Section>

            {/* Condiciones depósito */}
            <Section icon={MapPin} title="¿Qué se puede dejar en el depósito?">
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 10px' }}>
                Ej: Sobres, paquetes pequeños y medianos hasta 20kg
              </p>
              <textarea
                value={config.condiciones_deposito}
                onChange={e => setField('condiciones_deposito', e.target.value)}
                placeholder="Sobres, paquetes pequeños y medianos hasta 20kg"
                rows={3}
                style={{
                  width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 12,
                  padding: '11px 14px', fontSize: 14, outline: 'none', resize: 'none',
                  boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff',
                }}
              />
            </Section>

            {/* Condiciones retiro */}
            <Section icon={Truck} title="¿Qué retiro a domicilio?">
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 10px' }}>
                Ej: Muebles, electrodomésticos y paquetes grandes. Consultar disponibilidad.
              </p>
              <textarea
                value={config.condiciones_retiro}
                onChange={e => setField('condiciones_retiro', e.target.value)}
                placeholder="Muebles, electrodomésticos y paquetes grandes. Consultar disponibilidad."
                rows={3}
                style={{
                  width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 12,
                  padding: '11px 14px', fontSize: 14, outline: 'none', resize: 'none',
                  boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff',
                }}
              />
            </Section>
          </>
        )}
      </div>

      {/* Botón guardar fijo abajo */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px 24px', background: '#fff', borderTop: '1px solid #E5E7EB', zIndex: 30 }}>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          style={{
            width: '100%', background: saving ? '#aaa' : COLOR, color: '#fff',
            border: 'none', borderRadius: 14, padding: '14px 0',
            fontWeight: 800, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'inherit',
          }}
        >
          <Save size={16} />
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </div>
    </div>
  );
}
