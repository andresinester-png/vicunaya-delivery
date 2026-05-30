import { useEffect, useState, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Upload, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase, supabaseAdmin } from '../../lib/supabase.js';
import { useRestaurant } from '../../contexts/RestaurantContext.js';

const BUCKET = 'menu-item-images';

const EMPTY_ITEM = {
  name: '', description: '', price: '', image_url: '', is_available: true,
  allows_extras: false, extra_price: '', extra_label: 'Unidades extra', base_label: 'Unidad',
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

  // Image upload state for item modal
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
      ? { ...item, price: item.price ?? '', extra_price: item.extra_price ?? '' }
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
    if (!form.name || !form.price) { toast.error('Nombre y precio son obligatorios'); return; }
    setSaving(true);
    try {
      let image_url = form.image_url || null;

      if (imageFile) {
        const ext  = imageFile.name.split('.').pop();
        const path = `items/${restaurant.id}_${Date.now()}.${ext}`;
        const { error: upErr } = await supabaseAdmin.storage.from(BUCKET).upload(path, imageFile, { upsert: true });
        if (upErr) throw upErr;
        image_url = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      }

      const payload = {
        ...form,
        image_url,
        price: parseFloat(form.price),
        extra_price: form.allows_extras && form.extra_price !== '' ? parseFloat(form.extra_price) : null,
        restaurant_id: restaurant.id,
      };

      const { error } = form.id
        ? await supabaseAdmin.from('menu_items').update(payload).eq('id', form.id)
        : await supabaseAdmin.from('menu_items').insert(payload);
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
    await supabaseAdmin.from('menu_items').delete().eq('id', id);
    toast.success('Eliminado');
    reload();
  };

  const toggleAvailable = async (item) => {
    await supabaseAdmin.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id);
    reload();
  };

  const saveCategory = async () => {
    if (!catForm.trim()) return;
    setSaving(true);
    await supabaseAdmin.from('menu_categories').insert({ name: catForm.trim(), restaurant_id: restaurant.id, sort_order: categories.length });
    setCatForm(''); setModal(null); toast.success('Categoría agregada'); reload();
    setSaving(false);
  };

  const deleteCategory = async (id) => {
    if (!confirm('¿Eliminar esta categoría y todos sus productos?')) return;
    await supabaseAdmin.from('menu_categories').delete().eq('id', id);
    reload(); toast.success('Categoría eliminada');
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
                            ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{item.name}</p>
                          {item.description && <p className="text-xs text-gray-500 truncate">{item.description}</p>}
                          <p className="text-primary font-bold text-sm">${parseFloat(item.price).toLocaleString('es-AR')}</p>
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
                <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="Precio (ej: 1500) *" className="input" min="0" step="0.01" />

                {/* ── Image upload ── */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Imagen del producto</label>
                  <div
                    onClick={() => imageRef.current?.click()}
                    className="relative cursor-pointer rounded-xl border-2 border-dashed border-neutral-200 hover:border-primary transition-colors flex items-center gap-3 p-3"
                    style={{ background: '#F9FAFB' }}
                  >
                    {/* Thumbnail preview */}
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

                <div className="border-t border-neutral-100 pt-3 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.allows_extras} onChange={e => setForm(f => ({ ...f, allows_extras: e.target.checked }))} className="w-4 h-4 accent-primary" />
                    <span className="text-sm font-medium">Permite unidades extra</span>
                  </label>
                  {form.allows_extras && (
                    <>
                      <input value={form.base_label} onChange={e => setForm(f => ({ ...f, base_label: e.target.value }))} placeholder="Etiqueta base (ej: Docena)" className="input" />
                      <input value={form.extra_label} onChange={e => setForm(f => ({ ...f, extra_label: e.target.value }))} placeholder="Etiqueta extra (ej: Unidades extra)" className="input" />
                      <input type="number" value={form.extra_price} onChange={e => setForm(f => ({ ...f, extra_price: e.target.value }))} placeholder="Precio por unidad extra" className="input" min="0" step="0.01" />
                    </>
                  )}
                </div>

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
