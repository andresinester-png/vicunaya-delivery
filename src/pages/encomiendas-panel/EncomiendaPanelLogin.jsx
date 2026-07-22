import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Package, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase.js';

const T  = { navy: '#0F172A', teal: '#0D9488', tealDark: '#0F766E', tealLight: '#5EEAD4', bg: '#F8FAFC', white: '#FFFFFF', textSec: '#64748B', border: '#E2E8F0' };
const FF = "'Plus Jakarta Sans', sans-serif";
const GH = 'linear-gradient(160deg, #061118 0%, #0A1E2A 28%, #0D3A35 55%, #0F172A 100%)';

export default function EncomiendaPanelLogin() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email:    form.email.trim().toLowerCase(),
      password: form.password,
    });

    if (error) {
      toast.error('Email o contraseña incorrectos');
      setLoading(false);
      return;
    }

    navigate('/encomiendas/panel');
  };

  return (
    <div style={{ minHeight: '100vh', background: GH, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: FF }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(13,148,136,0.18)', border: '1px solid rgba(13,148,136,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} color={T.tealLight} />
            </div>
          </div>
          <h1 style={{ fontWeight: 900, fontSize: 26, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.4px' }}>Encomiendas</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Panel del operador · KYVRA</p>
        </div>

        {/* Card */}
        <div style={{ background: T.white, borderRadius: 22, padding: '28px 24px', boxShadow: '0 8px 40px rgba(0,0,0,0.28)' }}>
          <h2 style={{ fontWeight: 800, fontSize: 18, color: T.navy, margin: '0 0 22px', textAlign: 'center' }}>Iniciar sesión</h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Email */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.textSec, display: 'block', marginBottom: 5 }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: T.textSec, flexShrink: 0, pointerEvents: 'none' }} />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="tu@email.com"
                  required
                  style={{ width: '100%', border: `1.5px solid ${T.border}`, borderRadius: 12, padding: '11px 12px 11px 36px', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: FF, color: T.navy, background: T.bg }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.textSec, display: 'block', marginBottom: 5 }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: T.textSec, flexShrink: 0, pointerEvents: 'none' }} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  style={{ width: '100%', border: `1.5px solid ${T.border}`, borderRadius: 12, padding: '11px 40px 11px 36px', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: FF, color: T.navy, background: T.bg }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                >
                  {showPwd ? <EyeOff size={16} color={T.textSec} /> : <Eye size={16} color={T.textSec} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: loading ? T.textSec : 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)', color: '#fff', border: 'none', borderRadius: 13, padding: '13px 0', fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: FF, boxShadow: loading ? 'none' : '0 4px 14px rgba(13,148,136,0.32)', marginTop: 4 }}
            >
              {loading ? 'Verificando...' : 'Entrar al panel'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 24 }}>KYVRA · Plataforma de encomiendas</p>
      </div>
    </div>
  );
}
