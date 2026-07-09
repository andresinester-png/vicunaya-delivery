import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Trash2, Minus, Plus } from 'lucide-react';
import useCartStore from '../store/cartStore.js';

export default function Cart() {
  const navigate = useNavigate();
  const {
    items, total, restaurantName, restaurantImage,
    fulfillmentMethod, setFulfillmentMethod, updateQty,
  } = useCartStore();
  const totalVal = total();

  useEffect(() => {
    if (items.length === 0) navigate('/', { replace: true });
  }, [items.length, navigate]);

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-gray-100" style={{ paddingBottom: 100 }}>
      {/* Header */}
      <nav className="bg-white shadow-nav sticky top-0 z-40">
        <div className="h-14 flex items-center px-4 gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </button>
          {restaurantImage ? (
            <img src={restaurantImage} alt={restaurantName} className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-bg flex items-center justify-center text-base shrink-0">🍽️</div>
          )}
          <span className="font-bold text-base truncate">{restaurantName || 'Tu pedido'}</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Modo de entrega */}
        <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-card">
          {[
            { key: 'delivery', label: 'Delivery' },
            { key: 'pickup',   label: 'Retirar en local' },
          ].map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setFulfillmentMethod(opt.key)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors"
              style={{
                background: fulfillmentMethod === opt.key ? '#D32F2F' : 'transparent',
                color: fulfillmentMethod === opt.key ? '#fff' : '#6B7280',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Lista de productos */}
        <div className="card p-4 space-y-4">
          {items.map(item => {
            const lineTotal = item.price * item.qty + (item.extras || 0) * (item.extra_price || 0);
            const subText = item.sale_mode === 'dozen'
              ? `x${item.qty} docena${item.qty !== 1 ? 's' : ''}`
              : `x${item.qty} unidad${item.qty !== 1 ? 'es' : ''}`;
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-2xl object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl shrink-0">🍽️</div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm leading-tight truncate">
                    {item.name}{item.variant_label ? ` ${item.variant_label}` : ''}
                  </p>
                  {subText && <p className="text-xs text-gray-400 mt-0.5 truncate">{subText}</p>}
                  <p className="text-primary font-extrabold text-sm mt-0.5">
                    ${lineTotal.toLocaleString('es-AR')}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => updateQty(item.id, item.qty - 1)}
                    className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                  >
                    {item.qty === 1 ? <Trash2 size={13} /> : <Minus size={13} />}
                  </motion.button>
                  <motion.span
                    key={item.qty}
                    initial={{ scale: 1.4 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    className="w-6 text-center font-extrabold text-sm"
                  >
                    {item.qty}
                  </motion.span>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => updateQty(item.id, item.qty + 1)}
                    className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors"
                    style={{ boxShadow: '0 3px 10px rgba(211,47,47,0.3)' }}
                  >
                    <Plus size={13} />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Barra inferior fija */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white"
        style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.10)', padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-2xl mx-auto">
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => navigate('/checkout')}
            className="btn-primary w-full flex items-center justify-between text-base"
          >
            <span>Ir a pagar</span>
            <span className="font-extrabold">${totalVal.toLocaleString('es-AR')}</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
