import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useTurnosNegocio } from '../../contexts/TurnosNegocioContext.js';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Check, X, UserCircle, Camera } from 'lucide-react';

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
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Profesionales</h1>

      {/* Add form */}
      <form onSubmit={handleAdd} className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
        <p className="text-sm font-semibold text-gray-700">Nuevo profesional</p>
        <div className="flex items-center gap-4">
          {/* Photo preview / picker */}
          <button
            type="button"
            onClick={() => addFileRef.current?.click()}
            className="shrink-0 w-14 h-14 rounded-full border-2 border-dashed border-gray-200 hover:border-[#e31b23]/40 flex items-center justify-center overflow-hidden bg-gray-50 transition-colors"
          >
            {form.photoPreview
              ? <img src={form.photoPreview} className="w-full h-full object-cover" alt="" />
              : <Camera size={20} className="text-gray-300" />}
          </button>
          <input ref={addFileRef} type="file" accept="image/*" className="hidden" onChange={handleAddPhoto} />
          <input
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30"
            placeholder="Nombre completo"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
        </div>
        {form.photoPreview && (
          <p className="text-xs text-gray-400 -mt-1">Foto seleccionada. Se subirá al guardar.</p>
        )}
        <button
          type="submit"
          disabled={saving || !form.name.trim()}
          className="flex items-center gap-2 text-sm font-semibold bg-[#e31b23] hover:bg-[#c41520] disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={15} /> {saving ? 'Guardando...' : 'Agregar profesional'}
        </button>
      </form>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-[#e31b23] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : professionals.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">No hay profesionales aún</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {professionals.map(prof => (
              <div key={prof.id} className="px-4 py-3 hover:bg-gray-50/50">
                {deletingId === prof.id ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-600">¿Eliminar <strong>{prof.name}</strong>?</span>
                    <div className="flex gap-2">
                      <button onClick={() => confirmDelete(prof.id)} className="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">Eliminar</button>
                      <button onClick={() => setDeletingId(null)} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-3 py-1.5 rounded-lg transition-colors">Cancelar</button>
                    </div>
                  </div>
                ) : editId === prof.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => editFileRef.current?.click()}
                        className="shrink-0 w-12 h-12 rounded-full border-2 border-dashed border-gray-200 hover:border-[#e31b23]/40 flex items-center justify-center overflow-hidden bg-gray-50 transition-colors"
                      >
                        {editPhotoPreview
                          ? <img src={editPhotoPreview} className="w-full h-full object-cover" alt="" />
                          : editForm.avatar_url
                            ? <img src={editForm.avatar_url} className="w-full h-full object-cover" alt="" />
                            : <Camera size={16} className="text-gray-300" />}
                      </button>
                      <input ref={editFileRef} type="file" accept="image/*" className="hidden" onChange={handleEditPhoto} />
                      <input
                        className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e31b23]/30"
                        value={editForm.name}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      />
                      <button onClick={() => handleSaveEdit(prof.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg shrink-0"><Check size={14} /></button>
                      <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg shrink-0"><X size={14} /></button>
                    </div>
                    {editPhotoPreview && <p className="text-xs text-gray-400 pl-15">Nueva foto seleccionada.</p>}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {prof.avatar_url
                      ? <img src={prof.avatar_url} alt={prof.name} loading="lazy" className="w-10 h-10 rounded-full object-cover shrink-0" />
                      : <UserCircle size={40} className="text-gray-300 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${prof.is_active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{prof.name}</p>
                      <p className="text-xs text-gray-400">{prof.is_active ? 'Activo' : 'Inactivo'}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleActive(prof.id, prof.is_active)}
                        className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${
                          prof.is_active ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {prof.is_active ? 'Activo' : 'Inactivo'}
                      </button>
                      <button onClick={() => startEdit(prof)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"><Pencil size={14} /></button>
                      <button onClick={() => setDeletingId(prof.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
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
