import { useEffect, useState } from 'react';
import {
  CheckCircle, XCircle, Clock, ChefHat, Bike, PackageCheck, Bell,
  DollarSign, ShoppingBag, BarChart3, Star, MapPin, Wallet, Timer,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase, supabaseAdmin } from '../../lib/supabase.js';
import { useRestaurant } from '../../contexts/RestaurantContext.js';
import { subscribeToPush } from '../../lib/pushNotifications.js';

const STATUS_LABELS = {
  pending:   { label: 'Pendiente',  color: 'bg-amber-100 text-amber-700',  icon: Clock        },
  accepted:  { label: 'Aceptado',   color: 'bg-blue-100 text-blue-700',    icon: CheckCircle  },
  preparing: { label: 'Preparando', color: 'bg-blue-100 text-blue-700',    icon: ChefHat      },
  ready:     { label: 'En camino',  color: 'bg-primary-bg text-primary',   icon: Bike         },
  delivered: { label: 'Entregado',  color: 'bg-green-100 text-green-700',  icon: PackageCheck },
  rejected:  { label: 'Rechazado',  color: 'bg-red-100 text-red-700',      icon: XCircle      },
};

const NEXT_STATUS = { accepted: 'preparing', preparing: 'ready', ready: 'delivered' };
const PAYMENT_LABELS = { card: 'Tarjeta', transfer: 'Transferencia', cash: 'Efectivo' };

const FILTERS = [
  ['all', 'Todos'], ['pending', 'Pendientes'], ['accepted', 'Aceptados'],
  ['preparing', 'Preparando'], ['ready', 'En camino'], ['delivered', 'Entregados'],
];

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
        <button onClick={() => onUpdate(order.id, 'accepted')} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors whitespace-nowrap ${w}`}>
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
      <button onClick={() => onUpdate(order.id, 'preparing')} className={`btn-outline py-2.5 px-4 text-sm flex items-center gap-1.5 whitespace-nowrap ${fullWidth ? 'w-full justify-center' : ''}`}>
        <ChefHat size={15} /> Empezar a preparar
      </button>
    );
  }
  if (order.order_status === 'preparing') {
    return (
      <button onClick={() => onUpdate(order.id, 'ready')} className={`btn-outline py-2.5 px-4 text-sm flex items-center gap-1.5 whitespace-nowrap ${fullWidth ? 'w-full justify-center' : ''}`}>
        <PackageCheck size={15} /> Marcar como listo
      </button>
    );
  }
  if (order.order_status === 'ready') {
    return (
      <button onClick={() => onUpdate(order.id, 'delivered')} className={`btn-outline py-2.5 px-4 text-sm flex items-center gap-1.5 whitespace-nowrap ${fullWidth ? 'w-full justify-center' : ''}`}>
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
    const { error } = await supabaseAdmin.from('orders').update({ order_status: status }).eq('id', orderId);
    if (error) { toast.error('Error al actualizar'); return; }
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
    const { error } = await supabaseAdmin.from('restaurants').update({ is_active: next }).eq('id', restaurant.id);
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

  const filtered = orders.filter(o => filter === 'all' ? true : o.order_status === filter);

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
            <span className="text-xs font-bold">{isOpen ? 'Abierto' : 'Cerrado'}</span>
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

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">Pedidos nuevos</span>
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <ShoppingBag size={15} className="text-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{newOrders}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">En preparación</span>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <ChefHat size={15} className="text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{preparingOrders}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">Despachados</span>
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <Bike size={15} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{dispatchedOrders}</p>
        </div>
        <div className="card p-4 bg-primary text-white">
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
            <span className="badge bg-amber-100 text-amber-700"><Clock size={12} /> {pendingCount} pendientes</span>
            <span className="badge bg-blue-100 text-blue-700"><ChefHat size={12} /> {inKitchenCount} en preparación</span>
            <span className="badge bg-primary-bg text-primary"><Bike size={12} /> {onTheWayCount} en camino</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {FILTERS.map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === key ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-neutral-200 hover:border-primary'}`}>
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card p-10 text-center text-gray-400">
            <Clock size={40} strokeWidth={1} className="mx-auto mb-3" />
            <p>No hay pedidos en esta categoría</p>
          </div>
        ) : (
          <>
            {/* Desktop: tabla */}
            <div className="hidden lg:block card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[1000px]">
                  <thead>
                    <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider border-b border-neutral-100">
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
                      const statusInfo = STATUS_LABELS[order.order_status] || STATUS_LABELS.pending;
                      const StatusIcon = statusInfo.icon;
                      const itemsLabel = (order.items || []).map(i => `${i.qty}x ${i.name}`).join(', ');
                      const hasAction = order.order_status === 'pending' || !!NEXT_STATUS[order.order_status];
                      return (
                        <tr key={order.id} className="border-b border-neutral-50 last:border-0 align-top">
                          <td className="px-5 py-4">
                            <p className="font-extrabold text-primary">#{order.id.slice(0, 6).toUpperCase()}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{order.customer_name}</p>
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
                            <span className={`badge ${statusInfo.color}`}><StatusIcon size={12} /> {statusInfo.label}</span>
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
                const statusInfo = STATUS_LABELS[order.order_status] || STATUS_LABELS.pending;
                const StatusIcon = statusInfo.icon;
                const hasAction = order.order_status === 'pending' || !!NEXT_STATUS[order.order_status];
                return (
                  <div key={order.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-extrabold text-primary text-lg">#{order.id.slice(0, 6).toUpperCase()}</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5">{order.customer_name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`badge ${statusInfo.color}`}><StatusIcon size={12} /> {statusInfo.label}</span>
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
        <div className="card p-5">
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
                      className="bg-primary rounded-t-md w-full transition-all duration-500"
                      style={{ height: `${(count / maxHourCount) * 100}%`, minHeight: count > 0 ? '4px' : '0' }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">{hour}h</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
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
                    <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${(p.qty / maxProductQty) * 100}%` }} />
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
