import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { RestaurantContext } from '../contexts/RestaurantContext.js';
import RestaurantLayout from './RestaurantLayout.jsx';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function RestaurantGuard() {
  // loading stays true until getSession() gives us a definitive answer
  const [loading,    setLoading]    = useState(true);
  const [session,    setSession]    = useState(null);
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    // getSession() is the authoritative initial check — wait for it before
    // making any redirect decisions. onAuthStateChange can fire with null
    // before storage is read, so we never redirect based on it alone.
    supabase.auth.getSession().then(async ({ data }) => {
      const s = data.session;
      setSession(s);
      if (s) {
        const { data: rest } = await supabase
          .from('restaurants')
          .select('*')
          .eq('owner_id', s.user.id)
          .single();
        setRestaurant(rest || null);
      }
      setLoading(false);
    });

    // Only used for runtime changes after initial load (e.g. sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s);
      if (!s) { setRestaurant(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <Spinner />;

  if (!session) return <Navigate to="/restaurant/login" replace />;

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="card p-8 max-w-sm w-full text-center space-y-3">
          <p className="font-bold text-gray-700">Sin restaurante asociado</p>
          <p className="text-sm text-gray-400">Tu cuenta no tiene ningún restaurante vinculado. Contactá al administrador.</p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="btn-outline text-sm py-2 px-4 mx-auto"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <RestaurantContext.Provider value={restaurant}>
      <RestaurantLayout>
        <Outlet />
      </RestaurantLayout>
    </RestaurantContext.Provider>
  );
}
