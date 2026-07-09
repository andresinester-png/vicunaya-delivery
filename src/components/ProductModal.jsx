import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus } from 'lucide-react';
import useCartStore from '../store/cartStore.js';
import { isRestaurantOpen } from '../lib/restaurantUtils.js';

function QtyControl({ value, onChange, min = 0 }) {
  const atMin = value <= min;
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: '#F3F4F6', borderRadius: 14, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => !atMin && onChange(value - 1)}
        style={{
          width: 44, height: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none',
          cursor: atMin ? 'default' : 'pointer',
          color: atMin ? '#D1D5DB' : '#241F1D',
        }}
      >
        <Minus size={17} strokeWidth={2.5} />
      </button>
      <span style={{ minWidth: 36, textAlign: 'center', fontSize: 17, fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        style={{
          width: 44, height: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#D32F2F',
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
    padding: '14px 0', borderTop: '1px solid #F3F4F6',
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
          background: '#fff', borderRadius: '24px 24px 0 0',
          maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Handle + close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 20px 0', position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E5E7EB' }} />
          <button onClick={onClose} style={{ position: 'absolute', right: 16, top: 8, width: 32, height: 32, borderRadius: '50%', background: '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color="#6B7280" strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Image */}
          {item.image_url ? (
            <div style={{ width: '100%', height: 200, overflow: 'hidden', background: '#F3F4F6', marginTop: 12 }}>
              <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ) : (
            <div style={{ width: '100%', height: 120, marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', fontSize: 56 }}>
              🍽️
            </div>
          )}

          {/* Name + description */}
          <div style={{ padding: '20px 20px 4px' }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111', letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 8px' }}>
              {item.name}
            </h2>
            {item.description && (
              <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.55, margin: 0 }}>
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
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: '0 0 2px' }}>Docena</p>
                    <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>${(item.price_dozen).toLocaleString('es-AR')} la docena</p>
                  </div>
                  <QtyControl value={dozenQty} onChange={setDozenQty} min={0} />
                </div>

                {/* Row: unidad */}
                <div style={rowStyle}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: '0 0 2px' }}>Unidad</p>
                    <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>${(item.price_unit).toLocaleString('es-AR')} c/u</p>
                  </div>
                  <QtyControl value={unitQty} onChange={setUnitQty} min={0} />
                </div>
              </>
            ) : (
              /* Single-price row */
              <div style={{ ...rowStyle, borderBottom: '1px solid #F3F4F6' }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: '0 0 2px' }}>
                    {saleMode === 'dozen' ? 'Docenas' : 'Unidades'}
                  </p>
                  <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
                    ${unitPrice.toLocaleString('es-AR')} {saleMode === 'dozen' ? 'la docena' : 'c/u'}
                  </p>
                </div>
                <QtyControl value={qty} onChange={setQty} min={1} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))', borderTop: '1px solid #F3F4F6', background: '#fff', flexShrink: 0 }}>
          <button
            onClick={handleAdd}
            disabled={!canAdd}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: canAdd ? '#D32F2F' : '#E5E7EB',
              color: canAdd ? '#fff' : '#9CA3AF',
              fontWeight: 700, fontSize: 15,
              padding: '15px 20px', borderRadius: 16, border: 'none',
              cursor: canAdd ? 'pointer' : 'not-allowed',
              boxShadow: canAdd ? '0 4px 14px rgba(211,47,47,0.35)' : 'none',
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
