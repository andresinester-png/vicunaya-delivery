import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload, Image, Loader2, Check, Move, Clock,
  Store, Truck, CreditCard, MapPin, Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase.js';
import { useRestaurant } from '../../contexts/RestaurantContext.js';

const CATEGORIES = ['Rotisería', 'Parrilla', 'Pizza', 'Empanadas', 'Sushi', 'Vegano', 'Bebidas', 'Otro'];
const BUCKET = 'restaurant-images';

const T = {
  navy: '#0F172A', teal: '#0D9488', tealDark: '#0F766E', tealSec: '#14B8A6',
  tealLight: '#5EEAD4', bg: '#F8FAFC', white: '#FFFFFF',
  textSec: '#64748B', textMuted: '#94A3B8', border: '#E2E8F0',
};
const FF = "'Plus Jakarta Sans', sans-serif";
const GH = 'linear-gradient(160deg, #061118 0%, #0A1E2A 28%, #0D3A35 55%, #0F172A 100%)';
const GTEAL = 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)';

const CARD = {
  background: '#FFFFFF', borderRadius: 16,
  border: '1.5px solid #E2E8F0',
  boxShadow: '0 2px 8px rgba(15,23,42,0.05)',
  padding: 20, display: 'flex', flexDirection: 'column', gap: 20,
};
const LST = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8',
  textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 6,
  fontFamily: FF,
};
const IST = {
  width: '100%', boxSizing: 'border-box',
  padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10,
  fontSize: 14, fontFamily: FF, color: '#0F172A', background: '#F8FAFC',
};

const STYLES = `
  @keyframes kvSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .kv-spin { animation: kvSpin 1s linear infinite; }
  .kv-input { transition: border-color 0.15s, box-shadow 0.15s; }
  .kv-input:focus { border-color: #0D9488 !important; box-shadow: 0 0 0 3px rgba(13,148,136,0.10) !important; outline: none; }
  .kv-cover-wrap:hover .kv-cover-hover { opacity: 1 !important; }
  .kv-cat-chip:hover { background: rgba(13,148,136,0.06) !important; border-color: #0D9488 !important; }
  @media (min-width: 540px) { .kv-delivery-grid { grid-template-columns: repeat(3, 1fr) !important; } }
  @media (min-width: 400px) { .kv-time-grid { grid-template-columns: repeat(2, 1fr) !important; } }
`;

// ── VERBATIM from original ─────────────────────────────────────────
const parsePosition = (pos) => {
  if (!pos) return { x: 50, y: 50 };
  const parts = String(pos).replace(/%/g, '').trim().split(/\s+/);
  return { x: parseInt(parts[0]) || 50, y: parseInt(parts[1]) || 50 };
};

// ── Section heading ────────────────────────────────────────────────
function SH({ Icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(13,148,136,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color={T.teal} strokeWidth={2} />
      </div>
      <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.navy, letterSpacing: '-0.2px', fontFamily: FF }}>
        {children}
      </h2>
    </div>
  );
}

// ── Cover image box — ALL DRAG LOGIC VERBATIM, styles replaced ─────
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <label style={LST}>Foto de portada</label>
        {preview && (
          <button
            type="button"
            onClick={() => setMoveMode(m => !m)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 700, padding: '5px 11px', borderRadius: 20,
              background: moveMode ? T.teal : T.bg,
              color: moveMode ? '#fff' : T.textSec,
              border: `1.5px solid ${moveMode ? T.teal : T.border}`,
              cursor: 'pointer', fontFamily: FF,
            }}
          >
            <Move size={11} strokeWidth={2.5} />
            {moveMode ? 'Listo' : 'Reposicionar'}
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        className="kv-cover-wrap"
        style={{
          position: 'relative', borderRadius: 14, overflow: 'hidden',
          border: `2px dashed ${moveMode ? T.teal : T.border}`,
          height: 172, background: T.bg,
          cursor: !preview ? 'pointer' : moveMode ? (dragging ? 'grabbing' : 'grab') : 'pointer',
          userSelect: 'none', transition: 'border-color 0.2s',
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
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${position.x}% ${position.y}%` }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, color: T.textMuted }}>
            <Image size={26} strokeWidth={1.4} />
            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: FF }}>Subir foto de portada</span>
            <span style={{ fontSize: 11, color: T.textMuted, fontFamily: FF }}>Recomendado: 1200 × 400 px</span>
          </div>
        )}

        {moveMode && preview && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(4px)', borderRadius: '50%', padding: 10 }}>
              <Move size={20} color="#fff" />
            </div>
          </div>
        )}

        {!moveMode && (
          <div className="kv-cover-hover" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.45)', borderRadius: 14, opacity: 0, transition: 'opacity 0.2s' }}>
            <Upload size={24} color="#fff" />
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onChange} />
      <p style={{ margin: '6px 0 0', fontSize: 11, color: T.textMuted, fontFamily: FF }}>
        {preview ? 'Tocá para cambiar · "Reposicionar" para ajustar el encuadre' : 'JPG, PNG, WebP · Recomendado: 1200 × 400 px'}
      </p>
    </div>
  );
}

// ── Logo box ───────────────────────────────────────────────────────
function LogoBox({ preview, inputRef, onChange }) {
  return (
    <div>
      <label style={{ ...LST, marginBottom: 8 }}>Logo del restaurante</label>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div
          onClick={() => inputRef.current?.click()}
          className="kv-cover-wrap"
          style={{
            width: 88, height: 88, borderRadius: 14, overflow: 'hidden',
            border: `2px dashed ${T.border}`, background: T.bg,
            cursor: 'pointer', position: 'relative', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {preview
            ? <img src={preview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Image size={22} strokeWidth={1.4} color={T.textMuted} />}
          <div className="kv-cover-hover" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.45)', borderRadius: 14, opacity: 0, transition: 'opacity 0.2s' }}>
            <Upload size={16} color="#fff" />
          </div>
        </div>
        <div style={{ paddingTop: 2 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: FF }}>
            {preview ? 'Logo cargado' : 'Sin logo'}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: T.textMuted, lineHeight: 1.5, fontFamily: FF }}>
            Tocá el cuadrado para subir. Recomendado: cuadrado, mínimo 200 × 200 px.
          </p>
          <p style={{ margin: '3px 0 0', fontSize: 10.5, color: T.textMuted, lineHeight: 1.45, fontFamily: FF, fontStyle: 'italic' }}>
            Guardado pero no visible para clientes en esta versión.
          </p>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onChange} />
    </div>
  );
}

// ── KYVRA toggle (for is_active — standard boolean) ───────────────
function KvSwitch({ on, onToggle }) {
  const w = 46, h = 26, dot = 20;
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        width: w, height: h, borderRadius: h,
        background: on ? GTEAL : T.border,
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s', flexShrink: 0, padding: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: (h - dot) / 2, width: dot, height: dot, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        transition: 'left 0.2s', left: on ? w - dot - 3 : 3,
      }} />
    </button>
  );
}

// ── Closure control (null/false ONLY — is_open_override) ──────────
function ClosureControl({ value, onToggle }) {
  const forced = value === false;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: '12px 14px', borderRadius: 12,
      background: forced ? 'rgba(239,68,68,0.05)' : 'rgba(13,148,136,0.04)',
      border: `1.5px solid ${forced ? 'rgba(239,68,68,0.18)' : 'rgba(13,148,136,0.14)'}`,
    }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: forced ? '#DC2626' : T.teal, fontFamily: FF }}>
          {forced ? 'Cierre forzado activo' : 'Según horario configurado'}
        </p>
        <p style={{ margin: '3px 0 0', fontSize: 11, color: T.textMuted, lineHeight: 1.4, fontFamily: FF }}>
          {forced
            ? 'Este turno no acepta pedidos sin importar el horario'
            : 'Los clientes pueden pedir dentro del horario definido'}
        </p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        style={{
          flexShrink: 0, padding: '7px 13px', borderRadius: 9,
          fontSize: 11, fontWeight: 700,
          background: forced ? 'rgba(239,68,68,0.08)' : T.bg,
          color: forced ? '#DC2626' : T.textSec,
          border: `1.5px solid ${forced ? 'rgba(239,68,68,0.22)' : T.border}`,
          cursor: 'pointer', fontFamily: FF, whiteSpace: 'nowrap',
        }}
      >
        {forced ? 'Restaurar horario' : 'Forzar cierre'}
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────
export default function Profile() {
  const restaurant = useRestaurant();

  const [form, setForm] = useState({
    name:               '',
    description:        '',
    category:           [],
    whatsapp:           '',
    delivery_time:      '',
    delivery_price:     '',
    min_order:          '',
    pickup_address:     '',
    is_active:          true,
    payment_alias:      '',
    opening_time:       '',
    closing_time:       '',
    opening_time_2:     '',
    closing_time_2:     '',
    is_open_override:   null,
    is_open_override_2: null,
  });

  const [coverFile,     setCoverFile]     = useState(null);
  const [coverPreview,  setCoverPreview]  = useState(null);
  const [coverPosition, setCoverPosition] = useState({ x: 50, y: 50 });
  const [logoFile,      setLogoFile]      = useState(null);
  const [logoPreview,   setLogoPreview]   = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [dirty,         setDirty]         = useState(false);

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
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setDirty(true);
  };

  const upd = (fn) => { setForm(fn); setDirty(true); };

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

      const { error } = await supabase.from('restaurants').update(updates).eq('id', restaurant.id);
      if (error) throw error;

      toast.success('Restaurante actualizado');
      setCoverFile(null);
      setLogoFile(null);
      setDirty(false);
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!restaurant) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ height: 96 + i * 8, background: T.border, borderRadius: 16, opacity: 0.35 + i * 0.06 }} />
      ))}
    </div>
  );

  return (
    <div style={{ fontFamily: FF, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 680 }}>
      <style>{STYLES}</style>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div style={{ background: GH, borderRadius: 20, padding: '22px 20px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, background: 'radial-gradient(circle, rgba(13,148,136,0.22) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(13,148,136,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Store size={14} color={T.tealLight} strokeWidth={2} />
              </div>
              <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 1.6, color: T.tealLight, textTransform: 'uppercase', fontFamily: FF }}>
                Mi restaurante · Kyvra
              </span>
            </div>

            <h1 style={{ margin: '0 0 3px', fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.4px', lineHeight: 1.1, fontFamily: FF, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {restaurant.name}
            </h1>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: 'rgba(255,255,255,0.50)', lineHeight: 1.4, fontFamily: FF }}>
              Esta configuración afecta la experiencia de tus clientes
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span style={{
                padding: '4px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: FF,
                background: form.is_active ? 'rgba(13,148,136,0.18)' : 'rgba(255,255,255,0.07)',
                color: form.is_active ? T.tealLight : 'rgba(255,255,255,0.45)',
                border: `1px solid ${form.is_active ? 'rgba(13,148,136,0.30)' : 'rgba(255,255,255,0.10)'}`,
              }}>
                {form.is_active ? '● Visible' : '○ Oculto'}
              </span>
              {dirty && (
                <span style={{
                  padding: '4px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: FF,
                  background: 'rgba(245,158,11,0.15)', color: '#FCD34D',
                  border: '1px solid rgba(245,158,11,0.25)',
                }}>
                  Sin guardar
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 18px', borderRadius: 12, border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              background: saving ? 'rgba(255,255,255,0.10)' : GTEAL,
              color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: FF,
              boxShadow: saving ? 'none' : '0 4px 14px rgba(13,148,136,0.45)',
              flexShrink: 0, whiteSpace: 'nowrap', alignSelf: 'flex-start',
            }}
          >
            {saving ? <Loader2 size={14} className="kv-spin" /> : <Check size={14} strokeWidth={2.5} />}
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* ── Imágenes y perfil ─────────────────────────────────────── */}
      <div style={CARD}>
        <SH Icon={Store}>Imágenes y perfil</SH>

        <CoverPositionBox
          preview={coverPreview}
          inputRef={coverRef}
          onChange={handleCoverChange}
          position={coverPosition}
          onPositionChange={(pos) => { setCoverPosition(pos); setDirty(true); }}
        />

        <LogoBox
          preview={logoPreview}
          inputRef={logoRef}
          onChange={e => { const f = e.target.files[0]; if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); setDirty(true); } }}
        />

        <div>
          <label style={LST}>
            Nombre del restaurante <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={e => upd(p => ({ ...p, name: e.target.value }))}
            placeholder="Ej: La Rotisería de Carlos"
            className="kv-input"
            style={IST}
          />
        </div>

        <div>
          <label style={LST}>Descripción</label>
          <textarea
            value={form.description}
            onChange={e => upd(p => ({ ...p, description: e.target.value }))}
            rows={3}
            placeholder="Breve descripción del local..."
            className="kv-input"
            style={{ ...IST, resize: 'none', lineHeight: 1.55 }}
          />
        </div>

        <div>
          <label style={LST}>Categorías</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {CATEGORIES.map(c => {
              const selected = form.category.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => upd(p => ({
                    ...p,
                    category: selected ? p.category.filter(x => x !== c) : [...p.category, c],
                  }))}
                  className={selected ? undefined : 'kv-cat-chip'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 13px', borderRadius: 20, fontSize: 12.5, fontWeight: 700,
                    background: selected ? GTEAL : 'transparent',
                    color: selected ? '#fff' : T.textSec,
                    border: `1.5px solid ${selected ? 'transparent' : T.border}`,
                    cursor: 'pointer', fontFamily: FF, transition: 'background 0.15s, border-color 0.15s',
                  }}
                >
                  {selected && <Check size={12} strokeWidth={2.5} />}
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={LST}>WhatsApp</label>
          <input
            type="tel"
            value={form.whatsapp}
            onChange={e => upd(p => ({ ...p, whatsapp: e.target.value }))}
            placeholder="3571123456 (sin 0 y sin 15)"
            className="kv-input"
            style={IST}
          />
          <p style={{ margin: '5px 0 0', fontSize: 11, color: T.textMuted, fontFamily: FF }}>
            Solo números. Se usará para contacto y pedidos por WhatsApp.
          </p>
        </div>
      </div>

      {/* ── Detalles de entrega ───────────────────────────────────── */}
      <div style={CARD}>
        <SH Icon={Truck}>Detalles de entrega</SH>
        <div className="kv-delivery-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          <div>
            <label style={LST}>Tiempo de entrega</label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={form.delivery_time}
                onChange={e => upd(p => ({ ...p, delivery_time: e.target.value }))}
                placeholder="30"
                min={1}
                className="kv-input"
                style={{ ...IST, paddingRight: 42 }}
              />
              <span style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 700, color: T.textMuted, pointerEvents: 'none', fontFamily: FF }}>
                min
              </span>
            </div>
          </div>
          <div>
            <label style={LST}>Costo de envío</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: T.textMuted, pointerEvents: 'none', fontFamily: FF }}>$</span>
              <input
                type="number"
                value={form.delivery_price}
                onChange={e => upd(p => ({ ...p, delivery_price: e.target.value }))}
                placeholder="350"
                min={0}
                className="kv-input"
                style={{ ...IST, paddingLeft: 26 }}
              />
            </div>
          </div>
          <div>
            <label style={LST}>Pedido mínimo</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: T.textMuted, pointerEvents: 'none', fontFamily: FF }}>$</span>
              <input
                type="number"
                value={form.min_order}
                onChange={e => upd(p => ({ ...p, min_order: e.target.value }))}
                placeholder="1000"
                min={0}
                className="kv-input"
                style={{ ...IST, paddingLeft: 26 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Método de pago ────────────────────────────────────────── */}
      <div style={CARD}>
        <SH Icon={CreditCard}>Método de pago</SH>
        <div>
          <label style={LST}>Alias / CBU para transferencias</label>
          <input
            type="text"
            value={form.payment_alias}
            onChange={e => upd(p => ({ ...p, payment_alias: e.target.value }))}
            placeholder="Ej: MIALIAS.PAGO o 000000..."
            className="kv-input"
            style={IST}
          />
          <p style={{ margin: '6px 0 0', fontSize: 11, color: T.textMuted, lineHeight: 1.45, fontFamily: FF }}>
            Los clientes verán este alias al seleccionar transferencia como método de pago.
          </p>
        </div>
      </div>

      {/* ── Retiro en el local ────────────────────────────────────── */}
      <div style={CARD}>
        <SH Icon={MapPin}>Retiro en el local</SH>
        <div>
          <label style={LST}>Dirección para retiro</label>
          <input
            type="text"
            value={form.pickup_address}
            onChange={e => upd(p => ({ ...p, pickup_address: e.target.value }))}
            placeholder="Ej: San Martín 456, Vicuña Mackenna"
            className="kv-input"
            style={IST}
          />
          <p style={{ margin: '6px 0 0', fontSize: 11, color: T.textMuted, lineHeight: 1.45, fontFamily: FF }}>
            Se mostrará al cliente cuando elija retirar su pedido en el local.
          </p>
        </div>
      </div>

      {/* ── Horario mediodía ──────────────────────────────────────── */}
      <div style={CARD}>
        <SH Icon={Clock}>Turno 1 · Mediodía</SH>
        <div className="kv-time-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          <div>
            <label style={LST}>Apertura</label>
            <input
              type="time"
              value={form.opening_time}
              onChange={e => upd(p => ({ ...p, opening_time: e.target.value }))}
              className="kv-input"
              style={IST}
            />
          </div>
          <div>
            <label style={LST}>Cierre</label>
            <input
              type="time"
              value={form.closing_time}
              onChange={e => upd(p => ({ ...p, closing_time: e.target.value }))}
              className="kv-input"
              style={IST}
            />
          </div>
        </div>
        <ClosureControl
          value={form.is_open_override}
          onToggle={() => upd(p => ({ ...p, is_open_override: p.is_open_override === false ? null : false }))}
        />
      </div>

      {/* ── Horario noche ─────────────────────────────────────────── */}
      <div style={CARD}>
        <SH Icon={Clock}>Turno 2 · Noche</SH>
        <div className="kv-time-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          <div>
            <label style={LST}>Apertura</label>
            <input
              type="time"
              value={form.opening_time_2}
              onChange={e => upd(p => ({ ...p, opening_time_2: e.target.value }))}
              className="kv-input"
              style={IST}
            />
          </div>
          <div>
            <label style={LST}>Cierre</label>
            <input
              type="time"
              value={form.closing_time_2}
              onChange={e => upd(p => ({ ...p, closing_time_2: e.target.value }))}
              className="kv-input"
              style={IST}
            />
          </div>
        </div>
        <ClosureControl
          value={form.is_open_override_2}
          onToggle={() => upd(p => ({ ...p, is_open_override_2: p.is_open_override_2 === false ? null : false }))}
        />
      </div>

      {/* ── Visibilidad del local ─────────────────────────────────── */}
      <div style={{ ...CARD, gap: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: form.is_active ? 'rgba(13,148,136,0.10)' : 'rgba(148,163,184,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Globe size={15} color={form.is_active ? T.teal : T.textMuted} strokeWidth={2} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.navy, fontFamily: FF, letterSpacing: '-0.15px' }}>
                Visibilidad del local
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 600, color: form.is_active ? T.teal : T.textMuted, fontFamily: FF }}>
                {form.is_active ? 'Visible · acepta pedidos' : 'Oculto · no aparece en el catálogo'}
              </p>
            </div>
          </div>
          <KvSwitch
            on={form.is_active}
            onToggle={() => upd(p => ({ ...p, is_active: !p.is_active }))}
          />
        </div>
      </div>

      {/* ── Save ─────────────────────────────────────────────────── */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%', padding: '15px 0', borderRadius: 14, border: 'none',
          cursor: saving ? 'not-allowed' : 'pointer',
          background: saving ? T.border : GTEAL,
          color: saving ? T.textSec : '#fff',
          fontSize: 15, fontWeight: 800, fontFamily: FF, letterSpacing: '-0.1px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: saving ? 'none' : '0 6px 20px rgba(13,148,136,0.38)',
          transition: 'background 0.2s, box-shadow 0.2s', marginBottom: 8,
        }}
      >
        {saving
          ? <Loader2 size={18} className="kv-spin" />
          : <Check size={18} strokeWidth={2.5} />}
        {saving ? 'Guardando cambios…' : 'Guardar cambios'}
      </button>
    </div>
  );
}
