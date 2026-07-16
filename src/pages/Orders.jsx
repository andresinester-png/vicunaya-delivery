import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Car, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import useProfileStore from '../store/profileStore.js';
import { useAuth } from '../context/AuthContext.jsx';

const ORDER_STATUS_LABEL = {
  pending:    { label: 'Pendiente',  color: 'bg-amber-100 text-amber-700' },
  accepted:   { label: 'Aceptado',   color: 'bg-blue-100 text-blue-700' },
  preparing:  { label: 'Preparando', color: 'bg-blue-100 text-blue-700' },
  ready:      { label: 'En camino',  color: 'bg-primary-bg text-primary' },
  delivered:  { label: 'Entregado',  color: 'bg-green-100 text-green-700' },
  rejected:   { label: 'Rechazado',  color: 'bg-red-100 text-red-700' },
};

const TRIP_STATUS_LABEL = {
  searching:   { label: 'Buscando',   color: 'bg-amber-100 text-amber-700' },
  accepted:    { label: 'En camino',  color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'En viaje',   color: 'bg-primary-bg text-primary' },
  completed:   { label: 'Completado', color: 'bg-green-100 text-green-700' },
  cancelled:   { label: 'Cancelado',  color: 'bg-red-100 text-red-700' },
};

const ACTIVE_STATUSES = ['pending', 'accepted', 'preparing', 'ready'];
const PAST_STATUSES = ['delivered', 'rejected'];

const ORDER_STEP_INDEX = { pending: 0, accepted: 0, preparing: 1, ready: 2, delivered: 3 };

function getStatusForOrder(order) {
  const base = ORDER_STATUS_LABEL[order.order_status] || ORDER_STATUS_LABEL.pending;
  if (order.order_status === 'ready' && order.delivery_method === 'pickup') {
    return { ...base, label: 'Listo para retirar' };
  }
  return base;
}

export default function Orders() {
  const phone = useProfileStore(s => s.phone);
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [orders, setOrders] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const tab = 'delivery';

  useEffect(() => {
    if (!userId && !phone) { setLoading(false); return; }

    const doFetch = async () => {
      let ordersQuery = supabase.from('orders').select('*, restaurants(name)').order('created_at', { ascending: false }).limit(30);
      if (userId) {
        ordersQuery = ordersQuery.eq('user_id', userId);
      } else {
        ordersQuery = ordersQuery.eq('customer_phone', phone);
      }
      const [{ data: o }, { data: t }] = await Promise.all([
        ordersQuery,
        supabase.from('trips').select('*').eq('passenger_phone', phone || '').order('created_at', { ascending: false }).limit(30),
      ]);
      setOrders(o || []);
      setTrips(t || []);
      setLoading(false);
    };

    doFetch();

    if (userId) {
      // Realtime para usuarios con sesión: escucha actualizaciones de sus pedidos
      const channel = supabase
        .channel(`client-orders-${userId}`)
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` },
          ({ new: updated }) => setOrders(prev => prev.map(o => o.id === updated.id ? { ...updated, restaurants: o.restaurants } : o))
        )
        .subscribe();
      return () => supabase.removeChannel(channel);
    } else {
      // Polling para invitados identificados por teléfono (sin sesión Supabase)
      const interval = setInterval(doFetch, 15000);
      return () => clearInterval(interval);
    }
  }, [userId, phone]);

  if (!userId && !phone) return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center text-gray-400">
      <ShoppingBag size={52} strokeWidth={1} />
      <p className="mt-4 font-semibold text-gray-600">Iniciá sesión para ver tus pedidos</p>
      <p className="text-sm mt-1">O guardá tu teléfono en Perfil si pediste como invitado</p>
      <Link to="/perfil" className="btn-primary mt-5 text-sm py-2 px-5">Ir a Perfil</Link>
    </div>
  );

  const activeOrder = orders.find(o => ACTIVE_STATUSES.includes(o.order_status));
  const pastOrders = orders.filter(o => PAST_STATUSES.includes(o.order_status));
  const activeStatus = activeOrder ? getStatusForOrder(activeOrder) : null;
  const activeStep = activeOrder ? (ORDER_STEP_INDEX[activeOrder.order_status] ?? 0) : 0;
  const orderSteps = ['Confirmado', 'Preparando', activeOrder?.delivery_method === 'pickup' ? 'Listo para retirar' : 'En camino', 'Entregado'];
  const empty = tab === 'delivery' ? orders.length === 0 : trips.length === 0;

  return (
    <div className="px-4 py-4">
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-200" />)}
        </div>
      ) : empty ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          {tab === 'delivery' ? <ShoppingBag size={48} strokeWidth={1} /> : <Car size={48} strokeWidth={1} />}
          <p className="mt-3 text-gray-500 font-medium">Sin {tab === 'delivery' ? 'pedidos' : 'viajes'} aún</p>
        </div>
      ) : tab === 'delivery' ? (
        <div className="space-y-6">
          {activeOrder && (
            <section>
              <h2 className="text-sm font-extrabold text-gray-900 mb-2 px-1">Pedido en curso</h2>
              <Link to={`/pedido/${activeOrder.id}`} className="card block p-4 hover:shadow-card-hover transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-primary-bg rounded-xl flex items-center justify-center shrink-0">
                    <ShoppingBag className="text-primary" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{activeOrder.restaurants?.name || 'Restaurante'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(activeOrder.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <span className={`badge text-xs mt-1 ${activeStatus.color}`}>{activeStatus.label}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-primary">${activeOrder.total?.toLocaleString('es-AR')}</p>
                    <ChevronRight size={16} className="text-gray-300 ml-auto mt-1" />
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="mt-4">
                  <div className="flex items-center">
                    {orderSteps.map((_, idx) => (
                      <Fragment key={idx}>
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0 transition-colors duration-300"
                          style={{ background: idx <= activeStep ? '#0D9488' : '#E9D5D8' }}
                        />
                        {idx < orderSteps.length - 1 && (
                          <div
                            className="flex-1 h-1 rounded-full mx-1 transition-colors duration-300"
                            style={{ background: idx < activeStep ? '#0D9488' : '#E9D5D8' }}
                          />
                        )}
                      </Fragment>
                    ))}
                  </div>
                  <div className="flex justify-between mt-1.5">
                    {orderSteps.map((label, idx) => (
                      <span key={label} className="text-[9px] font-bold" style={{ color: idx <= activeStep ? '#111' : '#9CA3AF' }}>
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </section>
          )}

          {pastOrders.length > 0 && (
            <section>
              <h2 className="text-sm font-extrabold text-gray-900 mb-2 px-1">Pedidos anteriores</h2>
              <div className="space-y-2 grayscale">
                {pastOrders.map(order => {
                  const st = getStatusForOrder(order);
                  return (
                    <Link key={order.id} to={`/pedido/${order.id}`} className="card flex items-center gap-3 p-3 hover:shadow-card-hover transition-all">
                      <div className="w-9 h-9 bg-primary-bg rounded-lg flex items-center justify-center shrink-0">
                        <ShoppingBag className="text-primary" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{order.restaurants?.name || 'Restaurante'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <span className={`badge text-xs mt-1 ${st.color}`}>{st.label}</span>
                      </div>
                      <p className="font-bold text-sm text-primary shrink-0">${order.total?.toLocaleString('es-AR')}</p>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map(trip => {
            const st = TRIP_STATUS_LABEL[trip.status] || TRIP_STATUS_LABEL.searching;
            return (
              <Link key={trip.id} to={`/remis/viaje/${trip.id}`} className="card flex items-center gap-4 p-4 hover:shadow-card-hover transition-all">
                <div className="w-11 h-11 bg-primary-bg rounded-xl flex items-center justify-center shrink-0">
                  <Car className="text-primary" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{trip.origin_address} → {trip.dest_address}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(trip.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <span className={`badge text-xs mt-1 ${st.color}`}>{st.label}</span>
                </div>
                <div className="text-right shrink-0">
                  {trip.estimated_price && <p className="font-bold text-primary">${trip.estimated_price?.toLocaleString('es-AR')}</p>}
                  <ChevronRight size={16} className="text-gray-300 ml-auto mt-1" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}