import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase.js';

export default function BannerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('banners').select('*').eq('id', id).single().then(({ data, error }) => {
      if (!error) setBanner(data);
      setLoading(false);
    });
  }, [id]);

  const title = banner?.page_title || banner?.title || 'Información';
  const image = banner?.page_image_url || banner?.image_url;
  const paragraphs = (banner?.page_content || '').split('\n').map(p => p.trim()).filter(Boolean);

  return (
    <div style={{ minHeight:'100vh', background:'#fff' }}>

      {/* ── Header rojo ── */}
      <div style={{ background:'#D32F2F', padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
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
          {loading ? 'Cargando…' : title}
        </h1>
      </div>

      {loading ? (
        <div style={{ padding:'60px 16px', textAlign:'center', color:'#9CA3AF', fontWeight:600 }}>
          Cargando…
        </div>
      ) : !banner ? (
        <div style={{ padding:'60px 16px', textAlign:'center', color:'#9CA3AF', fontWeight:600 }}>
          No se encontró la información.
        </div>
      ) : (
        <div style={{ padding:'20px 16px 40px', display:'flex', flexDirection:'column', gap:14 }}>

          {image && (
            <motion.div
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              style={{ borderRadius:24, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.07)' }}
            >
              <img src={image} alt={title} loading="lazy" style={{ width:'100%', height:200, objectFit:'cover', display:'block' }} />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
            style={{ background:'#fff', borderRadius:24, padding:'20px', boxShadow:'0 4px 20px rgba(0,0,0,0.07)' }}
          >
            {paragraphs.length > 0 ? paragraphs.map((p, i) => (
              <p key={i} style={{ fontSize:14, color:'#374151', fontWeight:600, lineHeight:1.6, margin: i === paragraphs.length - 1 ? 0 : '0 0 12px' }}>
                {p}
              </p>
            )) : (
              <p style={{ fontSize:14, color:'#9CA3AF', fontWeight:600, margin:0 }}>
                Sin información disponible.
              </p>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
