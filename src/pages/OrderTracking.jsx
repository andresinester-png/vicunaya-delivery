import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, ChefHat, Bike, MessageCircle, Home, ChevronLeft, Bell } from 'lucide-react';
import { supabase, supabaseAdmin } from '../lib/supabase.js';
import { subscribeClientForOrder } from '../lib/pushNotifications.js';

const STATUS_STEPS = [
  { key: 'pending',   icon: Clock,       label: 'Pedido recibido',  desc: 'El restaurante revisará tu pedido',       showEta: false },
  { key: 'accepted',  icon: CheckCircle, label: 'Pedido aceptado',  desc: 'Están preparando tu pedido',             showEta: true  },
  { key: 'preparing', icon: ChefHat,     label: 'En preparación',   desc: 'Tu comida está siendo preparada',        showEta: true  },
  { key: 'ready',     icon: Bike,        label: 'En camino',        desc: 'El repartidor está en camino',           showEta: false },
  { key: 'delivered', icon: CheckCircle, label: '¡Entregado!',      desc: '¡Buen provecho! 🎉',                    showEta: false },
];

export default function OrderTracking() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [order, setOrder]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [notifState, setNotifState] = useState(() => {
    if (typeof Notification === 'undefined') return 'unsupported';
    if (Notification.permission === 'granted')  return 'subscribed';
    if (Notification.permission === 'denied')   return 'denied';
    return 'idle';
  });

  const handleEnableNotifications = async () => {
    setNotifState('loading');
    const ok = await subscribeClientForOrder(id, supabaseAdmin);
    setNotifState(ok ? 'subscribed' : 'denied');
  };

  useEffect(() => {
    const fetchOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, restaurants(name, whatsapp, delivery_time)')
        .eq('id', id)
        .single();
      setOrder(data);
      setLoading(false);
    };
    fetchOrder();

    const channel = supabase
      .channel(`order-${id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        ({ new: updated }) => setOrder(prev => ({ ...prev, ...updated }))
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [id]);

  const openWhatsApp = () => {
    if (!order?.restaurants?.whatsapp) return;
    const msg = `Hola, soy ${order.customer_name}. Consulto por mi pedido #${id.slice(0, 8).toUpperCase()}`;
    window.open(`https://wa.me/${order.restaurants.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-lg mx-auto px-4 py-10 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-2xl" />)}
      </div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-gray-100">
      <div className="text-center py-20 text-gray-400">Pedido no encontrado</div>
    </div>
  );

  if (order.order_status === 'rejected') return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="card p-8 text-center">
          <div className="text-5xl mb-4">😞</div>
          <h2 className="font-bold text-xl text-red-500 mb-2">Pedido rechazado</h2>
          <p className="text-gray-500 text-sm mb-6">El restaurante no puede tomar tu pedido en este momento.</p>
          {order.restaurants?.whatsapp && (
            <button onClick={openWhatsApp} className="btn-outline flex items-center gap-2 mx-auto mb-4">
              <MessageCircle size={16} /> Consultar por WhatsApp
            </button>
          )}
          <Link to="/" className="btn-primary flex items-center gap-2 justify-center mx-auto">
            <Home size={16} /> Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );

  const currentIdx  = STATUS_STEPS.findIndex(s => s.key === order.order_status);
  const deliveryTime = order.restaurants?.delivery_time;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-nav sticky top-0 z-40">
        <div className="h-14 flex items-center px-4 gap-3">
          <button onClick={() => navigate('/pedidos')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold">Seguimiento de pedido</span>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-6">
        <p className="text-sm text-gray-500 mb-4">
          #{id.slice(0, 8).toUpperCase()} · {order.restaurants?.name}
        </p>

        {/* ── Push notification opt-in ── */}
        {notifState === 'idle' && !['delivered', 'rejected'].includes(order.order_status) && (
          <div className="card p-4 mb-4 flex items-center gap-3 bg-blue-50 border border-blue-100">
            <Bell size={20} className="text-blue-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-800">Seguí tu pedido en tiempo real</p>
              <p className="text-xs text-blue-600">Te avisamos cuando el estado cambie</p>
            </div>
            <button
              onClick={handleEnableNotifications}
              className="shrink-0 text-sm font-bold text-white bg-blue-500 px-3 py-1.5 rounded-xl hover:bg-blue-600 transition-colors"
            >
              Activar
            </button>
          </div>
        )}
        {notifState === 'loading' && (
          <div className="card p-4 mb-4 text-center text-sm text-blue-600 animate-pulse">
            Activando notificaciones...
          </div>
        )}
        {notifState === 'subscribed' && !['delivered', 'rejected'].includes(order.order_status) && (
          <div className="card p-4 mb-4 flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-sm">
            <Bell size={16} className="shrink-0" />
            Notificaciones activadas
          </div>
        )}

        {/* ── Timeline ── */}
        <div className="card p-5 mb-4">
          {STATUS_STEPS.map((step, idx) => {
            const Icon   = step.icon;
            const done   = idx <= currentIdx;
            const active = idx === currentIdx;
            const isLast = idx === STATUS_STEPS.length - 1;

            return (
              <div key={step.key} className="flex items-start gap-4">

                {/* Left column: icon + connector line */}
                <div className="flex flex-col items-center self-stretch shrink-0">

                  {/* Icon circle with ping on active step */}
                  <div className="relative w-10 h-10 shrink-0">
                    {active && (
                      <span className="absolute inset-0 rounded-full bg-primary opacity-25 animate-ping" />
                    )}
                    <div className={`relative w-full h-full rounded-full flex items-center justify-center transition-all duration-300 ${
                      done ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
                    } ${active ? 'ring-4 ring-primary/20' : ''}`}>
                      <Icon size={18} />
                    </div>
                  </div>

                  {/* Connector line — grows to fill height of the text row */}
                  {!isLast && (
                    <div className={`w-0.5 grow mt-1.5 rounded-full transition-colors duration-500 ${
                      idx < currentIdx ? 'bg-primary' : 'bg-gray-200'
                    }`} />
                  )}
                </div>

                {/* Right column: text — pb keeps height so connector has room */}
                <div className={`pt-1.5 ${isLast ? 'pb-0' : 'pb-6'}`}>
                  <p className={`font-semibold text-sm leading-tight ${done ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </p>

                  {active && (
                    <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                  )}

                  {/* Estimated time — only on accepted/preparing when active */}
                  {active && step.showEta && deliveryTime && (
                    <p className="text-xs font-semibold text-primary mt-1.5">
                      ⏱ Tiempo estimado: ~{deliveryTime} min
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Resumen del pedido ── */}
        <div className="card p-5 mb-4">
          <h2 className="font-bold text-base mb-3">Tu pedido</h2>
          <div className="space-y-2">
            {(order.items || []).map((item, i) => {
              const lineTotal  = item.price * item.qty + (item.extras || 0) * (item.extra_price || 0);
              const extraText  = item.extras > 0 ? ` + ${item.extras} ${item.extra_label || 'extra'}` : '';
              return (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.qty}x {item.name}{extraText}</span>
                  <span className="font-semibold">${lineTotal.toLocaleString('es-AR')}</span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-neutral-100 mt-3 pt-3 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-primary">${(order.total || 0).toLocaleString('es-AR')}</span>
          </div>
        </div>

        {/* ── Acciones ── */}
        <div className="flex gap-3">
          {order.restaurants?.whatsapp && (
            <button onClick={openWhatsApp} className="btn-outline flex-1 flex items-center justify-center gap-2">
              <MessageCircle size={16} /> WhatsApp
            </button>
          )}
          <Link to="/" className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Home size={16} /> Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
