import { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Bell } from 'lucide-react';
import BottomNav from './BottomNav.jsx';
import CartPanel from './CartPanel.jsx';
import useCartStore from '../store/cartStore.js';

const PAGE_TITLES = {
  '/remises': 'Remises',
  '/pedidos': 'Mis pedidos',
  '/perfil':  'Mi perfil',
};

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  enter:   { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.15, ease: 'easeIn' } },
};

export default function MainLayout() {
  const location = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const count = useCartStore(s => s.count());
  const isRemises = location.pathname === '/remises';
  const title = PAGE_TITLES[location.pathname];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F8F8F8' }}>
      {/* ── Header rojo ── */}
      <header
        className="sticky top-0 z-40 shrink-0"
        style={{ background: '#e31b23', boxShadow: '0 2px 16px rgba(227,27,35,0.25)' }}
      >
        {/* Fila del logo */}
        <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 16px', position: 'relative' }}>
          {/* Carrito – izquierda */}
          <button
            onClick={() => setCartOpen(true)}
            style={{
              position: 'relative', width: 38, height: 38,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%', background: 'rgba(255,255,255,0.18)',
              border: 'none', cursor: 'pointer', flexShrink: 0,
            }}
          >
            <ShoppingCart size={20} color="#fff" strokeWidth={2} />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  style={{
                    position: 'absolute', top: -2, right: -2,
                    background: '#fff', color: '#e31b23',
                    fontSize: 10, fontWeight: 900,
                    width: 18, height: 18, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Logo – centrado absoluto */}
          <Link
            to="/"
            style={{
              position: 'absolute', left: '50%', transform: 'translateX(-50%)',
              textDecoration: 'none', userSelect: 'none',
            }}
          >
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 26, letterSpacing: '-0.03em', lineHeight: 1, textShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
              Vicuña
              <span style={{
                background: '#fff', color: '#e31b23',
                borderRadius: 8, padding: '1px 7px',
                marginLeft: 3, fontWeight: 900, fontSize: 26,
              }}>
                Ya
              </span>
            </span>
          </Link>

          {/* Campana – derecha */}
          <button style={{
            marginLeft: 'auto', width: 38, height: 38,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%', background: 'rgba(255,255,255,0.18)',
            border: 'none', cursor: 'pointer', flexShrink: 0,
          }}>
            <Bell size={20} color="#fff" strokeWidth={2} />
          </button>
        </div>

        {/* Título de página – tabs que no son Inicio */}
        {title && (
          <div style={{ padding: '0 16px 12px' }}>
            <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 20, letterSpacing: '-0.02em', margin: 0 }}>
              {title}
            </h1>
          </div>
        )}
      </header>

      {/* ── Contenido ── */}
      <div id="main-scroll" className={`flex-1 ${isRemises ? 'flex flex-col' : 'pb-24 overflow-y-auto'}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            className={isRemises ? 'flex flex-col flex-1' : undefined}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav />
      <CartPanel open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
