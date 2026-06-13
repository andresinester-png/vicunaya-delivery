import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';

const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '14px 16px',
  borderRadius: 14, border: '1.5px solid #E5E7EB', fontSize: 15,
  fontWeight: 600, color: '#111', outline: 'none', fontFamily: 'inherit',
};

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 800, color: '#6B7280',
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em',
};

export default function CompleteProfile() {
  const { session, profile, profileComplete, loading, refreshProfile } = useAuth();

  const [form, setForm] = useState({
    nombre: profile?.nombre || '',
    apellido: profile?.apellido || '',
    dni: profile?.dni || '',
    telefono: profile?.telefono || '',
    calle: '',
    numero: '',
    barrio: '',
  });
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <Navigate to="/welcome" replace />;
  if (profileComplete) return <Navigate to="/" replace />;

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = ['nombre', 'apellido', 'dni', 'telefono', 'calle', 'numero', 'barrio'];
    if (required.some(k => !form[k].trim())) {
      toast.error('Completá todos los campos');
      return;
    }

    setSubmitting(true);
    try {
      const direccion = `${form.calle.trim()} ${form.numero.trim()}, ${form.barrio.trim()}`;
      const { error } = await supabase.from('profiles').upsert({
        id: session.user.id,
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        dni: form.dni.trim(),
        telefono: form.telefono.trim(),
        direccion,
      });
      if (error) throw error;
      await refreshProfile();
      toast.success('¡Perfil completado!');
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>

      {/* ── Header rojo ── */}
      <div style={{ background: '#e31b23', padding: '32px 16px 28px', textAlign: 'center' }}>
        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
          Completá tu perfil
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600, marginTop: 8, lineHeight: 1.4 }}>
          Necesitamos estos datos para gestionar tus pedidos
        </p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        style={{ padding: '24px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 480, margin: '0 auto' }}
      >
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Nombre</label>
            <input required value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Juan" style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Apellido</label>
            <input required value={form.apellido} onChange={e => set('apellido', e.target.value)} placeholder="García" style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>DNI</label>
          <input required inputMode="numeric" value={form.dni} onChange={e => set('dni', e.target.value)} placeholder="30123456" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Teléfono</label>
          <input required type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="3571-123456" style={inputStyle} />
        </div>

        <p style={{ fontSize: 14, fontWeight: 900, color: '#111', margin: '10px 0 0' }}>Dirección principal</p>

        <div>
          <label style={labelStyle}>Calle</label>
          <input required value={form.calle} onChange={e => set('calle', e.target.value)} placeholder="San Martín" style={inputStyle} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Número</label>
            <input required inputMode="numeric" value={form.numero} onChange={e => set('numero', e.target.value)} placeholder="123" style={inputStyle} />
          </div>
          <div style={{ flex: 1.5 }}>
            <label style={labelStyle}>Barrio</label>
            <input required value={form.barrio} onChange={e => set('barrio', e.target.value)} placeholder="Centro" style={inputStyle} />
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={submitting}
          style={{
            background: '#e31b23', color: '#fff', border: 'none', borderRadius: 16,
            padding: '16px 20px', fontSize: 15, fontWeight: 800,
            cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1,
            marginTop: 8, boxShadow: '0 6px 20px rgba(227,27,35,0.25)',
          }}
        >
          {submitting ? 'Guardando...' : 'Guardar y continuar'}
        </motion.button>
      </motion.form>
    </div>
  );
}
