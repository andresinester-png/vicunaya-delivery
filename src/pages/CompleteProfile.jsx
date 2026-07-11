import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, User, Phone, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';

const RED  = '#D32F2F';
const FONT = "'Plus Jakarta Sans', sans-serif";

const inputBase = {
  width: '100%', boxSizing: 'border-box',
  padding: '14px 16px', borderRadius: 14,
  border: '1.5px solid #E5E7EB', fontSize: 15,
  fontWeight: 600, color: '#111', outline: 'none',
  fontFamily: FONT, background: '#FAFAFA',
  transition: 'border-color 0.15s',
};

const labelBase = {
  display: 'block', fontSize: 11.5, fontWeight: 800,
  color: '#6B7280', marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: '0.05em',
};

function ProgressBar({ step }) {
  return (
    <div style={{ display: 'flex', gap: 6, padding: '0 24px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          flex: 1, height: 4, borderRadius: 99,
          background: i <= step ? RED : '#F3F4F6',
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  );
}

function FocusInput({ style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{ ...inputBase, ...style, borderColor: focused ? RED : '#E5E7EB' }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function BtnPrimary({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', background: disabled ? '#e57373' : RED,
        color: '#fff', border: 'none', borderRadius: 16,
        padding: '16px 24px', fontSize: 16, fontWeight: 800,
        cursor: disabled ? 'default' : 'pointer',
        boxShadow: disabled ? 'none' : '0 8px 24px rgba(211,47,47,0.28)',
        fontFamily: FONT, display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 8, transition: 'opacity 0.15s',
      }}
    >
      {children}
    </button>
  );
}

const slide = {
  initial: { opacity: 0, x: 36 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -36 },
  transition: { duration: 0.2, ease: 'easeInOut' },
};

export default function CompleteProfile() {
  const { session, profile, profileComplete, loading, refreshProfile } = useAuth();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    nombre:   profile?.nombre   || '',
    apellido: profile?.apellido || '',
    dni:      profile?.dni      || '',
    telefono: profile?.telefono || '',
  });
  const [submitting, setSubmitting] = useState(false);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!session)        return <Navigate to="/welcome" replace />;
  if (profileComplete) return <Navigate to="/" replace />;

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const goStep2 = () => setStep(2);

  const goStep3 = () => {
    if (!form.nombre.trim())   { toast.error('El nombre es obligatorio');              return; }
    if (!form.apellido.trim()) { toast.error('El apellido es obligatorio');            return; }
    const dniNum = form.dni.replace(/\D/g, '');
    if (dniNum.length < 7 || dniNum.length > 8) { toast.error('El DNI debe tener 7 u 8 dígitos'); return; }
    if (!form.telefono.trim()) { toast.error('El teléfono es obligatorio');            return; }
    setStep(3);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id:       session.user.id,
        nombre:   form.nombre.trim(),
        apellido: form.apellido.trim(),
        dni:      form.dni.replace(/\D/g, ''),
        telefono: form.telefono.trim(),
      });
      if (error) throw error;
      await refreshProfile();
      toast.success('¡Bienvenido a VicuñaYa!');
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', padding: '28px 0 0' }}>
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 24, color: RED, letterSpacing: '-0.02em' }}>
          VicuñaYa
        </span>
      </div>

      {/* Progress */}
      <div style={{ padding: '20px 24px 0' }}>
        <ProgressBar step={step} />
        <p style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 700, color: '#9CA3AF', marginTop: 8, fontFamily: FONT }}>
          Paso {step} de 3
        </p>
      </div>

      <AnimatePresence mode="wait">

        {/* ── Paso 1: Bienvenida ── */}
        {step === 1 && (
          <motion.div key="s1" {...slide}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px 80px', textAlign: 'center' }}
          >
            <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 24 }}>👋</div>

            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111', letterSpacing: '-0.02em', margin: '0 0 12px', lineHeight: 1.2, fontFamily: FONT }}>
              Bienvenido a<br />VicuñaYa
            </h1>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#6B7280', margin: '0 0 44px', maxWidth: 280, lineHeight: 1.65, fontFamily: FONT }}>
              Para poder hacer pedidos necesitamos algunos datos tuyos
            </p>

            <div style={{ width: '100%', maxWidth: 320 }}>
              <BtnPrimary onClick={goStep2}>
                Empezar <ChevronRight size={18} />
              </BtnPrimary>
            </div>
          </motion.div>
        )}

        {/* ── Paso 2: Datos personales ── */}
        {step === 2 && (
          <motion.div key="s2" {...slide}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '28px 24px 32px' }}
          >
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111', margin: '0 0 4px', letterSpacing: '-0.01em', fontFamily: FONT }}>
              Tus datos personales
            </h2>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#6B7280', margin: '0 0 28px', fontFamily: FONT }}>
              Los usamos para identificar tus pedidos
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelBase}>Nombre *</label>
                  <FocusInput
                    value={form.nombre}
                    onChange={e => set('nombre', e.target.value)}
                    placeholder="Juan"
                    autoComplete="given-name"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelBase}>Apellido *</label>
                  <FocusInput
                    value={form.apellido}
                    onChange={e => set('apellido', e.target.value)}
                    placeholder="García"
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div>
                <label style={labelBase}>DNI *</label>
                <FocusInput
                  inputMode="numeric"
                  value={form.dni}
                  onChange={e => set('dni', e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="30123456"
                  maxLength={8}
                />
                <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginTop: 4, fontFamily: FONT }}>
                  7 u 8 dígitos, sin puntos ni espacios
                </p>
              </div>

              <div>
                <label style={labelBase}>Teléfono *</label>
                <FocusInput
                  type="tel"
                  inputMode="numeric"
                  value={form.telefono}
                  onChange={e => set('telefono', e.target.value)}
                  placeholder="3816 123456"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div style={{ marginTop: 28 }}>
              <BtnPrimary onClick={goStep3}>Continuar</BtnPrimary>
            </div>
          </motion.div>
        )}

        {/* ── Paso 3: Confirmación ── */}
        {step === 3 && (
          <motion.div key="s3" {...slide}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '28px 24px 32px' }}
          >
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111', margin: '0 0 4px', letterSpacing: '-0.01em', fontFamily: FONT }}>
              ¿Los datos son correctos?
            </h2>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#6B7280', margin: '0 0 28px', fontFamily: FONT }}>
              Revisá antes de confirmar
            </p>

            {/* Summary card */}
            <div style={{
              background: '#FAFAFA', borderRadius: 20,
              border: '1.5px solid #F3F4F6', marginBottom: 28,
            }}>
              {[
                { Icon: User,        label: 'Nombre completo', value: `${form.nombre.trim()} ${form.apellido.trim()}` },
                { Icon: CreditCard,  label: 'DNI',             value: form.dni.replace(/\D/g, '') },
                { Icon: Phone,       label: 'Teléfono',        value: form.telefono.trim() },
              ].map(({ Icon, label, value }, i, arr) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px',
                  borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 11,
                    background: '#FEE2E2', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: RED, flexShrink: 0,
                  }}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10.5, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontFamily: FONT }}>
                      {label}
                    </p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: '2px 0 0', fontFamily: FONT }}>
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <BtnPrimary onClick={handleConfirm} disabled={submitting}>
              {submitting ? 'Guardando...' : 'Confirmar y empezar a pedir 🎉'}
            </BtnPrimary>

            <button
              onClick={() => setStep(2)}
              disabled={submitting}
              style={{
                background: 'none', border: 'none', fontSize: 14,
                fontWeight: 700, color: '#6B7280', cursor: 'pointer',
                marginTop: 16, fontFamily: FONT, padding: '8px 0',
              }}
            >
              ← Corregir datos
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
