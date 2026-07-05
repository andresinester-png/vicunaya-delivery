import { Fragment, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Share2, ChevronRight, StickyNote, Plus, Minus, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase.js';

const STEPS = ['Confirmado', 'Preparando', 'En camino', 'Entregado'];

const STATUS_INFO = {
  pending:    { step: 0, label: 'En marcha: el local está preparando tu pedido' },
  accepted:   { step: 0, label: 'En marcha: el local está preparando tu pedido' },
  preparing:  { step: 1, label: 'En marcha: el local está preparando tu pedido' },
  ready:      { step: 2, label: 'Tu pedido está en camino' },
  delivered:  { step: 3, label: '¡Tu pedido fue entregado! 🎉' },
};

const PAYMENT_LABELS = {
  cash: 'Efectivo',
  transfer: 'Transferencia bancaria',
  card: 'Tarjeta (MercadoPago)',
};

const ADDRESS_CHANGE_WINDOW = 5 * 60; // segundos desde created_at
const ADD_ITEMS_WINDOW = 3 * 60;      // segundos desde created_at

function fmtTime(date) {
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function fmtCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('detalle');
  const [showItems, setShowItems] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [addrModalOpen, setAddrModalOpen] = useState(false);
  const [addrForm, setAddrForm] = useState({ address: '', notes: '' });
  const [savingAddr, setSavingAddr] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [addQty, setAddQty] = useState({});
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [addingItems, setAddingItems] = useState(false);

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
    if (tab !== 'agregar' || !order?.restaurant_id || menuItems.length > 0) return;
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
  }, [tab, order?.restaurant_id]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: 'Mi pedido · VicuñaYa', url }); } catch { /* cancelado por el usuario */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace copiado');
    }
  };

  const handleChangeAddress = (addrCountdown) => {
    if (addrCountdown <= 0) return;
    setAddrForm({ address: order.customer_address || '', notes: order.delivery_notes || '' });
    setAddrModalOpen(true);
  };

  const saveAddressInfo = async () => {
    if (!addrForm.address.trim()) {
      toast.error('Ingresá la dirección');
      return;
    }
    setSavingAddr(true);
    try {
      const address = addrForm.address.trim();
      const notes = addrForm.notes.trim() || null;
      const { error } = await supabase.rpc('update_order_delivery_info', {
        p_order_id: id,
        p_customer_address: address,
        p_delivery_notes: notes,
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
        p_order_id: id,
        p_new_items: selectedItems,
        p_new_items_total: newSubtotal,
      });
      if (error) throw error;
      setOrder(prev => ({ ...prev, ...data }));
      setAddQty({});
      setConfirmModalOpen(false);
      setTab('detalle');
      toast.success('Productos agregados al pedido');
    } catch (err) {
      toast.error('No se pudo actualizar el pedido: ' + err.message);
    } finally {
      setAddingItems(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 py-6 animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded w-1/2" />
        <div className="h-48 bg-gray-100 rounded-3xl" />
        <div className="h-24 bg-gray-100 rounded-2xl" />
        <div className="h-16 bg-gray-100 rounded-2xl" />
        <div className="h-20 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-gray-400">Pedido no encontrado</p>
    </div>
  );

  if (order.order_status === 'rejected') return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl mb-4">😞</div>
      <h2 className="font-extrabold text-xl text-gray-900 mb-2">Pedido rechazado</h2>
      <p className="text-gray-500 text-sm mb-6">El restaurante no puede tomar tu pedido en este momento.</p>
      <button onClick={() => navigate('/')} className="btn-primary">Volver al inicio</button>
    </div>
  );

  const status = STATUS_INFO[order.order_status] || STATUS_INFO.pending;
  const currentStep = status.step;
  const itemCount = (order.items || []).reduce((sum, i) => sum + (i.qty || 0), 0);

  const orderTime = order.created_at ? new Date(order.created_at) : new Date();
  const etaEnd = new Date(orderTime.getTime() + 30 * 60000);
  const etaRange = `${fmtTime(orderTime)} - ${fmtTime(etaEnd)}`;

  const elapsedSec = Math.max(0, Math.floor((now - orderTime.getTime()) / 1000));
  const addrCountdown = Math.max(0, ADDRESS_CHANGE_WINDOW - elapsedSec);
  const itemsCountdown = Math.max(0, ADD_ITEMS_WINDOW - elapsedSec);

  const selectedItems = menuItems
    .filter(mi => addQty[mi.id] > 0)
    .map(mi => ({ id: mi.id, name: mi.name, price: mi.price, qty: addQty[mi.id], extras: 0, extra_price: 0 }));
  const newSubtotal = selectedItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const newOrderTotal = (order.total || 0) + newSubtotal;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2 sticky top-0 z-40 bg-white border-b border-gray-100">
        <button onClick={() => navigate('/')} className="p-2.5 rounded-full hover:bg-gray-100 transition-colors">
          <X size={22} className="text-gray-900" />
        </button>
        <div className="flex items-center gap-1">
          <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors text-sm font-bold text-gray-900">
            <Share2 size={16} /> Compartir
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">

        {/* ── Card de estado ── */}
        <div className="bg-white rounded-3xl shadow-card p-5 mb-4">
          <p className="text-sm font-bold mb-1" style={{ color: '#2E7D32' }}>En hora</p>
          <p className="text-2xl font-extrabold text-gray-900 mb-5">{etaRange}</p>

          {/* Barra de progreso */}
          <div className="mb-1">
            <div className="flex items-center">
              {STEPS.map((_, idx) => (
                <Fragment key={idx}>
                  <div
                    className="w-3 h-3 rounded-full shrink-0 transition-colors duration-300"
                    style={{ background: idx <= currentStep ? '#2E7D32' : '#E9D5D8' }}
                  />
                  {idx < STEPS.length - 1 && (
                    <div
                      className="flex-1 h-1 rounded-full mx-1 transition-colors duration-300"
                      style={{ background: idx < currentStep ? '#2E7D32' : '#E9D5D8' }}
                    />
                  )}
                </Fragment>
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              {STEPS.map((label, idx) => (
                <span
                  key={label}
                  className="text-[10px] font-bold"
                  style={{ color: idx <= currentStep ? '#111' : '#9CA3AF' }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <p className="text-sm font-semibold text-gray-700 mt-4">{status.label}</p>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-gray-100 mb-4">
          <button
            onClick={() => setTab('detalle')}
            className="flex-1 py-3 text-sm font-bold text-center transition-colors"
            style={{
              color: tab === 'detalle' ? '#111' : '#9CA3AF',
              borderBottom: tab === 'detalle' ? '2px solid #111' : '2px solid transparent',
            }}
          >
            Detalle del pedido
          </button>
          <button
            onClick={() => setTab('agregar')}
            className="flex-1 py-3 text-sm font-bold text-center transition-colors"
            style={{
              color: tab === 'agregar' ? '#111' : '#9CA3AF',
              borderBottom: tab === 'agregar' ? '2px solid #111' : '2px solid transparent',
            }}
          >
            Agregar productos
          </button>
        </div>

        {tab === 'detalle' ? (
          <div className="space-y-3">

            {/* Items */}
            <div className="rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shrink-0">🧺</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900">{itemCount} {itemCount === 1 ? 'producto' : 'productos'}</p>
                  <p className="text-xs text-gray-500 truncate">{order.restaurants?.name || 'Restaurante'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowItems(s => !s)}
                  className="shrink-0 text-sm font-bold"
                  style={{ color: '#D32F2F' }}
                >
                  Ver detalle
                </button>
              </div>
              {showItems && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  {(order.items || []).map((item, i) => {
                    const lineTotal = item.price * item.qty + (item.extras || 0) * (item.extra_price || 0);
                    const extraText = item.extras > 0 ? ` + ${item.extras} ${item.extra_label || 'extra'}` : '';
                    return (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.qty}x {item.name}{extraText}</span>
                        <span className="font-semibold text-gray-900">${lineTotal.toLocaleString('es-AR')}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pago */}
            <div className="rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shrink-0">💳</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900">{PAYMENT_LABELS[order.payment_method] || 'Pago'}</p>
              </div>
              <p className="font-extrabold text-sm text-gray-900 shrink-0">${(order.total || 0).toLocaleString('es-AR')}</p>
            </div>

            {/* Dirección */}
            {order.delivery_method === 'pickup' ? (
              <div className="rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                    <MapPin size={20} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900">Retirás en el local</p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {order.restaurants?.pickup_address || order.restaurants?.name}
                    </p>
                  </div>
                </div>
                {order.restaurants?.pickup_address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.restaurants.pickup_address}, Vicuña Mackenna, Córdoba`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 w-full rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <MapPin size={15} />
                    Ver en Google Maps
                  </a>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shrink-0">📍</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900">Lo recibís en</p>
                    <p className="text-sm text-gray-600 mt-0.5">{order.customer_address}</p>
                    {order.delivery_notes && (
                      <div className="flex items-start gap-1.5 mt-1.5">
                        <StickyNote size={13} className="text-gray-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-400">{order.delivery_notes}</p>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChangeAddress(addrCountdown)}
                    disabled={addrCountdown <= 0}
                    className="shrink-0 text-sm font-bold transition-colors"
                    style={{
                      color: addrCountdown > 0 ? '#D32F2F' : '#D1D5DB',
                      cursor: addrCountdown > 0 ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Cambiar
                  </button>
                </div>
                {addrCountdown > 0 && (
                  <p className="text-xs text-gray-400 mt-2 ml-[52px]">
                    Podés cambiarla durante {fmtCountdown(addrCountdown)}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : itemsCountdown <= 0 ? (
          <div className="rounded-2xl border border-gray-100 p-6 text-center">
            <p className="text-sm font-semibold text-gray-700">El local ya está preparando tu pedido</p>
            <p className="text-xs text-gray-400 mt-1">Ya no podés agregar productos a este pedido.</p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-semibold mb-3" style={{ color: '#D32F2F' }}>
              ⏱ Podés agregar productos por {fmtCountdown(itemsCountdown)} min
            </p>

            {menuLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}
              </div>
            ) : menuItems.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No hay productos disponibles ahora.</p>
            ) : (
              <div className="space-y-2 pb-2">
                {menuItems.map(mi => {
                  const qty = addQty[mi.id] || 0;
                  return (
                    <div key={mi.id} className="rounded-2xl border border-gray-100 p-3 flex items-center gap-3">
                      {mi.image_url ? (
                        <img src={mi.image_url} alt={mi.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-xl shrink-0">🍽️</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{mi.name}</p>
                        <p className="text-sm font-bold mt-0.5" style={{ color: '#D32F2F' }}>${mi.price.toLocaleString('es-AR')}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {qty > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={() => decQty(mi.id)}
                              className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-red-400 hover:text-red-500 transition-colors"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-5 text-center font-extrabold text-sm">{qty}</span>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => incQty(mi.id)}
                          className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-red-700 transition-colors"
                        >
                          <Plus size={13} />
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
                className="btn-primary w-full mt-2"
              >
                Agregar al pedido · ${newSubtotal.toLocaleString('es-AR')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Modal: cambiar dirección ── */}
      {addrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAddrModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-t-3xl bg-white p-5" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-gray-900">Cambiar dirección de entrega</h3>
              <button
                type="button"
                onClick={() => setAddrModalOpen(false)}
                className="rounded-full p-1 hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Dirección</label>
                <input
                  value={addrForm.address}
                  onChange={e => setAddrForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Calle y número"
                  className="input"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Referencias</label>
                <textarea
                  value={addrForm.notes}
                  onChange={e => setAddrForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Ej: Casa azul, portón negro, timbre roto, piso 2 depto B"
                  className="input resize-none h-20"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={saveAddressInfo}
              disabled={savingAddr || !addrForm.address.trim()}
              className="btn-primary w-full mt-4"
            >
              {savingAddr ? 'Guardando...' : 'Guardar cambios'}
            </button>

            <div className="h-safe-bottom h-4" />
          </div>
        </div>
      )}

      {/* ── Modal: confirmar productos nuevos ── */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-t-3xl bg-white p-5" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 className="font-bold text-base text-gray-900 mb-4">¿Confirmar estos productos?</h3>

            <div className="space-y-2 mb-4">
              {selectedItems.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.qty}x {item.name}</span>
                  <span className="font-semibold text-gray-900">${(item.price * item.qty).toLocaleString('es-AR')}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-base mb-5">
              <span>Total nuevo del pedido</span>
              <span style={{ color: '#D32F2F' }}>${newOrderTotal.toLocaleString('es-AR')}</span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 rounded-2xl border-2 border-gray-200 py-3 text-sm font-bold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleConfirmAddItems(selectedItems, newSubtotal)}
                disabled={addingItems}
                className="btn-primary flex-1"
              >
                {addingItems ? 'Confirmando...' : 'Confirmar'}
              </button>
            </div>

            <div className="h-safe-bottom h-4" />
          </div>
        </div>
      )}
    </div>
  );
}
