import { NavLink, useNavigate } from 'react-router-dom';
import { ClipboardList, TrendingUp, LogOut, Store, Image } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/admin/pedidos',      icon: ClipboardList, label: 'Pedidos'      },
  { to: '/admin/restaurantes', icon: Store,          label: 'Restaurantes' },
  { to: '/admin/banners',      icon: Image,          label: 'Banners'      },
  { to: '/admin/ganancias',    icon: TrendingUp,     label: 'Ganancias'    },
];

export default function AdminLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Sesión cerrada');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* ── Sidebar (desktop only) ── */}
      <aside className="hidden md:flex w-56 bg-white shadow-nav flex-col shrink-0 sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-neutral-100">
          <span className="text-primary font-extrabold text-xl">Vicuña</span>
          <span className="bg-primary text-white font-extrabold text-xl px-1 rounded-md ml-0.5">Ya</span>
          <p className="text-xs text-gray-500 mt-0.5">Panel de administrador general</p>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
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
          className="flex items-center gap-3 px-6 py-4 text-sm text-gray-500 hover:text-red-500 transition-colors border-t border-neutral-100"
        >
          <LogOut size={16} /> Cerrar sesión
        </button>
      </aside>

      {/* ── Content column ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-30 bg-white border-b border-neutral-100 px-4 py-3 flex items-center shrink-0">
          <span className="text-primary font-extrabold text-lg">Vicuña</span>
          <span className="bg-primary text-white font-extrabold text-lg px-1 rounded-md ml-0.5">Ya</span>
          <span className="ml-2 text-xs text-gray-400 font-medium">Panel de administrador general</span>
        </header>

        {/* Main content — extra bottom padding so content clears the mobile nav */}
        <main className="flex-1 p-4 md:p-6 overflow-auto pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* ── Bottom nav (mobile only) ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-100 flex items-stretch"
           style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-primary' : 'text-gray-400'
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
