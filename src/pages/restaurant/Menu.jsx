import { useEffect, useState, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Upload, Image, BookOpen, Copy, ChevronDown, ChevronUp, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase.js';
import { useRestaurant } from '../../contexts/RestaurantContext.js';

const BUCKET = 'menu-item-images';

const T = {
  navy: '#0F172A', teal: '#0D9488', tealDark: '#0F766E', tealSec: '#14B8A6',
  tealLight: '#5EEAD4', bg: '#F8FAFC', white: '#FFFFFF',
  textSec: '#64748B', textMuted: '#94A3B8', border: '#E2E8F0',
};
const FF = "'Plus Jakarta Sans', sans-serif";
const GH = 'linear-gradient(160deg, #061118 0%, #0A1E2A 28%, #0D3A35 55%, #0F172A 100%)';
const GTEAL = 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)';

function KvSwitch({ on, onToggle, size = 'md' }) {
  const w = size === 'sm' ? 32 : 38;
  const h = size === 'sm' ? 18 : 22;
  const dot = h - 4;
  return (
    <button
      onClick={onToggle}
      style={{
        width: w, height: h, borderRadius: h,
        background: on ? GTEAL : T.border,
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s', flexShrink: 0, padding: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 2, width: dot, height: dot, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.22)',
        transition: 'left 0.2s', left: on ? w - dot - 2 : 2,
      }} />
    </button>
  );
}

function PriceInput({ value, onChange, placeholder }) {
  const display = value !== '' && value != null && !isNaN(Number(value))
    ? Math.round(Number(value)).toLocaleString('es-AR')
    : '';
  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    onChange(raw);
  };
  return (
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
        color: T.textMuted, fontWeight: 600, fontSize: 14, pointerEvents: 'none', fontFamily: FF,
      }}>$</span>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder || 'Ej: 35.000'}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '10px 12px 10px 26px',
          border: `1.5px solid ${T.border}`, borderRadius: 10,
          fontSize: 14, fontFamily: FF, outline: 'none',
          background: T.white, color: T.navy,
        }}
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

  const [collapsed,      setCollapsed]      = useState({});
  const [editingCatId,   setEditingCatId]   = useState(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [imageTooLarge,  setImageTooLarge]  = useState(false);
  const catEditRef = useRef(null);

  useEffect(() => {
    if (restaurant) { reload(); setLoading(false); }
  }, [restaurant]);

  useEffect(() => {
    if (editingCatId && catEditRef.current) catEditRef.current.focus();
  }, [editingCatId]);

  const reload = async () => {
    const [{ data: cats }, { data: menuItems }] = await Promise.all([
      supabase.from('menu_categories').select('*').eq('restaurant_id', restaurant.id).order('sort_order'),
      supabase.from('menu_items').select('*').eq('restaurant_id', restaurant.id).order('sort_order'),
    ]);
    setCategories(cats || []);
    setItems(menuItems || []);
  };

  const openItemModal = (categoryId = null, item = null) => {
    const effectiveCatId = categoryId ?? categories[0]?.id ?? null;
    setForm(item
      ? {
          ...item,
          sells_unit:  item.price_unit  != null,
          price_unit:  item.price_unit  ?? '',
          sells_dozen: item.price_dozen != null,
          price_dozen: item.price_dozen ?? '',
        }
      : { ...EMPTY_ITEM, category_id: effectiveCatId }
    );
    setImageFile(null);
    setImagePreview(item?.image_url || null);
    setImageTooLarge(false);
    setModal({ type: 'item', categoryId: effectiveCatId });
  };

  const closeModal = () => {
    setModal(null);
    setImageFile(null);
    setImagePreview(null);
    setImageTooLarge(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageTooLarge(file.size > 2 * 1024 * 1024);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const saveItem = async () => {
    if (!form.name) { toast.error('El nombre es obligatorio'); return; }
    if (!form.category_id) { toast.error('Seleccioná una categoría'); return; }
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

  const startCatRename = (cat) => {
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
  };

  const confirmCatRename = async () => {
    if (!editingCatName.trim()) { setEditingCatId(null); return; }
    const current = categories.find(c => c.id === editingCatId);
    if (current && editingCatName.trim() !== current.name) {
      await supabase.from('menu_categories').update({ name: editingCatName.trim() }).eq('id', editingCatId);
      reload();
    }
    setEditingCatId(null);
  };

  const moveCategoryUp = async (cat, idx) => {
    if (idx === 0) return;
    const prev = categories[idx - 1];
    await Promise.all([
      supabase.from('menu_categories').update({ sort_order: prev.sort_order }).eq('id', cat.id),
      supabase.from('menu_categories').update({ sort_order: cat.sort_order }).eq('id', prev.id),
    ]);
    reload();
  };

  const moveCategoryDown = async (cat, idx) => {
    if (idx === categories.length - 1) return;
    const next = categories[idx + 1];
    await Promise.all([
      supabase.from('menu_categories').update({ sort_order: next.sort_order }).eq('id', cat.id),
      supabase.from('menu_categories').update({ sort_order: cat.sort_order }).eq('id', next.id),
    ]);
    reload();
  };

  const duplicateItem = async (item) => {
    const { id, created_at, ...rest } = item;
    await supabase.from('menu_items').insert({ ...rest, name: `${item.name} (copia)` });
    toast.success('Producto duplicado');
    reload();
  };

  const priceLabel = (item) => {
    const parts = [];
    if (item.price_unit  != null) parts.push(`$${parseFloat(item.price_unit).toLocaleString('es-AR')} c/u`);
    if (item.price_dozen != null) parts.push(`$${parseFloat(item.price_dozen).toLocaleString('es-AR')} la docena`);
    return parts.length ? parts.join(' · ') : (item.price != null ? `$${parseFloat(item.price).toLocaleString('es-AR')} c/u` : '—');
  };

  const totalItems    = items.length;
  const availableItems   = items.filter(i => i.is_available).length;
  const unavailableItems = totalItems - availableItems;

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} style={{ height: 96, background: T.border, borderRadius: 16, opacity: 0.4 + i * 0.15 }} />
      ))}
    </div>
  );

  return (
    <div style={{ fontFamily: FF, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Hero ── */}
      <div style={{ background: GH, borderRadius: 18, padding: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(13,148,136,0.20) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9,
                background: 'rgba(13,148,136,0.22)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <BookOpen size={15} color={T.tealLight} strokeWidth={2} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.4, color: T.tealLight, textTransform: 'uppercase' }}>
                KYVRA · GESTIÓN DE MENÚ
              </span>
            </div>
            <h1 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
              Mi menú
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              <span style={{
                padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)',
                border: '1px solid rgba(255,255,255,0.10)',
              }}>
                {categories.length} {categories.length === 1 ? 'categoría' : 'categorías'}
              </span>
              <span style={{
                padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: 'rgba(13,148,136,0.18)', color: T.tealLight,
                border: '1px solid rgba(13,148,136,0.25)',
              }}>
                {availableItems} disponibles
              </span>
              {unavailableItems > 0 && (
                <span style={{
                  padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: 'rgba(239,68,68,0.15)', color: '#FCA5A5',
                  border: '1px solid rgba(239,68,68,0.20)',
                }}>
                  {unavailableItems} no disponibles
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'flex-end', flexShrink: 0 }}>
            <button
              onClick={() => { setCatForm(''); setModal({ type: 'category' }); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 13px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                background: 'rgba(255,255,255,0.10)', color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.18)', cursor: 'pointer',
                fontFamily: FF,
              }}
            >
              <Plus size={13} strokeWidth={2.5} /> Categoría
            </button>
            <button
              onClick={() => openItemModal()}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 13px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                background: GTEAL, color: '#fff', border: 'none',
                cursor: 'pointer', fontFamily: FF,
                boxShadow: '0 2px 10px rgba(13,148,136,0.35)',
              }}
            >
              <Plus size={13} strokeWidth={2.5} /> Producto
            </button>
          </div>
        </div>
      </div>

      {/* ── Empty state ── */}
      {categories.length === 0 ? (
        <div style={{
          background: T.white, borderRadius: 16, border: `1.5px solid ${T.border}`,
          padding: '48px 24px', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'rgba(13,148,136,0.08)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <BookOpen size={28} color={T.teal} strokeWidth={1.5} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.navy }}>Tu menú está vacío</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: T.textMuted }}>Creá una categoría para empezar</p>
          </div>
          <button
            onClick={() => { setCatForm(''); setModal({ type: 'category' }); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: GTEAL, color: '#fff', border: 'none', cursor: 'pointer',
              fontFamily: FF, boxShadow: '0 2px 10px rgba(13,148,136,0.3)',
            }}
          >
            <Plus size={15} strokeWidth={2.5} /> Agregar categoría
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {categories.map((cat, idx) => {
            const catItems  = items.filter(i => i.category_id === cat.id);
            const isCollapsed = !!collapsed[cat.id];
            const isRenaming  = editingCatId === cat.id;

            return (
              <div key={cat.id} style={{
                background: T.white, borderRadius: 14,
                border: `1.5px solid ${T.border}`, overflow: 'hidden',
              }}>

                {/* Category header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '12px 13px',
                  borderBottom: isCollapsed ? 'none' : `1px solid ${T.border}`,
                }}>

                  {/* Reorder arrows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
                    <button
                      onClick={() => moveCategoryUp(cat, idx)}
                      disabled={idx === 0}
                      style={{
                        width: 20, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'none', border: 'none',
                        cursor: idx === 0 ? 'default' : 'pointer',
                        color: idx === 0 ? T.border : T.textMuted, padding: 0,
                      }}
                    >
                      <ChevronUp size={13} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => moveCategoryDown(cat, idx)}
                      disabled={idx === categories.length - 1}
                      style={{
                        width: 20, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'none', border: 'none',
                        cursor: idx === categories.length - 1 ? 'default' : 'pointer',
                        color: idx === categories.length - 1 ? T.border : T.textMuted, padding: 0,
                      }}
                    >
                      <ChevronDown size={13} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Name / rename input */}
                  {isRenaming ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                      <input
                        ref={catEditRef}
                        value={editingCatName}
                        onChange={e => setEditingCatName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') confirmCatRename();
                          if (e.key === 'Escape') setEditingCatId(null);
                        }}
                        onBlur={confirmCatRename}
                        style={{
                          flex: 1, minWidth: 0,
                          padding: '5px 10px', border: `1.5px solid ${T.teal}`, borderRadius: 8,
                          fontSize: 14, fontWeight: 700, fontFamily: FF, color: T.navy,
                          outline: 'none', background: T.bg,
                        }}
                      />
                      <button
                        onMouseDown={e => { e.preventDefault(); confirmCatRename(); }}
                        style={{
                          width: 28, height: 28, borderRadius: 8, background: T.teal,
                          border: 'none', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}
                      >
                        <Check size={14} color="#fff" strokeWidth={2.5} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{
                        fontSize: 14, fontWeight: 800, color: T.navy,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {cat.name}
                      </span>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        minWidth: 20, height: 20, borderRadius: 20, padding: '0 5px',
                        background: T.bg, border: `1px solid ${T.border}`,
                        fontSize: 10, fontWeight: 800, color: T.textMuted, flexShrink: 0,
                      }}>
                        {catItems.length}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  {!isRenaming && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                      <button
                        onClick={() => startCatRename(cat)}
                        title="Renombrar"
                        style={{
                          width: 28, height: 28, borderRadius: 8, background: 'none',
                          border: 'none', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', color: T.textMuted,
                        }}
                      >
                        <Pencil size={13} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => openItemModal(cat.id)}
                        title="Agregar producto"
                        style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: GTEAL, border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Plus size={14} color="#fff" strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        title="Eliminar categoría"
                        style={{
                          width: 28, height: 28, borderRadius: 8, background: 'none',
                          border: 'none', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', color: '#F87171',
                        }}
                      >
                        <Trash2 size={13} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => setCollapsed(c => ({ ...c, [cat.id]: !c[cat.id] }))}
                        style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: T.bg, border: `1px solid ${T.border}`,
                          cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', color: T.textMuted,
                        }}
                      >
                        <ChevronDown
                          size={14} strokeWidth={2.5}
                          style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                        />
                      </button>
                    </div>
                  )}
                </div>

                {/* Product list */}
                {!isCollapsed && (
                  <div>
                    {catItems.length === 0 ? (
                      <div style={{
                        padding: '20px 14px', textAlign: 'center',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                      }}>
                        <p style={{ margin: 0, fontSize: 12, color: T.textMuted, fontStyle: 'italic' }}>
                          Sin productos en esta categoría
                        </p>
                        <button
                          onClick={() => openItemModal(cat.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                            background: 'rgba(13,148,136,0.08)', color: T.teal,
                            border: `1px solid rgba(13,148,136,0.2)`, cursor: 'pointer', fontFamily: FF,
                          }}
                        >
                          <Plus size={13} strokeWidth={2.5} /> Agregar primer producto
                        </button>
                      </div>
                    ) : (
                      <div>
                        {catItems.map((item, iIdx) => (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '10px 13px',
                              borderBottom: iIdx < catItems.length - 1 ? `1px solid ${T.border}` : 'none',
                            }}
                          >
                            {/* Thumbnail */}
                            <div style={{
                              width: 48, height: 48, borderRadius: 10,
                              background: T.bg, overflow: 'hidden', flexShrink: 0,
                              border: `1px solid ${T.border}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {item.image_url
                                ? <img src={item.image_url} alt={item.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <span style={{ fontSize: 20 }}>🍽️</span>}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{
                                margin: 0, fontSize: 13, fontWeight: 700, color: T.navy,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              }}>
                                {item.name}
                              </p>
                              {item.description && (
                                <p style={{
                                  margin: '1px 0 0', fontSize: 11, color: T.textMuted,
                                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>
                                  {item.description}
                                </p>
                              )}
                              <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 700, color: T.teal }}>
                                {priceLabel(item)}
                              </p>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                              <KvSwitch on={item.is_available} onToggle={() => toggleAvailable(item)} size="sm" />
                              <button
                                onClick={() => duplicateItem(item)}
                                title="Duplicar"
                                style={{
                                  width: 28, height: 28, borderRadius: 8, background: 'none',
                                  border: 'none', cursor: 'pointer', display: 'flex',
                                  alignItems: 'center', justifyContent: 'center', color: T.textMuted,
                                }}
                              >
                                <Copy size={13} strokeWidth={2} />
                              </button>
                              <button
                                onClick={() => openItemModal(cat.id, item)}
                                title="Editar"
                                style={{
                                  width: 28, height: 28, borderRadius: 8, background: 'none',
                                  border: 'none', cursor: 'pointer', display: 'flex',
                                  alignItems: 'center', justifyContent: 'center', color: T.textMuted,
                                }}
                              >
                                <Pencil size={13} strokeWidth={2} />
                              </button>
                              <button
                                onClick={() => deleteItem(item.id)}
                                title="Eliminar"
                                style={{
                                  width: 28, height: 28, borderRadius: 8, background: 'none',
                                  border: 'none', cursor: 'pointer', display: 'flex',
                                  alignItems: 'center', justifyContent: 'center', color: '#F87171',
                                }}
                              >
                                <Trash2 size={13} strokeWidth={2} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)',
            zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 16px',
          }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={{
            background: T.white, borderRadius: 20,
            width: '100%', maxWidth: 440, maxHeight: '90vh',
            overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
          }}>
            {/* Modal header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 18px', borderBottom: `1.5px solid ${T.border}`,
              position: 'sticky', top: 0, background: T.white, zIndex: 2,
              borderRadius: '20px 20px 0 0',
            }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy, fontFamily: FF }}>
                {modal.type === 'category' ? 'Nueva categoría' : form.id ? 'Editar producto' : 'Nuevo producto'}
              </h3>
              <button
                onClick={closeModal}
                style={{
                  width: 30, height: 30, borderRadius: 9, background: T.bg,
                  border: `1px solid ${T.border}`, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: T.textMuted,
                }}
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>

            <div style={{ padding: '16px 18px 22px' }}>
              {modal.type === 'category' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <input
                    value={catForm}
                    onChange={e => setCatForm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveCategory()}
                    placeholder="Ej: Entradas, Principales..."
                    autoFocus
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '11px 14px', border: `1.5px solid ${T.border}`, borderRadius: 10,
                      fontSize: 14, fontFamily: FF, color: T.navy, outline: 'none',
                    }}
                  />
                  <button
                    onClick={saveCategory}
                    disabled={saving}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                      background: saving ? T.border : GTEAL,
                      color: saving ? T.textMuted : '#fff',
                      border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FF,
                    }}
                  >
                    {saving ? 'Guardando...' : 'Agregar categoría'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>
                      Nombre *
                    </label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Nombre del producto"
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '11px 14px', border: `1.5px solid ${T.border}`, borderRadius: 10,
                        fontSize: 14, fontFamily: FF, color: T.navy, outline: 'none',
                      }}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>
                      Descripción
                    </label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Descripción opcional"
                      rows={2}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '11px 14px', border: `1.5px solid ${T.border}`, borderRadius: 10,
                        fontSize: 14, fontFamily: FF, color: T.navy, outline: 'none', resize: 'none',
                      }}
                    />
                  </div>

                  {/* Category selector */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>
                      Categoría
                    </label>
                    <select
                      value={form.category_id || ''}
                      onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '11px 14px', border: `1.5px solid ${T.border}`, borderRadius: 10,
                        fontSize: 14, fontFamily: FF, color: T.navy, outline: 'none',
                        background: T.white, cursor: 'pointer',
                      }}
                    >
                      <option value="">Seleccioná una categoría</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Pricing */}
                  <div style={{ border: `1.5px solid ${T.border}`, borderRadius: 12, padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      Opciones de venta
                    </p>

                    {/* Unit */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.navy, fontFamily: FF }}>Venta por unidad</span>
                        <KvSwitch
                          on={form.sells_unit}
                          onToggle={() => setForm(f => ({ ...f, sells_unit: !f.sells_unit, price_unit: !f.sells_unit ? f.price_unit : '' }))}
                        />
                      </div>
                      {form.sells_unit && (
                        <PriceInput
                          value={form.price_unit}
                          onChange={v => setForm(f => ({ ...f, price_unit: v }))}
                          placeholder="Precio por unidad"
                        />
                      )}
                    </div>

                    {/* Dozen */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.navy, fontFamily: FF }}>Venta por docena</span>
                        <KvSwitch
                          on={form.sells_dozen}
                          onToggle={() => setForm(f => ({ ...f, sells_dozen: !f.sells_dozen, price_dozen: !f.sells_dozen ? f.price_dozen : '' }))}
                        />
                      </div>
                      {form.sells_dozen && (
                        <PriceInput
                          value={form.price_dozen}
                          onChange={v => setForm(f => ({ ...f, price_dozen: v }))}
                          placeholder="Precio por docena"
                        />
                      )}
                    </div>
                  </div>

                  {/* Image upload */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>
                      Imagen del producto
                    </label>
                    <div
                      onClick={() => imageRef.current?.click()}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12,
                        border: `2px dashed ${imageTooLarge ? '#F87171' : T.border}`,
                        background: T.bg, cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        width: 56, height: 56, borderRadius: 10, overflow: 'hidden',
                        background: T.border, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {imagePreview
                          ? <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <Image size={20} color={T.textMuted} strokeWidth={1.5} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.navy }}>
                          {imagePreview ? 'Imagen seleccionada' : 'Subir imagen'}
                        </p>
                        <p style={{ margin: '3px 0 0', fontSize: 11, color: imageTooLarge ? '#EF4444' : T.textMuted }}>
                          {imageTooLarge
                            ? '⚠ Imagen muy grande — máx 2 MB'
                            : imagePreview ? 'Tocá para cambiar · JPG, PNG, WebP' : 'JPG, PNG, WebP · máx 2 MB'}
                        </p>
                      </div>
                      <Upload size={15} color={T.textMuted} />
                    </div>
                    <input ref={imageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                  </div>

                  {/* Availability */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${T.border}`,
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.navy }}>Disponible</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: T.textMuted }}>Visible en el menú para clientes</p>
                    </div>
                    <KvSwitch
                      on={form.is_available}
                      onToggle={() => setForm(f => ({ ...f, is_available: !f.is_available }))}
                    />
                  </div>

                  {/* Save */}
                  <button
                    onClick={saveItem}
                    disabled={saving}
                    style={{
                      width: '100%', padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                      background: saving ? T.border : GTEAL,
                      color: saving ? T.textMuted : '#fff',
                      border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FF,
                    }}
                  >
                    {saving ? 'Guardando...' : 'Guardar producto'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
