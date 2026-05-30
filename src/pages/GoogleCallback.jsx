import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase.js';
import useProfileStore from '../store/profileStore.js';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const { setProfile } = useProfileStore();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ phone: '', address: '' });
  const processed = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
      toast.error('No se pudo iniciar sesión con Google');
      navigate('/perfil', { replace: true });
      return;
    }

    const process = (session) => {
      if (processed.current) return;
      processed.current = true;
      setLoading(false);

      const meta = session.user?.user_metadata;
      const { name } = useProfileStore.getState();
      if (!name && (meta?.full_name || meta?.name)) {
        setProfile({ name: meta.full_name || meta.name });
      }

      const { phone } = useProfileStore.getState();
      if (!phone) {
        setShowModal(true);
      } else {
        navigate('/', { replace: true });
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          process(session);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, setProfile]);

  const handleComplete = (e) => {
    e.preventDefault();
    if (!form.phone.trim()) {
      toast.error('Ingresá tu teléfono');
      return;
    }
    setProfile(form);
    toast.success('¡Bienvenido/a!');
    navigate('/', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
      </div>
    );
  }

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6">
        <div className="mb-4 text-center">
          <div className="mb-2 text-4xl">👋</div>
          <h2 className="text-lg font-bold">¡Hola! Completá tu perfil</h2>
          <p className="mt-1 text-sm text-gray-500">Necesitamos estos datos para tus pedidos.</p>
        </div>
        <form onSubmit={handleComplete} className="space-y-3">
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <Phone size={12} /> Teléfono
            </label>
            <input
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="3571-123456"
              className="input"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <MapPin size={12} /> Dirección
              <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="San Martín 123"
              className="input"
            />
          </div>
          <button type="submit" className="btn-primary mt-2 w-full">
            Listo, empezar
          </button>
        </form>
      </div>
    </div>
  );
}
