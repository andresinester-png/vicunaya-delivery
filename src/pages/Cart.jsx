import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Trash2, Minus, Plus, ChevronRight, Utensils, Bike, ShoppingBag } from 'lucide-react';
import useCartStore from '../store/cartStore.js';
import { supabase } from '../lib/supabase.js';
import { KYVRA } from '../lib/theme.js';

const PRIORITY_KEYWORDS = ['postre', 'dulce', 'torta', 'helado', 'budín', 'bebida', 'gaseosa', 'refresco', 'agua', 'jugo', 'cerveza', 'vino', 'café', 'infusión'];

export default function Cart() {
  const navigate = useNavigate();
  const {
    items, total, restaurantId, restaurantName, restaurantImage,
    fulfillmentMethod, setFulfillmentMethod, updateQty, addItem,
  } = useCartStore();
  const totalVal = total();

  const [suggestions, setSuggestions] = useState([]);
  const [addedIds, setAddedIds] = useState(new Set());
  const [headerImgError, setHeaderImgError] = useState(false);

  useEffect(() => {
    if (items.length === 0) navigate('/', { replace: true });
  }, [items.length, navigate]);

  useEffect(() => {
    if (!restaurantId) return;
    const load = async () => {
      const [{ data: menuItems }, { data: cats }] = await Promise.all([
        supabase.from('menu_items').select('*').eq('restaurant_id', restaurantId),
        supabase.from('menu_categories').select('id, name').eq('restaurant_id', restaurantId),
      ]);
      if (!menuItems) return;

      const catMap = Object.fromEntries((cats || []).map(c => [c.id, c.name]));
      const cartIds = new Set(items.map(i => i.id));

      const filtered = menuItems
        .filter(i => !cartIds.has(i.id) && i.price > 0)
        .map(i => {
          const catName = (catMap[i.category_id] || '').toLowerCase();
          const priority = PRIORITY_KEYWORDS.some(kw => catName.includes(kw)) ? 0 : 1;
          return { ...i, _priority: priority };
        })
        .sort((a, b) => a._priority - b._priority)
        .slice(0, 12);

      setSuggestions(filtered);
    };
    load();
  }, [restaurantId, items]);

  if (items.length === 0) return null;

  const handleQuickAdd = (item) => {
    addItem(item, { id: restaurantId, name: restaurantName, image_url: restaurantImage });
    setAddedIds(prev => new Set([...prev, item.id]));
    setTimeout(() => setAddedIds(prev => { const n = new Set(prev); n.delete(item.id); return n; }), 1200);
  };

  const BOTTOM_BAR_H = 80;

  return (
    <div style={{ minHeight: '100vh', background: KYVRA.bg, paddingBottom: BOTTOM_BAR_H + 16 }}>

      {/* Header */}
      <nav style={{
        background: KYVRA.white,
        borderBottom: `1px solid ${KYVRA.border}`,
        position: 'sticky', top: 0, zIndex: 40,
        boxShadow: '0 1px 8px rgba(15,23,42,0.06)',
      }}>
        <div style={{
          height: 56, display: 'flex', alignItems: 'center',
          padding: '0 16px', gap: 12, maxWidth: 640, margin: '0 auto',
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              background: KYVRA.bg, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: KYVRA.navy, flexShrink: 0,
            }}
          >
            <ChevronLeft size={20} />
          </button>

          {(restaurantImage && !headerImgError) ? (
            <img
              src={restaurantImage}
              alt={restaurantName}
              loading="lazy"
              onError={() => setHeaderImgError(true)}
              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: KYVRA.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Utensils size={16} color={KYVRA.teal} strokeWidth={1.5} />
            </div>
          )}

          <span style={{ fontWeight: 700, fontSize: 16, color: KYVRA.navy, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {restaurantName || 'Tu pedido'}
          </span>
        </div>
      </nav>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 0' }}>

        {/* Delivery / Pickup selector */}
        <div style={{
          background: KYVRA.white,
          borderRadius: 18,
          padding: 6,
          display: 'flex',
          gap: 6,
          marginBottom: 14,
          boxShadow: '0 2px 10px rgba(15,23,42,0.06)',
          border: `1px solid ${KYVRA.border}`,
        }}>
          {[
            { key: 'delivery', label: 'Delivery', Icon: Bike },
            { key: 'pickup',   label: 'Retirar en local', Icon: ShoppingBag },
          ].map(({ key, label, Icon }) => {
            const active = fulfillmentMethod === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFulfillmentMethod(key)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 7, padding: '10px 0', borderRadius: 13, border: 'none', cursor: 'pointer',
                  background: active ? KYVRA.teal : 'transparent',
                  color: active ? KYVRA.white : KYVRA.textSec,
                  fontWeight: 700, fontSize: 13,
                  transition: 'background 0.18s, color 0.18s',
                  boxShadow: active ? '0 3px 10px rgba(13,148,136,0.28)' : 'none',
                }}
              >
                <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Cart items card */}
        <div style={{
          background: KYVRA.white,
          borderRadius: 20,
          padding: '4px 16px',
          marginBottom: 14,
          boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
          border: `1px solid ${KYVRA.border}`,
        }}>
          {items.map((item, idx) => {
            const lineTotal = item.price * item.qty + (item.extras || 0) * (item.extra_price || 0);
            const subText = item.sale_mode === 'dozen'
              ? `x${item.qty} docena${item.qty !== 1 ? 's' : ''}`
              : `x${item.qty} unidad${item.qty !== 1 ? 'es' : ''}`;
            const isLast = idx === items.length - 1;
            return (
              <CartItemRow
                key={item.id}
                item={item}
                lineTotal={lineTotal}
                subText={subText}
                isLast={isLast}
                onMinus={() => updateQty(item.id, item.qty - 1)}
                onPlus={() => updateQty(item.id, item.qty + 1)}
              />
            );
          })}
        </div>

        {/* Continue shopping */}
        {restaurantId && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => navigate(`/restaurant/${restaurantId}`)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: KYVRA.white, borderRadius: 18, padding: '14px 16px',
              border: `1px solid ${KYVRA.border}`,
              boxShadow: '0 2px 10px rgba(15,23,42,0.05)',
              cursor: 'pointer', marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 12, background: KYVRA.tealBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Plus size={18} color={KYVRA.teal} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: KYVRA.navy, margin: 0 }}>¿Olvidaste algo?</p>
                <p style={{ fontSize: 12, color: KYVRA.textMuted, margin: '2px 0 0' }}>
                  Seguir comprando en {restaurantName}
                </p>
              </div>
            </div>
            <ChevronRight size={16} color={KYVRA.textMuted} style={{ flexShrink: 0 }} />
          </motion.button>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <p style={{ fontWeight: 800, fontSize: 14, color: KYVRA.navy, margin: '0 0 12px 2px' }}>
              ¿Agregás algo más?
            </p>
            <div style={{
              display: 'flex', gap: 10,
              overflowX: 'auto', scrollSnapType: 'x mandatory',
              paddingBottom: 4, scrollbarWidth: 'none', msOverflowStyle: 'none',
            }}>
              {suggestions.map(item => (
                <SuggestionCard
                  key={item.id}
                  item={item}
                  justAdded={addedIds.has(item.id)}
                  onAdd={() => handleQuickAdd(item)}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Fixed bottom checkout bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: KYVRA.white,
        borderTop: `1px solid ${KYVRA.border}`,
        boxShadow: '0 -4px 20px rgba(15,23,42,0.08)',
        padding: '12px 16px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => navigate('/checkout')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: KYVRA.teal, color: KYVRA.white,
              border: 'none', borderRadius: 16, padding: '14px 20px',
              cursor: 'pointer', fontWeight: 700, fontSize: 16,
              boxShadow: '0 4px 16px rgba(13,148,136,0.35)',
            }}
          >
            <span>Ir a pagar</span>
            <span style={{ fontWeight: 800 }}>${totalVal.toLocaleString('es-AR')}</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function CartItemRow({ item, lineTotal, subText, isLast, onMinus, onPlus }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 0',
        borderBottom: isLast ? 'none' : `1px solid ${KYVRA.border}`,
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: 58, height: 58, borderRadius: 14, overflow: 'hidden',
        background: KYVRA.tealBg, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {(item.image_url && !imgError) ? (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Utensils size={24} color={KYVRA.teal} strokeWidth={1.5} />
        )}
      </div>

      {/* Name + sub */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: KYVRA.navy, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name}{item.variant_label ? ` ${item.variant_label}` : ''}
        </p>
        {subText && (
          <p style={{ fontSize: 12, color: KYVRA.textMuted, margin: '2px 0 0' }}>{subText}</p>
        )}
        <p style={{ fontWeight: 800, fontSize: 14, color: KYVRA.teal, margin: '4px 0 0' }}>
          ${lineTotal.toLocaleString('es-AR')}
        </p>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={onMinus}
          style={{
            width: 32, height: 32, borderRadius: '50%', border: `2px solid ${KYVRA.border}`,
            background: KYVRA.white, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: KYVRA.navy,
          }}
        >
          {item.qty === 1 ? <Trash2 size={13} color={KYVRA.textSec} /> : <Minus size={13} />}
        </motion.button>

        <motion.span
          key={item.qty}
          initial={{ scale: 1.4 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          style={{ width: 22, textAlign: 'center', fontWeight: 800, fontSize: 14, color: KYVRA.navy }}
        >
          {item.qty}
        </motion.span>

        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={onPlus}
          style={{
            width: 32, height: 32, borderRadius: '50%', border: 'none',
            background: KYVRA.teal, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 10px rgba(13,148,136,0.30)',
          }}
        >
          <Plus size={13} color={KYVRA.white} />
        </motion.button>
      </div>
    </motion.div>
  );
}

function SuggestionCard({ item, justAdded, onAdd }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div style={{
      flexShrink: 0, width: 132, scrollSnapAlign: 'start',
      background: KYVRA.white, borderRadius: 16,
      border: `1px solid ${KYVRA.border}`,
      overflow: 'hidden', position: 'relative',
      boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
    }}>
      <div style={{ width: '100%', height: 90, background: KYVRA.tealBg, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {(item.image_url && !imgError) ? (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Utensils size={28} color={KYVRA.teal} strokeWidth={1.2} />
        )}
      </div>

      <div style={{ padding: '8px 8px 34px' }}>
        <p style={{
          fontSize: 12, fontWeight: 700, color: KYVRA.navy, lineHeight: 1.3, margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {item.name}
        </p>
        <p style={{ fontSize: 12, fontWeight: 800, color: KYVRA.teal, margin: '4px 0 0' }}>
          ${item.price.toLocaleString('es-AR')}
        </p>
      </div>

      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onAdd}
        style={{
          position: 'absolute', bottom: 8, right: 8,
          width: 26, height: 26, borderRadius: '50%',
          background: justAdded ? '#059669' : KYVRA.teal,
          color: KYVRA.white, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 3px 8px rgba(13,148,136,0.35)',
          transition: 'background 0.2s',
        }}
      >
        {justAdded ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <Plus size={14} />
        )}
      </motion.button>
    </div>
  );
}
