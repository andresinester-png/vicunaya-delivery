import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.148 17.64 11.84 17.64 9.2z" fill="#fff"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#fff" opacity="0.85"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#fff" opacity="0.7"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#fff" opacity="0.55"/>
    </svg>
  );
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '14px 16px',
  borderRadius: 14, border: '1.5px solid #E5E7EB', fontSize: 15,
  fontWeight: 600, color: '#111', outline: 'none', fontFamily: 'inherit',
};

export default function Welcome() {
  const { session, profileComplete, loading } = useAuth();
  const [mode, setMode] = useState('welcome'); // 'welcome' | 'signup' | 'login'
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (session && profileComplete) return <Navigate to="/" replace />;
  if (session && !profileComplete) return <Navigate to="/complete-profile" replace />;

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://vicunaya-delivery.vercel.app/auth/callback' },
    });
    if (error) toast.error('No se pudo conectar con Google');
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) {
      toast.error('Completá email y contraseña');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;
        if (!data.session) toast.success('Revisá tu email para confirmar la cuenta');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#fff', display: 'flex',
      flexDirection: 'column', justifyContent: 'center',
      padding: '32px 24px', boxSizing: 'border-box',
    }}>

      {/* ── Logo ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ textAlign: 'center', marginBottom: 10 }}
      >
        <span style={{ color: '#e31b23', fontWeight: 900, fontSize: 44, letterSpacing: '-0.03em', lineHeight: 1 }}>
          Vicuña
          <span style={{
            background: '#e31b23', color: '#fff', borderRadius: 12,
            padding: '2px 12px', marginLeft: 6, fontWeight: 900, fontSize: 44,
            display: 'inline-block',
          }}>
            Ya
          </span>
        </span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        style={{ textAlign: 'center', color: '#6B7280', fontSize: 15, fontWeight: 700, marginBottom: 56 }}
      >
        La app de delivery de Vicuña Mackenna
      </motion.p>

      <AnimatePresence mode="wait">
        {mode === 'welcome' ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleGoogle}
              style={{
                background: '#e31b23', color: '#fff', border: 'none', borderRadius: 16,
                padding: '16px 20px', fontSize: 15, fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 6px 20px rgba(227,27,35,0.25)',
              }}
            >
              <GoogleIcon /> Continuar con Google
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setMode('signup')}
              style={{
                background: '#fff', color: '#e31b23', border: '2px solid #e31b23', borderRadius: 16,
                padding: '14px 20px', fontSize: 15, fontWeight: 800, cursor: 'pointer',
              }}
            >
              Registrarse con email
            </motion.button>

            <button
              type="button"
              onClick={() => setMode('login')}
              style={{
                background: 'none', border: 'none', color: '#e31b23', fontSize: 14,
                fontWeight: 800, cursor: 'pointer', padding: '8px 0', marginTop: 4,
              }}
            >
              Ya tengo cuenta, iniciar sesión
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <button
                type="button"
                onClick={() => setMode('welcome')}
                style={{
                  width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #E5E7EB',
                  background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0,
                }}
              >
                <ChevronLeft size={18} color="#111" strokeWidth={2.5} />
              </button>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#111', margin: 0 }}>
                {mode === 'signup' ? 'Crear cuenta' : 'Iniciar sesión'}
              </h2>
            </div>

            <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="Email"
                style={inputStyle}
                autoCapitalize="none"
              />
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Contraseña"
                style={inputStyle}
              />

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={submitting}
                style={{
                  background: '#e31b23', color: '#fff', border: 'none', borderRadius: 16,
                  padding: '16px 20px', fontSize: 15, fontWeight: 800,
                  cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1,
                  marginTop: 4, boxShadow: '0 6px 20px rgba(227,27,35,0.25)',
                }}
              >
                {submitting ? 'Un momento...' : mode === 'signup' ? 'Crear cuenta' : 'Iniciar sesión'}
              </motion.button>
            </form>

            <button
              type="button"
              onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
              style={{
                background: 'none', border: 'none', color: '#e31b23', fontSize: 14,
                fontWeight: 800, cursor: 'pointer', padding: '16px 0 0', width: '100%',
                textAlign: 'center',
              }}
            >
              {mode === 'signup' ? 'Ya tengo cuenta, iniciar sesión' : '¿No tenés cuenta? Registrate'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
