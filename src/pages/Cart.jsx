import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Trash2, Minus, Plus, ChevronRight, Utensils, Bike, ShoppingBag } from 'lucide-react';
import useCartStore from '../store/cartStore.js';
import { supabase } from '../lib/supabase.js';
import { KYVRA } from '../lib/theme.js';

const FF = "'Plus Jakarta Sans', sans-serif";
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
        .slice(0, 8);

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

  const BOTTOM_BAR_H = 88;
  const itemCount = items.reduce((s, i) => s + i.qty, 0);

  return (
    <div style={{ minHeight: '100vh', background: KYVRA.bg, paddingBottom: BOTTOM_BAR_H + 16, fontFamily: FF }}>

      {/* ── Gradient Header ── */}
      <div style={{
        background: 'linear-gradient(160deg, #061118 0%, #0A1E2A 28%, #0D3A35 55%, #0F172A 100%)',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        paddingBottom: 16,
        position: 'sticky', top: 0, zIndex: 40,
        boxShadow: '0 4px 28px rgba(0,0,0,0.30)',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px' }}>
          {/* Nav row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.22)',
                cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronLeft size={20} color="#fff" />
            </button>

            {/* Restaurant identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              {(restaurantImage && !headerImgError) ? (
                <img
                  src={restaurantImage}
                  alt={restaurantName}
                  loading="lazy"
                  onError={() => setHeaderImgError(true)}
                  style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1.5px solid rgba(255,255,255,0.22)' }}
                />
              ) : (
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(13,148,136,0.28)', border: '1px solid rgba(13,148,136,0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Utensils size={16} color="#5EEAD4" strokeWidth={1.5} />
                </div>
              )}
              <p style={{ fontWeight: 700, fontSize: 15, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                {restaurantName || 'Tu pedido'}
              </p>
            </div>

            {/* Item count chip */}
            <div style={{
              background: 'rgba(13,148,136,0.28)', border: '1px solid rgba(94,234,212,0.30)',
              borderRadius: 999, padding: '4px 10px', flexShrink: 0,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#5EEAD4' }}>
                {itemCount} {itemCount === 1 ? 'ítem' : 'ítems'}
              </span>
            </div>
          </div>

          {/* Glass fulfillment selector */}
          <div style={{
            background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: 14, padding: 4,
            display: 'flex', gap: 4,
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
                    gap: 7, padding: '9px 0', borderRadius: 11, border: 'none', cursor: 'pointer',
                    background: active ? 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)' : 'transparent',
                    color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                    fontWeight: 700, fontSize: 13, fontFamily: FF,
                    transition: 'background 0.18s, color 0.18s',
                    boxShadow: active ? '0 3px 12px rgba(13,148,136,0.35)' : 'none',
                  }}
                >
                  <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 0' }}>

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

        {/* Suggestions — vertical list */}
        {suggestions.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <p style={{ fontWeight: 800, fontSize: 14, color: KYVRA.navy, margin: '0 0 10px 2px' }}>
              ¿Agregás algo más?
            </p>
            <div style={{
              background: KYVRA.white, borderRadius: 20,
              border: `1px solid ${KYVRA.border}`,
              boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
              padding: '4px 16px',
            }}>
              {suggestions.map((item, idx) => (
                <SuggestionRow
                  key={item.id}
                  item={item}
                  isLast={idx === suggestions.length - 1}
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
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.30), 0 0 0 1px rgba(255,255,255,0.06)',
        padding: '12px 16px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flexShrink: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 1px', fontFamily: FF }}>Total</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: '#5EEAD4', margin: 0, letterSpacing: '-0.025em', fontFamily: FF }}>
              ${totalVal.toLocaleString('es-AR')}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => navigate('/checkout')}
            style={{
              flex: 1, height: 54, borderRadius: 16,
              background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
              color: '#fff', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: FF, fontWeight: 800, fontSize: 15,
              boxShadow: '0 4px 20px rgba(13,148,136,0.40)',
            }}
          >
            Ir a pagar
            <ChevronRight size={17} strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function CartItemRow({ item, lineTotal, subText, isLast, onMinus, onPlus }) {
  const [imgError, setImgError] = useState(false);
  const isOne = item.qty === 1;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 0',
        borderBottom: isLast ? 'none' : `1px solid ${KYVRA.border}`,
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: 68, height: 68, borderRadius: 16, overflow: 'hidden',
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
          <Utensils size={26} color={KYVRA.teal} strokeWidth={1.5} />
        )}
      </div>

      {/* Name + sub */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: KYVRA.navy, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
            width: 34, height: 34, borderRadius: '50%', border: 'none',
            background: isOne ? '#FEE2E2' : KYVRA.bg,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {isOne ? <Trash2 size={14} color="#EF4444" /> : <Minus size={14} color={KYVRA.navy} />}
        </motion.button>

        <motion.span
          key={item.qty}
          initial={{ scale: 1.4 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          style={{ width: 24, textAlign: 'center', fontWeight: 800, fontSize: 15, color: KYVRA.navy }}
        >
          {item.qty}
        </motion.span>

        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={onPlus}
          style={{
            width: 34, height: 34, borderRadius: '50%', border: 'none',
            background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 10px rgba(13,148,136,0.32)',
          }}
        >
          <Plus size={14} color="#fff" />
        </motion.button>
      </div>
    </motion.div>
  );
}

function SuggestionRow({ item, isLast, justAdded, onAdd }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 0',
      borderBottom: isLast ? 'none' : `1px solid ${KYVRA.border}`,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14, overflow: 'hidden',
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
          <Utensils size={22} color={KYVRA.teal} strokeWidth={1.2} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13.5, fontWeight: 700, color: KYVRA.navy, margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.name}
        </p>
        <p style={{ fontSize: 13, fontWeight: 800, color: KYVRA.teal, margin: '2px 0 0' }}>
          ${item.price.toLocaleString('es-AR')}
        </p>
      </div>

      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onAdd}
        style={{
          width: 34, height: 34, borderRadius: '50%', border: 'none',
          background: justAdded ? '#059669' : 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
          color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 3px 10px rgba(13,148,136,0.32)',
          transition: 'background 0.2s',
        }}
      >
        {justAdded ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7l3 3 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <Plus size={15} />
        )}
      </motion.button>
    </div>
  );
}
