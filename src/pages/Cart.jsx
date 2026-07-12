import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Trash2, Minus, Plus, ChevronRight } from 'lucide-react';
import useCartStore from '../store/cartStore.js';
import { supabase } from '../lib/supabase.js';

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

        {/* Botón: Seguir comprando */}
        {restaurantId && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => navigate(`/restaurant/${restaurantId}`)}
            className="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-3.5 shadow-card hover:shadow-card-hover transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-bg flex items-center justify-center shrink-0">
                <Plus size={18} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-gray-900">¿Olvidaste algo?</p>
                <p className="text-xs text-gray-400">Seguir comprando en {restaurantName}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-300 shrink-0" />
          </motion.button>
        )}

        {/* Sección: Te puede interesar */}
        {suggestions.length > 0 && (
          <div>
            <h2 className="text-sm font-extrabold text-gray-900 mb-3 px-1">¿Agregás algo más?</h2>
            <div
              style={{
                display: 'flex',
                gap: 10,
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                paddingBottom: 4,
                // hide scrollbar
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
              className="[-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
            >
              {suggestions.map(item => {
                const justAdded = addedIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    style={{
                      flexShrink: 0,
                      width: 130,
                      scrollSnapAlign: 'start',
                      background: '#fff',
                      borderRadius: 16,
                      border: '1px solid #F0E8E8',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      position: 'relative',
                    }}
                  >
                    {/* Foto */}
                    <div style={{ width: '100%', height: 90, background: '#f5f5f5', overflow: 'hidden' }}>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                          🍽️
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: '8px 8px 32px' }}>
                      <p style={{
                        fontSize: 12, fontWeight: 700, color: '#111',
                        lineHeight: 1.3, margin: 0,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {item.name}
                      </p>
                      <p style={{ fontSize: 12, fontWeight: 800, color: '#D32F2F', margin: '4px 0 0' }}>
                        ${item.price.toLocaleString('es-AR')}
                      </p>
                    </div>

                    {/* Botón "+" */}
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => handleQuickAdd(item)}
                      style={{
                        position: 'absolute', bottom: 8, right: 8,
                        width: 26, height: 26, borderRadius: '50%',
                        background: justAdded ? '#2E7D32' : '#D32F2F',
                        color: '#fff',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 3px 8px rgba(211,47,47,0.35)',
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
              })}
            </div>
          </div>
        )}

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
