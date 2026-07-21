import { useState } from 'react';
import { Store, MapPin, Phone, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase.js';
import { useTurnosNegocio } from '../../contexts/TurnosNegocioContext.js';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Estética', 'Peluquería', 'Barbería', 'Salud', 'Odontología',
  'Veterinaria', 'Taller mecánico', 'Gimnasio', 'Yoga / Pilates',
  'Psicología', 'Nutrición', 'Kinesiología', 'Otro',
];

const T = {
  navy: '#0F172A', teal: '#0D9488', tealDark: '#0F766E', tealSec: '#14B8A6',
  tealLight: '#5EEAD4', bg: '#F8FAFC', white: '#FFFFFF',
  textSec: '#64748B', textMuted: '#94A3B8', border: '#E2E8F0',
};
const FF    = "'Plus Jakarta Sans', sans-serif";
const GH    = 'linear-gradient(160deg, #061118 0%, #0A1E2A 28%, #0D3A35 55%, #0F172A 100%)';
const GTEAL = 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)';

const CARD = {
  background: T.white, borderRadius: 16,
  border: `1.5px solid ${T.border}`,
  boxShadow: '0 2px 8px rgba(15,23,42,0.05)',
  padding: 20,
};

const IST = {
  width: '100%', boxSizing: 'border-box',
  padding: '11px 14px', border: `1.5px solid ${T.border}`, borderRadius: 10,
  fontSize: 14, fontFamily: FF, color: T.navy, background: T.bg,
};

const LST = {
  display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted,
  textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 6, fontFamily: FF,
};

const STYLES = `
  .kv-mn-input { transition: border-color 0.15s, box-shadow 0.15s; }
  .kv-mn-input:focus { border-color: #0D9488 !important; box-shadow: 0 0 0 3px rgba(13,148,136,0.10) !important; outline: none; }
`;

function KvSwitch({ on, onToggle, disabled }) {
  const w = 46, h = 26, dot = 20;
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      style={{
        width: w, height: h, borderRadius: h,
        background: on ? GTEAL : T.border,
        border: 'none', cursor: disabled ? 'default' : 'pointer',
        position: 'relative', transition: 'background 0.2s',
        flexShrink: 0, padding: 0, opacity: disabled ? 0.6 : 1,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, width: dot, height: dot, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.22)',
        transition: 'left 0.2s', left: on ? w - dot - 3 : 3,
      }} />
    </button>
  );
}

function SH({ Icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9,
        background: 'rgba(13,148,136,0.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={15} color={T.teal} strokeWidth={2} />
      </div>
      <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.navy, letterSpacing: '-0.2px', fontFamily: FF }}>
        {children}
      </h2>
    </div>
  );
}

export default function MiNegocio() {
  const negocio = useTurnosNegocio();
  const [form, setForm] = useState({
    name:        negocio.name        || '',
    description: negocio.description || '',
    address:     negocio.address     || '',
    phone:       negocio.phone       || '',
    category:    negocio.category    || '',
  });
  const [isActive, setIsActive] = useState(negocio.is_active ?? true);
  const [saving,   setSaving]   = useState(false);
  const [toggling, setToggling] = useState(false);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function toggleVisible() {
    const next = !isActive;
    setIsActive(next);
    setToggling(true);
    const { error } = await supabase
      .from('appointment_businesses')
      .update({ is_active: next })
      .eq('id', negocio.id);
    setToggling(false);
    if (error) { setIsActive(!next); toast.error('Error al actualizar'); return; }
    toast.success(next ? 'Negocio visible en la app' : 'Negocio oculto de la app');
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    setSaving(true);
    const { error } = await supabase
      .from('appointment_businesses')
      .update({
        name:        form.name.trim(),
        description: form.description.trim() || null,
        address:     form.address.trim()     || null,
        phone:       form.phone.trim()       || null,
        category:    form.category           || null,
      })
      .eq('id', negocio.id);
    setSaving(false);
    if (error) { toast.error('Error al guardar'); return; }
    toast.success('Datos actualizados');
  }

  return (
    <div style={{ fontFamily: FF, maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{STYLES}</style>

      {/* ── Hero ── */}
      <div style={{ background: GH, borderRadius: 18, padding: '22px 22px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.20) 0%, transparent 68%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: 60, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(94,234,212,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(13,148,136,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Store size={15} color={T.tealLight} strokeWidth={2} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.6, color: T.tealLight, textTransform: 'uppercase' }}>
              KYVRA · MI NEGOCIO
            </span>
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.3px' }}>
            Mi negocio
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.50)', fontWeight: 500 }}>
            Configurá la información pública de tu negocio en Kyvra
          </p>
        </div>
      </div>

      {/* ── Info card ── */}
      <div style={CARD}>
        <SH Icon={Store}>Información del negocio</SH>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={LST}>Nombre del negocio *</label>
            <input
              className="kv-mn-input"
              style={IST}
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
              placeholder="Ej: Peluquería Luna"
            />
          </div>

          <div>
            <label style={LST}>Categoría</label>
            <select
              className="kv-mn-input"
              style={{ ...IST, cursor: 'pointer' }}
              value={form.category}
              onChange={e => set('category', e.target.value)}
            >
              <option value="">Seleccioná una categoría</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label style={LST}>Descripción</label>
            <textarea
              className="kv-mn-input"
              style={{ ...IST, resize: 'none', lineHeight: 1.6 }}
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Contá brevemente sobre tu negocio..."
            />
          </div>

          <div>
            <label style={LST}>
              <MapPin size={10} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
              Dirección
            </label>
            <input
              className="kv-mn-input"
              style={IST}
              value={form.address}
              onChange={e => set('address', e.target.value)}
              placeholder="Calle y número, ciudad"
            />
          </div>

          <div>
            <label style={LST}>
              <Phone size={10} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
              Teléfono / WhatsApp
            </label>
            <input
              className="kv-mn-input"
              style={IST}
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="Ej: 2664-123456"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              background: saving ? T.border : GTEAL,
              color: saving ? T.textMuted : '#fff',
              border: 'none', cursor: saving ? 'default' : 'pointer', fontFamily: FF,
              boxShadow: saving ? 'none' : '0 3px 12px rgba(13,148,136,0.30)',
              transition: 'opacity 0.15s', marginTop: 4,
            }}
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      {/* ── Visibility card ── */}
      <div style={{ ...CARD, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <SH Icon={Eye}>Visibilidad en la app</SH>
          <p style={{ margin: 0, fontSize: 13, color: T.textSec, lineHeight: 1.5 }}>
            {isActive
              ? 'Tu negocio aparece en el listado de clientes y recibe turnos.'
              : 'Tu negocio está oculto para los clientes. No se pueden agendar turnos.'}
          </p>
        </div>
        <KvSwitch on={isActive} onToggle={toggleVisible} disabled={toggling} />
      </div>

      {/* ── Public URL strip ── */}
      <div style={{
        background: 'rgba(13,148,136,0.06)', borderRadius: 12,
        padding: '10px 16px', border: '1px solid rgba(13,148,136,0.14)',
      }}>
        <span style={{ fontSize: 12, color: T.textSec, fontWeight: 600, fontFamily: FF }}>
          URL pública:{' '}
          <span style={{ fontFamily: 'monospace', color: T.teal, fontWeight: 700 }}>
            /turnos/{negocio.slug}
          </span>
        </span>
      </div>
    </div>
  );
}
