import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, ChefHat, Bike, PackageCheck, Bell } from 'lucide-react';
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

export default function Dashboard() {
  const restaurant = useRestaurant();
  const [orders,   setOrders]   = useState([]);
  const [filter,   setFilter]   = useState('pending');
  const [newCount, setNewCount] = useState(0);

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

  const todayOrders  = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
  const todayRevenue = todayOrders.filter(o => o.order_status === 'delivered').reduce((s, o) => s + o.total, 0);
  const filtered     = orders.filter(o => filter === 'all' ? true : o.order_status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-extrabold text-2xl">Pedidos en tiempo real</h1>
        {newCount > 0 && (
          <button onClick={() => setNewCount(0)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold animate-bounce">
            <Bell size={16} /> {newCount} nuevo{newCount !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold text-primary">{todayOrders.length}</p>
          <p className="text-xs text-gray-500 mt-1">Pedidos hoy</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold text-green-600">${todayRevenue.toLocaleString('es-AR')}</p>
          <p className="text-xs text-gray-500 mt-1">Facturado hoy</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold text-amber-500">{orders.filter(o => o.order_status === 'pending').length}</p>
          <p className="text-xs text-gray-500 mt-1">Pendientes</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[['all','Todos'],['pending','Pendientes'],['accepted','Aceptados'],['preparing','Preparando'],['ready','En camino'],['delivered','Entregados']].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === key ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-neutral-200 hover:border-primary'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card p-10 text-center text-gray-400">
            <Clock size={40} strokeWidth={1} className="mx-auto mb-3" />
            <p>No hay pedidos en esta categoría</p>
          </div>
        ) : filtered.map(order => {
          const statusInfo = STATUS_LABELS[order.order_status] || STATUS_LABELS.pending;
          const StatusIcon = statusInfo.icon;
          return (
            <div key={order.id} className="card p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-base">{order.customer_name}</span>
                    <span className={`badge ${statusInfo.color}`}><StatusIcon size={12} /> {statusInfo.label}</span>
                  </div>
                  <p className="text-xs text-gray-500">{order.customer_phone} · {order.customer_address}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} ·
                    Pago: {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                  </p>
                </div>
                <p className="font-extrabold text-primary text-lg shrink-0">${order.total?.toLocaleString('es-AR')}</p>
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

              <div className="flex gap-2 flex-wrap">
                {order.order_status === 'pending' && (
                  <>
                    <button onClick={() => updateStatus(order.id, 'accepted')} className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5">
                      <CheckCircle size={15} /> Aceptar
                    </button>
                    <button onClick={() => updateStatus(order.id, 'rejected')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-all">
                      <XCircle size={15} /> Rechazar
                    </button>
                  </>
                )}
                {NEXT_STATUS[order.order_status] && (
                  <button onClick={() => updateStatus(order.id, NEXT_STATUS[order.order_status])} className="btn-outline py-2 px-4 text-sm">
                    Marcar como {STATUS_LABELS[NEXT_STATUS[order.order_status]]?.label}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
