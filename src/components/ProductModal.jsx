import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Utensils } from 'lucide-react';
import useCartStore from '../store/cartStore.js';
import { isRestaurantOpen } from '../lib/restaurantUtils.js';
import { KYVRA } from '../lib/theme.js';

function QtyControl({ value, onChange, min = 0 }) {
  const atMin = value <= min;
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: KYVRA.white,
      border: `1.5px solid ${KYVRA.border}`,
      borderRadius: 14, overflow: 'hidden',
    }}>
      <button
        type="button"
        onClick={() => !atMin && onChange(value - 1)}
        style={{
          width: 44, height: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none',
          cursor: atMin ? 'default' : 'pointer',
          color: atMin ? KYVRA.border : KYVRA.textMuted,
        }}
      >
        <Minus size={17} strokeWidth={2.5} />
      </button>
      <span style={{
        minWidth: 36, textAlign: 'center',
        fontSize: 17, fontWeight: 800, color: KYVRA.navy,
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
          color: KYVRA.teal,
        }}
      >
        <Plus size={17} strokeWidth={2.5} />
      </button>
    </div>
  );
}

export default function ProductModal({ item, restaurant, onClose }) {
  const cartItems          = useCartStore(s => s.items);
  const setItem            = useCartStore(s => s.setItem);
  const clearCart          = useCartStore(s => s.clear);
  const cartRestaurantId   = useCartStore(s => s.restaurantId);
  const cartRestaurantName = useCartStore(s => s.restaurantName);

  const hasBothPrices = !!(item.price_unit && item.price_dozen);

  // Dual-price: each variant has its own cart entry with composite id
  const existingDozen  = cartItems.find(i => i.id === `${item.id}_dozen`);
  const existingUnit   = cartItems.find(i => i.id === `${item.id}_unit`);
  // Single-price: uses original item.id
  const existingSingle = !hasBothPrices ? cartItems.find(i => i.id === item.id) : null;

  const [dozenQty, setDozenQty] = useState(existingDozen?.qty ?? 0);
  const [unitQty,  setUnitQty]  = useState(existingUnit?.qty  ?? 0);
  const [qty,      setQty]      = useState(existingSingle?.qty ?? 1);
  const [imgError, setImgError] = useState(false);

  // Single-price mode
  const saleMode  = item.price_unit ? 'unit' : 'dozen';
  const unitPrice = saleMode === 'unit'
    ? (item.price_unit  ?? item.price ?? 0)
    : (item.price_dozen ?? item.price ?? 0);

  const lineTotal = hasBothPrices
    ? dozenQty * (item.price_dozen || 0) + unitQty * (item.price_unit || 0)
    : unitPrice * qty;

  const isOpen = isRestaurantOpen(restaurant);
  const canAdd  = isOpen && (hasBothPrices ? (dozenQty > 0 || unitQty > 0) : qty > 0);

  const handleAdd = () => {
    if (!canAdd) return;

    if (hasBothPrices) {
      // Handle restaurant conflict once for both variants
      if (cartRestaurantId && cartRestaurantId !== restaurant.id) {
        if (!window.confirm(`Tu carrito tiene items de "${cartRestaurantName}". ¿Querés vaciarlo y agregar de ${restaurant.name}?`)) return;
        clearCart();
      }
      const dozenItem = { ...item, id: `${item.id}_dozen`, price: item.price_dozen, sale_mode: 'dozen', variant_label: '(docena)' };
      const unitItem  = { ...item, id: `${item.id}_unit`,  price: item.price_unit,  sale_mode: 'unit',  variant_label: '(unidad)' };
      // setItem with qty=0 removes item from cart; only call if relevant
      if (dozenQty > 0 || existingDozen) setItem(dozenItem, restaurant, dozenQty, 0);
      if (unitQty  > 0 || existingUnit)  setItem(unitItem,  restaurant, unitQty,  0);
    } else {
      setItem({ ...item, price: unitPrice, sale_mode: saleMode }, restaurant, qty, 0);
    }
    onClose();
  };

  const rowStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 0', borderTop: `1px solid ${KYVRA.border}`,
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.52)', zIndex: 50 }}
      />

      <motion.div
        key="sheet"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
          background: KYVRA.white, borderRadius: '24px 24px 0 0',
          maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Handle + close */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '12px 20px 0', position: 'relative', flexShrink: 0,
        }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: KYVRA.border }} />
          <button
            onClick={onClose}
            style={{
              position: 'absolute', right: 16, top: 8,
              width: 32, height: 32, borderRadius: '50%',
              background: KYVRA.bg, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} color={KYVRA.textSec} strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Image */}
          {(item.image_url && !imgError) ? (
            <div style={{
              width: '100%', height: 200, overflow: 'hidden',
              background: KYVRA.bg, marginTop: 12,
              borderRadius: '14px 14px 0 0',
            }}>
              <img
                src={item.image_url} alt={item.name} loading="lazy"
                onError={() => setImgError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          ) : (
            <div style={{
              width: '100%', height: 120, marginTop: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(145deg, ${KYVRA.teal} 0%, ${KYVRA.tealDark} 100%)`,
              borderRadius: '14px 14px 0 0',
            }}>
              <Utensils size={44} strokeWidth={1} color="rgba(255,255,255,0.40)" />
            </div>
          )}

          {/* Name + description */}
          <div style={{ padding: '20px 20px 4px' }}>
            <h2 style={{
              fontSize: 20, fontWeight: 900, color: KYVRA.navy,
              letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 8px',
            }}>
              {item.name}
            </h2>
            {item.description && (
              <p style={{ fontSize: 14, color: KYVRA.textSec, lineHeight: 1.55, margin: 0 }}>
                {item.description}
              </p>
            )}
          </div>

          {/* Qty selectors */}
          <div style={{ padding: '16px 20px 24px' }}>
            {hasBothPrices ? (
              <>
                {/* Row: docena */}
                <div style={rowStyle}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: KYVRA.navy, margin: '0 0 2px' }}>Docena</p>
                    <p style={{ fontSize: 13, color: KYVRA.textMuted, margin: 0 }}>${(item.price_dozen).toLocaleString('es-AR')} la docena</p>
                  </div>
                  <QtyControl value={dozenQty} onChange={setDozenQty} min={0} />
                </div>

                {/* Row: unidad */}
                <div style={rowStyle}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: KYVRA.navy, margin: '0 0 2px' }}>Unidad</p>
                    <p style={{ fontSize: 13, color: KYVRA.textMuted, margin: 0 }}>${(item.price_unit).toLocaleString('es-AR')} c/u</p>
                  </div>
                  <QtyControl value={unitQty} onChange={setUnitQty} min={0} />
                </div>
              </>
            ) : (
              /* Single-price row */
              <div style={{ ...rowStyle, borderBottom: `1px solid ${KYVRA.border}` }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: KYVRA.navy, margin: '0 0 2px' }}>
                    {saleMode === 'dozen' ? 'Docenas' : 'Unidades'}
                  </p>
                  <p style={{ fontSize: 13, color: KYVRA.textMuted, margin: 0 }}>
                    ${unitPrice.toLocaleString('es-AR')} {saleMode === 'dozen' ? 'la docena' : 'c/u'}
                  </p>
                </div>
                <QtyControl value={qty} onChange={setQty} min={1} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          paddingBottom: 'calc(14px + env(safe-area-inset-bottom))',
          borderTop: `1px solid ${KYVRA.border}`,
          background: KYVRA.white, flexShrink: 0,
        }}>
          <motion.button
            onClick={handleAdd}
            disabled={!canAdd}
            whileTap={canAdd ? { scale: 0.97 } : {}}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: canAdd ? KYVRA.teal : KYVRA.border,
              color: canAdd ? '#fff' : KYVRA.textMuted,
              fontWeight: 700, fontSize: 15,
              padding: '15px 20px', borderRadius: 16, border: 'none',
              cursor: canAdd ? 'pointer' : 'not-allowed',
              boxShadow: canAdd ? '0 4px 14px rgba(13,148,136,0.35)' : 'none',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: 'background 0.18s, box-shadow 0.18s',
            }}
          >
            <span>Agregar al pedido</span>
            <span style={{ fontWeight: 900, fontSize: 16 }}>
              {canAdd ? `$${lineTotal.toLocaleString('es-AR')}` : '—'}
            </span>
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
