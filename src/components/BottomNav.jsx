import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Receipt, CalendarDays, CalendarCheck, User } from 'lucide-react';
import { KYVRA } from '../lib/theme.js';

const TABS = [
  { to: '/',           icon: Home,          label: 'Inicio'     },
  { to: '/pedidos',    icon: Receipt,       label: 'Pedidos'    },
  { to: '/turnos',     icon: CalendarDays,  label: 'Turnos'     },
  { to: '/mis-turnos', icon: CalendarCheck, label: 'Mis turnos' },
  { to: '/perfil',     icon: User,          label: 'Perfil'     },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav style={{
      position: 'fixed',
      bottom: 16,
      left: 20,
      right: 20,
      zIndex: 50,
      background: KYVRA.white,
      borderRadius: 24,
      border: `1px solid ${KYVRA.border}`,
      boxShadow: '0 -2px 12px rgba(15,23,42,0.06), 0 4px 20px rgba(15,23,42,0.10)',
      padding: '8px 4px',
      paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
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
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3,
                textDecoration: 'none',
                padding: '2px 8px', flex: 1,
              }}
            >
              <div style={{
                position: 'relative',
                width: 44, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {active && (
                  <motion.div
                    layoutId="island-pill"
                    style={{
                      position: 'absolute', inset: 0,
                      background: KYVRA.tealBg,
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
                    color={active ? KYVRA.teal : KYVRA.textMuted}
                  />
                </motion.div>
              </div>

              <motion.span
                animate={{ color: active ? KYVRA.teal : KYVRA.textMuted }}
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
