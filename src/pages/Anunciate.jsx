import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '5493584000000';

const BENEFICIOS = [
  { icon:'📍', title:'Llegá a toda Vicuña Mackenna',     text:'Miles de vecinos usan VicuñaYa todos los días' },
  { icon:'📈', title:'Aumentá tus ventas',                text:'Más visibilidad, más clientes, más ingresos' },
  { icon:'📱', title:'Tu negocio en el celular de todos', text:'Presencia digital profesional' },
  { icon:'🚀', title:'Fácil y rápido',                    text:'Te configuramos todo, vos solo recibís los pedidos' },
  { icon:'💰', title:'Comisiones bajas',                  text:'Las mejores condiciones del mercado local' },
];

export default function Anunciate() {
  const navigate = useNavigate();

  const handleWhatsApp = () => {
    const msg = encodeURIComponent('Hola! Me interesa publicitar mi negocio en VicuñaYa');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
  };

  return (
    <div style={{ minHeight:'100vh', background:'#fff' }}>

      {/* ── Header rojo ── */}
      <div style={{ background:'#e31b23', padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
        <motion.button
          whileTap={{ scale:0.88 }}
          onClick={() => navigate(-1)}
          style={{
            width:36, height:36, borderRadius:'50%',
            background:'rgba(255,255,255,0.18)', border:'none',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', flexShrink:0,
          }}
        >
          <ChevronLeft size={20} color="#fff" strokeWidth={2.5} />
        </motion.button>
        <h1 style={{ color:'#fff', fontSize:19, fontWeight:900, letterSpacing:'-0.02em', margin:0 }}>
          Anunciate en VicuñaYa
        </h1>
      </div>

      <div style={{ padding:'28px 16px 40px', display:'flex', flexDirection:'column', gap:14 }}>

        {/* ── Intro ── */}
        <motion.div
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          style={{ textAlign:'center', marginBottom:6 }}
        >
          <span style={{ fontSize:46, display:'block', marginBottom:8 }}>🚀</span>
          <h2 style={{ fontSize:22, fontWeight:900, color:'#111', letterSpacing:'-0.02em', lineHeight:1.2 }}>
            Hacé crecer tu negocio<br />con VicuñaYa
          </h2>
          <p style={{ fontSize:13.5, color:'#6B7280', fontWeight:600, marginTop:8, lineHeight:1.5 }}>
            La app de delivery líder en Vicuña Mackenna
          </p>
        </motion.div>

        {/* ── Beneficios ── */}
        {BENEFICIOS.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ opacity:0, y:16 }}
            animate={{ opacity:1, y:0 }}
            transition={{ delay:0.05 + i * 0.05 }}
            style={{
              display:'flex', alignItems:'flex-start', gap:14,
              background:'#fff', borderRadius:20, padding:'18px',
              boxShadow:'0 4px 20px rgba(0,0,0,0.07)',
            }}
          >
            <div style={{
              width:48, height:48, borderRadius:14, flexShrink:0,
              background:'#FEF2F2',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:24,
            }}>
              {b.icon}
            </div>
            <div>
              <h3 style={{ fontSize:15, fontWeight:800, color:'#111', letterSpacing:'-0.01em', margin:0 }}>
                {b.title}
              </h3>
              <p style={{ fontSize:13, color:'#6B7280', fontWeight:600, marginTop:4, lineHeight:1.4 }}>
                {b.text}
              </p>
            </div>
          </motion.div>
        ))}

        {/* ── Contacto ── */}
        <motion.div
          initial={{ opacity:0, y:16 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.05 + BENEFICIOS.length * 0.05 }}
          style={{
            marginTop:10, textAlign:'center',
            background:'linear-gradient(135deg, #ff5b5f 0%, #e31b23 100%)',
            borderRadius:24, padding:'28px 20px',
            boxShadow:'0 8px 28px rgba(227,27,35,0.25)',
          }}
        >
          <h2 style={{ fontSize:20, fontWeight:900, color:'#fff', letterSpacing:'-0.02em', margin:0 }}>
            ¿Querés sumarte?
          </h2>
          <p style={{ fontSize:13.5, color:'rgba(255,255,255,0.85)', fontWeight:600, marginTop:8, marginBottom:20 }}>
            Escribinos y te ayudamos a empezar hoy mismo
          </p>
          <motion.button
            whileTap={{ scale:0.97 }}
            onClick={handleWhatsApp}
            style={{
              background:'#fff', color:'#e31b23',
              border:'none', borderRadius:18, padding:'16px',
              fontSize:16, fontWeight:900, letterSpacing:'-0.01em',
              cursor:'pointer', width:'100%',
              boxShadow:'0 4px 16px rgba(0,0,0,0.12)',
              display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            }}
          >
            <MessageCircle size={20} strokeWidth={2.5} />
            Contactar por WhatsApp
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
