import { NavLink, useNavigate } from 'react-router-dom';
import { Calendar, Scissors, Users, Clock, Store, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { useTurnosNegocio } from '../contexts/TurnosNegocioContext.js';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/turnos/panel/agenda',        icon: Calendar,  label: 'Agenda'        },
  { to: '/turnos/panel/servicios',     icon: Scissors,  label: 'Servicios'     },
  { to: '/turnos/panel/profesionales', icon: Users,     label: 'Profesionales' },
  { to: '/turnos/panel/horarios',      icon: Clock,     label: 'Horarios'      },
  { to: '/turnos/panel/mi-negocio',    icon: Store,     label: 'Mi negocio'    },
];

const SIDEBAR_BG = { background: 'linear-gradient(160deg, #1a1f2e 0%, #161b27 100%)' };

export default function TurnosPanelLayout({ children }) {
  const navigate = useNavigate();
  const negocio  = useTurnosNegocio();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Sesión cerrada');
    navigate('/turnos/panel/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">

      {/* ── Sidebar (desktop) ── */}
      <aside style={SIDEBAR_BG} className="hidden lg:flex w-56 flex-col shrink-0 sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-white/10">
          <span style={{ color: '#5EEAD4', fontWeight: 800, fontSize: 20, letterSpacing: '-0.3px' }}>K</span>
          <span style={{ color: '#ffffff', fontWeight: 800, fontSize: 20, letterSpacing: '-0.3px' }}>yvra</span>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{negocio?.name || 'Mi negocio'}</p>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[rgba(15,23,42,0.18)] text-white shadow-[inset_3px_0_0_0_#0D9488]'
                    : 'text-[rgba(255,255,255,0.5)] hover:bg-white/5 hover:text-[rgba(255,255,255,0.8)]'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-6 py-4 text-sm text-[rgba(255,255,255,0.5)] hover:text-primary transition-colors border-t border-white/10"
        >
          <LogOut size={16} /> Cerrar sesión
        </button>
      </aside>

      {/* ── Content column ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#1a1f2e] border-b border-white/10 px-4 py-3 flex items-center shrink-0">
          <span style={{ color: '#5EEAD4', fontWeight: 800, fontSize: 18, letterSpacing: '-0.3px' }}>K</span>
          <span style={{ color: '#ffffff', fontWeight: 800, fontSize: 18, letterSpacing: '-0.3px' }}>yvra</span>
          <span className="ml-2 text-xs text-slate-400 font-medium truncate">{negocio?.name || 'Mi negocio'}</span>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* ── Bottom nav (mobile) ── */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#1a1f2e] border-t border-white/10 flex items-stretch"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${
                isActive ? 'bg-[rgba(15,23,42,0.18)] text-white shadow-[inset_0_2px_0_0_#0D9488]' : 'text-[rgba(255,255,255,0.5)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold text-[rgba(255,255,255,0.5)] hover:text-primary transition-colors"
        >
          <LogOut size={18} strokeWidth={1.8} />
          Salir
        </button>
      </nav>
    </div>
  );
}
