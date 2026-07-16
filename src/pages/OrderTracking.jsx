import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Bell, ShoppingCart, X, StickyNote, Plus, Minus, MapPin,
  Clock, CheckCircle, Truck, Package, MessageCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase.js';
import useCartStore from '../store/cartStore.js';

const TEAL    = '#0D9488';
const TEAL_BG = '#F0FDFA';
const NAVY    = '#0F172A';

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
`;

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cartCount = useCartStore(s => s.count());

  const [order,           setOrder]           = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [showItems,       setShowItems]       = useState(false);
  const [now,             setNow]             = useState(() => Date.now());
  const [addrModalOpen,   setAddrModalOpen]   = useState(false);
  const [addrForm,        setAddrForm]        = useState({ address: '', notes: '' });
  const [savingAddr,      setSavingAddr]      = useState(false);
  const [menuItems,       setMenuItems]       = useState([]);
  const [menuLoading,     setMenuLoading]     = useState(false);
  const [addQty,          setAddQty]          = useState({});
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [addingItems,     setAddingItems]     = useState(false);
  const [showAddSection,  setShowAddSection]  = useState(false);

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
      .then(({ data }) => {
        setMenuItems(data || []);
        setMenuLoading(false);
      });
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

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100dvh', background: '#F8F9FF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '70px 16px 0' }} className="animate-pulse space-y-4">
        <div style={{ height: 24, background: '#E2E8F0', borderRadius: 8, width: '40%' }} />
        <div style={{ height: 36, background: '#E2E8F0', borderRadius: 10, width: '70%' }} />
        <div style={{ height: 200, background: '#E2E8F0', borderRadius: 16 }} />
        <div style={{ height: 160, background: '#E2E8F0', borderRadius: 16 }} />
        <div style={{ height: 120, background: '#E2E8F0', borderRadius: 16 }} />
      </div>
    </div>
  );

  if (!order) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FF' }}>
      <p style={{ color: '#94A3B8', fontSize: 14 }}>Pedido no encontrado</p>
    </div>
  );

  if (order.order_status === 'rejected') return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center', background: '#F8F9FF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <X size={32} color="#EF4444" />
      </div>
      <h2 style={{ fontWeight: 900, fontSize: 22, color: NAVY, margin: '0 0 8px' }}>Pedido rechazado</h2>
      <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 28px' }}>El restaurante no puede tomar tu pedido en este momento.</p>
      <button onClick={() => navigate('/delivery')} className="btn-primary">Volver al inicio</button>
    </div>
  );

  // ── Computed values ──────────────────────────────────────────────────────
  const isPickup    = order.delivery_method === 'pickup';
  const rawStatus   = STATUS_INFO[order.order_status] || STATUS_INFO.pending;
  const status      = (rawStatus.step === 2 && isPickup)
    ? { ...rawStatus, label: 'Tu pedido está listo para retirar' }
    : rawStatus;
  const currentStep = status.step;
  const itemCount   = (order.items || []).reduce((sum, i) => sum + (i.qty || 0), 0);

  const orderTime   = order.created_at ? new Date(order.created_at) : new Date();
  const etaEnd      = new Date(orderTime.getTime() + 30 * 60000);

  const elapsedSec   = Math.max(0, Math.floor((now - orderTime.getTime()) / 1000));
  const addrCountdown  = Math.max(0, ADDRESS_CHANGE_WINDOW - elapsedSec);
  const itemsCountdown = Math.max(0, ADD_ITEMS_WINDOW - elapsedSec);

  const selectedItems   = menuItems.filter(mi => addQty[mi.id] > 0)
    .map(mi => ({ id: mi.id, name: mi.name, price: mi.price, qty: addQty[mi.id], extras: 0, extra_price: 0 }));
  const newSubtotal     = selectedItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const newOrderTotal   = (order.total || 0) + newSubtotal;

  const orderCode = `VX-${id.replace(/-/g, '').slice(0, 5).toUpperCase()}`;

  const TIMELINE = [
    { label: 'Pedido Confirmado',              sub: 'Tu pedido fue recibido y confirmado',  Icon: CheckCircle },
    { label: 'En Preparación',                  sub: 'El local está preparando tu pedido',   Icon: Clock       },
    { label: isPickup ? 'Listo para retirar' : 'En Camino',
      sub: isPickup ? 'Podés pasar a buscar tu pedido' : 'Tu repartidor está en camino',     Icon: Truck       },
    { label: '¡Llegó el pedido!',               sub: '¡Disfrutá tu pedido!',                Icon: MapPin      },
  ];

  const sectionCard = {
    background: '#fff', border: '1px solid #E2E8F0',
    borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
  };
  const iconBox = {
    width: 40, height: 40, borderRadius: 12,
    background: TEAL_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#F8F9FF', fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: 32 }}>
      <style>{CSS}</style>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: '#fff', borderBottom: '1px solid #E2E8F0',
        height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
      }}>
        <button
          onClick={() => navigate('/delivery')}
          style={{ width: 36, height: 36, borderRadius: '50%', background: '#F1F5F9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={20} color={NAVY} strokeWidth={2.5} />
        </button>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 900, fontSize: 16, color: NAVY, margin: 0, lineHeight: 1.2, letterSpacing: '-0.01em' }}>Kyvra</p>
          <p style={{ fontSize: 10.5, color: '#94A3B8', margin: 0, fontWeight: 500, letterSpacing: '0.01em' }}>La ciudad en una app</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            style={{ width: 36, height: 36, borderRadius: '50%', background: TEAL_BG, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Bell size={17} color={TEAL} strokeWidth={2} />
          </button>
          <button
            onClick={() => navigate('/delivery')}
            style={{ width: 36, height: 36, borderRadius: '50%', background: TEAL_BG, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
          >
            <ShoppingCart size={17} color={TEAL} strokeWidth={2} />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: -2, right: -2,
                background: TEAL, color: '#fff',
                fontSize: 9, fontWeight: 900, minWidth: 16, height: 16,
                borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
              }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>

        {/* ── Título ──────────────────────────────────────────────── */}
        <div style={{ padding: '22px 0 16px', animation: 'fadeInUp 0.35s ease-out both' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 6px' }}>
            Orden #{orderCode}
          </p>
          <h1 style={{ fontWeight: 900, fontSize: 26, color: NAVY, margin: '0 0 14px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Seguimiento en Vivo
          </h1>
          {/* ETA pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: TEAL_BG, border: `1px solid rgba(13,148,136,0.2)`,
            borderRadius: 999, padding: '7px 14px',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: TEAL, flexShrink: 0,
              animation: 'dotPulse 1.8s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: TEAL }}>
              Llegada estimada: {fmtTime(etaEnd)}
            </span>
          </div>
        </div>

        {/* ── Timeline card ───────────────────────────────────────── */}
        <div style={{ ...sectionCard, padding: '18px 18px 14px', marginBottom: 14 }}>
          {/* Card header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ ...iconBox, width: 34, height: 34, borderRadius: 10 }}>
              <Package size={16} color={TEAL} strokeWidth={2} />
            </div>
            <p style={{ fontWeight: 800, fontSize: 14, color: NAVY, margin: 0 }}>Logística del Pedido</p>
          </div>

          {/* Steps */}
          {TIMELINE.map(({ label, sub, Icon }, idx) => {
            const isCompleted = idx < currentStep;
            const isActive    = idx === currentStep;
            const isPending   = idx > currentStep;
            const isLast      = idx === TIMELINE.length - 1;

            return (
              <div
                key={idx}
                style={{
                  display: 'flex', gap: 14,
                  opacity: isPending ? 0.38 : 1,
                  animation: `fadeInUp 0.38s ease-out ${0.08 + idx * 0.09}s both`,
                }}
              >
                {/* Left: circle + connector */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 36 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: isActive ? TEAL : isCompleted ? NAVY : '#E2E8F0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: (isActive || isCompleted) ? '#fff' : '#94A3B8',
                    animation: isActive ? 'pulseRing 2.2s ease-in-out infinite' : 'none',
                  }}>
                    <Icon size={16} strokeWidth={2.2} />
                  </div>
                  {!isLast && (
                    <div style={{
                      width: 2, flex: 1, minHeight: 22,
                      background: isCompleted ? TEAL : '#E2E8F0',
                      margin: '4px 0',
                      borderRadius: 1,
                    }} />
                  )}
                </div>

                {/* Right: text */}
                <div style={{ flex: 1, paddingBottom: isLast ? 0 : 18 }}>
                  <p style={{
                    fontWeight: isActive ? 800 : 700, fontSize: 14,
                    color: isActive ? TEAL : isCompleted ? NAVY : '#94A3B8',
                    margin: '8px 0 2px',
                  }}>
                    {label}
                  </p>
                  {(isCompleted || isActive) && (
                    <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.4 }}>{sub}</p>
                  )}
                  {isActive && order.updated_at && (
                    <p style={{ fontSize: 11, fontWeight: 700, color: TEAL, margin: '4px 0 0' }}>
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
          <div style={{ ...sectionCard, padding: '14px 16px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={iconBox}><MapPin size={18} color={TEAL} strokeWidth={2} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: NAVY, margin: 0 }}>Retirás en el local</p>
                <p style={{ fontSize: 12, color: '#64748B', margin: '3px 0 0' }}>
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
                  marginTop: 12, padding: '9px 0', borderRadius: 10,
                  border: '1px solid #E2E8F0', fontSize: 13, fontWeight: 700, color: NAVY,
                  textDecoration: 'none', background: '#F8FAFC',
                }}
              >
                <MapPin size={14} /> Ver en Google Maps
              </a>
            )}
          </div>
        ) : (
          <div style={{ ...sectionCard, padding: '14px 16px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={iconBox}><MapPin size={18} color={TEAL} strokeWidth={2} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: NAVY, margin: 0 }}>Lo recibís en</p>
                <p style={{ fontSize: 12, color: '#64748B', margin: '3px 0 0' }}>{order.customer_address}</p>
                {order.delivery_notes && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginTop: 6 }}>
                    <StickyNote size={12} color="#94A3B8" style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>{order.delivery_notes}</p>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleChangeAddress(addrCountdown)}
                disabled={addrCountdown <= 0}
                style={{
                  color: addrCountdown > 0 ? TEAL : '#CBD5E1',
                  fontSize: 13, fontWeight: 700, background: 'none', border: 'none',
                  cursor: addrCountdown > 0 ? 'pointer' : 'not-allowed', flexShrink: 0, padding: 0,
                }}
              >
                Cambiar
              </button>
            </div>
            {addrCountdown > 0 && (
              <p style={{ fontSize: 11, color: '#94A3B8', margin: '8px 0 0 52px' }}>
                Podés cambiarla durante {fmtCountdown(addrCountdown)}
              </p>
            )}
          </div>
        )}

        {/* ── Navy summary card ───────────────────────────────────── */}
        <div style={{ background: NAVY, borderRadius: 16, padding: '18px 18px', marginBottom: 14 }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', margin: '0 0 16px' }}>
            Resumen de Orden
          </p>

          {/* Items */}
          {(order.items || []).map((item, i) => {
            const lineTotal = item.price * item.qty + (item.extras || 0) * (item.extra_price || 0);
            const extraText = item.extras > 0 ? ` + ${item.extras} ${item.extra_label || 'extra'}` : '';
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, flex: 1, minWidth: 0, marginRight: 12 }}>
                  {item.qty}× {item.name}{extraText}
                </span>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  ${lineTotal.toLocaleString('es-AR')}
                </span>
              </div>
            );
          })}

          {/* Divider + subtotals */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 12, paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Subtotal</span>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>${(order.total || 0).toLocaleString('es-AR')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Envío</span>
              <span style={{ color: '#5EEAD4', fontSize: 12, fontWeight: 700 }}>Incluido</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}>Total</span>
              <span style={{ color: '#fff', fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em' }}>
                ${(order.total || 0).toLocaleString('es-AR')}
              </span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '4px 0 0', textAlign: 'right' }}>
              {PAYMENT_LABELS[order.payment_method] || 'Pago'}
            </p>
          </div>

          {/* Ayuda button */}
          <button
            type="button"
            style={{
              width: '100%', height: 44, marginTop: 16,
              background: TEAL, borderRadius: 12, border: 'none', cursor: 'pointer',
              color: '#fff', fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <MessageCircle size={16} strokeWidth={2} /> Necesito Ayuda
          </button>
        </div>

        {/* ── Agregar productos ────────────────────────────────────── */}
        {itemsCountdown > 0 && (
          <div style={{ marginBottom: 14 }}>
            {!showAddSection ? (
              <button
                type="button"
                onClick={() => setShowAddSection(true)}
                style={{
                  width: '100%', padding: '13px 16px',
                  borderRadius: 14, border: `2px dashed rgba(13,148,136,0.35)`,
                  background: TEAL_BG, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                <Plus size={16} color={TEAL} strokeWidth={2.5} />
                <span style={{ fontSize: 14, fontWeight: 700, color: TEAL }}>
                  Agregar más productos
                </span>
                <span style={{ fontSize: 12, color: '#64748B', marginLeft: 2 }}>
                  ({fmtCountdown(itemsCountdown)} min)
                </span>
              </button>
            ) : (
              <div style={{ ...sectionCard, padding: '16px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <p style={{ fontWeight: 800, fontSize: 14, color: NAVY, margin: 0 }}>Agregar al pedido</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                      ⏱ {fmtCountdown(itemsCountdown)} min
                    </span>
                    <button type="button" onClick={() => setShowAddSection(false)}
                      style={{ width: 28, height: 28, borderRadius: '50%', background: '#F1F5F9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={14} color={NAVY} />
                    </button>
                  </div>
                </div>

                {menuLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <div key={i} style={{ height: 64, background: '#F1F5F9', borderRadius: 12 }} className="animate-pulse" />)}
                  </div>
                ) : menuItems.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '24px 0' }}>
                    No hay productos disponibles ahora.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {menuItems.map(mi => {
                      const qty = addQty[mi.id] || 0;
                      return (
                        <div key={mi.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                          {mi.image_url ? (
                            <img src={mi.image_url} alt={mi.name} loading="lazy"
                              style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 48, height: 48, borderRadius: 10, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>🍽️</div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: NAVY, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mi.name}</p>
                            <p style={{ fontSize: 13, fontWeight: 800, color: TEAL, margin: '2px 0 0' }}>${mi.price.toLocaleString('es-AR')}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            {qty > 0 && (
                              <>
                                <button type="button" onClick={() => decQty(mi.id)} style={{
                                  width: 30, height: 30, borderRadius: '50%', border: '1.5px solid #E2E8F0',
                                  background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  <Minus size={13} color={NAVY} />
                                </button>
                                <span style={{ width: 20, textAlign: 'center', fontWeight: 800, fontSize: 14, color: NAVY }}>{qty}</span>
                              </>
                            )}
                            <button type="button" onClick={() => incQty(mi.id)} style={{
                              width: 30, height: 30, borderRadius: '50%', background: TEAL,
                              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Plus size={13} color="#fff" strokeWidth={2.5} />
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
                      width: '100%', height: 46, marginTop: 14,
                      background: TEAL, borderRadius: 12, border: 'none', cursor: 'pointer',
                      color: '#fff', fontSize: 14, fontWeight: 700,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
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
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} onClick={() => setAddrModalOpen(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: '#fff', borderRadius: '24px 24px 0 0', padding: '20px 20px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 style={{ fontWeight: 800, fontSize: 16, color: NAVY, margin: 0 }}>Cambiar dirección de entrega</h3>
              <button type="button" onClick={() => setAddrModalOpen(false)}
                style={{ width: 32, height: 32, borderRadius: '50%', background: '#F1F5F9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color={NAVY} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Dirección</label>
                <input value={addrForm.address} onChange={e => setAddrForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Calle y número" className="input" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Referencias</label>
                <textarea value={addrForm.notes} onChange={e => setAddrForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Ej: Casa azul, portón negro, piso 2 depto B"
                  className="input resize-none" style={{ height: 80 }} />
              </div>
            </div>
            <button type="button" onClick={saveAddressInfo} disabled={savingAddr || !addrForm.address.trim()}
              className="btn-primary w-full" style={{ marginTop: 16 }}>
              {savingAddr ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <div style={{ height: 16 }} />
          </div>
        </div>
      )}

      {/* ── Modal: confirmar items nuevos ────────────────────────── */}
      {confirmModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} onClick={() => setConfirmModalOpen(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: '#fff', borderRadius: '24px 24px 0 0', padding: '20px 20px', maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 style={{ fontWeight: 800, fontSize: 16, color: NAVY, margin: '0 0 16px' }}>¿Confirmar estos productos?</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {selectedItems.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#64748B' }}>{item.qty}× {item.name}</span>
                  <span style={{ fontWeight: 700, color: NAVY }}>${(item.price * item.qty).toLocaleString('es-AR')}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>Total nuevo del pedido</span>
              <span style={{ fontWeight: 900, fontSize: 17, color: TEAL }}>${newOrderTotal.toLocaleString('es-AR')}</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setConfirmModalOpen(false)}
                style={{ flex: 1, height: 44, borderRadius: 12, border: '1.5px solid #E2E8F0', background: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: NAVY, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Cancelar
              </button>
              <button type="button" onClick={() => handleConfirmAddItems(selectedItems, newSubtotal)} disabled={addingItems}
                className="btn-primary" style={{ flex: 1 }}>
                {addingItems ? 'Confirmando...' : 'Confirmar'}
              </button>
            </div>
            <div style={{ height: 16 }} />
          </div>
        </div>
      )}
    </div>
  );
}
