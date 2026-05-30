import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload, Copy, CheckCircle, Plus, Minus, Trash2, MapPin, X, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import PaymentSelector from '../components/PaymentSelector.jsx';
import PlacesInput from '../components/PlacesInput.jsx';
import { supabase } from '../lib/supabase.js';
import useCartStore from '../store/cartStore.js';
import useProfileStore from '../store/profileStore.js';

const PAYMENT_LABELS = {
  cash: 'Efectivo',
  transfer: 'Transferencia bancaria',
  card: 'Tarjeta (MercadoPago)',
};

const LABEL_PRESETS = ['Casa', 'Trabajo', 'Otro'];

function OrderSuccessScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Checkmark SVG */}
      <motion.svg
        viewBox="0 0 100 100"
        width={140}
        height={140}
        fill="none"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 22 }}
      >
        <circle cx="50" cy="50" r="50" fill="#22c55e" />
        <path
          d="M 22 52 L 40 70 L 76 30"
          stroke="white"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </motion.svg>

      {/* Text */}
      <motion.p
        className="text-3xl font-extrabold text-gray-900 mt-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4, ease: 'easeOut' }}
      >
        ¡Pedido enviado!
      </motion.p>
      <motion.p
        className="text-base text-gray-500 mt-2 text-center px-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4, ease: 'easeOut' }}
      >
        El restaurante recibirá tu pedido en breve
      </motion.p>
    </motion.div>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, restaurantId, clear, updateQty } = useCartStore();
  const totalVal = total();

  const { name: profileName, phone: profilePhone, address: profileAddress } = useProfileStore();
  const [form, setForm] = useState({ name: profileName, phone: profilePhone, address: profileAddress, notes: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receipt, setReceipt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [aliasCopied, setAliasCopied] = useState(false);
  const [restaurantAlias, setRestaurantAlias] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState(null);

  // FIX: clear() se llama aquí, DESPUÉS de que showSuccess ya está en true
  // y el navigate ocurre al final del timeout, no antes.
  useEffect(() => {
    if (!showSuccess || !successOrderId) return;
    clear(); // vaciamos el carrito recién ahora, cuando ya estamos mostrando la pantalla
    const t = setTimeout(() => navigate(`/pedido/${successOrderId}`), 2500);
    return () => clearTimeout(t);
  }, [showSuccess, successOrderId]);

  const [step, setStep] = useState(1);

  // Address state
  const [userId, setUserId] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddrId, setSelectedAddrId] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showNewAddrForm, setShowNewAddrForm] = useState(false);
  const [newAddrForm, setNewAddrForm] = useState({ label: 'Casa', address: '', notes: '' });
  const [savingAddr, setSavingAddr] = useState(false);

  useEffect(() => {
    if (restaurantId) {
      supabase.from('restaurants').select('payment_alias').eq('id', restaurantId).single()
        .then(({ data }) => { if (data?.payment_alias) setRestaurantAlias(data.payment_alias); });
    }
  }, [restaurantId]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setLoadingUser(false);
      if (!user) return;
      setUserId(user.id);
      supabase.from('addresses').select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at')
        .then(({ data }) => {
          if (!data?.length) return;
          setSavedAddresses(data);
          const def = data.find(a => a.is_default) || data[0];
          setSelectedAddrId(def.id);
          setForm(f => ({ ...f, address: def.address }));
        });
    });
  }, []);

  // FIX: showSuccess se chequea ANTES que el guard de items vacíos.
  // Antes estaba al revés: el guard de items[] interceptaba el render
  // antes de que showSuccess pudiera mostrar la pantalla.
  if (showSuccess) return <OrderSuccessScreen />;

  if (items.length === 0) {
    navigate('/');
    return null;
  }

  const selectedAddr = savedAddresses.find(a => a.id === selectedAddrId) ?? null;

  const selectAddress = (addr) => {
    setSelectedAddrId(addr.id);
    setForm(f => ({ ...f, address: addr.address }));
    setSheetOpen(false);
    setShowNewAddrForm(false);
  };

  const openSheet = (autoOpenForm = false) => {
    setShowNewAddrForm(autoOpenForm || savedAddresses.length === 0);
    setSheetOpen(true);
  };

  const saveNewAddress = async () => {
    if (!newAddrForm.address.trim()) { toast.error('Ingresá la dirección'); return; }
    if (!userId) {
      const local = {
        id: `local-${Date.now()}`,
        label: newAddrForm.label || 'Casa',
        address: newAddrForm.address.trim(),
        notes: newAddrForm.notes.trim() || null,
        is_default: true,
      };
      setSavedAddresses(prev => [...prev, local]);
      setNewAddrForm({ label: 'Casa', address: '', notes: '' });
      selectAddress(local);
      return;
    }
    setSavingAddr(true);
    try {
      const { data, error } = await supabase.from('addresses').insert({
        user_id: userId,
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
  };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const copyAlias = () => {
    navigator.clipboard.writeText(restaurantAlias);
    setAliasCopied(true);
    setTimeout(() => setAliasCopied(false), 2000);
    toast.success('Alias copiado');
  };

  const handleReview = () => {
    if (!form.name || !form.phone || !form.address) {
      toast.error('Completá todos los campos obligatorios');
      return;
    }
    if (paymentMethod === 'transfer' && !receipt) {
      toast.error('Subí el comprobante de transferencia para continuar');
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const uploadReceipt = async (file) => {
    const ext = file.name.split('.').pop();
    const path = `receipts/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('comprobantes').upload(path, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('comprobantes').getPublicUrl(path);
    return publicUrl;
  };

  const handleSubmit = async () => {
    if (paymentMethod === 'card') {
      toast('Redirigiendo a MercadoPago...', { icon: '💳' });
    }
    setSubmitting(true);
    try {
      let receiptUrl = null;
      if (paymentMethod === 'transfer' && receipt) {
        receiptUrl = await uploadReceipt(receipt);
      }

      const orderItems = items.map(i => ({
        id: i.id, name: i.name, price: i.price, qty: i.qty,
        extras: i.extras || 0, extra_price: i.extra_price || 0,
      }));
      const { data: order, error } = await supabase.from('orders').insert({
        restaurant_id: restaurantId,
        customer_name: form.name,
        customer_phone: form.phone,
        customer_address: form.address,
        notes: form.notes,
        items: orderItems,
        subtotal: totalVal,
        total: totalVal,
        payment_method: paymentMethod,
        comprobante_url: receiptUrl,
        order_status: 'pending',
      }).select().single();

      if (error) throw error;
console.log('PEDIDO CREADO OK:', order);
setSuccessOrderId(order.id);
setShowSuccess(true);
console.log('showSuccess seteado a true');

      // FIX: clear() fue movido al useEffect de arriba.
      // Acá solo guardamos el perfil y activamos la pantalla de éxito.
     
    } catch (err) {
      toast.error('Error al enviar el pedido: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Address bottom sheet ────────────────────────────────────── */
  const AddressSheet = () => (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => setSheetOpen(false)} />
      <div className="relative w-full max-w-lg rounded-t-2xl bg-white" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h3 className="font-bold text-base">Tus direcciones</h3>
          <button
            type="button"
            onClick={() => setSheetOpen(false)}
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
                onClick={() => selectAddress(addr)}
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
            onClick={() => setShowNewAddrForm(true)}
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
                  onClick={() => setNewAddrForm(f => ({ ...f, label: lbl }))}
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
              onChange={v => setNewAddrForm(f => ({ ...f, address: v }))}
              placeholder="Calle y número"
              className="input"
              autoFocus
            />
            <input
              value={newAddrForm.notes}
              onChange={e => setNewAddrForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Piso, depto, referencia... (opcional)"
              className="input"
            />
            <div className="flex gap-2">
              {savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowNewAddrForm(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
              )}
              <button
                type="button"
                onClick={saveNewAddress}
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

  /* ── Step 2: Review ─────────────────────────────────────────── */
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-nav sticky top-0 z-40">
          <div className="h-14 flex items-center px-4 gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded-full transition-colors text-sm font-medium text-gray-600"
            >
              <ChevronLeft size={20} /> Editar
            </button>
            <span className="font-bold">Revisá tu pedido</span>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
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
                      <p className="text-sm font-semibold leading-tight truncate">{i.name}{extraText}</p>
                      <p className="text-xs text-gray-500">{i.qty} × ${i.price.toLocaleString('es-AR')}</p>
                    </div>
                    <p className="text-primary font-bold text-sm shrink-0">${lineTotal.toLocaleString('es-AR')}</p>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-neutral-100 mt-4 pt-3 flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-primary">${totalVal.toLocaleString('es-AR')}</span>
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <h2 className="font-bold text-base">Entrega</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Nombre</span>
                <span className="font-medium">{form.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Teléfono</span>
                <span className="font-medium">{form.phone}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-gray-500 shrink-0">Dirección</span>
                <div className="flex items-start gap-3">
                  <div className="text-right">
                    {selectedAddr && <p className="font-semibold text-sm">{selectedAddr.label}</p>}
                    <p className="font-medium text-sm">{form.address}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="shrink-0 text-sm font-medium text-primary"
                  >
                    Cambiar
                  </button>
                </div>
              </div>
              {form.notes && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 shrink-0">Aclaración</span>
                  <span className="font-medium text-right">{form.notes}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card p-5 flex justify-between items-center text-sm">
            <span className="text-gray-500">Pago</span>
            <span className="font-medium">
              {PAYMENT_LABELS[paymentMethod]}
              {paymentMethod === 'transfer' && receipt && (
                <span className="ml-2 text-green-600 text-xs">· comprobante adjunto</span>
              )}
            </span>
          </div>

          <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full py-4 text-base">
            {submitting ? 'Enviando pedido...' : `Confirmar pedido · $${totalVal.toLocaleString('es-AR')}`}
          </button>
        </div>
      </div>
    );
  }

  /* ── Step 1: Form ───────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-nav sticky top-0 z-40">
        <div className="h-14 flex items-center px-4 gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold">Confirmar pedido</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="space-y-4">

          {/* Datos personales */}
          <div className="card p-5 space-y-4">
            <h2 className="font-bold text-base">Tus datos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Nombre *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Juan García" className="input" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Teléfono *</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="3571-123456" className="input" />
              </div>
            </div>

            {/* Address section */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Dirección de entrega *</label>

              {loadingUser ? (
                <div className="h-14 animate-pulse rounded-xl bg-gray-100" />
              ) : selectedAddr ? (
                /* Selected address card */
                <div className="flex items-center gap-3 rounded-xl border-2 border-gray-200 bg-white p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-primary">
                    <MapPin size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-tight">{selectedAddr.label}</p>
                    <p className="truncate text-xs text-gray-500">{selectedAddr.address}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openSheet(false)}
                    className="shrink-0 text-sm font-medium text-primary"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                /* No address — logged in or not */
                <button
                  type="button"
                  onClick={() => openSheet(true)}
                  className="flex w-full items-center justify-between rounded-xl border-2 border-dashed border-gray-200 p-4 text-left transition-colors hover:border-gray-300"
                >
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="shrink-0 text-gray-400" />
                    <span className="text-sm text-gray-500">Sin dirección guardada</span>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
                    <Plus size={14} /> Agregar
                  </span>
                </button>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Aclaraciones (opcional)</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Sin cebolla, casa con portón verde..." className="input resize-none h-20" />
            </div>
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
                      <p className="text-sm font-semibold leading-tight truncate">{i.name}{extraText}</p>
                      <p className="text-primary font-bold text-sm">${lineTotal.toLocaleString('es-AR')}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQty(i.id, i.qty - 1)}
                        className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-red-400 hover:text-red-500 transition-colors"
                      >
                        {i.qty === 1 ? <Trash2 size={13} /> : <Minus size={13} />}
                      </button>
                      <span className="w-6 text-center font-extrabold text-sm">{i.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(i.id, i.qty + 1)}
                        className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-red-700 transition-colors"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-neutral-100 mt-4 pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">${totalVal.toLocaleString('es-AR')}</span>
            </div>
          </div>

          {/* Método de pago */}
          <div className="card p-5">
            <h2 className="font-bold text-base mb-3">Método de pago</h2>
            <PaymentSelector value={paymentMethod} onChange={setPaymentMethod} />

            {paymentMethod === 'transfer' && (
              <div className="mt-4 rounded-xl p-4 space-y-3" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <p className="text-sm font-bold" style={{ color: '#15803D' }}>Datos para la transferencia</p>

                {restaurantAlias ? (
                  <>
                    <div className="flex items-center justify-between gap-3 bg-white rounded-xl p-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Alias / CBU</p>
                        <p className="font-bold text-base font-mono text-gray-900 truncate">{restaurantAlias}</p>
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
                      Realizá la transferencia y el restaurante confirmará tu pedido al recibir el pago.
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
                  <label
                    htmlFor="receipt-upload"
                    className="block cursor-pointer"
                  >
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

          <button type="button" onClick={handleReview} className="btn-primary w-full text-base py-4">
            Revisar pedido →
          </button>
        </div>
      </div>

      {sheetOpen && <AddressSheet />}
    </div>
  );
}
