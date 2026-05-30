import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check } from 'lucide-react';

export default function MenuItem({ item, onAdd, onTap, isLast = false }) {
  const { name, description, price, image_url, is_available, allows_extras } = item;
  const [bouncing, setBouncing] = useState(false);

  const handleCardClick = () => {
    if (onTap) onTap(item);
  };

  const handlePlusClick = (e) => {
    e.stopPropagation();
    // Items with extras always open the modal so the user can configure
    if (allows_extras && onTap) {
      onTap(item);
      return;
    }
    if (!is_available || bouncing || !onAdd) return;
    onAdd(item);
    setBouncing(true);
    setTimeout(() => setBouncing(false), 900);
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

        {/* + button */}
        {is_available && (
          <motion.button
            whileTap={{ scale: 0.80 }}
            animate={bouncing ? { scale: [1, 1.30, 0.88, 1.08, 1] } : {}}
            transition={{ duration: 0.48, times: [0, 0.25, 0.55, 0.75, 1] }}
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
            <AnimatePresence mode="wait" initial={false}>
              {bouncing ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                >
                  <Check size={16} color="#22c55e" strokeWidth={3} />
                </motion.span>
              ) : (
                <motion.span
                  key="plus"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Plus size={20} color="#e31b23" strokeWidth={2.5} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </div>
    </div>
  );
}
