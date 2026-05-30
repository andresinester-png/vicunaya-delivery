import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase.js';

export default function DriverLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(form);
    if (error) toast.error('Credenciales incorrectas');
    else navigate('/driver');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-nav">
        <div className="h-14 flex items-center px-4 gap-3">
          <button onClick={() => navigate('/perfil')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold">Panel conductor</span>
        </div>
      </nav>
      <div className="flex items-center justify-center px-4 pt-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">🚗</div>
            <h1 className="font-extrabold text-2xl">Ingresá como conductor</h1>
            <p className="text-gray-500 text-sm mt-1">VicuñaYa Remises</p>
          </div>
          <div className="card p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="tu@email.com" className="input" required />
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Contraseña" className="input pr-10" required />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Ingresando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
