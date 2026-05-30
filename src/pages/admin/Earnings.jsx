import { useEffect, useState } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase.js';

const PAYMENT_LABELS = { card: 'Tarjeta', transfer: 'Transferencia', cash: 'Efectivo' };

export default function Earnings() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('week'); // 'today' | 'week' | 'month'

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('order_status', 'delivered')
        .order('created_at', { ascending: false });
      setOrders(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const now = new Date();
  const filtered = orders.filter(o => {
    const date = new Date(o.created_at);
    if (range === 'today') return date.toDateString() === now.toDateString();
    if (range === 'week') return (now - date) < 7 * 24 * 60 * 60 * 1000;
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const totalRevenue = filtered.reduce((s, o) => s + (o.total || 0), 0);
  const avgOrder = filtered.length ? totalRevenue / filtered.length : 0;

  const byPayment = filtered.reduce((acc, o) => {
    acc[o.payment_method] = (acc[o.payment_method] || 0) + (o.total || 0);
    return acc;
  }, {});

  // Agrupar por día para el gráfico (últimos 7 días)
  const dailyRevenue = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dayOrders = orders.filter(o => new Date(o.created_at).toDateString() === d.toDateString());
    return {
      label: d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' }),
      total: dayOrders.reduce((s, o) => s + (o.total || 0), 0),
    };
  });
  const maxDaily = Math.max(...dailyRevenue.map(d => d.total), 1);

  if (loading) return <div className="animate-pulse space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-2xl" />)}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-extrabold text-2xl">Ganancias</h1>
        <div className="flex gap-2">
          {[['today', 'Hoy'], ['week', '7 días'], ['month', 'Este mes']].map(([key, label]) => (
            <button key={key} onClick={() => setRange(key)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${range === key ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-neutral-200'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-bg rounded-xl flex items-center justify-center">
            <DollarSign className="text-primary" size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total facturado</p>
            <p className="text-2xl font-extrabold text-primary">${totalRevenue.toLocaleString('es-AR')}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
            <ShoppingBag className="text-green-600" size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Pedidos entregados</p>
            <p className="text-2xl font-extrabold text-green-600">{filtered.length}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <TrendingUp className="text-blue-600" size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Ticket promedio</p>
            <p className="text-2xl font-extrabold text-blue-600">${Math.round(avgOrder).toLocaleString('es-AR')}</p>
          </div>
        </div>
      </div>

      {/* Gráfico de barras - últimos 7 días */}
      <div className="card p-5 mb-6">
        <h2 className="font-bold text-base mb-4 flex items-center gap-2"><Calendar size={16} className="text-primary" /> Últimos 7 días</h2>
        <div className="flex items-end gap-2 h-32">
          {dailyRevenue.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500">${day.total > 0 ? (day.total / 1000).toFixed(0) + 'k' : '0'}</span>
              <div className="w-full rounded-t-lg bg-primary-bg overflow-hidden" style={{ height: '80px' }}>
                <div
                  className="bg-primary rounded-t-lg w-full transition-all duration-500"
                  style={{ height: `${(day.total / maxDaily) * 100}%`, minHeight: day.total > 0 ? '4px' : '0' }}
                />
              </div>
              <span className="text-xs text-gray-400">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Por método de pago */}
      <div className="card p-5 mb-6">
        <h2 className="font-bold text-base mb-4">Por método de pago</h2>
        <div className="space-y-3">
          {Object.entries(byPayment).map(([method, amount]) => (
            <div key={method} className="flex items-center gap-3">
              <span className="text-sm font-medium w-28 text-gray-600">{PAYMENT_LABELS[method] || method}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${(amount / totalRevenue) * 100}%` }} />
              </div>
              <span className="text-sm font-bold w-24 text-right">${amount.toLocaleString('es-AR')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Historial */}
      <div className="card p-5">
        <h2 className="font-bold text-base mb-4">Historial de pedidos</h2>
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Sin pedidos entregados en este período</p>
          ) : filtered.map(order => (
            <div key={order.id} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
              <div>
                <p className="text-sm font-semibold">{order.customer_name}</p>
                <p className="text-xs text-gray-400">
                  {new Date(order.created_at).toLocaleDateString('es-AR')} · {PAYMENT_LABELS[order.payment_method]}
                </p>
              </div>
              <span className="font-bold text-primary">${(order.total || 0).toLocaleString('es-AR')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
