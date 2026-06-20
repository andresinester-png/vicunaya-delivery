import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useTurnosNegocio } from '../../contexts/TurnosNegocioContext.js';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';

const EMPTY = { name: '', duration_minutes: 30, price: '' };

export default function Servicios() {
  const negocio = useTurnosNegocio();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
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
      business_id: negocio.id,
      name: form.name.trim(),
      duration_minutes: Number(form.duration_minutes) || 30,
      price: form.price !== '' ? Number(form.price) : null,
    });
    setSaving(false);
    if (error) { toast.error('Error al guardar'); return; }
    setForm(EMPTY);
    toast.success('Servicio agregado');
    fetchServices();
  }

  async function handleSaveEdit(id) {
    const { error } = await supabase.from('appointment_services').update({
      name: editForm.name,
      duration_minutes: Number(editForm.duration_minutes) || 30,
      price: editForm.price !== '' && editForm.price != null ? Number(editForm.price) : null,
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
    if (error) {
      toast.error(`No se pudo eliminar: ${error.message}`);
      return;
    }
    toast.success('Servicio eliminado');
    fetchServices();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Servicios</h1>

      <form onSubmit={handleAdd} className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
        <p className="text-sm font-semibold text-gray-700">Nuevo servicio</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            className="sm:col-span-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30"
            placeholder="Nombre del servicio"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <input
            type="number" min="5" max="480"
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30"
            placeholder="Duración (min)"
            value={form.duration_minutes}
            onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
          />
          <input
            type="number" min="0" step="0.01"
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30"
            placeholder="Precio ($) — opcional"
            value={form.price}
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
          />
        </div>
        <button
          type="submit"
          disabled={saving || !form.name.trim()}
          className="flex items-center gap-2 text-sm font-semibold bg-[#e31b23] hover:bg-[#c41520] disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={15} /> {saving ? 'Guardando...' : 'Agregar servicio'}
        </button>
      </form>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-[#e31b23] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : services.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">No hay servicios aún</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Servicio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Duración</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio</th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {services.map(svc => (
                <tr key={svc.id} className="hover:bg-gray-50/50">
                  {deletingId === svc.id ? (
                    <td colSpan={4} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-600">¿Eliminar <strong>{svc.name}</strong>?</span>
                        <div className="flex gap-2">
                          <button onClick={() => confirmDelete(svc.id)} className="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors">Eliminar</button>
                          <button onClick={() => setDeletingId(null)} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-3 py-1.5 rounded-lg transition-colors">Cancelar</button>
                        </div>
                      </div>
                    </td>
                  ) : editId === svc.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-[#e31b23]/30" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-20 focus:outline-none focus:ring-1 focus:ring-[#e31b23]/30" value={editForm.duration_minutes} onChange={e => setEditForm(f => ({ ...f, duration_minutes: e.target.value }))} />
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-24 focus:outline-none focus:ring-1 focus:ring-[#e31b23]/30" value={editForm.price ?? ''} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => handleSaveEdit(svc.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Check size={14} /></button>
                          <button onClick={() => setEditId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={14} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-gray-900">{svc.name}</td>
                      <td className="px-4 py-3 text-gray-500">{svc.duration_minutes} min</td>
                      <td className="px-4 py-3 text-gray-500">
                        {svc.price != null ? `$${Number(svc.price).toLocaleString('es-AR')}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => { setEditId(svc.id); setEditForm({ name: svc.name, duration_minutes: svc.duration_minutes, price: svc.price }); }} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(svc.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
