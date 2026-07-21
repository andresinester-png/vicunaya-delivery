import { useEffect, useState } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, Calendar, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase.js';
import { useRestaurant } from '../../contexts/RestaurantContext.js';

const PAYMENT_LABELS = { card: 'Tarjeta', transfer: 'Transferencia', cash: 'Efectivo' };

const T = {
  navy: '#0F172A', teal: '#0D9488', tealDark: '#0F766E', tealSec: '#14B8A6',
  tealLight: '#5EEAD4', bg: '#F8FAFC', white: '#FFFFFF',
  textSec: '#64748B', textMuted: '#94A3B8', border: '#E2E8F0',
};
const FF = "'Plus Jakarta Sans', sans-serif";
const GH = 'linear-gradient(160deg, #061118 0%, #0A1E2A 28%, #0D3A35 55%, #0F172A 100%)';
const GTEAL = 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)';

const PAYMENT_COLORS = {
  transfer: '#0D9488',
  card:     '#14B8A6',
  cash:     '#334155',
};

const PERIOD_LABELS = { today: 'Hoy', week: 'Últimos 7 días', month: 'Este mes' };

const STYLES = `
  .kv-earn-tab:hover { background: rgba(255,255,255,0.14) !important; }
  .kv-order-row:hover { background: rgba(13,148,136,0.04) !important; }
  .kv-kpi-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
  @media (min-width: 640px) { .kv-kpi-grid { grid-template-columns: repeat(3, 1fr); } }
`;

export default function Earnings() {
  const restaurant = useRestaurant();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [range,   setRange]   = useState('week');

  useEffect(() => {
    if (!restaurant) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('order_status', 'delivered')
        .order('created_at', { ascending: false });
      setOrders(data || []);
      setLoading(false);
    };
    fetch();
  }, [restaurant]);

  const now = new Date();
  const filtered = orders.filter(o => {
    const date = new Date(o.created_at);
    if (range === 'today') return date.toDateString() === now.toDateString();
    if (range === 'week')  return (now - date) < 7 * 24 * 60 * 60 * 1000;
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const totalRevenue = filtered.reduce((s, o) => s + (o.total || 0), 0);
  const avgOrder     = filtered.length ? totalRevenue / filtered.length : 0;
  const byPayment    = filtered.reduce((acc, o) => {
    acc[o.payment_method] = (acc[o.payment_method] || 0) + (o.total || 0);
    return acc;
  }, {});

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

  if (loading) return (
    <div style={{ fontFamily: FF, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1280 }}>
      <div style={{ background: GH, borderRadius: 20, height: 148, opacity: 0.85 }} />
      <div className="kv-kpi-grid">
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ height: 96, background: T.border, borderRadius: 16, opacity: 0.38 + i * 0.08 }} />
        ))}
      </div>
      {[160, 180, 200].map((h, i) => (
        <div key={i} style={{ height: h, background: T.border, borderRadius: 16, opacity: 0.30 + i * 0.05 }} />
      ))}
    </div>
  );

  const today = now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

  const CARD = {
    background: T.white, borderRadius: 16,
    border: `1.5px solid ${T.border}`,
    boxShadow: '0 2px 8px rgba(15,23,42,0.05)',
    padding: 20,
  };

  const SH = ({ Icon, children, trailing }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(13,148,136,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={14} color={T.teal} strokeWidth={2} />
      </div>
      <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.navy, letterSpacing: '-0.2px', fontFamily: FF, flex: 1 }}>
        {children}
      </h2>
      {trailing}
    </div>
  );

  return (
    <div style={{ fontFamily: FF, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1280 }}>
      <style>{STYLES}</style>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div style={{ background: GH, borderRadius: 20, padding: '22px 20px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, background: 'radial-gradient(circle, rgba(13,148,136,0.22) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, background: 'radial-gradient(circle, rgba(13,148,136,0.10) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(13,148,136,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TrendingUp size={14} color={T.tealLight} strokeWidth={2} />
              </div>
              <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 1.6, color: T.tealLight, textTransform: 'uppercase', fontFamily: FF }}>
                Finanzas · Kyvra
              </span>
            </div>

            <h1 style={{ margin: '0 0 3px', fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.1, fontFamily: FF }}>
              Ganancias
            </h1>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: 'rgba(255,255,255,0.50)', lineHeight: 1.4, fontFamily: FF }}>
              Resumen financiero del restaurante
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ padding: '4px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: FF, background: 'rgba(13,148,136,0.18)', color: T.tealLight, border: '1px solid rgba(13,148,136,0.30)' }}>
                {PERIOD_LABELS[range]}
              </span>
              <span style={{ padding: '4px 11px', borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: FF, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.10)' }}>
                {today}
              </span>
            </div>
          </div>

          {/* Range tabs */}
          <div style={{ display: 'flex', gap: 6, alignSelf: 'flex-start', flexShrink: 0, flexWrap: 'wrap' }}>
            {[['today', 'Hoy'], ['week', '7 días'], ['month', 'Mes']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setRange(key)}
                className="kv-earn-tab"
                style={{
                  padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  background: range === key ? GTEAL : 'rgba(255,255,255,0.08)',
                  color: range === key ? '#fff' : 'rgba(255,255,255,0.65)',
                  border: `1.5px solid ${range === key ? 'transparent' : 'rgba(255,255,255,0.12)'}`,
                  cursor: 'pointer', fontFamily: FF, transition: 'background 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI cards ─────────────────────────────────────────────── */}
      <div className="kv-kpi-grid">
        {/* Facturación */}
        <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 50, height: 50, borderRadius: 14, background: GTEAL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(13,148,136,0.32)' }}>
            <DollarSign size={22} color="#fff" strokeWidth={2} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.9, fontFamily: FF }}>Facturación</p>
            <p style={{ margin: '3px 0 0', fontSize: 27, fontWeight: 900, color: T.teal, letterSpacing: '-0.5px', lineHeight: 1, fontFamily: FF }}>
              ${totalRevenue.toLocaleString('es-AR')}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: T.textMuted, fontFamily: FF }}>Pedidos entregados</p>
          </div>
        </div>

        {/* Pedidos entregados */}
        <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 50, height: 50, borderRadius: 14, background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(15,118,110,0.32)' }}>
            <ShoppingBag size={22} color="#fff" strokeWidth={2} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.9, fontFamily: FF }}>Pedidos entregados</p>
            <p style={{ margin: '3px 0 0', fontSize: 27, fontWeight: 900, color: T.tealDark, letterSpacing: '-0.5px', lineHeight: 1, fontFamily: FF }}>
              {filtered.length}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: T.textMuted, fontFamily: FF }}>En el período seleccionado</p>
          </div>
        </div>

        {/* Ticket promedio */}
        <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 50, height: 50, borderRadius: 14, background: 'linear-gradient(135deg, #0A1E2A 0%, #0F172A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(15,23,42,0.28)' }}>
            <TrendingUp size={22} color={T.tealLight} strokeWidth={2} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.9, fontFamily: FF }}>Ticket promedio</p>
            <p style={{ margin: '3px 0 0', fontSize: 27, fontWeight: 900, color: T.navy, letterSpacing: '-0.5px', lineHeight: 1, fontFamily: FF }}>
              ${Math.round(avgOrder).toLocaleString('es-AR')}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: T.textMuted, fontFamily: FF }}>Por pedido</p>
          </div>
        </div>
      </div>

      {/* ── Bar chart — Últimos 7 días ─────────────────────────────── */}
      <div style={CARD}>
        <SH Icon={Calendar}>Últimos 7 días</SH>

        {/* Bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, marginTop: 4 }}>
          {dailyRevenue.map((day, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              <span style={{
                fontSize: 9.5, fontWeight: 700, fontFamily: FF, whiteSpace: 'nowrap',
                color: day.total > 0 ? T.teal : T.textMuted,
              }}>
                {day.total > 0 ? `$${(day.total / 1000).toFixed(0)}k` : '0'}
              </span>
              <div style={{ width: '100%', height: 88, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', borderRadius: '6px 6px 4px 4px', overflow: 'hidden', background: 'rgba(13,148,136,0.07)' }}>
                <div style={{
                  width: '100%',
                  height: `${(day.total / maxDaily) * 100}%`,
                  minHeight: day.total > 0 ? 4 : 0,
                  background: GTEAL,
                  borderRadius: '5px 5px 0 0',
                  transition: 'height 0.5s cubic-bezier(0.4,0,0.2,1)',
                }} />
              </div>
              <span style={{ fontSize: 9, color: T.textMuted, fontFamily: FF, textAlign: 'center', lineHeight: 1.25 }}>
                {day.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Payment breakdown ──────────────────────────────────────── */}
      {Object.keys(byPayment).length > 0 && (
        <div style={CARD}>
          <SH Icon={CreditCard}>Métodos de pago</SH>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(byPayment).map(([method, amount]) => {
              const pct = (amount / totalRevenue) * 100;
              const color = PAYMENT_COLORS[method] || T.teal;
              return (
                <div key={method}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: FF }}>
                        {PAYMENT_LABELS[method] || method}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, fontFamily: FF }}>
                        {Math.round(pct)}%
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: T.navy, fontFamily: FF, minWidth: 88, textAlign: 'right' }}>
                        ${amount.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 6, borderRadius: 6, background: `${color}18`, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 6,
                      width: `${(amount / totalRevenue) * 100}%`,
                      background: color,
                      transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Order history ─────────────────────────────────────────── */}
      <div style={CARD}>
        <SH
          Icon={ShoppingBag}
          trailing={
            filtered.length > 0
              ? <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'rgba(13,148,136,0.10)', color: T.teal, fontFamily: FF }}>
                  {filtered.length}
                </span>
              : null
          }
        >
          Historial de pedidos
        </SH>

        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', gap: 10 }}>
            <div style={{ width: 54, height: 54, borderRadius: 16, background: T.bg, border: `1.5px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={22} color={T.textMuted} strokeWidth={1.5} />
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.navy, fontFamily: FF }}>Sin pedidos entregados</p>
            <p style={{ margin: 0, fontSize: 12, color: T.textMuted, fontFamily: FF }}>en este período</p>
          </div>
        ) : (
          <div>
            {filtered.map((order, idx) => (
              <div
                key={order.id}
                className="kv-order-row"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  padding: '11px 10px', borderRadius: 10,
                  borderBottom: idx < filtered.length - 1 ? `1px solid ${T.border}` : 'none',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: FF, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {order.customer_name}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: T.textMuted, fontFamily: FF }}>
                    {new Date(order.created_at).toLocaleDateString('es-AR')} · {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{
                    padding: '3px 9px', borderRadius: 8, fontSize: 10.5, fontWeight: 700, fontFamily: FF,
                    background: `${PAYMENT_COLORS[order.payment_method] || T.teal}14`,
                    color: PAYMENT_COLORS[order.payment_method] || T.teal,
                  }}>
                    {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 900, color: T.teal, fontFamily: FF, letterSpacing: '-0.2px' }}>
                    ${(order.total || 0).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
