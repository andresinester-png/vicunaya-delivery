import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, XCircle, Clock, ChefHat, Bike, PackageCheck, Bell,
  ShoppingBag, MapPin, Wallet, Timer, Volume2, VolumeX,
  AlertTriangle, ArrowRight, UtensilsCrossed, Store, TrendingUp,
  Star, BarChart3, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase.js';
import { useRestaurant } from '../../contexts/RestaurantContext.js';
import { subscribeToPush } from '../../lib/pushNotifications.js';
import { usePendingOrdersAlert } from '../../hooks/usePendingOrdersAlert.js';
import { playConfirmation } from '../../lib/sounds.js';

// ── Design tokens ────────────────────────────────────────────────────────────
const FF    = "'Plus Jakarta Sans', sans-serif";
const T     = {
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
const GH    = 'linear-gradient(160deg, #061118 0%, #0A1E2A 28%, #0D3A35 55%, #0F172A 100%)';
const GTEAL = 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)';

// ── Responsive styles ────────────────────────────────────────────────────────
const STYLES = `
  .kv-dash { font-family: ${FF}; color: ${T.navy}; }
  .kv-priority { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .kv-split { display: flex; flex-direction: column; gap: 16px; }
  .kv-sidebar { display: flex; flex-direction: column; gap: 14px; }
  .kv-desk-only { display: none !important; }
  .kv-mob-only { display: flex; }
  .kv-mob-filter { display: flex; gap: 7px; overflow-x: auto; padding-bottom: 16px; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
  .kv-mob-filter::-webkit-scrollbar { display: none; }
  .kv-mob-group-title { display: flex; align-items: center; gap: 7px; padding-bottom: 10px; border-bottom: 1.5px solid #E2E8F0; margin-bottom: 12px; }
  .kv-section-nav { display: none !important; }
  @media (min-width: 1024px) {
    .kv-section-nav { display: flex !important; gap: 0; background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; margin-bottom: 14px; box-shadow: 0 1px 6px rgba(0,0,0,0.05); position: sticky; top: 0; z-index: 10; }
    .kv-priority { grid-template-columns: 2fr 1fr 1fr; }
    .kv-split { flex-direction: row; align-items: flex-start; gap: 20px; }
    .kv-orders-col { flex: 1; min-width: 0; }
    .kv-sidebar { width: 340px; flex-shrink: 0; }
    .kv-desk-only { display: flex !important; }
    .kv-mob-only { display: none !important; }
    .kv-mob-filter { display: none !important; }
    .kv-mob-group-title { display: none !important; }
  }
  @keyframes kv-pulse-amber {
    0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.55); }
    50%       { box-shadow: 0 0 0 8px rgba(245,158,11,0); }
  }
  @keyframes kv-pulse-dot {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.35; }
  }
  @keyframes kv-slide-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .kv-wcard { animation: kv-slide-in 0.18s ease-out; }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name) {
  if (!name) return 'R';
  return name.trim()[0].toUpperCase();
}

function getOpSentence(pending, kitchen, road, todayTotal) {
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
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
      {waUrl && (
        <a href={waUrl} target="_blank" rel="noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#16A34A', fontWeight: 600, textDecoration: 'none' }}>
          <WhatsAppIcon size={10} />{phone}
        </a>
      )}
      <span>
        {isNew
          ? <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: '#FEF3C7', color: '#92400E' }}>✦ nuevo</span>
          : <button onClick={() => setShowHistory(v => !v)}
              style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: '#DCFCE7', color: '#15803D', border: 'none', cursor: 'pointer', fontFamily: FF }}>
              ✓ {prevOrders.length} previo{prevOrders.length !== 1 ? 's' : ''}
            </button>
        }
      </span>
      {showHistory && last3.length > 0 && (
        <span style={{ display: 'block', marginTop: 3, border: `1px solid ${T.border}`, borderRadius: 8, padding: '5px 8px', background: T.bg, minWidth: 140 }}>
          <span style={{ display: 'block', fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Últimos pedidos</span>
          {last3.map(o => (
            <span key={o.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
              <span style={{ color: T.textSec }}>{new Date(o.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</span>
              <span style={{ fontWeight: 700, color: T.navy }}>${o.total?.toLocaleString('es-AR')}</span>
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

// ── Status config ─────────────────────────────────────────────────────────────
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

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: c.bg, color: c.text, whiteSpace: 'nowrap', fontFamily: FF }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
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

// ── Order action buttons (preserve existing functions exactly) ────────────────
function OrderActions({ order, onUpdate, compact }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
    borderRadius: 9, fontWeight: 700, fontSize: compact ? 12 : 13,
    fontFamily: FF, cursor: 'pointer', border: 'none',
    whiteSpace: 'nowrap', transition: 'opacity 0.15s',
    padding: compact ? '7px 14px' : '9px 18px',
  };
  if (order.order_status === 'pending') return (
    <div style={{ display: 'flex', gap: 7, width: '100%' }}>
      <button onClick={() => onUpdate(order.id, 'accepted')}
        style={{ ...base, flex: 1, background: '#16A34A', color: '#fff', boxShadow: '0 3px 10px rgba(22,163,74,0.30)' }}>
        <CheckCircle size={compact ? 13 : 14} /> Aceptar
      </button>
      <button onClick={() => onUpdate(order.id, 'rejected')}
        style={{ ...base, background: 'transparent', color: '#DC2626', border: '1.5px solid #FECACA', padding: compact ? '5px 12px' : '8px 14px' }}>
        <XCircle size={compact ? 13 : 14} />
        <span className="kv-desk-only" style={{ display: 'inline' }}>Rechazar</span>
      </button>
    </div>
  );
  if (order.order_status === 'accepted') return (
    <button onClick={() => onUpdate(order.id, 'preparing')}
      style={{ ...base, background: '#2563EB', color: '#fff', boxShadow: '0 3px 10px rgba(37,99,235,0.28)', width: '100%' }}>
      <ChefHat size={compact ? 13 : 14} /> Empezar a preparar
    </button>
  );
  if (order.order_status === 'preparing') return (
    <button onClick={() => onUpdate(order.id, 'ready')}
      style={{ ...base, background: GTEAL, color: '#fff', boxShadow: '0 3px 10px rgba(13,148,136,0.28)', width: '100%' }}>
      <PackageCheck size={compact ? 13 : 14} /> Marcar como listo
    </button>
  );
  if (order.order_status === 'ready') return (
    <button onClick={() => onUpdate(order.id, 'delivered')}
      style={{ ...base, background: '#16A34A', color: '#fff', boxShadow: '0 3px 10px rgba(22,163,74,0.28)', width: '100%' }}>
      <Bike size={compact ? 13 : 14} /> Marcar en camino
    </button>
  );
  return null;
}

// ── Compact workflow card ─────────────────────────────────────────────────────
function WorkflowCard({ order, onUpdate, allOrders, now }) {
  const cfg      = STATUS_CFG[order.order_status] || STATUS_CFG.pending;
  const hasAction= order.order_status === 'pending' || !!NEXT_STATUS[order.order_status];
  const isPending= order.order_status === 'pending';
  const mins     = elapsedMinutes(order.created_at, now);
  const isOverdue= isPending && mins >= 10;
  const itemsStr = (order.items || []).map(i => `${i.qty}× ${i.name}`).join(', ');

  return (
    <div className="kv-wcard" style={{
      background: T.white,
      borderRadius: 12,
      border: `1px solid ${isOverdue ? '#FECACA' : T.border}`,
      borderLeft: `3px solid ${isOverdue ? '#DC2626' : cfg.border}`,
      boxShadow: isPending
        ? '0 2px 12px rgba(245,158,11,0.10)'
        : '0 1px 6px rgba(0,0,0,0.04)',
      overflow: 'hidden',
    }}>

      {/* Row 1: ID · Name · Badge · Timer */}
      <div style={{
        padding: '9px 12px 4px',
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: T.teal, fontFamily: FF, flexShrink: 0 }}>
          #{order.id.slice(0, 6).toUpperCase()}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.navy, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 60 }}>
          {order.customer_name}
        </span>
        <CustomerInfo
          phone={order.customer_phone}
          orderId={order.id}
          orderCreatedAt={order.created_at}
          allOrders={allOrders}
        />
        <span style={{
          fontSize: 11, fontWeight: isOverdue ? 700 : 400, flexShrink: 0,
          color: isOverdue ? '#DC2626' : T.textMuted,
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          <Timer size={10} />
          {elapsedLabel(order.created_at, now)}
          {isOverdue && ' ⚠'}
        </span>
      </div>

      {/* Row 2: Items · Payment · Total */}
      <div style={{ padding: '2px 12px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, fontSize: 12, color: T.textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}
          title={itemsStr}>{itemsStr}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: T.textSec, flexShrink: 0 }}>
          <Wallet size={10} style={{ color: T.textMuted }} />
          {PAYMENT_LABELS[order.payment_method] || order.payment_method}
        </span>
        <span style={{ fontSize: 14, fontWeight: 800, color: T.navy, fontFamily: FF, flexShrink: 0 }}>
          ${order.total?.toLocaleString('es-AR')}
        </span>
      </div>

      {/* Row 3: Address (small, when present) */}
      {order.customer_address && (
        <div style={{ padding: '0 12px 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <MapPin size={10} style={{ color: T.textMuted, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {order.customer_address}
          </span>
          {order.comprobante_url && (
            <a href={order.comprobante_url} target="_blank" rel="noreferrer"
              style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: '#2563EB', textDecoration: 'none', flexShrink: 0 }}>
              📎
            </a>
          )}
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div style={{ padding: '0 12px 5px' }}>
          <p style={{ fontSize: 11, color: T.textSec, fontStyle: 'italic', margin: 0 }}>📝 {order.notes}</p>
        </div>
      )}

      {/* Action footer */}
      {hasAction && (
        <div style={{
          padding: '7px 12px 9px',
          borderTop: `1px solid ${isPending ? 'rgba(245,158,11,0.18)' : T.border}`,
          background: isPending ? 'rgba(254,243,199,0.35)' : 'rgba(248,250,252,0.6)',
        }}>
          <OrderActions order={order} onUpdate={onUpdate} compact={false} />
        </div>
      )}
    </div>
  );
}

// ── Workflow section header + card list ───────────────────────────────────────
function WorkflowSection({ label, color, count, orders, onUpdate, allOrders, now, collapsible, collapsed, onToggle, emptyLabel }) {
  if (!collapsible && count === 0) return null;

  return (
    <div style={{ marginBottom: 4 }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0 6px',
        borderBottom: `1.5px solid ${color}28`,
        marginBottom: count > 0 && !collapsed ? 10 : 0,
        cursor: collapsible ? 'pointer' : 'default',
      }}
        onClick={collapsible ? onToggle : undefined}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: count > 0 ? `0 0 0 3px ${color}22` : 'none' }} />
        <span style={{ fontSize: 11, fontWeight: 800, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.09em', flex: 1 }}>
          {label}
        </span>
        {count > 0 && (
          <span style={{ fontSize: 13, fontWeight: 800, color: color, minWidth: 20, textAlign: 'right' }}>{count}</span>
        )}
        {collapsible && (
          <span style={{ color: T.textMuted, display: 'flex' }}>
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </span>
        )}
      </div>

      {/* Cards */}
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {orders.length === 0 && emptyLabel && (
            <div style={{
              padding: '18px 16px', textAlign: 'center', color: T.textMuted,
              background: T.bg, borderRadius: 10, fontSize: 13,
              border: `1px dashed ${T.border}`,
            }}>
              {emptyLabel}
            </div>
          )}
          {orders.map(order => (
            <WorkflowCard key={order.id} order={order} onUpdate={onUpdate} allOrders={allOrders} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const restaurant = useRestaurant();
  const navigate   = useNavigate();
  const [orders,        setOrders]        = useState([]);
  const [mobileGroup,   setMobileGroup]   = useState('pending');
  const [collapsedDone, setCollapsedDone] = useState(true);
  const [newCount,      setNewCount]      = useState(0);
  const [isOpen,        setIsOpen]        = useState(true);
  const [now,           setNow]           = useState(() => Date.now());
  const [activeSection, setActiveSection] = useState('pending');

  const pendingRef  = useRef(null);
  const kitchenRef  = useRef(null);
  const roadRef     = useRef(null);
  const doneRef     = useRef(null);
  const chipBarRef  = useRef(null);

  const scrollToSection = (ref, sectionId) => {
    setActiveSection(sectionId);
    if (!ref.current) return;
    const scrollEl = ref.current.closest('main') || ref.current.closest('[class*="overflow"]');
    if (scrollEl) {
      const top = ref.current.getBoundingClientRect().top - scrollEl.getBoundingClientRect().top + scrollEl.scrollTop - 52;
      scrollEl.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    } else {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const refs = [
      { id: 'pending', ref: pendingRef },
      { id: 'kitchen', ref: kitchenRef },
      { id: 'road',    ref: roadRef    },
      { id: 'done',    ref: doneRef    },
    ];
    const scrollEl = pendingRef.current?.closest('main') || pendingRef.current?.closest('[class*="overflow"]');
    if (!scrollEl) return;
    const handleScroll = () => {
      const containerTop = scrollEl.getBoundingClientRect().top + 60;
      let best = 'pending', bestDist = Infinity;
      refs.forEach(({ id, ref }) => {
        if (!ref.current) return;
        const dist = Math.abs(ref.current.getBoundingClientRect().top - containerTop);
        if (dist < bestDist) { bestDist = dist; best = id; }
      });
      setActiveSection(best);
    };
    scrollEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollEl.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { if (restaurant) setIsOpen(restaurant.is_active ?? true); }, [restaurant]);

  useEffect(() => {
    if (!chipBarRef.current) return;
    const activeEl = chipBarRef.current.querySelector('[data-active="true"]');
    if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [mobileGroup]);

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
      const { data, error } = await supabase
        .from('orders').select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });
      if (error) { console.error('[Dashboard] fetchOrders error:', error); return; }
      setOrders(data || []);
    };
    fetchOrders();
    const refetchInterval = setInterval(fetchOrders, 90000);
    const channel = supabase
      .channel(`restaurant-orders-${restaurant.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurant.id}` },
        ({ new: order }) => {
          setOrders(prev => [order, ...prev]);
          setNewCount(c => c + 1);
          setMobileGroup('pending');
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
    return () => { clearInterval(refetchInterval); supabase.removeChannel(channel); };
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

  // ── Computed metrics (all real, no changes to calculations) ──────────────
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

  // ── Workflow groups (oldest first = most urgent at top; done newest first) ─
  const oldestFirst = (a, b) => new Date(a.created_at) - new Date(b.created_at);
  const newestFirst = (a, b) => new Date(b.created_at) - new Date(a.created_at);
  const pendingOrders  = orders.filter(o => o.order_status === 'pending').sort(oldestFirst);
  const kitchenOrders  = orders.filter(o => ['accepted', 'preparing'].includes(o.order_status)).sort(oldestFirst);
  const roadOrders     = orders.filter(o => o.order_status === 'ready').sort(oldestFirst);
  const doneOrders     = todayOrders.filter(o => o.order_status === 'delivered').sort(newestFirst);

  // ── Mobile group selected orders ─────────────────────────────────────────
  const mobileOrders = {
    pending: pendingOrders,
    kitchen: kitchenOrders,
    road:    roadOrders,
    done:    doneOrders,
  }[mobileGroup] || pendingOrders;

  const activeChip = mobileChips.find(c => c.id === mobileGroup) || mobileChips[0];

  // ── Peak hours chart (real derived) ──────────────────────────────────────
  const hourCounts = Array.from({ length: 24 }, () => 0);
  orders.forEach(o => { hourCounts[new Date(o.created_at).getHours()]++; });
  let firstHour = hourCounts.findIndex(c => c > 0);
  let lastHour  = hourCounts.length - 1 - [...hourCounts].reverse().findIndex(c => c > 0);
  if (firstHour === -1) { firstHour = 8; lastHour = 22; }
  const peakHours    = [];
  for (let h = firstHour; h <= lastHour; h++) peakHours.push({ hour: h, count: hourCounts[h] });
  const maxHourCount = Math.max(...peakHours.map(p => p.count), 1);
  const showPeakHours = orders.length >= 5;

  // ── Top products (real derived) ───────────────────────────────────────────
  const productCounts = {};
  orders.filter(o => o.order_status !== 'rejected').forEach(o =>
    (o.items || []).forEach(item => {
      productCounts[item.name] = (productCounts[item.name] || 0) + (item.qty || 0);
    })
  );
  const topProducts   = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => ({ name, qty }));
  const maxProductQty = Math.max(...topProducts.map(p => p.qty), 1);

  // ── Attention conditions ──────────────────────────────────────────────────
  const alertSoundOff = pendingCount > 0 && (!audioEnabled || muted);
  const alertClosed   = !isOpen;
  const hasAttention  = alertSoundOff || alertClosed;

  const opSentence = getOpSentence(pendingCount, inKitchenCount, onTheWayCount, todayOrders.length);
  const card = { background: T.white, borderRadius: 14, border: `1px solid ${T.border}`, boxShadow: '0 1px 12px rgba(0,0,0,0.05)' };

  // ── Mobile group chips config ─────────────────────────────────────────────
  const mobileChips = [
    { id: 'pending', label: 'Pendientes', count: pendingOrders.length, color: '#F59E0B' },
    { id: 'kitchen', label: 'Cocina',     count: kitchenOrders.length, color: '#3B82F6' },
    { id: 'road',    label: 'En camino',  count: roadOrders.length,    color: T.teal    },
    { id: 'done',    label: 'Entregados', count: doneOrders.length,    color: '#22C55E' },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="kv-dash">
      <style>{STYLES}</style>

      {/* ══ HERO (unchanged from V2) ══════════════════════════════════════ */}
      <div style={{
        background: GH, borderRadius: 18, overflow: 'hidden',
        position: 'relative', marginBottom: 12,
        boxShadow: '0 8px 32px rgba(6,17,24,0.45)',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.20) 0%, transparent 68%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: 60, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(94,234,212,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ padding: '20px 22px 16px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: 'rgba(13,148,136,0.15)', border: '1.5px solid rgba(94,234,212,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: T.tealLight, fontFamily: FF }}>
                {getInitials(restaurant?.name)}
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: T.tealLight, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>KYVRA · PANEL DE PEDIDOS</p>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.15, margin: 0 }}>{restaurant?.name || 'Mi restaurante'}</h1>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3, textTransform: 'capitalize' }}>{todayLabel()}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={toggleOpen} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px 8px 10px', borderRadius: 50, cursor: 'pointer', border: isOpen ? '1px solid rgba(34,197,94,0.40)' : '1px solid rgba(255,255,255,0.14)', background: isOpen ? 'rgba(34,197,94,0.14)' : 'rgba(255,255,255,0.07)', transition: 'all 0.2s' }}>
                <span style={{ width: 30, height: 17, borderRadius: 20, position: 'relative', flexShrink: 0, background: isOpen ? '#22C55E' : 'rgba(255,255,255,0.22)', transition: 'background 0.2s' }}>
                  <span style={{ position: 'absolute', top: 2.5, width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', left: isOpen ? 15 : 2.5 }} />
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: isOpen ? '#86EFAC' : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>{isOpen ? 'Abierto' : 'Cerrado'}</span>
              </button>
              <button onClick={audioEnabled ? toggleMute : enableAudio} title={!audioEnabled ? 'Activar alertas sonoras' : muted ? 'Activar sonido' : 'Silenciar'}
                style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: !audioEnabled ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.07)', cursor: 'pointer', color: !audioEnabled ? '#FCD34D' : 'rgba(255,255,255,0.55)' }}>
                {muted || !audioEnabled ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <button onClick={() => setNewCount(0)} style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)', cursor: 'pointer', color: newCount > 0 ? T.tealLight : 'rgba(255,255,255,0.55)', position: 'relative' }}>
                <Bell size={16} />
                {newCount > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 17, height: 17, padding: '0 4px', background: T.teal, color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{newCount}</span>
                )}
              </button>
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingBottom: 2 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.60)', fontStyle: 'italic' }}>{opSentence}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.40)' }}>Ventas hoy</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: T.tealLight, fontFamily: FF }}>${todayRevenue.toLocaleString('es-AR')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ PRIORITY STRIP (unchanged from V2) ═══════════════════════════ */}
      <div className="kv-priority" style={{ marginBottom: 14 }}>
        <motion.div animate={pendingCount > 0 ? { scale: [1, 1.005, 1] } : { scale: 1 }} transition={pendingCount > 0 ? { repeat: Infinity, duration: 2.4, ease: 'easeInOut' } : {}}
          style={{ ...card, padding: '16px 18px', borderLeft: `4px solid ${pendingCount > 0 ? '#F59E0B' : T.border}`, background: pendingCount > 0 ? 'linear-gradient(135deg, #FFFBEB 0%, #fff 60%)' : T.white, animation: pendingCount > 0 ? 'kv-pulse-amber 2.4s ease-in-out infinite' : undefined, position: 'relative', overflow: 'hidden' }}>
          {pendingCount > 0 && <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: pendingCount > 0 ? '#92400E' : T.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pendientes</span>
            <ShoppingBag size={15} style={{ color: pendingCount > 0 ? '#D97706' : T.textMuted }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, color: pendingCount > 0 ? '#D97706' : T.textMuted, fontFamily: FF }}>{pendingCount}</span>
            {pendingCount > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#B45309' }}>esperando</span>}
          </div>
          <p style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>{newOrders} hoy · activos ahora: {pendingCount}</p>
        </motion.div>
        <div style={{ ...card, padding: '16px 18px', borderLeft: `4px solid ${inKitchenCount > 0 ? '#3B82F6' : T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>En cocina</span>
            <ChefHat size={15} style={{ color: inKitchenCount > 0 ? '#2563EB' : T.textMuted }} />
          </div>
          <span style={{ fontSize: 36, fontWeight: 800, lineHeight: 1, color: inKitchenCount > 0 ? '#2563EB' : T.textMuted, fontFamily: FF }}>{inKitchenCount}</span>
          <p style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>{preparingOrders} hoy</p>
        </div>
        <div style={{ ...card, padding: '16px 18px', borderLeft: `4px solid ${onTheWayCount > 0 ? T.teal : T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>En camino</span>
            <Bike size={15} style={{ color: onTheWayCount > 0 ? T.teal : T.textMuted }} />
          </div>
          <span style={{ fontSize: 36, fontWeight: 800, lineHeight: 1, color: onTheWayCount > 0 ? T.teal : T.textMuted, fontFamily: FF }}>{onTheWayCount}</span>
          <p style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>{dispatchedOrders} entregados hoy</p>
        </div>
      </div>

      {/* ══ ATTENTION ALERTS (unchanged from V2) ═════════════════════════ */}
      <AnimatePresence>
        {hasAttention && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {alertClosed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '10px 14px' }}>
                <AlertTriangle size={15} style={{ color: '#DC2626', flexShrink: 0 }} />
                <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#991B1B' }}>El local está <strong>cerrado</strong> — los clientes no pueden ver el menú</p>
                <button onClick={toggleOpen} style={{ flexShrink: 0, padding: '5px 12px', background: '#DC2626', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer' }}>Abrir ahora</button>
              </div>
            )}
            {alertSoundOff && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '10px 14px' }}>
                <VolumeX size={15} style={{ color: '#D97706', flexShrink: 0 }} />
                <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#92400E' }}>Alertas de sonido desactivadas — {pendingCount} pedido{pendingCount > 1 ? 's' : ''} pendiente{pendingCount > 1 ? 's' : ''}</p>
                <button onClick={audioEnabled ? toggleMute : enableAudio} style={{ flexShrink: 0, padding: '5px 12px', background: '#D97706', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer' }}>Activar sonido</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MOBILE-ONLY: status navigation bar (outside kv-split to avoid nesting) ── */}
      <div className="kv-mob-filter" ref={chipBarRef}>
        {mobileChips.map(chip => {
          const active = mobileGroup === chip.id;
          return (
            <button
              key={chip.id}
              data-active={active ? 'true' : 'false'}
              onClick={() => setMobileGroup(chip.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '8px 13px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                fontFamily: FF, cursor: 'pointer', flexShrink: 0,
                background: active ? T.navy : T.white,
                color: active ? '#fff' : T.textSec,
                border: `1.5px solid ${active ? T.navy : T.border}`,
                boxShadow: active ? '0 2px 10px rgba(15,23,42,0.22)' : 'none',
                transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
              }}>
              {active && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: chip.color, flexShrink: 0 }} />
              )}
              {chip.label}
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 18, height: 18, borderRadius: 20, padding: '0 4px',
                background: active ? chip.color : T.border,
                color: '#fff', fontSize: 10, fontWeight: 800,
              }}>
                {chip.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ══ MAIN SPLIT ══════════════════════════════════════════════════ */}
      <div className="kv-split">

        {/* ── LEFT: WORKFLOW OPERATIONS ───────────────────────────────── */}
        <div className="kv-orders-col">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: T.navy, margin: 0 }}>Operaciones</h2>
            <span style={{ fontSize: 11, color: T.textMuted }}>
              {pendingOrders.length + kitchenOrders.length + roadOrders.length} activos
            </span>
          </div>

          {/* ── DESKTOP: sticky section nav + all workflow groups stacked ── */}
          <div className="kv-desk-only" style={{ flexDirection: 'column', width: '100%' }}>

            {/* Sticky nav bar */}
            <div className="kv-section-nav">
              {[
                { id: 'pending', label: 'Pendientes',  count: pendingOrders.length, color: '#F59E0B', ref: pendingRef },
                { id: 'kitchen', label: 'En cocina',   count: kitchenOrders.length, color: '#3B82F6', ref: kitchenRef },
                { id: 'road',    label: 'En camino',   count: roadOrders.length,    color: T.teal,    ref: roadRef    },
                { id: 'done',    label: 'Entregados',  count: doneOrders.length,    color: '#22C55E', ref: doneRef    },
              ].map(item => {
                const isActive = activeSection === item.id;
                return (
                  <button key={item.id} onClick={() => scrollToSection(item.ref, item.id)} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '9px 8px', border: 'none', cursor: 'pointer', fontFamily: FF,
                    background: isActive ? `${item.color}10` : 'transparent',
                    borderBottom: isActive ? `2px solid ${item.color}` : '2px solid transparent',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}>
                    <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? item.color : T.textSec, whiteSpace: 'nowrap' }}>
                      {item.label}
                    </span>
                    {item.count > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 20, background: isActive ? item.color : T.border, color: isActive ? '#fff' : T.textSec, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div ref={pendingRef}>
              <WorkflowSection
                label="Pendientes" color="#F59E0B" count={pendingOrders.length}
                orders={pendingOrders} onUpdate={updateStatus} allOrders={orders} now={now}
                emptyLabel="Sin pedidos pendientes · el flujo está al día"
              />
            </div>
            <div ref={kitchenRef}>
              <WorkflowSection
                label="En preparación" color="#3B82F6" count={kitchenOrders.length}
                orders={kitchenOrders} onUpdate={updateStatus} allOrders={orders} now={now}
              />
            </div>
            <div ref={roadRef}>
              <WorkflowSection
                label="En camino" color={T.teal} count={roadOrders.length}
                orders={roadOrders} onUpdate={updateStatus} allOrders={orders} now={now}
              />
            </div>
            <div ref={doneRef}>
              <WorkflowSection
                label="Entregados hoy" color="#22C55E" count={doneOrders.length}
                orders={doneOrders} onUpdate={updateStatus} allOrders={orders} now={now}
                collapsible collapsed={collapsedDone} onToggle={() => setCollapsedDone(v => !v)}
              />
            </div>
          </div>

          {/* ── MOBILE: group title ── */}
          <div className="kv-mob-group-title">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: activeChip.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: T.navy, fontFamily: FF }}>{activeChip.label}</span>
            <span style={{ fontSize: 12, color: T.textMuted }}>· {mobileOrders.length} {mobileOrders.length === 1 ? 'pedido' : 'pedidos'}</span>
          </div>

          {/* ── MOBILE: single group, filtered by chip ── */}
          <div className="kv-mob-only" style={{ flexDirection: 'column', gap: 8 }}>
            {mobileOrders.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: T.textMuted, background: T.bg, borderRadius: 12, border: `1px dashed ${T.border}` }}>
                <Clock size={32} strokeWidth={1} style={{ display: 'block', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 13 }}>
                  {mobileGroup === 'pending'  && 'Sin pedidos pendientes'}
                  {mobileGroup === 'kitchen'  && 'Nada en preparación ahora'}
                  {mobileGroup === 'road'     && 'Sin pedidos en camino'}
                  {mobileGroup === 'done'     && 'Ningún pedido entregado hoy'}
                </p>
              </div>
            ) : mobileOrders.map(order => (
              <WorkflowCard key={order.id} order={order} onUpdate={updateStatus} allOrders={orders} now={now} />
            ))}
          </div>
        </div>

        {/* ── RIGHT: INTELLIGENCE PANEL (unchanged from V2) ─────────────── */}
        <div className="kv-sidebar">

          {/* Pipeline stage rail */}
          <div style={{ ...card, padding: '16px 18px' }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Flujo actual</h3>
            {[
              { label: 'Pendientes',    count: pendingCount,   color: '#F59E0B', active: pendingCount > 0   },
              { label: 'En cocina',     count: inKitchenCount, color: '#3B82F6', active: inKitchenCount > 0 },
              { label: 'En camino',     count: onTheWayCount,  color: T.teal,    active: onTheWayCount > 0  },
              { label: 'Entregados hoy',count: deliveredToday, color: '#22C55E', active: deliveredToday > 0 },
            ].map((stage, i, arr) => (
              <div key={stage.label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: stage.active ? stage.color : T.border, boxShadow: stage.active ? `0 0 0 3px ${stage.color}26` : 'none', animation: stage.active && i === 0 ? 'kv-pulse-dot 1.8s ease-in-out infinite' : 'none' }} />
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: stage.active ? T.navy : T.textMuted }}>{stage.label}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, fontFamily: FF, color: stage.active ? stage.color : T.textMuted }}>{stage.count}</span>
                </div>
                {i < arr.length - 1 && <div style={{ marginLeft: 4.5, width: 1, height: 12, background: T.border }} />}
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ ...card, padding: '16px 18px' }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Acciones rápidas</h3>
            {[
              { label: 'Gestionar menú',  icon: UtensilsCrossed, path: '/restaurant/panel/menu'      },
              { label: 'Mi restaurante',  icon: Store,           path: '/restaurant/panel/perfil'    },
              { label: 'Ver ganancias',   icon: TrendingUp,      path: '/restaurant/panel/ganancias' },
            ].map(({ label, icon: Icon, path }) => (
              <button key={path} onClick={() => navigate(path)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', fontFamily: FF, textAlign: 'left' }}>
                <Icon size={15} style={{ color: T.teal, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: T.navy }}>{label}</span>
                <ArrowRight size={13} style={{ color: T.textMuted }} />
              </button>
            ))}
            <button onClick={toggleOpen} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: FF, textAlign: 'left' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: isOpen ? '#22C55E' : T.textMuted, flexShrink: 0, boxShadow: isOpen ? '0 0 0 3px rgba(34,197,94,0.20)' : 'none' }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: T.navy }}>{isOpen ? 'Cerrar el local' : 'Abrir el local'}</span>
              <ArrowRight size={13} style={{ color: T.textMuted }} />
            </button>
          </div>

          {/* Top products */}
          {topProducts.length > 0 && (
            <div style={{ ...card, padding: '16px 18px' }}>
              <h3 style={{ fontSize: 12, fontWeight: 800, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Star size={12} style={{ color: T.teal }} /> Más pedidos
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topProducts.map((p, i) => (
                  <div key={p.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {i === 0 && <span style={{ fontSize: 10, marginRight: 4 }}>★</span>}{p.name}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, flexShrink: 0 }}>{p.qty}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 10, background: T.tealBg, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 10, transition: 'width 0.5s ease', width: `${(p.qty / maxProductQty) * 100}%`, background: i === 0 ? GTEAL : `linear-gradient(90deg, ${T.tealDark}, ${T.teal})` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Peak hours */}
          {showPeakHours && (
            <div style={{ ...card, padding: '16px 18px' }}>
              <h3 style={{ fontSize: 12, fontWeight: 800, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BarChart3 size={12} style={{ color: T.teal }} /> Horas pico
              </h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80, overflowX: 'auto', paddingBottom: 2 }}>
                {peakHours.map(({ hour, count }) => (
                  <div key={hour} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, height: '100%', justifyContent: 'flex-end', flexShrink: 0, width: 20 }}>
                    <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden', borderRadius: '3px 3px 0 0', background: T.tealBg }}>
                      <div style={{ width: '100%', background: GTEAL, transition: 'height 0.5s ease', height: `${(count / maxHourCount) * 100}%`, minHeight: count > 0 ? 3 : 0, borderRadius: '3px 3px 0 0' }} />
                    </div>
                    <span style={{ fontSize: 8, color: T.textMuted }}>{hour}h</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
