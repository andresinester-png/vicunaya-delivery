import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Clock, MapPin, Phone, Package,
  CheckCircle, X, ArrowRight, Send,
  ThumbsUp, MessageSquare, Check, CheckCheck, Camera, Image,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';

const EMPRESA_ID = '5c5ce5e7-25b8-4e53-be85-05af7a85a224';
const COLOR      = '#D32F2F';

const ALL_DAYS = [
  { val: 'lunes',      label: 'Lunes'      },
  { val: 'martes',     label: 'Martes'     },
  { val: 'miercoles',  label: 'Miércoles'  },
  { val: 'jueves',     label: 'Jueves'     },
  { val: 'viernes',    label: 'Viernes'    },
  { val: 'sabado',     label: 'Sábado'     },
  { val: 'domingo',    label: 'Domingo'    },
];

const PESOS = [
  { val: 'liviano',  label: 'Liviano',  sub: 'hasta 5 kg'    },
  { val: 'mediano',  label: 'Mediano',  sub: '5 – 20 kg'     },
  { val: 'pesado',   label: 'Pesado',   sub: 'más de 20 kg'  },
];

const DIMENSIONES = [
  { val: 'pequeño',    label: 'Pequeño',             sub: 'entra en una mochila'      },
  { val: 'mediano',    label: 'Mediano',              sub: 'caja tipo zapatillas'      },
  { val: 'grande',     label: 'Grande',               sub: 'caja TV / valija'          },
  { val: 'voluminoso', label: 'Mueble / voluminoso',  sub: 'requiere logística especial'},
];

const FRANJAS = [
  { val: 'manana',  label: 'Mañana',  sub: '8:00 – 12:00'  },
  { val: 'tarde',   label: 'Tarde',   sub: '12:00 – 17:00' },
  { val: 'noche',   label: 'Noche',   sub: '17:00 – 20:00' },
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

function Label({ children }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
      {children}
    </label>
  );
}

function Input({ style, ...props }) {
  return (
    <input
      style={{
        width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 12,
        padding: '11px 14px', fontSize: 14, outline: 'none',
        boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff',
        ...style,
      }}
      {...props}
    />
  );
}

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
              border: `2px solid ${active ? COLOR : '#E9D5D8'}`,
              borderRadius: 12, padding: '10px 10px', textAlign: 'left',
              background: active ? '#FFF0F0' : '#fff', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 700, color: active ? COLOR : '#111', margin: 0 }}>{o.label}</p>
            {o.sub && <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>{o.sub}</p>}
          </button>
        );
      })}
    </div>
  );
}

function SolicitudForm({ onClose, cfg }) {
  const { profile, session }    = useAuth();
  const [form, setForm]         = useState(EMPTY_FORM);
  const [loading, setLoading]   = useState(false);
  const [enviado, setEnviado]   = useState(false);
  const [foto, setFoto]         = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const fotoRef                 = useRef(null);
  const galeriaRef              = useRef(null);

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
      const nombres = faltantes.map(k => CAMPO_LABEL[k]).join(', ');
      toast.error(`Faltá completar: ${nombres}`, { duration: 4000 });
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
      const ext = foto.name.split('.').pop() || 'jpg';
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
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFF8F8', borderRadius: '24px 24px 0 0',
          width: '100%', maxWidth: 520,
          maxHeight: '92vh', display: 'flex', flexDirection: 'column',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {/* Handle */}
        <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, background: '#E9D5D8', borderRadius: 99, margin: '0 auto 12px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontWeight: 900, fontSize: 18, margin: 0 }}>Solicitar encomienda</h2>
            <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={16} color="#6B7280" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div style={{ overflowY: 'auto', padding: '0 20px 32px', flex: 1 }}>
          {enviado ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '48px 0' }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: '#D1FAE5',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              }}>
                <CheckCircle size={32} color="#059669" />
              </div>
              <h3 style={{ fontWeight: 900, fontSize: 20, margin: '0 0 8px' }}>Solicitud enviada</h3>
              <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.5, maxWidth: 280, margin: '0 auto 24px' }}>
                Recibimos tu pedido. Te contactaremos pronto con el presupuesto.
              </p>
              <button
                onClick={onClose}
                style={{ background: COLOR, color: '#fff', border: 'none', borderRadius: 14, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cerrar
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Datos personales */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#374151', marginBottom: 12 }}>Tus datos</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <Label>Nombre completo *</Label>
                    <Input
                      type="text"
                      placeholder="Juan García"
                      value={form.cliente_nombre}
                      onChange={e => set('cliente_nombre', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Teléfono *</Label>
                    <Input
                      type="tel"
                      placeholder="3583 000-000"
                      value={form.cliente_telefono}
                      onChange={e => set('cliente_telefono', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Teléfono de quien recibe (WhatsApp) *</Label>
                    <Input
                      type="tel"
                      placeholder="3583 000-000"
                      value={form.telefono_destinatario}
                      onChange={e => set('telefono_destinatario', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Tipo */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
                <Label>Qué querés hacer *</Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { val: 'enviar', label: 'Quiero enviar algo a Río Cuarto' },
                    { val: 'traer',  label: 'Quiero traer algo de Río Cuarto'  },
                  ].map(o => {
                    const active = form.tipo === o.val;
                    return (
                      <button
                        key={o.val}
                        type="button"
                        onClick={() => set('tipo', o.val)}
                        style={{
                          border: `2px solid ${active ? COLOR : '#E9D5D8'}`,
                          borderRadius: 12, padding: '12px 14px', textAlign: 'left',
                          background: active ? '#FFF0F0' : '#F9FAFB', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 10,
                        }}
                      >
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%',
                          border: `2px solid ${active ? COLOR : '#D1D5DB'}`,
                          background: active ? COLOR : 'transparent',
                          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {active && <div style={{ width: 6, height: 6, background: '#fff', borderRadius: '50%' }} />}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: active ? COLOR : '#111' }}>{o.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Descripción */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
                <Label>Descripción del paquete</Label>
                <textarea
                  placeholder="¿Qué es? Ej: ropa, repuesto de auto, documentación..."
                  value={form.descripcion}
                  onChange={e => set('descripcion', e.target.value)}
                  rows={3}
                  required
                  style={{
                    width: '100%', border: '1.5px solid #E5E7EB', borderRadius: 12,
                    padding: '11px 14px', fontSize: 14, outline: 'none',
                    boxSizing: 'border-box', fontFamily: 'inherit', resize: 'none',
                  }}
                />
              </div>

              {/* Foto del paquete */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
                <Label>Foto del paquete (opcional)</Label>

                {/* Input cámara */}
                <input
                  ref={fotoRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={handleFotoChange}
                />
                {/* Input galería */}
                <input
                  ref={galeriaRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFotoChange}
                />

                {fotoPreview ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
                      <img
                        src={fotoPreview}
                        alt="Foto del paquete"
                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12, border: '2px solid #E5E7EB', display: 'block' }}
                      />
                      <button
                        type="button"
                        onClick={() => { setFoto(null); setFotoPreview(null); }}
                        style={{ position: 'absolute', top: -8, right: -8, background: '#DC2626', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => fotoRef.current?.click()}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 9, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        <Camera size={13} /> Cambiar foto
                      </button>
                      <button
                        type="button"
                        onClick={() => galeriaRef.current?.click()}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 9, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        <Image size={13} /> Elegir otra
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => fotoRef.current?.click()}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                        border: '2px dashed #E5E7EB', borderRadius: 12,
                        padding: '14px 8px', background: '#F9FAFB',
                        color: '#6B7280', fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      <Camera size={20} color="#9CA3AF" />
                      Sacar foto
                    </button>
                    <button
                      type="button"
                      onClick={() => galeriaRef.current?.click()}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                        border: '2px dashed #E5E7EB', borderRadius: 12,
                        padding: '14px 8px', background: '#F9FAFB',
                        color: '#6B7280', fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      <Image size={20} color="#9CA3AF" />
                      Elegir de galería
                    </button>
                  </div>
                )}
              </div>


              {/* Dimensiones */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
                <Label>Dimensiones aproximadas</Label>
                <OptionGrid options={DIMENSIONES} value={form.dimensiones} onChange={v => set('dimensiones', v)} />
              </div>

              {/* Direcciones */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#374151', marginBottom: 12 }}>Direcciones</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <Label>Dirección de origen (de dónde se retira)</Label>
                    <Input
                      type="text"
                      placeholder="Calle y número, ciudad"
                      value={form.direccion_origen}
                      onChange={e => set('direccion_origen', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Dirección de destino *</Label>
                    <Input
                      type="text"
                      placeholder="Calle y número, ciudad"
                      value={form.direccion_destino}
                      onChange={e => set('direccion_destino', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Fecha y franja */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
                <div style={{ marginBottom: 14 }}>
                  <Label>Fecha de envío deseada *</Label>
                  <Input
                    type="date"
                    value={form.fecha_envio}
                    onChange={e => set('fecha_envio', e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    required
                  />
                </div>
                <div>
                  <Label>Rango horario de entrega *</Label>
                  <Input
                    type="text"
                    placeholder="Ej: entre 14 y 18 hs, después de las 17 hs..."
                    value={form.franja_horaria}
                    onChange={e => set('franja_horaria', e.target.value)}
                    required
                  />
                  {cfg?.horario_entrega_desde && cfg?.horario_entrega_hasta && (
                    <p style={{ fontSize: 12, color: '#6B7280', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} color="#9CA3AF" />
                      El comisionista entrega de {cfg.horario_entrega_desde} a {cfg.horario_entrega_hasta} hs
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', background: loading ? '#aaa' : COLOR, color: '#fff',
                  border: 'none', borderRadius: 16, padding: '15px 0',
                  fontWeight: 900, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: 'inherit',
                }}
              >
                <Send size={16} />
                {loading ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

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
  confirmado:    { bg: '#D1FAE5', text: '#065F46' },
  en_camino:     { bg: '#EDE9FE', text: '#5B21B6' },
  entregado:     { bg: '#D1FAE5', text: '#065F46' },
  cancelado:     { bg: '#FEE2E2', text: '#991B1B' },
};

function fmtMiles(n) {
  return Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 });
}

/* ── Chat modal (cliente) ───────────────────────────────────────── */
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

    if (error) {
      setLoadError(error.message);
      return;
    }
    setMensajes(data || []);

    // Marcar mensajes de la empresa como leídos
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
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'mensajes_encomienda',
        filter: `encomienda_id=eq.${encomienda.id}`,
      }, async (payload) => {
        const msg = payload.new;
        setMensajes(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        // Si es de la empresa, marcarlo como leído inmediatamente (chat abierto)
        if (msg.remitente === 'empresa') {
          await supabase.from('mensajes_encomienda').update({ leido: true }).eq('id', msg.id);
          setMensajes(prev => prev.map(m => m.id === msg.id ? { ...m, leido: true } : m));
          onRead(encomienda.id);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'mensajes_encomienda',
        filter: `encomienda_id=eq.${encomienda.id}`,
      }, (payload) => {
        // Empresa leyó mensajes del cliente → actualizar tilde doble
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
      .select()
      .single();

    if (error) {
      toast.error('Error al enviar el mensaje');
      setTexto(msg);
    } else {
      setMensajes(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data]);
    }
    setSending(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFF8F8', borderRadius: '20px 20px 0 0',
          width: '100%', maxWidth: 500, height: '78vh',
          display: 'flex', flexDirection: 'column',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #E5E7EB', background: '#fff', borderRadius: '20px 20px 0 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 800, fontSize: 15, margin: 0 }}>Chat con Encomiendas Mackenna</p>
              <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>
                {encomienda.tipo === 'enviar' ? 'Enviar' : 'Traer'} · {encomienda.descripcion?.slice(0, 40)}
              </p>
            </div>
            <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={16} color="#6B7280" />
            </button>
          </div>
        </div>

        {/* Mensajes */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loadError && (
            <p style={{ textAlign: 'center', color: '#DC2626', fontSize: 12, marginTop: 16, background: '#FEE2E2', padding: '8px 12px', borderRadius: 8 }}>
              Error al cargar mensajes: {loadError}
            </p>
          )}
          {!loadError && mensajes.length === 0 && (
            <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginTop: 40 }}>
              Sin mensajes aún. Escribinos tu consulta.
            </p>
          )}
          {mensajes.map(m => {
            const esPropio = m.remitente === 'cliente';
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: esPropio ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '78%',
                  background: esPropio ? COLOR : '#fff',
                  color: esPropio ? '#fff' : '#111',
                  borderRadius: esPropio ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  padding: '9px 13px',
                  fontSize: 13,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}>
                  {!esPropio && (
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', margin: '0 0 3px' }}>Encomiendas Mackenna</p>
                  )}
                  <p style={{ margin: 0, lineHeight: 1.4 }}>{m.mensaje}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 3 }}>
                    <span style={{ fontSize: 10, opacity: 0.65 }}>
                      {new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {esPropio && (
                      m.leido
                        ? <CheckCheck size={12} color="#93C5FD" />
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
        <form onSubmit={enviar} style={{ padding: '10px 14px', borderTop: '1px solid #E5E7EB', background: '#fff', display: 'flex', gap: 8, flexShrink: 0 }}>
          <input
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Escribí un mensaje..."
            style={{ flex: 1, border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
          />
          <button
            type="submit"
            disabled={!texto.trim() || sending}
            style={{ background: texto.trim() ? COLOR : '#E9D5D8', color: '#fff', border: 'none', borderRadius: 12, width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: texto.trim() ? 'pointer' : 'default', flexShrink: 0 }}
          >
            <Send size={16} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}

const ESTADOS_ACTIVOS   = ['pendiente', 'presupuestado', 'confirmado', 'en_camino'];
const ESTADOS_HISTORIAL = ['entregado', 'cancelado'];

function MisSolicitudes() {
  const { profile }                     = useAuth();
  const [items, setItems]               = useState([]);
  const [loading, setLoading]           = useState(false);
  const [accionando, setAccionando]     = useState(null);
  const [chatEnc, setChatEnc]           = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [confirmCancelEnc, setConfirmCancelEnc] = useState(null);
  const [cancelando, setCancelando]     = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
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
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'mensajes_encomienda',
      }, (payload) => {
        const msg = payload.new;
        if (msg.remitente === 'empresa' && msg.encomienda_id !== openChatIdRef.current) {
          setUnreadCounts(prev => ({
            ...prev,
            [msg.encomienda_id]: (prev[msg.encomienda_id] || 0) + 1,
          }));
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

  const handleOpenChat = (enc) => {
    openChatIdRef.current = enc.id;
    setChatEnc(enc);
  };
  const handleCloseChat = () => {
    openChatIdRef.current = null;
    setChatEnc(null);
  };
  const handleChatRead = (encomiendaId) => {
    setUnreadCounts(prev => ({ ...prev, [encomiendaId]: 0 }));
  };

  const refrescarItems = () => cargarItems(profile?.telefono);

  const cancelarEncomienda = async () => {
    if (!confirmCancelEnc) return;
    setCancelando(true);
    const { error } = await supabase
      .from('encomiendas')
      .update({ estado: 'cancelado' })
      .eq('id', confirmCancelEnc.id);
    if (!error) {
      await supabase.from('mensajes_encomienda').insert({
        encomienda_id: confirmCancelEnc.id,
        remitente: 'cliente',
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

    await supabase
      .from('presupuestos_encomienda')
      .update({ estado: accion === 'aceptar' ? 'aceptado' : 'rechazado' })
      .eq('id', presId);

    if (accion === 'aceptar') {
      const codigo = `ENC-${Math.floor(1000 + Math.random() * 9000)}`;
      await supabase
        .from('encomiendas')
        .update({ estado: 'confirmado', codigo })
        .eq('id', enc.id);

      const fechaStr = enc.fecha_envio
        ? new Date(enc.fecha_envio + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
        : '';
      const msgAuto = `✓ Encomienda confirmada. Tu código es ${codigo}. Pegá un rótulo en tu paquete con este código y la dirección de destino: ${enc.direccion_destino || '—'}. Te lo retiramos el ${fechaStr} en la franja ${enc.franja_horaria || '—'}.`;
      await supabase.from('mensajes_encomienda').insert({
        encomienda_id: enc.id,
        remitente: 'empresa',
        mensaje: msgAuto,
      });

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
  const visibles  = showHistorial ? historial : activos;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
      style={{ background: '#fff', borderRadius: 24, padding: '18px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 900, color: '#111', margin: 0, letterSpacing: '-0.01em' }}>
          {showHistorial ? 'Historial' : 'Mis solicitudes'}
        </h2>
        {!loading && historial.length > 0 && (
          <button
            onClick={() => setShowHistorial(s => !s)}
            style={{
              background: showHistorial ? '#F3F4F6' : '#FFF0F0',
              color: showHistorial ? '#374151' : COLOR,
              border: 'none', borderRadius: 20, padding: '5px 12px',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit',
            }}
          >
            {showHistorial ? '← Activas' : 'Historial'}
          </button>
        )}
      </div>

      {!profile?.telefono && (
        <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '12px 0', lineHeight: 1.5 }}>
          Completá tu número de teléfono en tu perfil para ver tus solicitudes.
        </p>
      )}

      {profile?.telefono && loading && (
        <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '12px 0' }}>Cargando...</p>
      )}

      {profile?.telefono && !loading && !showHistorial && activos.length === 0 && (
        <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '12px 0' }}>
          {items.length === 0 ? 'No tenés solicitudes aún.' : 'No tenés solicitudes activas.'}
        </p>
      )}

      {profile?.telefono && !loading && showHistorial && historial.length === 0 && (
        <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '12px 0' }}>
          Sin historial de entregas.
        </p>
      )}

      {!loading && visibles.map(enc => {
        const c = ESTADO_COLOR[enc.estado] || { bg: '#F3F4F6', text: '#374151' };
        const pres = enc.presupuestos_encomienda?.[0];
        const puedeResponder = enc.estado === 'presupuestado' && pres?.estado === 'pendiente';

        return (
          <div key={enc.id} style={{
            border: '1.5px solid #F3F4F6', borderRadius: 14, padding: 14, marginBottom: 10,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: '#111' }}>
                  {enc.tipo === 'enviar' ? 'Enviar a Río Cuarto' : 'Traer de Río Cuarto'}
                </p>
                <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>{enc.descripcion}</p>
              </div>
              <span style={{ background: c.bg, color: c.text, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, flexShrink: 0, marginLeft: 8 }}>
                {ESTADO_LABEL[enc.estado] || enc.estado}
              </span>
            </div>

            {enc.fecha_envio && (
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 0 0' }}>
                Fecha: {new Date(enc.fecha_envio + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
              </p>
            )}

            {pres && (
              <div style={{ marginTop: 10, background: '#F0FDF4', borderRadius: 10, padding: '10px 12px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#065F46', margin: '0 0 2px' }}>
                  Presupuesto: ${fmtMiles(pres.monto)}
                </p>
                {pres.mensaje && <p style={{ fontSize: 12, color: '#374151', margin: 0 }}>{pres.mensaje}</p>}

                {puedeResponder && (
                  <div style={{ marginTop: 10 }}>
                    <button
                      disabled={!!accionando}
                      onClick={() => responderPresupuesto(enc, pres.id, 'aceptar')}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        background: '#059669', color: '#fff', border: 'none', borderRadius: 9,
                        padding: '8px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      <ThumbsUp size={13} /> Aceptar
                    </button>
                  </div>
                )}

                {pres.estado === 'aceptado' && (
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#059669', marginTop: 8 }}>Aceptaste este presupuesto</p>
                )}
                {pres.estado === 'rechazado' && (
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#991B1B', marginTop: 8 }}>Rechazaste este presupuesto</p>
                )}
              </div>
            )}

            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {/* Chat con badge */}
              <button
                onClick={() => handleOpenChat(enc)}
                style={{
                  flex: 1, position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: 10,
                  padding: '9px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                <MessageSquare size={13} /> Ver chat
                {(unreadCounts[enc.id] || 0) > 0 && (
                  <span style={{
                    position: 'absolute', top: -6, right: -4,
                    background: '#DC2626', color: '#fff',
                    fontSize: 9, fontWeight: 800,
                    minWidth: 16, height: 16, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px', lineHeight: 1,
                  }}>
                    {unreadCounts[enc.id] > 9 ? '9+' : unreadCounts[enc.id]}
                  </span>
                )}
              </button>

              {/* Cancelar encomienda */}
              {!['entregado', 'cancelado'].includes(enc.estado) && (
                <button
                  onClick={() => setConfirmCancelEnc(enc)}
                  style={{
                    flex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 10,
                    padding: '9px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  <X size={13} /> Cancelar
                </button>
              )}
            </div>
          </div>
        );
      })}

      <AnimatePresence>
        {chatEnc && (
          <ChatClientModal
            encomienda={chatEnc}
            onClose={handleCloseChat}
            onRead={handleChatRead}
          />
        )}

        {confirmCancelEnc && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={() => !cancelando && setConfirmCancelEnc(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.18 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#fff', borderRadius: 20, padding: 24,
                width: '100%', maxWidth: 360,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <X size={22} color="#DC2626" />
              </div>
              <h3 style={{ fontWeight: 900, fontSize: 16, textAlign: 'center', margin: '0 0 8px' }}>
                ¿Cancelar encomienda?
              </h3>
              <p style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 1.5, margin: '0 0 20px' }}>
                Esta acción no se puede deshacer. ¿Estás seguro que querés cancelar esta solicitud?
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setConfirmCancelEnc(null)}
                  disabled={cancelando}
                  style={{ flex: 1, background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 12, padding: '11px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                >
                  Volver
                </button>
                <button
                  onClick={cancelarEncomienda}
                  disabled={cancelando}
                  style={{ flex: 1, background: cancelando ? '#aaa' : '#DC2626', color: '#fff', border: 'none', borderRadius: 12, padding: '11px 0', fontWeight: 700, fontSize: 14, cursor: cancelando ? 'not-allowed' : 'pointer' }}
                >
                  {cancelando ? 'Cancelando...' : 'Sí, cancelar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

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
    <div className="min-h-screen" style={{ background: '#FFF8F8' }}>
      {/* Hero */}
      <div style={{ position: 'relative', height: 240, overflow: 'hidden' }}>
        <img
          src="https://hvmdumuedqfoifgayleh.supabase.co/storage/v1/object/public/IMAGES/ChatGPT%20Image%2012%20may%202026,%2019_15_45.png"
          alt="Encomiendas"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.70) 100%)',
        }} />

        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: 16, left: 16,
            width: 38, height: 38, borderRadius: '50%',
            background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(8px)',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={20} color="#fff" strokeWidth={2.5} />
        </motion.button>

        <div style={{ position: 'absolute', bottom: 24, left: 20 }}>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, textShadow: '0 2px 8px rgba(0,0,0,0.4)', margin: 0 }}>
            Encomiendas<br />a Río Cuarto
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600, marginTop: 6 }}>
            Servicio de paquetería rápido y seguro
          </p>
        </div>
      </div>

      <div style={{ padding: '20px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Botón solicitar — destacado arriba */}
        <motion.button
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowForm(true)}
          style={{
            background: COLOR, color: '#fff', border: 'none', borderRadius: 20, padding: '16px',
            fontSize: 16, fontWeight: 900, letterSpacing: '-0.01em', cursor: 'pointer',
            width: '100%', boxShadow: '0 6px 24px rgba(211,47,47,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          <Package size={20} />
          Solicitar encomienda
          <ArrowRight size={18} />
        </motion.button>

        {/* Quick info chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { Icon: Package,     text: 'Hasta 20 kg'        },
            { Icon: Clock,       text: 'Entrega en el día'  },
            { Icon: CheckCircle, text: 'Seguimiento por WA' },
            { Icon: MapPin,      text: 'Retiro disponible'  },
          ].map(({ Icon, text }) => (
            <div
              key={text}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: '#fff', borderRadius: 20, padding: '7px 12px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
              }}
            >
              <Icon size={12} color={COLOR} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>
                {text}
              </span>
            </div>
          ))}
        </div>

        {/* Mis solicitudes */}
        <MisSolicitudes />

        {/* Horarios */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ background: '#fff', borderRadius: 24, padding: '18px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 900, color: '#111', marginBottom: 14, letterSpacing: '-0.01em' }}>
            Horarios de servicio
          </h2>
          {cfg?.dias_trabajo?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ALL_DAYS.map(d => {
                const activo = cfg.dias_trabajo.includes(d.val);
                const hora = activo
                  ? (cfg.horario_recepcion_desde && cfg.horario_recepcion_hasta
                      ? `${cfg.horario_recepcion_desde} — ${cfg.horario_recepcion_hasta}`
                      : 'Abierto')
                  : 'Cerrado';
                return (
                  <div key={d.val} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: activo ? '#111' : '#9CA3AF' }}>{d.label}</span>
                    <span style={{
                      fontSize: 13, fontWeight: 700,
                      color: activo ? '#2E7D32' : '#9CA3AF',
                      background: activo ? '#F0FDF4' : '#F9FAFB',
                      padding: '3px 10px', borderRadius: 999,
                    }}>
                      {hora}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
              Horarios a confirmar — consultá por WhatsApp.
            </p>
          )}
        </motion.div>

        {/* Condiciones de servicio (desde config) */}
        {(cfg?.condiciones_deposito || cfg?.condiciones_retiro) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            style={{ background: '#fff', borderRadius: 24, padding: '18px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 900, color: '#111', marginBottom: 14, letterSpacing: '-0.01em' }}>
              Cómo funciona el servicio
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cfg.condiciones_deposito && (
                <div style={{ background: '#F0FDF4', borderRadius: 14, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <MapPin size={14} color="#16A34A" />
                    <p style={{ fontWeight: 800, fontSize: 13, color: '#15803D', margin: 0 }}>
                      Podés dejar en el depósito
                    </p>
                  </div>
                  <p style={{ fontSize: 13, color: '#166534', margin: 0, lineHeight: 1.5 }}>
                    {cfg.condiciones_deposito}
                  </p>
                </div>
              )}
              {cfg.condiciones_retiro && (
                <div style={{ background: '#EFF6FF', borderRadius: 14, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Package size={14} color="#1D4ED8" />
                    <p style={{ fontWeight: 800, fontSize: 13, color: '#1D4ED8', margin: 0 }}>
                      Retiro a domicilio
                    </p>
                  </div>
                  <p style={{ fontSize: 13, color: '#1E40AF', margin: 0, lineHeight: 1.5 }}>
                    {cfg.condiciones_retiro}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Info de contacto */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ background: '#fff', borderRadius: 24, padding: '18px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 900, color: '#111', marginBottom: 14, letterSpacing: '-0.01em' }}>
            Dónde encontrarnos
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              cfg?.direccion_deposito
                ? { icon: MapPin, label: 'Depósito', val: cfg.direccion_deposito }
                : null,
              cfg?.horario_entrega_desde && cfg?.horario_entrega_hasta
                ? { icon: Clock, label: 'Horario de entregas', val: `${cfg.horario_entrega_desde} — ${cfg.horario_entrega_hasta} hs` }
                : null,
              { icon: Phone, label: 'WhatsApp', val: '+54 9 3571 000-000' },
            ].filter(Boolean).map(({ icon: Icon, label, val }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={16} color="#6B7280" />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginBottom: 1 }}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: 0 }}>{val}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* WhatsApp secundario */}
        <motion.button
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleWhatsApp}
          style={{
            background: '#25D366', color: '#fff', border: 'none', borderRadius: 20, padding: '14px',
            fontSize: 15, fontWeight: 800, cursor: 'pointer', width: '100%',
            boxShadow: '0 4px 16px rgba(37,211,102,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Consultar por WhatsApp
        </motion.button>
      </div>

      {/* Bottom sheet formulario */}
      <AnimatePresence>
        {showForm && <SolicitudForm onClose={() => setShowForm(false)} cfg={cfg} />}
      </AnimatePresence>
    </div>
  );
}
