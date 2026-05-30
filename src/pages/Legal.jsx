import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const TABS = [
  { id: 'privacy', label: 'Política de privacidad' },
  { id: 'terms',   label: 'Términos y condiciones' },
];

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{
        fontSize: 15, fontWeight: 800, color: '#111',
        letterSpacing: '-0.02em', margin: '0 0 8px',
      }}>
        {title}
      </h3>
      <div style={{ fontSize: 13.5, color: '#4B5563', lineHeight: 1.65, fontWeight: 500 }}>
        {children}
      </div>
    </div>
  );
}

function Bullet({ children }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
      <span style={{ color: '#e31b23', fontWeight: 900, flexShrink: 0, marginTop: 1 }}>·</span>
      <span>{children}</span>
    </div>
  );
}

function PrivacyContent() {
  return (
    <>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24, lineHeight: 1.6 }}>
        Última actualización: mayo 2025
      </p>

      <Section title="1. Datos que recopilamos">
        <p style={{ marginBottom: 8 }}>Al usar VicuñaYa podemos recopilar la siguiente información:</p>
        <Bullet>Nombre y apellido</Bullet>
        <Bullet>Número de teléfono</Bullet>
        <Bullet>Dirección de entrega</Bullet>
        <Bullet>Correo electrónico (cuando usás Google para iniciar sesión)</Bullet>
        <Bullet>Historial de pedidos</Bullet>
      </Section>

      <Section title="2. Cómo usamos tus datos">
        <Bullet>Procesar y coordinar tus pedidos con los restaurantes</Bullet>
        <Bullet>Contactarte ante cualquier inconveniente con tu pedido</Bullet>
        <Bullet>Mejorar la experiencia de la aplicación</Bullet>
        <Bullet>Enviar notificaciones relacionadas con el estado de tu pedido</Bullet>
      </Section>

      <Section title="3. Compartición de datos">
        <p>
          <strong>No vendemos ni compartimos tus datos personales con terceros</strong> con fines
          comerciales. Tus datos sólo son compartidos con el restaurante que recibe tu pedido, en
          la medida necesaria para completar la entrega.
        </p>
      </Section>

      <Section title="4. Autenticación con Google">
        <p>
          Ofrecemos la opción de iniciar sesión mediante Google OAuth. En ese caso, Google nos
          proporciona tu nombre y correo electrónico de forma segura. No almacenamos tu contraseña
          de Google ni tenemos acceso a otros datos de tu cuenta.
        </p>
      </Section>

      <Section title="5. Almacenamiento seguro">
        <p>
          Tus datos se almacenan de forma segura en <strong>Supabase</strong>, una plataforma de
          base de datos con cifrado en tránsito (HTTPS/TLS) y en reposo. Implementamos controles
          de acceso para que sólo personal autorizado pueda acceder a información sensible.
        </p>
      </Section>

      <Section title="6. Tus derechos">
        <Bullet>Acceder a los datos que tenemos sobre vos</Bullet>
        <Bullet>Solicitar la corrección de datos incorrectos</Bullet>
        <Bullet>Solicitar la eliminación de tu cuenta y todos tus datos</Bullet>
        <p style={{ marginTop: 8 }}>
          Para ejercer cualquiera de estos derechos, contactanos en{' '}
          <strong>admin@vicunaya.com</strong>.
        </p>
      </Section>

      <Section title="7. Contacto">
        <p>
          Si tenés preguntas sobre esta política de privacidad, podés escribirnos a{' '}
          <strong>admin@vicunaya.com</strong>. Respondemos en un plazo máximo de 5 días hábiles.
        </p>
      </Section>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24, lineHeight: 1.6 }}>
        Última actualización: mayo 2025
      </p>

      <Section title="1. El servicio">
        <p>
          VicuñaYa es una plataforma que conecta a usuarios con restaurantes y comercios locales
          de Vicuña Mackenna, Córdoba. Actuamos como intermediarios: facilitamos el pedido, pero
          la preparación y entrega depende de cada establecimiento.
        </p>
      </Section>

      <Section title="2. Responsabilidad sobre los alimentos">
        <p>
          VicuñaYa <strong>no se responsabiliza</strong> por la calidad, inocuidad o estado de
          los alimentos preparados por los restaurantes. Cada establecimiento es responsable del
          cumplimiento de las normativas alimentarias vigentes. Ante cualquier problema con un
          producto, te recomendamos contactar directamente al restaurante.
        </p>
      </Section>

      <Section title="3. Precios">
        <p>
          Los precios de los productos son fijados exclusivamente por cada restaurante y pueden
          cambiar sin previo aviso. VicuñaYa no interviene en la fijación de precios ni garantiza
          que los precios mostrados estén siempre actualizados en tiempo real.
        </p>
      </Section>

      <Section title="4. Confirmación de pedidos">
        <p>
          Un pedido se considera <strong>confirmado</strong> únicamente cuando el restaurante lo
          acepta. Hasta ese momento, el pedido está pendiente de aceptación. VicuñaYa no puede
          garantizar la disponibilidad de los productos en el momento de realizar el pedido.
        </p>
      </Section>

      <Section title="5. Cancelaciones">
        <Bullet>Podés cancelar un pedido antes de que el restaurante lo acepte.</Bullet>
        <Bullet>Una vez aceptado, la cancelación queda sujeta a la política de cada restaurante.</Bullet>
        <Bullet>En caso de problemas con la cancelación, contactá a admin@vicunaya.com.</Bullet>
      </Section>

      <Section title="6. Uso aceptable">
        <p style={{ marginBottom: 8 }}>Al usar VicuñaYa, te comprometés a:</p>
        <Bullet>No realizar pedidos falsos o fraudulentos</Bullet>
        <Bullet>No usar la plataforma para actividades ilegales</Bullet>
        <Bullet>Proporcionar información de contacto y dirección verídica</Bullet>
        <Bullet>Tratar con respeto al personal de los restaurantes y repartidores</Bullet>
        <p style={{ marginTop: 8 }}>
          El incumplimiento de estas normas puede resultar en la suspensión de tu acceso a la
          plataforma.
        </p>
      </Section>

      <Section title="7. Edad mínima">
        <p>
          VicuñaYa está disponible para usuarios <strong>mayores de 13 años</strong>. Al usar la
          aplicación, confirmás que tenés al menos 13 años de edad o que contás con el
          consentimiento de un tutor legal.
        </p>
      </Section>
    </>
  );
}

export default function Legal() {
  const navigate    = useNavigate();
  const [tab, setTab] = useState('privacy');

  return (
    <div style={{ background: '#F8F8F8', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Header */}
      <div style={{
        background: '#fff',
        padding: '16px 16px 0',
        borderBottom: '1px solid #F3F4F6',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => navigate(-1)}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#F3F4F6', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <ChevronLeft size={20} color="#374151" strokeWidth={2.5} />
          </motion.button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>
              Legal
            </h1>
            <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, margin: '2px 0 0' }}>
              VicuñaYa · Vicuña Mackenna, Córdoba
            </p>
          </div>
        </div>

        {/* Tab strip */}
        <div style={{ display: 'flex', gap: 8, paddingBottom: 12 }}>
          {TABS.map(t => (
            <motion.button
              key={t.id}
              whileTap={{ scale: 0.93 }}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 999,
                fontSize: 12.5, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                transition: 'background 0.18s, color 0.18s, box-shadow 0.18s',
                background: tab === t.id ? '#e31b23' : '#fff',
                color:      tab === t.id ? '#fff'     : '#374151',
                boxShadow:  tab === t.id
                  ? '0 4px 12px rgba(227,27,35,0.30)'
                  : '0 1px 6px rgba(0,0,0,0.08)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {t.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px 16px 48px' }}>
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          style={{
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
            padding: '24px 20px',
          }}
        >
          {tab === 'privacy' ? <PrivacyContent /> : <TermsContent />}
        </motion.div>
      </div>
    </div>
  );
}
