import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Clock, MapPin, Phone, Package, CheckCircle } from 'lucide-react';

const HORARIOS = [
  { dia: 'Lunes a viernes', hora: '8:00 — 18:00', activo: true },
  { dia: 'Sábados',         hora: 'Consultar',     activo: false },
  { dia: 'Domingos',        hora: 'Cerrado',        activo: false },
];

const BENEFICIOS = [
  { icon: Package,      texto: 'Paquetes de hasta 20kg'         },
  { icon: Clock,        texto: 'Entrega en el día (según hora)' },
  { icon: CheckCircle,  texto: 'Seguimiento por WhatsApp'       },
  { icon: MapPin,       texto: 'Retiro a domicilio disponible'  },
];

export default function Encomiendas() {
  const navigate = useNavigate();

  const handleWhatsApp = () => {
    const msg = encodeURIComponent('Hola, quiero enviar una encomienda a Río Cuarto. ¿Me podés dar información?');
    window.open(`https://wa.me/5493571000000?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen" style={{ background: '#F8F8F8' }}>
      {/* Hero con imagen */}
      <div style={{ position:'relative', height:240, overflow:'hidden' }}>
        <img
          src="https://hvmdumuedqfoifgayleh.supabase.co/storage/v1/object/public/IMAGES/ChatGPT%20Image%2012%20may%202026,%2019_15_45.png"
          alt="Encomiendas"
          style={{ width:'100%', height:'100%', objectFit:'cover' }}
        />
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(160deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.70) 100%)',
        }} />

        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => navigate(-1)}
          style={{
            position:'absolute', top:16, left:16,
            width:38, height:38, borderRadius:'50%',
            background:'rgba(255,255,255,0.20)', backdropFilter:'blur(8px)',
            border:'none', display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer',
          }}
        >
          <ChevronLeft size={20} color="#fff" strokeWidth={2.5} />
        </motion.button>

        <div style={{ position:'absolute', bottom:24, left:20 }}>
          <span style={{ fontSize:40, display:'block', marginBottom:6 }}>📦</span>
          <h1 style={{ color:'#fff', fontSize:26, fontWeight:900, letterSpacing:'-0.02em', lineHeight:1.1, textShadow:'0 2px 8px rgba(0,0,0,0.4)' }}>
            Encomiendas<br />a Río Cuarto
          </h1>
          <p style={{ color:'rgba(255,255,255,0.85)', fontSize:13, fontWeight:600, marginTop:6 }}>
            Servicio de paquetería rápido y seguro
          </p>
        </div>
      </div>

      <div style={{ padding:'20px 16px 32px', display:'flex', flexDirection:'column', gap:16 }}>

        {/* Horarios */}
        <motion.div
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
          style={{ background:'#fff', borderRadius:24, padding:'18px 20px', boxShadow:'0 4px 20px rgba(0,0,0,0.07)' }}
        >
          <h2 style={{ fontSize:16, fontWeight:900, color:'#111', marginBottom:14, letterSpacing:'-0.01em' }}>
            🕐 Horarios de servicio
          </h2>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {HORARIOS.map(h => (
              <div key={h.dia} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:14, fontWeight:600, color: h.activo ? '#111' : '#9CA3AF' }}>{h.dia}</span>
                <span style={{
                  fontSize:13, fontWeight:700,
                  color: h.activo ? '#16A34A' : '#9CA3AF',
                  background: h.activo ? '#F0FDF4' : '#F9FAFB',
                  padding:'3px 10px', borderRadius:999,
                }}>
                  {h.hora}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Beneficios */}
        <motion.div
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          style={{ background:'#fff', borderRadius:24, padding:'18px 20px', boxShadow:'0 4px 20px rgba(0,0,0,0.07)' }}
        >
          <h2 style={{ fontSize:16, fontWeight:900, color:'#111', marginBottom:14, letterSpacing:'-0.01em' }}>
            ✅ ¿Por qué elegirnos?
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {BENEFICIOS.map(({ icon: Icon, texto }) => (
              <div key={texto} style={{
                display:'flex', flexDirection:'column', alignItems:'flex-start', gap:8,
                background:'#F8F8F8', borderRadius:16, padding:'14px 14px',
              }}>
                <div style={{
                  width:36, height:36, borderRadius:10,
                  background:'#EDE9FE', display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <Icon size={18} color="#7C3AED" strokeWidth={2} />
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:'#374151', lineHeight:1.3 }}>{texto}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Info de contacto */}
        <motion.div
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
          style={{ background:'#fff', borderRadius:24, padding:'18px 20px', boxShadow:'0 4px 20px rgba(0,0,0,0.07)' }}
        >
          <h2 style={{ fontSize:16, fontWeight:900, color:'#111', marginBottom:14, letterSpacing:'-0.01em' }}>
            📍 Dónde encontrarnos
          </h2>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { icon: MapPin, label:'Dirección',  val:'Av. San Martín 350, Vicuña Mackenna' },
              { icon: Clock,  label:'Salida diaria', val:'13:00 hs (lunes a viernes)'       },
              { icon: Phone,  label:'WhatsApp',   val:'+54 9 3571 000-000'                  },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                <div style={{
                  width:34, height:34, borderRadius:10,
                  background:'#F3F4F6', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                }}>
                  <Icon size={16} color="#6B7280" />
                </div>
                <div>
                  <p style={{ fontSize:11, color:'#9CA3AF', fontWeight:600, marginBottom:1 }}>{label}</p>
                  <p style={{ fontSize:13, fontWeight:700, color:'#111' }}>{val}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleWhatsApp}
          style={{
            background:'#25D366', color:'#fff',
            border:'none', borderRadius:20, padding:'16px',
            fontSize:16, fontWeight:900, letterSpacing:'-0.01em',
            cursor:'pointer', width:'100%',
            boxShadow:'0 6px 24px rgba(37,211,102,0.35)',
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          }}
        >
          <span style={{ fontSize:20 }}>💬</span>
          Consultar por WhatsApp
        </motion.button>
      </div>
    </div>
  );
}
