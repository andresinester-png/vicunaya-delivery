import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Utensils } from 'lucide-react';
import useCartStore from '../store/cartStore.js';
import { KYVRA } from '../lib/theme.js';

export default function MenuItem({ item, onAdd, onTap, isLast = false }) {
  const { name, description, price_unit, price_dozen, image_url, is_available, allows_extras } = item;

  const cartQty   = useCartStore(s => s.items.find(i => i.id === item.id)?.qty ?? 0);
  const updateQty = useCartStore(s => s.updateQty);
  const [imgError, setImgError] = useState(false);

  // Dozen-priced items always need the modal (so "docenas" context is clear)
  const needsModal = !!price_dozen || allows_extras;

  // Show [−][qty][+] only for simple one-price items already in cart
  const showQtyControl = !needsModal && cartQty > 0 && !!onAdd && is_available;

  // Normalize item for quick-add (single price only)
  const quickAddItem = {
    ...item,
    price:     price_unit ?? price_dozen ?? item.price ?? 0,
    sale_mode: price_unit ? 'unit' : 'dozen',
  };

  const priceText = price_unit && price_dozen
    ? `$${price_unit.toLocaleString('es-AR')} c/u · $${price_dozen.toLocaleString('es-AR')} la docena`
    : price_unit
    ? `$${price_unit.toLocaleString('es-AR')} c/u`
    : price_dozen
    ? `$${price_dozen.toLocaleString('es-AR')} la docena`
    : `$${(item.price || 0).toLocaleString('es-AR')} c/u`;

  const handleCardClick = () => { if (onTap) onTap(item); };

  const handlePlusClick = (e) => {
    e.stopPropagation();
    if (needsModal && onTap) { onTap(item); return; }
    if (!is_available || !onAdd) return;
    onAdd(quickAddItem);
  };

  const handleMinus = (e) => { e.stopPropagation(); updateQty(item.id, cartQty - 1); };
  const handlePlus  = (e) => { e.stopPropagation(); if (onAdd) onAdd(quickAddItem); };

  return (
    <motion.div
      onClick={handleCardClick}
      whileTap={onTap ? { scale: 0.99 } : {}}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '16px 0',
        borderBottom: isLast ? 'none' : `1px solid ${KYVRA.border}`,
        opacity: is_available ? 1 : 0.42,
        cursor: onTap ? 'pointer' : 'default',
      }}
    >
      {/* ── Left: text ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{
          fontSize: 16, fontWeight: 800, color: KYVRA.navy,
          letterSpacing: '-0.02em', lineHeight: 1.25,
          margin: '0 0 5px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {name}
        </h4>

        {description && (
          <p style={{
            fontSize: 12.5, fontWeight: 400, color: KYVRA.textMuted,
            lineHeight: 1.5, margin: '0 0 9px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {description}
          </p>
        )}

        <p style={{
          fontSize: 15.5, fontWeight: 800, color: KYVRA.teal,
          letterSpacing: '-0.02em', margin: 0,
        }}>
          {priceText}
        </p>
      </div>

      {/* ── Right: image + button ── */}
      <div style={{ position: 'relative', flexShrink: 0, width: 112, height: 112 }}>
        <div style={{
          width: 112, height: 112,
          borderRadius: 14,
          overflow: 'hidden',
          background: KYVRA.bg,
        }}>
          {(image_url && !imgError) ? (
            <img
              src={image_url}
              alt={name}
              onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: `linear-gradient(145deg, ${KYVRA.teal} 0%, ${KYVRA.tealDark} 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Utensils size={36} strokeWidth={1} color="rgba(255,255,255,0.40)" />
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
                  background: KYVRA.white,
                  borderRadius: 999,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.16)',
                  border: `1.5px solid ${KYVRA.border}`,
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
                  <Minus size={14} color={KYVRA.textMuted} strokeWidth={3} />
                </button>

                <span style={{
                  minWidth: 22, textAlign: 'center',
                  fontSize: 13, fontWeight: 800, color: KYVRA.navy,
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
                  <Plus size={14} color={KYVRA.teal} strokeWidth={3} />
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
                  background: KYVRA.teal,
                  border: '2px solid #fff',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(13,148,136,0.38)',
                }}
              >
                <Plus size={18} color="#fff" strokeWidth={2.8} />
              </motion.button>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
