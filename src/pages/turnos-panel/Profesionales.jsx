import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useTurnosNegocio } from '../../contexts/TurnosNegocioContext.js';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Check, X, Users, Camera } from 'lucide-react';

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

const STYLES = `
  .kv-pro-input { transition: border-color 0.15s, box-shadow 0.15s; }
  .kv-pro-input:focus { border-color: #0D9488 !important; box-shadow: 0 0 0 3px rgba(13,148,136,0.10) !important; outline: none; }
  .kv-pro-row:hover { background: rgba(13,148,136,0.03) !important; }
  .kv-pro-act:hover { background: rgba(15,23,42,0.06) !important; }
  .kv-pro-del:hover { background: rgba(239,68,68,0.07) !important; }
  .kv-pro-photo-btn:hover { border-color: rgba(13,148,136,0.50) !important; }
`;

const EMPTY = { name: '', photoFile: null, photoPreview: null };

async function uploadPhoto(file, profId) {
  const ext = file.name.split('.').pop().toLowerCase();
  const path = `${profId}.${ext}`;
  const { error } = await supabase.storage
    .from('professional-photos')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) { toast.error('Error al subir la foto'); return null; }
  const { data } = supabase.storage.from('professional-photos').getPublicUrl(path);
  // Cache-bust so the browser picks up re-uploads
  return `${data.publicUrl}?t=${Date.now()}`;
}

function Avatar({ src, size = 40 }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'rgba(13,148,136,0.10)', border: `1.5px solid rgba(13,148,136,0.20)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Users size={size * 0.45} color={T.teal} strokeWidth={1.5} />
    </div>
  );
}

export default function Profesionales() {
  const negocio = useTurnosNegocio();
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editPhotoFile, setEditPhotoFile] = useState(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const addFileRef = useRef();
  const editFileRef = useRef();

  useEffect(() => { fetchProfessionals(); }, []);

  async function fetchProfessionals() {
    const { data } = await supabase
      .from('appointment_professionals')
      .select('*')
      .eq('business_id', negocio.id)
      .order('name');
    setProfessionals(data || []);
    setLoading(false);
  }

  function handleAddPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(f => ({ ...f, photoFile: file, photoPreview: URL.createObjectURL(file) }));
  }

  function handleEditPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditPhotoFile(file);
    setEditPhotoPreview(URL.createObjectURL(file));
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    const { data: newProf, error } = await supabase
      .from('appointment_professionals')
      .insert({ business_id: negocio.id, name: form.name.trim(), is_active: true })
      .select()
      .single();

    if (error) { toast.error('Error al guardar'); setSaving(false); return; }

    if (form.photoFile) {
      const url = await uploadPhoto(form.photoFile, newProf.id);
      if (url) await supabase.from('appointment_professionals').update({ avatar_url: url }).eq('id', newProf.id);
    }

    setSaving(false);
    setForm(EMPTY);
    if (addFileRef.current) addFileRef.current.value = '';
    toast.success('Profesional agregado');
    fetchProfessionals();
  }

  async function handleSaveEdit(id) {
    let avatar_url = editForm.avatar_url;

    if (editPhotoFile) {
      const url = await uploadPhoto(editPhotoFile, id);
      if (url) avatar_url = url;
    }

    const { error } = await supabase.from('appointment_professionals').update({
      name: editForm.name,
      avatar_url: avatar_url || null,
    }).eq('id', id);

    if (error) { toast.error('Error al guardar'); return; }
    setEditId(null);
    setEditPhotoFile(null);
    setEditPhotoPreview(null);
    toast.success('Guardado');
    fetchProfessionals();
  }

  function startEdit(prof) {
    setEditId(prof.id);
    setEditForm({ name: prof.name, avatar_url: prof.avatar_url || null });
    setEditPhotoFile(null);
    setEditPhotoPreview(null);
  }

  function cancelEdit() {
    setEditId(null);
    setEditPhotoFile(null);
    setEditPhotoPreview(null);
    if (editFileRef.current) editFileRef.current.value = '';
  }

  async function toggleActive(id, current) {
    const { error } = await supabase.from('appointment_professionals').update({ is_active: !current }).eq('id', id);
    if (error) { toast.error('Error'); return; }
    fetchProfessionals();
  }

  async function confirmDelete(id) {
    const { error } = await supabase.from('appointment_professionals').delete().eq('id', id);
    setDeletingId(null);
    if (error) { toast.error(`No se pudo eliminar: ${error.message}`); return; }
    toast.success('Eliminado');
    fetchProfessionals();
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
              <Users size={15} color={T.tealLight} strokeWidth={2} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.6, color: T.tealLight, textTransform: 'uppercase' }}>
              KYVRA · PROFESIONALES
            </span>
          </div>
          <h1 style={{ margin: '0 0 10px', fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.3px' }}>
            Profesionales
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(13,148,136,0.18)', color: T.tealLight, border: '1px solid rgba(13,148,136,0.25)' }}>
              {professionals.length} {professionals.length === 1 ? 'profesional' : 'profesionales'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Add professional card ── */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(13,148,136,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Plus size={15} color={T.teal} strokeWidth={2} />
          </div>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.navy, letterSpacing: '-0.2px', fontFamily: FF }}>
            Nuevo profesional
          </h2>
        </div>

        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Photo picker */}
            <button
              type="button"
              className="kv-pro-photo-btn"
              onClick={() => addFileRef.current?.click()}
              style={{
                flexShrink: 0, width: 52, height: 52, borderRadius: '50%',
                border: `2px dashed ${T.border}`, background: T.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', cursor: 'pointer', padding: 0,
                transition: 'border-color 0.15s',
              }}
            >
              {form.photoPreview
                ? <img src={form.photoPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                : <Camera size={18} color={T.textMuted} />}
            </button>
            <input ref={addFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAddPhoto} />

            <input
              className="kv-pro-input"
              style={IST}
              placeholder="Nombre completo"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          {form.photoPreview && (
            <p style={{ margin: 0, fontSize: 12, color: T.textMuted }}>Foto seleccionada. Se subirá al guardar.</p>
          )}

          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, alignSelf: 'flex-start',
              padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: (saving || !form.name.trim()) ? T.border : GTEAL,
              color: (saving || !form.name.trim()) ? T.textMuted : '#fff',
              border: 'none', cursor: (saving || !form.name.trim()) ? 'default' : 'pointer',
              fontFamily: FF, boxShadow: (saving || !form.name.trim()) ? 'none' : '0 3px 10px rgba(13,148,136,0.28)',
              transition: 'opacity 0.15s',
            }}
          >
            <Plus size={14} strokeWidth={2.5} />
            {saving ? 'Guardando…' : 'Agregar profesional'}
          </button>
        </form>
      </div>

      {/* ── Professionals list card ── */}
      <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ height: 64, background: T.border, borderRadius: 12, opacity: 0.35 + i * 0.1 }} />
            ))}
          </div>
        ) : professionals.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(13,148,136,0.08)', border: '1.5px solid rgba(13,148,136,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={26} color={T.teal} strokeWidth={1.5} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Sin profesionales aún</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: T.textMuted }}>Agregá el primero usando el formulario de arriba</p>
            </div>
          </div>
        ) : (
          <div>
            {professionals.map((prof, idx) => (
              <div
                key={prof.id}
                className={deletingId === prof.id || editId === prof.id ? '' : 'kv-pro-row'}
                style={{
                  padding: '12px 16px',
                  borderBottom: idx < professionals.length - 1 ? `1px solid ${T.border}` : 'none',
                  background: deletingId === prof.id ? '#FFF5F5' : T.white,
                  transition: 'background 0.12s',
                }}
              >
                {deletingId === prof.id ? (
                  /* Delete confirm */
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: '#B91C1C', fontWeight: 600 }}>
                      ¿Eliminar <strong>{prof.name}</strong>?
                    </span>
                    <div style={{ display: 'flex', gap: 7 }}>
                      <button
                        onClick={() => confirmDelete(prof.id)}
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
                ) : editId === prof.id ? (
                  /* Inline edit */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="kv-pro-photo-btn"
                        onClick={() => editFileRef.current?.click()}
                        style={{
                          flexShrink: 0, width: 40, height: 40, borderRadius: '50%',
                          border: `2px dashed ${T.border}`, background: T.bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          overflow: 'hidden', cursor: 'pointer', padding: 0,
                          transition: 'border-color 0.15s',
                        }}
                      >
                        {editPhotoPreview
                          ? <img src={editPhotoPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                          : editForm.avatar_url
                            ? <img src={editForm.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                            : <Camera size={16} color={T.textMuted} />}
                      </button>
                      <input ref={editFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleEditPhoto} />

                      <input
                        className="kv-pro-input"
                        style={{ ...IST, flex: 1, minWidth: 120 }}
                        value={editForm.name}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      />

                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button
                          onClick={() => handleSaveEdit(prof.id)}
                          style={{ width: 32, height: 32, borderRadius: 9, background: T.teal, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(13,148,136,0.30)' }}
                        >
                          <Check size={14} color="#fff" strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={{ width: 32, height: 32, borderRadius: 9, background: T.bg, border: `1.5px solid ${T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted }}
                        >
                          <X size={14} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                    {editPhotoPreview && (
                      <p style={{ margin: 0, fontSize: 12, color: T.textMuted }}>Nueva foto seleccionada.</p>
                    )}
                  </div>
                ) : (
                  /* Normal row */
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar src={prof.avatar_url} size={40} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: prof.is_active ? T.navy : T.textMuted, textDecoration: prof.is_active ? 'none' : 'line-through', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {prof.name}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: prof.is_active ? T.teal : T.textMuted, fontWeight: 600 }}>
                        {prof.is_active ? 'Activo' : 'Inactivo'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <button
                        onClick={() => toggleActive(prof.id, prof.is_active)}
                        style={{
                          fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                          background: prof.is_active ? 'rgba(13,148,136,0.09)' : 'rgba(148,163,184,0.12)',
                          color: prof.is_active ? T.teal : T.textMuted,
                          border: prof.is_active ? '1px solid rgba(13,148,136,0.20)' : `1px solid ${T.border}`,
                          cursor: 'pointer', fontFamily: FF, transition: 'all 0.15s',
                        }}
                      >
                        {prof.is_active ? 'Activo' : 'Inactivo'}
                      </button>
                      <button
                        className="kv-pro-act"
                        onClick={() => startEdit(prof)}
                        style={{ width: 30, height: 30, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, transition: 'background 0.15s' }}
                        title="Editar"
                      >
                        <Pencil size={13} strokeWidth={2} />
                      </button>
                      <button
                        className="kv-pro-del"
                        onClick={() => setDeletingId(prof.id)}
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
