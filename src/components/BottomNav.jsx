import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Car, ClipboardList, Calendar, CalendarCheck, User } from 'lucide-react';

const TABS = [
  { to: '/',           icon: Home,          label: 'Inicio'     },
  // { to: '/remises', icon: Car, label: 'Remises' }, // Remises: deshabilitado temporalmente
  { to: '/pedidos',    icon: ClipboardList, label: 'Pedidos'    },
  { to: '/turnos',     icon: Calendar,      label: 'Turnos'     },
  { to: '/mis-turnos', icon: CalendarCheck, label: 'Mis turnos' },
  { to: '/perfil',     icon: User,          label: 'Perfil'     },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white pb-safe border-t border-line shadow-nav">
      <div className="flex items-stretch h-16">
        {TABS.map(({ to, icon: Icon, label }) => {
          const active = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
            >
              {/* Active background pill */}
              <AnimatePresence>
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-x-3 inset-y-2 rounded-2xl bg-primary/10"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </AnimatePresence>

              {/* Icon */}
              <motion.div
                animate={active ? { y: -1, scale: 1.1 } : { y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="relative z-10"
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={active ? 'text-primary' : 'text-ink-muted'}
                />
              </motion.div>

              {/* Label */}
              <motion.span
                animate={{ color: active ? '#E63A2E' : '#938A82' }}
                transition={{ duration: 0.2 }}
                className="text-[10px] font-bold mt-0.5 relative z-10 tracking-tight"
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
