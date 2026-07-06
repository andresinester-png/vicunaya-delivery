import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';
import bgImage from '../screen.png';

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
  borderRadius: 14,
  border: '1.5px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.09)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  fontSize: 15, fontWeight: 600,
  color: '#fff', outline: 'none', fontFamily: 'inherit',
};

export default function Welcome() {
  const { session, profileComplete, loading } = useAuth();
  const [mode, setMode] = useState('welcome'); // 'welcome' | 'signup' | 'login'
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.25)',
          borderTopColor: '#D32F2F',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (session && profileComplete) return <Navigate to="/" replace />;
  if (session && !profileComplete) return <Navigate to="/complete-profile" replace />;

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
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
      minHeight: '100dvh',
      position: 'relative',
      background: '#111',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      {/* Placeholder de inputs sobre fondo oscuro */}
      <style>{`.wl-input::placeholder { color: rgba(255,255,255,0.38); }`}</style>

      {/* Fondo screen.png */}
      <img
        src={bgImage}
        alt=""
        aria-hidden
        style={{
          position: 'absolute', inset: 0, zIndex: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center top',
        }}
      />

      {/* Overlay oscuro */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.38) 50%, rgba(0,0,0,0.65) 100%)',
        }}
      />

      {/* Contenido */}
      <div style={{
        position: 'relative', zIndex: 2,
        padding: '48px 24px',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Logo con relieve 3D */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ textAlign: 'center', marginBottom: 10 }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              color: '#fff', fontWeight: 900, fontSize: 44,
              letterSpacing: '-0.04em', lineHeight: 1,
              textShadow: [
                '0 1px 0 rgba(255,255,255,0.10)',
                '0 2px 0 rgba(0,0,0,0.32)',
                '0 3px 0 rgba(0,0,0,0.20)',
                '0 4px 0 rgba(0,0,0,0.10)',
                '0 8px 22px rgba(0,0,0,0.55)',
              ].join(', '),
            }}>
              Vicuña
            </span>
            <span style={{
              background: '#D32F2F', color: '#fff',
              borderRadius: 12, padding: '3px 13px',
              fontWeight: 900, fontSize: 44,
              letterSpacing: '-0.04em',
              boxShadow: '0 4px 18px rgba(211,47,47,0.55)',
            }}>
              Ya
            </span>
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.62)',
            fontSize: 15, fontWeight: 600,
            marginBottom: 52, marginTop: 0,
          }}
        >
          La app de Vicuña Mackenna
        </motion.p>

        <AnimatePresence mode="wait">
          {mode === 'welcome' ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {/* Continuar con Google */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleGoogle}
                style={{
                  background: '#D32F2F', color: '#fff', border: 'none', borderRadius: 16,
                  padding: '16px 20px', fontSize: 15, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 6px 24px rgba(211,47,47,0.45)',
                  fontFamily: 'inherit',
                }}
              >
                <GoogleIcon /> Continuar con Google
              </motion.button>

              {/* Registrarse con email — glass */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setMode('signup')}
                style={{
                  background: 'rgba(255,255,255,0.11)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  color: '#fff',
                  border: '1.5px solid rgba(255,255,255,0.28)',
                  borderRadius: 16,
                  padding: '14px 20px', fontSize: 15, fontWeight: 800, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Registrarse con email
              </motion.button>

              {/* Ya tengo cuenta */}
              <button
                type="button"
                onClick={() => setMode('login')}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.72)',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  padding: '8px 0', marginTop: 4, fontFamily: 'inherit',
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
              {/* Header del form */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <button
                  type="button"
                  onClick={() => setMode('welcome')}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    border: '1.5px solid rgba(255,255,255,0.25)',
                    background: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <ChevronLeft size={18} color="#fff" strokeWidth={2.5} />
                </button>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>
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
                  className="wl-input"
                  style={inputStyle}
                  autoCapitalize="none"
                />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Contraseña"
                  className="wl-input"
                  style={inputStyle}
                />

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: '#D32F2F', color: '#fff', border: 'none', borderRadius: 16,
                    padding: '16px 20px', fontSize: 15, fontWeight: 800,
                    cursor: submitting ? 'default' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                    marginTop: 4,
                    boxShadow: '0 6px 24px rgba(211,47,47,0.45)',
                    fontFamily: 'inherit',
                  }}
                >
                  {submitting ? 'Un momento...' : mode === 'signup' ? 'Crear cuenta' : 'Iniciar sesión'}
                </motion.button>
              </form>

              <button
                type="button"
                onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.65)',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  padding: '16px 0 0', width: '100%',
                  textAlign: 'center', fontFamily: 'inherit',
                }}
              >
                {mode === 'signup' ? 'Ya tengo cuenta, iniciar sesión' : '¿No tenés cuenta? Registrate'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
