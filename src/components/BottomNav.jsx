import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ClipboardList, Calendar, CalendarCheck, User } from 'lucide-react';

const TABS = [
  { to: '/',           icon: Home,          label: 'Inicio'     },
  { to: '/pedidos',    icon: ClipboardList, label: 'Pedidos'    },
  { to: '/turnos',     icon: Calendar,      label: 'Turnos'     },
  { to: '/mis-turnos', icon: CalendarCheck, label: 'Mis turnos' },
  { to: '/perfil',     icon: User,          label: 'Perfil'     },
];

const ACTIVE_RED = '#D32F2F';

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav style={{
      position: 'fixed',
      bottom: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'max-content',
      maxWidth: 'calc(100% - 48px)',
      zIndex: 50,
      background: 'rgba(20,20,20,0.50)',
      backdropFilter: 'blur(28px)',
      WebkitBackdropFilter: 'blur(28px)',
      borderRadius: 28,
      boxShadow: '0 8px 32px rgba(0,0,0,0.40), 0 2px 8px rgba(0,0,0,0.25)',
      padding: '8px 4px',
      paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {TABS.map(({ to, icon: Icon, label }) => {
          const active = to === '/'
            ? location.pathname === '/' || location.pathname === '/delivery'
            : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                textDecoration: 'none',
                padding: '2px 8px',
              }}
            >
              {/* Contenedor del ícono con píldora activa */}
              <div style={{ position: 'relative', width: 44, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {active && (
                  <motion.div
                    layoutId="island-pill"
                    style={{
                      position: 'absolute', inset: 0,
                      background: ACTIVE_RED,
                      borderRadius: 14,
                    }}
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <motion.div
                  animate={active ? { scale: 1.08 } : { scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  style={{ position: 'relative', zIndex: 1 }}
                >
                  <Icon
                    size={19}
                    strokeWidth={active ? 2.5 : 1.8}
                    color={active ? '#fff' : 'rgba(255,255,255,0.45)'}
                  />
                </motion.div>
              </div>

              {/* Etiqueta */}
              <motion.span
                animate={{ color: active ? ACTIVE_RED : 'rgba(255,255,255,0.38)' }}
                transition={{ duration: 0.18 }}
                style={{
                  fontSize: 9.5,
                  fontWeight: active ? 700 : 500,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  letterSpacing: '-0.01em',
                  lineHeight: 1,
                }}
              >
                {label}
              </motion.span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
