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

const HOVER_CSS = `
  .kv-item-card { transition: box-shadow 0.15s, transform 0.15s; }
  .kv-item-card:hover { box-shadow: 0 4px 16px rgba(15,23,42,0.10) !important; transform: translateY(-1px); }
  .kv-act-btn:hover { background: rgba(15,23,42,0.05) !important; }
  .kv-trash-btn:hover { background: rgba(239,68,68,0.07) !important; }
  .kv-cat-action:hover { background: rgba(15,23,42,0.05) !important; }
`;

/* Manages its own error state so broken URLs show the KYVRA placeholder */
function ItemThumb({ url, name }) {
  const [err, setErr] = useState(false);
  return (
    <div style={{
      width: 60, height: 60, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
      background: 'rgba(13,148,136,0.07)', border: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {url && !err
        ? <img
            src={url}
            alt={name}
            loading="lazy"
            onError={() => setErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        : <BookOpen size={20} color={T.teal} strokeWidth={1.5} style={{ opacity: 0.45 }} />}
    </div>
  );
}

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

  const totalItems       = items.length;
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
      <style>{HOVER_CSS}</style>

      {/* ── Hero ── */}
      <div style={{ background: GH, borderRadius: 18, padding: '22px 20px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: -50, right: -50, width: 220, height: 220,
          background: 'radial-gradient(circle, rgba(13,148,136,0.22) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Eyebrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9,
                background: 'rgba(13,148,136,0.22)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <BookOpen size={15} color={T.tealLight} strokeWidth={2} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.6, color: T.tealLight, textTransform: 'uppercase' }}>
                KYVRA · GESTIÓN DE MENÚ
              </span>
            </div>
            <h1 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.3px' }}>
              Mi menú
            </h1>
            {/* Stats chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)',
                border: '1px solid rgba(255,255,255,0.10)',
              }}>
                {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
              </span>
              <span style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.50)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                {categories.length} {categories.length === 1 ? 'categoría' : 'categorías'}
              </span>
              <span style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: 'rgba(13,148,136,0.18)', color: T.tealLight,
                border: '1px solid rgba(13,148,136,0.25)',
              }}>
                {availableItems} disponibles
              </span>
              {unavailableItems > 0 && (
                <span style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: 'rgba(239,68,68,0.15)', color: '#FCA5A5',
                  border: '1px solid rgba(239,68,68,0.20)',
                }}>
                  {unavailableItems} no disponibles
                </span>
              )}
            </div>
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, alignItems: 'flex-end', flexShrink: 0 }}>
            <button
              onClick={() => { setCatForm(''); setModal({ type: 'category' }); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                background: 'rgba(255,255,255,0.10)', color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.18)', cursor: 'pointer',
                fontFamily: FF, whiteSpace: 'nowrap',
              }}
            >
              <Plus size={13} strokeWidth={2.5} /> Categoría
            </button>
            <button
              onClick={() => openItemModal()}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                background: GTEAL, color: '#fff', border: 'none',
                cursor: 'pointer', fontFamily: FF,
                boxShadow: '0 3px 12px rgba(13,148,136,0.40)',
                whiteSpace: 'nowrap',
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
          background: T.white, borderRadius: 16,
          border: `1.5px solid ${T.border}`,
          boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
          padding: '52px 24px', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22,
            background: 'rgba(13,148,136,0.08)',
            border: `1.5px solid rgba(13,148,136,0.15)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BookOpen size={30} color={T.teal} strokeWidth={1.5} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.navy, letterSpacing: '-0.2px' }}>Tu menú está vacío</p>
            <p style={{ margin: '5px 0 0', fontSize: 13, color: T.textMuted, lineHeight: 1.5 }}>Creá tu primera categoría para empezar a agregar productos</p>
          </div>
          <button
            onClick={() => { setCatForm(''); setModal({ type: 'category' }); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '11px 22px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              background: GTEAL, color: '#fff', border: 'none', cursor: 'pointer',
              fontFamily: FF, boxShadow: '0 3px 12px rgba(13,148,136,0.30)',
            }}
          >
            <Plus size={15} strokeWidth={2.5} /> Agregar categoría
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {categories.map((cat, idx) => {
            const catItems    = items.filter(i => i.category_id === cat.id);
            const isCollapsed = !!collapsed[cat.id];
            const isRenaming  = editingCatId === cat.id;

            return (
              <div key={cat.id} style={{
                background: T.white, borderRadius: 16,
                border: `1.5px solid ${T.border}`,
                boxShadow: '0 2px 8px rgba(15,23,42,0.05)',
                overflow: 'hidden',
              }}>

                {/* ── Category header ── */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px',
                  borderBottom: isCollapsed ? 'none' : `1.5px solid ${T.border}`,
                  background: isCollapsed ? T.white : 'rgba(248,250,252,0.7)',
                }}>

                  {/* Reorder arrows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
                    <button
                      onClick={() => moveCategoryUp(cat, idx)}
                      disabled={idx === 0}
                      style={{
                        width: 22, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'none', border: 'none',
                        cursor: idx === 0 ? 'default' : 'pointer',
                        color: idx === 0 ? '#D1D5DB' : T.textMuted, padding: 0,
                        transition: 'color 0.15s',
                      }}
                    >
                      <ChevronUp size={14} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => moveCategoryDown(cat, idx)}
                      disabled={idx === categories.length - 1}
                      style={{
                        width: 22, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'none', border: 'none',
                        cursor: idx === categories.length - 1 ? 'default' : 'pointer',
                        color: idx === categories.length - 1 ? '#D1D5DB' : T.textMuted, padding: 0,
                        transition: 'color 0.15s',
                      }}
                    >
                      <ChevronDown size={14} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Thin divider */}
                  <div style={{ width: 1, height: 28, background: T.border, flexShrink: 0 }} />

                  {/* Name / rename input */}
                  {isRenaming ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 }}>
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
                          padding: '6px 11px', border: `2px solid ${T.teal}`, borderRadius: 9,
                          fontSize: 14, fontWeight: 700, fontFamily: FF, color: T.navy,
                          outline: 'none', background: T.white,
                          boxShadow: `0 0 0 3px rgba(13,148,136,0.12)`,
                        }}
                      />
                      <button
                        onMouseDown={e => { e.preventDefault(); confirmCatRename(); }}
                        style={{
                          width: 32, height: 32, borderRadius: 9, background: T.teal,
                          border: 'none', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(13,148,136,0.30)',
                        }}
                      >
                        <Check size={15} color="#fff" strokeWidth={2.5} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 15, fontWeight: 800, color: T.navy, letterSpacing: '-0.2px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {cat.name}
                      </span>
                      {/* Count badge — teal tint */}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        minWidth: 22, height: 22, borderRadius: 22, padding: '0 6px',
                        background: 'rgba(13,148,136,0.09)',
                        border: `1px solid rgba(13,148,136,0.18)`,
                        fontSize: 11, fontWeight: 800, color: T.teal, flexShrink: 0,
                      }}>
                        {catItems.length}
                      </span>
                    </div>
                  )}

                  {/* Category actions */}
                  {!isRenaming && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <button
                        onClick={() => startCatRename(cat)}
                        title="Renombrar"
                        className="kv-cat-action"
                        style={{
                          width: 32, height: 32, borderRadius: 9, background: 'none',
                          border: 'none', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', color: T.textMuted,
                        }}
                      >
                        <Pencil size={14} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => openItemModal(cat.id)}
                        title="Agregar producto"
                        style={{
                          width: 32, height: 32, borderRadius: 9,
                          background: GTEAL, border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, boxShadow: '0 2px 6px rgba(13,148,136,0.30)',
                        }}
                      >
                        <Plus size={15} color="#fff" strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        title="Eliminar categoría"
                        className="kv-trash-btn"
                        style={{
                          width: 32, height: 32, borderRadius: 9, background: 'none',
                          border: 'none', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', color: '#F87171',
                        }}
                      >
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                      {/* Collapse chevron */}
                      <button
                        onClick={() => setCollapsed(c => ({ ...c, [cat.id]: !c[cat.id] }))}
                        style={{
                          width: 32, height: 32, borderRadius: 9,
                          background: T.bg, border: `1.5px solid ${T.border}`,
                          cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', color: T.textSec,
                          flexShrink: 0,
                        }}
                      >
                        <ChevronDown
                          size={15} strokeWidth={2.5}
                          style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.22s' }}
                        />
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Product list ── */}
                {!isCollapsed && (
                  <div style={{ padding: catItems.length === 0 ? 0 : '10px 10px 10px' }}>
                    {catItems.length === 0 ? (
                      <div style={{
                        padding: '24px 16px', textAlign: 'center',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                      }}>
                        <p style={{ margin: 0, fontSize: 12, color: T.textMuted, fontStyle: 'italic' }}>
                          Sin productos en esta categoría
                        </p>
                        <button
                          onClick={() => openItemModal(cat.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                            background: 'rgba(13,148,136,0.08)', color: T.teal,
                            border: `1.5px solid rgba(13,148,136,0.20)`, cursor: 'pointer', fontFamily: FF,
                          }}
                        >
                          <Plus size={13} strokeWidth={2.5} /> Agregar primer producto
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {catItems.map(item => (
                          <div
                            key={item.id}
                            className="kv-item-card"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 12,
                              padding: '12px 14px',
                              background: T.white, borderRadius: 12,
                              border: `1px solid ${T.border}`,
                              boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
                            }}
                          >
                            {/* Thumbnail — 60px, error-safe */}
                            <ItemThumb url={item.image_url} name={item.name} />

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{
                                margin: 0, fontSize: 13.5, fontWeight: 800, color: T.navy,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                letterSpacing: '-0.1px',
                              }}>
                                {item.name}
                              </p>
                              {item.description && (
                                <p style={{
                                  margin: '2px 0 5px', fontSize: 11.5, color: T.textSec,
                                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                  lineHeight: 1.4,
                                }}>
                                  {item.description}
                                </p>
                              )}
                              {/* Price badge */}
                              <span style={{
                                display: 'inline-flex', alignItems: 'center',
                                padding: '2px 9px', borderRadius: 20, marginTop: item.description ? 0 : 4,
                                background: 'rgba(13,148,136,0.09)',
                                border: '1px solid rgba(13,148,136,0.18)',
                                fontSize: 11.5, fontWeight: 700, color: T.teal, fontFamily: FF,
                              }}>
                                {priceLabel(item)}
                              </span>
                            </div>

                            {/* Actions: switch + capsule */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                              {/* Availability toggle */}
                              <KvSwitch on={item.is_available} onToggle={() => toggleAvailable(item)} size="sm" />

                              {/* Action capsule: Duplicate · Edit · Delete */}
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: 1,
                                background: T.bg, borderRadius: 22,
                                border: `1.5px solid ${T.border}`,
                                padding: '2px 3px', flexShrink: 0,
                              }}>
                                <button
                                  onClick={() => duplicateItem(item)}
                                  title="Duplicar"
                                  className="kv-act-btn"
                                  style={{
                                    width: 30, height: 30, borderRadius: 8, background: 'none',
                                    border: 'none', cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', color: T.textMuted,
                                  }}
                                >
                                  <Copy size={13} strokeWidth={2} />
                                </button>
                                <button
                                  onClick={() => openItemModal(cat.id, item)}
                                  title="Editar"
                                  className="kv-act-btn"
                                  style={{
                                    width: 30, height: 30, borderRadius: 8, background: 'none',
                                    border: 'none', cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', color: T.textMuted,
                                  }}
                                >
                                  <Pencil size={13} strokeWidth={2} />
                                </button>
                                <button
                                  onClick={() => deleteItem(item.id)}
                                  title="Eliminar"
                                  className="kv-trash-btn"
                                  style={{
                                    width: 30, height: 30, borderRadius: 8, background: 'none',
                                    border: 'none', cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', color: '#F87171',
                                  }}
                                >
                                  <Trash2 size={13} strokeWidth={2} />
                                </button>
                              </div>
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
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.68)',
            zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 16px',
          }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={{
            background: T.white, borderRadius: 22,
            width: '100%', maxWidth: 440, maxHeight: '90vh',
            overflowY: 'auto', boxShadow: '0 28px 70px rgba(0,0,0,0.38)',
          }}>
            {/* Sticky header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 20px 16px', borderBottom: `1.5px solid ${T.border}`,
              position: 'sticky', top: 0, background: T.white, zIndex: 2,
              borderRadius: '22px 22px 0 0',
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.navy, fontFamily: FF, letterSpacing: '-0.2px' }}>
                  {modal.type === 'category' ? 'Nueva categoría' : form.id ? 'Editar producto' : 'Nuevo producto'}
                </h3>
                {modal.type === 'item' && (
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: T.textMuted }}>
                    Completá los datos del producto
                  </p>
                )}
              </div>
              <button
                onClick={closeModal}
                style={{
                  width: 32, height: 32, borderRadius: 10, background: T.bg,
                  border: `1.5px solid ${T.border}`, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: T.textSec,
                }}
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>

            <div style={{ padding: '18px 20px 24px' }}>
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
                      padding: '12px 14px', border: `1.5px solid ${T.border}`, borderRadius: 11,
                      fontSize: 14, fontFamily: FF, color: T.navy, outline: 'none',
                      background: T.bg,
                    }}
                  />
                  <button
                    onClick={saveCategory}
                    disabled={saving}
                    style={{
                      width: '100%', padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                      background: saving ? T.border : GTEAL,
                      color: saving ? T.textMuted : '#fff',
                      border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FF,
                    }}
                  >
                    {saving ? 'Guardando...' : 'Agregar categoría'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 6 }}>
                      Nombre *
                    </label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Nombre del producto"
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '12px 14px', border: `1.5px solid ${T.border}`, borderRadius: 11,
                        fontSize: 14, fontFamily: FF, color: T.navy, outline: 'none',
                        background: T.bg,
                      }}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 6 }}>
                      Descripción
                    </label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Descripción opcional"
                      rows={2}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '12px 14px', border: `1.5px solid ${T.border}`, borderRadius: 11,
                        fontSize: 14, fontFamily: FF, color: T.navy, outline: 'none',
                        resize: 'none', background: T.bg,
                      }}
                    />
                  </div>

                  {/* Category selector */}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 6 }}>
                      Categoría
                    </label>
                    <select
                      value={form.category_id || ''}
                      onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '12px 14px', border: `1.5px solid ${T.border}`, borderRadius: 11,
                        fontSize: 14, fontFamily: FF, color: T.navy, outline: 'none',
                        background: T.bg, cursor: 'pointer',
                      }}
                    >
                      <option value="">Seleccioná una categoría</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Pricing */}
                  <div style={{
                    border: `1.5px solid ${T.border}`, borderRadius: 14,
                    padding: '16px', display: 'flex', flexDirection: 'column', gap: 14,
                    background: 'rgba(248,250,252,0.6)',
                  }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.9 }}>
                      Opciones de venta
                    </p>

                    {/* Unit */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 6 }}>
                      Imagen del producto
                    </label>
                    <div
                      onClick={() => imageRef.current?.click()}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderRadius: 14,
                        border: `2px dashed ${imageTooLarge ? '#F87171' : T.border}`,
                        background: imageTooLarge ? 'rgba(239,68,68,0.03)' : T.bg, cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        width: 60, height: 60, borderRadius: 12, overflow: 'hidden',
                        background: 'rgba(13,148,136,0.07)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid rgba(13,148,136,0.12)`,
                      }}>
                        {imagePreview
                          ? <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          : <Image size={22} color={T.teal} strokeWidth={1.5} style={{ opacity: 0.5 }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.navy }}>
                          {imagePreview ? 'Imagen seleccionada' : 'Subir imagen'}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: 11, color: imageTooLarge ? '#EF4444' : T.textMuted, lineHeight: 1.4 }}>
                          {imageTooLarge
                            ? '⚠ Imagen muy grande — máx 2 MB'
                            : imagePreview ? 'Tocá para cambiar · JPG, PNG, WebP' : 'JPG, PNG, WebP · máx 2 MB'}
                        </p>
                      </div>
                      <Upload size={16} color={T.textMuted} style={{ flexShrink: 0 }} />
                    </div>
                    <input ref={imageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                  </div>

                  {/* Availability */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', borderRadius: 14,
                    border: `1.5px solid ${T.border}`,
                    background: form.is_available ? 'rgba(13,148,136,0.04)' : T.bg,
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.navy }}>Disponible</p>
                      <p style={{ margin: '3px 0 0', fontSize: 11, color: T.textMuted }}>Visible en el menú para clientes</p>
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
                      width: '100%', padding: '14px', borderRadius: 13, fontSize: 14, fontWeight: 700,
                      background: saving ? T.border : GTEAL,
                      color: saving ? T.textMuted : '#fff',
                      border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FF,
                      boxShadow: saving ? 'none' : '0 3px 12px rgba(13,148,136,0.30)',
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
