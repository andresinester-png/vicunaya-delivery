import { useEffect, useState, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Upload, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase.js';
import { useRestaurant } from '../../contexts/RestaurantContext.js';

const BUCKET = 'menu-item-images';

function PriceInput({ value, onChange, placeholder, className }) {
  const display = value !== '' && value != null && !isNaN(Number(value))
    ? Math.round(Number(value)).toLocaleString('es-AR')
    : '';
  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    onChange(raw);
  };
  return (
    <div className={`relative ${className || ''}`}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm select-none pointer-events-none">$</span>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder || 'Ej: 35.000'}
        className="input pl-7"
      />
    </div>
  );
}

const EMPTY_ITEM = {
  name: '', description: '', image_url: '', is_available: true,
  sells_unit: true,   price_unit: '',
  sells_dozen: false, price_dozen: '',
};

export default function Menu() {
  const restaurant = useRestaurant();
  const [categories, setCategories] = useState([]);
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);
  const [form,       setForm]       = useState(EMPTY_ITEM);
  const [catForm,    setCatForm]    = useState('');
  const [saving,     setSaving]     = useState(false);

  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const imageRef = useRef(null);

  useEffect(() => {
    if (restaurant) { reload(); setLoading(false); }
  }, [restaurant]);

  const reload = async () => {
    const [{ data: cats }, { data: menuItems }] = await Promise.all([
      supabase.from('menu_categories').select('*').eq('restaurant_id', restaurant.id).order('sort_order'),
      supabase.from('menu_items').select('*').eq('restaurant_id', restaurant.id).order('sort_order'),
    ]);
    setCategories(cats || []);
    setItems(menuItems || []);
  };

  const openItemModal = (categoryId, item = null) => {
    setForm(item
      ? {
          ...item,
          sells_unit:  item.price_unit  != null,
          price_unit:  item.price_unit  ?? '',
          sells_dozen: item.price_dozen != null,
          price_dozen: item.price_dozen ?? '',
        }
      : { ...EMPTY_ITEM, category_id: categoryId }
    );
    setImageFile(null);
    setImagePreview(item?.image_url || null);
    setModal({ type: 'item', categoryId });
  };

  const closeModal = () => {
    setModal(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const saveItem = async () => {
    if (!form.name) { toast.error('El nombre es obligatorio'); return; }
    const puVal = form.sells_unit   && form.price_unit   !== '' ? parseFloat(form.price_unit)   : null;
    const pdVal = form.sells_dozen  && form.price_dozen  !== '' ? parseFloat(form.price_dozen)  : null;
    if (puVal == null && pdVal == null) {
      toast.error('Activá al menos una opción de precio'); return;
    }
    setSaving(true);
    try {
      let image_url = form.image_url || null;
      if (imageFile) {
        const ext  = imageFile.name.split('.').pop();
        const path = `items/${restaurant.id}_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, imageFile, { upsert: true });
        if (upErr) throw upErr;
        image_url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      }

      const { sells_unit, sells_dozen, price_unit: _pu, price_dozen: _pd, price: _p, sale_unit: _su, ...rest } = form;
      const payload = {
        ...rest,
        image_url,
        price_unit:  puVal,
        price_dozen: pdVal,
        price: puVal ?? pdVal,
        restaurant_id: restaurant.id,
      };

      const { error } = form.id
        ? await supabase.from('menu_items').update(payload).eq('id', form.id)
        : await supabase.from('menu_items').insert(payload);
      if (error) throw error;

      toast.success('Guardado');
      closeModal();
      reload();
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    await supabase.from('menu_items').delete().eq('id', id);
    toast.success('Eliminado');
    reload();
  };

  const toggleAvailable = async (item) => {
    await supabase.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id);
    reload();
  };

  const saveCategory = async () => {
    if (!catForm.trim()) return;
    setSaving(true);
    await supabase.from('menu_categories').insert({ name: catForm.trim(), restaurant_id: restaurant.id, sort_order: categories.length });
    setCatForm(''); setModal(null); toast.success('Categoría agregada'); reload();
    setSaving(false);
  };

  const deleteCategory = async (id) => {
    if (!confirm('¿Eliminar esta categoría y todos sus productos?')) return;
    await supabase.from('menu_categories').delete().eq('id', id);
    reload(); toast.success('Categoría eliminada');
  };

  const priceLabel = (item) => {
    const parts = [];
    if (item.price_unit  != null) parts.push(`$${parseFloat(item.price_unit).toLocaleString('es-AR')} c/u`);
    if (item.price_dozen != null) parts.push(`$${parseFloat(item.price_dozen).toLocaleString('es-AR')} la docena`);
    return parts.length ? parts.join(' · ') : (item.price != null ? `$${parseFloat(item.price).toLocaleString('es-AR')} c/u` : '—');
  };

  if (loading) return (
    <div className="animate-pulse space-y-3">
      {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-extrabold text-2xl">Mi menú</h1>
        <button onClick={() => { setCatForm(''); setModal({ type: 'category' }); }} className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
          <Plus size={16} /> Nueva categoría
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          <p>Aún no tenés categorías en tu menú.</p>
          <button onClick={() => setModal({ type: 'category' })} className="btn-primary mt-4 mx-auto">+ Agregar categoría</button>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map(cat => {
            const catItems = items.filter(i => i.category_id === cat.id);
            return (
              <div key={cat.id} className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg">{cat.name}</h2>
                  <div className="flex gap-2">
                    <button onClick={() => openItemModal(cat.id)} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1">
                      <Plus size={14} /> Producto
                    </button>
                    <button onClick={() => deleteCategory(cat.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {catItems.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Sin productos en esta categoría</p>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {catItems.map(item => (
                      <div key={item.id} className="flex items-center gap-3 py-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                          {item.image_url
                            ? <img src={item.image_url} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{item.name}</p>
                          {item.description && <p className="text-xs text-gray-500 truncate">{item.description}</p>}
                          <p className="text-primary font-bold text-sm">{priceLabel(item)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleAvailable(item)}
                            className={`w-8 h-5 rounded-full transition-colors relative ${item.is_available ? 'bg-green-400' : 'bg-gray-200'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${item.is_available ? 'translate-x-3' : 'translate-x-0.5'}`} />
                          </button>
                          <button onClick={() => openItemModal(cat.id, item)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary-bg rounded-lg transition-colors">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => deleteItem(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">
                {modal.type === 'category' ? 'Nueva categoría' : form.id ? 'Editar producto' : 'Nuevo producto'}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={18} />
              </button>
            </div>

            {modal.type === 'category' ? (
              <div className="space-y-4">
                <input value={catForm} onChange={e => setCatForm(e.target.value)} placeholder="Ej: Entradas, Principales..." className="input" />
                <button onClick={saveCategory} disabled={saving} className="btn-primary w-full">{saving ? 'Guardando...' : 'Agregar'}</button>
              </div>
            ) : (
              <div className="space-y-3">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre del producto *" className="input" />
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción (opcional)" className="input resize-none h-16" />

                {/* ── Opciones de venta ── */}
                <div className="border border-neutral-200 rounded-xl p-3 space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Opciones de venta</p>

                  {/* Venta por unidad */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.sells_unit}
                        onChange={e => setForm(f => ({ ...f, sells_unit: e.target.checked, price_unit: e.target.checked ? f.price_unit : '' }))}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-sm font-medium">Venta por unidad</span>
                    </label>
                    {form.sells_unit && (
                      <PriceInput
                        value={form.price_unit}
                        onChange={v => setForm(f => ({ ...f, price_unit: v }))}
                        placeholder="Ej: 35.000"
                        className="ml-7"
                      />
                    )}
                  </div>

                  {/* Venta por docena */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.sells_dozen}
                        onChange={e => setForm(f => ({ ...f, sells_dozen: e.target.checked, price_dozen: e.target.checked ? f.price_dozen : '' }))}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-sm font-medium">Venta por docena</span>
                    </label>
                    {form.sells_dozen && (
                      <PriceInput
                        value={form.price_dozen}
                        onChange={v => setForm(f => ({ ...f, price_dozen: v }))}
                        placeholder="Ej: 35.000"
                        className="ml-7"
                      />
                    )}
                  </div>
                </div>

                {/* ── Image upload ── */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Imagen del producto</label>
                  <div
                    onClick={() => imageRef.current?.click()}
                    className="relative cursor-pointer rounded-xl border-2 border-dashed border-neutral-200 hover:border-primary transition-colors flex items-center gap-3 p-3"
                    style={{ background: '#F9FAFB' }}
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                      {imagePreview
                        ? <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                        : <Image size={22} strokeWidth={1.5} className="text-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-600">
                        {imagePreview ? 'Imagen seleccionada' : 'Subir imagen'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {imagePreview ? 'Tocá para cambiar' : 'JPG, PNG, WebP'}
                      </p>
                    </div>
                    <Upload size={16} className="text-gray-400 shrink-0" />
                  </div>
                  <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.is_available} onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))} className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-medium">Disponible</span>
                </label>

                <button onClick={saveItem} disabled={saving} className="btn-primary w-full">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
