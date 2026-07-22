import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Phone, MapPin, Clock, LogOut, Settings,
  Send, X, Check, CheckCheck, DollarSign, MessageSquare, Calendar, ZoomIn, Navigation,
  AlertCircle, Truck, LayoutDashboard, Archive, XCircle, CheckCircle, Menu, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase.js';

/* ── Design tokens ─────────────────────────────────────────────── */
const T = {
  navy: '#0F172A', teal: '#0D9488', tealDark: '#0F766E', tealSec: '#14B8A6',
  tealLight: '#5EEAD4', bg: '#F8FAFC', white: '#FFFFFF',
  textSec: '#64748B', textMuted: '#94A3B8', border: '#E2E8F0',
};
const FF    = "'Plus Jakarta Sans', sans-serif";
const GH    = 'linear-gradient(160deg, #061118 0%, #0A1E2A 28%, #0D3A35 55%, #0F172A 100%)';
const GTEAL = 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)';

const STYLES = `
  .kv-scroll::-webkit-scrollbar { display: none; }
  @keyframes kv-shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  .kv-shimmer {
    background: linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%);
    background-size: 200% 100%;
    animation: kv-shimmer 1.4s ease-in-out infinite;
  }
  /* Layout */
  .kv-sidebar {
    position: fixed; top: 0; left: 0; bottom: 0; width: 260px;
    z-index: 50; display: flex; flex-direction: column;
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(.4,0,.2,1);
  }
  .kv-sidebar.kv-open { transform: translateX(0); }
  .kv-topbar { display: flex; }
  .kv-main { margin-left: 0; padding-bottom: 72px; }
  .kv-bottom-nav { display: flex; }
  @media (min-width: 1024px) {
    .kv-sidebar { transform: translateX(0) !important; z-index: 30; }
    .kv-topbar { display: none !important; }
    .kv-main { margin-left: 260px; padding-bottom: 0; }
    .kv-bottom-nav { display: none !important; }
  }
`;

/* ── Constants ─────────────────────────────────────────────────── */
const ESTADO_LABEL = {
  pendiente: 'Pendiente', presupuestado: 'Presupuestado', confirmado: 'Confirmado',
  en_camino: 'En camino', entregado: 'Entregado', cancelado: 'Cancelado',
};

const ESTADO_STYLE = {
  pendiente:     { bg: 'rgba(234,179,8,0.12)',   color: '#854D0E', border: 'rgba(234,179,8,0.30)'   },
  presupuestado: { bg: 'rgba(13,148,136,0.10)',  color: '#0F766E', border: 'rgba(13,148,136,0.25)'  },
  confirmado:    { bg: 'rgba(13,148,136,0.12)',  color: '#065F46', border: 'rgba(13,148,136,0.30)'  },
  en_camino:     { bg: 'rgba(99,102,241,0.10)',  color: '#4338CA', border: 'rgba(99,102,241,0.25)'  },
  entregado:     { bg: 'rgba(100,116,139,0.10)', color: '#475569', border: 'rgba(100,116,139,0.20)' },
  cancelado:     { bg: 'rgba(220,38,38,0.10)',   color: '#DC2626', border: 'rgba(220,38,38,0.20)'   },
};

const VIEW_LABEL = {
  dashboard: 'Inicio', solicitudes: 'Solicitudes', presupuestos: 'Presupuestos',
  confirmadas: 'Confirmadas', en_camino: 'En camino', entregadas: 'Entregadas',
  canceladas: 'Canceladas', mensajes: 'Mensajes', ruta: 'Optimizar ruta', historial: 'Historial',
};

/* ── Utilities ─────────────────────────────────────────────────── */
function Badge({ estado }) {
  const s = ESTADO_STYLE[estado] || { bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' };
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, border: `1px solid ${s.border}`, fontFamily: FF, whiteSpace: 'nowrap' }}>
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

function WhatsAppIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

/* ── Shared UI ─────────────────────────────────────────────────── */
function UnreadBadge({ count }) {
  if (!count) return null;
  return (
    <span style={{ position: 'absolute', top: -6, right: -6, background: '#DC2626', color: '#fff', fontSize: 9, fontWeight: 800, minWidth: 16, height: 16, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', lineHeight: 1 }}>
      {count > 9 ? '9+' : count}
    </span>
  );
}

function FotoLightbox({ url, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.88)' }} onClick={onClose}>
      <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <X size={18} color="#fff" />
      </button>
      <img src={url} alt="Foto del paquete" onClick={e => e.stopPropagation()} style={{ maxWidth: '92vw', maxHeight: '85vh', borderRadius: 16, objectFit: 'contain', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }} />
    </div>
  );
}

function StatCard({ Icon, label, value, color, onClick }) {
  return (
    <button onClick={onClick} disabled={!onClick} style={{ background: T.white, border: `1.5px solid ${T.border}`, borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, cursor: onClick ? 'pointer' : 'default', boxShadow: '0 2px 8px rgba(15,23,42,0.05)', textAlign: 'left', fontFamily: FF, flex: 1, minWidth: 110 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color={color} />
      </div>
      <span style={{ fontSize: 26, fontWeight: 900, color: value > 0 ? T.navy : T.textMuted, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: T.textSec, lineHeight: 1.3 }}>{label}</span>
    </button>
  );
}

function EmptyState({ msg, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(13,148,136,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
        <Package size={24} color={T.teal} strokeWidth={1.5} />
      </div>
      <p style={{ fontWeight: 800, fontSize: 15, color: T.navy, margin: '0 0 4px', fontFamily: FF }}>{msg}</p>
      {sub && <p style={{ fontSize: 13, color: T.textMuted, margin: 0, fontFamily: FF }}>{sub}</p>}
    </div>
  );
}

function SectionHeader({ title, count, onViewAll, Icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {Icon && <Icon size={15} color={T.teal} />}
        <h2 style={{ fontSize: 14, fontWeight: 800, color: T.navy, margin: 0, fontFamily: FF }}>{title}</h2>
        {count !== undefined && count > 0 && (
          <span style={{ fontSize: 10, fontWeight: 800, background: T.teal, color: '#fff', borderRadius: 20, padding: '2px 7px', fontFamily: FF }}>{count}</span>
        )}
      </div>
      {onViewAll && (
        <button onClick={onViewAll} style={{ display: 'flex', alignItems: 'center', gap: 2, color: T.teal, fontSize: 12, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FF }}>
          Ver todo <ChevronRight size={13} />
        </button>
      )}
    </div>
  );
}

function QuickCard({ enc, unreadCount = 0, onChat, onClick }) {
  return (
    <div style={{ background: T.white, borderRadius: 12, border: `1.5px solid ${T.border}`, padding: '11px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 13, color: T.navy, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FF }}>{enc.cliente_nombre}</p>
        <p style={{ fontSize: 11, color: T.textSec, margin: '2px 0 0', fontFamily: FF }}>
          {enc.tipo === 'enviar' ? 'Enviar' : 'Traer'}
          {enc.fecha_envio ? ` · ${new Date(enc.fecha_envio + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}` : ''}
          {enc.franja_horaria ? ` · ${enc.franja_horaria}` : ''}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Badge estado={enc.estado} />
        {onChat && (
          <button
            onClick={e => { e.stopPropagation(); onChat(enc); }}
            style={{ position: 'relative', background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.20)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <MessageSquare size={13} color={T.tealDark} />
            <UnreadBadge count={unreadCount} />
          </button>
        )}
        {onClick && (
          <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
            <ChevronRight size={16} color={T.textMuted} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Chat modal ─────────────────────────────────────────────────── */
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes_encomienda', filter: `encomienda_id=eq.${encomienda.id}` }, async (payload) => {
        const msg = payload.new;
        setMensajes(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        if (msg.remitente === 'cliente') {
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

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [mensajes]);

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
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#F8F8F8', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 500, height: '78vh', display: 'flex', flexDirection: 'column', fontFamily: FF }}
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
          {loadError && <p style={{ textAlign: 'center', color: '#DC2626', fontSize: 12, marginTop: 16, background: '#FEE2E2', padding: '8px 12px', borderRadius: 8 }}>Error al cargar mensajes: {loadError}</p>}
          {!loadError && mensajes.length === 0 && <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginTop: 40 }}>Sin mensajes aún. Iniciá la conversación.</p>}
          {mensajes.map(m => {
            const esPropio = m.remitente === 'empresa';
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: esPropio ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '78%', background: esPropio ? T.teal : '#fff', color: esPropio ? '#fff' : '#111', borderRadius: esPropio ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '9px 13px', fontSize: 13, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <p style={{ margin: 0, lineHeight: 1.4 }}>{m.mensaje}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 3 }}>
                    <span style={{ fontSize: 10, opacity: 0.65 }}>{new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                    {esPropio && (m.leido ? <CheckCheck size={12} color="#93C5FD" /> : <Check size={12} color="rgba(255,255,255,0.5)" />)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={enviar} style={{ padding: '10px 14px', borderTop: '1px solid #E5E7EB', background: '#fff', display: 'flex', gap: 8, flexShrink: 0 }}>
          <input value={texto} onChange={e => setTexto(e.target.value)} placeholder="Escribí un mensaje..." style={{ flex: 1, border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '10px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          <button type="submit" disabled={!texto.trim() || sending} style={{ background: texto.trim() ? T.teal : '#E5E7EB', color: '#fff', border: 'none', borderRadius: 12, width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: texto.trim() ? 'pointer' : 'default', flexShrink: 0 }}>
            <Send size={16} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ── Presupuesto modal ──────────────────────────────────────────── */
function PresupuestoModal({ encomienda, presupuesto, onClose, onSent }) {
  const esEdicion = !!presupuesto;
  const [montoDisplay, setMontoDisplay] = useState(presupuesto ? formatMiles(String(Math.round(presupuesto.monto))) : '');
  const [montoNum, setMontoNum]         = useState(presupuesto?.monto || 0);
  const [mensaje, setMensaje]           = useState(presupuesto?.mensaje || '');
  const [loading, setLoading]           = useState(false);

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
      const { error } = await supabase.from('presupuestos_encomienda').update({ monto: montoNum, mensaje: mensaje.trim() || null, estado: 'pendiente' }).eq('id', presupuesto.id);
      if (error) { toast.error('Error al actualizar presupuesto'); setLoading(false); return; }
      const montoFmt = formatMiles(String(Math.round(montoNum)));
      const msgAuto  = mensaje.trim() ? `El presupuesto fue actualizado a $${montoFmt}. ${mensaje.trim()}` : `El presupuesto fue actualizado a $${montoFmt}.`;
      await supabase.from('mensajes_encomienda').insert({ encomienda_id: encomienda.id, remitente: 'empresa', mensaje: msgAuto });
      toast.success('Presupuesto actualizado');
    } else {
      const { error: errPres } = await supabase.from('presupuestos_encomienda').insert({ encomienda_id: encomienda.id, monto: montoNum, mensaje: mensaje.trim() || null, estado: 'pendiente' });
      if (errPres) { toast.error('Error al enviar presupuesto'); setLoading(false); return; }
      const { error: errEnc } = await supabase.from('encomiendas').update({ estado: 'presupuestado' }).eq('id', encomienda.id);
      if (errEnc) { toast.error('Error al actualizar estado'); setLoading(false); return; }
      toast.success('Presupuesto enviado');
    }
    onSent(); onClose(); setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, padding: 24, fontFamily: FF }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>{esEdicion ? 'Modificar presupuesto' : 'Enviar presupuesto'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#9CA3AF" /></button>
        </div>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
          Para: <strong style={{ color: '#111' }}>{encomienda.cliente_nombre}</strong> · {encomienda.tipo === 'enviar' ? 'Enviar paquete' : 'Traer paquete'}
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>Monto ($)</label>
            <div style={{ position: 'relative' }}>
              <DollarSign size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input type="text" inputMode="numeric" value={montoDisplay} onChange={handleMontoChange} placeholder="0" required style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 12, padding: '10px 12px 10px 32px', fontSize: 15, fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 4 }}>Mensaje (opcional)</label>
            <textarea value={mensaje} onChange={e => setMensaje(e.target.value)} placeholder="Incluye el flete, se entrega el mismo día..." rows={3} style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 12, padding: '10px 12px', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? T.textMuted : GTEAL, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: FF }}>
            {loading ? 'Guardando...' : esEdicion ? 'Actualizar presupuesto' : 'Enviar presupuesto'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ── Tarjeta unificada de encomienda ────────────────────────────── */
function EncCard({ enc, unreadCount = 0, onChat, onPresupuesto, onModificarPresupuesto, onEstadoChange }) {
  const pres       = enc.presupuestos_encomienda?.[0];
  const [fotoOpen, setFotoOpen] = useState(false);
  const s = enc.estado;

  return (
    <>
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: T.white, borderRadius: 16, border: `1.5px solid ${T.border}`, boxShadow: '0 2px 8px rgba(15,23,42,0.05)', padding: 16, marginBottom: 12 }}
    >
      {/* Codigo badge */}
      {enc.codigo && !['pendiente', 'presupuestado'].includes(s) && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: T.navy, color: '#fff', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 900, letterSpacing: '0.04em', marginBottom: 12, fontFamily: FF }}>
          <Package size={11} /> {enc.codigo}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: 15, color: T.navy, margin: 0, fontFamily: FF }}>{enc.cliente_nombre}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Phone size={12} color={T.textMuted} />
            <span style={{ fontSize: 12, color: T.textSec, fontFamily: FF }}>{enc.cliente_telefono || '—'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
          <Badge estado={s} />
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: enc.tipo === 'enviar' ? 'rgba(13,148,136,0.10)' : 'rgba(99,102,241,0.10)', color: enc.tipo === 'enviar' ? T.tealDark : '#4338CA', border: `1px solid ${enc.tipo === 'enviar' ? 'rgba(13,148,136,0.25)' : 'rgba(99,102,241,0.20)'}`, fontFamily: FF }}>
            {enc.tipo === 'enviar' ? 'Enviar' : 'Traer'}
          </span>
        </div>
      </div>

      {enc.descripcion && <p style={{ fontSize: 13, color: T.textSec, marginBottom: 10, lineHeight: 1.4, fontFamily: FF }}>{enc.descripcion}</p>}

      {/* Route */}
      {(enc.direccion_origen || enc.direccion_destino) && (
        <div style={{ background: 'rgba(15,23,42,0.028)', borderRadius: 10, padding: '8px 10px', marginBottom: 10 }}>
          {enc.direccion_origen && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: enc.direccion_destino ? 4 : 0 }}>
              <MapPin size={13} color="#10B981" style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: T.textSec, fontFamily: FF }}><strong style={{ color: T.navy }}>Origen:</strong> {enc.direccion_origen}</span>
            </div>
          )}
          {enc.direccion_destino && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <MapPin size={13} color={T.teal} style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: T.textSec, fontFamily: FF }}><strong style={{ color: T.navy }}>Destino:</strong> {enc.direccion_destino}</span>
            </div>
          )}
        </div>
      )}

      {/* Meta */}
      <div style={{ display: 'flex', gap: 12, marginBottom: pres ? 10 : 12, flexWrap: 'wrap' }}>
        {enc.fecha_envio && <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Calendar size={12} color={T.textMuted} /><span style={{ fontSize: 12, color: T.textSec, fontFamily: FF }}>{new Date(enc.fecha_envio + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span></div>}
        {enc.franja_horaria && <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Clock size={12} color={T.textMuted} /><span style={{ fontSize: 12, color: T.textSec, fontFamily: FF }}>{enc.franja_horaria}</span></div>}
        {enc.peso && <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Package size={12} color={T.textMuted} /><span style={{ fontSize: 12, color: T.textSec, fontFamily: FF }}>{enc.peso}</span></div>}
        {enc.dimensiones && <span style={{ fontSize: 12, color: T.textSec, fontFamily: FF }}>{enc.dimensiones}</span>}
      </div>

      {/* Presupuesto */}
      {pres && (
        <div style={{ background: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.18)', borderRadius: 10, padding: '8px 12px', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <DollarSign size={13} color={T.teal} />
            <span style={{ fontSize: 13, fontWeight: 800, color: T.tealDark, fontFamily: FF }}>Presupuesto: ${formatMiles(String(Math.round(pres.monto)))}</span>
          </div>
          {pres.mensaje && <p style={{ fontSize: 12, color: T.textSec, margin: '4px 0 0', lineHeight: 1.4, fontFamily: FF }}>{pres.mensaje}</p>}
        </div>
      )}

      {/* Actions row 1 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {s !== 'cancelado' && (
          <button onClick={() => onChat(enc)} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(13,148,136,0.08)', color: T.tealDark, border: '1px solid rgba(13,148,136,0.20)', borderRadius: 10, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FF }}>
            <MessageSquare size={13} /> Chat
            <UnreadBadge count={unreadCount} />
          </button>
        )}

        {s === 'pendiente' && !pres && onPresupuesto && (
          <button onClick={() => onPresupuesto(enc)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: GTEAL, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FF, boxShadow: '0 2px 8px rgba(13,148,136,0.28)' }}>
            <Send size={13} /> Presupuestar
          </button>
        )}
        {(s === 'pendiente' || s === 'presupuestado') && pres && onModificarPresupuesto && (
          <button onClick={() => onModificarPresupuesto(enc)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(13,148,136,0.06)', color: T.tealDark, border: '1px solid rgba(13,148,136,0.20)', borderRadius: 10, padding: '9px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FF }}>
            <DollarSign size={13} /> Modificar presupuesto
          </button>
        )}
        {s === 'confirmado' && onEstadoChange && (
          <button onClick={() => onEstadoChange(enc.id, 'en_camino')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#F59E0B', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FF }}>
            <Check size={13} /> Recibí el paquete
          </button>
        )}
        {s === 'en_camino' && onEstadoChange && (
          <button onClick={() => onEstadoChange(enc.id, 'entregado')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: GTEAL, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FF, boxShadow: '0 2px 8px rgba(13,148,136,0.28)' }}>
            <Check size={13} /> Entregado
          </button>
        )}
        {s === 'entregado' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: T.textSec, fontFamily: FF }}>
            <CheckCheck size={13} /> Entregado ✓
          </div>
        )}
      </div>

      {/* WA + foto */}
      <div style={{ display: 'flex', gap: 8 }}>
        <a href={waLink(enc.cliente_telefono)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fff', color: '#25D366', border: '1.5px solid #25D366', borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 700, textDecoration: 'none', fontFamily: FF }}>
          <WhatsAppIcon size={13} /> Remitente
        </a>
        <a href={enc.telefono_destinatario ? waLink(enc.telefono_destinatario) : undefined} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fff', color: '#25D366', border: '1.5px solid #25D366', borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 700, textDecoration: 'none', fontFamily: FF, opacity: enc.telefono_destinatario ? 1 : 0.5, pointerEvents: enc.telefono_destinatario ? 'auto' : 'none' }}>
          <WhatsAppIcon size={13} /> Destinatario
        </a>
        {enc.foto_url && (
          <button onClick={() => setFotoOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: T.bg, color: T.textSec, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: '8px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0, fontFamily: FF }}>
            <ZoomIn size={13} /> Foto
          </button>
        )}
      </div>
    </motion.div>
    {fotoOpen && enc.foto_url && <FotoLightbox url={enc.foto_url} onClose={() => setFotoOpen(false)} />}
    </>
  );
}

/* ── Dashboard view ─────────────────────────────────────────────── */
function DashboardView({ empresa, encomiendas, pendientes, presupuestados, confirmadas, enCamino, entregadasHoy, metricas, unreadCounts, config, onChat, onEstadoChange, onPresupuesto, onModificarPresupuesto, setActiveView }) {
  const hora  = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';
  const fecha = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

  const urgentes = useMemo(() =>
    [...pendientes].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).slice(0, 3)
  , [pendientes]);

  const encConNoLeidos = useMemo(() =>
    encomiendas.filter(e => (unreadCounts[e.id] || 0) > 0).sort((a, b) => (unreadCounts[b.id] || 0) - (unreadCounts[a.id] || 0)).slice(0, 4)
  , [encomiendas, unreadCounts]);

  const hoyStr = new Date().toLocaleDateString('en-CA');
  const entregasHoyCount = encomiendas.filter(e => e.estado === 'confirmado' && e.fecha_envio === hoyStr).length
    + encomiendas.filter(e => e.estado === 'en_camino' && e.fecha_envio === hoyStr).length;

  return (
    <div style={{ padding: '20px 20px 32px', maxWidth: 900, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ background: GH, borderRadius: 18, padding: '22px 22px 20px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -30, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.20) 0%, transparent 68%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: T.tealLight, textTransform: 'uppercase', fontFamily: FF }}>KYVRA · Panel Operativo</span>
          <h1 style={{ margin: '6px 0 2px', fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px', fontFamily: FF }}>{saludo}, {empresa.nombre}</h1>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.45)', textTransform: 'capitalize', fontFamily: FF }}>{fecha}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, overflowX: 'auto', scrollbarWidth: 'none' }} className="kv-scroll">
        <StatCard Icon={AlertCircle}   label="Nuevas solicitudes" value={metricas.pendientes}     color="#F59E0B" onClick={() => setActiveView('solicitudes')} />
        <StatCard Icon={DollarSign}    label="Esperan respuesta"  value={metricas.presupuestados} color={T.teal}  onClick={() => setActiveView('presupuestos')} />
        <StatCard Icon={CheckCircle}   label="Para retirar"       value={metricas.confirmados}    color="#10B981" onClick={() => setActiveView('confirmadas')} />
        <StatCard Icon={Truck}         label="En camino"          value={metricas.en_camino}      color="#6366F1" onClick={() => setActiveView('en_camino')} />
        <StatCard Icon={CheckCheck}    label="Entregadas hoy"     value={metricas.entregadasHoy}  color={T.tealDark} onClick={() => setActiveView('entregadas')} />
        <StatCard Icon={MessageSquare} label="Mensajes sin leer"  value={metricas.totalUnread}    color="#DC2626" onClick={() => setActiveView('mensajes')} />
      </div>

      {/* Atención prioritaria */}
      {urgentes.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader title="Necesitan atención" count={pendientes.length} Icon={AlertCircle} onViewAll={() => setActiveView('solicitudes')} />
          {urgentes.map(enc => (
            <QuickCard key={enc.id} enc={enc} unreadCount={unreadCounts[enc.id] || 0} onChat={onChat} onClick={() => setActiveView('solicitudes')} />
          ))}
        </div>
      )}

      {/* Confirmadas para retirar */}
      {confirmadas.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader title="Confirmadas para retirar" count={confirmadas.length} Icon={CheckCircle} onViewAll={() => setActiveView('confirmadas')} />
          {confirmadas.slice(0, 3).map(enc => (
            <EncCard key={enc.id} enc={enc} unreadCount={unreadCounts[enc.id] || 0} onChat={onChat} onEstadoChange={onEstadoChange} />
          ))}
        </div>
      )}

      {/* En camino */}
      {enCamino.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader title="En camino" count={enCamino.length} Icon={Truck} onViewAll={() => setActiveView('en_camino')} />
          {enCamino.slice(0, 3).map(enc => (
            <EncCard key={enc.id} enc={enc} unreadCount={unreadCounts[enc.id] || 0} onChat={onChat} onEstadoChange={onEstadoChange} />
          ))}
        </div>
      )}

      {/* Entregadas hoy */}
      {entregadasHoy.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader title="Entregadas hoy" count={entregadasHoy.length} Icon={CheckCheck} onViewAll={() => setActiveView('entregadas')} />
          {entregadasHoy.slice(0, 2).map(enc => (
            <QuickCard key={enc.id} enc={enc} unreadCount={unreadCounts[enc.id] || 0} onChat={onChat} />
          ))}
        </div>
      )}

      {/* Mensajes con no leídos */}
      {encConNoLeidos.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader title="Mensajes sin leer" count={metricas.totalUnread} Icon={MessageSquare} onViewAll={() => setActiveView('mensajes')} />
          {encConNoLeidos.map(enc => (
            <QuickCard key={enc.id} enc={enc} unreadCount={unreadCounts[enc.id] || 0} onChat={onChat} />
          ))}
        </div>
      )}

      {/* Planificación de ruta */}
      <div style={{ background: T.white, borderRadius: 16, border: `1.5px solid ${T.border}`, padding: 16 }}>
        <SectionHeader title="Planificación de ruta" Icon={Navigation} />
        <p style={{ fontSize: 13, color: T.textSec, margin: '0 0 12px', fontFamily: FF }}>
          {config?.direccion_deposito
            ? `Depósito: ${config.direccion_deposito}`
            : 'Configurá la dirección del depósito para calcular rutas.'}
        </p>
        {entregasHoyCount > 0 && (
          <p style={{ fontSize: 13, color: T.navy, fontWeight: 700, margin: '0 0 12px', fontFamily: FF }}>
            {entregasHoyCount} encomienda{entregasHoyCount !== 1 ? 's' : ''} programada{entregasHoyCount !== 1 ? 's' : ''} para hoy
          </p>
        )}
        <button
          onClick={() => setActiveView('ruta')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', background: GH, color: '#fff', border: '1px solid rgba(13,148,136,0.30)', borderRadius: 12, padding: '12px 0', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: FF }}
        >
          <Navigation size={16} /> Optimizar ruta de entrega
        </button>
      </div>
    </div>
  );
}

/* ── Lista view genérica (Solicitudes, Presupuestos, etc.) ──────── */
function ListaView({ title, sub, items, loading, emptyMsg, emptySub, unreadCounts, onChat, onPresupuesto, onModificarPresupuesto, onEstadoChange }) {
  return (
    <div style={{ padding: '20px 20px 32px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: T.navy, margin: '0 0 2px', fontFamily: FF }}>{title}</h1>
        {sub && <p style={{ fontSize: 13, color: T.textSec, margin: 0, fontFamily: FF }}>{sub}</p>}
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="kv-shimmer" style={{ borderRadius: 16, height: 160 }} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState msg={emptyMsg} sub={emptySub} />
      ) : (
        <AnimatePresence>
          {items.map(enc => (
            <EncCard
              key={enc.id}
              enc={enc}
              unreadCount={unreadCounts[enc.id] || 0}
              onChat={onChat}
              onPresupuesto={onPresupuesto}
              onModificarPresupuesto={onModificarPresupuesto}
              onEstadoChange={onEstadoChange}
            />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}

/* ── Mensajes view ──────────────────────────────────────────────── */
function MensajesView({ encomiendas, unreadCounts, onChat, loading }) {
  const [lastMsgs, setLastMsgs]     = useState({});
  const [loadingMsgs, setLoadingMsgs] = useState(true);

  useEffect(() => {
    if (!encomiendas.length) { setLoadingMsgs(false); return; }
    setLoadingMsgs(true);
    supabase
      .from('mensajes_encomienda')
      .select('encomienda_id, mensaje, remitente, created_at')
      .in('encomienda_id', encomiendas.map(e => e.id))
      .order('created_at', { ascending: false })
      .limit(500)
      .then(({ data }) => {
        const byEnc = {};
        data?.forEach(m => { if (!byEnc[m.encomienda_id]) byEnc[m.encomienda_id] = m; });
        setLastMsgs(byEnc);
        setLoadingMsgs(false);
      });
  }, [encomiendas]);

  const sorted = useMemo(() => {
    const hasMsg = encomiendas.filter(e => lastMsgs[e.id] || (unreadCounts[e.id] || 0) > 0);
    return hasMsg.sort((a, b) => {
      const ua = unreadCounts[a.id] || 0, ub = unreadCounts[b.id] || 0;
      if (ua !== ub) return ub - ua;
      const la = lastMsgs[a.id]?.created_at || '', lb = lastMsgs[b.id]?.created_at || '';
      return lb.localeCompare(la);
    });
  }, [encomiendas, unreadCounts, lastMsgs]);

  const isLoading = loading || loadingMsgs;

  return (
    <div style={{ padding: '20px 20px 32px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: T.navy, margin: '0 0 2px', fontFamily: FF }}>Mensajes</h1>
        <p style={{ fontSize: 13, color: T.textSec, margin: 0, fontFamily: FF }}>Conversaciones con clientes</p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4].map(i => <div key={i} className="kv-shimmer" style={{ borderRadius: 12, height: 72 }} />)}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState msg="Sin conversaciones activas" sub="Los mensajes de clientes aparecerán aquí" />
      ) : (
        sorted.map(enc => {
          const last = lastMsgs[enc.id];
          const unread = unreadCounts[enc.id] || 0;
          return (
            <div
              key={enc.id}
              onClick={() => onChat(enc)}
              style={{ background: unread > 0 ? 'rgba(13,148,136,0.04)' : T.white, borderRadius: 14, border: `1.5px solid ${unread > 0 ? 'rgba(13,148,136,0.22)' : T.border}`, padding: '13px 16px', marginBottom: 8, cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center', boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: unread > 0 ? 'rgba(13,148,136,0.12)' : T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MessageSquare size={18} color={unread > 0 ? T.teal : T.textMuted} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: T.navy, margin: 0, fontFamily: FF }}>{enc.cliente_nombre}</p>
                  {last && <span style={{ fontSize: 11, color: T.textMuted, fontFamily: FF }}>{new Date(last.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>}
                </div>
                {last && (
                  <p style={{ fontSize: 12, color: T.textSec, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FF }}>
                    {last.remitente === 'empresa' ? 'Vos: ' : ''}{last.mensaje}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                  <Badge estado={enc.estado} />
                  {enc.tipo && <span style={{ fontSize: 10, color: T.textMuted, fontFamily: FF }}>{enc.tipo === 'enviar' ? 'Enviar' : 'Traer'}</span>}
                </div>
              </div>
              {unread > 0 && (
                <div style={{ background: T.teal, color: '#fff', fontSize: 11, fontWeight: 800, minWidth: 22, height: 22, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0, fontFamily: FF }}>
                  {unread > 9 ? '9+' : unread}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

/* ── Ruta view ──────────────────────────────────────────────────── */
function RutaView({ encomiendas, config, dias, contsPorDia, diaRuta, setDiaRuta, rutaOptimizada, setRutaOptimizada, optimizando, optimizarRuta }) {
  const encParaRuta = useMemo(() =>
    diaRuta
      ? encomiendas.filter(e => e.fecha_envio === diaRuta && ['confirmado', 'en_camino'].includes(e.estado) && e.direccion_destino)
      : [],
    [encomiendas, diaRuta]
  );

  return (
    <div style={{ padding: '20px 20px 32px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: T.navy, margin: '0 0 2px', fontFamily: FF }}>Optimizar ruta</h1>
        <p style={{ fontSize: 13, color: T.textSec, margin: 0, fontFamily: FF }}>
          {config?.direccion_deposito ? `Depósito: ${config.direccion_deposito}` : 'Configurá la dirección del depósito en Configuración'}
        </p>
      </div>

      {/* Day selector */}
      <div style={{ background: T.white, borderRadius: 14, border: `1.5px solid ${T.border}`, padding: '12px 16px', marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: FF }}>Seleccioná el día</p>
        <div className="kv-scroll" style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {dias.map(d => {
            const count      = contsPorDia[d.dateStr] || 0;
            const isSelected = d.dateStr === diaRuta;
            const dayAbbr    = d.date.toLocaleDateString('es-AR', { weekday: 'short' }).slice(0, 3).toUpperCase();
            const dayNum     = d.date.getDate();
            return (
              <button key={d.dateStr}
                onClick={() => { setDiaRuta(d.dateStr); setRutaOptimizada(null); }}
                style={{ minWidth: 48, border: 'none', cursor: 'pointer', background: isSelected ? GTEAL : count > 0 ? 'rgba(13,148,136,0.08)' : T.bg, borderRadius: 12, padding: '8px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0, boxShadow: isSelected ? '0 3px 10px rgba(13,148,136,0.30)' : 'none', outline: count > 0 && !isSelected ? '1.5px solid rgba(13,148,136,0.22)' : 'none', fontFamily: FF }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: isSelected ? 'rgba(255,255,255,0.80)' : T.textMuted }}>{dayAbbr}</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: isSelected ? '#fff' : count > 0 ? T.navy : T.textMuted }}>{dayNum}</span>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.70)' : count > 0 ? T.teal : 'transparent' }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Route button / panel */}
      {encParaRuta.length === 0 ? (
        <EmptyState msg="Sin encomiendas para este día" sub="Confirmadas o en camino con dirección de destino aparecerán aquí" />
      ) : !rutaOptimizada ? (
        <button
          onClick={optimizarRuta}
          disabled={optimizando}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: optimizando ? T.textMuted : GH, color: '#fff', border: '1px solid rgba(13,148,136,0.30)', borderRadius: 14, padding: '14px 0', fontWeight: 800, fontSize: 14, cursor: optimizando ? 'not-allowed' : 'pointer', fontFamily: FF, boxShadow: optimizando ? 'none' : '0 4px 14px rgba(0,0,0,0.18)' }}
        >
          <Navigation size={16} />
          {optimizando ? 'Calculando ruta...' : `Optimizar ruta (${encParaRuta.length} paradas)`}
        </button>
      ) : (
        <div style={{ background: rutaOptimizada.esFallback ? '#FFFBEB' : T.white, border: `1.5px solid ${rutaOptimizada.esFallback ? '#FCD34D' : T.border}`, borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <p style={{ fontWeight: 800, fontSize: 14, color: rutaOptimizada.esFallback ? '#92400E' : T.navy, margin: 0, fontFamily: FF }}>
                {rutaOptimizada.esFallback ? 'Orden por horario' : 'Ruta optimizada'} · {rutaOptimizada.encomiendas.length} paradas
              </p>
              {rutaOptimizada.esFallback && <p style={{ fontSize: 11, color: '#B45309', margin: '2px 0 0', fontFamily: FF }}>Maps no disponible — ordenado por hora de entrega</p>}
            </div>
            <button onClick={() => setRutaOptimizada(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X size={16} color={T.textSec} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {rutaOptimizada.encomiendas.map((enc, idx) => (
              <div key={enc.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: GTEAL, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, fontFamily: FF }}>{idx + 1}</div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: T.navy, margin: 0, fontFamily: FF }}>{enc.cliente_nombre}</p>
                  <p style={{ fontSize: 12, color: T.textSec, margin: '2px 0 0', lineHeight: 1.4, fontFamily: FF }}>{enc.direccion_destino}</p>
                  {enc.franja_horaria && <p style={{ fontSize: 11, color: T.textMuted, margin: '2px 0 0', fontFamily: FF }}>⏰ {enc.franja_horaria}</p>}
                </div>
              </div>
            ))}
          </div>

          <a href={rutaOptimizada.mapsUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: rutaOptimizada.esFallback ? '#F59E0B' : GTEAL, color: '#fff', borderRadius: 12, padding: '12px 0', fontWeight: 800, fontSize: 14, textDecoration: 'none', fontFamily: FF, boxShadow: rutaOptimizada.esFallback ? '0 4px 14px rgba(245,158,11,0.30)' : '0 4px 14px rgba(13,148,136,0.30)' }}
          >
            <MapPin size={15} /> Ver en Google Maps
          </a>
        </div>
      )}
    </div>
  );
}

/* ── Historial view ─────────────────────────────────────────────── */
function HistorialView({ historial, unreadCounts, onChat, loading }) {
  return (
    <div style={{ padding: '20px 20px 32px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: T.navy, margin: '0 0 2px', fontFamily: FF }}>Historial</h1>
        <p style={{ fontSize: 13, color: T.textSec, margin: 0, fontFamily: FF }}>Encomiendas entregadas y canceladas</p>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="kv-shimmer" style={{ borderRadius: 16, height: 120 }} />)}
        </div>
      ) : historial.length === 0 ? (
        <EmptyState msg="Sin historial aún" sub="Las encomiendas completadas aparecerán aquí" />
      ) : (
        <AnimatePresence>
          {historial.map(enc => (
            <EncCard key={enc.id} enc={enc} unreadCount={unreadCounts[enc.id] || 0} onChat={onChat} />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}

/* ── Panel principal ────────────────────────────────────────────── */
export default function EncomiendaPanel() {
  const empresa  = useOutletContext();
  const navigate = useNavigate();

  /* ── State ──────────────────────────────────────────────────── */
  const [encomiendas, setEncomiendas]         = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [modalPres, setModalPres]             = useState(null);
  const [modalChat, setModalChat]             = useState(null);
  const [unreadCounts, setUnreadCounts]       = useState({});
  const [config, setConfig]                   = useState(null);
  const [rutaOptimizada, setRutaOptimizada]   = useState(null);
  const [optimizando, setOptimizando]         = useState(false);
  const [activeView, setActiveView]           = useState('dashboard');
  const [sidebarOpen, setSidebarOpen]         = useState(false);
  const [diaRuta, setDiaRuta]                 = useState(() => new Date().toLocaleDateString('en-CA'));
  const openChatIdRef = useRef(null);

  /* ── Data fetching ──────────────────────────────────────────── */
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

  /* ── Realtime subscriptions ─────────────────────────────────── */
  useEffect(() => {
    const ch = supabase
      .channel('unread-badge-empresa')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes_encomienda' }, (payload) => {
        const msg = payload.new;
        if (msg.remitente === 'cliente' && msg.encomienda_id !== openChatIdRef.current) {
          setUnreadCounts(prev => ({ ...prev, [msg.encomienda_id]: (prev[msg.encomienda_id] || 0) + 1 }));
        }
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  useEffect(() => {
    const ch = supabase
      .channel('encomiendas-estado')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'encomiendas' }, (payload) => {
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
    supabase.from('config_encomiendas').select('*').eq('empresa_id', empresa.id).maybeSingle().then(({ data }) => setConfig(data));
  }, [empresa.id]);

  /* ── Handlers ───────────────────────────────────────────────── */
  const handleOpenChat  = (enc) => { openChatIdRef.current = enc.id; setModalChat(enc); };
  const handleCloseChat = () => { openChatIdRef.current = null; setModalChat(null); };
  const handleChatRead  = (id) => setUnreadCounts(prev => ({ ...prev, [id]: 0 }));

  const handleEstadoChange = async (id, nuevoEstado) => {
    const { error } = await supabase.from('encomiendas').update({ estado: nuevoEstado }).eq('id', id);
    if (error) { toast.error('Error al actualizar estado'); return; }
    toast.success(`Pasado a ${ESTADO_LABEL[nuevoEstado]}`);
    fetchEncomiendas();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/encomiendas/panel/login');
  };

  const handlePresupuesto         = (enc) => setModalPres({ enc, pres: null });
  const handleModificarPresupuesto = (enc) => setModalPres({ enc, pres: enc.presupuestos_encomienda?.[0] || null });

  /* ── Route optimization logic (unchanged) ───────────────────── */
  const sortByHoraEntrega = (encs) =>
    [...encs].sort((a, b) => {
      const hora = (str) => parseInt((str || '').match(/\d+/)?.[0] ?? '99', 10);
      return hora(a.franja_horaria) - hora(b.franja_horaria);
    });

  const buildMapsUrl = (origin, encOrdenadas) => {
    const addrs    = encOrdenadas.map(e => e.direccion_destino);
    const allStops = [origin, ...addrs, origin];
    return `https://www.google.com/maps/dir/${allStops.map(s => encodeURIComponent(s)).join('/')}`;
  };

  const encParaRuta = useMemo(() =>
    encomiendas.filter(e => e.fecha_envio === diaRuta && ['confirmado', 'en_camino'].includes(e.estado) && e.direccion_destino),
    [encomiendas, diaRuta]
  );

  const optimizarRuta = async () => {
    if (encParaRuta.length === 0) { toast.error('No hay encomiendas con dirección de destino'); return; }
    if (!config?.direccion_deposito) { toast.error('Configurá la dirección del depósito en Configuración'); return; }
    setOptimizando(true);
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    const origin = config.direccion_deposito;
    const addrs  = encParaRuta.map(e => e.direccion_destino);

    if (encParaRuta.length === 1) {
      setRutaOptimizada({ encomiendas: encParaRuta, mapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(addrs[0])}&travelmode=driving`, esFallback: false });
      setOptimizando(false); toast.success('Ruta calculada'); return;
    }

    const waypointsParam = 'optimize:true|' + addrs.map(a => encodeURIComponent(a)).join('|');
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(origin)}&waypoints=${waypointsParam}&key=${apiKey}&language=es&region=ar`;
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

  /* ── Computed lists ─────────────────────────────────────────── */
  const hoyStr             = new Date().toLocaleDateString('en-CA');
  const dias               = useMemo(() => generarDias(), []);
  const contsPorDia        = useMemo(() => {
    const counts = {};
    encomiendas.forEach(e => {
      if (['confirmado', 'en_camino', 'entregado'].includes(e.estado) && e.fecha_envio) {
        counts[e.fecha_envio] = (counts[e.fecha_envio] || 0) + 1;
      }
    });
    return counts;
  }, [encomiendas]);

  const pendientes         = useMemo(() => encomiendas.filter(e => e.estado === 'pendiente').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), [encomiendas]);
  const presupuestados     = useMemo(() => encomiendas.filter(e => e.estado === 'presupuestado').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), [encomiendas]);
  const confirmadas        = useMemo(() => encomiendas.filter(e => e.estado === 'confirmado').sort((a, b) => (a.fecha_envio || '').localeCompare(b.fecha_envio || '')), [encomiendas]);
  const enCamino           = useMemo(() => encomiendas.filter(e => e.estado === 'en_camino'), [encomiendas]);
  const entregadas         = useMemo(() => encomiendas.filter(e => e.estado === 'entregado').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), [encomiendas]);
  const entregadasHoy      = useMemo(() => entregadas.filter(e => e.fecha_envio === hoyStr), [entregadas, hoyStr]);
  const canceladas         = useMemo(() => encomiendas.filter(e => e.estado === 'cancelado').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), [encomiendas]);
  const historial          = useMemo(() => encomiendas.filter(e => ['entregado', 'cancelado'].includes(e.estado)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), [encomiendas]);

  const metricas = useMemo(() => ({
    pendientes:     pendientes.length,
    presupuestados: presupuestados.length,
    confirmados:    confirmadas.length,
    en_camino:      enCamino.length,
    entregadasHoy:  entregadasHoy.length,
    cancelados:     canceladas.length,
    totalUnread:    Object.values(unreadCounts).reduce((a, b) => a + b, 0),
  }), [pendientes, presupuestados, confirmadas, enCamino, entregadasHoy, canceladas, unreadCounts]);

  /* ── Sidebar nav items ──────────────────────────────────────── */
  const NAV = [
    { id: 'dashboard',    label: 'Inicio',         Icon: LayoutDashboard },
    { id: 'solicitudes',  label: 'Solicitudes',    Icon: Package,        badge: metricas.pendientes },
    { id: 'presupuestos', label: 'Presupuestos',   Icon: DollarSign,     badge: metricas.presupuestados },
    { id: 'confirmadas',  label: 'Confirmadas',    Icon: CheckCircle,    badge: metricas.confirmados },
    { id: 'en_camino',    label: 'En camino',      Icon: Truck,          badge: metricas.en_camino },
    { id: 'entregadas',   label: 'Entregadas',     Icon: CheckCheck },
    { id: 'canceladas',   label: 'Canceladas',     Icon: XCircle },
    { id: 'mensajes',     label: 'Mensajes',       Icon: MessageSquare,  badge: metricas.totalUnread },
    { id: 'ruta',         label: 'Optimizar ruta', Icon: Navigation },
    { id: 'historial',    label: 'Historial',      Icon: Archive },
  ];

  const BOTTOM_NAV = [
    { id: 'dashboard',   label: 'Inicio',     Icon: LayoutDashboard },
    { id: 'solicitudes', label: 'Solicitudes', Icon: Package,        badge: metricas.pendientes },
    { id: 'mensajes',    label: 'Mensajes',   Icon: MessageSquare,  badge: metricas.totalUnread },
    { id: 'ruta',        label: 'Ruta',       Icon: Navigation },
    { id: '_menu',       label: 'Menú',       Icon: Menu },
  ];

  const navGo = (id) => { setActiveView(id); setSidebarOpen(false); };

  /* ── Sidebar render ─────────────────────────────────────────── */
  const Sidebar = (
    <aside className={`kv-sidebar${sidebarOpen ? ' kv-open' : ''}`} style={{ background: T.navy }}>
      {/* Company */}
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.tealLight }} />
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: T.tealLight, textTransform: 'uppercase', fontFamily: FF }}>KYVRA · Encomiendas</span>
        </div>
        <p style={{ fontWeight: 900, fontSize: 15, color: '#fff', margin: '0 0 2px', letterSpacing: '-0.2px', fontFamily: FF }}>{empresa.nombre}</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', margin: 0, fontFamily: FF }}>Panel operativo</p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 10px', scrollbarWidth: 'none' }}>
        {NAV.map(item => {
          const active = activeView === item.id;
          return (
            <button key={item.id} onClick={() => navGo(item.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, marginBottom: 2, background: active ? 'rgba(13,148,136,0.22)' : 'transparent', border: 'none', cursor: 'pointer', position: 'relative', fontFamily: FF, textAlign: 'left' }}
            >
              <item.Icon size={16} color={active ? T.tealLight : 'rgba(255,255,255,0.50)'} strokeWidth={active ? 2.5 : 2} />
              <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? T.tealLight : 'rgba(255,255,255,0.65)', flex: 1 }}>{item.label}</span>
              {item.badge > 0 && (
                <span style={{ background: active ? T.tealSec : T.teal, color: '#fff', fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{item.badge > 99 ? '99+' : item.badge}</span>
              )}
            </button>
          );
        })}

        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '8px 0' }} />

        <button onClick={() => { setSidebarOpen(false); navigate('/encomiendas/panel/configuracion'); }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, marginBottom: 2, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: FF }}>
          <Settings size={16} color="rgba(255,255,255,0.50)" />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.65)' }}>Configuración</span>
        </button>
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <button onClick={handleLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.18)', cursor: 'pointer', fontFamily: FF }}>
          <LogOut size={15} color="#FCA5A5" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#FCA5A5' }}>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: FF }}>
      <style>{STYLES}</style>

      {/* Sidebar */}
      {Sidebar}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.50)', zIndex: 49 }} />
      )}

      {/* Main content */}
      <div className="kv-main">
        {/* Mobile top bar */}
        <header className="kv-topbar" style={{ background: GH, position: 'sticky', top: 0, zIndex: 30, padding: '0 16px', height: 56, alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 16px rgba(0,0,0,0.22)' }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Menu size={18} color="#fff" />
          </button>
          <p style={{ fontWeight: 800, fontSize: 15, color: '#fff', margin: 0, fontFamily: FF }}>{VIEW_LABEL[activeView] || 'Panel'}</p>
          <button onClick={() => navigate('/encomiendas/panel/configuracion')} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Settings size={16} color="rgba(255,255,255,0.80)" />
          </button>
        </header>

        {/* Views */}
        {activeView === 'dashboard' && (
          <DashboardView
            empresa={empresa}
            encomiendas={encomiendas}
            pendientes={pendientes}
            presupuestados={presupuestados}
            confirmadas={confirmadas}
            enCamino={enCamino}
            entregadasHoy={entregadasHoy}
            metricas={metricas}
            unreadCounts={unreadCounts}
            config={config}
            onChat={handleOpenChat}
            onEstadoChange={handleEstadoChange}
            onPresupuesto={handlePresupuesto}
            onModificarPresupuesto={handleModificarPresupuesto}
            setActiveView={setActiveView}
          />
        )}

        {activeView === 'solicitudes' && (
          <ListaView
            title="Solicitudes"
            sub={`${pendientes.length} nueva${pendientes.length !== 1 ? 's' : ''} — pendientes de presupuesto`}
            items={pendientes}
            loading={loading}
            emptyMsg="Sin solicitudes pendientes"
            emptySub="Las nuevas solicitudes de clientes aparecerán aquí"
            unreadCounts={unreadCounts}
            onChat={handleOpenChat}
            onPresupuesto={handlePresupuesto}
            onModificarPresupuesto={handleModificarPresupuesto}
          />
        )}

        {activeView === 'presupuestos' && (
          <ListaView
            title="Presupuestos enviados"
            sub="Esperando confirmación del cliente"
            items={presupuestados}
            loading={loading}
            emptyMsg="Sin presupuestos pendientes"
            emptySub="Los presupuestos enviados aguardando respuesta aparecerán aquí"
            unreadCounts={unreadCounts}
            onChat={handleOpenChat}
            onModificarPresupuesto={handleModificarPresupuesto}
          />
        )}

        {activeView === 'confirmadas' && (
          <ListaView
            title="Confirmadas para retirar"
            sub="El cliente confirmó — pendiente de recepción"
            items={confirmadas}
            loading={loading}
            emptyMsg="Sin encomiendas confirmadas"
            emptySub="Cuando un cliente confirme su solicitud aparecerá aquí"
            unreadCounts={unreadCounts}
            onChat={handleOpenChat}
            onEstadoChange={handleEstadoChange}
          />
        )}

        {activeView === 'en_camino' && (
          <ListaView
            title="En camino"
            sub="En tránsito activo"
            items={enCamino}
            loading={loading}
            emptyMsg="Sin encomiendas en camino"
            emptySub="Las entregas en tránsito aparecerán aquí"
            unreadCounts={unreadCounts}
            onChat={handleOpenChat}
            onEstadoChange={handleEstadoChange}
          />
        )}

        {activeView === 'entregadas' && (
          <ListaView
            title="Entregadas"
            sub="Historial de entregas completadas"
            items={entregadas}
            loading={loading}
            emptyMsg="Sin entregas aún"
            emptySub="Las encomiendas entregadas aparecerán aquí"
            unreadCounts={unreadCounts}
            onChat={handleOpenChat}
          />
        )}

        {activeView === 'canceladas' && (
          <ListaView
            title="Canceladas"
            sub="Solicitudes canceladas por el cliente o la empresa"
            items={canceladas}
            loading={loading}
            emptyMsg="Sin cancelaciones"
            emptySub="Las encomiendas canceladas aparecerán aquí"
            unreadCounts={unreadCounts}
            onChat={handleOpenChat}
          />
        )}

        {activeView === 'mensajes' && (
          <MensajesView
            encomiendas={encomiendas}
            unreadCounts={unreadCounts}
            onChat={handleOpenChat}
            loading={loading}
          />
        )}

        {activeView === 'ruta' && (
          <RutaView
            encomiendas={encomiendas}
            config={config}
            dias={dias}
            contsPorDia={contsPorDia}
            diaRuta={diaRuta}
            setDiaRuta={setDiaRuta}
            rutaOptimizada={rutaOptimizada}
            setRutaOptimizada={setRutaOptimizada}
            optimizando={optimizando}
            optimizarRuta={optimizarRuta}
          />
        )}

        {activeView === 'historial' && (
          <HistorialView
            historial={historial}
            unreadCounts={unreadCounts}
            onChat={handleOpenChat}
            loading={loading}
          />
        )}
      </div>

      {/* Mobile bottom nav */}
      <nav className="kv-bottom-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30, background: T.white, borderTop: `1px solid ${T.border}`, height: 60, justifyContent: 'space-around', alignItems: 'center', boxShadow: '0 -2px 12px rgba(15,23,42,0.08)' }}>
        {BOTTOM_NAV.map(item => {
          const active = activeView === item.id;
          const handleClick = item.id === '_menu' ? () => setSidebarOpen(true) : () => navGo(item.id);
          return (
            <button key={item.id} onClick={handleClick}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', position: 'relative', flex: 1, fontFamily: FF }}
            >
              {item.badge > 0 && (
                <span style={{ position: 'absolute', top: 2, right: '50%', transform: 'translateX(10px)', background: '#DC2626', color: '#fff', fontSize: 8, fontWeight: 800, minWidth: 14, height: 14, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 2px' }}>
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
              <item.Icon size={20} color={active ? T.teal : T.textMuted} strokeWidth={active ? 2.5 : 2} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? T.teal : T.textMuted }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

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
