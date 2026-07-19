import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Mail, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';
import { KYVRA } from '../lib/theme.js';

const FF = "'Plus Jakarta Sans', sans-serif";

const GLOBAL_CSS = `
  .kw-inp {
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
  }
  .kw-inp::placeholder { color: #94A3B8; }
  .kw-inp:focus {
    border-color: #0D9488 !important;
    box-shadow: 0 0 0 3px rgba(13,148,136,0.14) !important;
    outline: none;
  }
  @keyframes kw-spin { to { transform: rotate(360deg); } }
`;

const INP = {
  width: '100%', boxSizing: 'border-box',
  padding: '16px 18px',
  borderRadius: 16,
  border: `1.5px solid ${KYVRA.border}`,
  background: '#F8FAFC',
  fontSize: 15, fontWeight: 600,
  color: KYVRA.navy, fontFamily: FF,
};

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.148 17.64 11.84 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function BackBtn({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 38, height: 38, borderRadius: '50%',
        border: `1.5px solid ${KYVRA.border}`,
        background: '#F8FAFC',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
      }}
    >
      <ChevronLeft size={19} color={KYVRA.navy} strokeWidth={2.5} />
    </button>
  );
}

export default function Welcome() {
  const { session, profileComplete, loading } = useAuth();
  const [mode, setMode]               = useState('welcome');
  const [form, setForm]               = useState({ email: '', password: '' });
  const [showPw, setShowPw]           = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent]   = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh',
        background: 'linear-gradient(170deg, #061118 0%, #0A1E2A 28%, #0D3A35 56%, #0F172A 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <style>{GLOBAL_CSS}</style>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.10)',
          borderTopColor: '#0D9488',
          animation: 'kw-spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  if (session && profileComplete)  return <Navigate to="/" replace />;
  if (session && !profileComplete) return <Navigate to="/complete-profile" replace />;

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast.error('No se pudo conectar con Google');
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { toast.error('Ingresá tu email'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: 'https://vicunaya-delivery.vercel.app/reset-password',
      });
      if (error) throw error;
      setForgotSent(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
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
        if (!data.session) {
          const { data: fnData, error: fnError } = await supabase.functions.invoke('send-email', {
            body: { email: form.email.trim() },
          });
          if (fnError) {
            let errBody = null;
            try {
              errBody = typeof fnError.context?.json === 'function'
                ? await fnError.context.json()
                : null;
            } catch (_) {}
            if (errBody?.error === 'email_already_confirmed') {
              toast.error(errBody.message ?? 'Ya tenés cuenta en Kyvra. Iniciá sesión con tu email y contraseña.');
              setMode('login');
              return;
            }
            toast.error('Error al enviar el email de confirmación. Intentá de nuevo.');
          } else {
            toast.success('Revisá tu email para confirmar la cuenta');
          }
        }
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
      background: 'linear-gradient(170deg, #061118 0%, #0A1E2A 28%, #0D3A35 56%, #0F172A 100%)',
      fontFamily: FF,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{GLOBAL_CSS}</style>

      {/* Teal atmosphere layers */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        {/* Primary glow — behind icon in hero */}
        <div style={{
          position: 'absolute',
          top: '4%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 520,
          background: 'radial-gradient(ellipse, rgba(13,148,136,0.26) 0%, rgba(13,148,136,0.08) 42%, transparent 65%)',
          filter: 'blur(4px)',
        }} />
        {/* Secondary glow — subtle bottom warmth */}
        <div style={{
          position: 'absolute',
          bottom: '15%', left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 300,
          background: 'radial-gradient(ellipse, rgba(13,148,136,0.08) 0%, transparent 60%)',
        }} />
      </div>

      {/* Content column */}
      <div style={{
        position: 'relative', zIndex: 1,
        minHeight: '100dvh',
        display: 'flex', flexDirection: 'column',
        maxWidth: 480, margin: '0 auto',
      }}>

        {/* ── Hero ──────────────────────────────────────── */}
        <div style={{
          flex: 1, minHeight: 220,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          paddingBottom: 24,
          paddingTop: 'calc(52px + env(safe-area-inset-top, 0px))',
          gap: 0,
        }}>
          <motion.div
            initial={{ opacity: 0, y: -22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
          >
            {/* Icon mark with halo */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Halo glow */}
              <div style={{
                position: 'absolute',
                width: 190, height: 190, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(13,148,136,0.42) 0%, rgba(13,148,136,0.14) 45%, transparent 68%)',
                filter: 'blur(10px)',
              }} />
              {/* Official KYVRA icon */}
              <img
                src="/kyvra-app-icon.png"
                alt="Kyvra"
                style={{
                  position: 'relative', zIndex: 1,
                  width: 96, height: 96,
                  borderRadius: 28,
                  boxShadow: '0 0 48px rgba(13,148,136,0.62), 0 0 100px rgba(13,148,136,0.22), 0 20px 56px rgba(0,0,0,0.60)',
                  display: 'block',
                }}
              />
            </div>

            {/* Wordmark */}
            <span style={{
              color: '#fff', fontWeight: 900, fontSize: 54,
              letterSpacing: '-0.05em', lineHeight: 1,
              textShadow: '0 4px 24px rgba(0,0,0,0.50)',
              fontFamily: FF,
            }}>
              Kyvra
            </span>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.30, duration: 0.50 }}
              style={{
                color: 'rgba(255,255,255,0.48)',
                fontSize: 13, fontWeight: 600,
                margin: '2px 0 0', letterSpacing: '0.01em',
                textAlign: 'center',
              }}
            >
              Mackenna. Todo en un solo lugar.
            </motion.p>
          </motion.div>
        </div>

        {/* ── White form card ───────────────────────────── */}
        <motion.div
          initial={{ y: 48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.18, duration: 0.60, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: '#fff',
            borderRadius: '28px 28px 0 0',
            boxShadow: '0 -12px 60px rgba(0,0,0,0.30), 0 -2px 16px rgba(0,0,0,0.14)',
            padding: `32px 24px calc(40px + env(safe-area-inset-bottom, 0px))`,
          }}
        >
          <AnimatePresence mode="wait">

            {/* ── Welcome mode ────────────────────────── */}
            {mode === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.24 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 22 }}
              >
                <div style={{ paddingBottom: 2 }}>
                  <h2 style={{
                    fontSize: 24, fontWeight: 900,
                    color: KYVRA.navy, margin: '0 0 6px',
                    letterSpacing: '-0.025em', lineHeight: 1.1,
                  }}>
                    Bienvenido a KYVRA
                  </h2>
                  <p style={{ fontSize: 14, color: KYVRA.textSec, margin: 0, fontWeight: 500, lineHeight: 1.5 }}>
                    Iniciá sesión o creá tu cuenta para continuar.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {/* Google */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleGoogle}
                    style={{
                      background: '#fff', color: KYVRA.navy,
                      border: `1.5px solid ${KYVRA.border}`,
                      borderRadius: 16, padding: '15px 20px',
                      fontSize: 15, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      fontFamily: FF, boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                    }}
                  >
                    <GoogleIcon /> Continuar con Google
                  </motion.button>

                  {/* Divider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 0' }}>
                    <div style={{ flex: 1, height: 1, background: KYVRA.border }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: KYVRA.textMuted }}>o</span>
                    <div style={{ flex: 1, height: 1, background: KYVRA.border }} />
                  </div>

                  {/* Teal CTA */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setMode('signup')}
                    style={{
                      background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
                      color: '#fff', border: 'none',
                      borderRadius: 16, padding: '16px 20px',
                      fontSize: 15, fontWeight: 800, cursor: 'pointer',
                      fontFamily: FF,
                      boxShadow: '0 8px 24px rgba(13,148,136,0.38)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Crear cuenta con email
                  </motion.button>

                  {/* Login text link */}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    style={{
                      background: 'none', border: 'none',
                      color: KYVRA.textSec,
                      fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      padding: '8px 0', fontFamily: FF, textAlign: 'center',
                    }}
                  >
                    Ya tengo cuenta —{' '}
                    <span style={{ color: KYVRA.teal, fontWeight: 700 }}>iniciar sesión</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Forgot password ──────────────────────── */}
            {mode === 'forgot' && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.24 }}
              >
                {forgotSent ? (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 20,
                      background: 'rgba(13,148,136,0.10)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 18px',
                    }}>
                      <Mail size={30} color={KYVRA.teal} strokeWidth={1.8} />
                    </div>
                    <h2 style={{ color: KYVRA.navy, fontWeight: 900, fontSize: 22, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
                      Email enviado
                    </h2>
                    <p style={{ color: KYVRA.textSec, fontSize: 14, lineHeight: 1.6, margin: '0 0 28px' }}>
                      Te enviamos un link para restablecer tu contraseña. Revisá tu bandeja de entrada.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setForgotSent(false); setMode('login'); }}
                      style={{
                        background: 'none', border: 'none',
                        color: KYVRA.teal, fontSize: 15, fontWeight: 700,
                        cursor: 'pointer', fontFamily: FF,
                      }}
                    >
                      Volver a iniciar sesión
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                      <BackBtn onClick={() => setMode('login')} />
                      <div>
                        <h2 style={{ fontSize: 19, fontWeight: 900, color: KYVRA.navy, margin: 0, letterSpacing: '-0.02em' }}>
                          Recuperar contraseña
                        </h2>
                        <p style={{ fontSize: 12, color: KYVRA.textSec, margin: '2px 0 0', fontWeight: 500 }}>
                          Te enviamos un link por email
                        </p>
                      </div>
                    </div>
                    <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <input
                        type="email" required
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="kw-inp"
                        style={INP}
                        autoCapitalize="none"
                      />
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        type="submit" disabled={submitting}
                        style={{
                          background: submitting ? KYVRA.border : 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
                          color: submitting ? KYVRA.textMuted : '#fff',
                          border: 'none', borderRadius: 16,
                          padding: '16px 20px', fontSize: 15, fontWeight: 800,
                          cursor: submitting ? 'default' : 'pointer',
                          marginTop: 4, fontFamily: FF,
                          boxShadow: submitting ? 'none' : '0 8px 24px rgba(13,148,136,0.32)',
                        }}
                      >
                        {submitting ? 'Enviando...' : 'Enviar link'}
                      </motion.button>
                    </form>
                  </>
                )}
              </motion.div>
            )}

            {/* ── Login / Signup ───────────────────────── */}
            {(mode === 'login' || mode === 'signup') && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.24 }}
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <BackBtn onClick={() => setMode('welcome')} />
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 900, color: KYVRA.navy, margin: 0, letterSpacing: '-0.025em' }}>
                      {mode === 'signup' ? 'Crear cuenta' : 'Iniciar sesión'}
                    </h2>
                    <p style={{ fontSize: 12, color: KYVRA.textSec, margin: '2px 0 0', fontWeight: 500 }}>
                      {mode === 'signup' ? 'Ingresá tu email y contraseña' : 'Bienvenido de nuevo'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input
                    type="email" required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="tu@email.com"
                    className="kw-inp"
                    style={INP}
                    autoCapitalize="none"
                  />
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'} required
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Contraseña"
                      className="kw-inp"
                      style={{ ...INP, paddingRight: 52 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      style={{
                        position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        display: 'flex', alignItems: 'center',
                      }}
                    >
                      {showPw
                        ? <EyeOff size={19} color={KYVRA.textMuted} />
                        : <Eye size={19} color={KYVRA.textMuted} />}
                    </button>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit" disabled={submitting}
                    style={{
                      background: submitting ? KYVRA.border : 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
                      color: submitting ? KYVRA.textMuted : '#fff',
                      border: 'none', borderRadius: 16,
                      padding: '16px 20px', fontSize: 15, fontWeight: 800,
                      cursor: submitting ? 'default' : 'pointer',
                      marginTop: 4, fontFamily: FF,
                      boxShadow: submitting ? 'none' : '0 8px 24px rgba(13,148,136,0.35)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {submitting
                      ? 'Un momento...'
                      : mode === 'signup' ? 'Crear cuenta' : 'Iniciar sesión'}
                  </motion.button>
                </form>

                {/* Forgot — login only */}
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setForgotEmail(form.email); setMode('forgot'); }}
                    style={{
                      background: 'none', border: 'none',
                      color: KYVRA.textMuted,
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      padding: '16px 0 4px', textAlign: 'center', fontFamily: FF,
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}

                {/* Switch mode */}
                <button
                  type="button"
                  onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
                  style={{
                    background: 'none', border: 'none',
                    color: KYVRA.textSec,
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    padding: mode === 'login' ? '6px 0 0' : '20px 0 0',
                    textAlign: 'center', fontFamily: FF,
                  }}
                >
                  {mode === 'signup'
                    ? <>Ya tengo cuenta —{' '}<span style={{ color: KYVRA.teal, fontWeight: 700 }}>iniciar sesión</span></>
                    : <>¿No tenés cuenta? —{' '}<span style={{ color: KYVRA.teal, fontWeight: 700 }}>registrate</span></>
                  }
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
