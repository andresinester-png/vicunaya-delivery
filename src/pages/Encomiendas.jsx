import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Clock, MapPin, Phone, Package, Truck,
  CheckCircle, X, ArrowRight, Send,
  ThumbsUp, MessageSquare, Check, CheckCheck, Camera, Image,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';
import { KYVRA } from '../lib/theme.js';

const FF = "'Plus Jakarta Sans', sans-serif";
const EMPRESA_ID = '5c5ce5e7-25b8-4e53-be85-05af7a85a224';

const ALL_DAYS = [
  { val: 'lunes',     label: 'Lunes'     },
  { val: 'martes',    label: 'Martes'    },
  { val: 'miercoles', label: 'Miércoles' },
  { val: 'jueves',    label: 'Jueves'    },
  { val: 'viernes',   label: 'Viernes'   },
  { val: 'sabado',    label: 'Sábado'    },
  { val: 'domingo',   label: 'Domingo'   },
];

const PESOS = [
  { val: 'liviano', label: 'Liviano', sub: 'hasta 5 kg'   },
  { val: 'mediano', label: 'Mediano', sub: '5 – 20 kg'    },
  { val: 'pesado',  label: 'Pesado',  sub: 'más de 20 kg' },
];

const DIMENSIONES = [
  { val: 'pequeño',    label: 'Pequeño',            sub: 'entra en una mochila'       },
  { val: 'mediano',    label: 'Mediano',             sub: 'caja tipo zapatillas'       },
  { val: 'grande',     label: 'Grande',              sub: 'caja TV / valija'           },
  { val: 'voluminoso', label: 'Mueble / voluminoso', sub: 'requiere logística especial'},
];

const FRANJAS = [
  { val: 'manana', label: 'Mañana', sub: '8:00 – 12:00'  },
  { val: 'tarde',  label: 'Tarde',  sub: '12:00 – 17:00' },
  { val: 'noche',  label: 'Noche',  sub: '17:00 – 20:00' },
];

const EMPTY_FORM = {
  cliente_nombre:        '',
  cliente_telefono:      '',
  telefono_destinatario: '',
  tipo:                  '',
  descripcion:           '',
  peso:                  '',
  dimensiones:           '',
  direccion_origen:      '',
  direccion_destino:     '',
  fecha_envio:           '',
  franja_horaria:        '',
};

const ESTADO_LABEL = {
  pendiente:     'Pendiente',
  presupuestado: 'Con presupuesto',
  confirmado:    'Confirmado',
  en_camino:     'En camino',
  entregado:     'Entregado',
  cancelado:     'Cancelado',
};

const ESTADO_COLOR = {
  pendiente:     { bg: '#FEF3C7', text: '#92400E' },
  presupuestado: { bg: '#DBEAFE', text: '#1E40AF' },
  confirmado:    { bg: KYVRA.tealBg, text: KYVRA.tealDark },
  en_camino:     { bg: '#EDE9FE', text: '#5B21B6' },
  entregado:     { bg: '#D1FAE5', text: '#065F46' },
  cancelado:     { bg: '#FEE2E2', text: '#991B1B' },
};

const ESTADOS_ACTIVOS   = ['pendiente', 'presupuestado', 'confirmado', 'en_camino'];
const ESTADOS_HISTORIAL = ['entregado', 'cancelado'];

function fmtMiles(n) {
  return Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 });
}

/* ── shared primitives ─────────────────────────────────────── */

function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 800, color: KYVRA.textMuted,
      letterSpacing: '0.07em', textTransform: 'uppercase',
      margin: '0 0 8px', fontFamily: FF,
    }}>
      {children}
    </p>
  );
}

function FieldLabel({ children }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5, fontFamily: FF }}>
      {children}
    </label>
  );
}

const INP = {
  width: '100%', boxSizing: 'border-box',
  border: `1.5px solid ${KYVRA.border}`, borderRadius: 12,
  padding: '12px 14px', fontSize: 14, outline: 'none',
  fontFamily: FF, background: KYVRA.bg, color: KYVRA.navy, fontWeight: 600,
};

function OptionGrid({ options, value, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {options.map(o => {
        const active = value === o.val;
        return (
          <button
            key={o.val}
            type="button"
            onClick={() => onChange(o.val)}
            style={{
              border: `2px solid ${active ? KYVRA.teal : KYVRA.border}`,
              borderRadius: 12, padding: '10px 10px', textAlign: 'left',
              background: active ? KYVRA.tealBg : KYVRA.white,
              cursor: 'pointer', transition: 'all 0.15s', fontFamily: FF,
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 700, color: active ? KYVRA.tealDark : KYVRA.navy, margin: 0 }}>{o.label}</p>
            {o.sub && <p style={{ fontSize: 11, color: active ? KYVRA.teal : KYVRA.textMuted, margin: '3px 0 0' }}>{o.sub}</p>}
          </button>
        );
      })}
    </div>
  );
}

/* ── SolicitudForm ─────────────────────────────────────────── */
function SolicitudForm({ onClose, cfg }) {
  const { profile, session } = useAuth();
  const [form, setForm]      = useState(EMPTY_FORM);
  const [loading, setLoading]   = useState(false);
  const [enviado, setEnviado]   = useState(false);
  const [foto, setFoto]         = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const fotoRef    = useRef(null);
  const galeriaRef = useRef(null);

  useEffect(() => {
    if (profile) {
      setForm(f => ({
        ...f,
        cliente_nombre:   [profile.nombre, profile.apellido].filter(Boolean).join(' '),
        cliente_telefono: profile.telefono || '',
      }));
    }
  }, [profile]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFoto(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const CAMPO_LABEL = {
      cliente_nombre:        'Nombre completo',
      cliente_telefono:      'Teléfono',
      telefono_destinatario: 'Teléfono de quien recibe',
      tipo:                  'Qué querés hacer',
      direccion_destino:     'Dirección de destino',
      fecha_envio:           'Fecha de envío',
      franja_horaria:        'Rango horario de entrega',
    };
    const faltantes = Object.keys(CAMPO_LABEL).filter(k => !form[k]);
    if (faltantes.length > 0) {
      toast.error(`Faltá completar: ${faltantes.map(k => CAMPO_LABEL[k]).join(', ')}`, { duration: 4000 });
      return;
    }
    setLoading(true);

    const { data: encData, error } = await supabase.from('encomiendas').insert({
      empresa_id:            EMPRESA_ID,
      user_id:               session?.user?.id ?? null,
      cliente_nombre:        form.cliente_nombre.trim(),
      cliente_telefono:      form.cliente_telefono.trim(),
      telefono_destinatario: form.telefono_destinatario.trim(),
      tipo:                  form.tipo,
      descripcion:           form.descripcion.trim(),
      peso:                  form.peso,
      dimensiones:           form.dimensiones,
      direccion_origen:      form.direccion_origen.trim() || null,
      direccion_destino:     form.direccion_destino.trim() || null,
      fecha_envio:           form.fecha_envio,
      franja_horaria:        form.franja_horaria.trim(),
      estado:                'pendiente',
    }).select('id').single();

    if (error) { toast.error('Error al enviar la solicitud. Intentá de nuevo.'); setLoading(false); return; }

    if (foto && encData?.id) {
      const ext  = foto.name.split('.').pop() || 'jpg';
      const path = `${encData.id}/paquete.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('encomiendas-fotos')
        .upload(path, foto, { upsert: true, contentType: foto.type });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('encomiendas-fotos').getPublicUrl(path);
        await supabase.from('encomiendas').update({ foto_url: urlData.publicUrl }).eq('id', encData.id);
      }
    }

    setLoading(false);
    setEnviado(true);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: KYVRA.bg, borderRadius: '24px 24px 0 0',
          width: '100%', maxWidth: 520,
          maxHeight: '92vh', display: 'flex', flexDirection: 'column',
          fontFamily: FF,
        }}
      >
        {/* Handle */}
        <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, background: KYVRA.border, borderRadius: 99, margin: '0 auto 14px' }} />
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingBottom: 14, marginBottom: 4, borderBottom: `1px solid ${KYVRA.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: KYVRA.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={18} color={KYVRA.teal} strokeWidth={2} />
              </div>
              <h2 style={{ fontWeight: 900, fontSize: 17, margin: 0, color: KYVRA.navy }}>Presupuestar encomienda</h2>
            </div>
            <button
              onClick={onClose}
              style={{ background: KYVRA.bg, border: `1px solid ${KYVRA.border}`, borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={16} color={KYVRA.textSec} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '16px 20px 40px', flex: 1 }}>
          {enviado ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '48px 24px' }}
            >
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(145deg, #0D9488, #14B8A6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(13,148,136,0.30)',
              }}>
                <CheckCircle size={34} color="#fff" strokeWidth={2} />
              </div>
              <h3 style={{ fontWeight: 900, fontSize: 22, margin: '0 0 10px', color: KYVRA.navy }}>¡Solicitud enviada!</h3>
              <p style={{ fontSize: 14, color: KYVRA.textSec, lineHeight: 1.6, maxWidth: 280, margin: '0 auto 28px' }}>
                Recibimos tu pedido. Te contactaremos pronto con el presupuesto.
              </p>
              <button
                onClick={onClose}
                style={{
                  background: 'linear-gradient(135deg, #0D9488, #14B8A6)', color: '#fff',
                  border: 'none', borderRadius: 14, padding: '13px 32px',
                  fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: FF,
                  boxShadow: '0 4px 16px rgba(13,148,136,0.30)',
                }}
              >
                Cerrar
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Tipo */}
              <div>
                <SectionLabel>Tipo de envío *</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { val: 'enviar', label: 'Quiero enviar algo a Río Cuarto' },
                    { val: 'traer',  label: 'Quiero traer algo de Río Cuarto'  },
                  ].map(o => {
                    const active = form.tipo === o.val;
                    return (
                      <button
                        key={o.val} type="button" onClick={() => set('tipo', o.val)}
                        style={{
                          border: `2px solid ${active ? KYVRA.teal : KYVRA.border}`,
                          borderRadius: 14, padding: '13px 14px', textAlign: 'left',
                          background: active ? KYVRA.tealBg : KYVRA.white,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                          fontFamily: FF, transition: 'all 0.15s',
                        }}
                      >
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%',
                          border: `2.5px solid ${active ? KYVRA.teal : KYVRA.border}`,
                          background: active ? KYVRA.teal : 'transparent',
                          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {active && <div style={{ width: 7, height: 7, background: '#fff', borderRadius: '50%' }} />}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: active ? KYVRA.tealDark : KYVRA.navy }}>{o.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tus datos */}
              <div style={{ background: KYVRA.white, borderRadius: 16, padding: 16, border: `1px solid ${KYVRA.border}` }}>
                <SectionLabel>Tus datos</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <FieldLabel>Nombre completo *</FieldLabel>
                    <input style={INP} type="text" placeholder="Juan García" value={form.cliente_nombre} onChange={e => set('cliente_nombre', e.target.value)} required />
                  </div>
                  <div>
                    <FieldLabel>Tu teléfono *</FieldLabel>
                    <input style={INP} type="tel" placeholder="3583 000-000" value={form.cliente_telefono} onChange={e => set('cliente_telefono', e.target.value)} required />
                  </div>
                  <div>
                    <FieldLabel>Teléfono de quien recibe (WhatsApp) *</FieldLabel>
                    <input style={INP} type="tel" placeholder="3583 000-000" value={form.telefono_destinatario} onChange={e => set('telefono_destinatario', e.target.value)} required />
                  </div>
                </div>
              </div>

              {/* Ruta */}
              <div style={{ background: KYVRA.white, borderRadius: 16, padding: 16, border: `1px solid ${KYVRA.border}` }}>
                <SectionLabel>Ruta del paquete</SectionLabel>
                <div style={{ display: 'flex', gap: 14 }}>
                  {/* Connector line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 36, flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: KYVRA.teal, boxShadow: `0 0 0 3px ${KYVRA.tealBg}` }} />
                    <div style={{ width: 2, height: 34, background: `linear-gradient(to bottom, ${KYVRA.teal}, ${KYVRA.navy})`, margin: '3px 0' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: KYVRA.navy, boxShadow: `0 0 0 3px rgba(15,23,42,0.10)` }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <FieldLabel>Dirección de origen (de dónde se retira)</FieldLabel>
                      <input style={INP} type="text" placeholder="Calle y número, ciudad" value={form.direccion_origen} onChange={e => set('direccion_origen', e.target.value)} />
                    </div>
                    <div>
                      <FieldLabel>Dirección de destino *</FieldLabel>
                      <input style={INP} type="text" placeholder="Calle y número, ciudad" value={form.direccion_destino} onChange={e => set('direccion_destino', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div style={{ background: KYVRA.white, borderRadius: 16, padding: 16, border: `1px solid ${KYVRA.border}` }}>
                <SectionLabel>Descripción del paquete</SectionLabel>
                <textarea
                  placeholder="¿Qué es? Ej: ropa, repuesto de auto, documentación..."
                  value={form.descripcion}
                  onChange={e => set('descripcion', e.target.value)}
                  rows={3}
                  style={{ ...INP, resize: 'none' }}
                />
              </div>

              {/* Dimensiones */}
              <div>
                <SectionLabel>Dimensiones aproximadas</SectionLabel>
                <OptionGrid options={DIMENSIONES} value={form.dimensiones} onChange={v => set('dimensiones', v)} />
              </div>

              {/* Foto */}
              <div style={{ background: KYVRA.white, borderRadius: 16, padding: 16, border: `1px solid ${KYVRA.border}` }}>
                <SectionLabel>Foto del paquete (opcional)</SectionLabel>
                <input ref={fotoRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFotoChange} />
                <input ref={galeriaRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFotoChange} />

                {fotoPreview ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
                      <img src={fotoPreview} alt="Foto del paquete" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12, border: `2px solid ${KYVRA.border}`, display: 'block' }} />
                      <button
                        type="button"
                        onClick={() => { setFoto(null); setFotoPreview(null); }}
                        style={{ position: 'absolute', top: -8, right: -8, background: '#DC2626', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      <button type="button" onClick={() => fotoRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: KYVRA.tealBg, color: KYVRA.tealDark, border: 'none', borderRadius: 9, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FF }}>
                        <Camera size={13} /> Cambiar foto
                      </button>
                      <button type="button" onClick={() => galeriaRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: KYVRA.bg, color: KYVRA.textSec, border: `1px solid ${KYVRA.border}`, borderRadius: 9, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FF }}>
                        <Image size={13} /> Elegir otra
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button type="button" onClick={() => fotoRef.current?.click()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7, border: `2px dashed ${KYVRA.teal}`, borderRadius: 14, padding: '18px 8px', background: KYVRA.tealBg, color: KYVRA.tealDark, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FF }}>
                      <Camera size={22} color={KYVRA.teal} />
                      Sacar foto
                    </button>
                    <button type="button" onClick={() => galeriaRef.current?.click()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7, border: `2px dashed ${KYVRA.border}`, borderRadius: 14, padding: '18px 8px', background: KYVRA.bg, color: KYVRA.textSec, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FF }}>
                      <Image size={22} color={KYVRA.textMuted} />
                      Elegir de galería
                    </button>
                  </div>
                )}
              </div>

              {/* Cuándo */}
              <div style={{ background: KYVRA.white, borderRadius: 16, padding: 16, border: `1px solid ${KYVRA.border}` }}>
                <SectionLabel>Cuándo</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <FieldLabel>Fecha de envío deseada *</FieldLabel>
                    <input style={INP} type="date" value={form.fecha_envio} onChange={e => set('fecha_envio', e.target.value)} min={new Date().toISOString().slice(0, 10)} required />
                  </div>
                  <div>
                    <FieldLabel>Rango horario de entrega *</FieldLabel>
                    <input style={INP} type="text" placeholder="Ej: entre 14 y 18 hs, después de las 17 hs..." value={form.franja_horaria} onChange={e => set('franja_horaria', e.target.value)} required />
                    {cfg?.horario_entrega_desde && cfg?.horario_entrega_hasta && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                        <Clock size={12} color={KYVRA.textMuted} />
                        <span style={{ fontSize: 12, color: KYVRA.textSec, fontFamily: FF }}>
                          El comisionista entrega de {cfg.horario_entrega_desde} a {cfg.horario_entrega_hasta} hs
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: loading ? KYVRA.border : 'linear-gradient(135deg, #0D9488, #14B8A6)',
                  color: loading ? KYVRA.textMuted : '#fff',
                  border: 'none', borderRadius: 16, padding: '16px 0',
                  fontWeight: 900, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: FF, boxShadow: loading ? 'none' : '0 6px 20px rgba(13,148,136,0.35)',
                  letterSpacing: '-0.01em',
                }}
              >
                <Send size={17} />
                {loading ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ── ChatClientModal ───────────────────────────────────────── */
function ChatClientModal({ encomienda, onClose, onRead }) {
  const [mensajes, setMensajes]   = useState([]);
  const [texto, setTexto]         = useState('');
  const [sending, setSending]     = useState(false);
  const [loadError, setLoadError] = useState(null);
  const bottomRef                 = useRef(null);

  const cargarYMarcar = async () => {
    const { data, error } = await supabase
      .from('mensajes_encomienda')
      .select('*')
      .eq('encomienda_id', encomienda.id)
      .order('created_at', { ascending: true });

    if (error) { setLoadError(error.message); return; }
    setMensajes(data || []);

    const hayNoLeidos = data?.some(m => m.remitente === 'empresa' && !m.leido);
    if (hayNoLeidos) {
      const { error: markErr } = await supabase
        .from('mensajes_encomienda')
        .update({ leido: true })
        .eq('encomienda_id', encomienda.id)
        .eq('remitente', 'empresa')
        .eq('leido', false);
      if (!markErr) {
        setMensajes(prev => prev.map(m => m.remitente === 'empresa' ? { ...m, leido: true } : m));
        onRead(encomienda.id);
      }
    }
  };

  useEffect(() => {
    cargarYMarcar();
    const ch = supabase
      .channel(`chat-cliente-${encomienda.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes_encomienda', filter: `encomienda_id=eq.${encomienda.id}` }, async (payload) => {
        const msg = payload.new;
        setMensajes(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        if (msg.remitente === 'empresa') {
          await supabase.from('mensajes_encomienda').update({ leido: true }).eq('id', msg.id);
          setMensajes(prev => prev.map(m => m.id === msg.id ? { ...m, leido: true } : m));
          onRead(encomienda.id);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mensajes_encomienda', filter: `encomienda_id=eq.${encomienda.id}` }, (payload) => {
        setMensajes(prev => prev.map(m => m.id === payload.new.id ? { ...m, leido: payload.new.leido } : m));
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [encomienda.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const enviar = async (e) => {
    e.preventDefault();
    const msg = texto.trim();
    if (!msg || sending) return;
    setSending(true);
    setTexto('');
    const { data, error } = await supabase
      .from('mensajes_encomienda')
      .insert({ encomienda_id: encomienda.id, remitente: 'cliente', mensaje: msg })
      .select().single();
    if (error) { toast.error('Error al enviar el mensaje'); setTexto(msg); }
    else { setMensajes(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data]); }
    setSending(false);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        onClick={e => e.stopPropagation()}
        style={{ background: KYVRA.bg, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 500, height: '78vh', display: 'flex', flexDirection: 'column', fontFamily: FF }}
      >
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${KYVRA.border}`, background: KYVRA.white, borderRadius: '20px 20px 0 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: KYVRA.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={16} color={KYVRA.teal} strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: 14, margin: 0, color: KYVRA.navy }}>Chat con Encomiendas Mackenna</p>
                <p style={{ fontSize: 11, color: KYVRA.textSec, margin: '1px 0 0' }}>
                  {encomienda.tipo === 'enviar' ? 'Enviar' : 'Traer'} · {encomienda.descripcion?.slice(0, 35)}
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: KYVRA.bg, border: `1px solid ${KYVRA.border}`, borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={15} color={KYVRA.textSec} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loadError && (
            <p style={{ textAlign: 'center', color: '#DC2626', fontSize: 12, marginTop: 16, background: '#FEE2E2', padding: '8px 12px', borderRadius: 8 }}>
              Error al cargar mensajes: {loadError}
            </p>
          )}
          {!loadError && mensajes.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: 48 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: KYVRA.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <MessageSquare size={22} color={KYVRA.teal} strokeWidth={2} />
              </div>
              <p style={{ fontSize: 13, color: KYVRA.textMuted, margin: 0, fontFamily: FF }}>Sin mensajes aún. Escribinos tu consulta.</p>
            </div>
          )}
          {mensajes.map(m => {
            const esPropio = m.remitente === 'cliente';
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: esPropio ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '78%',
                  background: esPropio ? `linear-gradient(135deg, ${KYVRA.teal}, ${KYVRA.tealSec})` : KYVRA.white,
                  color: esPropio ? '#fff' : KYVRA.navy,
                  borderRadius: esPropio ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  padding: '9px 13px', fontSize: 13,
                  boxShadow: esPropio ? '0 2px 8px rgba(13,148,136,0.22)' : '0 1px 4px rgba(0,0,0,0.07)',
                  border: esPropio ? 'none' : `1px solid ${KYVRA.border}`,
                }}>
                  {!esPropio && <p style={{ fontSize: 10, fontWeight: 700, color: KYVRA.teal, margin: '0 0 3px' }}>Encomiendas Mackenna</p>}
                  <p style={{ margin: 0, lineHeight: 1.4 }}>{m.mensaje}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 3 }}>
                    <span style={{ fontSize: 10, opacity: 0.65 }}>
                      {new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {esPropio && (
                      m.leido
                        ? <CheckCheck size={12} color="rgba(255,255,255,0.9)" />
                        : <Check size={12} color="rgba(255,255,255,0.5)" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={enviar} style={{ padding: '10px 14px', borderTop: `1px solid ${KYVRA.border}`, background: KYVRA.white, display: 'flex', gap: 8, flexShrink: 0 }}>
          <input
            value={texto} onChange={e => setTexto(e.target.value)}
            placeholder="Escribí un mensaje..."
            style={{ flex: 1, border: `1.5px solid ${KYVRA.border}`, borderRadius: 12, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: FF, background: KYVRA.bg, color: KYVRA.navy }}
          />
          <button
            type="submit" disabled={!texto.trim() || sending}
            style={{
              background: texto.trim() ? `linear-gradient(135deg, ${KYVRA.teal}, ${KYVRA.tealSec})` : KYVRA.border,
              color: '#fff', border: 'none', borderRadius: 12, width: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: texto.trim() ? 'pointer' : 'default', flexShrink: 0,
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ── MisSolicitudes ────────────────────────────────────────── */
function MisSolicitudes() {
  const { profile }                     = useAuth();
  const [items, setItems]               = useState([]);
  const [loading, setLoading]           = useState(false);
  const [accionando, setAccionando]     = useState(null);
  const [chatEnc, setChatEnc]           = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [confirmCancelEnc, setConfirmCancelEnc] = useState(null);
  const [cancelando, setCancelando]     = useState(false);
  const openChatIdRef                   = useRef(null);

  const fetchUnreadCounts = async (ids) => {
    if (!ids?.length) return;
    const { data } = await supabase
      .from('mensajes_encomienda')
      .select('encomienda_id')
      .in('encomienda_id', ids)
      .eq('remitente', 'empresa')
      .eq('leido', false);
    const counts = {};
    data?.forEach(m => { counts[m.encomienda_id] = (counts[m.encomienda_id] || 0) + 1; });
    setUnreadCounts(counts);
  };

  useEffect(() => {
    const ch = supabase
      .channel('unread-badge-cliente')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes_encomienda' }, (payload) => {
        const msg = payload.new;
        if (msg.remitente === 'empresa' && msg.encomienda_id !== openChatIdRef.current) {
          setUnreadCounts(prev => ({ ...prev, [msg.encomienda_id]: (prev[msg.encomienda_id] || 0) + 1 }));
        }
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const cargarItems = async (tel) => {
    if (!tel) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('encomiendas')
      .select('*, presupuestos_encomienda(*)')
      .eq('empresa_id', EMPRESA_ID)
      .eq('cliente_telefono', tel)
      .order('created_at', { ascending: false });
    const list = error ? [] : (data || []);
    setItems(list);
    setLoading(false);
    fetchUnreadCounts(list.map(e => e.id));
  };

  useEffect(() => {
    if (profile?.telefono) cargarItems(profile.telefono);
  }, [profile?.telefono]);

  const handleOpenChat  = (enc) => { openChatIdRef.current = enc.id; setChatEnc(enc); };
  const handleCloseChat = ()    => { openChatIdRef.current = null; setChatEnc(null); };
  const handleChatRead  = (id)  => setUnreadCounts(prev => ({ ...prev, [id]: 0 }));
  const refrescarItems  = ()    => cargarItems(profile?.telefono);

  const cancelarEncomienda = async () => {
    if (!confirmCancelEnc) return;
    setCancelando(true);
    const { error } = await supabase.from('encomiendas').update({ estado: 'cancelado' }).eq('id', confirmCancelEnc.id);
    if (!error) {
      await supabase.from('mensajes_encomienda').insert({
        encomienda_id: confirmCancelEnc.id, remitente: 'cliente',
        mensaje: 'El cliente canceló esta encomienda.',
      });
    }
    setCancelando(false);
    setConfirmCancelEnc(null);
    if (error) { toast.error('Error al cancelar'); return; }
    toast.success('Encomienda cancelada');
    refrescarItems();
  };

  const responderPresupuesto = async (enc, presId, accion) => {
    setAccionando(presId);
    await supabase.from('presupuestos_encomienda').update({ estado: accion === 'aceptar' ? 'aceptado' : 'rechazado' }).eq('id', presId);
    if (accion === 'aceptar') {
      const codigo = `ENC-${Math.floor(1000 + Math.random() * 9000)}`;
      await supabase.from('encomiendas').update({ estado: 'confirmado', codigo }).eq('id', enc.id);
      const fechaStr = enc.fecha_envio
        ? new Date(enc.fecha_envio + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
        : '';
      const msgAuto = `✓ Encomienda confirmada. Tu código es ${codigo}. Pegá un rótulo en tu paquete con este código y la dirección de destino: ${enc.direccion_destino || '—'}. Te lo retiramos el ${fechaStr} en la franja ${enc.franja_horaria || '—'}.`;
      await supabase.from('mensajes_encomienda').insert({ encomienda_id: enc.id, remitente: 'empresa', mensaje: msgAuto });
      toast.success('¡Encomienda confirmada!');
    } else {
      await supabase.from('encomiendas').update({ estado: 'cancelado' }).eq('id', enc.id);
      toast.success('Presupuesto rechazado');
    }
    setAccionando(null);
    refrescarItems();
  };

  const activos   = items.filter(e => ESTADOS_ACTIVOS.includes(e.estado));
  const historial = items.filter(e => ESTADOS_HISTORIAL.includes(e.estado));

  if (!profile?.telefono) {
    return (
      <div style={{ background: KYVRA.white, borderRadius: 20, padding: '24px 20px', border: `1px solid ${KYVRA.border}`, textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: KYVRA.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <Phone size={22} color={KYVRA.teal} strokeWidth={2} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: KYVRA.navy, margin: '0 0 4px', fontFamily: FF }}>Completá tu perfil</p>
        <p style={{ fontSize: 13, color: KYVRA.textSec, margin: 0, lineHeight: 1.5, fontFamily: FF }}>
          Agregá tu número de teléfono en tu perfil para ver tus encomiendas.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ── Activas ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
        borderRadius: 18, padding: '14px 18px', marginBottom: 14,
        boxShadow: '0 4px 18px rgba(13,148,136,0.24)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Package size={17} color="#fff" strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0, fontFamily: FF }}>Encomiendas activas</p>
          {!loading && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', margin: '1px 0 0', fontFamily: FF }}>
              {activos.length === 0 ? 'Sin solicitudes activas' : `${activos.length} en curso`}
            </p>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {[1, 2].map(i => (
            <div key={i} style={{
              height: 120, borderRadius: 16,
              background: 'linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%)',
              animation: 'shimmer 1.4s infinite', backgroundSize: '200% 100%',
            }} />
          ))}
        </div>
      )}

      {!loading && activos.length === 0 && (
        <div style={{ background: KYVRA.white, borderRadius: 16, padding: '28px 20px', textAlign: 'center', marginBottom: 20, border: `1px solid ${KYVRA.border}` }}>
          <p style={{ fontSize: 14, color: KYVRA.textMuted, margin: 0, fontFamily: FF }}>
            {items.length === 0 ? 'No tenés solicitudes aún. ¡Creá una!' : 'No tenés encomiendas activas.'}
          </p>
        </div>
      )}

      {!loading && activos.map(enc => {
        const c              = ESTADO_COLOR[enc.estado] || { bg: '#F3F4F6', text: '#374151' };
        const pres           = enc.presupuestos_encomienda?.[0];
        const puedeResponder = enc.estado === 'presupuestado' && pres?.estado === 'pendiente';
        const unread         = unreadCounts[enc.id] || 0;

        return (
          <div key={enc.id} style={{
            background: KYVRA.white, borderRadius: 18, marginBottom: 12,
            border: `1.5px solid ${KYVRA.border}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden',
          }}>
            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px 10px', borderBottom: `1px solid ${KYVRA.bg}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: KYVRA.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={15} color={KYVRA.teal} strokeWidth={2} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: KYVRA.navy, margin: 0, fontFamily: FF }}>
                    {enc.tipo === 'enviar' ? 'Envío a Río Cuarto' : 'Traída de Río Cuarto'}
                  </p>
                  {enc.descripcion && (
                    <p style={{ fontSize: 11, color: KYVRA.textSec, margin: '1px 0 0', fontFamily: FF }}>
                      {enc.descripcion.slice(0, 42)}{enc.descripcion.length > 42 ? '…' : ''}
                    </p>
                  )}
                </div>
              </div>
              <span style={{ background: c.bg, color: c.text, fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20, flexShrink: 0, marginLeft: 8, fontFamily: FF }}>
                {ESTADO_LABEL[enc.estado] || enc.estado}
              </span>
            </div>

            {/* Route visualization */}
            {(enc.direccion_origen || enc.direccion_destino) && (
              <div style={{ padding: '10px 14px', display: 'flex', gap: 10, background: KYVRA.bg, borderBottom: `1px solid ${KYVRA.border}` }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3, flexShrink: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: KYVRA.teal }} />
                  <div style={{ width: 2, height: 22, background: `linear-gradient(to bottom, ${KYVRA.teal}, ${KYVRA.navy})`, margin: '2px 0' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: KYVRA.navy }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ fontSize: 12, color: KYVRA.textSec, margin: 0, fontFamily: FF }}>{enc.direccion_origen || '(sin especificar)'}</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: KYVRA.navy, margin: 0, fontFamily: FF }}>{enc.direccion_destino || '—'}</p>
                </div>
              </div>
            )}

            {/* Date */}
            {enc.fecha_envio && (
              <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: pres ? `1px solid ${KYVRA.bg}` : 'none' }}>
                <Clock size={12} color={KYVRA.textMuted} />
                <span style={{ fontSize: 12, color: KYVRA.textSec, fontFamily: FF }}>
                  {new Date(enc.fecha_envio + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {enc.franja_horaria ? ` · ${enc.franja_horaria}` : ''}
                </span>
              </div>
            )}

            {/* Budget */}
            {pres && (
              <div style={{ margin: '10px 14px', background: KYVRA.tealBg, borderRadius: 12, padding: '10px 12px' }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: KYVRA.tealDark, margin: '0 0 2px', fontFamily: FF }}>
                  Presupuesto: ${fmtMiles(pres.monto)}
                </p>
                {pres.mensaje && (
                  <p style={{ fontSize: 12, color: KYVRA.tealDark, margin: 0, lineHeight: 1.4, opacity: 0.85, fontFamily: FF }}>{pres.mensaje}</p>
                )}
                {puedeResponder && (
                  <button
                    disabled={!!accionando}
                    onClick={() => responderPresupuesto(enc, pres.id, 'aceptar')}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: KYVRA.teal, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 0', fontSize: 13, fontWeight: 800, cursor: 'pointer', marginTop: 10, fontFamily: FF }}
                  >
                    <ThumbsUp size={13} /> Aceptar presupuesto
                  </button>
                )}
                {pres.estado === 'aceptado' && <p style={{ fontSize: 12, fontWeight: 700, color: KYVRA.tealDark, margin: '8px 0 0', fontFamily: FF }}>✓ Presupuesto aceptado</p>}
                {pres.estado === 'rechazado' && <p style={{ fontSize: 12, fontWeight: 700, color: '#991B1B', margin: '8px 0 0', fontFamily: FF }}>Presupuesto rechazado</p>}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, padding: '10px 14px 14px' }}>
              <button
                onClick={() => handleOpenChat(enc)}
                style={{
                  flex: 1, position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: KYVRA.tealBg, color: KYVRA.tealDark,
                  border: `1px solid rgba(13,148,136,0.25)`, borderRadius: 11,
                  padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FF,
                }}
              >
                <MessageSquare size={13} /> Ver chat
                {unread > 0 && (
                  <span style={{ position: 'absolute', top: -6, right: -4, background: '#DC2626', color: '#fff', fontSize: 9, fontWeight: 800, minWidth: 16, height: 16, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
              {!['entregado', 'cancelado'].includes(enc.estado) && (
                <button
                  onClick={() => setConfirmCancelEnc(enc)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#FEE2E2', color: '#991B1B', border: '1px solid rgba(220,38,38,0.20)', borderRadius: 11, padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FF }}
                >
                  <X size={13} /> Cancelar
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* ── Historial ── */}
      {!loading && historial.length > 0 && (
        <>
          <div style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            borderRadius: 18, padding: '14px 18px', marginBottom: 14, marginTop: 8,
            boxShadow: '0 4px 18px rgba(15,23,42,0.20)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={17} color="#fff" strokeWidth={2.2} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0, fontFamily: FF }}>Historial de encomiendas</p>
          </div>

          {historial.map(enc => {
            const c    = ESTADO_COLOR[enc.estado] || { bg: '#F3F4F6', text: '#374151' };
            const pres = enc.presupuestos_encomienda?.[0];
            return (
              <div key={enc.id} style={{
                background: KYVRA.white, borderRadius: 14, marginBottom: 8,
                border: `1px solid ${KYVRA.border}`, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: KYVRA.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${KYVRA.border}` }}>
                  <Package size={16} color={KYVRA.textSec} strokeWidth={2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: KYVRA.navy, margin: '0 0 2px', fontFamily: FF, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {enc.tipo === 'enviar' ? 'Envío a Río Cuarto' : 'Traída de Río Cuarto'}
                  </p>
                  <p style={{ fontSize: 11, color: KYVRA.textSec, margin: 0, fontFamily: FF }}>
                    {enc.fecha_envio ? new Date(enc.fecha_envio + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : '—'}
                    {pres?.monto ? ` · $${fmtMiles(pres.monto)}` : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7, flexShrink: 0 }}>
                  <span style={{ background: c.bg, color: c.text, fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 20, fontFamily: FF }}>
                    {ESTADO_LABEL[enc.estado] || enc.estado}
                  </span>
                  <button
                    onClick={() => handleOpenChat(enc)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: KYVRA.teal, padding: 0, fontFamily: FF }}
                  >
                    <MessageSquare size={11} /> Chat
                  </button>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Modals */}
      <AnimatePresence>
        {chatEnc && (
          <ChatClientModal encomienda={chatEnc} onClose={handleCloseChat} onRead={handleChatRead} />
        )}

        {confirmCancelEnc && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', background: 'rgba(0,0,0,0.45)' }}
            onClick={() => !cancelando && setConfirmCancelEnc(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.18 }}
              onClick={e => e.stopPropagation()}
              style={{ background: KYVRA.white, borderRadius: 20, padding: 24, width: '100%', maxWidth: 360, fontFamily: FF, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <X size={22} color="#DC2626" />
              </div>
              <h3 style={{ fontWeight: 900, fontSize: 16, textAlign: 'center', margin: '0 0 8px', color: KYVRA.navy }}>¿Cancelar encomienda?</h3>
              <p style={{ fontSize: 13, color: KYVRA.textSec, textAlign: 'center', lineHeight: 1.5, margin: '0 0 20px' }}>
                Esta acción no se puede deshacer. ¿Estás seguro que querés cancelar esta solicitud?
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setConfirmCancelEnc(null)}
                  disabled={cancelando}
                  style={{ flex: 1, background: KYVRA.bg, color: KYVRA.textSec, border: `1px solid ${KYVRA.border}`, borderRadius: 12, padding: '11px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: FF }}
                >
                  Volver
                </button>
                <button
                  onClick={cancelarEncomienda}
                  disabled={cancelando}
                  style={{ flex: 1, background: cancelando ? KYVRA.border : '#DC2626', color: '#fff', border: 'none', borderRadius: 12, padding: '11px 0', fontWeight: 700, fontSize: 14, cursor: cancelando ? 'not-allowed' : 'pointer', fontFamily: FF }}
                >
                  {cancelando ? 'Cancelando...' : 'Sí, cancelar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Main page ─────────────────────────────────────────────── */
export default function Encomiendas() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [cfg, setCfg]           = useState(null);

  useEffect(() => {
    supabase
      .from('config_encomiendas')
      .select('*')
      .eq('empresa_id', EMPRESA_ID)
      .maybeSingle()
      .then(({ data }) => setCfg(data));
  }, []);

  const handleWhatsApp = () => {
    const msg = encodeURIComponent('Hola, quiero enviar una encomienda a Río Cuarto. ¿Me podés dar información?');
    window.open(`https://wa.me/5493571000000?text=${msg}`, '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', background: KYVRA.bg, fontFamily: FF, paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
      <style>{`@keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }`}</style>

      {/* ── Hero ── */}
      <div style={{ position: 'relative', height: 260, overflow: 'hidden' }}>
        <img
          src="https://hvmdumuedqfoifgayleh.supabase.co/storage/v1/object/public/IMAGES/ChatGPT%20Image%2012%20may%202026,%2019_15_45.png"
          alt="Encomiendas"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(13,148,136,0.28) 0%, rgba(15,23,42,0.82) 100%)' }} />

        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: 'calc(16px + env(safe-area-inset-top, 0px))', left: 16,
            width: 38, height: 38, borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <ChevronLeft size={20} color="#fff" strokeWidth={2.5} />
        </motion.button>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 26px' }}>
          {/* Route chip */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(13,148,136,0.35)', backdropFilter: 'blur(6px)',
            border: '1px solid rgba(94,234,212,0.40)', borderRadius: 20,
            padding: '5px 12px', marginBottom: 12,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#5EEAD4' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.03em' }}>Tu ciudad</span>
            <ArrowRight size={11} color="rgba(255,255,255,0.75)" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.03em' }}>Río Cuarto</span>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.85)' }} />
          </div>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.1, textShadow: '0 2px 12px rgba(0,0,0,0.40)', margin: '0 0 7px' }}>
            Encomiendas<br />a Río Cuarto
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: 13, fontWeight: 600, margin: 0 }}>
            Servicio de paquetería rápido y seguro
          </p>
        </div>
      </div>

      <div style={{ padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640, margin: '0 auto' }}>

        {/* Primary CTA */}
        <motion.button
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowForm(true)}
          style={{
            background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
            color: '#fff', border: 'none', borderRadius: 20, padding: '17px 20px',
            fontSize: 16, fontWeight: 900, letterSpacing: '-0.01em', cursor: 'pointer',
            width: '100%', boxShadow: '0 6px 24px rgba(13,148,136,0.40)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontFamily: FF,
          }}
        >
          <Package size={20} />
          Presupuestar encomienda
          <ArrowRight size={18} />
        </motion.button>

        {/* Process mini-steps */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { Icon: Send,          label: 'Hacé tu pedido',      sub: 'en segundos'        },
            { Icon: MessageSquare, label: 'Recibí presupuesto',  sub: 'por chat directo'   },
            { Icon: CheckCircle,   label: 'Confirmás',           sub: 'y coordinamos'      },
            { Icon: Package,       label: 'Entrega garantizada', sub: 'seguimiento por WA' },
          ].map(({ Icon, label, sub }) => (
            <div key={label} style={{ background: KYVRA.white, borderRadius: 14, padding: '12px 14px', border: `1px solid ${KYVRA.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: KYVRA.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={14} color={KYVRA.teal} strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 800, color: KYVRA.navy, margin: '0 0 1px', fontFamily: FF }}>{label}</p>
                <p style={{ fontSize: 11, color: KYVRA.textMuted, margin: 0, fontFamily: FF }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mis solicitudes */}
        <MisSolicitudes />

        {/* Horarios — navy header + white body */}
        {(cfg?.dias_recepcion?.length > 0 || cfg?.dias_entrega?.length > 0 || cfg?.dias_trabajo?.length > 0) && (() => {
          const recDays = cfg.dias_recepcion?.length > 0
            ? cfg.dias_recepcion
            : (cfg.dias_entrega?.length > 0 ? [] : (cfg.dias_trabajo ?? []));
          const entDays = cfg.dias_entrega ?? [];
          const showBoth = recDays.length > 0 && entDays.length > 0;

          const DayRow = ({ d, activo, hora, teal }) => (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: activo ? 700 : 500, color: activo ? KYVRA.navy : KYVRA.textMuted, fontFamily: FF }}>{d.label}</span>
              {activo ? (
                <span style={{ fontSize: 12, fontWeight: 800, color: teal ? KYVRA.tealDark : KYVRA.navy, background: teal ? KYVRA.tealBg : 'rgba(15,23,42,0.07)', padding: '3px 10px', borderRadius: 999, fontFamily: FF }}>{hora}</span>
              ) : (
                <span style={{ fontSize: 12, fontWeight: 600, color: KYVRA.textMuted, fontFamily: FF }}>Cerrado</span>
              )}
            </div>
          );

          return (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
            >
              <div style={{ background: KYVRA.navy, borderRadius: '16px 16px 0 0', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={15} color="#fff" strokeWidth={2} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0, fontFamily: FF }}>Horarios de servicio</p>
              </div>
              <div style={{ background: KYVRA.white, borderRadius: '0 0 16px 16px', border: `1px solid ${KYVRA.border}`, borderTop: 'none', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {recDays.length > 0 && (
                  <>
                    {showBoth && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <MapPin size={12} color={KYVRA.teal} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: KYVRA.teal, textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: FF }}>Recepción en depósito</span>
                      </div>
                    )}
                    {ALL_DAYS.map(d => {
                      const activo = recDays.includes(d.val);
                      const hora   = cfg.horario_recepcion_desde && cfg.horario_recepcion_hasta
                        ? `${cfg.horario_recepcion_desde} – ${cfg.horario_recepcion_hasta}`
                        : 'Abierto';
                      return <DayRow key={d.val} d={d} activo={activo} hora={hora} teal />;
                    })}
                  </>
                )}
                {entDays.length > 0 && (
                  <>
                    {showBoth && <div style={{ height: 1, background: KYVRA.border, margin: '4px 0' }} />}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <Truck size={12} color={KYVRA.navy} />
                      <span style={{ fontSize: 11, fontWeight: 800, color: KYVRA.navy, textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: FF }}>Entregas a domicilio</span>
                    </div>
                    {ALL_DAYS.map(d => {
                      const activo = entDays.includes(d.val);
                      const hora   = cfg.horario_entrega_desde && cfg.horario_entrega_hasta
                        ? `${cfg.horario_entrega_desde} – ${cfg.horario_entrega_hasta}`
                        : 'Abierto';
                      return <DayRow key={d.val} d={d} activo={activo} hora={hora} teal={false} />;
                    })}
                  </>
                )}
              </div>
            </motion.div>
          );
        })()}

        {/* Cómo funciona */}
        {(cfg?.condiciones_deposito || cfg?.condiciones_retiro) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}
            style={{ background: KYVRA.white, borderRadius: 20, border: `1px solid ${KYVRA.border}`, overflow: 'hidden' }}
          >
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${KYVRA.border}` }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: KYVRA.navy, margin: 0, fontFamily: FF }}>Cómo funciona el servicio</p>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cfg.condiciones_deposito && (
                <div style={{ background: KYVRA.tealBg, borderRadius: 14, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <MapPin size={14} color={KYVRA.teal} />
                    <p style={{ fontWeight: 800, fontSize: 13, color: KYVRA.tealDark, margin: 0, fontFamily: FF }}>Podés dejar en el depósito</p>
                  </div>
                  <p style={{ fontSize: 13, color: KYVRA.tealDark, margin: 0, lineHeight: 1.5, opacity: 0.85, fontFamily: FF }}>{cfg.condiciones_deposito}</p>
                </div>
              )}
              {cfg.condiciones_retiro && (
                <div style={{ background: 'rgba(15,23,42,0.04)', borderRadius: 14, padding: '12px 14px', border: `1px solid rgba(15,23,42,0.07)` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <Package size={14} color={KYVRA.navy} />
                    <p style={{ fontWeight: 800, fontSize: 13, color: KYVRA.navy, margin: 0, fontFamily: FF }}>Retiro a domicilio</p>
                  </div>
                  <p style={{ fontSize: 13, color: KYVRA.textSec, margin: 0, lineHeight: 1.5, fontFamily: FF }}>{cfg.condiciones_retiro}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Contacto */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          style={{ background: KYVRA.white, borderRadius: 20, border: `1px solid ${KYVRA.border}`, overflow: 'hidden' }}
        >
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${KYVRA.border}` }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: KYVRA.navy, margin: 0, fontFamily: FF }}>Dónde encontrarnos</p>
          </div>
          <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              cfg?.direccion_deposito
                ? { Icon: MapPin, label: 'Depósito',          val: cfg.direccion_deposito, teal: false }
                : null,
              cfg?.horario_entrega_desde && cfg?.horario_entrega_hasta
                ? { Icon: Clock,  label: 'Horario de entregas', val: `${cfg.horario_entrega_desde} – ${cfg.horario_entrega_hasta} hs`, teal: true }
                : null,
              { Icon: Phone, label: 'WhatsApp', val: '+54 9 3571 000-000', teal: true },
            ].filter(Boolean).map(({ Icon, label, val, teal }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: teal ? KYVRA.tealBg : KYVRA.bg,
                  border: `1px solid ${teal ? 'rgba(13,148,136,0.20)' : KYVRA.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={16} color={teal ? KYVRA.teal : KYVRA.textSec} strokeWidth={2} />
                </div>
                <div style={{ paddingTop: 2 }}>
                  <p style={{ fontSize: 11, color: KYVRA.textMuted, fontWeight: 600, margin: '0 0 2px', fontFamily: FF }}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: KYVRA.navy, margin: 0, fontFamily: FF }}>{val}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* WhatsApp secondary */}
        <motion.button
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleWhatsApp}
          style={{
            background: '#25D366', color: '#fff', border: 'none', borderRadius: 18, padding: '14px',
            fontSize: 15, fontWeight: 800, cursor: 'pointer', width: '100%',
            boxShadow: '0 4px 16px rgba(37,211,102,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: FF,
          }}
        >
          Consultar por WhatsApp
        </motion.button>

      </div>

      {/* Bottom sheet */}
      <AnimatePresence>
        {showForm && <SolicitudForm onClose={() => setShowForm(false)} cfg={cfg} />}
      </AnimatePresence>
    </div>
  );
}
