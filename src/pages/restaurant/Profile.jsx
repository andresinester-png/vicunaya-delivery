import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Image, Loader2, Check, ToggleLeft, ToggleRight, Move, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabaseAdmin } from '../../lib/supabase.js';
import { useRestaurant } from '../../contexts/RestaurantContext.js';

const CATEGORIES = ['Rotisería', 'Parrilla', 'Pizza', 'Empanadas', 'Sushi', 'Vegano', 'Bebidas', 'Otro'];
const BUCKET = 'restaurant-images';

const parsePosition = (pos) => {
  if (!pos) return { x: 50, y: 50 };
  const parts = String(pos).replace(/%/g, '').trim().split(/\s+/);
  return { x: parseInt(parts[0]) || 50, y: parseInt(parts[1]) || 50 };
};

// ── Cover image box with drag-to-reposition ───────────────────────
function CoverPositionBox({ preview, inputRef, onChange, position, onPositionChange }) {
  const [moveMode, setMoveMode] = useState(false);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef(null);
  const dragStart    = useRef(null);

  const startDrag = (clientX, clientY) => {
    dragStart.current = { clientX, clientY, pos: { ...position } };
    setDragging(true);
  };

  const moveDrag = useCallback((clientX, clientY) => {
    if (!dragging || !dragStart.current || !containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const dx   = clientX - dragStart.current.clientX;
    const dy   = clientY - dragStart.current.clientY;
    const newX = Math.round(Math.max(0, Math.min(100, dragStart.current.pos.x - (dx / width)  * 100)));
    const newY = Math.round(Math.max(0, Math.min(100, dragStart.current.pos.y - (dy / height) * 100)));
    onPositionChange({ x: newX, y: newY });
  }, [dragging, onPositionChange]);

  const endDrag = () => { setDragging(false); dragStart.current = null; };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Foto de portada</label>
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
        className="relative rounded-2xl overflow-hidden border-2 border-dashed transition-colors"
        style={{
          height: 160,
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
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
            <Image size={24} strokeWidth={1.5} />
            <span className="text-sm font-medium">Subir foto de portada</span>
          </div>
        )}

        {/* Drag mode overlay */}
        {moveMode && preview && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/40 backdrop-blur-sm rounded-full p-2.5">
              <Move size={18} color="#fff" />
            </div>
          </div>
        )}

        {/* Upload hover overlay (only when not in move mode) */}
        {!moveMode && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 transition-opacity rounded-2xl">
            <Upload size={22} color="#fff" />
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
      <p className="text-xs text-gray-400 mt-1.5">
        {preview ? 'Tocá para cambiar · "Reposicionar" para ajustar el encuadre' : 'Recomendado: 1200 × 400 px'}
      </p>
    </div>
  );
}

// ── Simple image upload box (logo, etc.) ──────────────────────────
function ImageBox({ label, preview, inputRef, onChange, height = 100, hint }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className="relative cursor-pointer rounded-2xl overflow-hidden border-2 border-dashed border-neutral-200 hover:border-primary transition-colors"
        style={{ height, background: '#F9FAFB' }}
      >
        {preview ? (
          <img src={preview} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
            <Image size={22} strokeWidth={1.5} />
            <span className="text-sm font-medium">Subir {label.toLowerCase()}</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 transition-opacity rounded-2xl">
          <Upload size={22} color="#fff" />
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
      {hint && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function Profile() {
  const restaurant = useRestaurant();

  const [form, setForm] = useState({
    name:             '',
    description:      '',
    category:         [],
    whatsapp:         '',
    delivery_time:    '',
    delivery_price:   '',
    min_order:        '',
    pickup_address:   '',
    is_active:        true,
    payment_alias:    '',
    opening_time:     '',
    closing_time:     '',
    opening_time_2:    '',
    closing_time_2:    '',
    is_open_override:  null,
    is_open_override_2: null,
  });

  const [coverFile,    setCoverFile]    = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverPosition,setCoverPosition]= useState({ x: 50, y: 50 });
  const [logoFile,     setLogoFile]     = useState(null);
  const [logoPreview,  setLogoPreview]  = useState(null);
  const [saving,       setSaving]       = useState(false);

  const coverRef = useRef(null);
  const logoRef  = useRef(null);

  useEffect(() => {
    if (!restaurant) return;
    setForm({
      name:             restaurant.name           || '',
      description:      restaurant.description    || '',
      category:         Array.isArray(restaurant.category) ? restaurant.category : (restaurant.category ? [restaurant.category] : []),
      whatsapp:         restaurant.whatsapp       || '',
      delivery_time:    restaurant.delivery_time  ?? '',
      delivery_price:   restaurant.delivery_price ?? '',
      min_order:        restaurant.min_order      ?? '',
      pickup_address:   restaurant.pickup_address || '',
      is_active:        restaurant.is_active      ?? true,
      payment_alias:    restaurant.payment_alias  || '',
      opening_time:     restaurant.opening_time   ? restaurant.opening_time.slice(0, 5)   : '',
      closing_time:     restaurant.closing_time   ? restaurant.closing_time.slice(0, 5)   : '',
      opening_time_2:   restaurant.opening_time_2 ? restaurant.opening_time_2.slice(0, 5) : '',
      closing_time_2:   restaurant.closing_time_2 ? restaurant.closing_time_2.slice(0, 5) : '',
      is_open_override:   restaurant.is_open_override   ?? null,
      is_open_override_2: restaurant.is_open_override_2 ?? null,
    });
    setCoverPreview(restaurant.image_url  || null);
    setCoverPosition(parsePosition(restaurant.cover_position));
    setLogoPreview(restaurant.logo_url    || null);
  }, [restaurant]);

  const uploadImage = async (file, path) => {
    const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;
    return supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      const updates = {
        name:             form.name.trim(),
        description:      form.description.trim() || null,
        category:         form.category.length > 0 ? form.category : null,
        whatsapp:         form.whatsapp.trim() || null,
        delivery_time:    form.delivery_time  !== '' ? Number(form.delivery_time)  : null,
        delivery_price:   form.delivery_price !== '' ? Number(form.delivery_price) : null,
        min_order:        form.min_order      !== '' ? Number(form.min_order)      : null,
        pickup_address:   form.pickup_address.trim() || null,
        is_active:        form.is_active,
        payment_alias:    form.payment_alias.trim() || null,
        cover_position:   `${coverPosition.x}% ${coverPosition.y}%`,
        opening_time:     form.opening_time   || null,
        closing_time:     form.closing_time   || null,
        opening_time_2:   form.opening_time_2 || null,
        closing_time_2:   form.closing_time_2 || null,
        is_open_override:   form.is_open_override,
        is_open_override_2: form.is_open_override_2,
      };

      if (coverFile) {
        const ext = coverFile.name.split('.').pop();
        updates.image_url = await uploadImage(coverFile, `covers/${restaurant.id}_${Date.now()}.${ext}`);
      }

      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        updates.logo_url = await uploadImage(logoFile, `logos/${restaurant.id}_${Date.now()}.${ext}`);
      }

      const { error } = await supabaseAdmin.from('restaurants').update(updates).eq('id', restaurant.id);
      if (error) throw error;

      toast.success('Restaurante actualizado');
      setCoverFile(null);
      setLogoFile(null);
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const field = (label, key, type = 'text', extra = {}) => (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        className="input"
        {...extra}
      />
    </div>
  );

  if (!restaurant) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-extrabold text-2xl">Mi restaurante</h1>
        <p className="text-sm text-gray-400 mt-0.5">Configurá la información que ven tus clientes</p>
      </div>

      {/* Imágenes */}
      <div className="card p-5 space-y-5">
        <h2 className="font-bold text-base">Imágenes</h2>

        <CoverPositionBox
          preview={coverPreview}
          inputRef={coverRef}
          onChange={handleCoverChange}
          position={coverPosition}
          onPositionChange={setCoverPosition}
        />

        <ImageBox
          label="Logo del restaurante"
          preview={logoPreview}
          inputRef={logoRef}
          onChange={e => { const f = e.target.files[0]; if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); } }}
          height={100}
          hint="Recomendado: cuadrado, mínimo 200 × 200 px"
        />
      </div>

      {/* Información general */}
      <div className="card p-5 space-y-4">
        <h2 className="font-bold text-base">Información general</h2>
        {field('Nombre del restaurante', 'name', 'text', { placeholder: 'Ej: La Rotisería de Carlos' })}

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Descripción</label>
          <textarea
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            rows={3}
            placeholder="Breve descripción del local..."
            className="input resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Categorías</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {CATEGORIES.map(c => {
              const selected = form.category.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(p => ({
                    ...p,
                    category: selected ? p.category.filter(x => x !== c) : [...p.category, c],
                  }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                    selected ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-neutral-200'
                  }`}
                >
                  {selected && <Check size={13} />}
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {field('WhatsApp (solo números)', 'whatsapp', 'tel', { placeholder: '3571123456' })}
      </div>

      {/* Detalles de entrega */}
      <div className="card p-5 space-y-4">
        <h2 className="font-bold text-base">Detalles de entrega</h2>
        <div className="grid grid-cols-3 gap-3">
          {field('Tiempo (min)', 'delivery_time', 'number', { placeholder: '30', min: 1 })}
          {field('Envío ($)',    'delivery_price','number', { placeholder: '350', min: 0 })}
          {field('Mín. orden ($)', 'min_order',  'number', { placeholder: '1000', min: 0 })}
        </div>
      </div>

      {/* Método de pago */}
      <div className="card p-5 space-y-3">
        <h2 className="font-bold text-base">Método de pago</h2>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
            Alias / CBU para transferencias
          </label>
          <input
            type="text"
            value={form.payment_alias}
            onChange={e => setForm(p => ({ ...p, payment_alias: e.target.value }))}
            placeholder="Ej: MIALIAS.PAGO o 000000..."
            className="input"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Los clientes verán este alias para realizar la transferencia al seleccionar ese método de pago.
          </p>
        </div>
      </div>

      {/* Retiro en el local */}
      <div className="card p-5 space-y-3">
        <h2 className="font-bold text-base">Retiro en el local</h2>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
            Dirección para retiro en local
          </label>
          <input
            type="text"
            value={form.pickup_address}
            onChange={e => setForm(p => ({ ...p, pickup_address: e.target.value }))}
            placeholder="Ej: San Martín 456, Vicuña Mackenna"
            className="input"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Se le mostrará al cliente cuando elija retirar su pedido en el local.
          </p>
        </div>
      </div>

      {/* Horario mediodía */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          <h2 className="font-bold text-base">Horario mediodía</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Apertura</label>
            <input
              type="time"
              value={form.opening_time}
              onChange={e => setForm(p => ({ ...p, opening_time: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Cierre</label>
            <input
              type="time"
              value={form.closing_time}
              onChange={e => setForm(p => ({ ...p, closing_time: e.target.value }))}
              className="input"
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
          <div>
            <p className="font-semibold text-red-600">Forzar cierre mediodía</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {form.is_open_override === false
                ? 'Este turno siempre cerrado'
                : 'El horario determina si está abierto'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, is_open_override: p.is_open_override === false ? null : false }))}
          >
            {form.is_open_override === false
              ? <ToggleRight size={42} className="text-red-500" />
              : <ToggleLeft  size={42} className="text-gray-300" />}
          </button>
        </div>
      </div>

      {/* Horario noche */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          <h2 className="font-bold text-base">Horario noche</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Apertura</label>
            <input
              type="time"
              value={form.opening_time_2}
              onChange={e => setForm(p => ({ ...p, opening_time_2: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Cierre</label>
            <input
              type="time"
              value={form.closing_time_2}
              onChange={e => setForm(p => ({ ...p, closing_time_2: e.target.value }))}
              className="input"
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
          <div>
            <p className="font-semibold text-red-600">Forzar cierre noche</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {form.is_open_override_2 === false
                ? 'Este turno siempre cerrado'
                : 'El horario determina si está abierto'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, is_open_override_2: p.is_open_override_2 === false ? null : false }))}
          >
            {form.is_open_override_2 === false
              ? <ToggleRight size={42} className="text-red-500" />
              : <ToggleLeft  size={42} className="text-gray-300" />}
          </button>
        </div>
      </div>

      {/* Estado */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Estado del local</p>
            <p className="text-xs text-gray-400 mt-0.5">{form.is_active ? 'Abierto y visible para clientes' : 'Cerrado / no visible'}</p>
          </div>
          <button onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}>
            {form.is_active
              ? <ToggleRight size={42} className="text-primary" />
              : <ToggleLeft  size={42} className="text-gray-300" />}
          </button>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4"
      >
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  );
}
