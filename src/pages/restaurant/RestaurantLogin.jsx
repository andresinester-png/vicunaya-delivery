import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase.js';

export default function RestaurantLogin() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword(form);
    if (error) {
      toast.error('Email o contraseña incorrectos');
      setLoading(false);
      return;
    }
    // Verify the user actually owns a restaurant
    const { data: rest } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', data.user.id)
      .single();

    if (!rest) {
      await supabase.auth.signOut();
      toast.error('Tu cuenta no tiene un restaurante asociado');
      setLoading(false);
      return;
    }

    navigate('/restaurant/panel/pedidos');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1 mb-2">
            <span className="text-primary font-extrabold text-3xl">Vicuña</span>
            <span className="bg-primary text-white font-extrabold text-3xl px-1.5 rounded-lg">Ya</span>
          </div>
          <p className="text-gray-500 text-sm">Portal del restaurante</p>
        </div>

        <div className="card p-6">
          <h1 className="font-bold text-xl mb-5 text-center">Iniciar sesión</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="tu@email.com"
                className="input"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Contraseña</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="input pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
