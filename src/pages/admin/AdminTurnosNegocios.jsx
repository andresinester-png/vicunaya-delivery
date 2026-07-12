import { useEffect, useState, useRef, useCallback } from 'react';
import { Calendar, Pencil, Upload, X, Loader2, Check, ToggleLeft, ToggleRight, Image, Plus, Key, ShieldCheck, Move, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase.js';
import { CreateAccessModal, ResetPasswordModal, generatePassword, PasswordRow, CredentialsBox } from '../../components/OwnerAccessModal.jsx';

const BUCKET = 'IMAGES';

const CATEGORIES = [
  { value: 'peluqueria',  label: 'Peluquería'  },
  { value: 'estetica',    label: 'Estética'     },
  { value: 'taller',      label: 'Taller'       },
  { value: 'veterinaria', label: 'Veterinaria'  },
  { value: 'medico',      label: 'Médico'       },
  { value: 'odontologia', label: 'Odontología'  },
  { value: 'gimnasio',    label: 'Gimnasio'     },
  { value: 'otro',        label: 'Otro'         },
];

const CAT_LABELS = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]));

function parsePosition(str) {
  const [x, y] = (str || '50% 50%').split(' ').map(v => parseInt(v));
  return { x: isNaN(x) ? 50 : x, y: isNaN(y) ? 50 : y };
}

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function CoverPositionBox({
  preview, inputRef, onChange, position, onPositionChange,
  onDelete,
  vertical = false,
  label    = 'Foto de portada',
  specText = 'Tamaño recomendado: 800 × 400 px · Formato: JPG o PNG · Relación 2:1 (horizontal)',
}) {
  const [positioning, setPositioning] = useState(false);
  const [dragging,    setDragging]    = useState(false);
  const containerRef   = useRef(null);
  const dragStart      = useRef(null);
  const prevPreviewRef = useRef(preview);

  useEffect(() => {
    if (preview && preview !== prevPreviewRef.current) setPositioning(true);
    prevPreviewRef.current = preview;
  }, [preview]);

  const startDrag = (clientX, clientY) => {
    dragStart.current = { clientX, clientY, pos: { ...position } };
    setDragging(true);
  };

  const moveDrag = useCallback((clientX, clientY) => {
    if (!dragging || !dragStart.current || !containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const dx = clientX - dragStart.current.clientX;
    const dy = clientY - dragStart.current.clientY;
    const newX = Math.round(Math.max(0, Math.min(100, dragStart.current.pos.x - (dx / width)  * 100)));
    const newY = Math.round(Math.max(0, Math.min(100, dragStart.current.pos.y - (dy / height) * 100)));
    onPositionChange({ x: newX, y: newY });
  }, [dragging, onPositionChange]);

  const endDrag = () => { setDragging(false); dragStart.current = null; };

  const boxHeight   = vertical ? 480 : 140;
  const wrapStyle   = vertical ? { maxWidth: 270, margin: '0 auto' } : {};

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
        {preview && !positioning && (
          <button
            type="button"
            onClick={() => setPositioning(true)}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <Move size={11} /> Reposicionar
          </button>
        )}
      </div>

      <div style={wrapStyle}>
        <div
          ref={containerRef}
          className="relative rounded-xl overflow-hidden border-2 border-dashed transition-colors"
          style={{
            height: boxHeight,
            background: '#F9FAFB',
            borderColor: positioning ? '#e31b23' : '#e5e7eb',
            cursor: !preview ? 'pointer' : positioning ? (dragging ? 'grabbing' : 'grab') : 'default',
            userSelect: 'none',
          }}
          onMouseDown={e => { if (positioning && preview) { e.preventDefault(); startDrag(e.clientX, e.clientY); } }}
          onMouseMove={e => moveDrag(e.clientX, e.clientY)}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onTouchStart={e => { if (positioning && preview) startDrag(e.touches[0].clientX, e.touches[0].clientY); }}
          onTouchMove={e => { if (positioning && preview) { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY); } }}
          onTouchEnd={endDrag}
        >
          {preview ? (
            <img
              src={preview}
              alt="portada"
              draggable={false}
              className="w-full h-full"
              style={{ objectFit: 'cover', objectPosition: `${position.x}% ${position.y}%` }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-1.5 text-gray-400">
              <Image size={22} strokeWidth={1.5} />
              <span className="text-xs font-medium">Subir imagen</span>
            </div>
          )}

          {positioning && preview && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/40 backdrop-blur-sm rounded-full p-2.5">
                <Move size={18} color="#fff" />
              </div>
            </div>
          )}

          {!positioning && (
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 transition-opacity rounded-xl cursor-pointer"
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={20} color="#fff" />
            </div>
          )}
        </div>

        <p className="text-[11px] text-gray-400 mt-1.5 leading-snug">{specText}</p>

        {positioning && preview && (
          <button
            type="button"
            onClick={() => setPositioning(false)}
            className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors"
            style={{ boxShadow: '0 4px 12px rgba(211,47,47,0.28)' }}
          >
            <Check size={15} /> Confirmar posición
          </button>
        )}

        {!positioning && preview && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="mt-1.5 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-600 hover:bg-red-50 border border-red-100 transition-colors"
          >
            <Trash2 size={13} /> Eliminar imagen
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
    </div>
  );
}

function NewBusinessModal({ onClose, onSaved }) {
  const [form,        setForm]        = useState({ name: '', email: '', password: '' });
  const [saving,      setSaving]      = useState(false);
  const [credentials, setCredentials] = useState(null);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (form.email.trim() && !form.password) { toast.error('Ingresá una contraseña para el acceso'); return; }
    setSaving(true);
    try {
      const { data: created, error: insertErr } = await supabase
        .from('appointment_businesses')
        .insert({ name: form.name.trim(), slug: slugify(form.name.trim()), category: 'otro', is_active: false })
        .select()
        .single();
      if (insertErr) throw insertErr;

      if (form.email.trim()) {
        const { data, error } = await supabase.functions.invoke('admin-create-owner', {
          body: { email: form.email.trim().toLowerCase(), password: form.password, entityId: created.id, table: 'appointment_businesses' },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setCredentials({ email: form.email.trim().toLowerCase(), password: form.password });
        onSaved();
      } else {
        toast.success('Negocio creado');
        onSaved();
        onClose();
      }
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (credentials) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: '92vh' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 shrink-0">
            <h2 className="font-extrabold text-lg">Negocio creado</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"><X size={18} /></button>
          </div>
          <div className="px-5 py-4 space-y-4 overflow-y-auto">
            <CredentialsBox email={credentials.email} password={credentials.password} onClose={onClose} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: '92vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 shrink-0">
          <h2 className="font-extrabold text-lg">Nuevo negocio</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre del negocio *</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Peluquería López" className="input" />
            </div>
          </div>

          <div className="border-t border-neutral-100 pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Key size={14} className="text-gray-400" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Acceso del dueño (opcional)</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email del dueño</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="dueno@ejemplo.com" className="input" autoCapitalize="none" />
            </div>
            {form.email.trim() && (
              <PasswordRow
                value={form.password}
                onChange={pw => setForm(p => ({ ...p, password: pw }))}
                onGenerate={() => setForm(p => ({ ...p, password: generatePassword() }))}
              />
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-neutral-100 shrink-0">
          <button onClick={handleSave} disabled={saving || !form.name.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
            {saving ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />}
            {saving ? 'Creando…' : 'Crear negocio'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditBusinessModal({ business, onClose, onSaved }) {
  const [name,          setName]          = useState(business.name || '');
  const [category,      setCategory]      = useState(business.category || 'otro');
  const [isActive,      setIsActive]      = useState(business.is_active ?? true);
  const [logoFile,      setLogoFile]      = useState(null);
  const [logoPreview,   setLogoPreview]   = useState(business.logo_url || null);
  const [logoDeleted,   setLogoDeleted]   = useState(false);
  const [coverPosition, setCoverPosition] = useState(parsePosition(business.cover_position));
  const [bgColor,       setBgColor]       = useState(business.background_color || '#FFFFFF');
  const [saving,        setSaving]        = useState(false);
  const logoRef = useRef(null);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      const updates = {
        name:             name.trim(),
        category,
        is_active:        isActive,
        cover_position:   `${coverPosition.x}% ${coverPosition.y}%`,
        background_color: bgColor,
      };
      if (logoDeleted) {
        updates.logo_url = null;
      } else if (logoFile) {
        const ext  = logoFile.name.split('.').pop().toLowerCase();
        const path = `turnos-negocios/logo_${business.id}_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, logoFile, { upsert: true });
        if (upErr) throw upErr;
        updates.logo_url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from('appointment_businesses').update(updates).eq('id', business.id);
      if (error) throw error;
      toast.success('Negocio guardado');
      onSaved();
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: '92vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 shrink-0">
          <h2 className="font-extrabold text-lg">Editar negocio</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <CoverPositionBox
            label="Foto de portada (listado)"
            preview={logoPreview}
            inputRef={logoRef}
            position={coverPosition}
            onPositionChange={setCoverPosition}
            onDelete={() => { setLogoPreview(null); setLogoFile(null); setLogoDeleted(true); }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (!file) return;
              setLogoFile(file);
              setLogoPreview(URL.createObjectURL(file));
              setLogoDeleted(false);
            }}
          />

          <div className="border-t border-neutral-100 pt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre del negocio</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Peluquería López" className="input" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Categoría</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="input bg-white">
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Color de fondo</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  style={{ width: 44, height: 44, borderRadius: 8, border: '1px solid #E9D5D8', cursor: 'pointer', padding: 2, flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>{bgColor.toUpperCase()}</p>
                  <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>Fondo de la pantalla de reserva</p>
                </div>
                {bgColor.toLowerCase() !== '#ffffff' && (
                  <button
                    type="button"
                    onClick={() => setBgColor('#FFFFFF')}
                    style={{ fontSize: 11, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                  >
                    Resetear
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="font-semibold text-sm">Visible en la app</p>
                <p className="text-xs text-gray-400">{isActive ? 'Aparece en el listado de clientes' : 'Oculto para los clientes'}</p>
              </div>
              <button onClick={() => setIsActive(a => !a)} className="transition-colors">
                {isActive
                  ? <ToggleRight size={38} className="text-primary" />
                  : <ToggleLeft  size={38} className="text-gray-300" />}
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-neutral-100 shrink-0">
          <button onClick={handleSave} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
            {saving ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTurnosNegocios() {
  const [negocios,    setNegocios]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [newModal,    setNewModal]    = useState(false);
  const [editModal,   setEditModal]   = useState(null); // null | business object
  const [ownerMap,    setOwnerMap]    = useState({}); // { userId: email }
  const [createModal, setCreateModal] = useState(null); // { id, name }
  const [resetModal,  setResetModal]  = useState(null); // { userId, email }

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('appointment_businesses')
      .select('*')
      .order('name');
    if (!error) {
      setNegocios(data || []);
      const ownerIds = [...new Set((data || []).map(n => n.owner_id).filter(Boolean))];
      if (ownerIds.length) {
        const { data: listData } = await supabase.functions.invoke('admin-list-users');
        const map = {};
        listData?.users?.forEach(u => { if (ownerIds.includes(u.id)) map[u.id] = u.email; });
        setOwnerMap(map);
      }
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (neg) => {
    const { error } = await supabase
      .from('appointment_businesses')
      .update({ is_active: !neg.is_active })
      .eq('id', neg.id);
    if (error) { toast.error('Error al actualizar'); return; }
    toast.success(neg.is_active ? 'Negocio desactivado' : 'Negocio activado');
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-extrabold text-2xl">Negocios de Turnos</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {negocios.length} negocio{negocios.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <button
          onClick={() => setNewModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Nuevo negocio
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : negocios.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Calendar size={44} strokeWidth={1} className="mx-auto mb-3" />
          <p className="font-semibold">No hay negocios de turnos</p>
          <p className="text-sm mt-1">Creá el primero para que aparezca en la app</p>
          <button onClick={() => setNewModal(true)} className="btn-primary mt-4">
            Nuevo negocio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {negocios.map(neg => (
            <div key={neg.id} className="card p-4 flex flex-col gap-3">

              {/* Top: logo + info + badge */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                  {neg.logo_url
                    ? <img src={neg.logo_url} alt={neg.name} className="w-full h-full object-cover" />
                    : <Calendar size={22} className="text-gray-300" strokeWidth={1.5} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-sm leading-tight truncate">{neg.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{CAT_LABELS[neg.category] || neg.category}</p>
                  {neg.address && <p className="text-xs text-gray-400 truncate mt-0.5">{neg.address}</p>}
                  {neg.phone   && <p className="text-xs text-gray-400 mt-0.5">{neg.phone}</p>}
                </div>
                <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                  neg.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {neg.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {neg.description && (
                <p className="text-xs text-gray-500 line-clamp-2">{neg.description}</p>
              )}

              <p className="text-xs font-mono text-gray-300">/turnos/{neg.slug}</p>

              {/* Actions */}
              <div className="flex items-center gap-1 pt-2 border-t border-neutral-100">
                <button
                  onClick={() => setEditModal(neg)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:bg-primary-bg px-3 py-1.5 rounded-xl transition-colors"
                >
                  <Pencil size={14} /> Editar
                </button>
                <button
                  onClick={() => toggleActive(neg)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded-xl transition-colors ml-auto"
                >
                  {neg.is_active
                    ? <ToggleRight size={16} className="text-green-500" />
                    : <ToggleLeft  size={16} className="text-gray-400" />}
                  {neg.is_active ? 'Desactivar' : 'Activar'}
                </button>
              </div>

              {/* Owner access */}
              <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 flex-wrap min-w-0">
                {neg.owner_id ? (
                  <>
                    <ShieldCheck size={13} className="text-green-500 shrink-0" />
                    <span className="text-xs text-green-600 font-semibold">Acceso activo</span>
                    {ownerMap[neg.owner_id] && (
                      <span className="text-xs text-gray-400 font-mono truncate" title={ownerMap[neg.owner_id]}>
                        {ownerMap[neg.owner_id]}
                      </span>
                    )}
                    <div className="ml-auto shrink-0">
                      <button
                        onClick={() => setResetModal({ userId: neg.owner_id, email: ownerMap[neg.owner_id] || '' })}
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        Resetear contraseña
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => setCreateModal({ id: neg.id, name: neg.name })}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 px-2.5 py-1.5 rounded-xl transition-colors"
                  >
                    <Key size={13} /> Crear acceso
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {newModal && (
        <NewBusinessModal
          onClose={() => setNewModal(false)}
          onSaved={load}
        />
      )}

      {editModal && (
        <EditBusinessModal
          business={editModal}
          onClose={() => setEditModal(null)}
          onSaved={() => { setEditModal(null); load(); }}
        />
      )}

      {createModal && (
        <CreateAccessModal
          entityId={createModal.id}
          entityName={createModal.name}
          table="appointment_businesses"
          onClose={() => { setCreateModal(null); load(); }}
          onSaved={load}
        />
      )}

      {resetModal && (
        <ResetPasswordModal
          userId={resetModal.userId}
          email={resetModal.email}
          onClose={() => setResetModal(null)}
        />
      )}
    </div>
  );
}
