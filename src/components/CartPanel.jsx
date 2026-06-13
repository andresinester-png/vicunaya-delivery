import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import useCartStore from '../store/cartStore.js';

const backdrop = {
  hidden: { opacity: 0 },
  show:   { opacity: 1 },
};
const panel = {
  hidden: { x: '100%' },
  show:   { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit:   { x: '100%', transition: { duration: 0.2, ease: 'easeIn' } },
};
const itemVariant = {
  hidden: { opacity: 0, x: 20 },
  show:   { opacity: 1, x: 0 },
  exit:   { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

export default function CartPanel({ open, onClose }) {
  const navigate = useNavigate();
  const { items, updateQty, removeItem, total, restaurantName } = useCartStore();
  const totalVal = total();

  const handleCheckout = () => { onClose(); navigate('/carrito'); };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            variants={backdrop}
            initial="hidden"
            animate="show"
            exit="hidden"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <motion.div
            variants={panel}
            initial="hidden"
            animate="show"
            exit="exit"
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 flex flex-col"
            style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.15)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <div>
                <h2 className="font-extrabold text-lg">Tu pedido</h2>
                {restaurantName && <p className="text-sm text-gray-400 font-medium">{restaurantName}</p>}
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X size={18} />
              </motion.button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <AnimatePresence initial={false}>
                {items.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center h-full gap-4 text-gray-400"
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                      <ShoppingBag size={36} strokeWidth={1.2} />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-600">Tu carrito está vacío</p>
                      <p className="text-sm mt-1">Agregá productos desde el menú</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div className="space-y-4">
                    {items.map(item => (
                      <motion.div
                        key={item.id}
                        variants={itemVariant}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        layout
                        className="flex items-center gap-3"
                      >
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-2xl object-cover shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-primary-bg flex items-center justify-center text-2xl shrink-0">🍽️</div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm leading-tight truncate">{item.name}</p>
                          {item.extras > 0 && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {item.qty > 0 && `${item.qty} ${item.base_label || 'u.'}`}
                              {item.qty > 0 && item.extras > 0 && ' + '}
                              {item.extras > 0 && `${item.extras} ${item.extra_label || 'extra'}`}
                            </p>
                          )}
                          <p className="text-primary font-extrabold text-sm mt-0.5">
                            ${(item.price * item.qty + (item.extras || 0) * (item.extra_price || 0)).toLocaleString('es-AR')}
                          </p>
                        </div>

                        {/* Controles cantidad */}
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
                            style={{ boxShadow: '0 3px 10px rgba(250,0,80,0.3)' }}
                          >
                            <Plus size={13} />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <AnimatePresence>
              {items.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="border-t border-neutral-100 px-5 py-4 space-y-3"
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-bold">${totalVal.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Envío</span>
                    <span className="text-green-600 font-semibold">A confirmar</span>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCheckout}
                    className="btn-primary w-full flex items-center justify-between text-base"
                  >
                    <span>Confirmar pedido</span>
                    <span className="font-extrabold">${totalVal.toLocaleString('es-AR')}</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
