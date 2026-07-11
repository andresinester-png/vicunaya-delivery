import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Phone, MapPin, Clock, LogOut, Settings,
  Send, X, Check, CheckCheck, DollarSign, MessageSquare, Calendar, ZoomIn, Navigation,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase.js';

const COLOR = '#e31b23';

const ESTADO_LABEL = {
  pendiente:     'Pendiente',
  presupuestado: 'Presupuestado',
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

function Badge({ estado }) {
  const c = ESTADO_COLOR[estado] || { bg: '#F3F4F6', text: '#374151' };
  return (
    <span style={{ background: c.bg, color: c.text, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
      {ESTADO_LABEL[estado] || estado}
    </span>
  );
}

function formatMiles(raw) {
  if (!raw) return '';
  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function waLink(tel) {
  return `https://wa.me/549${(tel || '').replace(/\D/g, '')}`;
}

function generarDias() {
  const dias = [];
  for (let i = 0; i < 14; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    dias.push({ dateStr: date.toLocaleDateString('en-CA'), date: new Date(date) });
  }
  return dias;
}

/* ── Ícono WhatsApp ─────────────────────────────────────────────── */
function WhatsAppIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

/* ── Lightbox de foto ───────────────────────────────────────────── */
function FotoLightbox({ url, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.88)' }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
      >
        <X size={18} color="#fff" />
      </button>
      <img
        src={url}
        alt="Foto del paquete"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '92vw', maxHeight: '85vh', borderRadius: 16, objectFit: 'contain', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
      />
    </div>
  );
}

/* ── Badge de no leídos ─────────────────────────────────────────── */
function UnreadBadge({ count }) {
  if (!count) return null;
  return (
    <span style={{
      position: 'absolute', top: -6, right: -6,
      background: '#DC2626', color: '#fff',
      fontSize: 9, fontWeight: 800,
      minWidth: 16, height: 16, borderRadius: 8,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 3px', lineHeight: 1,
    }}>
      {count > 9 ? '9+' : count}
    </span>
  );
}

/* ── Chat modal (empresa) ───────────────────────────────────────── */
function ChatModal({ encomienda, onClose, onRead }) {
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

    const hayNoLeidos = data?.some(m => m.remitente === 'cliente' && !m.leido);
    if (hayNoLeidos) {
      const { error: markErr } = await supabase
        .from('mensajes_encomienda')
        .update({ leido: true })
        .eq('encomienda_id', encomienda.id)
        .eq('remitente', 'cliente')
        .eq('leido', false);
      if (!markErr) {
        setMensajes(prev => prev.map(m => m.remitente === 'cliente' ? { ...m, leido: true } : m));
        onRead(encomienda.id);
      }
    }
  };

  useEffect(() => {
    cargarYMarcar();

    const ch = supabase
      .channel(`chat-empresa-${encomienda.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'mensajes_encomienda',
        filter: `encomienda_id=eq.${encomienda.id}`,
      }, async (payload) => {
        const msg = payload.new;
        setMensajes(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        if (msg.remitente === 'cliente') {
          await supabase.from('mensajes_encomienda').update({ leido: true }).eq('id', msg.id);
          setMensajes(prev => prev.map(m => m.id === msg.id ? { ...m, leido: true } : m));
          onRead(encomienda.id);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'mensajes_encomienda',
        filter: `encomienda_id=eq.${encomienda.id}`,
      }, (payload) => {
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
      .insert({ encomienda_id: encomienda.id, remitente: 'empresa', mensaje: msg })
      .select().single();

    if (error) { toast.error('Error al enviar el mensaje'); setTexto(msg); }
    else { setMensajes(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data]); }
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
          background: '#F8F8F8', borderRadius: '20px 20px 0 0',
          width: '100%', maxWidth: 500, height: '78vh',
          display: 'flex', flexDirection: 'column',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #E5E7EB', background: '#fff', borderRadius: '20px 20px 0 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 800, fontSize: 15, margin: 0 }}>{encomienda.cliente_nombre}</p>
              <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>
                {encomienda.tipo === 'enviar' ? 'Enviar' : 'Traer'} · {encomienda.cliente_telefono}
                {encomienda.codigo && ` · ${encomienda.codigo}`}
              </p>
            </div>
            <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={16} color="#6B7280" />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loadError && (
            <p style={{ textAlign: 'center', color: '#DC2626', fontSize: 12, marginTop: 16, background: '#FEE2E2', padding: '8px 12px', borderRadius: 8 }}>
              Error al cargar mensajes: {loadError}
            </p>
          )}
          {!loadError && mensajes.length === 0 && (
            <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginTop: 40 }}>
              Sin mensajes aún. Iniciá la conversación.
            </p>
          )}
          {mensajes.map(m => {
            const esPropio = m.remitente === 'empresa';
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: esPropio ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '78%',
                  background: esPropio ? COLOR : '#fff',
                  color: esPropio ? '#fff' : '#111',
                  borderRadius: esPropio ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  padding: '9px 13px', fontSize: 13,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}>
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
            style={{ background: texto.trim() ? COLOR : '#E5E7EB', color: '#fff', border: 'none', borderRadius: 12, width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: texto.trim() ? 'pointer' : 'default', flexShrink: 0 }}
          >
            <Send size={16} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ── Modal presupuesto ──────────────────────────────────────────── */
function PresupuestoModal({ encomienda, presupuesto, onClose, onSent }) {
  const esEdicion = !!presupuesto;

  const [montoDisplay, setMontoDisplay] = useState(
    presupuesto ? formatMiles(String(Math.round(presupuesto.monto))) : ''
  );
  const [montoNum, setMontoNum] = useState(presupuesto?.monto || 0);
  const [mensaje, setMensaje]   = useState(presupuesto?.mensaje || '');
  const [loading, setLoading]   = useState(false);

  const handleMontoChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setMontoNum(raw ? Number(raw) : 0);
    setMontoDisplay(formatMiles(raw));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!montoNum) { toast.error('Ingresá un monto válido'); return; }
    setLoading(true);

    if (esEdicion) {
      const { error } = await supabase
        .from('presupuestos_encomienda')
        .update({ monto: montoNum, mensaje: mensaje.trim() || null, estado: 'pendiente' })
        .eq('id', presupuesto.id);
      if (error) { toast.error('Error al actualizar presupuesto'); setLoading(false); return; }

      const montoFmt = formatMiles(String(Math.round(montoNum)));
      const msgAuto  = mensaje.trim()
        ? `El presupuesto fue actualizado a $${montoFmt}. ${mensaje.trim()}`
        : `El presupuesto fue actualizado a $${montoFmt}.`;
      await supabase.from('mensajes_encomienda').insert({
        encomienda_id: encomienda.id, remitente: 'empresa', mensaje: msgAuto,
      });
      toast.success('Presupuesto actualizado');
    } else {
      const { error: errPres } = await supabase.from('presupuestos_encomienda').insert({
        encomienda_id: encomienda.id,
        monto: montoNum,
        mensaje: mensaje.trim() || null,
        estado: 'pendiente',
      });
      if (errPres) { toast.error('Error al enviar presupuesto'); setLoading(false); return; }

      const { error: errEnc } = await supabase
        .from('encomiendas').update({ estado: 'presupuestado' }).eq('id', encomienda.id);
      if (errEnc) { toast.error('Error al actualizar estado'); setLoading(false); return; }

      toast.success('Presupuesto enviado');
    }

    onSent();
    onClose();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, padding: 24, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>
            {esEdicion ? 'Modificar presupuesto' : 'Enviar presupuesto'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#9CA3AF" /></button>
        </div>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
          Para: <strong style={{ color: '#111' }}>{encomienda.cliente_nombre}</strong>
          {' · '}{encomienda.tipo === 'enviar' ? 'Enviar paquete' : 'Traer paquete'}
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>Monto ($)</label>
            <div style={{ position: 'relative' }}>
              <DollarSign size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type="text" inputMode="numeric"
                value={montoDisplay} onChange={handleMontoChange}
                placeholder="0" required
                style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 12, padding: '10px 12px 10px 32px', fontSize: 15, fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>Mensaje (opcional)</label>
            <textarea
              value={mensaje} onChange={e => setMensaje(e.target.value)}
              placeholder="Incluye el flete, se entrega el mismo día..."
              rows={3}
              style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 12, padding: '10px 12px', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>
          <button
            type="submit" disabled={loading}
            style={{ width: '100%', background: loading ? '#aaa' : COLOR, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Guardando...' : esEdicion ? 'Actualizar presupuesto' : 'Enviar presupuesto'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ── Tarjeta solicitud (pendiente / presupuestado) ──────────────── */
function SolicitudCard({ enc, unreadCount, onPresupuesto, onModificarPresupuesto, onChat }) {
  const pres = enc.presupuestos_encomienda?.[0];
  const [fotoOpen, setFotoOpen] = useState(false);

  return (
    <>
    <motion.div
      layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', marginBottom: 12 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: 15, color: '#111', margin: 0 }}>{enc.cliente_nombre}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Phone size={12} color="#9CA3AF" />
            <span style={{ fontSize: 12, color: '#6B7280' }}>{enc.cliente_telefono || '—'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <Badge estado={enc.estado} />
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            background: enc.tipo === 'enviar' ? '#FEE2E2' : '#DBEAFE',
            color: enc.tipo === 'enviar' ? '#991B1B' : '#1E40AF',
          }}>
            {enc.tipo === 'enviar' ? 'Enviar' : 'Traer'}
          </span>
        </div>
      </div>

      {enc.descripcion && (
        <p style={{ fontSize: 13, color: '#374151', marginBottom: 10, lineHeight: 1.4 }}>{enc.descripcion}</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
        {enc.direccion_origen && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <MapPin size={13} color="#10B981" style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#374151' }}><strong>Origen:</strong> {enc.direccion_origen}</span>
          </div>
        )}
        {enc.direccion_destino && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <MapPin size={13} color={COLOR} style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#374151' }}><strong>Destino:</strong> {enc.direccion_destino}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: pres ? 10 : 12, flexWrap: 'wrap' }}>
        {enc.fecha_envio && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Calendar size={12} color="#9CA3AF" />
            <span style={{ fontSize: 12, color: '#6B7280' }}>
              {new Date(enc.fecha_envio + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        )}
        {enc.franja_horaria && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Clock size={12} color="#9CA3AF" />
            <span style={{ fontSize: 12, color: '#6B7280' }}>{enc.franja_horaria}</span>
          </div>
        )}
        {enc.peso && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Package size={12} color="#9CA3AF" />
            <span style={{ fontSize: 12, color: '#6B7280' }}>{enc.peso}</span>
          </div>
        )}
      </div>

      {pres && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '8px 12px', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <DollarSign size={13} color="#16A34A" />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#15803D' }}>
              Presupuesto: ${formatMiles(String(Math.round(pres.monto)))}
            </span>
          </div>
          {pres.mensaje && (
            <p style={{ fontSize: 12, color: '#166534', margin: '4px 0 0', lineHeight: 1.4 }}>{pres.mensaje}</p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button
          onClick={() => onChat(enc)}
          style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          <MessageSquare size={13} /> Chat
          <UnreadBadge count={unreadCount} />
        </button>

        {pres ? (
          <button
            onClick={() => onModificarPresupuesto(enc)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', borderRadius: 10, padding: '9px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            <DollarSign size={13} /> Modificar presupuesto
          </button>
        ) : (
          <button
            onClick={() => onPresupuesto(enc)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: COLOR, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            <Send size={13} /> Presupuestar
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <a
          href={waLink(enc.cliente_telefono)}
          target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fff', color: '#25D366', border: '1.5px solid #25D366', borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
        >
          <WhatsAppIcon size={13} /> Remitente
        </a>
        <a
          href={enc.telefono_destinatario ? waLink(enc.telefono_destinatario) : undefined}
          target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fff', color: '#25D366', border: '1.5px solid #25D366', borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 700, textDecoration: 'none', opacity: enc.telefono_destinatario ? 1 : 0.5, pointerEvents: enc.telefono_destinatario ? 'auto' : 'none' }}
        >
          <WhatsAppIcon size={13} /> Destinatario
        </a>
        {enc.foto_url && (
          <button
            onClick={() => setFotoOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F3F4F6', color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '8px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
          >
            <ZoomIn size={13} /> Foto
          </button>
        )}
      </div>
    </motion.div>
    {fotoOpen && enc.foto_url && <FotoLightbox url={enc.foto_url} onClose={() => setFotoOpen(false)} />}
    </>
  );
}

/* ── Tarjeta de día (confirmado / en_camino / entregado) ────────── */
function DiaCard({ enc, unreadCount, onEstadoChange, onChat }) {
  const isConfirmado = enc.estado === 'confirmado';
  const isEnCamino   = enc.estado === 'en_camino';
  const isEntregado  = enc.estado === 'entregado';
  const [fotoOpen, setFotoOpen] = useState(false);

  const cardBg     = isConfirmado ? '#FFF3CD' : isEnCamino ? '#D4EDDA' : '#F8F9FA';
  const cardBorder = isConfirmado ? '#FFC107'  : isEnCamino ? '#28A745'  : '#CCC';
  const codeBg     = isConfirmado ? '#856404'  : isEnCamino ? '#155724'  : '#6B7280';

  return (
    <>
    <motion.div
      layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: cardBg, border: `1.5px solid ${cardBorder}`, borderRadius: 16, padding: 16, marginBottom: 12 }}
    >
      {enc.codigo && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: codeBg, color: '#fff',
          borderRadius: 8, padding: '5px 12px',
          fontSize: 13, fontWeight: 900, letterSpacing: '0.04em',
          marginBottom: 12,
        }}>
          <Package size={12} /> {enc.codigo}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: 15, color: '#111', margin: 0 }}>{enc.cliente_nombre}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Phone size={12} color="#6B7280" />
            <span style={{ fontSize: 12, color: '#374151' }}>{enc.cliente_telefono || '—'}</span>
          </div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
          background: enc.tipo === 'enviar' ? '#FEE2E2' : '#DBEAFE',
          color: enc.tipo === 'enviar' ? '#991B1B' : '#1E40AF',
        }}>
          {enc.tipo === 'enviar' ? 'Enviar' : 'Traer'}
        </span>
      </div>

      {enc.descripcion && (
        <p style={{ fontSize: 13, color: '#374151', marginBottom: 10, lineHeight: 1.4 }}>{enc.descripcion}</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
        {enc.direccion_origen && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <MapPin size={13} color="#10B981" style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#374151' }}><strong>Origen:</strong> {enc.direccion_origen}</span>
          </div>
        )}
        {enc.direccion_destino && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <MapPin size={13} color={COLOR} style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#374151' }}><strong>Destino:</strong> {enc.direccion_destino}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        {enc.franja_horaria && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Clock size={12} color="#6B7280" />
            <span style={{ fontSize: 12, color: '#374151' }}>{enc.franja_horaria}</span>
          </div>
        )}
        {enc.peso && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Package size={12} color="#6B7280" />
            <span style={{ fontSize: 12, color: '#374151' }}>{enc.peso}</span>
          </div>
        )}
        {enc.dimensiones && (
          <span style={{ fontSize: 12, color: '#374151' }}>{enc.dimensiones}</span>
        )}
      </div>

      {/* Botones de acción + WhatsApp en la misma fila */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={() => onChat(enc)}
          style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(255,255,255,0.7)', color: '#1D4ED8', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          <MessageSquare size={13} /> Chat
          <UnreadBadge count={unreadCount} />
        </button>

        <a
          href={waLink(enc.cliente_telefono)}
          target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fff', color: '#25D366', border: '1.5px solid #25D366', borderRadius: 10, padding: '9px 12px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
        >
          <WhatsAppIcon size={13} /> Remitente
        </a>
        <a
          href={enc.telefono_destinatario ? waLink(enc.telefono_destinatario) : undefined}
          target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fff', color: '#25D366', border: '1.5px solid #25D366', borderRadius: 10, padding: '9px 12px', fontSize: 12, fontWeight: 700, textDecoration: 'none', opacity: enc.telefono_destinatario ? 1 : 0.5, pointerEvents: enc.telefono_destinatario ? 'auto' : 'none' }}
        >
          <WhatsAppIcon size={13} /> Destinatario
        </a>

        {isConfirmado && (
          <button
            onClick={() => onEstadoChange(enc.id, 'en_camino')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#FFC107', color: '#333', border: 'none', borderRadius: 10, padding: '9px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', minWidth: 140 }}
          >
            <Check size={13} /> Recibí el paquete
          </button>
        )}
        {isEnCamino && (
          <button
            onClick={() => onEstadoChange(enc.id, 'entregado')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#28A745', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', minWidth: 120 }}
          >
            <Check size={13} /> Entregado
          </button>
        )}
        {isEntregado && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: '#6B7280' }}>
            <Check size={13} /> Entregado ✓
          </div>
        )}
        {enc.foto_url && (
          <button
            onClick={() => setFotoOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F3F4F6', color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '9px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
          >
            <ZoomIn size={13} /> Foto
          </button>
        )}
      </div>
    </motion.div>
    {fotoOpen && enc.foto_url && <FotoLightbox url={enc.foto_url} onClose={() => setFotoOpen(false)} />}
    </>
  );
}

/* ── Panel principal ────────────────────────────────────────────── */
export default function EncomiendaPanel() {
  const empresa  = useOutletContext();
  const navigate = useNavigate();

  const [encomiendas, setEncomiendas]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null); // null = sin día = muestra pendientes
  const [modalPres, setModalPres]       = useState(null);
  const [modalChat, setModalChat]       = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [config, setConfig]                   = useState(null);
  const [rutaOptimizada, setRutaOptimizada]   = useState(null);
  const [optimizando, setOptimizando]         = useState(false);
  const openChatIdRef = useRef(null);

  const fetchUnreadCounts = async (ids) => {
    if (!ids?.length) return;
    const { data } = await supabase
      .from('mensajes_encomienda')
      .select('encomienda_id')
      .in('encomienda_id', ids)
      .eq('remitente', 'cliente')
      .eq('leido', false);
    const counts = {};
    data?.forEach(m => { counts[m.encomienda_id] = (counts[m.encomienda_id] || 0) + 1; });
    setUnreadCounts(counts);
  };

  const fetchEncomiendas = async () => {
    const { data, error } = await supabase
      .from('encomiendas')
      .select('*, presupuestos_encomienda(*)')
      .eq('empresa_id', empresa.id)
      .order('created_at', { ascending: false });

    if (!error) {
      const list = data || [];
      setEncomiendas(list);
      fetchUnreadCounts(list.map(e => e.id));
    }
    setLoading(false);
  };

  useEffect(() => {
    const ch = supabase
      .channel('unread-badge-empresa')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'mensajes_encomienda',
      }, (payload) => {
        const msg = payload.new;
        if (msg.remitente === 'cliente' && msg.encomienda_id !== openChatIdRef.current) {
          setUnreadCounts(prev => ({
            ...prev,
            [msg.encomienda_id]: (prev[msg.encomienda_id] || 0) + 1,
          }));
        }
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  useEffect(() => {
    const ch = supabase
      .channel('encomiendas-estado')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'encomiendas',
      }, (payload) => {
        const enc = payload.new;
        if (enc.empresa_id !== empresa.id) return;
        if (enc.estado === 'cancelado') {
          toast('Una encomienda fue cancelada por el cliente', { icon: '⚠️', duration: 5000, style: { fontWeight: 700 } });
        } else if (enc.estado === 'confirmado') {
          toast('¡Encomienda confirmada por el cliente!', { icon: '✅', duration: 4000, style: { fontWeight: 700 } });
        }
        fetchEncomiendas();
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  useEffect(() => { fetchEncomiendas(); }, []);

  useEffect(() => {
    supabase
      .from('config_encomiendas')
      .select('direccion_deposito')
      .eq('empresa_id', empresa.id)
      .maybeSingle()
      .then(({ data }) => setConfig(data));
  }, [empresa.id]);

  useEffect(() => { setRutaOptimizada(null); }, [diaSeleccionado]);

  const handleOpenChat = (enc) => { openChatIdRef.current = enc.id; setModalChat(enc); };
  const handleCloseChat = () => { openChatIdRef.current = null; setModalChat(null); };
  const handleChatRead = (id) => setUnreadCounts(prev => ({ ...prev, [id]: 0 }));

  const handleEstadoChange = async (id, nuevoEstado) => {
    const { error } = await supabase.from('encomiendas').update({ estado: nuevoEstado }).eq('id', id);
    if (error) { toast.error('Error al actualizar estado'); return; }
    toast.success(`Pasado a ${ESTADO_LABEL[nuevoEstado]}`);
    fetchEncomiendas();
  };

  const handleLogout = () => {
    localStorage.removeItem('vicunaya_encomiendas_session');
    navigate('/encomiendas/panel/login');
  };

  /* Días */
  const dias = useMemo(() => generarDias(), []);

  const contsPorDia = useMemo(() => {
    const counts = {};
    encomiendas.forEach(e => {
      if (['confirmado', 'en_camino', 'entregado'].includes(e.estado) && e.fecha_envio) {
        counts[e.fecha_envio] = (counts[e.fecha_envio] || 0) + 1;
      }
    });
    return counts;
  }, [encomiendas]);

  /* Lista activa según día seleccionado */
  const listaActual = useMemo(() => {
    if (diaSeleccionado === null) {
      return encomiendas
        .filter(e => ['pendiente', 'presupuestado'].includes(e.estado))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    const order = { confirmado: 0, en_camino: 1, entregado: 2 };
    return encomiendas
      .filter(e =>
        e.fecha_envio === diaSeleccionado &&
        ['confirmado', 'en_camino', 'entregado'].includes(e.estado)
      )
      .sort((a, b) => (order[a.estado] ?? 3) - (order[b.estado] ?? 3));
  }, [encomiendas, diaSeleccionado]);

  /* Encomiendas con dirección de destino para la ruta */
  const encParaRuta = useMemo(() =>
    diaSeleccionado
      ? listaActual.filter(e => ['confirmado', 'en_camino'].includes(e.estado) && e.direccion_destino)
      : [],
    [listaActual, diaSeleccionado]
  );

  const sortByHoraEntrega = (encs) =>
    [...encs].sort((a, b) => {
      const hora = (str) => parseInt((str || '').match(/\d+/)?.[0] ?? '99', 10);
      return hora(a.franja_horaria) - hora(b.franja_horaria);
    });

  const buildMapsUrl = (origin, encOrdenadas) => {
    const addrs   = encOrdenadas.map(e => e.direccion_destino);
    const allStops = [origin, ...addrs, origin];
    return `https://www.google.com/maps/dir/${allStops.map(s => encodeURIComponent(s)).join('/')}`;
  };

  const optimizarRuta = async () => {
    if (encParaRuta.length === 0) { toast.error('No hay encomiendas con dirección de destino'); return; }
    if (!config?.direccion_deposito) { toast.error('Configurá la dirección del depósito en Configuración'); return; }

    setOptimizando(true);
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    const origin = config.direccion_deposito;
    const addrs  = encParaRuta.map(e => e.direccion_destino);

    if (encParaRuta.length === 1) {
      setRutaOptimizada({
        encomiendas: encParaRuta,
        mapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(addrs[0])}&travelmode=driving`,
        esFallback: false,
      });
      setOptimizando(false);
      toast.success('Ruta calculada');
      return;
    }

    const waypointsParam = 'optimize:true|' + addrs.map(a => encodeURIComponent(a)).join('|');
    const url = `https://maps.googleapis.com/maps/api/directions/json?` +
      `origin=${encodeURIComponent(origin)}&` +
      `destination=${encodeURIComponent(origin)}&` +
      `waypoints=${waypointsParam}&` +
      `key=${apiKey}&language=es&region=ar`;

    try {
      const res  = await fetch(url);
      const data = await res.json();

      if (data.status === 'OK') {
        const waypointOrder = data.routes[0].waypoint_order;
        const encOrdenadas  = waypointOrder.map(i => encParaRuta[i]);
        setRutaOptimizada({ encomiendas: encOrdenadas, mapsUrl: buildMapsUrl(origin, encOrdenadas), esFallback: false });
        toast.success('Ruta optimizada');
      } else {
        const encOrdenadas = sortByHoraEntrega(encParaRuta);
        setRutaOptimizada({ encomiendas: encOrdenadas, mapsUrl: buildMapsUrl(origin, encOrdenadas), esFallback: true });
        toast('API no disponible. Ordenado por horario de entrega.', { icon: '⚠️' });
      }
    } catch {
      const encOrdenadas = sortByHoraEntrega(encParaRuta);
      setRutaOptimizada({ encomiendas: encOrdenadas, mapsUrl: buildMapsUrl(origin, encOrdenadas), esFallback: true });
      toast('Sin conexión a Maps. Ordenado por horario de entrega.', { icon: '⚠️' });
    }
    setOptimizando(false);
  };

  /* Título de la lista */
  const titulo = useMemo(() => {
    if (diaSeleccionado === null) return 'Solicitudes pendientes';
    const hoy = new Date().toLocaleDateString('en-CA');
    if (diaSeleccionado === hoy) return 'Encomiendas de hoy';
    const d = new Date(diaSeleccionado + 'T12:00:00');
    const fmt = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    return `Encomiendas del ${fmt}`;
  }, [diaSeleccionado]);

  const EmptyState = ({ msg }) => (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <Package size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} color="#9CA3AF" />
      <p style={{ fontWeight: 700, fontSize: 15, color: '#6B7280', margin: 0 }}>{msg}</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F8F8F8', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`.dias-scroll::-webkit-scrollbar { display: none; }`}</style>

      {/* Header */}
      <header style={{ background: COLOR, padding: '0 16px', boxShadow: '0 2px 12px rgba(227,27,35,0.25)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: '#fff', fontWeight: 900, fontSize: 17, margin: 0, lineHeight: 1.2 }}>{empresa.nombre}</p>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, margin: 0 }}>Panel de encomiendas</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => navigate('/encomiendas/panel/configuracion')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer' }}
            >
              <Settings size={16} />
            </button>
            <button
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              <LogOut size={14} /> Salir
            </button>
          </div>
        </div>
      </header>

      {/* Selector de días (sticky bajo el header) */}
      <div
        style={{
          background: '#fff', borderBottom: '1px solid #E5E7EB',
          position: 'sticky', top: 56, zIndex: 30,
          padding: '10px 16px 12px',
        }}
      >
        <div
          className="dias-scroll flex gap-1 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none' }}
        >
          {dias.map(d => {
            const count      = contsPorDia[d.dateStr] || 0;
            const isSelected = d.dateStr === diaSeleccionado;
            const dayAbbr    = d.date.toLocaleDateString('es-AR', { weekday: 'short' }).slice(0, 3).toUpperCase();
            const dayNum     = d.date.getDate();

            return (
              <button
                key={d.dateStr}
                onClick={() => setDiaSeleccionado(prev => prev === d.dateStr ? null : d.dateStr)}
                className="flex flex-col items-center py-2.5 rounded-xl transition-all shrink-0"
                style={{
                  minWidth: 46, border: 'none',
                  background: isSelected ? '#E63A2E' : '#F3F4F6',
                  color: isSelected ? '#fff' : count > 0 ? '#111' : '#9CA3AF',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 3px 10px rgba(230,58,46,0.35)' : 'none',
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, lineHeight: 1 }}>{dayAbbr}</span>
                <span style={{ fontSize: 18, fontWeight: 900, lineHeight: 1, marginTop: 4 }}>{dayNum}</span>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', marginTop: 4,
                  background: isSelected
                    ? 'rgba(255,255,255,0.7)'
                    : count > 0 ? '#E63A2E' : 'transparent',
                }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista */}
      <div style={{ padding: '14px 16px 80px' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 14, textTransform: 'capitalize' }}>
          {titulo}
        </p>

        {/* Botón / panel de ruta optimizada */}
        {diaSeleccionado && encParaRuta.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {!rutaOptimizada ? (
              <button
                onClick={optimizarRuta}
                disabled={optimizando}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: optimizando ? '#9CA3AF' : '#1D4ED8', color: '#fff',
                  border: 'none', borderRadius: 14, padding: '13px 0',
                  fontWeight: 800, fontSize: 14, cursor: optimizando ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', boxShadow: optimizando ? 'none' : '0 4px 14px rgba(29,78,216,0.3)',
                }}
              >
                <Navigation size={16} />
                {optimizando ? 'Calculando ruta...' : `Optimizar ruta (${encParaRuta.length} paradas)`}
              </button>
            ) : (
              <div style={{ background: rutaOptimizada.esFallback ? '#FFFBEB' : '#EFF6FF', border: `1.5px solid ${rutaOptimizada.esFallback ? '#FCD34D' : '#BFDBFE'}`, borderRadius: 16, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 14, color: rutaOptimizada.esFallback ? '#92400E' : '#1E40AF', margin: 0 }}>
                      {rutaOptimizada.esFallback ? 'Orden por horario' : 'Ruta optimizada'} · {rutaOptimizada.encomiendas.length} paradas
                    </p>
                    {rutaOptimizada.esFallback && (
                      <p style={{ fontSize: 11, color: '#B45309', margin: '2px 0 0' }}>Maps no disponible — ordenado por hora de entrega</p>
                    )}
                  </div>
                  <button
                    onClick={() => setRutaOptimizada(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                  >
                    <X size={16} color="#6B7280" />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                  {rutaOptimizada.encomiendas.map((enc, idx) => (
                    <div key={enc.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: '#1D4ED8', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: 13,
                      }}>
                        {idx + 1}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 13, color: '#111', margin: 0 }}>{enc.cliente_nombre}</p>
                        <p style={{ fontSize: 12, color: '#374151', margin: '2px 0 0', lineHeight: 1.4 }}>{enc.direccion_destino}</p>
                        {enc.franja_horaria && (
                          <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>⏰ {enc.franja_horaria}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <a
                  href={rutaOptimizada.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: rutaOptimizada.esFallback ? '#D97706' : '#1D4ED8',
                    color: '#fff', borderRadius: 12, padding: '12px 0',
                    fontWeight: 800, fontSize: 14, textDecoration: 'none',
                    boxShadow: rutaOptimizada.esFallback
                      ? '0 4px 14px rgba(217,119,6,0.3)'
                      : '0 4px 14px rgba(29,78,216,0.3)',
                  }}
                >
                  <MapPin size={15} /> Ver en Google Maps
                </a>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => <div key={i} style={{ background: '#fff', borderRadius: 16, height: 160, opacity: 0.5 }} />)}
          </div>
        ) : listaActual.length === 0 ? (
          <EmptyState msg={diaSeleccionado === null ? 'Sin solicitudes pendientes' : 'Sin encomiendas para este día'} />
        ) : (
          <AnimatePresence>
            {listaActual.map(enc =>
              diaSeleccionado === null ? (
                <SolicitudCard
                  key={enc.id}
                  enc={enc}
                  unreadCount={unreadCounts[enc.id] || 0}
                  onPresupuesto={(e) => setModalPres({ enc: e, pres: null })}
                  onModificarPresupuesto={(e) => setModalPres({ enc: e, pres: e.presupuestos_encomienda?.[0] || null })}
                  onChat={handleOpenChat}
                />
              ) : (
                <DiaCard
                  key={enc.id}
                  enc={enc}
                  unreadCount={unreadCounts[enc.id] || 0}
                  onEstadoChange={handleEstadoChange}
                  onChat={handleOpenChat}
                />
              )
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modalPres && (
          <PresupuestoModal
            encomienda={modalPres.enc}
            presupuesto={modalPres.pres}
            onClose={() => setModalPres(null)}
            onSent={fetchEncomiendas}
          />
        )}
        {modalChat && (
          <ChatModal
            encomienda={modalChat}
            onClose={handleCloseChat}
            onRead={handleChatRead}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
