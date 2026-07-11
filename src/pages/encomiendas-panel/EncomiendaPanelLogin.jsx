import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase.js';

export default function EncomiendaPanelLogin() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from('empresas_encomiendas')
      .select('*')
      .eq('email', form.email.trim().toLowerCase())
      .eq('password_hash', form.password)
      .eq('activo', true)
      .single();

    if (error || !data) {
      toast.error('Email o contraseña incorrectos');
      setLoading(false);
      return;
    }

    localStorage.setItem('vicunaya_encomiendas_session', JSON.stringify(data));
    navigate('/encomiendas/panel');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1 mb-2">
            <span style={{ color: '#e31b23' }} className="font-extrabold text-3xl">Vicuña</span>
            <span style={{ background: '#e31b23' }} className="text-white font-extrabold text-3xl px-1.5 rounded-lg">Ya</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">Portal de encomiendas</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-center gap-2 mb-5">
            <Package size={20} style={{ color: '#e31b23' }} />
            <h1 className="font-bold text-xl">Iniciar sesión</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="tu@email.com"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'rgba(227,27,35,0.3)' }}
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
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2"
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
              className="w-full text-white font-semibold py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50"
              style={{ background: loading ? '#aaa' : '#e31b23' }}
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
