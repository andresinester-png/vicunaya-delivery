import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useTurnosNegocio } from '../../contexts/TurnosNegocioContext.js';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Check, X, Scissors, Clock } from 'lucide-react';

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
  padding: '10px 12px', border: `1.5px solid ${T.border}`, borderRadius: 10,
  fontSize: 14, fontFamily: FF, color: T.navy, background: T.bg,
};

const LST = {
  display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted,
  textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 5, fontFamily: FF,
};

const STYLES = `
  .kv-svc-input { transition: border-color 0.15s, box-shadow 0.15s; }
  .kv-svc-input:focus { border-color: #0D9488 !important; box-shadow: 0 0 0 3px rgba(13,148,136,0.10) !important; outline: none; }
  .kv-svc-row:hover { background: rgba(13,148,136,0.03) !important; }
  .kv-svc-act:hover { background: rgba(15,23,42,0.06) !important; }
  .kv-svc-del:hover { background: rgba(239,68,68,0.07) !important; }
  .kv-svc-form-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
  @media (min-width: 560px) { .kv-svc-form-grid { grid-template-columns: 1fr 110px 130px; } }
`;

const EMPTY = { name: '', duration_minutes: 30, price: '' };

function SH({ Icon, children, trailing }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, background: 'rgba(13,148,136,0.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={15} color={T.teal} strokeWidth={2} />
      </div>
      <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.navy, letterSpacing: '-0.2px', fontFamily: FF, flex: 1 }}>
        {children}
      </h2>
      {trailing}
    </div>
  );
}

export default function Servicios() {
  const negocio = useTurnosNegocio();
  const [services,   setServices]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [form,       setForm]       = useState(EMPTY);
  const [editId,     setEditId]     = useState(null);
  const [editForm,   setEditForm]   = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { fetchServices(); }, []);

  async function fetchServices() {
    const { data } = await supabase
      .from('appointment_services')
      .select('*')
      .eq('business_id', negocio.id)
      .order('name');
    setServices(data || []);
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('appointment_services').insert({
      business_id:      negocio.id,
      name:             form.name.trim(),
      duration_minutes: Number(form.duration_minutes) || 30,
      price:            form.price !== '' ? Number(form.price) : null,
    });
    setSaving(false);
    if (error) { toast.error('Error al guardar'); return; }
    setForm(EMPTY);
    toast.success('Servicio agregado');
    fetchServices();
  }

  async function handleSaveEdit(id) {
    const { error } = await supabase.from('appointment_services').update({
      name:             editForm.name,
      duration_minutes: Number(editForm.duration_minutes) || 30,
      price:            editForm.price !== '' && editForm.price != null ? Number(editForm.price) : null,
    }).eq('id', id);
    if (error) { toast.error('Error al guardar'); return; }
    setEditId(null);
    toast.success('Guardado');
    fetchServices();
  }

  async function handleDelete(id) {
    setDeletingId(id);
  }

  async function confirmDelete(id) {
    const { error } = await supabase.from('appointment_services').delete().eq('id', id);
    setDeletingId(null);
    if (error) { toast.error(`No se pudo eliminar: ${error.message}`); return; }
    toast.success('Servicio eliminado');
    fetchServices();
  }

  return (
    <div style={{ fontFamily: FF, maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{STYLES}</style>

      {/* ── Hero ── */}
      <div style={{ background: GH, borderRadius: 18, padding: '22px 22px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.20) 0%, transparent 68%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: 60, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(94,234,212,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(13,148,136,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Scissors size={15} color={T.tealLight} strokeWidth={2} />
                </div>
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.6, color: T.tealLight, textTransform: 'uppercase' }}>
                  KYVRA · SERVICIOS
                </span>
              </div>
              <h1 style={{ margin: '0 0 10px', fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.3px' }}>
                Servicios
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(13,148,136,0.18)', color: T.tealLight, border: '1px solid rgba(13,148,136,0.25)' }}>
                  {services.length} {services.length === 1 ? 'servicio' : 'servicios'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Add service card ── */}
      <div style={CARD}>
        <SH Icon={Plus}>Nuevo servicio</SH>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="kv-svc-form-grid">
            <div>
              <label style={LST}>Nombre *</label>
              <input
                className="kv-svc-input"
                style={IST}
                placeholder="Ej: Corte de pelo"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label style={LST}>Duración (min)</label>
              <input
                className="kv-svc-input"
                type="number" min="5" max="480"
                style={IST}
                placeholder="30"
                value={form.duration_minutes}
                onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
              />
            </div>
            <div>
              <label style={LST}>Precio ($)</label>
              <input
                className="kv-svc-input"
                type="number" min="0" step="0.01"
                style={IST}
                placeholder="Opcional"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                background: (saving || !form.name.trim()) ? T.border : GTEAL,
                color: (saving || !form.name.trim()) ? T.textMuted : '#fff',
                border: 'none', cursor: (saving || !form.name.trim()) ? 'default' : 'pointer',
                fontFamily: FF, boxShadow: (saving || !form.name.trim()) ? 'none' : '0 3px 10px rgba(13,148,136,0.28)',
                transition: 'opacity 0.15s',
              }}
            >
              <Plus size={14} strokeWidth={2.5} />
              {saving ? 'Guardando…' : 'Agregar servicio'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Services list card ── */}
      <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ height: 60, background: T.border, borderRadius: 12, opacity: 0.35 + i * 0.1 }} />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(13,148,136,0.08)', border: '1.5px solid rgba(13,148,136,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scissors size={26} color={T.teal} strokeWidth={1.5} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Sin servicios aún</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: T.textMuted }}>Agregá el primer servicio usando el formulario de arriba</p>
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 100px 72px', alignItems: 'center', padding: '10px 16px', borderBottom: `1.5px solid ${T.border}`, background: T.bg }}>
              {['Servicio', 'Duración', 'Precio', ''].map((h, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, textAlign: i === 3 ? 'right' : 'left' }}>{h}</span>
              ))}
            </div>

            {services.map((svc, idx) => (
              <div
                key={svc.id}
                className={deletingId === svc.id || editId === svc.id ? '' : 'kv-svc-row'}
                style={{
                  padding: '12px 16px',
                  borderBottom: idx < services.length - 1 ? `1px solid ${T.border}` : 'none',
                  background: deletingId === svc.id ? '#FFF5F5' : T.white,
                  transition: 'background 0.12s',
                }}
              >
                {deletingId === svc.id ? (
                  /* Delete confirm */
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: '#B91C1C', fontWeight: 600 }}>
                      ¿Eliminar <strong>{svc.name}</strong>?
                    </span>
                    <div style={{ display: 'flex', gap: 7 }}>
                      <button
                        onClick={() => confirmDelete(svc.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 8, background: '#DC2626', color: '#fff', border: 'none', cursor: 'pointer' }}
                      >
                        <Trash2 size={12} /> Eliminar
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        style={{ fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 8, background: T.bg, color: T.textSec, border: `1.5px solid ${T.border}`, cursor: 'pointer' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : editId === svc.id ? (
                  /* Inline edit */
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <input
                      className="kv-svc-input"
                      style={{ ...IST, flex: 1, minWidth: 120 }}
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    />
                    <input
                      className="kv-svc-input"
                      type="number"
                      style={{ ...IST, width: 90, flexShrink: 0 }}
                      value={editForm.duration_minutes}
                      onChange={e => setEditForm(f => ({ ...f, duration_minutes: e.target.value }))}
                    />
                    <input
                      className="kv-svc-input"
                      type="number"
                      style={{ ...IST, width: 100, flexShrink: 0 }}
                      value={editForm.price ?? ''}
                      onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                    />
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button
                        onClick={() => handleSaveEdit(svc.id)}
                        style={{ width: 32, height: 32, borderRadius: 9, background: T.teal, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(13,148,136,0.30)' }}
                      >
                        <Check size={14} color="#fff" strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        style={{ width: 32, height: 32, borderRadius: 9, background: T.bg, border: `1.5px solid ${T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted }}
                      >
                        <X size={14} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Normal row */
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 100px 72px', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: T.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {svc.name}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} color={T.textMuted} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.textSec }}>{svc.duration_minutes} min</span>
                    </span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 20,
                      background: svc.price != null ? 'rgba(13,148,136,0.09)' : 'transparent',
                      border: svc.price != null ? '1px solid rgba(13,148,136,0.18)' : 'none',
                      fontSize: 12, fontWeight: 700, color: svc.price != null ? T.teal : T.textMuted,
                    }}>
                      {svc.price != null ? `$${Number(svc.price).toLocaleString('es-AR')}` : '—'}
                    </span>
                    <div style={{ display: 'flex', gap: 3, justifyContent: 'flex-end' }}>
                      <button
                        className="kv-svc-act"
                        onClick={() => { setEditId(svc.id); setEditForm({ name: svc.name, duration_minutes: svc.duration_minutes, price: svc.price }); }}
                        style={{ width: 30, height: 30, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, transition: 'background 0.15s' }}
                        title="Editar"
                      >
                        <Pencil size={13} strokeWidth={2} />
                      </button>
                      <button
                        className="kv-svc-del"
                        onClick={() => handleDelete(svc.id)}
                        style={{ width: 30, height: 30, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F87171', transition: 'background 0.15s' }}
                        title="Eliminar"
                      >
                        <Trash2 size={13} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
