import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ShoppingCart, X, StickyNote, Plus, Minus, MapPin,
  Clock, CheckCircle, Truck, Package, Utensils,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase.js';
import useCartStore from '../store/cartStore.js';
import { KYVRA } from '../lib/theme.js';

const STATUS_INFO = {
  pending:   { step: 0, label: 'Recibimos tu pedido, el local va a confirmarlo pronto' },
  accepted:  { step: 0, label: 'El local confirmó tu pedido y está por comenzar' },
  preparing: { step: 1, label: 'En marcha: el local está preparando tu pedido' },
  ready:     { step: 2, label: 'Tu pedido está en camino' },
  delivered: { step: 3, label: '¡Tu pedido fue entregado!' },
};

const PAYMENT_LABELS = {
  cash:     'Efectivo',
  transfer: 'Transferencia bancaria',
  card:     'Tarjeta (MercadoPago)',
};

const ADDRESS_CHANGE_WINDOW = 5 * 60;
const ADD_ITEMS_WINDOW      = 3 * 60;

function fmtTime(date) {
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}
function fmtCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const FF = "'Plus Jakarta Sans', sans-serif";

const CSS = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulseRing {
    0%   { box-shadow: 0 0 0 0 rgba(13,148,136,0.45); }
    65%  { box-shadow: 0 0 0 10px rgba(13,148,136,0); }
    100% { box-shadow: 0 0 0 0 rgba(13,148,136,0); }
  }
  @keyframes dotPulse {
    0%,100% { opacity: 1; transform: scale(1); }
    50%     { opacity: 0.5; transform: scale(0.75); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
`;

const skeletonStyle = {
  background: 'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s ease-in-out infinite',
  borderRadius: 12,
};

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '13px 14px', borderRadius: 13,
  border: `1.5px solid ${KYVRA.border}`,
  fontSize: 14, fontWeight: 500, color: KYVRA.navy,
  background: KYVRA.white, outline: 'none', fontFamily: FF,
};

const card = {
  background: KYVRA.white,
  border: `1px solid ${KYVRA.border}`,
  borderRadius: 20,
  boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
};

const iconBox = {
  width: 44, height: 44, borderRadius: 14,
  background: KYVRA.tealBg,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
};

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cartCount = useCartStore(s => s.count());

  const [order,            setOrder]            = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [now,              setNow]              = useState(() => Date.now());
  const [addrModalOpen,    setAddrModalOpen]    = useState(false);
  const [addrForm,         setAddrForm]         = useState({ address: '', notes: '' });
  const [savingAddr,       setSavingAddr]       = useState(false);
  const [menuItems,        setMenuItems]        = useState([]);
  const [menuLoading,      setMenuLoading]      = useState(false);
  const [addQty,           setAddQty]           = useState({});
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [addingItems,      setAddingItems]      = useState(false);
  const [showAddSection,   setShowAddSection]   = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, restaurants(name, pickup_address)')
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
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!showAddSection || !order?.restaurant_id || menuItems.length > 0) return;
    setMenuLoading(true);
    supabase
      .from('menu_items')
      .select('id, name, price, image_url')
      .eq('restaurant_id', order.restaurant_id)
      .eq('is_available', true)
      .order('sort_order')
      .then(({ data }) => { setMenuItems(data || []); setMenuLoading(false); });
  }, [showAddSection, order?.restaurant_id]);

  const handleChangeAddress = (countdown) => {
    if (countdown <= 0) return;
    setAddrForm({ address: order.customer_address || '', notes: order.delivery_notes || '' });
    setAddrModalOpen(true);
  };

  const saveAddressInfo = async () => {
    if (!addrForm.address.trim()) { toast.error('Ingresá la dirección'); return; }
    setSavingAddr(true);
    try {
      const address = addrForm.address.trim();
      const notes   = addrForm.notes.trim() || null;
      const { error } = await supabase.rpc('update_order_delivery_info', {
        p_order_id: id, p_customer_address: address, p_delivery_notes: notes,
      });
      if (error) throw error;
      setOrder(prev => ({ ...prev, customer_address: address, delivery_notes: notes }));
      setAddrModalOpen(false);
      toast.success('Dirección actualizada');
    } catch (err) {
      toast.error('No se pudo actualizar: ' + err.message);
    } finally {
      setSavingAddr(false);
    }
  };

  const incQty = (itemId) => setAddQty(q => ({ ...q, [itemId]: (q[itemId] || 0) + 1 }));
  const decQty = (itemId) => setAddQty(q => {
    const next = (q[itemId] || 0) - 1;
    const copy = { ...q };
    if (next <= 0) delete copy[itemId]; else copy[itemId] = next;
    return copy;
  });

  const handleConfirmAddItems = async (selectedItems, newSubtotal) => {
    setAddingItems(true);
    try {
      const { data, error } = await supabase.rpc('add_items_to_order', {
        p_order_id: id, p_new_items: selectedItems, p_new_items_total: newSubtotal,
      });
      if (error) throw error;
      setOrder(prev => ({ ...prev, ...data }));
      setAddQty({});
      setConfirmModalOpen(false);
      setShowAddSection(false);
      toast.success('Productos agregados al pedido');
    } catch (err) {
      toast.error('No se pudo actualizar el pedido: ' + err.message);
    } finally {
      setAddingItems(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100dvh', background: KYVRA.bg, fontFamily: FF }}>
      <style>{CSS}</style>
      <header style={{ height: 56, background: KYVRA.white, borderBottom: `1px solid ${KYVRA.border}` }} />
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ ...skeletonStyle, height: 22, width: '38%' }} />
        <div style={{ ...skeletonStyle, height: 34, width: '65%' }} />
        <div style={{ ...skeletonStyle, height: 200 }} />
        <div style={{ ...skeletonStyle, height: 120 }} />
        <div style={{ ...skeletonStyle, height: 160 }} />
      </div>
    </div>
  );

  if (!order) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: KYVRA.bg }}>
      <p style={{ color: KYVRA.textMuted, fontSize: 14, fontFamily: FF }}>Pedido no encontrado</p>
    </div>
  );

  if (order.order_status === 'rejected') return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center', background: KYVRA.bg, fontFamily: FF }}>
      <div style={{ width: 76, height: 76, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
        <X size={34} color="#EF4444" />
      </div>
      <h2 style={{ fontWeight: 900, fontSize: 22, color: KYVRA.navy, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Pedido rechazado</h2>
      <p style={{ fontSize: 14, color: KYVRA.textSec, margin: '0 0 28px', lineHeight: 1.5 }}>El restaurante no puede tomar tu pedido en este momento.</p>
      <button
        onClick={() => navigate('/delivery')}
        style={{ padding: '14px 32px', borderRadius: 14, background: KYVRA.teal, color: KYVRA.white, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', fontFamily: FF, boxShadow: '0 4px 14px rgba(13,148,136,0.30)' }}
      >
        Volver al inicio
      </button>
    </div>
  );

  // ── Computed ─────────────────────────────────────────────────────────────
  const isPickup    = order.delivery_method === 'pickup';
  const rawStatus   = STATUS_INFO[order.order_status] || STATUS_INFO.pending;
  const status      = (rawStatus.step === 2 && isPickup)
    ? { ...rawStatus, label: 'Tu pedido está listo para retirar' }
    : rawStatus;
  const currentStep = status.step;

  const orderTime   = order.created_at ? new Date(order.created_at) : new Date();
  const etaEnd      = new Date(orderTime.getTime() + 30 * 60000);

  const elapsedSec     = Math.max(0, Math.floor((now - orderTime.getTime()) / 1000));
  const addrCountdown  = Math.max(0, ADDRESS_CHANGE_WINDOW - elapsedSec);
  const itemsCountdown = Math.max(0, ADD_ITEMS_WINDOW - elapsedSec);

  const selectedItems = menuItems.filter(mi => addQty[mi.id] > 0)
    .map(mi => ({ id: mi.id, name: mi.name, price: mi.price, qty: addQty[mi.id], extras: 0, extra_price: 0 }));
  const newSubtotal   = selectedItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const newOrderTotal = (order.total || 0) + newSubtotal;

  const orderCode = `VX-${id.replace(/-/g, '').slice(0, 5).toUpperCase()}`;

  const TIMELINE = [
    { label: 'Pedido confirmado',              sub: 'Tu pedido fue recibido y confirmado',        Icon: CheckCircle },
    { label: 'En preparación',                 sub: 'El local está preparando tu pedido',          Icon: Clock       },
    { label: isPickup ? 'Listo para retirar' : 'En camino',
      sub:   isPickup ? 'Podés pasar a buscar tu pedido' : 'Tu repartidor está en camino',         Icon: Truck       },
    { label: '¡Llegó el pedido!',              sub: '¡Disfrutá tu pedido!',                        Icon: MapPin      },
  ];

  return (
    <div style={{ minHeight: '100dvh', background: KYVRA.bg, fontFamily: FF, paddingBottom: 32 }}>
      <style>{CSS}</style>

      {/* ── Status Hero ── */}
      <div style={{
        background: 'linear-gradient(160deg, #061118 0%, #0A1E2A 28%, #0D3A35 55%, #0F172A 100%)',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        paddingBottom: 28, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>
          {/* Nav row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button
              onClick={() => navigate('/delivery')}
              style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.22)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <ChevronLeft size={20} color="#fff" />
            </button>

            <button
              onClick={() => navigate('/delivery')}
              style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(13,148,136,0.28)', border: '1px solid rgba(94,234,212,0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}
            >
              <ShoppingCart size={17} color="#5EEAD4" strokeWidth={2} />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute', top: -2, right: -2,
                  background: '#0D9488', color: '#fff',
                  fontSize: 9, fontWeight: 900, minWidth: 16, height: 16,
                  borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
                }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Order code chip */}
          <div style={{ marginBottom: 8 }}>
            <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 800, color: '#5EEAD4', letterSpacing: '0.12em', textTransform: 'uppercase', background: 'rgba(94,234,212,0.12)', border: '1px solid rgba(94,234,212,0.22)', borderRadius: 999, padding: '3px 10px' }}>
              Orden #{orderCode}
            </span>
          </div>

          {/* Restaurant name */}
          {order.restaurants?.name && (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: '0 0 4px', fontWeight: 500, fontFamily: FF }}>
              {order.restaurants.name}
            </p>
          )}

          {/* Heading */}
          <h1 style={{ fontWeight: 900, fontSize: 26, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.025em', lineHeight: 1.1, fontFamily: FF }}>
            Seguimiento en vivo
          </h1>

          {/* ETA pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(13,148,136,0.22)', border: '1px solid rgba(94,234,212,0.25)',
            borderRadius: 999, padding: '7px 14px',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#5EEAD4', flexShrink: 0, animation: 'dotPulse 1.8s ease-in-out infinite' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#5EEAD4', fontFamily: FF }}>
              Llegada estimada: {fmtTime(etaEnd)}
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 0' }}>

        {/* ── Timeline card ───────────────────────────────────────── */}
        <div style={{ ...card, padding: '20px 20px 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
            <div style={{ ...iconBox, width: 36, height: 36, borderRadius: 11 }}>
              <Package size={16} color={KYVRA.teal} strokeWidth={2} />
            </div>
            <p style={{ fontWeight: 800, fontSize: 14, color: KYVRA.navy, margin: 0, letterSpacing: '-0.01em' }}>
              Logística del pedido
            </p>
          </div>

          {TIMELINE.map(({ label, sub, Icon }, idx) => {
            const isCompleted = idx < currentStep;
            const isActive    = idx === currentStep;
            const isPending   = idx > currentStep;
            const isLast      = idx === TIMELINE.length - 1;

            return (
              <div key={idx} style={{ display: 'flex', gap: 14, opacity: isPending ? 0.35 : 1, animation: `fadeInUp 0.38s ease-out ${0.08 + idx * 0.09}s both` }}>
                {/* circle + connector */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 36 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: isActive ? KYVRA.teal : isCompleted ? KYVRA.tealDark : KYVRA.border,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: (isActive || isCompleted) ? KYVRA.white : KYVRA.textMuted,
                    animation: isActive ? 'pulseRing 2.2s ease-in-out infinite' : 'none',
                  }}>
                    <Icon size={16} strokeWidth={2.2} />
                  </div>
                  {!isLast && (
                    <div style={{ width: 2, flex: 1, minHeight: 22, background: isCompleted ? KYVRA.teal : KYVRA.border, margin: '4px 0', borderRadius: 1 }} />
                  )}
                </div>

                {/* text */}
                <div style={{ flex: 1, paddingBottom: isLast ? 0 : 18 }}>
                  <p style={{ fontWeight: isActive ? 800 : 700, fontSize: 14, color: isActive ? KYVRA.teal : isCompleted ? KYVRA.navy : KYVRA.textMuted, margin: '8px 0 2px' }}>
                    {label}
                  </p>
                  {(isCompleted || isActive) && (
                    <p style={{ fontSize: 12, color: KYVRA.textSec, margin: 0, lineHeight: 1.4 }}>{sub}</p>
                  )}
                  {isActive && order.updated_at && (
                    <p style={{ fontSize: 11, fontWeight: 700, color: KYVRA.teal, margin: '4px 0 0' }}>
                      {fmtTime(new Date(order.updated_at))}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Dirección / retiro ──────────────────────────────────── */}
        {isPickup ? (
          <div style={{ ...card, padding: '16px 18px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={iconBox}><MapPin size={20} color={KYVRA.teal} strokeWidth={2} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: KYVRA.navy, margin: 0 }}>Retirás en el local</p>
                <p style={{ fontSize: 13, color: KYVRA.textSec, margin: '3px 0 0' }}>
                  {order.restaurants?.pickup_address || order.restaurants?.name}
                </p>
              </div>
            </div>
            {order.restaurants?.pickup_address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.restaurants.pickup_address}, Vicuña Mackenna, Córdoba`)}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  marginTop: 14, padding: '10px 0', borderRadius: 12,
                  border: `1px solid ${KYVRA.border}`, fontSize: 13, fontWeight: 700,
                  color: KYVRA.navy, textDecoration: 'none', background: KYVRA.bg,
                }}
              >
                <MapPin size={14} /> Ver en Google Maps
              </a>
            )}
          </div>
        ) : (
          <div style={{ ...card, padding: '16px 18px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={iconBox}><MapPin size={20} color={KYVRA.teal} strokeWidth={2} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: KYVRA.navy, margin: 0 }}>Lo recibís en</p>
                <p style={{ fontSize: 13, color: KYVRA.textSec, margin: '3px 0 0' }}>{order.customer_address}</p>
                {order.delivery_notes && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginTop: 6 }}>
                    <StickyNote size={12} color={KYVRA.textMuted} style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 12, color: KYVRA.textMuted, margin: 0 }}>{order.delivery_notes}</p>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleChangeAddress(addrCountdown)}
                disabled={addrCountdown <= 0}
                style={{
                  padding: '6px 12px', borderRadius: 9,
                  border: `1.5px solid ${addrCountdown > 0 ? KYVRA.teal : KYVRA.border}`,
                  background: 'transparent',
                  color: addrCountdown > 0 ? KYVRA.teal : KYVRA.textMuted,
                  fontSize: 12, fontWeight: 700, cursor: addrCountdown > 0 ? 'pointer' : 'not-allowed',
                  flexShrink: 0, fontFamily: FF,
                }}
              >
                Cambiar
              </button>
            </div>
            {addrCountdown > 0 && (
              <p style={{ fontSize: 11, color: KYVRA.textMuted, margin: '8px 0 0 58px' }}>
                Podés cambiarla durante {fmtCountdown(addrCountdown)}
              </p>
            )}
          </div>
        )}

        {/* ── Resumen del pedido (dark card) ──────────────────────── */}
        <div style={{ background: KYVRA.navy, borderRadius: 20, padding: '18px 18px', marginBottom: 14 }}>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', margin: '0 0 16px' }}>
            Resumen de Orden
          </p>

          {(order.items || []).map((item, i) => {
            const lineTotal = item.price * item.qty + (item.extras || 0) * (item.extra_price || 0);
            const extraText = item.extras > 0 ? ` + ${item.extras} ${item.extra_label || 'extra'}` : '';
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ color: 'rgba(255,255,255,0.62)', fontSize: 13, flex: 1, minWidth: 0, marginRight: 12 }}>
                  {item.qty}× {item.name}{extraText}
                </span>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  ${lineTotal.toLocaleString('es-AR')}
                </span>
              </div>
            );
          })}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 12, paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12 }}>Subtotal</span>
              <span style={{ color: 'rgba(255,255,255,0.58)', fontSize: 12 }}>${(order.total || 0).toLocaleString('es-AR')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12 }}>Envío</span>
              <span style={{ color: KYVRA.tealLight, fontSize: 12, fontWeight: 700 }}>Incluido</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}>Total</span>
              <span style={{ color: '#fff', fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em' }}>
                ${(order.total || 0).toLocaleString('es-AR')}
              </span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, margin: '4px 0 0', textAlign: 'right' }}>
              {PAYMENT_LABELS[order.payment_method] || 'Pago'}
            </p>
          </div>
        </div>

        {/* ── Agregar productos ────────────────────────────────────── */}
        {itemsCountdown > 0 && (
          <div style={{ marginBottom: 14 }}>
            {!showAddSection ? (
              <button
                type="button"
                onClick={() => setShowAddSection(true)}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 16,
                  border: `2px dashed rgba(13,148,136,0.30)`,
                  background: KYVRA.tealBg, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: FF,
                }}
              >
                <Plus size={16} color={KYVRA.teal} strokeWidth={2.5} />
                <span style={{ fontSize: 14, fontWeight: 700, color: KYVRA.teal }}>
                  Agregar más productos
                </span>
                <span style={{ fontSize: 12, color: KYVRA.textSec, marginLeft: 2 }}>
                  ({fmtCountdown(itemsCountdown)})
                </span>
              </button>
            ) : (
              <div style={{ ...card, padding: '18px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <p style={{ fontWeight: 800, fontSize: 14, color: KYVRA.navy, margin: 0 }}>Agregar al pedido</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: KYVRA.textSec, fontWeight: 600 }}>
                      ⏱ {fmtCountdown(itemsCountdown)}
                    </span>
                    <button type="button" onClick={() => setShowAddSection(false)}
                      style={{ width: 28, height: 28, borderRadius: '50%', background: KYVRA.bg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={14} color={KYVRA.navy} />
                    </button>
                  </div>
                </div>

                {menuLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[...Array(3)].map((_, i) => <div key={i} style={{ ...skeletonStyle, height: 64 }} />)}
                  </div>
                ) : menuItems.length === 0 ? (
                  <p style={{ fontSize: 13, color: KYVRA.textMuted, textAlign: 'center', padding: '24px 0' }}>
                    No hay productos disponibles ahora.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {menuItems.map((mi, idx) => {
                      const qty    = addQty[mi.id] || 0;
                      const isLast = idx === menuItems.length - 1;
                      return (
                        <div key={mi.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: isLast ? 'none' : `1px solid ${KYVRA.border}` }}>
                          {mi.image_url ? (
                            <img src={mi.image_url} alt={mi.name} loading="lazy"
                              style={{ width: 50, height: 50, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 50, height: 50, borderRadius: 12, background: KYVRA.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Utensils size={20} color={KYVRA.teal} strokeWidth={1.5} />
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: KYVRA.navy, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mi.name}</p>
                            <p style={{ fontSize: 13, fontWeight: 800, color: KYVRA.teal, margin: '2px 0 0' }}>${mi.price.toLocaleString('es-AR')}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            {qty > 0 && (
                              <>
                                <button type="button" onClick={() => decQty(mi.id)} style={{ width: 30, height: 30, borderRadius: '50%', border: `1.5px solid ${KYVRA.border}`, background: KYVRA.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Minus size={13} color={KYVRA.navy} />
                                </button>
                                <span style={{ width: 20, textAlign: 'center', fontWeight: 800, fontSize: 14, color: KYVRA.navy }}>{qty}</span>
                              </>
                            )}
                            <button type="button" onClick={() => incQty(mi.id)} style={{ width: 30, height: 30, borderRadius: '50%', background: KYVRA.teal, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(13,148,136,0.30)' }}>
                              <Plus size={13} color={KYVRA.white} strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {newSubtotal > 0 && (
                  <button
                    type="button"
                    onClick={() => setConfirmModalOpen(true)}
                    style={{
                      width: '100%', height: 48, marginTop: 16,
                      background: KYVRA.teal, borderRadius: 14, border: 'none', cursor: 'pointer',
                      color: KYVRA.white, fontSize: 14, fontWeight: 700, fontFamily: FF,
                      boxShadow: '0 4px 14px rgba(13,148,136,0.32)',
                    }}
                  >
                    Agregar al pedido · ${newSubtotal.toLocaleString('es-AR')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modal: cambiar dirección ─────────────────────────────── */}
      {addrModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.55)' }} onClick={() => setAddrModalOpen(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: KYVRA.white, borderRadius: '24px 24px 0 0', padding: '22px 20px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 800, fontSize: 16, color: KYVRA.navy, margin: 0, fontFamily: FF }}>Cambiar dirección de entrega</h3>
              <button type="button" onClick={() => setAddrModalOpen(false)}
                style={{ width: 32, height: 32, borderRadius: '50%', background: KYVRA.bg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color={KYVRA.navy} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: KYVRA.textSec, display: 'block', marginBottom: 6 }}>Dirección</label>
                <input value={addrForm.address} onChange={e => setAddrForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Calle y número" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: KYVRA.textSec, display: 'block', marginBottom: 6 }}>Referencias</label>
                <textarea value={addrForm.notes} onChange={e => setAddrForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Ej: Casa azul, portón negro, piso 2 depto B"
                  style={{ ...inputStyle, height: 80, resize: 'none' }} />
              </div>
            </div>
            <button type="button" onClick={saveAddressInfo} disabled={savingAddr || !addrForm.address.trim()}
              style={{
                width: '100%', padding: '14px 0', marginTop: 16, borderRadius: 14,
                background: (savingAddr || !addrForm.address.trim()) ? KYVRA.border : KYVRA.teal,
                color: KYVRA.white, fontSize: 14, fontWeight: 700, border: 'none',
                cursor: (savingAddr || !addrForm.address.trim()) ? 'not-allowed' : 'pointer',
                fontFamily: FF,
                boxShadow: (savingAddr || !addrForm.address.trim()) ? 'none' : '0 4px 14px rgba(13,148,136,0.30)',
              }}>
              {savingAddr ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <div style={{ height: 20 }} />
          </div>
        </div>
      )}

      {/* ── Modal: confirmar items nuevos ────────────────────────── */}
      {confirmModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.55)' }} onClick={() => setConfirmModalOpen(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: KYVRA.white, borderRadius: '24px 24px 0 0', padding: '22px 20px', maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 style={{ fontWeight: 800, fontSize: 16, color: KYVRA.navy, margin: '0 0 18px', fontFamily: FF }}>¿Confirmar estos productos?</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {selectedItems.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: KYVRA.textSec }}>{item.qty}× {item.name}</span>
                  <span style={{ fontWeight: 700, color: KYVRA.navy }}>${(item.price * item.qty).toLocaleString('es-AR')}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: `1px solid ${KYVRA.border}`, paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: KYVRA.navy }}>Total nuevo del pedido</span>
              <span style={{ fontWeight: 900, fontSize: 18, color: KYVRA.teal, letterSpacing: '-0.02em' }}>${newOrderTotal.toLocaleString('es-AR')}</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setConfirmModalOpen(false)}
                style={{ flex: 1, height: 46, borderRadius: 13, border: `1.5px solid ${KYVRA.border}`, background: KYVRA.white, fontSize: 14, fontWeight: 700, cursor: 'pointer', color: KYVRA.navy, fontFamily: FF }}>
                Cancelar
              </button>
              <button type="button" onClick={() => handleConfirmAddItems(selectedItems, newSubtotal)} disabled={addingItems}
                style={{ flex: 1, height: 46, borderRadius: 13, border: 'none', background: addingItems ? KYVRA.border : KYVRA.teal, color: KYVRA.white, fontSize: 14, fontWeight: 700, cursor: addingItems ? 'not-allowed' : 'pointer', fontFamily: FF, boxShadow: addingItems ? 'none' : '0 4px 14px rgba(13,148,136,0.30)' }}>
                {addingItems ? 'Confirmando...' : 'Confirmar'}
              </button>
            </div>
            <div style={{ height: 20 }} />
          </div>
        </div>
      )}
    </div>
  );
}
