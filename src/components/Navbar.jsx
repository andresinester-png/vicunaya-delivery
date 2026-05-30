import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, MapPin, ChevronDown, X } from 'lucide-react';
import useCartStore from '../store/cartStore.js';
import CartPanel from './CartPanel.jsx';

export default function Navbar({ showSearch = false, onSearch }) {
  const [cartOpen, setCartOpen] = useState(false);
  const count = useCartStore(s => s.count());

  return (
    <>
      <nav className="bg-white shadow-nav sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 shrink-0">
            <span className="text-primary font-extrabold text-2xl tracking-tight">Vicuña</span>
            <span className="bg-primary text-white font-extrabold text-2xl px-1.5 rounded-lg tracking-tight">Ya</span>
          </Link>

          {/* Dirección */}
          <button className="hidden sm:flex items-center gap-1 text-sm text-gray-600 hover:text-primary transition-colors ml-2">
            <MapPin size={15} className="text-primary" />
            <span className="font-medium">Vicuña Mackenna</span>
            <ChevronDown size={14} />
          </button>

          {/* Search */}
          {showSearch && (
            <div className="flex-1 mx-2">
              <input
                type="text"
                placeholder="Buscá restaurantes o platos..."
                className="input py-2 text-sm"
                onChange={e => onSearch?.(e.target.value)}
              />
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors"
            >
              <ShoppingCart size={18} />
              {count > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-primary text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-card">
                  {count}
                </span>
              )}
              <span className="hidden sm:inline">Carrito</span>
            </button>
          </div>
        </div>
      </nav>

      <CartPanel open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
