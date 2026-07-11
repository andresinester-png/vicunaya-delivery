import { useEffect, useState } from 'react';
import {
  CheckCircle, XCircle, Clock, ChefHat, Bike, PackageCheck, Bell,
  DollarSign, ShoppingBag, BarChart3, Star, MapPin, Wallet, Timer,
  Volume2, VolumeX,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase.js';
import { useRestaurant } from '../../contexts/RestaurantContext.js';
import { subscribeToPush } from '../../lib/pushNotifications.js';
import { usePendingOrdersAlert } from '../../hooks/usePendingOrdersAlert.js';
import { playConfirmation } from '../../lib/sounds.js';

function WhatsAppIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.849L0 24l6.335-1.508A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.017-1.376l-.36-.214-3.727.887.926-3.635-.235-.373A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
    </svg>
  );
}

function CustomerInfo({ phone, orderId, orderCreatedAt, allOrders }) {
  const [showHistory, setShowHistory] = useState(false);
  if (!phone) return null;

  const waUrl = buildWhatsAppUrl(phone);
  const prevOrders = allOrders
    .filter(o => o.customer_phone === phone && o.id !== orderId && new Date(o.created_at) < new Date(orderCreatedAt))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const isNew  = prevOrders.length === 0;
  const last3  = prevOrders.slice(0, 3);

  return (
    <div>
      {waUrl && (
        <a href={waUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-green-600 font-medium hover:text-green-700">
          <WhatsAppIcon size={11} />
          {phone}
        </a>
      )}
      <div className="mt-0.5">
        {isNew ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
            ✦ Cliente nuevo
          </span>
        ) : (
          <button
            onClick={() => setShowHistory(v => !v)}
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
          >
            ✓ {prevOrders.length} pedido{prevOrders.length !== 1 ? 's' : ''} previo{prevOrders.length !== 1 ? 's' : ''}
          </button>
        )}
      </div>
      {showHistory && last3.length > 0 && (
        <div className="mt-1.5 border border-neutral-100 rounded-lg p-2 bg-gray-50 space-y-1">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Últimos pedidos</p>
          {last3.map(o => (
            <div key={o.id} className="flex justify-between items-center text-[10px]">
              <span className="text-gray-500">{new Date(o.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</span>
              <span className="font-bold text-gray-700">${o.total?.toLocaleString('es-AR')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
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

const STATUS_LABELS = {
  pending:   { label: 'Pendiente',  dot: 'bg-amber-400', bg: 'bg-amber-50',   text: 'text-amber-700' },
  accepted:  { label: 'Aceptado',   dot: 'bg-sky-400',   bg: 'bg-sky-50',     text: 'text-sky-700'   },
  preparing: { label: 'Preparando', dot: 'bg-blue-500',  bg: 'bg-blue-50',    text: 'text-blue-700'  },
  ready:     { label: 'En camino',  dot: 'bg-primary',   bg: 'bg-primary-bg', text: 'text-primary'   },
  delivered: { label: 'Entregado',  dot: 'bg-green-500', bg: 'bg-green-50',   text: 'text-green-700' },
  rejected:  { label: 'Rechazado',  dot: 'bg-red-400',   bg: 'bg-red-50',     text: 'text-red-700'   },
};

const NEXT_STATUS = { accepted: 'preparing', preparing: 'ready', ready: 'delivered' };
const PAYMENT_LABELS = { card: 'Tarjeta', transfer: 'Transferencia', cash: 'Efectivo' };

const FILTERS = [
  ['all', 'Todos'], ['pending', 'Pendientes'], ['accepted', 'Aceptados'],
  ['preparing', 'Preparando'], ['ready', 'En camino'], ['delivered', 'Entregados'],
];

const CARD = 'card rounded-2xl border border-black/[0.04] shadow-[0_2px_16px_rgba(0,0,0,0.06)]';

function StatusBadge({ status }) {
  const info = STATUS_LABELS[status] || STATUS_LABELS.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${info.bg} ${info.text}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${info.dot}`} />
      {info.label}
    </span>
  );
}

function elapsedLabel(createdAt, now) {
  const diffMin = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60000));
  if (diffMin < 1) return 'Recién';
  if (diffMin < 60) return `${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return `${h}h ${m}min`;
}

function OrderActions({ order, onUpdate, fullWidth }) {
  const w = fullWidth ? 'flex-1 justify-center' : '';
  if (order.order_status === 'pending') {
    return (
      <div className={`flex gap-2 ${fullWidth ? 'w-full' : ''}`}>
        <button onClick={() => onUpdate(order.id, 'accepted')} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors whitespace-nowrap shadow-[0_4px_14px_rgba(34,197,94,0.35)] ${w}`}>
          <CheckCircle size={15} /> Aceptar
        </button>
        <button onClick={() => onUpdate(order.id, 'rejected')} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors whitespace-nowrap ${w}`}>
          <XCircle size={15} /> Rechazar
        </button>
      </div>
    );
  }
  if (order.order_status === 'accepted') {
    return (
      <button onClick={() => onUpdate(order.id, 'preparing')} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors whitespace-nowrap shadow-[0_4px_14px_rgba(37,99,235,0.35)] ${fullWidth ? 'w-full justify-center' : ''}`}>
        <ChefHat size={15} /> Empezar a preparar
      </button>
    );
  }
  if (order.order_status === 'preparing') {
    return (
      <button onClick={() => onUpdate(order.id, 'ready')} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-colors whitespace-nowrap shadow-[0_4px_14px_rgba(227,27,35,0.35)] ${fullWidth ? 'w-full justify-center' : ''}`}>
        <PackageCheck size={15} /> Marcar como listo
      </button>
    );
  }
  if (order.order_status === 'ready') {
    return (
      <button onClick={() => onUpdate(order.id, 'delivered')} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors whitespace-nowrap shadow-[0_4px_14px_rgba(34,197,94,0.35)] ${fullWidth ? 'w-full justify-center' : ''}`}>
        <Bike size={15} /> Marcar en camino
      </button>
    );
  }
  return null;
}

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

  // Tick every 30s so "tiempo transcurrido" stays live
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // Subscribe to push notifications once session + restaurant are available
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

          // Local notification for when the panel is open in background
          if (Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification('🛵 Nuevo pedido — VicuñaYa', {
                body:    `${order.customer_name} · ${order.items?.length ?? 0} productos · $${(order.total ?? 0).toLocaleString('es-AR')}`,
                tag:     'new-order',
                renotify: true,
                data:    { url: '/restaurant/panel/pedidos' },
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

  const todayOrders  = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
  const todayRevenue = todayOrders.filter(o => o.order_status === 'delivered').reduce((s, o) => s + o.total, 0);

  const newOrders        = todayOrders.filter(o => o.order_status === 'pending').length;
  const preparingOrders  = todayOrders.filter(o => ['accepted', 'preparing'].includes(o.order_status)).length;
  const dispatchedOrders = todayOrders.filter(o => ['ready', 'delivered'].includes(o.order_status)).length;

  // Resumen rápido de pedidos en vivo
  const pendingCount   = orders.filter(o => o.order_status === 'pending').length;
  const inKitchenCount = orders.filter(o => ['accepted', 'preparing'].includes(o.order_status)).length;
  const onTheWayCount  = orders.filter(o => o.order_status === 'ready').length;

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

  // Horas pico
  const hourCounts = Array.from({ length: 24 }, () => 0);
  orders.forEach(o => { hourCounts[new Date(o.created_at).getHours()]++; });
  let firstHour = hourCounts.findIndex(c => c > 0);
  let lastHour  = hourCounts.length - 1 - [...hourCounts].reverse().findIndex(c => c > 0);
  if (firstHour === -1) { firstHour = 8; lastHour = 22; }
  const peakHours = [];
  for (let h = firstHour; h <= lastHour; h++) peakHours.push({ hour: h, count: hourCounts[h] });
  const maxHourCount = Math.max(...peakHours.map(p => p.count), 1);

  // Productos más vendidos
  const productCounts = {};
  orders.filter(o => o.order_status !== 'rejected').forEach(o => (o.items || []).forEach(item => {
    productCounts[item.name] = (productCounts[item.name] || 0) + (item.qty || 0);
  }));
  const topProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => ({ name, qty }));
  const maxProductQty = Math.max(...topProducts.map(p => p.qty), 1);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="font-extrabold text-2xl">{restaurant?.name || 'Mi restaurante'}</h1>
          <p className="text-sm text-gray-400 mt-0.5">Pedidos en tiempo real</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleOpen}
            className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border transition-colors ${
              isOpen ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-500'
            }`}
          >
            <span className={`w-7 h-4 rounded-full relative transition-colors ${isOpen ? 'bg-green-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isOpen ? 'right-0.5' : 'left-0.5'}`} />
            </span>
            <span className="text-xs font-bold">{isOpen ? 'Visible en la app' : 'No visible'}</span>
          </button>

          <button
            onClick={audioEnabled ? toggleMute : enableAudio}
            className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-colors ${
              !audioEnabled ? 'bg-amber-50 border-amber-200' : 'bg-white border-neutral-200 hover:bg-gray-50'
            }`}
            title={!audioEnabled ? 'Activar alertas sonoras' : muted ? 'Activar sonido' : 'Silenciar alertas'}
          >
            {muted || !audioEnabled
              ? <VolumeX size={18} className={!audioEnabled ? 'text-amber-500' : 'text-gray-400'} />
              : <Volume2 size={18} className="text-gray-600" />}
          </button>

          <button
            onClick={() => setNewCount(0)}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-neutral-200 hover:bg-gray-50 transition-colors"
          >
            <Bell size={18} className="text-gray-600" />
            {newCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {newCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Banner activación de sonido */}
      {!audioEnabled && (
        <div className="mb-5 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <Volume2 size={16} className="text-amber-600 shrink-0" />
          <p className="flex-1 text-sm font-semibold text-amber-800">
            Activá el sonido para recibir alertas cuando entren pedidos nuevos
          </p>
          <button
            onClick={enableAudio}
            className="shrink-0 px-4 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-colors whitespace-nowrap"
          >
            Activar sonido
          </button>
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={`${CARD} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">Pedidos nuevos</span>
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <ShoppingBag size={15} className="text-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{newOrders}</p>
        </div>
        <div className={`${CARD} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">En preparación</span>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <ChefHat size={15} className="text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{preparingOrders}</p>
        </div>
        <div className={`${CARD} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">Despachados</span>
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <Bike size={15} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{dispatchedOrders}</p>
        </div>
        <div className="card rounded-2xl p-4 bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_8px_24px_rgba(227,27,35,0.3)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-white/80">Ventas del día</span>
            <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
              <DollarSign size={15} className="text-white" />
            </div>
          </div>
          <p className="text-2xl font-extrabold">${todayRevenue.toLocaleString('es-AR')}</p>
        </div>
      </div>

      {/* Pedidos en vivo */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="font-extrabold text-xl">Pedidos en vivo</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white px-3 py-1.5 rounded-full shadow-card">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> {pendingCount} pendientes
            </span>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white px-3 py-1.5 rounded-full shadow-card">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> {inKitchenCount} en preparación
            </span>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white px-3 py-1.5 rounded-full shadow-card">
              <span className="w-2 h-2 rounded-full bg-primary" /> {onTheWayCount} en camino
            </span>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {FILTERS.map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === key ? 'bg-[#111827] text-white' : 'bg-white text-gray-600 border border-neutral-200 hover:border-primary'}`}>
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className={`${CARD} p-10 text-center text-gray-400`}>
            <Clock size={40} strokeWidth={1} className="mx-auto mb-3" />
            <p>No hay pedidos en esta categoría</p>
          </div>
        ) : (
          <>
            {/* Desktop: tabla */}
            <div className={`hidden lg:block ${CARD}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[1000px]">
                  <thead>
                    <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider border-b border-neutral-100 bg-[#FAFAFA]">
                      <th className="px-5 py-3 font-semibold">Pedido</th>
                      <th className="px-5 py-3 font-semibold">Productos</th>
                      <th className="px-5 py-3 font-semibold">Entrega</th>
                      <th className="px-5 py-3 font-semibold">Pago</th>
                      <th className="px-5 py-3 font-semibold">Tiempo</th>
                      <th className="px-5 py-3 font-semibold">Estado</th>
                      <th className="px-5 py-3 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(order => {
                      const itemsLabel = (order.items || []).map(i => `${i.qty}x ${i.name}`).join(', ');
                      const hasAction = order.order_status === 'pending' || !!NEXT_STATUS[order.order_status];
                      return (
                        <tr key={order.id} className="border-b border-neutral-50 last:border-0 align-top hover:bg-[#FAFAFA] transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-extrabold text-primary">#{order.id.slice(0, 6).toUpperCase()}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{order.customer_name}</p>
                            <CustomerInfo phone={order.customer_phone} orderId={order.id} orderCreatedAt={order.created_at} allOrders={orders} />
                            <p className="text-xs font-bold text-gray-700 mt-1">${order.total?.toLocaleString('es-AR')}</p>
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            <span className="block max-w-[220px] truncate" title={itemsLabel}>{itemsLabel}</span>
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            <span className="flex items-start gap-1.5 max-w-[180px]">
                              <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
                              <span className="truncate" title={order.customer_address}>{order.customer_address}</span>
                            </span>
                          </td>
                          <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Wallet size={13} className="text-gray-400" />
                              {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Timer size={13} className="text-gray-400" />
                              {elapsedLabel(order.created_at, now)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={order.order_status} />
                          </td>
                          <td className="px-5 py-4">
                            {hasAction ? <OrderActions order={order} onUpdate={updateStatus} /> : <span className="text-xs text-gray-400">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile: cards */}
            <div className="lg:hidden space-y-3">
              {filtered.map(order => {
                const hasAction = order.order_status === 'pending' || !!NEXT_STATUS[order.order_status];
                return (
                  <div key={order.id} className={`${CARD} p-4`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-extrabold text-primary text-lg">#{order.id.slice(0, 6).toUpperCase()}</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5">{order.customer_name}</p>
                        <CustomerInfo phone={order.customer_phone} orderId={order.id} orderCreatedAt={order.created_at} allOrders={orders} />
                      </div>
                      <div className="text-right shrink-0">
                        <StatusBadge status={order.order_status} />
                        <p className="text-xs text-gray-400 mt-1.5 flex items-center justify-end gap-1">
                          <Timer size={12} /> {elapsedLabel(order.created_at, now)}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3 mb-3 text-sm space-y-1">
                      {(order.items || []).map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="text-gray-700">{item.qty}x {item.name}{item.extras > 0 ? ` + ${item.extras} extra` : ''}</span>
                          <span className="font-medium">${((item.price * item.qty) + (item.extras || 0) * (item.extra_price || 0)).toLocaleString('es-AR')}</span>
                        </div>
                      ))}
                      {order.notes && <p className="text-xs text-gray-500 mt-2 italic">📝 {order.notes}</p>}
                      {order.comprobante_url && (
                        <a
                          href={order.comprobante_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                          style={{ background: '#2563EB' }}
                        >
                          📎 Ver comprobante
                        </a>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-3 mb-3 text-xs text-gray-500">
                      <span className="flex items-start gap-1.5 min-w-0">
                        <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
                        <span className="truncate">{order.customer_address}</span>
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        <Wallet size={13} className="text-gray-400" />
                        {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <p className="font-extrabold text-gray-900 text-lg">${order.total?.toLocaleString('es-AR')}</p>
                    </div>

                    {hasAction && (
                      <div className="mt-3">
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

      {/* Horas pico + Productos más vendidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${CARD} p-5`}>
          <h2 className="font-bold text-base mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-primary" /> Horas pico</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin datos suficientes</p>
          ) : (
            <div className="flex items-end gap-1.5 h-32 overflow-x-auto pb-1">
              {peakHours.map(({ hour, count }) => (
                <div key={hour} className="flex flex-col items-center gap-1 h-full justify-end shrink-0" style={{ width: 22 }}>
                  <span className="text-[10px] text-gray-400">{count > 0 ? count : ''}</span>
                  <div className="w-full rounded-t-md bg-primary-bg overflow-hidden flex-1 flex flex-col justify-end">
                    <div
                      className="bg-gradient-to-t from-primary-dark to-primary rounded-t-md w-full transition-all duration-500"
                      style={{ height: `${(count / maxHourCount) * 100}%`, minHeight: count > 0 ? '4px' : '0' }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">{hour}h</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`${CARD} p-5`}>
          <h2 className="font-bold text-base mb-4 flex items-center gap-2"><Star size={16} className="text-primary" /> Productos más vendidos</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin datos suficientes</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map(p => (
                <div key={p.name}>
                  <div className="flex justify-between text-sm mb-1 gap-2">
                    <span className="font-medium text-gray-700 truncate">{p.name}</span>
                    <span className="font-bold text-gray-400 shrink-0">{p.qty}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary-dark to-primary h-full rounded-full transition-all duration-500" style={{ width: `${(p.qty / maxProductQty) * 100}%` }} />
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
