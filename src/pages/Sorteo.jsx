import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

const PASOS = [
  { num:'1️⃣', text:'Descargá VicuñaYa' },
  { num:'2️⃣', text:'Realizá cualquier pedido por la app' },
  { num:'3️⃣', text:'Cada compra es una entrada al sorteo' },
  { num:'4️⃣', text:'¡A más pedidos, más chances de ganar!' },
];

const BASES = [
  'El sorteo se realizará al finalizar el Mundial 2026',
  'Premio: $100.000 en efectivo',
  'Participan todos los usuarios que hayan realizado al menos un pedido a través de la app VicuñaYa durante el período del Mundial 2026',
  'El ganador será contactado por WhatsApp al número registrado en la app',
  'El sorteo se realizará en vivo y será transmitido por las redes sociales de VicuñaYa',
];

const CONFETTI_COLORS = ['#FFD700', '#fff', '#FFB800', '#ff8a8d'];

const CONFETTI = Array.from({ length: 28 }, (_, i) => ({
  left: Math.round(Math.random() * 100),
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 6 + Math.round(Math.random() * 8),
  delay: Math.round(Math.random() * 30) / 10,
  duration: 3 + Math.round(Math.random() * 20) / 10,
  round: i % 2 === 0,
}));

export default function Sorteo() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight:'100vh', background:'#fff' }}>

      {/* ── Animación de confeti ── */}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(220px) rotate(360deg); opacity: 0; }
        }
        .confetti-piece {
          position: absolute;
          top: -20px;
          animation-name: confettiFall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>

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
          Gran Sorteo VicuñaYa
        </h1>
      </div>

      {/* ── Banner con confeti ── */}
      <div style={{
        position:'relative', overflow:'hidden', height:180,
        background:'linear-gradient(135deg, #e31b23 0%, #8e0e13 100%)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        {CONFETTI.map((c, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left:`${c.left}%`,
              width:c.size, height:c.size,
              background:c.color,
              borderRadius: c.round ? '50%' : 2,
              animationDelay:`${c.delay}s`,
              animationDuration:`${c.duration}s`,
            }}
          />
        ))}
        <div style={{ textAlign:'center', position:'relative', zIndex:1 }}>
          <p style={{ fontSize:14, fontWeight:800, color:'#FFD700', letterSpacing:'0.12em', textTransform:'uppercase', margin:0 }}>
            Gran premio
          </p>
          <h2 style={{ fontSize:46, fontWeight:900, color:'#FFD700', textShadow:'0 4px 16px rgba(0,0,0,0.35)', margin:'4px 0 0', letterSpacing:'-0.02em' }}>
            🏆 $100.000
          </h2>
        </div>
      </div>

      <div style={{ padding:'24px 16px 40px', display:'flex', flexDirection:'column', gap:14 }}>

        {/* ── ¿Cómo participar? ── */}
        <motion.div
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          style={{ background:'#fff', borderRadius:24, padding:'20px', boxShadow:'0 4px 20px rgba(0,0,0,0.07)' }}
        >
          <h2 style={{ fontSize:17, fontWeight:900, color:'#111', letterSpacing:'-0.01em', margin:0 }}>
            ¿Cómo participar?
          </h2>
          <div style={{ display:'flex', flexDirection:'column', gap:14, marginTop:16 }}>
            {PASOS.map((p, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:14 }}>
                <span style={{ fontSize:26, flexShrink:0 }}>{p.num}</span>
                <p style={{ fontSize:14, fontWeight:700, color:'#111', margin:0, lineHeight:1.4 }}>{p.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Bases y condiciones ── */}
        <motion.div
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
          style={{
            background:'#fff', borderRadius:24, padding:'20px',
            boxShadow:'0 4px 20px rgba(0,0,0,0.07)',
            border:'1.5px solid #FDF3D8',
          }}
        >
          <h2 style={{ fontSize:17, fontWeight:900, color:'#111', letterSpacing:'-0.01em', margin:0 }}>
            📋 Bases y condiciones
          </h2>
          <ul style={{ display:'flex', flexDirection:'column', gap:10, marginTop:14, paddingLeft:0, listStyle:'none' }}>
            {BASES.map((b, i) => (
              <li key={i} style={{ display:'flex', gap:10, fontSize:13, color:'#6B7280', fontWeight:600, lineHeight:1.5, margin:0 }}>
                <span style={{ color:'#FFB800', fontWeight:900, flexShrink:0 }}>★</span>
                {b}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
