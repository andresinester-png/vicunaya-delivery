import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle, XCircle, Clock, ChefHat, Bike, PackageCheck, Bell,
  DollarSign, ShoppingBag, BarChart3, Star, MapPin, Wallet, Timer,
  Volume2, VolumeX, TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase.js';
import { useRestaurant } from '../../contexts/RestaurantContext.js';
import { subscribeToPush } from '../../lib/pushNotifications.js';
import { usePendingOrdersAlert } from '../../hooks/usePendingOrdersAlert.js';
import { playConfirmation } from '../../lib/sounds.js';

// ── Design tokens ───────────────────────────────────────────────────────────
const FF   = "'Plus Jakarta Sans', sans-serif";
const T    = {
  teal:     '#0D9488',
  tealDark: '#0F766E',
  tealSec:  '#14B8A6',
  tealLight:'#5EEAD4',
  tealBg:   'rgba(13,148,136,0.10)',
  navy:     '#0F172A',
  bg:       '#F8FAFC',
  white:    '#FFFFFF',
  textSec:  '#64748B',
  textMuted:'#94A3B8',
  border:   '#E2E8F0',
};
const GRAD_HEADER = 'linear-gradient(160deg, #061118 0%, #0A1E2A 28%, #0D3A35 55%, #0F172A 100%)';
const GRAD_TEAL   = 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)';

// ── Helpers ─────────────────────────────────────────────────────────────────
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

  const waUrl      = buildWhatsAppUrl(phone);
  const prevOrders = allOrders
    .filter(o => o.customer_phone === phone && o.id !== orderId && new Date(o.created_at) < new Date(orderCreatedAt))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const isNew = prevOrders.length === 0;
  const last3 = prevOrders.slice(0, 3);

  return (
    <div style={{ fontFamily: FF }}>
      {waUrl && (
        <a href={waUrl} target="_blank" rel="noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#16A34A', fontWeight: 600, textDecoration: 'none' }}>
          <WhatsAppIcon size={11} />
          {phone}
        </a>
      )}
      <div style={{ marginTop: 2 }}>
        {isNew ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#FEF3C7', color: '#92400E' }}>
            ✦ Cliente nuevo
          </span>
        ) : (
          <button
            onClick={() => setShowHistory(v => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#DCFCE7', color: '#15803D', border: 'none', cursor: 'pointer' }}>
            ✓ {prevOrders.length} pedido{prevOrders.length !== 1 ? 's' : ''} previo{prevOrders.length !== 1 ? 's' : ''}
          </button>
        )}
      </div>
      {showHistory && last3.length > 0 && (
        <div style={{ marginTop: 6, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 10px', background: T.bg, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Últimos pedidos</p>
          {last3.map(o => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10 }}>
              <span style={{ color: T.textSec }}>{new Date(o.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</span>
              <span style={{ fontWeight: 700, color: T.navy }}>${o.total?.toLocaleString('es-AR')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending:   { label: 'Pendiente',  dot: '#F59E0B', bg: '#FEF3C7', text: '#92400E' },
  accepted:  { label: 'Aceptado',   dot: '#38BDF8', bg: '#E0F2FE', text: '#0369A1' },
  preparing: { label: 'Preparando', dot: '#3B82F6', bg: '#DBEAFE', text: '#1D4ED8' },
  ready:     { label: 'En camino',  dot: T.teal,    bg: '#F0FDFA', text: T.tealDark },
  delivered: { label: 'Entregado',  dot: '#22C55E', bg: '#DCFCE7', text: '#15803D' },
  rejected:  { label: 'Rechazado',  dot: '#F87171', bg: '#FEE2E2', text: '#B91C1C' },
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
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: c.bg, color: c.text, whiteSpace: 'nowrap', fontFamily: FF }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

function elapsedLabel(createdAt, now) {
  const diffMin = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60000));
  if (diffMin < 1)  return 'Recién';
  if (diffMin < 60) return `${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return `${h}h ${m}min`;
}

function OrderActions({ order, onUpdate, fullWidth }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 16px', borderRadius: 12, fontWeight: 700,
    fontSize: 13, fontFamily: FF, cursor: 'pointer', border: 'none',
    whiteSpace: 'nowrap', transition: 'opacity 0.15s',
  };
  const full = fullWidth ? { width: '100%', justifyContent: 'center' } : {};

  if (order.order_status === 'pending') {
    return (
      <div style={{ display: 'flex', gap: 8, ...(fullWidth ? { width: '100%' } : {}) }}>
        <button onClick={() => onUpdate(order.id, 'accepted')}
          style={{ ...base, ...full, background: '#16A34A', color: '#fff', boxShadow: '0 4px 14px rgba(22,163,74,0.35)' }}>
          <CheckCircle size={15} /> Aceptar
        </button>
        <button onClick={() => onUpdate(order.id, 'rejected')}
          style={{ ...base, ...full, background: 'transparent', color: '#DC2626', border: '2px solid #FECACA' }}>
          <XCircle size={15} /> Rechazar
        </button>
      </div>
    );
  }
  if (order.order_status === 'accepted') {
    return (
      <button onClick={() => onUpdate(order.id, 'preparing')}
        style={{ ...base, ...full, background: '#2563EB', color: '#fff', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}>
        <ChefHat size={15} /> Empezar a preparar
      </button>
    );
  }
  if (order.order_status === 'preparing') {
    return (
      <button onClick={() => onUpdate(order.id, 'ready')}
        style={{ ...base, ...full, background: GRAD_TEAL, color: '#fff', boxShadow: '0 4px 14px rgba(13,148,136,0.35)' }}>
        <PackageCheck size={15} /> Marcar como listo
      </button>
    );
  }
  if (order.order_status === 'ready') {
    return (
      <button onClick={() => onUpdate(order.id, 'delivered')}
        style={{ ...base, ...full, background: '#16A34A', color: '#fff', boxShadow: '0 4px 14px rgba(22,163,74,0.35)' }}>
        <Bike size={15} /> Marcar en camino
      </button>
    );
  }
  return null;
}

// ── Card wrapper style ───────────────────────────────────────────────────────
const card = {
  background: '#fff',
  borderRadius: 16,
  border: `1px solid ${T.border}`,
  boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
};

// ── Main component ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const restaurant = useRestaurant();
  const [orders,   setOrders]   = useState([]);
  const [filter,   setFilter]   = useState('pending');
  const [newCount, setNewCount] = useState(0);
  const [isOpen,   setIsOpen]   = useState(true);
  const [now,      setNow]      = useState(() => Date.now());

  useEffect(() => {
    if (restaurant) setIsOpen(restaurant.is_active ?? true);
  }, [restaurant]);

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
        .from('orders')
        .select('*')
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
                body:     `${order.customer_name} · ${order.items?.length ?? 0} productos · $${(order.total ?? 0).toLocaleString('es-AR')}`,
                tag:      'new-order',
                renotify: true,
                data:     { url: '/restaurant/panel/pedidos' },
              });
            });
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurant.id}` },
        ({ new: order }) => setOrders(prev => prev.map(o => o.id === order.id ? order : o))
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [restaurant]);

  const updateStatus = async (orderId, status) => {
    const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId);
    if (error) { toast.error('Error al actualizar'); return; }
    if (status === 'accepted') playConfirmation();
    toast.success('Estado actualizado');
    fetch('/api/notify-client', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ orderId, newStatus: status }),
    }).catch(() => {});
  };

  const toggleOpen = async () => {
    const next = !isOpen;
    setIsOpen(next);
    const { error } = await supabase.from('restaurants').update({ is_active: next }).eq('id', restaurant.id);
    if (error) { setIsOpen(!next); toast.error('Error al actualizar estado'); return; }
    toast.success(next ? 'Local abierto' : 'Local cerrado');
  };

  // ── Computed metrics (real data only) ────────────────────────────────────
  const todayOrders      = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
  const todayRevenue     = todayOrders.filter(o => o.order_status === 'delivered').reduce((s, o) => s + o.total, 0);
  const newOrders        = todayOrders.filter(o => o.order_status === 'pending').length;
  const preparingOrders  = todayOrders.filter(o => ['accepted', 'preparing'].includes(o.order_status)).length;
  const dispatchedOrders = todayOrders.filter(o => ['ready', 'delivered'].includes(o.order_status)).length;
  const pendingCount     = orders.filter(o => o.order_status === 'pending').length;
  const inKitchenCount   = orders.filter(o => ['accepted', 'preparing'].includes(o.order_status)).length;
  const onTheWayCount    = orders.filter(o => o.order_status === 'ready').length;

  const { audioEnabled, muted, enableAudio, toggleMute } = usePendingOrdersAlert(pendingCount);

  const STATUS_PRIORITY = { pending: 0, accepted: 1, preparing: 2, ready: 3, delivered: 4, rejected: 5 };
  const filtered = orders
    .filter(o => filter === 'all' ? true : o.order_status === filter)
    .sort((a, b) => {
      if (filter !== 'all') return new Date(b.created_at) - new Date(a.created_at);
      const pd = (STATUS_PRIORITY[a.order_status] ?? 9) - (STATUS_PRIORITY[b.order_status] ?? 9);
      if (pd !== 0) return pd;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  // ── Peak hours ───────────────────────────────────────────────────────────
  const hourCounts = Array.from({ length: 24 }, () => 0);
  orders.forEach(o => { hourCounts[new Date(o.created_at).getHours()]++; });
  let firstHour = hourCounts.findIndex(c => c > 0);
  let lastHour  = hourCounts.length - 1 - [...hourCounts].reverse().findIndex(c => c > 0);
  if (firstHour === -1) { firstHour = 8; lastHour = 22; }
  const peakHours     = [];
  for (let h = firstHour; h <= lastHour; h++) peakHours.push({ hour: h, count: hourCounts[h] });
  const maxHourCount  = Math.max(...peakHours.map(p => p.count), 1);

  // ── Top products ─────────────────────────────────────────────────────────
  const productCounts = {};
  orders.filter(o => o.order_status !== 'rejected').forEach(o => (o.items || []).forEach(item => {
    productCounts[item.name] = (productCounts[item.name] || 0) + (item.qty || 0);
  }));
  const topProducts   = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => ({ name, qty }));
  const maxProductQty = Math.max(...topProducts.map(p => p.qty), 1);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: FF, color: T.navy }}>

      {/* ── Premium header card ── */}
      <div style={{ ...card, background: GRAD_HEADER, marginBottom: 20, overflow: 'hidden', position: 'relative' }}>
        {/* ambient teal glow */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', position: 'relative' }}>
          {/* Left: eyebrow + title */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: T.tealLight, textTransform: 'uppercase', marginBottom: 4 }}>
              PANEL DE PEDIDOS · KYVRA
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              {restaurant?.name || 'Mi restaurante'}
            </h1>
          </div>

          {/* Right: controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Open/close toggle */}
            <button
              onClick={toggleOpen}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 14px 7px 8px',
                borderRadius: 50,
                border: isOpen ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(255,255,255,0.12)',
                background: isOpen ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                cursor: 'pointer',
              }}>
              <span style={{
                width: 28, height: 16, borderRadius: 20, position: 'relative',
                background: isOpen ? '#22C55E' : 'rgba(255,255,255,0.2)',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}>
                <span style={{
                  position: 'absolute', top: 2, width: 12, height: 12,
                  borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s',
                  left: isOpen ? 14 : 2,
                }} />
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: isOpen ? '#86EFAC' : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
                {isOpen ? 'Visible en la app' : 'No visible'}
              </span>
            </button>

            {/* Audio button */}
            <button
              onClick={audioEnabled ? toggleMute : enableAudio}
              title={!audioEnabled ? 'Activar alertas sonoras' : muted ? 'Activar sonido' : 'Silenciar alertas'}
              style={{
                width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)',
                background: !audioEnabled ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)',
                cursor: 'pointer', color: !audioEnabled ? '#FCD34D' : 'rgba(255,255,255,0.6)',
              }}>
              {muted || !audioEnabled ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>

            {/* Notification bell */}
            <button
              onClick={() => setNewCount(0)}
              style={{
                width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)',
                cursor: 'pointer', color: 'rgba(255,255,255,0.6)',
                position: 'relative',
              }}>
              <Bell size={17} />
              {newCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  minWidth: 18, height: 18, padding: '0 4px',
                  background: T.teal, color: '#fff', fontSize: 10, fontWeight: 700,
                  borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {newCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Live status strip */}
        <div style={{ padding: '10px 20px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', padding: '4px 12px', borderRadius: 20 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 6px #F59E0B' }} />
            {pendingCount} pendientes
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', padding: '4px 12px', borderRadius: 20 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3B82F6' }} />
            {inKitchenCount} en preparación
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', padding: '4px 12px', borderRadius: 20 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.tealLight }} />
            {onTheWayCount} en camino
          </span>
        </div>
      </div>

      {/* ── Audio activation banner ── */}
      {!audioEnabled && (
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14, padding: '12px 16px' }}>
          <Volume2 size={16} style={{ color: '#D97706', flexShrink: 0 }} />
          <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#92400E' }}>
            Activá el sonido para recibir alertas cuando entren pedidos nuevos
          </p>
          <button
            onClick={enableAudio}
            style={{ flexShrink: 0, padding: '6px 14px', background: '#D97706', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 10, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Activar sonido
          </button>
        </div>
      )}

      {/* ── Metric cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
        {/* Pedidos nuevos */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          style={{ ...card, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.textSec }}>Pedidos nuevos</span>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={15} style={{ color: '#D97706' }} />
            </div>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: T.navy, lineHeight: 1 }}>{newOrders}</p>
          <p style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>hoy</p>
        </motion.div>

        {/* En preparación */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
          style={{ ...card, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.textSec }}>En preparación</span>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChefHat size={15} style={{ color: '#2563EB' }} />
            </div>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: T.navy, lineHeight: 1 }}>{preparingOrders}</p>
          <p style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>hoy</p>
        </motion.div>

        {/* Despachados */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
          style={{ ...card, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.textSec }}>Despachados</span>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bike size={15} style={{ color: '#16A34A' }} />
            </div>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: T.navy, lineHeight: 1 }}>{dispatchedOrders}</p>
          <p style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>hoy</p>
        </motion.div>

        {/* Ventas del día — teal gradient */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}
          style={{ ...card, padding: 16, background: GRAD_TEAL, boxShadow: '0 8px 24px rgba(13,148,136,0.30)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Ventas del día</span>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={15} style={{ color: '#fff' }} />
            </div>
          </div>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1 }}>${todayRevenue.toLocaleString('es-AR')}</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>pedidos entregados</p>
        </motion.div>
      </div>

      {/* ── Live orders section ── */}
      <div style={{ marginBottom: 20 }}>
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: T.navy }}>Pedidos en vivo</h2>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {FILTERS.map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                fontFamily: FF, cursor: 'pointer', transition: 'all 0.15s', border: 'none',
                background: filter === key ? T.navy : '#fff',
                color: filter === key ? '#fff' : T.textSec,
                boxShadow: filter === key ? '0 2px 8px rgba(15,23,42,0.25)' : '0 1px 4px rgba(0,0,0,0.06)',
              }}>
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ ...card, padding: '48px 20px', textAlign: 'center', color: T.textMuted }}>
            <Clock size={40} strokeWidth={1} style={{ margin: '0 auto 12px', display: 'block', color: T.textMuted }} />
            <p style={{ fontSize: 14 }}>No hay pedidos en esta categoría</p>
          </div>
        ) : (
          <>
            {/* ── Desktop table ── */}
            <div style={{ ...card, display: 'none' }} className="lg-table-wrapper">
              <style>{`.lg-table-wrapper { display: none; } @media (min-width: 1024px) { .lg-table-wrapper { display: block !important; } .mobile-cards { display: none !important; } }`}</style>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000, fontFamily: FF }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}`, background: '#FAFAFA' }}>
                      {['Pedido', 'Productos', 'Entrega', 'Pago', 'Tiempo', 'Estado', 'Acciones'].map(h => (
                        <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(order => {
                      const itemsLabel = (order.items || []).map(i => `${i.qty}x ${i.name}`).join(', ');
                      const hasAction  = order.order_status === 'pending' || !!NEXT_STATUS[order.order_status];
                      return (
                        <tr key={order.id} style={{ borderBottom: `1px solid ${T.border}`, verticalAlign: 'top' }}>
                          <td style={{ padding: '14px 20px' }}>
                            <p style={{ fontWeight: 800, fontSize: 13, color: T.teal }}>#{order.id.slice(0, 6).toUpperCase()}</p>
                            <p style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{order.customer_name}</p>
                            <CustomerInfo phone={order.customer_phone} orderId={order.id} orderCreatedAt={order.created_at} allOrders={orders} />
                            <p style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginTop: 4 }}>${order.total?.toLocaleString('es-AR')}</p>
                          </td>
                          <td style={{ padding: '14px 20px', color: T.textSec, maxWidth: 220 }}>
                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }} title={itemsLabel}>{itemsLabel}</span>
                          </td>
                          <td style={{ padding: '14px 20px', color: T.textSec }}>
                            <span style={{ display: 'flex', alignItems: 'flex-start', gap: 5, maxWidth: 180, fontSize: 12 }}>
                              <MapPin size={12} style={{ color: T.textMuted, flexShrink: 0, marginTop: 1 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.customer_address}>{order.customer_address}</span>
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px', color: T.textSec, whiteSpace: 'nowrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                              <Wallet size={12} style={{ color: T.textMuted }} />
                              {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px', color: T.textSec, whiteSpace: 'nowrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                              <Timer size={12} style={{ color: T.textMuted }} />
                              {elapsedLabel(order.created_at, now)}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <StatusBadge status={order.order_status} />
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            {hasAction
                              ? <OrderActions order={order} onUpdate={updateStatus} />
                              : <span style={{ fontSize: 12, color: T.textMuted }}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Mobile cards ── */}
            <div className="mobile-cards" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(order => {
                const hasAction = order.order_status === 'pending' || !!NEXT_STATUS[order.order_status];
                const isPending = order.order_status === 'pending';
                return (
                  <div key={order.id} style={{
                    ...card,
                    padding: 14,
                    borderLeft: isPending ? `4px solid ${T.teal}` : `1px solid ${T.border}`,
                  }}>
                    {/* Top row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 16, color: T.teal }}>#{order.id.slice(0, 6).toUpperCase()}</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginTop: 1 }}>{order.customer_name}</p>
                        <CustomerInfo phone={order.customer_phone} orderId={order.id} orderCreatedAt={order.created_at} allOrders={orders} />
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <StatusBadge status={order.order_status} />
                        <p style={{ fontSize: 11, color: T.textMuted, marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                          <Timer size={11} /> {elapsedLabel(order.created_at, now)}
                        </p>
                      </div>
                    </div>

                    {/* Items list */}
                    <div style={{ background: T.bg, borderRadius: 10, padding: '10px 12px', marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {(order.items || []).map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span style={{ color: T.textSec }}>{item.qty}x {item.name}{item.extras > 0 ? ` + ${item.extras} extra` : ''}</span>
                          <span style={{ fontWeight: 600, color: T.navy }}>${((item.price * item.qty) + (item.extras || 0) * (item.extra_price || 0)).toLocaleString('es-AR')}</span>
                        </div>
                      ))}
                      {order.notes && <p style={{ fontSize: 11, color: T.textSec, marginTop: 4, fontStyle: 'italic' }}>📝 {order.notes}</p>}
                      {order.comprobante_url && (
                        <a href={order.comprobante_url} target="_blank" rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 4, padding: '5px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, color: '#fff', background: '#2563EB', textDecoration: 'none' }}>
                          📎 Ver comprobante
                        </a>
                      )}
                    </div>

                    {/* Footer row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: hasAction ? 10 : 0 }}>
                      <span style={{ display: 'flex', alignItems: 'flex-start', gap: 5, fontSize: 11, color: T.textSec, minWidth: 0, flex: 1 }}>
                        <MapPin size={12} style={{ color: T.textMuted, flexShrink: 0, marginTop: 1 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.customer_address}</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.textSec, flexShrink: 0 }}>
                        <Wallet size={12} style={{ color: T.textMuted }} />
                        {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <p style={{ fontSize: 18, fontWeight: 800, color: T.navy }}>${order.total?.toLocaleString('es-AR')}</p>
                    </div>

                    {hasAction && (
                      <div style={{ marginTop: 10 }}>
                        <OrderActions order={order} onUpdate={updateStatus} fullWidth />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Charts: peak hours + top products ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }} className="charts-grid">
        <style>{`@media (min-width: 1024px) { .charts-grid { grid-template-columns: 1fr 1fr !important; } }`}</style>

        {/* Peak hours */}
        <div style={{ ...card, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart3 size={15} style={{ color: T.teal }} />
            Horas pico
          </h2>
          {orders.length === 0 ? (
            <p style={{ fontSize: 13, color: T.textMuted, textAlign: 'center', padding: '32px 0' }}>Sin datos suficientes</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 120, overflowX: 'auto', paddingBottom: 4 }}>
              {peakHours.map(({ hour, count }) => (
                <div key={hour} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end', flexShrink: 0, width: 22 }}>
                  <span style={{ fontSize: 9, color: T.textMuted }}>{count > 0 ? count : ''}</span>
                  <div style={{ width: '100%', flex: 1, borderRadius: '4px 4px 0 0', background: T.tealBg, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
                    <div style={{
                      background: GRAD_TEAL,
                      width: '100%',
                      height: `${(count / maxHourCount) * 100}%`,
                      minHeight: count > 0 ? 4 : 0,
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.5s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: 9, color: T.textMuted }}>{hour}h</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top products */}
        <div style={{ ...card, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Star size={15} style={{ color: T.teal }} />
            Productos más vendidos
          </h2>
          {topProducts.length === 0 ? (
            <p style={{ fontSize: 13, color: T.textMuted, textAlign: 'center', padding: '32px 0' }}>Sin datos suficientes</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topProducts.map((p, i) => (
                <div key={p.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5, gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, flexShrink: 0 }}>{p.qty}</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 10, background: T.tealBg, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(p.qty / maxProductQty) * 100}%`,
                      background: i === 0 ? GRAD_TEAL : `linear-gradient(90deg, ${T.tealDark}, ${T.teal})`,
                      borderRadius: 10,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
