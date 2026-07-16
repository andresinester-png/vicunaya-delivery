import { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Bell, Copy, CheckCircle, Plus, MapPin, X, Camera,
  Bike, Building2, Banknote, ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import PlacesInput from '../components/PlacesInput.jsx';
import { supabase } from '../lib/supabase.js';
import useCartStore from '../store/cartStore.js';
import { useAuth } from '../context/AuthContext.jsx';

const TEAL     = '#0D9488';
const TEAL_BG  = '#F0FDFA';
const NAVY     = '#0F172A';
const LABEL_PRESETS = ['Casa', 'Trabajo', 'Otro'];

// ── Pantalla de éxito ────────────────────────────────────────────────────────
function OrderSuccessScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: '#2E7D32' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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
        width: 140, height: 140, borderRadius: '50%', background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
        animation: 'circlePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      }}>
        <svg viewBox="0 0 52 52" width={78} height={78} fill="none">
          <path
            d="M14 27 L22 35 L38 17"
            stroke="#2E7D32" strokeWidth="5"
            strokeLinecap="round" strokeLinejoin="round" fill="none"
            style={{ strokeDasharray: 40, strokeDashoffset: 40, animation: 'checkmarkDraw 0.5s 0.4s ease-out forwards' }}
          />
        </svg>
      </div>
      <motion.p
        className="text-3xl font-extrabold text-white mt-7 text-center px-8"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4 }}
      >
        ¡Pedido confirmado!
      </motion.p>
      <motion.p
        className="text-base font-semibold mt-2 text-center px-8"
        style={{ color: 'rgba(255,255,255,0.9)' }}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        Tu pedido está siendo procesado
      </motion.p>
    </motion.div>
  );
}

// ── Address bottom sheet ─────────────────────────────────────────────────────
const AddressSheet = memo(function AddressSheet({
  savedAddresses, selectedAddrId, showNewAddrForm,
  newAddrForm, savingAddr,
  onClose, onSelectAddress, onShowNewForm, onChangeNewAddrForm, onSaveNewAddress,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-2xl bg-white" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h3 className="font-bold text-base">Tus direcciones</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        {savedAddresses.length > 0 && (
          <div className="divide-y divide-gray-100">
            {savedAddresses.map(addr => (
              <button
                key={addr.id} type="button"
                onClick={() => onSelectAddress(addr)}
                className={`flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-gray-50 ${selectedAddrId === addr.id ? 'bg-teal-50' : ''}`}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: TEAL_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={17} color={TEAL} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{addr.label}</p>
                  <p className="truncate text-xs text-gray-500">{addr.address}</p>
                  {addr.notes && <p className="truncate text-xs text-gray-400">{addr.notes}</p>}
                </div>
                {selectedAddrId === addr.id && <CheckCircle size={18} style={{ color: TEAL, flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        )}
        {!showNewAddrForm ? (
          <button
            type="button" onClick={() => onShowNewForm(true)}
            className="flex w-full items-center gap-2 p-4 text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ color: TEAL }}
          >
            <Plus size={16} /> Agregar nueva dirección
          </button>
        ) : (
          <div className="space-y-3 border-t border-gray-100 p-4">
            <p className="font-semibold text-sm">Nueva dirección</p>
            <div className="flex gap-2">
              {LABEL_PRESETS.map(lbl => (
                <button
                  key={lbl} type="button"
                  onClick={() => onChangeNewAddrForm(f => ({ ...f, label: lbl }))}
                  className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                  style={{
                    borderColor: newAddrForm.label === lbl ? TEAL : '#E5E7EB',
                    background:  newAddrForm.label === lbl ? TEAL_BG : '#fff',
                    color:       newAddrForm.label === lbl ? TEAL : '#6B7280',
                  }}
                >
                  {lbl}
                </button>
              ))}
            </div>
            <PlacesInput
              value={newAddrForm.address}
              onChange={v => onChangeNewAddrForm(f => ({ ...f, address: v }))}
              placeholder="Calle y número"
              className="input"
            />
            <input
              value={newAddrForm.notes}
              onChange={e => onChangeNewAddrForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Piso, depto, referencia... (opcional)"
              className="input"
            />
            <div className="flex gap-2">
              {savedAddresses.length > 0 && (
                <button type="button" onClick={() => onShowNewForm(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium hover:bg-gray-50">
                  Cancelar
                </button>
              )}
              <button type="button" onClick={onSaveNewAddress} disabled={savingAddr}
                className="btn-primary flex-1">
                {savingAddr ? 'Guardando...' : 'Guardar y usar'}
              </button>
            </div>
          </div>
        )}
        <div className="h-4" />
      </div>
    </div>
  );
});

// ── Checkout principal ───────────────────────────────────────────────────────
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

  const [localFulfillment,    setLocalFulfillment]    = useState(fulfillmentMethod);
  const [fulfillmentSheetOpen, setFulfillmentSheetOpen] = useState(false);

  const [address,        setAddress]        = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddr,   setSelectedAddr]   = useState(null);
  const [sheetOpen,      setSheetOpen]      = useState(false);
  const [showNewAddrForm, setShowNewAddrForm] = useState(false);
  const [newAddrForm,    setNewAddrForm]    = useState({ label: 'Casa', address: '', notes: '' });
  const [savingAddr,     setSavingAddr]     = useState(false);

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
    setSelectedAddr(addr);
    setAddress(addr.address);
    setSheetOpen(false);
    setShowNewAddrForm(false);
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
        user_id:    session.user.id,
        label:      newAddrForm.label || 'Casa',
        address:    newAddrForm.address.trim(),
        notes:      newAddrForm.notes.trim() || null,
        is_default: savedAddresses.length === 0,
      }).select().single();
      if (error) throw error;
      setSavedAddresses(prev => [...prev, data]);
      setNewAddrForm({ label: 'Casa', address: '', notes: '' });
      selectAddress(data);
      toast.success('Dirección guardada');
    } catch (err) {
      toast.error('Error al guardar: ' + err.message);
    } finally {
      setSavingAddr(false);
    }
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
      setLocalPhone(cleaned);
      toast.success('Teléfono guardado');
    } catch (err) {
      toast.error('Error al guardar: ' + err.message);
    } finally {
      setSavingPhone(false);
    }
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
      const receiptUrl   = paymentMethod === 'transfer' ? await uploadReceipt(receipt) : null;
      const orderItems   = items.map(i => ({
        id: i.id, name: i.name, price: i.price, qty: i.qty,
        extras: i.extras || 0, extra_price: i.extra_price || 0,
      }));
      const customerName = `${profile?.nombre || ''} ${profile?.apellido || ''}`.trim();
      const { data: order, error } = await supabase.from('orders').insert({
        restaurant_id:    restaurantId,
        user_id:          session?.user?.id || null,
        customer_name:    customerName,
        customer_phone:   effectivePhone,
        customer_address: localFulfillment === 'delivery' ? address.trim() : 'Retira en el local',
        delivery_method:  localFulfillment,
        items:            orderItems,
        subtotal:         totalVal,
        total:            totalVal,
        payment_method:   paymentMethod,
        comprobante_url:  receiptUrl,
        notes:            paymentMethod === 'cash' && cashAmount.trim()
          ? `Paga en efectivo con $${cashAmount.trim()}` : null,
        order_status: 'pending',
      }).select().single();
      if (error) throw error;
      setSuccessOrderId(order.id);
      setShowSuccess(true);
    } catch (err) {
      toast.error('Error al enviar el pedido: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const canPay = paymentMethod && !(paymentMethod === 'transfer' && !receipt) && !submitting;

  // ── Estilos compartidos ──────────────────────────────────────────────────
  const sectionCard = {
    background: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  };
  const iconBox = {
    width: 40, height: 40, borderRadius: 12,
    background: TEAL_BG,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#F8F9FF', fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: 96 }}>

      {/* ── Header blanco ─────────────────────────────────────────────── */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #E2E8F0',
        height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: 36, height: 36, borderRadius: '50%', background: '#F1F5F9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={20} color={NAVY} strokeWidth={2.5} />
        </button>
        <span style={{ fontWeight: 800, fontSize: 17, color: NAVY, letterSpacing: '-0.01em' }}>
          Kyvra
        </span>
        <button
          style={{ width: 36, height: 36, borderRadius: '50%', background: TEAL_BG, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Bell size={18} color={TEAL} strokeWidth={2} />
        </button>
      </header>

      {/* ── Hero card teal ────────────────────────────────────────────── */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{
          background: TEAL, borderRadius: 20,
          padding: '24px 24px 22px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Blur circles decorativos */}
          <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', filter: 'blur(32px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', filter: 'blur(24px)', pointerEvents: 'none' }} />

          <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 10px' }}>
            Total a pagar
          </p>
          <p style={{ color: '#fff', fontSize: 46, fontWeight: 900, margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>
            ${totalVal.toLocaleString('es-AR')}
          </p>
          {restaurantName && (
            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, fontWeight: 600, margin: '8px 0 0' }}>
              {restaurantName}
            </p>
          )}
        </div>
      </div>

      {/* ── Cards de entrega ──────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Dirección */}
        {localFulfillment === 'delivery' ? (
          <div style={{ ...sectionCard, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
            <div style={iconBox}><MapPin size={18} color={TEAL} strokeWidth={2} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: NAVY, margin: 0 }}>Dirección de entrega</p>
              <p style={{ fontSize: 12, color: '#64748B', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {address || 'Sin dirección'}
              </p>
            </div>
            <button
              type="button" onClick={() => openSheet(false)}
              style={{ color: TEAL, fontSize: 13, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0 }}
            >
              Cambiar
            </button>
          </div>
        ) : (
          <div style={{ ...sectionCard, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
            <div style={iconBox}><Building2 size={18} color={TEAL} strokeWidth={2} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: NAVY, margin: 0 }}>Retirás en el local</p>
              <p style={{ fontSize: 12, color: '#64748B', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {restaurantInfo.pickup_address || restaurantName}
              </p>
            </div>
          </div>
        )}

        {/* Modo de entrega */}
        <div style={{ ...sectionCard, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
          <div style={iconBox}>
            {localFulfillment === 'delivery'
              ? <Bike size={18} color={TEAL} strokeWidth={2} />
              : <Building2 size={18} color={TEAL} strokeWidth={2} />
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: NAVY, margin: 0 }}>Modo de entrega</p>
            <p style={{ fontSize: 12, color: '#64748B', margin: '3px 0 0' }}>
              {localFulfillment === 'delivery' ? 'Delivery a domicilio' : 'Retirar en el local'}
            </p>
          </div>
          <button
            type="button" onClick={() => setFulfillmentSheetOpen(true)}
            style={{ color: TEAL, fontSize: 13, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0 }}
          >
            Cambiar
          </button>
        </div>
      </div>

      {/* ── Método de pago ───────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ ...sectionCard, padding: '18px 16px' }}>
          <p style={{ fontWeight: 800, fontSize: 15, color: NAVY, margin: '0 0 14px', letterSpacing: '-0.01em' }}>Método de pago</p>

          {/* Transferencia */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setPaymentMethod('transfer')}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              width: '100%', textAlign: 'left',
              padding: '14px 14px',
              borderRadius: 14,
              border: `2px solid ${paymentMethod === 'transfer' ? TEAL : '#E2E8F0'}`,
              background: paymentMethod === 'transfer' ? TEAL_BG : '#fff',
              cursor: 'pointer', marginBottom: 10,
              transition: 'border-color 0.15s ease, background 0.15s ease',
            }}
          >
            <div style={{ ...iconBox, background: paymentMethod === 'transfer' ? 'rgba(13,148,136,0.12)' : '#F8FAFC' }}>
              <Banknote size={18} color={TEAL} strokeWidth={2} />
            </div>
            <p style={{ fontWeight: 700, fontSize: 13, color: NAVY, flex: 1, margin: 0 }}>Transferencia bancaria</p>
            {/* Radio button */}
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${paymentMethod === 'transfer' ? TEAL : '#CBD5E1'}`,
              background: paymentMethod === 'transfer' ? TEAL : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {paymentMethod === 'transfer' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
            </div>
          </motion.button>

          {/* Efectivo */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setPaymentMethod('cash')}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              width: '100%', textAlign: 'left',
              padding: '14px 14px',
              borderRadius: 14,
              border: `2px solid ${paymentMethod === 'cash' ? TEAL : '#E2E8F0'}`,
              background: paymentMethod === 'cash' ? TEAL_BG : '#fff',
              cursor: 'pointer',
              transition: 'border-color 0.15s ease, background 0.15s ease',
            }}
          >
            <div style={{ ...iconBox, background: paymentMethod === 'cash' ? 'rgba(13,148,136,0.12)' : '#F8FAFC' }}>
              <Banknote size={18} color={TEAL} strokeWidth={2} />
            </div>
            <p style={{ fontWeight: 700, fontSize: 13, color: NAVY, flex: 1, margin: 0 }}>Efectivo</p>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${paymentMethod === 'cash' ? TEAL : '#CBD5E1'}`,
              background: paymentMethod === 'cash' ? TEAL : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {paymentMethod === 'cash' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
            </div>
          </motion.button>

          {/* Efectivo — campo vuelto */}
          {paymentMethod === 'cash' && (
            <div style={{ marginTop: 12, borderRadius: 14, padding: '14px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <p style={{ fontSize: 13, color: '#166534', margin: '0 0 10px' }}>
                Pagás en efectivo al repartidor al momento de la entrega
              </p>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>
                ¿Con cuánto vas a pagar? <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(para el cambio, opcional)</span>
              </span>
              <input
                type="number" inputMode="numeric" min="0"
                value={cashAmount} onChange={e => setCashAmount(e.target.value)}
                placeholder="Ej: 5000" className="input"
              />
            </div>
          )}

          {/* Transferencia — alias y comprobante */}
          {paymentMethod === 'transfer' && (
            <div style={{ marginTop: 12, borderRadius: 14, padding: '14px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#15803D', margin: '0 0 12px' }}>Datos para la transferencia</p>
              {restaurantInfo.payment_alias ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#fff', borderRadius: 12, padding: '10px 14px', marginBottom: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px' }}>Alias / CBU</p>
                      <p style={{ fontWeight: 700, fontSize: 15, fontFamily: 'monospace', color: NAVY, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{restaurantInfo.payment_alias}</p>
                    </div>
                    <button
                      type="button" onClick={copyAlias}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                        background: aliasCopied ? '#DCFCE7' : TEAL,
                        color: aliasCopied ? '#15803D' : '#fff',
                        border: 'none', cursor: 'pointer', flexShrink: 0,
                      }}
                    >
                      {aliasCopied ? <CheckCircle size={14} /> : <Copy size={14} />}
                      {aliasCopied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <p style={{ fontSize: 13, color: '#166534', margin: '0 0 12px' }}>
                    Transferí <strong>${totalVal.toLocaleString('es-AR')}</strong> y subí el comprobante para confirmar tu pedido.
                  </p>
                </>
              ) : (
                <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 12px' }}>El restaurante te indicará los datos de transferencia.</p>
              )}
              {/* Upload comprobante */}
              <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>
                Subir comprobante <span style={{ color: '#EF4444' }}>*</span>
              </span>
              <input type="file" accept="image/jpeg,image/png,.pdf" className="hidden" id="receipt-upload"
                onChange={e => setReceipt(e.target.files[0] || null)} />
              <label htmlFor="receipt-upload" style={{ display: 'block', cursor: 'pointer' }}>
                <div style={{
                  border: `2px dashed ${receipt ? '#2E7D32' : '#BBF7D0'}`,
                  borderRadius: 12,
                  background: receipt ? '#F0FDF4' : '#fff',
                }}>
                  {receipt ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
                      {receipt.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(receipt)} alt="Comprobante"
                          style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 72, height: 72, borderRadius: 10, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <CheckCircle size={28} style={{ color: '#16A34A' }} />
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#15803D', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{receipt.name}</p>
                        <p style={{ fontSize: 12, color: '#16A34A', margin: '3px 0 6px' }}>Listo para enviar</p>
                        <button type="button" onClick={e => { e.preventDefault(); setReceipt(null); }}
                          style={{ fontSize: 12, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          Cambiar archivo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '20px 16px' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Camera size={20} style={{ color: '#16A34A' }} />
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>Tocá para subir el comprobante</p>
                      <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>JPG, PNG o PDF</p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* ── Resumen del pedido ───────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ ...sectionCard, padding: '18px 16px' }}>
          <p style={{ fontWeight: 800, fontSize: 15, color: NAVY, margin: '0 0 14px', letterSpacing: '-0.01em' }}>Tu pedido</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {items.map(i => {
              const lineTotal = i.price * i.qty + (i.extras || 0) * (i.extra_price || 0);
              const extraText = i.extras > 0 ? ` + ${i.extras} ${i.extra_label || 'extra'}` : '';
              return (
                <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {i.image_url ? (
                    <img src={i.image_url} alt={i.name} loading="lazy"
                      style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 80, height: 80, borderRadius: 12, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 28 }}>🍽️</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: 0, lineHeight: 1.3 }}>{i.qty} × {i.name}</p>
                    {extraText && <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>{extraText}</p>}
                    <p style={{ fontSize: 15, fontWeight: 800, color: TEAL, margin: '6px 0 0' }}>
                      ${lineTotal.toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ borderTop: '1px solid #E2E8F0', marginTop: 14, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#64748B' }}>Valor total</span>
            <span style={{ fontWeight: 900, fontSize: 17, color: TEAL }}>${totalVal.toLocaleString('es-AR')}</span>
          </div>
        </div>
      </div>

      {/* ── Botón pagar fixed ─────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: '#fff',
        borderTop: '1px solid #E2E8F0',
        padding: '12px 16px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
      }}>
        <motion.button
          type="button"
          onClick={handlePay}
          disabled={!canPay}
          whileTap={canPay ? { y: 3, boxShadow: '0 2px 0 0 #0A7067' } : {}}
          style={{
            width: '100%', height: 64,
            borderRadius: 16,
            background: canPay ? TEAL : '#CBD5E1',
            color: '#fff',
            border: 'none',
            cursor: canPay ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 22px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            boxShadow: canPay ? '0 6px 0 0 #0A7067' : 'none',
            transition: 'background 0.2s ease, box-shadow 0.15s ease',
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em' }}>
            {submitting ? 'Procesando...' : 'Pagar ahora'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 900 }}>${totalVal.toLocaleString('es-AR')}</span>
            <ArrowRight size={18} strokeWidth={2.5} />
          </div>
        </motion.button>
      </div>

      {/* ── Modal teléfono requerido ──────────────────────────────────── */}
      {needsPhone && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
          <div style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: '24px 24px 0 0', padding: '28px 20px', paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: TEAL_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Bell size={24} color={TEAL} />
              </div>
              <h2 style={{ fontWeight: 900, fontSize: 18, color: NAVY, margin: '0 0 6px' }}>Teléfono requerido</h2>
              <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>Necesitás cargar tu número para hacer pedidos</p>
            </div>
            <input
              type="tel" inputMode="numeric"
              value={phoneInput} onChange={e => setPhoneInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && savePhone()}
              placeholder="Ej: 3816 123456"
              className="input"
              style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, marginBottom: 12 }}
              autoFocus
            />
            <button type="button" onClick={savePhone} disabled={savingPhone || !phoneInput.trim()} className="btn-primary w-full py-3" style={{ marginBottom: 8 }}>
              {savingPhone ? 'Guardando...' : 'Guardar y continuar'}
            </button>
            <button type="button" onClick={() => navigate(-1)} style={{ width: '100%', fontSize: 13, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0' }}>
              Volver
            </button>
          </div>
        </div>
      )}

      {/* ── Sheet: dirección ─────────────────────────────────────────── */}
      {sheetOpen && (
        <AddressSheet
          savedAddresses={savedAddresses}
          selectedAddrId={selectedAddr?.id}
          showNewAddrForm={showNewAddrForm}
          newAddrForm={newAddrForm}
          savingAddr={savingAddr}
          onClose={() => setSheetOpen(false)}
          onSelectAddress={selectAddress}
          onShowNewForm={setShowNewAddrForm}
          onChangeNewAddrForm={setNewAddrForm}
          onSaveNewAddress={saveNewAddress}
        />
      )}

      {/* ── Sheet: modo de entrega ───────────────────────────────────── */}
      {fulfillmentSheetOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setFulfillmentSheetOpen(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: '#fff', borderRadius: '24px 24px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', padding: '16px 16px' }}>
              <h3 style={{ fontWeight: 800, fontSize: 15, color: NAVY, margin: 0 }}>Modo de entrega</h3>
              <button type="button" onClick={() => setFulfillmentSheetOpen(false)}
                style={{ width: 32, height: 32, borderRadius: '50%', background: '#F1F5F9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color={NAVY} />
              </button>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { key: 'delivery', label: 'Delivery', sub: 'Te lo llevamos a tu domicilio', Icon: Bike },
                { key: 'pickup',   label: 'Retiro en el local', sub: 'Retirás vos mismo en el negocio', Icon: Building2 },
              ].map(({ key, label, sub, Icon }) => (
                <motion.button
                  key={key} type="button" whileTap={{ scale: 0.98 }}
                  onClick={() => { setLocalFulfillment(key); setFulfillmentSheetOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', textAlign: 'left',
                    padding: '14px 14px', borderRadius: 14,
                    border: `2px solid ${localFulfillment === key ? TEAL : '#E2E8F0'}`,
                    background: localFulfillment === key ? TEAL_BG : '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ ...iconBox, background: localFulfillment === key ? 'rgba(13,148,136,0.12)' : '#F8FAFC' }}>
                    <Icon size={18} color={TEAL} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, color: NAVY, margin: 0 }}>{label}</p>
                    <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>{sub}</p>
                  </div>
                  {localFulfillment === key && <CheckCircle size={18} style={{ color: TEAL, flexShrink: 0 }} />}
                </motion.button>
              ))}
            </div>
            <div style={{ height: 16 }} />
          </div>
        </div>
      )}
    </div>
  );
}
