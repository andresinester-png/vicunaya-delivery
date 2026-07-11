import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

export default function EncomiendaPanelGuard() {
  const [status, setStatus]   = useState('loading');
  const [empresa, setEmpresa] = useState(null);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setStatus('unauth'); return; }

      const { data } = await supabase
        .from('empresas_encomiendas')
        .select('*')
        .eq('auth_user_id', user.id)
        .eq('activo', true)
        .single();

      if (data) { setEmpresa(data); setStatus('ok'); }
      else setStatus('unauth');
    };
    check();
  }, []);

  if (status === 'loading') return null;
  if (status === 'unauth') return <Navigate to="/encomiendas/panel/login" replace />;
  return <Outlet context={empresa} />;
}
