import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { TurnosNegocioContext } from '../contexts/TurnosNegocioContext.js';
import TurnosPanelLayout from './TurnosPanelLayout.jsx';
import { useTurnosAlert } from '../hooks/useTurnosAlert.js';
import { Bell, BellOff } from 'lucide-react';

const FF = "'Plus Jakarta Sans', sans-serif";

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-[3px] border-[#006a61] border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function TurnosPanelGuard() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [negocio, setNegocio] = useState(null);

  // Must be called unconditionally (before any early returns)
  const { audioEnabled, muted, enableAudio, toggleMute } = useTurnosAlert(negocio?.id ?? null);

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

      {/* ── Audio alert control (floating, bottom-right) ── */}
      {!audioEnabled ? (
        /* Prompt to enable audio alerts */
        <div style={{
          position: 'fixed', bottom: 80, right: 16, zIndex: 100,
          background: '#0F172A', borderRadius: 14,
          padding: '9px 12px 9px 10px',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
          border: '1px solid rgba(13,148,136,0.35)',
          fontFamily: FF,
        }}>
          <Bell size={14} color="#0D9488" strokeWidth={2} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.80)', whiteSpace: 'nowrap' }}>
            Alertas sonoras
          </span>
          <button
            onClick={enableAudio}
            style={{
              padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: 'linear-gradient(135deg, #0D9488, #14B8A6)', color: '#fff',
              border: 'none', cursor: 'pointer', fontFamily: FF, whiteSpace: 'nowrap',
            }}
          >
            Activar
          </button>
        </div>
      ) : (
        /* Mute / unmute toggle once audio is enabled */
        <button
          onClick={toggleMute}
          title={muted ? 'Activar sonido' : 'Silenciar alertas'}
          style={{
            position: 'fixed', bottom: 80, right: 16, zIndex: 100,
            width: 36, height: 36, borderRadius: 10,
            background: '#0F172A',
            border: muted ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(13,148,136,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0,0,0,0.30)',
          }}
        >
          {muted
            ? <BellOff size={15} color="rgba(255,255,255,0.35)" strokeWidth={2} />
            : <Bell    size={15} color="#0D9488"                 strokeWidth={2} />}
        </button>
      )}

      <TurnosPanelLayout>
        <Outlet />
      </TurnosPanelLayout>

    </TurnosNegocioContext.Provider>
  );
}
