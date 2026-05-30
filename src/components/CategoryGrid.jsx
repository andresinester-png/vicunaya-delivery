import { motion } from 'framer-motion';

const CATEGORIES = [
  { name: 'Rotisería', emoji: '🍗', bg: '#FF6B00', shadow: 'rgba(255,107,0,0.40)' },
  { name: 'Parrilla',  emoji: '🥩', bg: '#DC2626', shadow: 'rgba(220,38,38,0.40)'  },
  { name: 'Pizza',     emoji: '🍕', bg: '#D97706', shadow: 'rgba(217,119,6,0.40)'  },
  { name: 'Empanadas', emoji: '🥟', bg: '#16A34A', shadow: 'rgba(22,163,74,0.40)'  },
  { name: 'Bebidas',   emoji: '🥤', bg: '#2563EB', shadow: 'rgba(37,99,235,0.40)'  },
  { name: 'Sushi',     emoji: '🍱', bg: '#7C3AED', shadow: 'rgba(124,58,237,0.40)' },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055 } },
};
const item = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  show:   { opacity: 1, scale: 1,   y: 0,  transition: { type: 'spring', stiffness: 320, damping: 22 } },
};

export default function CategoryGrid({ active, onSelect }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-3 gap-3 px-4"
    >
      {CATEGORIES.map(cat => {
        const isActive = active === cat.name;
        return (
          <motion.button
            key={cat.name}
            variants={item}
            whileTap={{ scale: 0.84, boxShadow: `0 2px 8px ${cat.shadow}` }}
            whileHover={{ y: -3, boxShadow: `0 10px 28px ${cat.shadow}` }}
            onClick={() => onSelect(isActive ? null : cat.name)}
            style={{
              background: isActive ? cat.bg : `${cat.bg}18`,
              boxShadow: isActive
                ? `0 8px 24px ${cat.shadow}`
                : `0 2px 8px rgba(0,0,0,0.06)`,
              borderRadius: 20,
              padding: '14px 8px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              border: isActive ? 'none' : `1.5px solid ${cat.bg}30`,
              transition: 'background 0.2s, box-shadow 0.2s',
            }}
          >
            <span style={{ fontSize: 40, lineHeight: 1, filter: isActive ? 'drop-shadow(0 3px 6px rgba(0,0,0,0.25))' : 'none' }}>
              {cat.emoji}
            </span>
            <span style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '-0.01em',
              color: isActive ? '#fff' : '#1F2937',
              lineHeight: 1,
            }}>
              {cat.name}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
