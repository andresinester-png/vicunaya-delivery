import { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Copy, CheckCircle, Plus, MapPin, X, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import PlacesInput from '../components/PlacesInput.jsx';
import { supabase } from '../lib/supabase.js';
import useCartStore from '../store/cartStore.js';
import { useAuth } from '../context/AuthContext.jsx';

const LABEL_PRESETS = ['Casa', 'Trabajo', 'Otro'];

function OrderSuccessScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: '#22c55e' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <style>{`
        @keyframes checkmarkDraw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes circlePop {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Círculo blanco con tilde dibujándose */}
      <div
        style={{
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          animation: 'circlePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        }}
      >
        <svg viewBox="0 0 52 52" width={78} height={78} fill="none">
          <path
            d="M14 27 L22 35 L38 17"
            stroke="#22c55e"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={{
              strokeDasharray: 40,
              strokeDashoffset: 40,
              animation: 'checkmarkDraw 0.5s 0.4s ease-out forwards',
            }}
          />
        </svg>
      </div>

      {/* Text */}
      <motion.p
        className="text-3xl font-extrabold text-white mt-7 text-center px-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4, ease: 'easeOut' }}
      >
        ¡Pedido confirmado!
      </motion.p>
      <motion.p
        className="text-base font-semibold mt-2 text-center px-8"
        style={{ color: 'rgba(255,255,255,0.9)' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4, ease: 'easeOut' }}
      >
        Tu pedido está siendo procesado
      </motion.p>
    </motion.div>
  );
}

/* ── Address bottom sheet (componente externo para evitar re-montaje) ── */
const AddressSheet = memo(function AddressSheet({
  savedAddresses,
  selectedAddrId,
  showNewAddrForm,
  newAddrForm,
  savingAddr,
  onClose,
  onSelectAddress,
  onShowNewForm,
  onChangeNewAddrForm,
  onSaveNewAddress,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-2xl bg-white" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h3 className="font-bold text-base">Tus direcciones</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Saved addresses list */}
        {savedAddresses.length > 0 && (
          <div className="divide-y divide-gray-100">
            {savedAddresses.map(addr => (
              <button
                key={addr.id}
                type="button"
                onClick={() => onSelectAddress(addr)}
                className={`flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-gray-50 ${
                  selectedAddrId === addr.id ? 'bg-red-50' : ''
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-primary">
                  <MapPin size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{addr.label}</p>
                  <p className="truncate text-xs text-gray-500">{addr.address}</p>
                  {addr.notes && <p className="truncate text-xs text-gray-400">{addr.notes}</p>}
                </div>
                {selectedAddrId === addr.id && (
                  <CheckCircle size={18} className="shrink-0 text-primary" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Add new address toggle / form */}
        {!showNewAddrForm ? (
          <button
            type="button"
            onClick={() => onShowNewForm(true)}
            className="flex w-full items-center gap-2 p-4 text-sm font-medium text-primary transition-colors hover:bg-gray-50"
          >
            <Plus size={16} /> Agregar nueva dirección
          </button>
        ) : (
          <div className="space-y-3 border-t border-gray-100 p-4">
            <p className="font-semibold text-sm">Nueva dirección</p>
            <div className="flex gap-2">
              {LABEL_PRESETS.map(lbl => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => onChangeNewAddrForm(f => ({ ...f, label: lbl }))}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    newAddrForm.label === lbl
                      ? 'border-primary bg-red-50 text-primary'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
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
                <button
                  type="button"
                  onClick={() => onShowNewForm(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
              )}
              <button
                type="button"
                onClick={onSaveNewAddress}
                disabled={savingAddr}
                className="btn-primary flex-1"
              >
                {savingAddr ? 'Guardando...' : 'Guardar y usar'}
              </button>
            </div>
          </div>
        )}

        {/* Safe area padding for phones */}
        <div className="h-safe-bottom h-4" />
      </div>
    </div>
  );
});

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, restaurantId, restaurantName, fulfillmentMethod, clear } = useCartStore();
  const totalVal = total();
  const { session, profile } = useAuth();

  const [restaurantInfo, setRestaurantInfo] = useState({ pickup_address: '', payment_alias: '' });
  const [receipt, setReceipt] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [cashAmount, setCashAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aliasCopied, setAliasCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState(null);

  // Address state (sólo relevante para delivery)
  const [address, setAddress] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddr, setSelectedAddr] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showNewAddrForm, setShowNewAddrForm] = useState(false);
  const [newAddrForm, setNewAddrForm] = useState({ label: 'Casa', address: '', notes: '' });
  const [savingAddr, setSavingAddr] = useState(false);

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
        user_id: session.user.id,
        label: newAddrForm.label || 'Casa',
        address: newAddrForm.address.trim(),
        notes: newAddrForm.notes.trim() || null,
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

  if (showSuccess) return <OrderSuccessScreen />;

  if (items.length === 0) {
    navigate('/');
    return null;
  }

  const copyAlias = () => {
    navigator.clipboard.writeText(restaurantInfo.payment_alias);
    setAliasCopied(true);
    setTimeout(() => setAliasCopied(false), 2000);
    toast.success('Alias copiado');
  };

  const uploadReceipt = async (file) => {
    const ext = file.name.split('.').pop();
    const path = `receipts/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('comprobantes').upload(path, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('comprobantes').getPublicUrl(path);
    return publicUrl;
  };

  const handlePay = async () => {
    if (paymentMethod === 'transfer' && !receipt) {
      toast.error('Subí el comprobante de transferencia para continuar');
      return;
    }
    if (fulfillmentMethod === 'delivery' && !address.trim()) {
      toast.error('Ingresá la dirección de entrega');
      return;
    }

    setSubmitting(true);
    try {
      const receiptUrl = paymentMethod === 'transfer' ? await uploadReceipt(receipt) : null;

      const orderItems = items.map(i => ({
        id: i.id, name: i.name, price: i.price, qty: i.qty,
        extras: i.extras || 0, extra_price: i.extra_price || 0,
      }));

      const customerName = `${profile?.nombre || ''} ${profile?.apellido || ''}`.trim();

      const { data: order, error } = await supabase.from('orders').insert({
        restaurant_id: restaurantId,
        customer_name: customerName,
        customer_phone: profile?.telefono || '',
        customer_address: fulfillmentMethod === 'delivery' ? address.trim() : 'Retira en el local',
        delivery_method: fulfillmentMethod,
        items: orderItems,
        subtotal: totalVal,
        total: totalVal,
        payment_method: paymentMethod,
        comprobante_url: receiptUrl,
        notes: paymentMethod === 'cash' && cashAmount.trim()
          ? `Paga en efectivo con $${cashAmount.trim()}`
          : null,
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

  return (
    <div className="min-h-screen bg-gray-100" style={{ paddingBottom: 110 }}>
      <nav className="bg-white shadow-nav sticky top-0 z-40">
        <div className="h-14 flex items-center px-4 gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold">Pagar</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Monto total */}
        <div className="card p-6 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total a pagar</p>
          <p className="text-4xl font-extrabold text-primary">${totalVal.toLocaleString('es-AR')}</p>
          {restaurantName && <p className="text-xs text-gray-400 mt-1">{restaurantName}</p>}
        </div>

        {/* Dirección de entrega / retiro en local */}
        {fulfillmentMethod === 'delivery' ? (
          <div className="card p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-lg">📍</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">Dirección de entrega</p>
              <p className="truncate text-xs text-gray-500 mt-0.5">{address || 'Sin dirección'}</p>
            </div>
            <button type="button" onClick={() => openSheet(false)} className="shrink-0 text-sm font-bold text-primary">
              Cambiar
            </button>
          </div>
        ) : (
          <div className="card p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-lg">🏪</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">Retirás en el local</p>
              <p className="truncate text-xs text-gray-500 mt-0.5">{restaurantInfo.pickup_address || restaurantName}</p>
            </div>
          </div>
        )}

        {/* Modo de envío */}
        <div className="card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-lg">
            {fulfillmentMethod === 'delivery' ? '🛵' : '🏪'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">Modo de entrega</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {fulfillmentMethod === 'delivery' ? 'Delivery' : 'Retirar en el local'}
            </p>
          </div>
        </div>

        {/* Método de pago */}
        <div className="card p-5 space-y-3">
          <h2 className="font-bold text-base">Método de pago</h2>

          <button
            type="button"
            onClick={() => setPaymentMethod('transfer')}
            className="flex items-center gap-3 rounded-xl border-2 p-3 w-full text-left transition-colors"
            style={{
              borderColor: paymentMethod === 'transfer' ? '#e31b23' : '#E5E7EB',
              background: paymentMethod === 'transfer' ? '#fef2f2' : '#fff',
            }}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-lg">🏦</div>
            <p className="font-bold text-sm flex-1">Transferencia bancaria</p>
            {paymentMethod === 'transfer' && <CheckCircle size={18} className="text-primary shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('cash')}
            className="flex items-center gap-3 rounded-xl border-2 p-3 w-full text-left transition-colors"
            style={{
              borderColor: paymentMethod === 'cash' ? '#e31b23' : '#E5E7EB',
              background: paymentMethod === 'cash' ? '#fef2f2' : '#fff',
            }}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-lg">💵</div>
            <p className="font-bold text-sm flex-1">Efectivo</p>
            {paymentMethod === 'cash' && <CheckCircle size={18} className="text-primary shrink-0" />}
          </button>

          {paymentMethod === 'cash' && (
            <div className="rounded-xl p-4 space-y-3" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <p className="text-sm" style={{ color: '#166534' }}>
                Pagás en efectivo al repartidor al momento de la entrega
              </p>
              <div>
                <span className="text-sm font-bold text-gray-700 block mb-2">
                  ¿Con cuánto vas a pagar? <span className="text-gray-400 font-normal">(para el cambio, opcional)</span>
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={cashAmount}
                  onChange={e => setCashAmount(e.target.value)}
                  placeholder="Ej: 5000"
                  className="input"
                />
              </div>
            </div>
          )}

          {paymentMethod === 'transfer' && (
          <div className="rounded-xl p-4 space-y-3" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <p className="text-sm font-bold" style={{ color: '#15803D' }}>Datos para la transferencia</p>

            {restaurantInfo.payment_alias ? (
              <>
                <div className="flex items-center justify-between gap-3 bg-white rounded-xl p-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Alias / CBU</p>
                    <p className="font-bold text-base font-mono text-gray-900 truncate">{restaurantInfo.payment_alias}</p>
                  </div>
                  <button
                    type="button"
                    onClick={copyAlias}
                    className="flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-xl text-sm font-bold transition-colors"
                    style={{
                      background: aliasCopied ? '#DCFCE7' : '#e31b23',
                      color: aliasCopied ? '#16A34A' : '#fff',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {aliasCopied ? <CheckCircle size={15} /> : <Copy size={15} />}
                    {aliasCopied ? 'Copiado' : 'Copiar alias'}
                  </button>
                </div>
                <p className="text-sm" style={{ color: '#166534' }}>
                  Transferí <strong>${totalVal.toLocaleString('es-AR')}</strong> y subí el comprobante para confirmar tu pedido.
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">El restaurante te indicará los datos de transferencia.</p>
            )}

            <div>
              <span className="text-sm font-bold text-gray-700 block mb-2">
                Subir comprobante de transferencia <span className="text-red-500">*</span>
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,.pdf"
                className="hidden"
                id="receipt-upload"
                onChange={e => setReceipt(e.target.files[0] || null)}
              />
              <label htmlFor="receipt-upload" className="block cursor-pointer">
                <div
                  className="border-2 border-dashed rounded-xl transition-colors"
                  style={{ borderColor: receipt ? '#16A34A' : '#BBF7D0', background: receipt ? '#F0FDF4' : '#fff' }}
                >
                  {receipt ? (
                    <div className="flex items-center gap-3 p-3">
                      {receipt.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(receipt)}
                          alt="Comprobante"
                          className="rounded-xl object-cover shrink-0"
                          style={{ width: 72, height: 72 }}
                        />
                      ) : (
                        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-xl bg-green-100">
                          <CheckCircle size={28} className="text-green-600" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-green-700 leading-tight truncate">{receipt.name}</p>
                        <p className="text-xs text-green-600 mt-0.5">Listo para enviar</p>
                        <button
                          type="button"
                          onClick={e => { e.preventDefault(); setReceipt(null); }}
                          className="text-xs text-gray-400 hover:text-red-500 mt-1 transition-colors"
                        >
                          Cambiar archivo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-6 px-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: '#DCFCE7' }}>
                        <Camera size={22} style={{ color: '#16A34A' }} />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">Tocá para subir el comprobante</p>
                      <p className="text-xs text-gray-400">JPG, PNG o PDF</p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
          )}
        </div>

        {/* Resumen del pedido */}
        <div className="card p-5">
          <h2 className="font-bold text-base mb-3">Tu pedido</h2>
          <div className="space-y-3">
            {items.map(i => {
              const lineTotal = i.price * i.qty + (i.extras || 0) * (i.extra_price || 0);
              const extraText = i.extras > 0 ? ` + ${i.extras} ${i.extra_label || 'extra'}` : '';
              return (
                <div key={i.id} className="flex items-center gap-3">
                  {i.image_url ? (
                    <img src={i.image_url} alt={i.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl shrink-0">🍽️</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight truncate">{i.qty} × {i.name}{extraText}</p>
                  </div>
                  <p className="text-primary font-bold text-sm shrink-0">${lineTotal.toLocaleString('es-AR')}</p>
                </div>
              );
            })}
          </div>
          <div className="border-t border-neutral-100 mt-4 pt-3 flex justify-between font-bold text-base">
            <span>Valor total del pedido</span>
            <span className="text-primary">${totalVal.toLocaleString('es-AR')}</span>
          </div>
        </div>
      </div>

      {/* Barra inferior fija */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white"
        style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.10)', padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-2xl mx-auto">
          <button type="button" onClick={handlePay} disabled={submitting || !paymentMethod || (paymentMethod === 'transfer' && !receipt)} className="btn-primary w-full flex items-center justify-between text-base py-4">
            <span>{submitting ? 'Procesando...' : 'Pagar'}</span>
            <span className="font-extrabold">${totalVal.toLocaleString('es-AR')}</span>
          </button>
        </div>
      </div>

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
    </div>
  );
}
