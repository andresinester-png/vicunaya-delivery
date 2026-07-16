import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageCircle, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

const WHATSAPP_NUMBER = '5493584123456'; // ← actualizar con el número real de Themtham Gas
const WHATSAPP_MSG    = encodeURIComponent('Hola! Vi Themtham Gas en Kyvra y quiero pedir 🔥');

export default function Gas() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100dvh', background: '#F8F9FF',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>

      {/* Header */}
      <header style={{
        background: '#fff', borderBottom: '1px solid #E2E8F0',
        height: 56, display: 'flex', alignItems: 'center',
        padding: '0 16px', flexShrink: 0,
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 36, height: 36, borderRadius: '50%', background: '#F1F5F9',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronLeft size={20} color="#0F172A" strokeWidth={2.5} />
        </button>
        <span style={{ fontWeight: 800, fontSize: 16, color: '#0F172A', marginLeft: 12 }}>
          Gas a domicilio
        </span>
      </header>

      {/* Contenido */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px 80px', textAlign: 'center',
      }}>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.42, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            width: 160, height: 160, borderRadius: 36,
            overflow: 'hidden',
            boxShadow: '0 16px 48px rgba(13,148,136,0.20)',
            marginBottom: 28,
          }}
        >
          <img
            src="/themtham-gas.png"
            alt="Themtham Gas"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </motion.div>

        {/* Pill "Próximamente" */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.35 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#F0FDFA', border: '1px solid rgba(13,148,136,0.25)',
            borderRadius: 999, padding: '6px 14px', marginBottom: 18,
          }}
        >
          <Flame size={14} color="#0D9488" strokeWidth={2} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0D9488', letterSpacing: '0.06em' }}>
            PRÓXIMAMENTE EN KYVRA
          </span>
        </motion.div>

        {/* Nombre */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
          style={{ fontWeight: 900, fontSize: 28, color: '#0F172A', margin: '0 0 10px', letterSpacing: '-0.02em' }}
        >
          Themtham Gas
        </motion.h1>

        {/* Descripción */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.35 }}
          style={{ fontSize: 15, color: '#64748B', margin: '0 0 10px', lineHeight: 1.6, maxWidth: 300 }}
        >
          Tubos de gas y agua a domicilio en Vicuña Mackenna.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.35 }}
          style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 40px', lineHeight: 1.6, maxWidth: 280 }}
        >
          Estamos integrando el pedido directo. Por ahora contactate por WhatsApp.
        </motion.p>

        {/* Botón WhatsApp */}
        <motion.a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.35 }}
          whileTap={{ scale: 0.97 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: '#25D366', color: '#fff',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800, fontSize: 16,
            padding: '14px 28px', borderRadius: 16,
            textDecoration: 'none',
            boxShadow: '0 6px 0 0 #128C4D',
            letterSpacing: '-0.01em',
          }}
        >
          <MessageCircle size={20} strokeWidth={2} />
          Pedir por WhatsApp
        </motion.a>

        {/* Volver */}
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            marginTop: 20, background: 'none', border: 'none',
            cursor: 'pointer', fontSize: 13, color: '#94A3B8',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
