import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import useCartStore from '../store/cartStore.js';

export default function MenuItem({ item, onAdd, onTap, isLast = false }) {
  const { name, description, price, image_url, is_available, allows_extras } = item;

  const cartQty   = useCartStore(s => s.items.find(i => i.id === item.id)?.qty ?? 0);
  const updateQty = useCartStore(s => s.updateQty);

  // Show [−][qty][+] only for simple items (no extras) already in cart
  const showQtyControl = !allows_extras && cartQty > 0 && !!onAdd && is_available;

  const handleCardClick = () => {
    if (onTap) onTap(item);
  };

  const handlePlusClick = (e) => {
    e.stopPropagation();
    if (allows_extras && onTap) { onTap(item); return; }
    if (!is_available || !onAdd) return;
    onAdd(item);
  };

  const handleMinus = (e) => {
    e.stopPropagation();
    updateQty(item.id, cartQty - 1);
  };

  const handlePlus = (e) => {
    e.stopPropagation();
    if (onAdd) onAdd(item);
  };

  return (
    <div
      onClick={handleCardClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '16px 0',
        borderBottom: isLast ? 'none' : '1px solid #F3F4F6',
        opacity: is_available ? 1 : 0.45,
        cursor: onTap ? 'pointer' : 'default',
      }}
    >
      {/* ── Left: text ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{
          fontSize: 16, fontWeight: 700, color: '#111',
          letterSpacing: '-0.01em', lineHeight: 1.3,
          margin: '0 0 5px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {name}
        </h4>

        {description && (
          <p style={{
            fontSize: 14, fontWeight: 400, color: '#6B7280',
            lineHeight: 1.45, margin: '0 0 10px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {description}
          </p>
        )}

        <p style={{
          fontSize: 15, fontWeight: 800, color: '#111',
          letterSpacing: '-0.01em', margin: 0,
        }}>
          ${price.toLocaleString('es-AR')}
        </p>
      </div>

      {/* ── Right: image + button ── */}
      <div style={{ position: 'relative', flexShrink: 0, width: 120, height: 120 }}>
        {/* Image */}
        <div style={{
          width: 120, height: 120,
          borderRadius: 12,
          overflow: 'hidden',
          background: '#F3F4F6',
        }}>
          {image_url ? (
            <img
              src={image_url}
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 38, background: '#F9FAFB',
            }}>
              🍽️
            </div>
          )}
        </div>

        {/* + button  ↔  [−][qty][+] control */}
        {is_available && onAdd && (
          <AnimatePresence mode="wait" initial={false}>
            {showQtyControl ? (
              <motion.div
                key="qty-control"
                initial={{ scale: 0.75, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.75, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  bottom: -8, right: -8,
                  display: 'flex', alignItems: 'center',
                  background: '#fff',
                  borderRadius: 999,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.22)',
                  border: '1.5px solid #F3F4F6',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={handleMinus}
                  style={{
                    width: 32, height: 34, padding: 0,
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Minus size={14} color="#D32F2F" strokeWidth={3} />
                </button>

                <span style={{
                  minWidth: 20, textAlign: 'center',
                  fontSize: 13, fontWeight: 800, color: '#111',
                  lineHeight: 1, userSelect: 'none',
                }}>
                  {cartQty}
                </span>

                <button
                  onClick={handlePlus}
                  style={{
                    width: 32, height: 34, padding: 0,
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Plus size={14} color="#D32F2F" strokeWidth={3} />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="plus-btn"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                whileTap={{ scale: 0.80 }}
                transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                onClick={handlePlusClick}
                style={{
                  position: 'absolute',
                  bottom: -8, right: -8,
                  width: 36, height: 36,
                  borderRadius: '50%',
                  background: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
                }}
              >
                <Plus size={20} color="#D32F2F" strokeWidth={2.5} />
              </motion.button>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
