import { useEffect, useState, useMemo, useCallback } from 'react';
import { ShoppingBag, DollarSign, TrendingUp, Store, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase.js';

const PERIODS = [
  { key: 'today', label: 'Hoy' },
  { key: 'week',  label: 'Esta semana' },
  { key: 'month', label: 'Este mes' },
];

function periodStart(key) {
  const d = new Date();
  if (key === 'today') { d.setHours(0, 0, 0, 0); return d; }
  if (key === 'week') {
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  }
  d.setDate(1); d.setHours(0, 0, 0, 0); return d;
}

function inPeriod(dateStr, key) {
  return new Date(dateStr) >= periodStart(key);
}

function inToday(dateStr) {
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

function inMonth(dateStr) {
  const d = new Date(dateStr);
  const n = new Date();
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

const CARD = 'card rounded-2xl border border-black/[0.04] shadow-[0_2px_16px_rgba(0,0,0,0.06)]';
const fmt  = (n) => Math.round(n).toLocaleString('es-AR');

export default function AdminDashboard() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState('today');

  const fetchOrders = useCallback(async () => {
    const since = new Date();
    since.setDate(since.getDate() - 35);
    const { data } = await supabase
      .from('orders')
      .select('id, restaurant_id, total, order_status, created_at, restaurants(id, name)')
      .neq('order_status', 'rejected')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();

    const channel = supabase.channel('admin-orders-metrics')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, fetchOrders)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, ({ new: o }) =>
        setOrders(prev => prev.map(x => x.id === o.id ? { ...x, ...o } : x))
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchOrders]);

  // Fixed summary cards
  const todayOrders  = useMemo(() => orders.filter(o => inToday(o.created_at)), [orders]);
  const monthOrders  = useMemo(() => orders.filter(o => inMonth(o.created_at)),  [orders]);
  const todayRevenue = useMemo(() => todayOrders.reduce((s, o) => s + (o.total || 0), 0), [todayOrders]);
  const monthRevenue = useMemo(() => monthOrders.reduce((s, o) => s + (o.total || 0), 0), [monthOrders]);

  // Per-restaurant table for selected period
  const periodOrders = useMemo(() => orders.filter(o => inPeriod(o.created_at, period)), [orders, period]);

  const byRestaurant = useMemo(() => {
    const map = {};
    periodOrders.forEach(o => {
      const rid = o.restaurant_id;
      if (!map[rid]) map[rid] = { name: o.restaurants?.name || '—', count: 0, revenue: 0 };
      map[rid].count++;
      map[rid].revenue += o.total || 0;
    });
    return Object.values(map)
      .map(r => ({ ...r, avg: r.count > 0 ? r.revenue / r.count : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [periodOrders]);

  const totalCount   = byRestaurant.reduce((s, r) => s + r.count, 0);
  const totalRevenue = byRestaurant.reduce((s, r) => s + r.revenue, 0);
  const totalAvg     = totalCount > 0 ? totalRevenue / totalCount : 0;

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 bg-gray-200 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-gray-200 rounded-2xl" />
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-extrabold text-2xl">Métricas de pedidos</h1>
        <p className="text-sm text-gray-400 mt-0.5">Todos los restaurantes</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className={`${CARD} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">Pedidos hoy</span>
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <ShoppingBag size={15} className="text-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{todayOrders.length}</p>
        </div>

        <div className={`${CARD} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">Facturado hoy</span>
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign size={15} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-green-700">${fmt(todayRevenue)}</p>
        </div>

        <div className={`${CARD} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">Pedidos este mes</span>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <BarChart3 size={15} className="text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{monthOrders.length}</p>
        </div>

        <div className="card rounded-2xl p-4 bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_8px_24px_rgba(227,27,35,0.3)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-white/80">Facturado este mes</span>
            <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
              <TrendingUp size={15} className="text-white" />
            </div>
          </div>
          <p className="text-2xl font-extrabold">${fmt(monthRevenue)}</p>
        </div>
      </div>

      {/* Per-restaurant breakdown */}
      <div className={CARD}>
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-neutral-100 flex-wrap">
          <h2 className="font-bold text-base flex items-center gap-2">
            <Store size={16} className="text-primary" /> Por restaurante
          </h2>
          <div className="flex gap-1.5">
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  period === p.key
                    ? 'bg-[#111827] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {byRestaurant.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Store size={36} strokeWidth={1} className="mx-auto mb-3" />
            <p className="text-sm">Sin pedidos en este período</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] text-gray-400 uppercase tracking-wider border-b border-neutral-100 bg-[#FAFAFA]">
                    <th className="px-5 py-3 font-semibold">Restaurante</th>
                    <th className="px-5 py-3 font-semibold text-right">Pedidos</th>
                    <th className="px-5 py-3 font-semibold text-right">Facturado</th>
                    <th className="px-5 py-3 font-semibold text-right">Ticket promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {byRestaurant.map((r, i) => (
                    <tr key={i} className="border-b border-neutral-50 last:border-0 hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-gray-800">{r.name}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-gray-900">{r.count}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-green-700">${fmt(r.revenue)}</td>
                      <td className="px-5 py-3.5 text-right text-gray-600">${fmt(r.avg)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t border-neutral-200">
                    <td className="px-5 py-3 font-bold text-gray-700">Total</td>
                    <td className="px-5 py-3 text-right font-extrabold text-gray-900">{totalCount}</td>
                    <td className="px-5 py-3 text-right font-extrabold text-green-700">${fmt(totalRevenue)}</td>
                    <td className="px-5 py-3 text-right font-bold text-gray-500">${fmt(totalAvg)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-neutral-100">
              {byRestaurant.map((r, i) => (
                <div key={i} className="px-4 py-4">
                  <p className="font-bold text-gray-800 mb-3">{r.name}</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 rounded-xl p-2.5">
                      <p className="text-xl font-extrabold text-gray-900">{r.count}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">pedidos</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-2.5">
                      <p className="text-sm font-extrabold text-green-700 leading-snug">${fmt(r.revenue)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">facturado</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2.5">
                      <p className="text-sm font-extrabold text-gray-600 leading-snug">${fmt(r.avg)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">promedio</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="px-4 py-4 bg-gray-50 border-t border-neutral-200">
                <p className="font-bold text-gray-700 mb-3">Total</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white rounded-xl p-2.5 border border-neutral-100">
                    <p className="text-xl font-extrabold text-gray-900">{totalCount}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">pedidos</p>
                  </div>
                  <div className="bg-white rounded-xl p-2.5 border border-neutral-100">
                    <p className="text-sm font-extrabold text-green-700 leading-snug">${fmt(totalRevenue)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">facturado</p>
                  </div>
                  <div className="bg-white rounded-xl p-2.5 border border-neutral-100">
                    <p className="text-sm font-extrabold text-gray-600 leading-snug">${fmt(totalAvg)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">promedio</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
