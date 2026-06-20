import { useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useTurnosNegocio } from '../../contexts/TurnosNegocioContext.js';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Estética', 'Peluquería', 'Barbería', 'Salud', 'Odontología',
  'Veterinaria', 'Taller mecánico', 'Gimnasio', 'Yoga / Pilates',
  'Psicología', 'Nutrición', 'Kinesiología', 'Otro',
];

export default function MiNegocio() {
  const negocio = useTurnosNegocio();
  const [form, setForm] = useState({
    name:        negocio.name        || '',
    description: negocio.description || '',
    address:     negocio.address     || '',
    phone:       negocio.phone       || '',
    category:    negocio.category    || '',
  });
  const [saving, setSaving] = useState(false);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
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
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Mi negocio</h1>

      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
            Nombre del negocio *
          </label>
          <input
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
            Categoría
          </label>
          <select
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30 bg-white"
            value={form.category}
            onChange={e => set('category', e.target.value)}
          >
            <option value="">Seleccioná una categoría</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
            Descripción
          </label>
          <textarea
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30 resize-none"
            rows={3}
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Contá brevemente sobre tu negocio..."
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
            Dirección
          </label>
          <input
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30"
            value={form.address}
            onChange={e => set('address', e.target.value)}
            placeholder="Calle y número, ciudad"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
            Teléfono / WhatsApp
          </label>
          <input
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
            placeholder="Ej: 2664-123456"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#e31b23] hover:bg-[#c41520] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      <div className="bg-gray-50 rounded-2xl px-4 py-3 text-xs text-gray-400">
        URL pública del negocio: <span className="font-mono text-gray-600">/turnos/{negocio.slug}</span>
      </div>
    </div>
  );
}
