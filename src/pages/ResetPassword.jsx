import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase.js';

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

export default function ResetPassword() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'invalid'
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setStatus('ready');
    });

    // Si no llega el evento en 3s, el link es inválido o expiró
    const timer = setTimeout(() => {
      setStatus(prev => prev === 'loading' ? 'invalid' : prev);
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Contraseña actualizada correctamente');
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#111',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center',
      padding: '48px 24px',
      boxSizing: 'border-box',
    }}>
      <style>{`.rp-input::placeholder { color: rgba(255,255,255,0.38); }`}</style>

      <div style={{ maxWidth: 400, width: '100%', margin: '0 auto' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 36, letterSpacing: '-0.04em' }}>Vicuña</span>
          <span style={{
            background: '#D32F2F', color: '#fff',
            borderRadius: 10, padding: '2px 10px',
            fontWeight: 900, fontSize: 36, letterSpacing: '-0.04em', marginLeft: 6,
            boxShadow: '0 4px 18px rgba(211,47,47,0.55)',
          }}>Ya</span>
        </div>

        {status === 'loading' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.25)',
              borderTopColor: '#D32F2F',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 14px',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>Verificando enlace...</p>
          </div>
        )}

        {status === 'invalid' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, marginBottom: 20 }}>
              El enlace de recuperación es inválido o ya expiró.
            </p>
            <button
              onClick={() => navigate('/welcome')}
              style={{
                background: '#D32F2F', color: '#fff', border: 'none',
                borderRadius: 14, padding: '13px 28px',
                fontSize: 15, fontWeight: 800, cursor: 'pointer',
                fontFamily: 'inherit', boxShadow: '0 4px 18px rgba(211,47,47,0.45)',
              }}
            >
              Volver al inicio
            </button>
          </div>
        )}

        {status === 'ready' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 22, margin: '0 0 6px' }}>
              Nueva contraseña
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 24px' }}>
              Elegí una contraseña segura para tu cuenta.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="password"
                required
                placeholder="Nueva contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="rp-input"
                style={inputStyle}
              />
              <input
                type="password"
                required
                placeholder="Confirmar contraseña"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="rp-input"
                style={inputStyle}
              />
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={submitting}
                style={{
                  background: '#D32F2F', color: '#fff', border: 'none',
                  borderRadius: 16, padding: '16px 20px',
                  fontSize: 15, fontWeight: 800,
                  cursor: submitting ? 'default' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  marginTop: 4,
                  boxShadow: '0 6px 24px rgba(211,47,47,0.45)',
                  fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {submitting ? 'Guardando...' : (
                  <><CheckCircle size={17} strokeWidth={2.5} /> Guardar contraseña</>
                )}
              </motion.button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
