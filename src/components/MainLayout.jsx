import { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Bell } from 'lucide-react';
import BottomNav from './BottomNav.jsx';
import CartPanel from './CartPanel.jsx';
import NotificationsPanel from './NotificationsPanel.jsx';
import useCartStore from '../store/cartStore.js';
import useNotifications from '../hooks/useNotifications.js';

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

// Animación shake para la campana cuando hay no leídas
const bellShake = {
  animate: {
    rotate: [0, -18, 18, -14, 14, -8, 8, 0],
    transition: { duration: 0.7, ease: 'easeInOut', repeat: Infinity, repeatDelay: 2.5 },
  },
  idle: { rotate: 0 },
};

export default function MainLayout() {
  const location = useLocation();
  const [cartOpen,  setCartOpen]  = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const count = useCartStore(s => s.count());
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const isRemises = location.pathname === '/remises';
  const title     = PAGE_TITLES[location.pathname];

  const handleBellClick = () => setNotifOpen(true);

  const handleNotifClose = () => {
    setNotifOpen(false);
    if (unreadCount > 0) markAllAsRead();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FFF8F8' }}>
      {/* ── Header rojo ── */}
      <header
        className="sticky top-0 z-40 shrink-0"
        style={{ background: '#D32F2F', boxShadow: '0 2px 16px rgba(211,47,47,0.25)' }}
      >
        {/* Fila: Location + Brand | Bell */}
        <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 18px', justifyContent: 'space-between' }}>

          {/* Izquierda: MapPin + VicuñaYa + subtítulo */}
          <Link
            to="/"
            style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', userSelect: 'none', flexShrink: 1, minWidth: 0 }}
          >
            <MapPin size={22} color="white" strokeWidth={2.3} style={{ flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 15, lineHeight: 1.2, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                VicuñaYa
              </span>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11.5, fontWeight: 500, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Vicuña Mackenna, Córdoba
              </span>
            </div>
          </Link>

          {/* Campana – derecha */}
          <button
            onClick={handleBellClick}
            style={{
              position: 'relative',
              width: 38, height: 38, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%', background: 'rgba(255,255,255,0.18)',
              border: 'none', cursor: 'pointer',
            }}
          >
            {/* Shake cuando hay no leídas */}
            <motion.div
              animate={unreadCount > 0 ? bellShake.animate : bellShake.idle}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Bell size={20} color="#fff" strokeWidth={2} />
            </motion.div>

            {/* Badge rojo con número */}
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  key={unreadCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  style={{
                    position: 'absolute', top: -2, right: -2,
                    background: '#fff', color: '#D32F2F',
                    fontSize: 10, fontWeight: 900,
                    minWidth: 18, height: 18, borderRadius: 99,
                    padding: '0 3px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
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
      <NotificationsPanel
        open={notifOpen}
        onClose={handleNotifClose}
        notifications={notifications}
        onMarkAllAsRead={markAllAsRead}
      />
    </div>
  );
}
