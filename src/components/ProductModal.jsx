import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus } from 'lucide-react';
import useCartStore from '../store/cartStore.js';
import { isRestaurantOpen } from '../lib/restaurantUtils.js';

// ── Quantity stepper ─────────────────────────────────────────────
function QtyControl({ value, onChange, min = 0 }) {
  const atMin = value <= min;
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: '#F3F4F6', borderRadius: 14,
      overflow: 'hidden',
    }}>
      <button
        type="button"
        onClick={() => !atMin && onChange(value - 1)}
        style={{
          width: 44, height: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none',
          cursor: atMin ? 'default' : 'pointer',
          color: atMin ? '#D1D5DB' : '#111',
          transition: 'color 0.15s',
        }}
      >
        <Minus size={17} strokeWidth={2.5} />
      </button>

      <span style={{
        minWidth: 36, textAlign: 'center',
        fontSize: 17, fontWeight: 800, color: '#111',
        letterSpacing: '-0.02em',
      }}>
        {value}
      </span>

      <button
        type="button"
        onClick={() => onChange(value + 1)}
        style={{
          width: 44, height: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#e31b23',
          transition: 'opacity 0.15s',
        }}
      >
        <Plus size={17} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function ProductModal({ item, restaurant, onClose }) {
  const cartItems = useCartStore(s => s.items);
  const setItem   = useCartStore(s => s.setItem);

  const existing = cartItems.find(i => i.id === item.id);

  const [qty,    setQty]    = useState(existing?.qty    ?? (item.allows_extras ? 0 : 1));
  const [extras, setExtras] = useState(existing?.extras ?? 0);

  const unitPrice  = item.price;
  const extraUnit  = item.extra_price || 0;
  const lineTotal  = unitPrice * qty + extraUnit * extras;
  const isOpen     = isRestaurantOpen(restaurant);
  const canAdd     = isOpen && (qty > 0 || extras > 0);

  const handleAdd = () => {
    if (!canAdd) return;
    setItem(item, restaurant, qty, extras);
    onClose();
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.52)',
          zIndex: 50,
        }}
      />

      {/* Sheet */}
      <motion.div
        key="modal-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          zIndex: 51,
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          maxHeight: '92vh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Drag handle + close */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '12px 20px 0', position: 'relative', flexShrink: 0,
        }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E5E7EB' }} />
          <button
            onClick={onClose}
            style={{
              position: 'absolute', right: 16, top: 8,
              width: 32, height: 32, borderRadius: '50%',
              background: '#F3F4F6', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} color="#6B7280" strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* Product image */}
          {item.image_url ? (
            <div style={{ width: '100%', height: 200, overflow: 'hidden', background: '#F3F4F6', marginTop: 12 }}>
              <img
                src={item.image_url}
                alt={item.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          ) : (
            <div style={{
              width: '100%', height: 120, marginTop: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#F9FAFB', fontSize: 56,
            }}>
              🍽️
            </div>
          )}

          {/* Info */}
          <div style={{ padding: '20px 20px 4px' }}>
            <h2 style={{
              fontSize: 20, fontWeight: 900, color: '#111',
              letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 8px',
            }}>
              {item.name}
            </h2>
            {item.description && (
              <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.55, margin: 0 }}>
                {item.description}
              </p>
            )}
          </div>

          {/* Selectors */}
          <div style={{ padding: '16px 20px 8px' }}>

            {/* Base quantity row */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 0',
              borderTop: '1px solid #F3F4F6',
              borderBottom: item.allows_extras ? 'none' : '1px solid #F3F4F6',
            }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: '0 0 2px' }}>
                  {item.base_label || 'Cantidad'}
                </p>
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
                  ${unitPrice.toLocaleString('es-AR')} c/u
                </p>
              </div>
              <QtyControl
                value={qty}
                onChange={setQty}
                min={item.allows_extras ? 0 : 1}
              />
            </div>

            {/* Extras row — only for allows_extras items */}
            {item.allows_extras && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 0',
                borderTop: '1px solid #F3F4F6',
                borderBottom: '1px solid #F3F4F6',
              }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: '0 0 2px' }}>
                    {item.extra_label || 'Unidades extra'}
                  </p>
                  {extraUnit > 0 && (
                    <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
                      ${extraUnit.toLocaleString('es-AR')} c/u
                    </p>
                  )}
                </div>
                <QtyControl value={extras} onChange={setExtras} min={0} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          paddingBottom: 'calc(14px + env(safe-area-inset-bottom))',
          borderTop: '1px solid #F3F4F6',
          background: '#fff',
          flexShrink: 0,
        }}>
          {/* Price preview */}
          {item.allows_extras && (qty > 0 || extras > 0) && (
            <div style={{ marginBottom: 10 }}>
              {qty > 0 && (
                <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 2px' }}>
                  {qty} {item.base_label || 'unidad'} × ${unitPrice.toLocaleString('es-AR')} = ${(unitPrice * qty).toLocaleString('es-AR')}
                </p>
              )}
              {extras > 0 && extraUnit > 0 && (
                <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                  {extras} {item.extra_label || 'extra'} × ${extraUnit.toLocaleString('es-AR')} = ${(extraUnit * extras).toLocaleString('es-AR')}
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleAdd}
            disabled={!canAdd}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: canAdd ? '#e31b23' : '#E5E7EB',
              color: canAdd ? '#fff' : '#9CA3AF',
              fontWeight: 700, fontSize: 15,
              padding: '15px 20px',
              borderRadius: 16, border: 'none',
              cursor: canAdd ? 'pointer' : 'not-allowed',
              boxShadow: canAdd ? '0 4px 14px rgba(227,27,35,0.35)' : 'none',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: 'all 0.18s',
            }}
          >
            <span>Agregar al pedido</span>
            <span style={{ fontWeight: 900, fontSize: 16 }}>
              {canAdd ? `$${lineTotal.toLocaleString('es-AR')}` : '—'}
            </span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
