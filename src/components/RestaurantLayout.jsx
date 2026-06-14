import { NavLink, useNavigate } from 'react-router-dom';
import { ClipboardList, UtensilsCrossed, TrendingUp, LogOut, Store } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { useRestaurant } from '../contexts/RestaurantContext.js';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/restaurant/panel/pedidos',   icon: ClipboardList,  label: 'Pedidos'         },
  { to: '/restaurant/panel/menu',      icon: UtensilsCrossed, label: 'Menú'            },
  { to: '/restaurant/panel/perfil',    icon: Store,           label: 'Mi restaurante'  },
  { to: '/restaurant/panel/ganancias', icon: TrendingUp,      label: 'Ganancias'       },
];

export default function RestaurantLayout({ children }) {
  const navigate    = useNavigate();
  const restaurant  = useRestaurant();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Sesión cerrada');
    navigate('/restaurant/login');
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex">

      {/* ── Sidebar (desktop only) ── */}
      <aside className="hidden lg:flex w-56 bg-[#1a1f2e] flex-col shrink-0 sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-white/10">
          <span className="text-primary font-extrabold text-xl">Vicuña</span>
          <span className="bg-primary text-white font-extrabold text-xl px-1 rounded-md ml-0.5">Ya</span>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{restaurant?.name || 'Mi restaurante'}</p>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/5 text-white shadow-[inset_3px_0_0_0_#e31b23]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
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
          className="flex items-center gap-3 px-6 py-4 text-sm text-slate-400 hover:text-primary transition-colors border-t border-white/10"
        >
          <LogOut size={16} /> Cerrar sesión
        </button>
      </aside>

      {/* ── Content column ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#1a1f2e] border-b border-white/10 px-4 py-3 flex items-center shrink-0">
          <span className="text-primary font-extrabold text-lg">Vicuña</span>
          <span className="bg-primary text-white font-extrabold text-lg px-1 rounded-md ml-0.5">Ya</span>
          <span className="ml-2 text-xs text-slate-400 font-medium truncate">{restaurant?.name || 'Mi restaurante'}</span>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* ── Bottom nav (mobile only) ── */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-100 flex items-stretch"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-primary bg-primary-bg shadow-[inset_0_2px_0_0_#e31b23]' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold text-gray-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={20} strokeWidth={1.8} />
          Salir
        </button>
      </nav>
    </div>
  );
}
