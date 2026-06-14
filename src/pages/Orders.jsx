import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Car, Clock, ChevronRight, PackageCheck } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import useProfileStore from '../store/profileStore.js';

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

export default function Orders() {
  const phone = useProfileStore(s => s.phone);
  const [orders, setOrders] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('delivery');

  useEffect(() => {
    if (!phone) { setLoading(false); return; }
    const fetch = async () => {
      const [{ data: o }, { data: t }] = await Promise.all([
        supabase.from('orders').select('*, restaurants(name)').eq('customer_phone', phone).order('created_at', { ascending: false }).limit(30),
        supabase.from('trips').select('*').eq('passenger_phone', phone).order('created_at', { ascending: false }).limit(30),
      ]);
      setOrders(o || []);
      setTrips(t || []);
      setLoading(false);
    };
    fetch();
  }, [phone]);

  if (!phone) return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center text-gray-400">
      <ShoppingBag size={52} strokeWidth={1} />
      <p className="mt-4 font-semibold text-gray-600">Guardá tu teléfono en Perfil</p>
      <p className="text-sm mt-1">Así podemos mostrarte tus pedidos anteriores</p>
      <Link to="/perfil" className="btn-primary mt-5 text-sm py-2 px-5">Ir a Perfil</Link>
    </div>
  );

  const empty = tab === 'delivery' ? orders.length === 0 : trips.length === 0;

  return (
    <div className="px-4 py-4">
      {/* Tabs */}
      <div className="flex bg-white rounded-xl p-1 mb-4 border border-neutral-100">
        {[
          ['delivery', ShoppingBag, 'Delivery'],
          // ['remises', Car, 'Remises'], // Remises: deshabilitado temporalmente
        ].map(([key, Icon, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${tab === key ? 'bg-primary text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

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
        <div className="space-y-3">
          {orders.map(order => {
            const st = ORDER_STATUS_LABEL[order.order_status] || ORDER_STATUS_LABEL.pending;
            return (
              <Link key={order.id} to={`/pedido/${order.id}`} className="card flex items-center gap-4 p-4 hover:shadow-card-hover transition-all">
                <div className="w-11 h-11 bg-primary-bg rounded-xl flex items-center justify-center shrink-0">
                  <ShoppingBag className="text-primary" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{order.restaurants?.name || 'Restaurante'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <span className={`badge text-xs mt-1 ${st.color}`}>{st.label}</span>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-primary">${order.total?.toLocaleString('es-AR')}</p>
                  <ChevronRight size={16} className="text-gray-300 ml-auto mt-1" />
                </div>
              </Link>
            );
          })}
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
