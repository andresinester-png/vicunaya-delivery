import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase.js';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const processed = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
      toast.error('No se pudo iniciar sesión con Google');
      navigate('/welcome', { replace: true });
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (processed.current) return;
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        processed.current = true;
        navigate('/', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
    </div>
  );
}
