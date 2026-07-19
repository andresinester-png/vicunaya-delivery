import { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Copy, CheckCircle, Plus, MapPin, X, Camera,
  Bike, Building2, Banknote, ArrowRight, ShoppingBag, Utensils, Phone,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import PlacesInput from '../components/PlacesInput.jsx';
import { supabase } from '../lib/supabase.js';
import useCartStore from '../store/cartStore.js';
import { useAuth } from '../context/AuthContext.jsx';
import { KYVRA } from '../lib/theme.js';

const LABEL_PRESETS = ['Casa', 'Trabajo', 'Otro'];

const FF = "'Plus Jakarta Sans', sans-serif";

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '14px 16px',
  borderRadius: 14,
  border: `1.5px solid ${KYVRA.border}`,
  fontSize: 14, fontWeight: 500,
  color: KYVRA.navy, background: KYVRA.white,
  outline: 'none', fontFamily: FF,
};

// ── Success screen ───────────────────────────────────────────────────────────
function OrderSuccessScreen() {
  return (
    <motion.div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(145deg, ${KYVRA.teal} 0%, ${KYVRA.tealDark} 100%)`,
      }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <style>{`
        @keyframes checkmarkDraw { to { stroke-dashoffset: 0; } }
        @keyframes circlePop {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div style={{
        width: 140, height: 140, borderRadius: '50%', background: KYVRA.white,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        animation: 'circlePop 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        <svg viewBox="0 0 52 52" width={78} height={78} fill="none">
          <path d="M14 27 L22 35 L38 17" stroke={KYVRA.teal} strokeWidth="5"
            strokeLinecap="round" strokeLinejoin="round" fill="none"
            style={{ strokeDasharray: 40, strokeDashoffset: 40, animation: 'checkmarkDraw 0.5s 0.4s ease-out forwards' }} />
        </svg>
      </div>
      <motion.p style={{ fontSize: 30, fontWeight: 900, color: KYVRA.white, margin: '32px 0 0', textAlign: 'center', padding: '0 32px', fontFamily: FF, letterSpacing: '-0.02em' }}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.4 }}>
        ¡Pedido confirmado!
      </motion.p>
      <motion.p style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.82)', margin: '10px 0 0', textAlign: 'center', padding: '0 32px', fontFamily: FF }}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.4 }}>
        Tu pedido está siendo procesado
      </motion.p>
    </motion.div>
  );
}

// ── Address sheet ────────────────────────────────────────────────────────────
const AddressSheet = memo(function AddressSheet({
  savedAddresses, selectedAddrId, showNewAddrForm, newAddrForm, savingAddr,
  onClose, onSelectAddress, onShowNewForm, onChangeNewAddrForm, onSaveNewAddress,
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.55)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, borderRadius: '24px 24px 0 0', background: KYVRA.white, maxHeight: '82vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${KYVRA.border}`, padding: '18px 20px', position: 'sticky', top: 0, background: KYVRA.white, zIndex: 1 }}>
          <h3 style={{ fontWeight: 800, fontSize: 16, color: KYVRA.navy, margin: 0, fontFamily: FF }}>Tus direcciones</h3>
          <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: KYVRA.bg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color={KYVRA.navy} />
          </button>
        </div>
        {savedAddresses.length > 0 && (
          <div>
            {savedAddresses.map(addr => (
              <button key={addr.id} type="button" onClick={() => onSelectAddress(addr)}
                style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 14, padding: '16px 20px', textAlign: 'left', border: 'none', cursor: 'pointer', background: selectedAddrId === addr.id ? KYVRA.tealBg : KYVRA.white, borderBottom: `1px solid ${KYVRA.border}` }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: KYVRA.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={20} color={KYVRA.teal} strokeWidth={2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: KYVRA.navy, margin: 0, fontFamily: FF }}>{addr.label}</p>
                  <p style={{ fontSize: 12, color: KYVRA.textSec, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{addr.address}</p>
                  {addr.notes && <p style={{ fontSize: 12, color: KYVRA.textMuted, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{addr.notes}</p>}
                </div>
                {selectedAddrId === addr.id && <CheckCircle size={20} color={KYVRA.teal} style={{ flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        )}
        {!showNewAddrForm ? (
          <button type="button" onClick={() => onShowNewForm(true)}
            style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10, padding: '18px 20px', color: KYVRA.teal, fontSize: 14, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FF }}>
            <Plus size={18} /> Agregar nueva dirección
          </button>
        ) : (
          <div style={{ padding: '18px 20px', borderTop: `1px solid ${KYVRA.border}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: KYVRA.navy, margin: 0, fontFamily: FF }}>Nueva dirección</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {LABEL_PRESETS.map(lbl => (
                <button key={lbl} type="button" onClick={() => onChangeNewAddrForm(f => ({ ...f, label: lbl }))}
                  style={{ borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FF, border: `1.5px solid ${newAddrForm.label === lbl ? KYVRA.teal : KYVRA.border}`, background: newAddrForm.label === lbl ? KYVRA.tealBg : KYVRA.white, color: newAddrForm.label === lbl ? KYVRA.teal : KYVRA.textSec }}>
                  {lbl}
                </button>
              ))}
            </div>
            <PlacesInput value={newAddrForm.address} onChange={v => onChangeNewAddrForm(f => ({ ...f, address: v }))} placeholder="Calle y número" style={inputStyle} />
            <input value={newAddrForm.notes} onChange={e => onChangeNewAddrForm(f => ({ ...f, notes: e.target.value }))} placeholder="Piso, depto, referencia... (opcional)" style={inputStyle} />
            <div style={{ display: 'flex', gap: 10 }}>
              {savedAddresses.length > 0 && (
                <button type="button" onClick={() => onShowNewForm(false)} style={{ flex: 1, padding: '13px 0', borderRadius: 14, fontSize: 14, fontWeight: 700, border: `1.5px solid ${KYVRA.border}`, background: KYVRA.white, color: KYVRA.navy, cursor: 'pointer', fontFamily: FF }}>
                  Cancelar
                </button>
              )}
              <button type="button" onClick={onSaveNewAddress} disabled={savingAddr}
                style={{ flex: 1, padding: '13px 0', borderRadius: 14, fontSize: 14, fontWeight: 700, border: 'none', background: savingAddr ? KYVRA.border : KYVRA.teal, color: KYVRA.white, cursor: savingAddr ? 'not-allowed' : 'pointer', fontFamily: FF, boxShadow: savingAddr ? 'none' : '0 4px 12px rgba(13,148,136,0.30)' }}>
                {savingAddr ? 'Guardando...' : 'Guardar y usar'}
              </button>
            </div>
          </div>
        )}
        <div style={{ height: 24 }} />
      </div>
    </div>
  );
});

// ── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p style={{ fontWeight: 800, fontSize: 11, color: KYVRA.textMuted, letterSpacing: '0.10em', textTransform: 'uppercase', margin: '4px 4px 8px', fontFamily: FF }}>
      {children}
    </p>
  );
}

// ── Checkout ─────────────────────────────────────────────────────────────────
export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, restaurantId, restaurantName, fulfillmentMethod, clear } = useCartStore();
  const totalVal = total();
  const { session, profile } = useAuth();

  const [localPhone,  setLocalPhone]  = useState('');
  const [phoneInput,  setPhoneInput]  = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  const [restaurantInfo, setRestaurantInfo] = useState({ pickup_address: '', payment_alias: '' });
  const [receipt,        setReceipt]        = useState(null);
  const [paymentMethod,  setPaymentMethod]  = useState(null);
  const [cashAmount,     setCashAmount]     = useState('');
  const [submitting,     setSubmitting]     = useState(false);
  const [aliasCopied,    setAliasCopied]    = useState(false);
  const [showSuccess,    setShowSuccess]    = useState(false);
  const [successOrderId, setSuccessOrderId] = useState(null);

  const [localFulfillment,     setLocalFulfillment]     = useState(fulfillmentMethod);
  const [fulfillmentSheetOpen, setFulfillmentSheetOpen] = useState(false);

  const [address,         setAddress]         = useState('');
  const [savedAddresses,  setSavedAddresses]  = useState([]);
  const [selectedAddr,    setSelectedAddr]    = useState(null);
  const [sheetOpen,       setSheetOpen]       = useState(false);
  const [showNewAddrForm, setShowNewAddrForm] = useState(false);
  const [newAddrForm,     setNewAddrForm]     = useState({ label: 'Casa', address: '', notes: '' });
  const [savingAddr,      setSavingAddr]      = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    supabase.from('restaurants').select('pickup_address, payment_alias').eq('id', restaurantId).single()
      .then(({ data }) => { if (data) setRestaurantInfo(data); });
  }, [restaurantId]);

  useEffect(() => {
    setAddress(profile?.direccion || '');
    if (!session?.user?.id) return;
    supabase.from('addresses').select('*')
      .eq('user_id', session.user.id)
      .order('is_default', { ascending: false })
      .order('created_at')
      .then(({ data }) => {
        if (!data?.length) return;
        setSavedAddresses(data);
        const def = data.find(a => a.is_default) || data[0];
        setSelectedAddr(def);
        setAddress(def.address);
      });
  }, [session, profile]);

  useEffect(() => {
    if (!showSuccess || !successOrderId) return;
    clear();
    const t = setTimeout(() => navigate(`/pedido/${successOrderId}`), 2500);
    return () => clearTimeout(t);
  }, [showSuccess, successOrderId]);

  const selectAddress = useCallback((addr) => {
    setSelectedAddr(addr); setAddress(addr.address);
    setSheetOpen(false); setShowNewAddrForm(false);
  }, []);

  const openSheet = useCallback((autoOpenForm = false) => {
    setShowNewAddrForm(s => autoOpenForm || savedAddresses.length === 0 ? true : s);
    setSheetOpen(true);
  }, [savedAddresses.length]);

  const saveNewAddress = useCallback(async () => {
    if (!newAddrForm.address.trim()) { toast.error('Ingresá la dirección'); return; }
    setSavingAddr(true);
    try {
      const { data, error } = await supabase.from('addresses').insert({
        user_id: session.user.id, label: newAddrForm.label || 'Casa',
        address: newAddrForm.address.trim(), notes: newAddrForm.notes.trim() || null,
        is_default: savedAddresses.length === 0,
      }).select().single();
      if (error) throw error;
      setSavedAddresses(prev => [...prev, data]);
      setNewAddrForm({ label: 'Casa', address: '', notes: '' });
      selectAddress(data);
      toast.success('Dirección guardada');
    } catch (err) { toast.error('Error al guardar: ' + err.message); }
    finally { setSavingAddr(false); }
  }, [newAddrForm, session, savedAddresses.length, selectAddress]);

  const effectivePhone = localPhone || profile?.telefono || '';
  const needsPhone     = !!session?.user?.id && !effectivePhone;

  const savePhone = async () => {
    const cleaned = phoneInput.trim();
    if (!cleaned) { toast.error('Ingresá tu número de teléfono'); return; }
    setSavingPhone(true);
    try {
      const { error } = await supabase.from('profiles').update({ telefono: cleaned }).eq('id', session.user.id);
      if (error) throw error;
      setLocalPhone(cleaned); toast.success('Teléfono guardado');
    } catch (err) { toast.error('Error al guardar: ' + err.message); }
    finally { setSavingPhone(false); }
  };

  if (showSuccess) return <OrderSuccessScreen />;
  if (items.length === 0) { navigate('/delivery'); return null; }

  const copyAlias = () => {
    navigator.clipboard.writeText(restaurantInfo.payment_alias);
    setAliasCopied(true);
    setTimeout(() => setAliasCopied(false), 2000);
    toast.success('Alias copiado');
  };

  const uploadReceipt = async (file) => {
    const ext  = file.name.split('.').pop();
    const path = `receipts/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('comprobantes').upload(path, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('comprobantes').getPublicUrl(path);
    return publicUrl;
  };

  const handlePay = async () => {
    if (paymentMethod === 'transfer' && !receipt) {
      toast.error('Subí el comprobante de transferencia para continuar'); return;
    }
    if (localFulfillment === 'delivery' && !address.trim()) {
      toast.error('Ingresá la dirección de entrega'); return;
    }
    setSubmitting(true);
    try {
      const receiptUrl = paymentMethod === 'transfer' ? await uploadReceipt(receipt) : null;
      const orderItems = items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, extras: i.extras || 0, extra_price: i.extra_price || 0 }));
      const customerName = `${profile?.nombre || ''} ${profile?.apellido || ''}`.trim();
      const { data: order, error } = await supabase.from('orders').insert({
        restaurant_id: restaurantId, user_id: session?.user?.id || null,
        customer_name: customerName, customer_phone: effectivePhone,
        customer_address: localFulfillment === 'delivery' ? address.trim() : 'Retira en el local',
        delivery_method: localFulfillment, items: orderItems,
        subtotal: totalVal, total: totalVal,
        payment_method: paymentMethod, comprobante_url: receiptUrl,
        notes: paymentMethod === 'cash' && cashAmount.trim() ? `Paga en efectivo con $${cashAmount.trim()}` : null,
        order_status: 'pending',
      }).select().single();
      if (error) throw error;
      setSuccessOrderId(order.id); setShowSuccess(true);
    } catch (err) { toast.error('Error al enviar el pedido: ' + err.message); }
    finally { setSubmitting(false); }
  };

  const canPay = paymentMethod && !(paymentMethod === 'transfer' && !receipt) && !submitting;

  const PAYMENT_OPTIONS = [
    {
      key: 'transfer',
      label: 'Transferencia',
      sub: 'Alias / CBU bancario',
      Icon: Banknote,
    },
    {
      key: 'cash',
      label: 'Efectivo',
      sub: 'Pagás al repartidor',
      Icon: ShoppingBag,
    },
  ];

  return (
    <div style={{ minHeight: '100dvh', background: KYVRA.bg, fontFamily: FF, paddingBottom: 110 }}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header style={{
        background: KYVRA.white,
        borderBottom: `1px solid ${KYVRA.border}`,
        height: 56,
        display: 'flex', alignItems: 'center',
        padding: '0 16px',
        position: 'sticky', top: 0, zIndex: 40,
        boxShadow: '0 2px 12px rgba(15,23,42,0.07)',
      }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: '50%', background: KYVRA.bg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ChevronLeft size={20} color={KYVRA.navy} strokeWidth={2.5} />
        </button>
        <span style={{ flex: 1, textAlign: 'center', fontWeight: 800, fontSize: 16, color: KYVRA.navy, letterSpacing: '-0.02em' }}>
          Confirmar pedido
        </span>
        {/* balance spacer */}
        <div style={{ width: 36 }} />
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── 1. HERO TOTAL ────────────────────────────────────────────── */}
        <div style={{
          borderRadius: 24,
          background: `linear-gradient(135deg, #0F8A80 0%, ${KYVRA.teal} 45%, #14B8A6 100%)`,
          padding: '28px 28px 24px',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(13,148,136,0.38)',
        }}>
          {/* Decorative rings */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.12)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -50, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', filter: 'blur(30px)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.60)' }} />
              <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.72)', letterSpacing: '0.16em', textTransform: 'uppercase', margin: 0 }}>
                Total del pedido
              </p>
            </div>

            <p style={{ color: KYVRA.white, fontSize: 54, fontWeight: 900, margin: 0, letterSpacing: '-0.035em', lineHeight: 1, textShadow: '0 2px 16px rgba(0,0,0,0.15)' }}>
              ${totalVal.toLocaleString('es-AR')}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
              {restaurantName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(255,255,255,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Utensils size={11} color="#fff" />
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: 600, margin: 0 }}>
                    {restaurantName}
                  </p>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 999, padding: '5px 12px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.90)', margin: 0 }}>
                  {items.length} {items.length === 1 ? 'producto' : 'productos'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. ENTREGA ───────────────────────────────────────────────── */}
        <div>
          <SectionLabel>Entrega</SectionLabel>
          <div style={{ background: KYVRA.white, borderRadius: 22, border: `1px solid ${KYVRA.border}`, boxShadow: '0 4px 20px rgba(15,23,42,0.07)', overflow: 'hidden' }}>

            {/* Row: dirección o retiro */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px' }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: KYVRA.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {localFulfillment === 'delivery'
                  ? <MapPin size={22} color={KYVRA.teal} strokeWidth={2} />
                  : <Building2 size={22} color={KYVRA.teal} strokeWidth={2} />
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: KYVRA.navy, margin: 0 }}>
                  {localFulfillment === 'delivery' ? 'Dirección de entrega' : 'Retirás en el local'}
                </p>
                <p style={{ fontSize: 13, color: KYVRA.textSec, margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {localFulfillment === 'delivery'
                    ? (address || 'Sin dirección seleccionada')
                    : (restaurantInfo.pickup_address || restaurantName)
                  }
                </p>
              </div>
              {localFulfillment === 'delivery' && (
                <button type="button" onClick={() => openSheet(false)}
                  style={{ padding: '7px 13px', borderRadius: 10, border: `1.5px solid ${KYVRA.teal}`, background: 'transparent', color: KYVRA.teal, fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0, fontFamily: FF }}>
                  Cambiar
                </button>
              )}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: KYVRA.border, margin: '0 20px' }} />

            {/* Row: modo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px' }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: KYVRA.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {localFulfillment === 'delivery'
                  ? <Bike size={22} color={KYVRA.teal} strokeWidth={2} />
                  : <ShoppingBag size={22} color={KYVRA.teal} strokeWidth={2} />
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: KYVRA.navy, margin: 0 }}>Modo de entrega</p>
                <p style={{ fontSize: 13, color: KYVRA.textSec, margin: '3px 0 0' }}>
                  {localFulfillment === 'delivery' ? 'Delivery a domicilio' : 'Retirar en el local'}
                </p>
              </div>
              <button type="button" onClick={() => setFulfillmentSheetOpen(true)}
                style={{ padding: '7px 13px', borderRadius: 10, border: `1.5px solid ${KYVRA.teal}`, background: 'transparent', color: KYVRA.teal, fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0, fontFamily: FF }}>
                Cambiar
              </button>
            </div>
          </div>
        </div>

        {/* ── 3. MÉTODO DE PAGO ────────────────────────────────────────── */}
        <div>
          <SectionLabel>Método de pago</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PAYMENT_OPTIONS.map(({ key, label, sub, Icon }) => {
              const active = paymentMethod === key;
              return (
                <motion.button
                  key={key} type="button" whileTap={{ scale: 0.985 }}
                  onClick={() => setPaymentMethod(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    width: '100%', textAlign: 'left', minHeight: 68,
                    padding: '0 18px',
                    borderRadius: 18,
                    border: `2px solid ${active ? KYVRA.teal : KYVRA.border}`,
                    background: active ? KYVRA.tealBg : KYVRA.white,
                    cursor: 'pointer',
                    boxShadow: active ? '0 4px 20px rgba(13,148,136,0.18)' : '0 2px 8px rgba(15,23,42,0.05)',
                    transition: 'border-color 0.18s, background 0.18s, box-shadow 0.18s',
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 15, background: active ? 'rgba(13,148,136,0.14)' : KYVRA.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={22} color={KYVRA.teal} strokeWidth={1.8} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 800, fontSize: 15, color: KYVRA.navy, margin: 0, letterSpacing: '-0.01em' }}>{label}</p>
                    <p style={{ fontSize: 12, color: KYVRA.textSec, margin: '2px 0 0' }}>{sub}</p>
                  </div>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${active ? KYVRA.teal : KYVRA.border}`,
                    background: active ? KYVRA.teal : KYVRA.white,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {active && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Cash expansion */}
          <AnimatePresence>
            {paymentMethod === 'cash' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                style={{ marginTop: 10, borderRadius: 18, padding: '18px 20px', background: '#F0FDF9', border: `1.5px solid ${KYVRA.tealLight}` }}
              >
                <p style={{ fontSize: 13, color: KYVRA.tealDark, margin: '0 0 14px', lineHeight: 1.5 }}>
                  Pagás en efectivo al repartidor al momento de la entrega.
                </p>
                <p style={{ fontSize: 13, fontWeight: 700, color: KYVRA.navy, margin: '0 0 8px' }}>
                  ¿Con cuánto vas a pagar?{' '}
                  <span style={{ fontWeight: 400, color: KYVRA.textMuted }}>(para el cambio, opcional)</span>
                </p>
                <input type="number" inputMode="numeric" min="0"
                  value={cashAmount} onChange={e => setCashAmount(e.target.value)}
                  placeholder="Ej: 5000" style={inputStyle} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transfer expansion */}
          <AnimatePresence>
            {paymentMethod === 'transfer' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                style={{ marginTop: 10, borderRadius: 18, padding: '18px 20px', background: '#F0FDF9', border: `1.5px solid ${KYVRA.tealLight}` }}
              >
                <p style={{ fontSize: 13, fontWeight: 800, color: KYVRA.tealDark, margin: '0 0 14px' }}>
                  Datos para la transferencia
                </p>
                {restaurantInfo.payment_alias ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: KYVRA.white, borderRadius: 14, padding: '12px 16px', marginBottom: 12, border: `1px solid ${KYVRA.border}` }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 10, fontWeight: 800, color: KYVRA.textMuted, textTransform: 'uppercase', letterSpacing: '0.10em', margin: '0 0 3px' }}>Alias / CBU</p>
                        <p style={{ fontWeight: 700, fontSize: 15, fontFamily: 'monospace', color: KYVRA.navy, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {restaurantInfo.payment_alias}
                        </p>
                      </div>
                      <button type="button" onClick={copyAlias}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: aliasCopied ? '#DCFCE7' : KYVRA.teal, color: aliasCopied ? '#15803D' : KYVRA.white, border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s', fontFamily: FF }}>
                        {aliasCopied ? <CheckCircle size={14} /> : <Copy size={14} />}
                        {aliasCopied ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                    <p style={{ fontSize: 13, color: KYVRA.tealDark, margin: '0 0 14px' }}>
                      Transferí <strong>${totalVal.toLocaleString('es-AR')}</strong> y subí el comprobante.
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: 13, color: KYVRA.textSec, margin: '0 0 14px' }}>
                    El restaurante te indicará los datos de transferencia.
                  </p>
                )}

                <p style={{ fontSize: 13, fontWeight: 700, color: KYVRA.navy, margin: '0 0 10px' }}>
                  Comprobante <span style={{ color: '#EF4444' }}>*</span>
                </p>
                <input type="file" accept="image/jpeg,image/png,.pdf" id="receipt-upload"
                  onChange={e => setReceipt(e.target.files[0] || null)} style={{ display: 'none' }} />
                <label htmlFor="receipt-upload" style={{ display: 'block', cursor: 'pointer' }}>
                  <div style={{ border: `2px dashed ${receipt ? KYVRA.teal : KYVRA.tealLight}`, borderRadius: 14, background: receipt ? '#F0FDF9' : KYVRA.white, transition: 'border-color 0.2s' }}>
                    {receipt ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14 }}>
                        {receipt.type.startsWith('image/') ? (
                          <img src={URL.createObjectURL(receipt)} alt="Comprobante" style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 72, height: 72, borderRadius: 12, background: KYVRA.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <CheckCircle size={28} color={KYVRA.teal} />
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: KYVRA.tealDark, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{receipt.name}</p>
                          <p style={{ fontSize: 12, color: KYVRA.teal, margin: '3px 0 8px' }}>Listo para enviar</p>
                          <button type="button" onClick={e => { e.preventDefault(); setReceipt(null); }}
                            style={{ fontSize: 12, color: KYVRA.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            Cambiar archivo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 16px' }}>
                        <div style={{ width: 52, height: 52, borderRadius: 16, background: KYVRA.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Camera size={22} color={KYVRA.teal} />
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: KYVRA.navy, margin: 0 }}>Tocá para subir el comprobante</p>
                        <p style={{ fontSize: 12, color: KYVRA.textMuted, margin: 0 }}>JPG, PNG o PDF</p>
                      </div>
                    )}
                  </div>
                </label>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 4. RESUMEN DEL PEDIDO ─────────────────────────────────────── */}
        <div>
          <SectionLabel>Tu pedido</SectionLabel>
          <div style={{ background: KYVRA.white, borderRadius: 22, border: `1px solid ${KYVRA.border}`, boxShadow: '0 4px 20px rgba(15,23,42,0.07)', overflow: 'hidden' }}>
            {items.map((i, idx) => {
              const lineTotal = i.price * i.qty + (i.extras || 0) * (i.extra_price || 0);
              const extraText = i.extras > 0 ? ` + ${i.extras} ${i.extra_label || 'extra'}` : '';
              const isLast = idx === items.length - 1;
              return (
                <div key={i.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px' }}>
                    {/* Thumbnail */}
                    {i.image_url ? (
                      <img src={i.image_url} alt={i.name} loading="lazy"
                        style={{ width: 64, height: 64, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 64, height: 64, borderRadius: 14, background: KYVRA.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Utensils size={24} color={KYVRA.teal} strokeWidth={1.5} />
                      </div>
                    )}
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: KYVRA.navy, margin: 0, lineHeight: 1.35 }}>{i.name}</p>
                      <p style={{ fontSize: 12, color: KYVRA.textMuted, margin: '3px 0 0' }}>
                        Cantidad: {i.qty}{extraText}
                      </p>
                    </div>
                    {/* Price right */}
                    <p style={{ fontSize: 15, fontWeight: 800, color: KYVRA.teal, margin: 0, flexShrink: 0, letterSpacing: '-0.015em' }}>
                      ${lineTotal.toLocaleString('es-AR')}
                    </p>
                  </div>
                  {!isLast && <div style={{ height: 1, background: KYVRA.border, margin: '0 20px' }} />}
                </div>
              );
            })}

            {/* Total row */}
            <div style={{ background: KYVRA.bg, borderTop: `1px solid ${KYVRA.border}`, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: KYVRA.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>Total</p>
                <p style={{ fontSize: 22, fontWeight: 900, color: KYVRA.navy, margin: 0, letterSpacing: '-0.025em' }}>
                  ${totalVal.toLocaleString('es-AR')}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 12, color: KYVRA.textMuted, margin: '0 0 2px' }}>{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: KYVRA.teal, margin: 0 }}>
                  {localFulfillment === 'delivery' ? 'Con delivery' : 'Retiro en local'}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── 5. FIXED CTA ─────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: KYVRA.white,
        borderTop: `1px solid ${KYVRA.border}`,
        boxShadow: '0 -6px 24px rgba(15,23,42,0.10)',
        padding: '14px 16px',
        paddingBottom: 'calc(14px + env(safe-area-inset-bottom))',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Total left */}
          <div style={{ flexShrink: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: KYVRA.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 1px' }}>Total</p>
            <p style={{ fontSize: 20, fontWeight: 900, color: KYVRA.navy, margin: 0, letterSpacing: '-0.025em' }}>
              ${totalVal.toLocaleString('es-AR')}
            </p>
          </div>
          {/* Button */}
          <motion.button
            type="button" onClick={handlePay} disabled={!canPay}
            whileTap={canPay ? { scale: 0.97 } : {}}
            style={{
              flex: 1, height: 56, borderRadius: 16,
              background: canPay ? KYVRA.teal : KYVRA.border,
              color: canPay ? KYVRA.white : KYVRA.textMuted,
              border: 'none', cursor: canPay ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: FF,
              boxShadow: canPay ? '0 6px 20px rgba(13,148,136,0.38)' : 'none',
              transition: 'background 0.2s, box-shadow 0.2s',
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em' }}>
              {submitting ? 'Procesando...' : 'Confirmar pedido'}
            </span>
            {!submitting && <ArrowRight size={18} strokeWidth={2.5} />}
          </motion.button>
        </div>
      </div>

      {/* ── Modal: teléfono requerido ─────────────────────────────────── */}
      {needsPhone && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(15,23,42,0.65)' }}>
          <div style={{ width: '100%', maxWidth: 480, background: KYVRA.white, borderRadius: '24px 24px 0 0', padding: '32px 24px', paddingBottom: 'calc(32px + env(safe-area-inset-bottom))' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: KYVRA.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Phone size={26} color={KYVRA.teal} />
              </div>
              <h2 style={{ fontWeight: 900, fontSize: 20, color: KYVRA.navy, margin: '0 0 8px', fontFamily: FF, letterSpacing: '-0.02em' }}>
                Teléfono requerido
              </h2>
              <p style={{ fontSize: 14, color: KYVRA.textSec, margin: 0, lineHeight: 1.5 }}>
                Necesitás cargar tu número para hacer pedidos
              </p>
            </div>
            <input
              type="tel" inputMode="numeric"
              value={phoneInput} onChange={e => setPhoneInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && savePhone()}
              placeholder="Ej: 3816 123456"
              style={{ ...inputStyle, textAlign: 'center', fontSize: 20, fontWeight: 700, marginBottom: 14 }}
              autoFocus
            />
            <button type="button" onClick={savePhone} disabled={savingPhone || !phoneInput.trim()}
              style={{ width: '100%', padding: '15px 0', borderRadius: 15, fontSize: 15, fontWeight: 700, border: 'none', background: (savingPhone || !phoneInput.trim()) ? KYVRA.border : KYVRA.teal, color: KYVRA.white, cursor: (savingPhone || !phoneInput.trim()) ? 'not-allowed' : 'pointer', marginBottom: 10, fontFamily: FF, boxShadow: (savingPhone || !phoneInput.trim()) ? 'none' : '0 4px 14px rgba(13,148,136,0.30)' }}>
              {savingPhone ? 'Guardando...' : 'Guardar y continuar'}
            </button>
            <button type="button" onClick={() => navigate(-1)}
              style={{ width: '100%', fontSize: 13, color: KYVRA.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', fontFamily: FF }}>
              Volver
            </button>
          </div>
        </div>
      )}

      {/* ── Sheet: dirección ─────────────────────────────────────────── */}
      {sheetOpen && (
        <AddressSheet
          savedAddresses={savedAddresses} selectedAddrId={selectedAddr?.id}
          showNewAddrForm={showNewAddrForm} newAddrForm={newAddrForm} savingAddr={savingAddr}
          onClose={() => setSheetOpen(false)} onSelectAddress={selectAddress}
          onShowNewForm={setShowNewAddrForm} onChangeNewAddrForm={setNewAddrForm}
          onSaveNewAddress={saveNewAddress}
        />
      )}

      {/* ── Sheet: modo de entrega ───────────────────────────────────── */}
      {fulfillmentSheetOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.55)' }} onClick={() => setFulfillmentSheetOpen(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: KYVRA.white, borderRadius: '24px 24px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${KYVRA.border}`, padding: '18px 20px' }}>
              <h3 style={{ fontWeight: 800, fontSize: 16, color: KYVRA.navy, margin: 0, fontFamily: FF }}>Modo de entrega</h3>
              <button type="button" onClick={() => setFulfillmentSheetOpen(false)}
                style={{ width: 32, height: 32, borderRadius: '50%', background: KYVRA.bg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color={KYVRA.navy} />
              </button>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { key: 'delivery', label: 'Delivery', sub: 'Te lo llevamos a tu domicilio', Icon: Bike },
                { key: 'pickup',   label: 'Retiro en el local', sub: 'Retirás vos mismo en el negocio', Icon: ShoppingBag },
              ].map(({ key, label, sub, Icon }) => (
                <motion.button key={key} type="button" whileTap={{ scale: 0.98 }}
                  onClick={() => { setLocalFulfillment(key); setFulfillmentSheetOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', minHeight: 64, padding: '0 16px', borderRadius: 16, border: `2px solid ${localFulfillment === key ? KYVRA.teal : KYVRA.border}`, background: localFulfillment === key ? KYVRA.tealBg : KYVRA.white, cursor: 'pointer', boxShadow: localFulfillment === key ? '0 4px 16px rgba(13,148,136,0.15)' : 'none', transition: 'all 0.15s' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: localFulfillment === key ? 'rgba(13,148,136,0.14)' : KYVRA.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} color={KYVRA.teal} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: KYVRA.navy, margin: 0, fontFamily: FF }}>{label}</p>
                    <p style={{ fontSize: 12, color: KYVRA.textSec, margin: '2px 0 0' }}>{sub}</p>
                  </div>
                  {localFulfillment === key && <CheckCircle size={20} color={KYVRA.teal} style={{ flexShrink: 0 }} />}
                </motion.button>
              ))}
            </div>
            <div style={{ height: 24 }} />
          </div>
        </div>
      )}
    </div>
  );
}
