import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useTurnosNegocio } from '../../contexts/TurnosNegocioContext.js';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Check, X, UserCircle } from 'lucide-react';

const EMPTY = { name: '', avatar_url: '' };

export default function Profesionales() {
  const negocio = useTurnosNegocio();
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);

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

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('appointment_professionals').insert({
      business_id: negocio.id,
      name: form.name.trim(),
      avatar_url: form.avatar_url.trim() || null,
      is_active: true,
    });
    setSaving(false);
    if (error) { toast.error('Error al guardar'); return; }
    setForm(EMPTY);
    toast.success('Profesional agregado');
    fetchProfessionals();
  }

  async function handleSaveEdit(id) {
    const { error } = await supabase.from('appointment_professionals').update({
      name: editForm.name,
      avatar_url: editForm.avatar_url || null,
    }).eq('id', id);
    if (error) { toast.error('Error al guardar'); return; }
    setEditId(null);
    toast.success('Guardado');
    fetchProfessionals();
  }

  async function toggleActive(id, current) {
    const { error } = await supabase
      .from('appointment_professionals')
      .update({ is_active: !current })
      .eq('id', id);
    if (error) { toast.error('Error'); return; }
    fetchProfessionals();
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este profesional? Se eliminarán también sus horarios y slots.')) return;
    const { error } = await supabase.from('appointment_professionals').delete().eq('id', id);
    if (error) { toast.error('Error al eliminar'); return; }
    toast.success('Eliminado');
    fetchProfessionals();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Profesionales</h1>

      <form onSubmit={handleAdd} className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
        <p className="text-sm font-semibold text-gray-700">Nuevo profesional</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30"
            placeholder="Nombre completo"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <input
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30"
            placeholder="URL de foto — opcional"
            value={form.avatar_url}
            onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))}
          />
        </div>
        <button
          type="submit"
          disabled={saving || !form.name.trim()}
          className="flex items-center gap-2 text-sm font-semibold bg-[#e31b23] hover:bg-[#c41520] disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={15} /> {saving ? 'Guardando...' : 'Agregar profesional'}
        </button>
      </form>

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
              <div key={prof.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50">
                {prof.avatar_url ? (
                  <img src={prof.avatar_url} alt={prof.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <UserCircle size={36} className="text-gray-300 shrink-0" />
                )}

                {editId === prof.id ? (
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                    <input className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none" placeholder="URL foto" value={editForm.avatar_url || ''} onChange={e => setEditForm(f => ({ ...f, avatar_url: e.target.value }))} />
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${prof.is_active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{prof.name}</p>
                    <p className="text-xs text-gray-400">{prof.is_active ? 'Activo' : 'Inactivo'}</p>
                  </div>
                )}

                <div className="flex items-center gap-1 shrink-0">
                  {editId === prof.id ? (
                    <>
                      <button onClick={() => handleSaveEdit(prof.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Check size={14} /></button>
                      <button onClick={() => setEditId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleActive(prof.id, prof.is_active)}
                        className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${
                          prof.is_active ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {prof.is_active ? 'Activo' : 'Inactivo'}
                      </button>
                      <button onClick={() => { setEditId(prof.id); setEditForm({ name: prof.name, avatar_url: prof.avatar_url || '' }); }} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(prof.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
