import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ChevronRight, Check, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import useProfileStore from '../store/profileStore.js';
import { useAuth } from '../context/AuthContext.jsx';
import { KYVRA } from '../lib/theme.js';

const FF = "'Plus Jakarta Sans', sans-serif";

const ACTIVE_STATUSES = ['pending', 'accepted', 'preparing', 'ready'];
const PAST_STATUSES   = ['delivered', 'rejected'];

const ORDER_STEP_INDEX = { pending: 0, accepted: 0, preparing: 1, ready: 2, delivered: 3 };

const STATUS_BADGE = {
  pending:   { label: 'Pendiente',          bg: 'rgba(245,158,11,0.13)', color: '#B45309' },
  accepted:  { label: 'Aceptado',           bg: 'rgba(59,130,246,0.13)', color: '#2563EB' },
  preparing: { label: 'Preparando',         bg: 'rgba(59,130,246,0.13)', color: '#2563EB' },
  ready:     { label: 'En camino',          bg: KYVRA.tealBg,            color: KYVRA.tealDark },
  delivered: { label: 'Entregado',          bg: 'rgba(22,163,74,0.13)',  color: '#15803D' },
  rejected:  { label: 'Rechazado',          bg: 'rgba(239,68,68,0.13)',  color: '#DC2626' },
};

const ACTIVE_STATUS_DARK = {
  pending:   { label: 'Pendiente',  bg: 'rgba(245,158,11,0.18)', color: '#FCD34D' },
  accepted:  { label: 'Aceptado',   bg: 'rgba(96,165,250,0.18)', color: '#93C5FD' },
  preparing: { label: 'Preparando', bg: 'rgba(96,165,250,0.18)', color: '#93C5FD' },
  ready:     { label: 'En camino',  bg: 'rgba(94,234,212,0.18)', color: '#5EEAD4' },
};

function getStatusBadge(order) {
  const base = STATUS_BADGE[order.order_status] || STATUS_BADGE.pending;
  if (order.order_status === 'ready' && order.delivery_method === 'pickup') {
    return { ...base, label: 'Listo para retirar' };
  }
  return base;
}

function getActiveBadge(order) {
  const base = ACTIVE_STATUS_DARK[order.order_status] || ACTIVE_STATUS_DARK.pending;
  if (order.order_status === 'ready' && order.delivery_method === 'pickup') {
    return { ...base, label: 'Listo para retirar' };
  }
  return base;
}

function fmt(iso) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

const SHIMMER = {
  background: 'linear-gradient(90deg,#f0f4f8 25%,#e2e8f0 50%,#f0f4f8 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s infinite',
  borderRadius: 16,
};

const SECTION_LABEL = {
  display: 'block',
  fontSize: 11, fontWeight: 700,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  color: KYVRA.textMuted, marginBottom: 10,
  fontFamily: FF,
};

function PastOrderCard({ order }) {
  const [imgError, setImgError] = useState(false);
  const st  = getStatusBadge(order);
  const img = order.restaurants?.image_url;

  return (
    <Link
      to={`/pedido/${order.id}`}
      style={{
        background: KYVRA.white,
        border: `1px solid ${KYVRA.border}`,
        borderRadius: 20,
        boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 14px', textDecoration: 'none',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: KYVRA.tealBg, flexShrink: 0,
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {(img && !imgError) ? (
          <img
            src={img}
            alt={order.restaurants?.name}
            loading="lazy"
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <ShoppingBag size={20} color={KYVRA.teal} strokeWidth={1.6} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14, fontWeight: 700, color: KYVRA.navy,
          margin: '0 0 2px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {order.restaurants?.name || 'Restaurante'}
        </p>
        <p style={{ fontSize: 11.5, color: KYVRA.textMuted, margin: '0 0 5px' }}>
          {fmt(order.created_at)}
        </p>
        <span style={{
          fontSize: 10.5, fontWeight: 700,
          padding: '3px 8px', borderRadius: 99,
          background: st.bg, color: st.color, display: 'inline-block',
        }}>
          {st.label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <p style={{ fontSize: 14.5, fontWeight: 800, color: KYVRA.navy, margin: 0, letterSpacing: '-0.01em' }}>
          ${order.total?.toLocaleString('es-AR')}
        </p>
        <ChevronRight size={16} color={KYVRA.textMuted} strokeWidth={2} />
      </div>
    </Link>
  );
}

export default function Orders() {
  const phone  = useProfileStore(s => s.phone);
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId && !phone) { setLoading(false); return; }

    const doFetch = async () => {
      let q = supabase
        .from('orders')
        .select('*, restaurants(name, image_url)')
        .order('created_at', { ascending: false })
        .limit(30);
      if (userId) q = q.eq('user_id', userId);
      else        q = q.eq('customer_phone', phone);
      const { data } = await q;
      setOrders(data || []);
      setLoading(false);
    };

    doFetch();

    if (userId) {
      const channel = supabase
        .channel(`client-orders-${userId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` },
          ({ new: updated }) =>
            setOrders(prev =>
              prev.map(o => o.id === updated.id ? { ...updated, restaurants: o.restaurants } : o)
            )
        )
        .subscribe();
      return () => supabase.removeChannel(channel);
    } else {
      const interval = setInterval(doFetch, 15000);
      return () => clearInterval(interval);
    }
  }, [userId, phone]);

  /* ── Unauthenticated ── */
  if (!loading && !userId && !phone) {
    return (
      <>
        <style>{`@keyframes shimmer{from{background-position:200% 0}to{background-position:-200% 0}}`}</style>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '80px 24px', textAlign: 'center',
          fontFamily: FF,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 24,
            background: KYVRA.tealBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
          }}>
            <ShoppingBag size={34} color={KYVRA.teal} strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: KYVRA.navy, margin: '0 0 8px', letterSpacing: '-0.02em', fontFamily: FF }}>
            Iniciá sesión para ver tus pedidos
          </h3>
          <p style={{ fontSize: 13.5, color: KYVRA.textSec, margin: '0 0 28px', lineHeight: 1.55 }}>
            O guardá tu teléfono en Perfil<br />si pediste como invitado
          </p>
          <Link to="/perfil" style={{
            display: 'inline-block',
            background: KYVRA.teal, color: '#fff',
            fontFamily: FF, fontWeight: 700, fontSize: 14,
            padding: '11px 28px', borderRadius: 14,
            textDecoration: 'none',
          }}>
            Ir a Perfil
          </Link>
        </div>
      </>
    );
  }

  const activeOrder = orders.find(o => ACTIVE_STATUSES.includes(o.order_status));
  const pastOrders  = orders.filter(o => PAST_STATUSES.includes(o.order_status));
  const activeStep  = activeOrder ? (ORDER_STEP_INDEX[activeOrder.order_status] ?? 0) : 0;
  const orderSteps  = [
    'Confirmado',
    'Preparando',
    activeOrder?.delivery_method === 'pickup' ? 'Listo para retirar' : 'En camino',
    'Entregado',
  ];

  return (
    <>
      <style>{`
        @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
        @keyframes pulse-dot { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.65; transform:scale(.82); } }
      `}</style>

      <div style={{ padding: '20px 16px 8px', fontFamily: FF }}>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ ...SHIMMER, height: 90 }} />
            ))}
          </div>
        )}

        {!loading && (
          <>
            {/* ── Pedido actual ── */}
            {activeOrder ? (
              <section style={{ marginBottom: 28 }}>
                <span style={SECTION_LABEL}>Pedido actual</span>

                <div style={{
                  background: 'linear-gradient(145deg, #0F172A 0%, #1E293B 55%, #0F2A28 100%)',
                  borderRadius: 22,
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.24), 0 0 0 1px rgba(94,234,212,0.08)',
                  position: 'relative',
                }}>
                  {/* Teal ambient glow */}
                  <div style={{ position: 'absolute', bottom: -30, left: -20, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

                  {/* Info row */}
                  <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: 'rgba(13,148,136,0.22)', border: '1px solid rgba(94,234,212,0.20)',
                        flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <ShoppingBag size={20} color="#5EEAD4" strokeWidth={1.8} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 3px', letterSpacing: '-0.01em' }}>
                          {activeOrder.restaurants?.name || 'Restaurante'}
                        </p>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', margin: 0 }}>
                          {fmt(activeOrder.created_at)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: 17, fontWeight: 900, color: '#5EEAD4', margin: '0 0 5px', letterSpacing: '-0.02em' }}>
                          ${activeOrder.total?.toLocaleString('es-AR')}
                        </p>
                        {(() => {
                          const st = getActiveBadge(activeOrder);
                          return (
                            <span style={{
                              fontSize: 10.5, fontWeight: 700,
                              padding: '3px 9px', borderRadius: 99,
                              background: st.bg, color: st.color,
                              display: 'inline-block',
                            }}>
                              {st.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Vertical timeline */}
                  <div style={{ padding: '18px 20px 14px', position: 'relative' }}>
                    {orderSteps.map((step, idx) => {
                      const isDone   = idx < activeStep;
                      const isActive = idx === activeStep;
                      const isFuture = idx > activeStep;
                      const isLast   = idx === orderSteps.length - 1;

                      return (
                        <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, minHeight: isLast ? 'auto' : 40 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 20 }}>
                            <div style={{
                              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                              background: (isDone || isActive) ? '#0D9488' : 'transparent',
                              border: isFuture ? '2px solid rgba(255,255,255,0.15)' : 'none',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              animation: isActive ? 'pulse-dot 1.8s ease-in-out infinite' : 'none',
                              boxShadow: isActive ? '0 0 0 4px rgba(13,148,136,0.20)' : 'none',
                            }}>
                              {isDone && <Check size={10} color="#fff" strokeWidth={3.5} />}
                            </div>
                            {!isLast && (
                              <div style={{
                                width: 2, flex: 1, minHeight: 20,
                                background: isDone ? '#0D9488' : 'rgba(255,255,255,0.12)',
                                borderRadius: 2, marginTop: 3,
                              }} />
                            )}
                          </div>
                          <p style={{
                            fontSize: 13.5,
                            fontWeight: isActive ? 800 : isDone ? 600 : 500,
                            color: isActive ? '#5EEAD4' : isDone ? '#fff' : 'rgba(255,255,255,0.28)',
                            margin: '1px 0 0', lineHeight: 1.35, fontFamily: FF,
                          }}>
                            {step}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* CTA link */}
                  <div style={{ padding: '0 16px 16px', position: 'relative' }}>
                    <Link to={`/pedido/${activeOrder.id}`} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      width: '100%', padding: '13px 0', boxSizing: 'border-box',
                      background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
                      borderRadius: 14, textDecoration: 'none',
                      fontSize: 13.5, fontWeight: 700, color: '#fff', fontFamily: FF,
                      boxShadow: '0 4px 16px rgba(13,148,136,0.32)',
                    }}>
                      Ver seguimiento completo
                      <ChevronRight size={15} strokeWidth={2.5} />
                    </Link>
                  </div>
                </div>
              </section>
            ) : null}

            {/* ── Historial de pedidos ── */}
            <section style={{ marginTop: activeOrder ? 0 : 8 }}>
              {/* Deep layered gradient header */}
              <div style={{
                background: 'linear-gradient(160deg, #061118 0%, #0A1E2A 28%, #0D3A35 55%, #0F172A 100%)',
                borderRadius: 18,
                padding: '16px 18px',
                marginBottom: 14,
                boxShadow: '0 8px 28px rgba(0,0,0,0.22), 0 0 0 1px rgba(94,234,212,0.06)',
                display: 'flex', alignItems: 'center', gap: 12,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{
                  width: 36, height: 36, borderRadius: 11,
                  background: 'rgba(13,148,136,0.22)', border: '1px solid rgba(94,234,212,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  position: 'relative',
                }}>
                  <Clock size={17} color="#5EEAD4" strokeWidth={2.2} />
                </div>
                <div style={{ position: 'relative' }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.01em', fontFamily: FF }}>
                    Historial de pedidos
                  </p>
                  {pastOrders.length > 0 && (
                    <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.48)', margin: '2px 0 0', fontFamily: FF }}>
                      {pastOrders.length} {pastOrders.length === 1 ? 'pedido anterior' : 'pedidos anteriores'}
                    </p>
                  )}
                </div>
              </div>

              {pastOrders.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pastOrders.map(order => (
                    <PastOrderCard key={order.id} order={order} />
                  ))}
                </div>
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '28px 24px', textAlign: 'center',
                  background: KYVRA.white,
                  border: `1px solid ${KYVRA.border}`,
                  borderRadius: 16,
                }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: KYVRA.navy, margin: '0 0 6px', fontFamily: FF }}>
                    Sin pedidos anteriores
                  </p>
                  <p style={{ fontSize: 12.5, color: KYVRA.textMuted, margin: 0, lineHeight: 1.5 }}>
                    Tus pedidos completados aparecerán acá
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}
