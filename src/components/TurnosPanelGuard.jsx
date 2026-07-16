import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { TurnosNegocioContext } from '../contexts/TurnosNegocioContext.js';
import TurnosPanelLayout from './TurnosPanelLayout.jsx';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-[3px] border-[#006a61] border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function TurnosPanelGuard() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [negocio, setNegocio] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const s = data.session;
      setSession(s);
      if (s) {
        const { data: neg } = await supabase
          .from('appointment_businesses')
          .select('*')
          .eq('owner_id', s.user.id)
          .single();
        setNegocio(neg || null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s);
      if (!s) { setNegocio(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/turnos/panel/login" replace />;
  if (!negocio) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-3 shadow">
        <p className="font-bold text-gray-700">Sin negocio asociado</p>
        <p className="text-sm text-gray-400">Tu cuenta no tiene ningún negocio de turnos vinculado. Contactá al administrador.</p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-sm text-[#006a61] hover:underline mt-2 block mx-auto"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <TurnosNegocioContext.Provider value={negocio}>
      <TurnosPanelLayout>
        <Outlet />
      </TurnosPanelLayout>
    </TurnosNegocioContext.Provider>
  );
}
