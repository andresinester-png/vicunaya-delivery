import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, XCircle, Clock, ChefHat, Bike, PackageCheck, Bell,
  ShoppingBag, MapPin, Wallet, Timer, Volume2, VolumeX,
  AlertTriangle, ArrowRight, UtensilsCrossed, Store, TrendingUp,
  Star, BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase.js';
import { useRestaurant } from '../../contexts/RestaurantContext.js';
import { subscribeToPush } from '../../lib/pushNotifications.js';
import { usePendingOrdersAlert } from '../../hooks/usePendingOrdersAlert.js';
import { playConfirmation } from '../../lib/sounds.js';

// ── Design tokens ────────────────────────────────────────────────────────────
const FF = "'Plus Jakarta Sans', sans-serif";
const T = {
  teal:     '#0D9488',
  tealDark: '#0F766E',
  tealSec:  '#14B8A6',
  tealLight:'#5EEAD4',
  tealBg:   'rgba(13,148,136,0.10)',
  navy:     '#0F172A',
  navyMid:  '#1E293B',
  bg:       '#F8FAFC',
  white:    '#FFFFFF',
  textSec:  '#64748B',
  textMuted:'#94A3B8',
  border:   '#E2E8F0',
};
const GH   = 'linear-gradient(160deg, #061118 0%, #0A1E2A 28%, #0D3A35 55%, #0F172A 100%)';
const GTEAL = 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)';
const GDARK = 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)';

// ── Responsive styles injected once ─────────────────────────────────────────
const STYLES = `
  .kv-dash { font-family: ${FF}; color: ${T.navy}; }
  .kv-priority { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .kv-split { display: flex; flex-direction: column; gap: 16px; }
  .kv-sidebar { display: flex; flex-direction: column; gap: 14px; }
  .kv-desk-only { display: none !important; }
  .kv-mob-only { display: flex; }
  @media (min-width: 1024px) {
    .kv-priority { grid-template-columns: 2fr 1fr 1fr; }
    .kv-split { flex-direction: row; align-items: flex-start; gap: 20px; }
    .kv-orders-col { flex: 1; min-width: 0; }
    .kv-sidebar { width: 340px; flex-shrink: 0; }
    .kv-desk-only { display: flex !important; }
    .kv-mob-only { display: none !important; }
  }
  @keyframes kv-pulse-amber {
    0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.55); }
    50%       { box-shadow: 0 0 0 8px rgba(245,158,11,0); }
  }
  @keyframes kv-pulse-dot {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.35; }
  }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name) {
  if (!name) return 'R';
  return name.trim()[0].toUpperCase();
}

function getOpSentence(pending, kitchen, road, todayTotal) {
  const active = pending + kitchen + road;
  if (pending > 0) return `${pending} pedido${pending > 1 ? 's' : ''} esperando confirmación`;
  if (kitchen > 0) return `${kitchen} pedido${kitchen > 1 ? 's' : ''} en preparación`;
  if (road > 0)    return `${road} pedido${road > 1 ? 's' : ''} en camino`;
  if (todayTotal > 0) return `${todayTotal} pedido${todayTotal > 1 ? 's' : ''} procesados hoy · sin activos`;
  return 'Sin pedidos activos · esperando el primer pedido';
}

function todayLabel() {
  return new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function WhatsAppIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.849L0 24l6.335-1.508A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.017-1.376l-.36-.214-3.727.887.926-3.635-.235-.373A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
    </svg>
  );
}

function buildWhatsAppUrl(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('549')) return `https://wa.me/${digits}`;
  if (digits.startsWith('54'))  return `https://wa.me/549${digits.slice(2)}`;
  const local = digits.startsWith('0') ? digits.slice(1) : digits;
  return `https://wa.me/549${local}`;
}

function CustomerInfo({ phone, orderId, orderCreatedAt, allOrders }) {
  const [showHistory, setShowHistory] = useState(false);
  if (!phone) return null;
  const waUrl = buildWhatsAppUrl(phone);
  const prevOrders = allOrders
    .filter(o => o.customer_phone === phone && o.id !== orderId && new Date(o.created_at) < new Date(orderCreatedAt))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const isNew = prevOrders.length === 0;
  const last3 = prevOrders.slice(0, 3);
  return (
    <div>
      {waUrl && (
        <a href={waUrl} target="_blank" rel="noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#16A34A', fontWeight: 600, textDecoration: 'none' }}>
          <WhatsAppIcon size={11} />{phone}
        </a>
      )}
      <div style={{ marginTop: 2 }}>
        {isNew
          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#FEF3C7', color: '#92400E' }}>✦ Cliente nuevo</span>
          : <button onClick={() => setShowHistory(v => !v)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#DCFCE7', color: '#15803D', border: 'none', cursor: 'pointer' }}>
              ✓ {prevOrders.length} pedido{prevOrders.length !== 1 ? 's' : ''} previo{prevOrders.length !== 1 ? 's' : ''}
            </button>
        }
      </div>
      {showHistory && last3.length > 0 && (
        <div style={{ marginTop: 5, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 10px', background: T.bg }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Últimos pedidos</p>
          {last3.map(o => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
              <span style={{ color: T.textSec }}>{new Date(o.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</span>
              <span style={{ fontWeight: 700, color: T.navy }}>${o.total?.toLocaleString('es-AR')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Status ───────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending:   { label: 'Pendiente',  dot: '#F59E0B', bg: '#FEF3C7', text: '#92400E',  border: '#F59E0B' },
  accepted:  { label: 'Aceptado',   dot: '#38BDF8', bg: '#E0F2FE', text: '#0369A1',  border: '#38BDF8' },
  preparing: { label: 'Preparando', dot: '#3B82F6', bg: '#DBEAFE', text: '#1D4ED8',  border: '#3B82F6' },
  ready:     { label: 'En camino',  dot: T.teal,    bg: '#F0FDFA', text: T.tealDark, border: T.teal    },
  delivered: { label: 'Entregado',  dot: '#22C55E', bg: '#DCFCE7', text: '#15803D',  border: '#22C55E' },
  rejected:  { label: 'Rechazado',  dot: '#F87171', bg: '#FEE2E2', text: '#B91C1C',  border: '#F87171' },
};
const NEXT_STATUS    = { accepted: 'preparing', preparing: 'ready', ready: 'delivered' };
const PAYMENT_LABELS = { card: 'Tarjeta', transfer: 'Transferencia', cash: 'Efectivo' };
const FILTERS        = [
  ['all', 'Todos'], ['pending', 'Pendientes'], ['accepted', 'Aceptados'],
  ['preparing', 'Preparando'], ['ready', 'En camino'], ['delivered', 'Entregados'],
];

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.text, whiteSpace: 'nowrap', fontFamily: FF }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

function elapsedLabel(createdAt, now) {
  const d = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60000));
  if (d < 1)  return 'Recién';
  if (d < 60) return `${d}m`;
  return `${Math.floor(d / 60)}h ${d % 60}m`;
}

function elapsedMinutes(createdAt, now) {
  return Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60000));
}

function OrderActions({ order, onUpdate, fullWidth }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '10px 18px', borderRadius: 10, fontWeight: 700,
    fontSize: 13, fontFamily: FF, cursor: 'pointer', border: 'none',
    whiteSpace: 'nowrap', transition: 'opacity 0.15s',
    width: fullWidth ? '100%' : undefined,
  };
  if (order.order_status === 'pending') return (
    <div style={{ display: 'flex', gap: 8, width: fullWidth ? '100%' : undefined }}>
      <button onClick={() => onUpdate(order.id, 'accepted')}
        style={{ ...base, flex: fullWidth ? 1 : undefined, background: '#16A34A', color: '#fff', boxShadow: '0 3px 12px rgba(22,163,74,0.32)' }}>
        <CheckCircle size={14} /> Aceptar
      </button>
      <button onClick={() => onUpdate(order.id, 'rejected')}
        style={{ ...base, flex: fullWidth ? 1 : undefined, background: 'transparent', color: '#DC2626', border: '1.5px solid #FECACA' }}>
        <XCircle size={14} /> Rechazar
      </button>
    </div>
  );
  if (order.order_status === 'accepted') return (
    <button onClick={() => onUpdate(order.id, 'preparing')}
      style={{ ...base, background: '#2563EB', color: '#fff', boxShadow: '0 3px 12px rgba(37,99,235,0.32)' }}>
      <ChefHat size={14} /> Empezar a preparar
    </button>
  );
  if (order.order_status === 'preparing') return (
    <button onClick={() => onUpdate(order.id, 'ready')}
      style={{ ...base, background: GTEAL, color: '#fff', boxShadow: '0 3px 12px rgba(13,148,136,0.32)' }}>
      <PackageCheck size={14} /> Marcar como listo
    </button>
  );
  if (order.order_status === 'ready') return (
    <button onClick={() => onUpdate(order.id, 'delivered')}
      style={{ ...base, background: '#16A34A', color: '#fff', boxShadow: '0 3px 12px rgba(22,163,74,0.32)' }}>
      <Bike size={14} /> Marcar en camino
    </button>
  );
  return null;
}

// ── Main component ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const restaurant = useRestaurant();
  const navigate   = useNavigate();
  const [orders,   setOrders]   = useState([]);
  const [filter,   setFilter]   = useState('pending');
  const [newCount, setNewCount] = useState(0);
  const [isOpen,   setIsOpen]   = useState(true);
  const [now,      setNow]      = useState(() => Date.now());

  useEffect(() => { if (restaurant) setIsOpen(restaurant.is_active ?? true); }, [restaurant]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!restaurant) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) subscribeToPush(data.session.user.id, supabase);
    });
  }, [restaurant]);

  useEffect(() => {
    if (!restaurant) return;
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders').select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });
      setOrders(data || []);
    };
    fetchOrders();
    const channel = supabase
      .channel(`restaurant-orders-${restaurant.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurant.id}` },
        ({ new: order }) => {
          setOrders(prev => [order, ...prev]);
          setNewCount(c => c + 1);
          toast('🛵 Nuevo pedido recibido!', { duration: 5000, icon: '🔔' });
          new Audio('/notification.mp3').play().catch(() => {});
          if (Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification('🛵 Nuevo pedido — Kyvra', {
                body: `${order.customer_name} · ${order.items?.length ?? 0} productos · $${(order.total ?? 0).toLocaleString('es-AR')}`,
                tag: 'new-order', renotify: true, data: { url: '/restaurant/panel/pedidos' },
              });
            });
          }
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurant.id}` },
        ({ new: order }) => setOrders(prev => prev.map(o => o.id === order.id ? order : o)))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [restaurant]);

  const updateStatus = async (orderId, status) => {
    const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
    if (error) { toast.error('Error al actualizar'); return; }
    if (status === 'accepted') playConfirmation();
    toast.success('Estado actualizado');
    fetch('/api/notify-client', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, newStatus: status }),
    }).catch(() => {});
  };

  const toggleOpen = async () => {
    const next = !isOpen;
    setIsOpen(next);
    const { error } = await supabase.from('restaurants').update({ is_active: next }).eq('id', restaurant.id);
    if (error) { setIsOpen(!next); toast.error('Error al actualizar estado'); return; }
    toast.success(next ? 'Local abierto' : 'Local cerrado');
  };

  // ── Computed metrics ─────────────────────────────────────────────────────
  const todayOrders      = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
  const todayRevenue     = todayOrders.filter(o => o.order_status === 'delivered').reduce((s, o) => s + o.total, 0);
  const newOrders        = todayOrders.filter(o => o.order_status === 'pending').length;
  const preparingOrders  = todayOrders.filter(o => ['accepted', 'preparing'].includes(o.order_status)).length;
  const dispatchedOrders = todayOrders.filter(o => ['ready', 'delivered'].includes(o.order_status)).length;
  const pendingCount     = orders.filter(o => o.order_status === 'pending').length;
  const acceptedCount    = orders.filter(o => o.order_status === 'accepted').length;
  const kitchenCount     = orders.filter(o => o.order_status === 'preparing').length;
  const inKitchenCount   = acceptedCount + kitchenCount;
  const onTheWayCount    = orders.filter(o => o.order_status === 'ready').length;
  const deliveredToday   = todayOrders.filter(o => o.order_status === 'delivered').length;

  const { audioEnabled, muted, enableAudio, toggleMute } = usePendingOrdersAlert(pendingCount);

  const STATUS_PRIORITY = { pending: 0, accepted: 1, preparing: 2, ready: 3, delivered: 4, rejected: 5 };
  const filtered = orders
    .filter(o => filter === 'all' ? true : o.order_status === filter)
    .sort((a, b) => {
      if (filter !== 'all') return new Date(b.created_at) - new Date(a.created_at);
      const pd = (STATUS_PRIORITY[a.order_status] ?? 9) - (STATUS_PRIORITY[b.order_status] ?? 9);
      return pd !== 0 ? pd : new Date(b.created_at) - new Date(a.created_at);
    });

  // ── Peak hours (all orders, real derived) ────────────────────────────────
  const hourCounts = Array.from({ length: 24 }, () => 0);
  orders.forEach(o => { hourCounts[new Date(o.created_at).getHours()]++; });
  let firstHour = hourCounts.findIndex(c => c > 0);
  let lastHour  = hourCounts.length - 1 - [...hourCounts].reverse().findIndex(c => c > 0);
  if (firstHour === -1) { firstHour = 8; lastHour = 22; }
  const peakHours    = [];
  for (let h = firstHour; h <= lastHour; h++) peakHours.push({ hour: h, count: hourCounts[h] });
  const maxHourCount = Math.max(...peakHours.map(p => p.count), 1);
  const showPeakHours = orders.length >= 5;

  // ── Top products (all non-rejected orders, real derived) ─────────────────
  const productCounts = {};
  orders.filter(o => o.order_status !== 'rejected').forEach(o =>
    (o.items || []).forEach(item => {
      productCounts[item.name] = (productCounts[item.name] || 0) + (item.qty || 0);
    })
  );
  const topProducts   = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => ({ name, qty }));
  const maxProductQty = Math.max(...topProducts.map(p => p.qty), 1);

  // ── Attention conditions ─────────────────────────────────────────────────
  const alertSoundOff  = pendingCount > 0 && (!audioEnabled || muted);
  const alertClosed    = !isOpen;
  const hasAttention   = alertSoundOff || alertClosed;

  // ── Operational sentence ─────────────────────────────────────────────────
  const opSentence = getOpSentence(pendingCount, inKitchenCount, onTheWayCount, todayOrders.length);

  // ── Card base style ──────────────────────────────────────────────────────
  const card = { background: T.white, borderRadius: 14, border: `1px solid ${T.border}`, boxShadow: '0 1px 12px rgba(0,0,0,0.05)' };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="kv-dash">
      <style>{STYLES}</style>

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <div style={{
        background: GH, borderRadius: 18, overflow: 'hidden',
        position: 'relative', marginBottom: 12,
        boxShadow: '0 8px 32px rgba(6,17,24,0.45)',
      }}>
        {/* Ambient teal glow — top right */}
        <div style={{ position: 'absolute', top: -60, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.20) 0%, transparent 68%)', pointerEvents: 'none' }} />
        {/* Ambient glow — bottom left */}
        <div style={{ position: 'absolute', bottom: -30, left: 60, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(94,234,212,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ padding: '20px 22px 16px', position: 'relative' }}>
          {/* Top row: identity + controls */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>

            {/* Identity block */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Initials monogram */}
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: 'rgba(13,148,136,0.15)',
                border: '1.5px solid rgba(94,234,212,0.30)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 800, color: T.tealLight, fontFamily: FF,
                backdropFilter: 'blur(4px)',
              }}>
                {getInitials(restaurant?.name)}
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: T.tealLight, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>
                  KYVRA · PANEL DE PEDIDOS
                </p>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.15, margin: 0 }}>
                  {restaurant?.name || 'Mi restaurante'}
                </h1>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3, textTransform: 'capitalize' }}>
                  {todayLabel()}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {/* Open/close */}
              <button onClick={toggleOpen} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px 8px 10px', borderRadius: 50, cursor: 'pointer',
                border: isOpen ? '1px solid rgba(34,197,94,0.40)' : '1px solid rgba(255,255,255,0.14)',
                background: isOpen ? 'rgba(34,197,94,0.14)' : 'rgba(255,255,255,0.07)',
                transition: 'all 0.2s',
              }}>
                <span style={{
                  width: 30, height: 17, borderRadius: 20, position: 'relative', flexShrink: 0,
                  background: isOpen ? '#22C55E' : 'rgba(255,255,255,0.22)', transition: 'background 0.2s',
                }}>
                  <span style={{
                    position: 'absolute', top: 2.5, width: 12, height: 12,
                    borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
                    left: isOpen ? 15 : 2.5,
                  }} />
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: isOpen ? '#86EFAC' : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
                  {isOpen ? 'Abierto' : 'Cerrado'}
                </span>
              </button>

              {/* Sound */}
              <button onClick={audioEnabled ? toggleMute : enableAudio}
                title={!audioEnabled ? 'Activar alertas sonoras' : muted ? 'Activar sonido' : 'Silenciar'}
                style={{
                  width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
                  background: !audioEnabled ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.07)',
                  cursor: 'pointer', color: !audioEnabled ? '#FCD34D' : 'rgba(255,255,255,0.55)',
                }}>
                {muted || !audioEnabled ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>

              {/* Bell */}
              <button onClick={() => setNewCount(0)} style={{
                width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.07)', cursor: 'pointer',
                color: newCount > 0 ? T.tealLight : 'rgba(255,255,255,0.55)', position: 'relative',
              }}>
                <Bell size={16} />
                {newCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4,
                    minWidth: 17, height: 17, padding: '0 4px',
                    background: T.teal, color: '#fff', fontSize: 10, fontWeight: 700,
                    borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{newCount}</span>
                )}
              </button>
            </div>
          </div>

          {/* Bottom row: operational sentence + revenue */}
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingBottom: 2 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.60)', fontStyle: 'italic' }}>
              {opSentence}
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.40)' }}>Ventas hoy</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: T.tealLight, fontFamily: FF }}>
                ${todayRevenue.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ PRIORITY STRIP ════════════════════════════════════════════════ */}
      <div className="kv-priority" style={{ marginBottom: 14 }}>

        {/* PENDIENTES — dominant */}
        <motion.div
          animate={pendingCount > 0 ? { scale: [1, 1.005, 1] } : { scale: 1 }}
          transition={pendingCount > 0 ? { repeat: Infinity, duration: 2.4, ease: 'easeInOut' } : {}}
          style={{
            ...card,
            padding: '16px 18px',
            borderLeft: `4px solid ${pendingCount > 0 ? '#F59E0B' : T.border}`,
            background: pendingCount > 0 ? 'linear-gradient(135deg, #FFFBEB 0%, #fff 60%)' : T.white,
            animation: pendingCount > 0 ? 'kv-pulse-amber 2.4s ease-in-out infinite' : undefined,
            position: 'relative', overflow: 'hidden',
          }}>
          {pendingCount > 0 && (
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
          )}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: pendingCount > 0 ? '#92400E' : T.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pendientes
            </span>
            <ShoppingBag size={15} style={{ color: pendingCount > 0 ? '#D97706' : T.textMuted, flexShrink: 0 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, color: pendingCount > 0 ? '#D97706' : T.textMuted, fontFamily: FF }}>
              {pendingCount}
            </span>
            {pendingCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#B45309' }}>
                {pendingCount === 1 ? 'esperando' : 'esperando'}
              </span>
            )}
          </div>
          <p style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>
            {newOrders} hoy · activos ahora: {pendingCount}
          </p>
        </motion.div>

        {/* EN PREPARACIÓN */}
        <div style={{ ...card, padding: '16px 18px', borderLeft: `4px solid ${inKitchenCount > 0 ? '#3B82F6' : T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>En cocina</span>
            <ChefHat size={15} style={{ color: inKitchenCount > 0 ? '#2563EB' : T.textMuted }} />
          </div>
          <span style={{ fontSize: 36, fontWeight: 800, lineHeight: 1, color: inKitchenCount > 0 ? '#2563EB' : T.textMuted, fontFamily: FF }}>
            {inKitchenCount}
          </span>
          <p style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>
            {preparingOrders} hoy
          </p>
        </div>

        {/* EN CAMINO */}
        <div style={{ ...card, padding: '16px 18px', borderLeft: `4px solid ${onTheWayCount > 0 ? T.teal : T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>En camino</span>
            <Bike size={15} style={{ color: onTheWayCount > 0 ? T.teal : T.textMuted }} />
          </div>
          <span style={{ fontSize: 36, fontWeight: 800, lineHeight: 1, color: onTheWayCount > 0 ? T.teal : T.textMuted, fontFamily: FF }}>
            {onTheWayCount}
          </span>
          <p style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>
            {dispatchedOrders} entregados hoy
          </p>
        </div>
      </div>

      {/* ══ ATTENTION ALERTS ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {hasAttention && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>

            {alertClosed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '10px 14px' }}>
                <AlertTriangle size={15} style={{ color: '#DC2626', flexShrink: 0 }} />
                <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#991B1B' }}>
                  El local está <strong>cerrado</strong> en la app — los clientes no pueden ver el menú
                </p>
                <button onClick={toggleOpen}
                  style={{ flexShrink: 0, padding: '5px 12px', background: '#DC2626', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                  Abrir ahora
                </button>
              </div>
            )}

            {alertSoundOff && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '10px 14px' }}>
                <VolumeX size={15} style={{ color: '#D97706', flexShrink: 0 }} />
                <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#92400E' }}>
                  Alertas de sonido desactivadas — hay {pendingCount} pedido{pendingCount > 1 ? 's' : ''} pendiente{pendingCount > 1 ? 's' : ''}
                </p>
                <button onClick={audioEnabled ? toggleMute : enableAudio}
                  style={{ flexShrink: 0, padding: '5px 12px', background: '#D97706', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                  Activar sonido
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ MAIN SPLIT: ORDERS LEFT | INTEL RIGHT ════════════════════════ */}
      <div className="kv-split">

        {/* ── LEFT: ORDER COMMAND AREA ──────────────────────────────────── */}
        <div className="kv-orders-col">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: T.navy, margin: 0 }}>Centro de pedidos</h2>
            <span style={{ fontSize: 11, color: T.textMuted }}>
              {filtered.length} {filter === 'all' ? 'en total' : 'filtrados'}
            </span>
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {FILTERS.map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)} style={{
                padding: '5px 13px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                fontFamily: FF, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: filter === key ? T.navy : T.white,
                color: filter === key ? '#fff' : T.textSec,
                boxShadow: filter === key ? '0 2px 8px rgba(15,23,42,0.22)' : '0 1px 3px rgba(0,0,0,0.07)',
              }}>{label}</button>
            ))}
          </div>

          {/* Orders list */}
          {filtered.length === 0 ? (
            <div style={{ ...card, padding: '40px 20px', textAlign: 'center' }}>
              <Clock size={36} strokeWidth={1} style={{ color: T.textMuted, display: 'block', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, color: T.textMuted }}>Sin pedidos en esta categoría</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(order => {
                const cfg       = STATUS_CFG[order.order_status] || STATUS_CFG.pending;
                const hasAction = order.order_status === 'pending' || !!NEXT_STATUS[order.order_status];
                const mins      = elapsedMinutes(order.created_at, now);
                const isOverdue = order.order_status === 'pending' && mins >= 10;
                const itemsStr  = (order.items || []).map(i => `${i.qty}× ${i.name}`).join(', ');
                return (
                  <motion.div key={order.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.22 }}
                    style={{
                      ...card,
                      borderLeft: `4px solid ${isOverdue ? '#DC2626' : cfg.border}`,
                      padding: 0, overflow: 'hidden',
                    }}>

                    {/* Card header */}
                    <div style={{ padding: '11px 14px 8px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: T.teal, fontFamily: FF }}>
                            #{order.id.slice(0, 6).toUpperCase()}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{order.customer_name}</span>
                          <CustomerInfo phone={order.customer_phone} orderId={order.id} orderCreatedAt={order.created_at} allOrders={orders} />
                        </div>
                        <p style={{ fontSize: 12, color: T.textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}
                          title={itemsStr}>{itemsStr}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <StatusBadge status={order.order_status} />
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          color: isOverdue ? '#DC2626' : T.textMuted,
                          display: 'flex', alignItems: 'center', gap: 3,
                        }}>
                          <Timer size={10} />
                          {elapsedLabel(order.created_at, now)}
                          {isOverdue && ' · ¡Demorado!'}
                        </span>
                      </div>
                    </div>

                    {/* Card footer */}
                    <div style={{
                      padding: '7px 14px 11px',
                      background: hasAction ? 'rgba(248,250,252,0.7)' : 'transparent',
                      borderTop: `1px solid ${T.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                        {order.customer_address && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                            <MapPin size={11} style={{ color: T.textMuted, flexShrink: 0 }} />
                            {order.customer_address}
                          </span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.textSec, flexShrink: 0 }}>
                          <Wallet size={11} style={{ color: T.textMuted }} />
                          {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: T.navy }}>${order.total?.toLocaleString('es-AR')}</span>
                        {order.comprobante_url && (
                          <a href={order.comprobante_url} target="_blank" rel="noreferrer"
                            style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textDecoration: 'none' }}>
                            📎 Comprobante
                          </a>
                        )}
                        {hasAction && <OrderActions order={order} onUpdate={updateStatus} />}
                      </div>
                    </div>

                    {order.notes && (
                      <div style={{ padding: '5px 14px 9px' }}>
                        <p style={{ fontSize: 11, color: T.textSec, fontStyle: 'italic' }}>📝 {order.notes}</p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT: INTELLIGENCE PANEL ─────────────────────────────────── */}
        <div className="kv-sidebar">

          {/* Pipeline stage rail */}
          <div style={{ ...card, padding: '16px 18px' }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
              Flujo actual
            </h3>
            {[
              { label: 'Pendientes',   count: pendingCount,   color: '#F59E0B', active: pendingCount > 0   },
              { label: 'En cocina',    count: inKitchenCount, color: '#3B82F6', active: inKitchenCount > 0 },
              { label: 'En camino',    count: onTheWayCount,  color: T.teal,    active: onTheWayCount > 0  },
              { label: 'Entregados hoy', count: deliveredToday, color: '#22C55E', active: deliveredToday > 0 },
            ].map((stage, i, arr) => (
              <div key={stage.label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
                  {/* dot */}
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: stage.active ? stage.color : T.border,
                    boxShadow: stage.active ? `0 0 0 3px ${stage.color}26` : 'none',
                    animation: stage.active && i === 0 ? 'kv-pulse-dot 1.8s ease-in-out infinite' : 'none',
                  }} />
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: stage.active ? T.navy : T.textMuted }}>
                    {stage.label}
                  </span>
                  <span style={{
                    fontSize: 16, fontWeight: 800, fontFamily: FF,
                    color: stage.active ? stage.color : T.textMuted,
                  }}>
                    {stage.count}
                  </span>
                </div>
                {/* connector line */}
                {i < arr.length - 1 && (
                  <div style={{ marginLeft: 4.5, width: 1, height: 12, background: T.border, marginBottom: 0 }} />
                )}
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ ...card, padding: '16px 18px' }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
              Acciones rápidas
            </h3>
            {[
              { label: 'Gestionar menú',    icon: UtensilsCrossed, path: '/restaurant/panel/menu'      },
              { label: 'Mi restaurante',    icon: Store,           path: '/restaurant/panel/perfil'    },
              { label: 'Ver ganancias',     icon: TrendingUp,      path: '/restaurant/panel/ganancias' },
            ].map(({ label, icon: Icon, path }) => (
              <button key={path} onClick={() => navigate(path)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 0', background: 'transparent', border: 'none',
                borderBottom: `1px solid ${T.border}`, cursor: 'pointer',
                fontFamily: FF, textAlign: 'left',
              }}>
                <Icon size={15} style={{ color: T.teal, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: T.navy }}>{label}</span>
                <ArrowRight size={13} style={{ color: T.textMuted }} />
              </button>
            ))}
            {/* last item without bottom border */}
            <button onClick={toggleOpen} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 0', background: 'transparent', border: 'none',
              cursor: 'pointer', fontFamily: FF, textAlign: 'left',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: isOpen ? '#22C55E' : '#94A3B8', flexShrink: 0, boxShadow: isOpen ? '0 0 0 3px rgba(34,197,94,0.20)' : 'none' }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: T.navy }}>
                {isOpen ? 'Cerrar el local' : 'Abrir el local'}
              </span>
              <ArrowRight size={13} style={{ color: T.textMuted }} />
            </button>
          </div>

          {/* Top products — only when real data exists */}
          {topProducts.length > 0 && (
            <div style={{ ...card, padding: '16px 18px' }}>
              <h3 style={{ fontSize: 12, fontWeight: 800, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Star size={12} style={{ color: T.teal }} />
                Más pedidos
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topProducts.map((p, i) => (
                  <div key={p.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {i === 0 && <span style={{ fontSize: 10, marginRight: 4 }}>★</span>}
                        {p.name}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, flexShrink: 0 }}>{p.qty}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 10, background: T.tealBg, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 10, transition: 'width 0.5s ease',
                        width: `${(p.qty / maxProductQty) * 100}%`,
                        background: i === 0 ? GTEAL : `linear-gradient(90deg, ${T.tealDark}, ${T.teal})`,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Peak hours — only when meaningful sample exists */}
          {showPeakHours && (
            <div style={{ ...card, padding: '16px 18px' }}>
              <h3 style={{ fontSize: 12, fontWeight: 800, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BarChart3 size={12} style={{ color: T.teal }} />
                Horas pico
              </h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80, overflowX: 'auto', paddingBottom: 2 }}>
                {peakHours.map(({ hour, count }) => (
                  <div key={hour} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, height: '100%', justifyContent: 'flex-end', flexShrink: 0, width: 20 }}>
                    <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden', borderRadius: '3px 3px 0 0', background: T.tealBg }}>
                      <div style={{
                        width: '100%', background: GTEAL, transition: 'height 0.5s ease',
                        height: `${(count / maxHourCount) * 100}%`, minHeight: count > 0 ? 3 : 0,
                        borderRadius: '3px 3px 0 0',
                      }} />
                    </div>
                    <span style={{ fontSize: 8, color: T.textMuted }}>{hour}h</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>{/* end kv-sidebar */}
      </div>{/* end kv-split */}
    </div>
  );
}
