import { useEffect, useState, useRef, useCallback } from 'react';
import { Pencil, Store, Upload, X, Loader2, Check, Image, Move, Key, ShieldCheck, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase.js';
import { CreateAccessModal, ResetPasswordModal, generatePassword, PasswordRow, CredentialsBox } from '../../components/OwnerAccessModal.jsx';

const BUCKET = 'IMAGES';

const parsePosition = (pos) => {
  if (!pos) return { x: 50, y: 50 };
  const parts = String(pos).replace(/%/g, '').trim().split(/\s+/);
  return { x: parseInt(parts[0]) || 50, y: parseInt(parts[1]) || 50 };
};

function CoverPositionBox({ preview, inputRef, onChange, position, onPositionChange }) {
  const [moveMode, setMoveMode]   = useState(false);
  const [dragging, setDragging]   = useState(false);
  const containerRef              = useRef(null);
  const dragStart                 = useRef(null);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Foto de portada</p>
        {preview && (
          <button
            type="button"
            onClick={() => setMoveMode(m => !m)}
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
              moveMode ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <Move size={11} />
            {moveMode ? 'Listo' : 'Reposicionar'}
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden border-2 border-dashed transition-colors"
        style={{
          height: 140,
          background: '#F9FAFB',
          borderColor: moveMode ? '#e31b23' : '#e5e7eb',
          cursor: !preview ? 'pointer' : moveMode ? (dragging ? 'grabbing' : 'grab') : 'pointer',
          userSelect: 'none',
        }}
        onClick={() => { if (!moveMode) inputRef.current?.click(); }}
        onMouseDown={e => { if (moveMode && preview) { e.preventDefault(); startDrag(e.clientX, e.clientY); } }}
        onMouseMove={e => moveDrag(e.clientX, e.clientY)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={e => { if (moveMode && preview) { startDrag(e.touches[0].clientX, e.touches[0].clientY); } }}
        onTouchMove={e => { if (moveMode) { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY); } }}
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

        {moveMode && preview && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/40 backdrop-blur-sm rounded-full p-2.5">
              <Move size={18} color="#fff" />
            </div>
          </div>
        )}

        {!moveMode && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 transition-opacity rounded-xl">
            <Upload size={20} color="#fff" />
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
    </div>
  );
}

function EditModal({ restaurant, onClose, onSaved }) {
  const [name,          setName]          = useState(restaurant.name || '');
  const [isActive,      setIsActive]      = useState(restaurant.is_active ?? true);
  const [coverFile,     setCoverFile]     = useState(null);
  const [coverPreview,  setCoverPreview]  = useState(restaurant.image_url || null);
  const [coverPosition, setCoverPosition] = useState(parsePosition(restaurant.cover_position));
  const [saving,        setSaving]        = useState(false);

  const coverRef = useRef(null);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      const updates = {
        name:           name.trim(),
        is_active:      isActive,
        cover_position: `${coverPosition.x}% ${coverPosition.y}%`,
      };

      if (coverFile) {
        const ext  = coverFile.name.split('.').pop();
        const path = `restaurants/cover_${restaurant.id}_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, coverFile, { upsert: true });
        if (upErr) throw upErr;
        updates.image_url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      }

      const { error } = await supabase.from('restaurants').update(updates).eq('id', restaurant.id);
      if (error) throw error;

      toast.success('Restaurante guardado');
      onSaved();
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '92vh' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 shrink-0">
          <h2 className="font-extrabold text-lg">Editar restaurante</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <CoverPositionBox
            preview={coverPreview}
            inputRef={coverRef}
            onChange={e => {
              const file = e.target.files[0];
              if (!file) return;
              setCoverFile(file);
              setCoverPreview(URL.createObjectURL(file));
            }}
            position={coverPosition}
            onPositionChange={setCoverPosition}
          />

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre del restaurante</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: La Rotisería de Carlos"
              className="input"
            />
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

        <div className="px-5 py-4 border-t border-neutral-100 shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewRestaurantModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [saving,      setSaving]      = useState(false);
  const [credentials, setCredentials] = useState(null);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (form.email.trim() && !form.password) { toast.error('Ingresá una contraseña para el acceso'); return; }

    setSaving(true);
    try {
      const { data: restaurant, error: insertErr } = await supabase
        .from('restaurants')
        .insert({ name: form.name.trim(), is_active: false })
        .select()
        .single();

      if (insertErr) throw insertErr;

      if (form.email.trim()) {
        const { data, error } = await supabase.functions.invoke('admin-create-owner', {
          body: { email: form.email.trim().toLowerCase(), password: form.password, entityId: restaurant.id, table: 'restaurants' },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setCredentials({ email: form.email.trim().toLowerCase(), password: form.password });
        onSaved();
      } else {
        toast.success('Restaurante creado');
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
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: '92vh' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 shrink-0">
            <h2 className="font-extrabold text-lg">Restaurante creado</h2>
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
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: '92vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 shrink-0">
          <h2 className="font-extrabold text-lg">Nuevo restaurante</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre del restaurante *</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ej: La Rotisería de Carlos" className="input" />
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
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />}
            {saving ? 'Creando…' : 'Crear restaurante'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [editing,     setEditing]     = useState(null);
  const [ownerMap,    setOwnerMap]    = useState({}); // { userId: email }
  const [newModal,    setNewModal]    = useState(false);
  const [createModal, setCreateModal] = useState(null); // { id, name }
  const [resetModal,  setResetModal]  = useState(null); // { userId, email }

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('restaurants').select('*').order('name');
    if (!error) {
      setRestaurants(data || []);
      const ownerIds = [...new Set((data || []).map(r => r.owner_id).filter(Boolean))];
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

  const editingRestaurant = editing ? restaurants.find(r => r.id === editing) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-extrabold text-2xl">Restaurantes</h1>
          <p className="text-sm text-gray-400 mt-0.5">{restaurants.length} locales en total</p>
        </div>
        <button
          onClick={() => setNewModal(true)}
          className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm"
        >
          <Plus size={16} /> Nuevo restaurante
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="h-32 bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Store size={44} strokeWidth={1} className="mx-auto mb-3" />
          <p className="font-semibold">No hay restaurantes cargados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {restaurants.map(r => (
            <div key={r.id} className="card overflow-hidden">
              <div className="relative h-32 bg-gray-100">
                {r.image_url ? (
                  <img
                    src={r.image_url}
                    alt={r.name}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: r.cover_position || '50% 50%' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                    <Store size={32} className="text-gray-400" strokeWidth={1.5} />
                  </div>
                )}
                <span className={`absolute top-2 left-2 text-xs font-bold px-2.5 py-1 rounded-full ${
                  r.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {r.is_active ? 'Abierto' : 'Cerrado'}
                </span>
                {r.logo_url && (
                  <div className="absolute -bottom-4 left-4 w-10 h-10 rounded-lg overflow-hidden border-2 border-white shadow-md bg-white">
                    <img src={r.logo_url} alt="logo" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className={`px-4 pb-4 ${r.logo_url ? 'pt-6' : 'pt-3'}`}>
                <h3 className="font-extrabold text-base leading-tight">{r.name}</h3>
                {r.description && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{r.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                  {r.delivery_time  != null && <span>⏱ {r.delivery_time} min</span>}
                  {r.delivery_price != null && <span>🚴 ${r.delivery_price.toLocaleString('es-AR')}</span>}
                  {r.min_order      != null && <span>Mín. ${r.min_order.toLocaleString('es-AR')}</span>}
                </div>

                <button
                  onClick={() => setEditing(r.id)}
                  className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-primary hover:bg-primary-bg px-3 py-1.5 rounded-xl transition-colors"
                >
                  <Pencil size={14} /> Editar
                </button>

                {/* Owner access */}
                <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center gap-2 flex-wrap min-w-0">
                  {r.owner_id ? (
                    <>
                      <ShieldCheck size={13} className="text-green-500 shrink-0" />
                      <span className="text-xs text-green-600 font-semibold">Acceso activo</span>
                      {ownerMap[r.owner_id] && (
                        <span className="text-xs text-gray-400 font-mono truncate" title={ownerMap[r.owner_id]}>
                          {ownerMap[r.owner_id]}
                        </span>
                      )}
                      <div className="ml-auto shrink-0">
                        <button
                          onClick={() => setResetModal({ userId: r.owner_id, email: ownerMap[r.owner_id] || '' })}
                          className="text-xs text-primary font-semibold hover:underline"
                        >
                          Resetear contraseña
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => setCreateModal({ id: r.id, name: r.name })}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 px-2.5 py-1.5 rounded-xl transition-colors"
                    >
                      <Key size={13} /> Crear acceso
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {newModal && (
        <NewRestaurantModal
          onClose={() => setNewModal(false)}
          onSaved={load}
        />
      )}

      {editingRestaurant && (
        <EditModal
          restaurant={editingRestaurant}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}

      {createModal && (
        <CreateAccessModal
          entityId={createModal.id}
          entityName={createModal.name}
          table="restaurants"
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
