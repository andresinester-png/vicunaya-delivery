import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase.js';

export default function TurnosPanelLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
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
    const { data: neg } = await supabase
      .from('appointment_businesses')
      .select('id')
      .eq('owner_id', data.user.id)
      .single();

    if (!neg) {
      await supabase.auth.signOut();
      toast.error('Tu cuenta no tiene un negocio de turnos asociado');
      setLoading(false);
      return;
    }

    navigate('/turnos/panel/agenda');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1 mb-2">
            <span className="text-[#e31b23] font-extrabold text-3xl">Vicuña</span>
            <span className="bg-[#e31b23] text-white font-extrabold text-3xl px-1.5 rounded-lg">Ya</span>
          </div>
          <p className="text-gray-500 text-sm">Portal de gestión de turnos</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h1 className="font-bold text-xl mb-5 text-center">Iniciar sesión</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="tu@email.com"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30"
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
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30"
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
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e31b23] hover:bg-[#c41520] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
