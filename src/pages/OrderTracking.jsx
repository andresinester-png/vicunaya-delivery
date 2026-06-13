import { Fragment, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Share2, HelpCircle, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase.js';

const STEPS = ['Confirmado', 'Preparando', 'En camino', 'Entregado'];

const STATUS_INFO = {
  pending:    { step: 0, label: 'En marcha: el local está preparando tu pedido' },
  accepted:   { step: 0, label: 'En marcha: el local está preparando tu pedido' },
  preparing:  { step: 1, label: 'En marcha: el local está preparando tu pedido' },
  ready:      { step: 2, label: 'Tu pedido está en camino' },
  delivered:  { step: 3, label: '¡Tu pedido fue entregado! 🎉' },
};

const PAYMENT_LABELS = {
  cash: 'Efectivo',
  transfer: 'Transferencia bancaria',
  card: 'Tarjeta (MercadoPago)',
};

const ADDRESS_CHANGE_WINDOW = 5 * 60; // segundos

function fmtTime(date) {
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function fmtCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('detalle');
  const [showItems, setShowItems] = useState(false);
  const [addrCountdown, setAddrCountdown] = useState(ADDRESS_CHANGE_WINDOW);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, restaurants(name, whatsapp)')
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

  useEffect(() => {
    const timer = setInterval(() => {
      setAddrCountdown(s => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: 'Mi pedido · VicuñaYa', url }); } catch { /* cancelado por el usuario */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace copiado');
    }
  };

  const handleHelp = () => {
    if (order?.restaurants?.whatsapp) {
      const msg = `Hola, soy ${order.customer_name}. Necesito ayuda con mi pedido #${id.slice(0, 8).toUpperCase()}`;
      window.open(`https://wa.me/${order.restaurants.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      toast('Pronto vas a poder contactar a soporte desde aquí', { icon: 'ℹ️' });
    }
  };

  const handleChangeAddress = () => {
    if (addrCountdown <= 0) return;
    toast('Contactá al local para cambiar la dirección de entrega', { icon: '📍' });
  };

  if (loading) return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 py-6 animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded w-1/2" />
        <div className="h-48 bg-gray-100 rounded-3xl" />
        <div className="h-24 bg-gray-100 rounded-2xl" />
        <div className="h-16 bg-gray-100 rounded-2xl" />
        <div className="h-20 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-gray-400">Pedido no encontrado</p>
    </div>
  );

  if (order.order_status === 'rejected') return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl mb-4">😞</div>
      <h2 className="font-extrabold text-xl text-gray-900 mb-2">Pedido rechazado</h2>
      <p className="text-gray-500 text-sm mb-6">El restaurante no puede tomar tu pedido en este momento.</p>
      {order.restaurants?.whatsapp && (
        <button onClick={handleHelp} className="btn-outline flex items-center gap-2 mb-3">
          <HelpCircle size={16} /> Contactar al local
        </button>
      )}
      <button onClick={() => navigate('/')} className="btn-primary">Volver al inicio</button>
    </div>
  );

  const status = STATUS_INFO[order.order_status] || STATUS_INFO.pending;
  const currentStep = status.step;
  const itemCount = (order.items || []).reduce((sum, i) => sum + (i.qty || 0), 0);

  const orderTime = order.created_at ? new Date(order.created_at) : new Date();
  const etaEnd = new Date(orderTime.getTime() + 30 * 60000);
  const etaRange = `${fmtTime(orderTime)} - ${fmtTime(etaEnd)}`;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2 sticky top-0 z-40 bg-white border-b border-gray-100">
        <button onClick={() => navigate('/')} className="p-2.5 rounded-full hover:bg-gray-100 transition-colors">
          <X size={22} className="text-gray-900" />
        </button>
        <div className="flex items-center gap-1">
          <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors text-sm font-bold text-gray-900">
            <Share2 size={16} /> Compartir
          </button>
          <button onClick={handleHelp} className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors text-sm font-bold text-gray-900">
            <HelpCircle size={16} /> Ayuda
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">

        {/* ── Card de estado ── */}
        <div className="bg-white rounded-3xl shadow-card p-5 mb-4">
          <p className="text-sm font-bold mb-1" style={{ color: '#22c55e' }}>En hora</p>
          <p className="text-2xl font-extrabold text-gray-900 mb-5">{etaRange}</p>

          {/* Barra de progreso */}
          <div className="mb-1">
            <div className="flex items-center">
              {STEPS.map((_, idx) => (
                <Fragment key={idx}>
                  <div
                    className="w-3 h-3 rounded-full shrink-0 transition-colors duration-300"
                    style={{ background: idx <= currentStep ? '#22c55e' : '#E5E7EB' }}
                  />
                  {idx < STEPS.length - 1 && (
                    <div
                      className="flex-1 h-1 rounded-full mx-1 transition-colors duration-300"
                      style={{ background: idx < currentStep ? '#22c55e' : '#E5E7EB' }}
                    />
                  )}
                </Fragment>
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              {STEPS.map((label, idx) => (
                <span
                  key={label}
                  className="text-[10px] font-bold"
                  style={{ color: idx <= currentStep ? '#111' : '#9CA3AF' }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <p className="text-sm font-semibold text-gray-700 mt-4">{status.label}</p>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-gray-100 mb-4">
          <button
            onClick={() => setTab('detalle')}
            className="flex-1 py-3 text-sm font-bold text-center transition-colors"
            style={{
              color: tab === 'detalle' ? '#111' : '#9CA3AF',
              borderBottom: tab === 'detalle' ? '2px solid #111' : '2px solid transparent',
            }}
          >
            Detalle del pedido
          </button>
          <button
            onClick={() => setTab('agregar')}
            className="flex-1 py-3 text-sm font-bold text-center transition-colors"
            style={{
              color: tab === 'agregar' ? '#111' : '#9CA3AF',
              borderBottom: tab === 'agregar' ? '2px solid #111' : '2px solid transparent',
            }}
          >
            Agregar productos
          </button>
        </div>

        {tab === 'detalle' ? (
          <div className="space-y-3">

            {/* Items */}
            <div className="rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shrink-0">🧺</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900">{itemCount} {itemCount === 1 ? 'producto' : 'productos'}</p>
                  <p className="text-xs text-gray-500 truncate">{order.restaurants?.name || 'Restaurante'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowItems(s => !s)}
                  className="shrink-0 text-sm font-bold"
                  style={{ color: '#e31b23' }}
                >
                  Ver detalle
                </button>
              </div>
              {showItems && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  {(order.items || []).map((item, i) => {
                    const lineTotal = item.price * item.qty + (item.extras || 0) * (item.extra_price || 0);
                    const extraText = item.extras > 0 ? ` + ${item.extras} ${item.extra_label || 'extra'}` : '';
                    return (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.qty}x {item.name}{extraText}</span>
                        <span className="font-semibold text-gray-900">${lineTotal.toLocaleString('es-AR')}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pago */}
            <div className="rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shrink-0">💳</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900">{PAYMENT_LABELS[order.payment_method] || 'Pago'}</p>
              </div>
              <p className="font-extrabold text-sm text-gray-900 shrink-0">${(order.total || 0).toLocaleString('es-AR')}</p>
            </div>

            {/* Dirección */}
            <div className="rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shrink-0">📍</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900">Lo recibís en</p>
                  <p className="text-sm text-gray-600 mt-0.5">{order.customer_address}</p>
                </div>
                <button
                  type="button"
                  onClick={handleChangeAddress}
                  disabled={addrCountdown <= 0}
                  className="shrink-0 text-sm font-bold transition-colors"
                  style={{
                    color: addrCountdown > 0 ? '#e31b23' : '#D1D5DB',
                    cursor: addrCountdown > 0 ? 'pointer' : 'not-allowed',
                  }}
                >
                  Cambiar
                </button>
              </div>
              {addrCountdown > 0 && (
                <p className="text-xs text-gray-400 mt-2 ml-[52px]">
                  Podés cambiarla durante {fmtCountdown(addrCountdown)}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 p-6 text-center">
            <p className="text-sm text-gray-500">Por ahora no podés agregar productos a un pedido en curso.</p>
            {order.restaurant_id && (
              <button
                type="button"
                onClick={() => navigate(`/restaurant/${order.restaurant_id}`)}
                className="btn-primary mt-4 text-sm py-2 px-5 inline-flex items-center gap-1"
              >
                Ver menú del restaurante <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
