import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import bgImage from '../screen.png';

const CARDS = [
  {
    id: 'rotiserias',
    title: 'Rotiserías',
    subtitle: 'Pedí tu comida favorita',
    image: 'https://hvmdumuedqfoifgayleh.supabase.co/storage/v1/object/public/IMAGES/ChatGPT%20Image%2012%20may%202026,%2019_14_30.png',
    to: '/rotiserias',
    accent: '#FF6B00',
  },
  {
    id: 'encomiendas',
    title: 'Encomiendas a Río Cuarto',
    subtitle: 'Lunes a viernes',
    image: 'https://hvmdumuedqfoifgayleh.supabase.co/storage/v1/object/public/IMAGES/ChatGPT%20Image%2012%20may%202026,%2021_25_26.png',
    to: '/encomiendas',
    accent: '#7C3AED',
  },
];

const BANNERS = [
  { id:1, title:'¡Envío gratis!',   subtitle:'En tu primer pedido de Rotiserías',     gradient:'linear-gradient(135deg, #ff5b5f 0%, #e31b23 100%)' },
  { id:2, title:'2x1 en Empanadas', subtitle:'Hoy en locales seleccionados',          gradient:'linear-gradient(135deg, #e31b23 0%, #8e0e13 100%)' },
];

const CATEGORIES = [
  { label:'Todos',      icon:'🍽️' },
  { label:'Café & Deli',image:'https://lh3.googleusercontent.com/aida-public/AB6AXuC644a3B293g3-fzwJUf-5nTko6ZGhRBZfc9uiyszTp4H94jQ-gETI_TFPxs1W7CiPeOxE4KrtGTIgWv0F-A_tfcg5kq9T1xZgrxld9fQApR4f1CAQEDTC4Qc5z4SfXXbfvrtrVqVg29LAQ2ipbsV9JSZz__YXhB0MW_llGsuvnhA-sZm6zqMAAnwQRTrKU3D2sAWfp6OyLKkQr-S2XGmMURhu4rf-DMAyjWYRcoMaImechqVDx0JCH2zrzV5rGU_6FDJibEpWeSxRI' },
  { label:'Helados',    image:'https://lh3.googleusercontent.com/aida-public/AB6AXuBv7yOHl7y0XboUsKxjWNmX1m9XRetNszCe1RaiZepbqkdISMo-zUU46A6j_EemDesBjBzYt-UUpVVbWS-s_NqqP2zyOOtCk6boPX0_hWxr1O_OzeSg2hcKodJ1b6Y8Ox1q4-iQwe-roKaBTKKo1ZsVJwvrBcER5t7Ih5NRLWi913Jpy12FCxoHpdFBJlkXPuRve_0BF4l-2VeE3SIBwmtDjem8YbOf5WG33n_i2q0ZJVR7t9mQyujE9coBulRjg5y-8DlNJL-Xvt5P' },
  { label:'Kioscos',    image:'https://lh3.googleusercontent.com/aida-public/AB6AXuBccfXnhe8YUeuyRdcy2264jmUjgX6ULlGtTlitCcoitH6GiU-YR5VivSG_onrjiNe12Ac7ZULYusEre-1CLoidFXRhA4PT5AS-qllyKt_KUHeJthuKT_OCe-gcV89ugyPRCPNtYyU_2SB9r1R7dTM11NcrFvrE688j30jgh5HeheIZWUBaYi20wsTzL_J9JmG-t-4t7e_0tWZVLsNv9Vz2KlQE-KtY0FxYm-wlFThnaYPo7ye_urBPoBtYOa5x-HCcg99akGQlX7pU' },
  { label:'Bebidas',    image:'https://lh3.googleusercontent.com/aida-public/AB6AXuA4WfUPUZssd7XXSwzYFyEjk47A0IfsZZfhh--RSa4QXVizLe7YOSKnEBZBMfgXFFImJO3byCOD_Qdw_S8nJQ-mVnciz36O69pxiYYhfbygjp6u0oDGS3aClGz9QC1B3Q13NOhMe4T88C445IdDWIeWIfqQx-DhlZfg8lUX9vO9vPIn40734P1GgGnHCBYLetU8jFu4-tybQcSaMxLBntrh0NxPKzvkwklWpQSSIaGCOyW_vLQR9OvQ2pmx9MWxd1cvWF4PSNdFezAP' },
  { label:'Empanadas',  image:'https://lh3.googleusercontent.com/aida/AP1WRLsF8g25q9zzjewJoYDuzt9P6VHhROMrTCzpRGxOFXz-KargpD9l9YqOD6MUq4xR9JAa2hRSi8tE29p5zbZiLBawIRhjTVjtMG4WakiipIGAN9vTMRLVhA0vH_gRCyesFMtH3_mSQwufLuTrMrGnVh9HCIZo5sEzlifBIEd0Km4XUom88DCmnDDRxgTyEDrf4HwcBTcHJF60M2a6XZN4_YCygxubUcd4XBGgQq7EZgRuiMA_DaWBDPpvawlC' },
  { label:'Pizza',      image:'https://lh3.googleusercontent.com/aida/AP1WRLt2hfS7nG_MPKcxQt5drIIWkmBiRFzXgV_iec3sO25LWTCKz-NBMW9ggjBGf6OcH0TB-bj1wCRrMMMg7wRxv2YYyx-rSNofBWqV8DP2rXZSfKcVUhvLm-xA4l76bdLaJdFbH-k4qIyqcf2OD_ga0F2ktQXDBgTEJX6AjzFt8oc8ky71kG0RBIOVjyl-dTixl15ai4e-v4rVpLSLTl1cHTPI4g0FtqMchU047MiXEoBN-3NTs2Es0PTCFCy9' },
  { label:'Lomitos',    image:'https://lh3.googleusercontent.com/aida-public/AB6AXuDBXP96Yc857UOzW4XLmmeq_pYvR_gdQ3FlpHerjxep7D5AoakMWFDWsgjz9AymSzrjXBkDq_YfqgTY1SGZEv24mNUT9Rxjv14wO8wnzy1VDyrN6G5vvD-WYQO06PtKtLH0HxworEN2dTL9OGHv0CgkpDsvtDR-Xxi0_h6c0C_OOEiabYzcD0Aqk1-N35M6HMCHSE51mb9WhRPo5VsNPprptX6HXTMRBonbBqC3d5EQ4BmmoorGMWcr2aRnE2UVqTW6eVPBy6VUQQUh' },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 22 } },
};

export default function Home() {
  const navigate = useNavigate();

  // ── Parallax ──────────────────────────────────────────────────
  const scrollY = useMotionValue(0);
  // La imagen se mueve al 30% de la velocidad del scroll → efecto parallax suave
  const bgY = useTransform(scrollY, v => v * 0.30);

  useEffect(() => {
    const el = document.getElementById('main-scroll');
    if (!el) return;
    const onScroll = () => scrollY.set(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollY]);

  // ── Carrusel de banners ──────────────────────────────────────
  const [activeBanner, setActiveBanner] = useState(0);
  const [banners, setBanners] = useState(BANNERS);
  const [hoveredCat, setHoveredCat] = useState(null);
  const touchStartX = useRef(null);

  useEffect(() => {
    if (activeBanner >= banners.length) setActiveBanner(0);
    const interval = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % banners.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    supabase.from('banners').select('*').eq('active', true).order('sort_order').then(({ data, error }) => {
      if (!error && data && data.length > 0) setBanners(data);
    });
  }, []);

  return (
    <div>
      {/* ── Animación de scroll para imágenes de categorías ── */}
      <style>{`
        @keyframes categoryScroll {
          0%   { transform: translateY(0%); opacity: 1; }
          35%  { transform: translateY(-100%); opacity: 0; }
          36%  { transform: translateY(100%); opacity: 0; }
          50%  { transform: translateY(0%); opacity: 1; }
          100% { transform: translateY(0%); opacity: 1; }
        }
        .category-scroll-img {
          animation: categoryScroll 3.5s linear infinite;
        }
      `}</style>

      {/* ── Hero con parallax ── */}
      <div style={{ position: 'relative', height: 220, overflow: 'hidden', background: '#111' }}>
        <motion.div
          aria-hidden
          style={{
            position: 'absolute',
            top: '-18%',
            left: 0,
            right: 0,
            bottom: '-18%',
            y: bgY,
            willChange: 'transform',
            overflow: 'hidden',
          }}
        >
          <img
            src={bgImage}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
              display: 'block',
            }}
          />
        </motion.div>

        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.38) 50%, rgba(0,0,0,0.60) 100%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 2, height: '100%', boxSizing: 'border-box', padding: '24px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 600, marginBottom: 3 }}>
            Vicuña Mackenna, Córdoba
          </p>
          <h1 style={{
            fontSize: 28, fontWeight: 900, color: '#fff',
            letterSpacing: '-0.03em', lineHeight: 1.1,
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}>
            ¿Qué necesitás hoy?
          </h1>
        </div>
      </div>

      {/* ── Carrusel de banners ── */}
      <div style={{ background: '#fff', padding: '16px 16px 0', position: 'relative', zIndex: 9 }}>
        <div
          style={{ overflow: 'hidden', borderRadius: 16 }}
          onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={e => {
            if (touchStartX.current === null) return;
            const delta = touchStartX.current - e.changedTouches[0].clientX;
            if (delta > 50) setActiveBanner(prev => (prev + 1) % banners.length);
            else if (delta < -50) setActiveBanner(prev => (prev - 1 + banners.length) % banners.length);
            touchStartX.current = null;
          }}
        >
          <div style={{
            display: 'flex',
            transform: `translateX(-${activeBanner * 100}%)`,
            transition: 'transform 0.5s ease',
          }}>
            {banners.map((banner, idx) => (
              <div
                key={banner.id}
                onClick={() => {
                  if (idx === 0) { navigate('/anunciate'); return; }
                  if (idx === 1) { navigate('/sorteo'); return; }
                  if (banner.link_type === 'url' && banner.link_url) {
                    window.open(banner.link_url, '_blank');
                  } else if (banner.link_type === 'page') {
                    navigate(`/banner/${banner.id}`);
                  }
                }}
                style={{
                  flex: '0 0 100%',
                  height: 160, borderRadius: 16, overflow: 'hidden', position: 'relative',
                  background: banner.image_url ? '#000' : banner.gradient,
                  display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  cursor: (idx === 0 || idx === 1 || (banner.link_type && banner.link_type !== 'none')) ? 'pointer' : 'default',
                }}
              >
                {banner.image_url && (
                  <img
                    src={banner.image_url}
                    alt=""
                    style={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%',
                      objectFit: 'cover', objectPosition: 'center',
                      zIndex: 0,
                    }}
                  />
                )}
                <div style={{ position: 'relative', zIndex: 1, padding: '0 24px', boxSizing: 'border-box' }}>
                  {banner.title && (
                    <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: '-0.02em', textShadow: banner.image_url ? '0 1px 6px rgba(0,0,0,0.4)' : 'none' }}>
                      {banner.title}
                    </h3>
                  )}
                  {banner.subtitle && (
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600, marginTop: 6, textShadow: banner.image_url ? '0 1px 6px rgba(0,0,0,0.4)' : 'none' }}>
                      {banner.subtitle}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots de paginación */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '10px 0' }}>
          {banners.map((_, i) => (
            <div
              key={i}
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: i === activeBanner ? '#e31b23' : '#E5E7EB',
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Grilla de categorías ── */}
      <div style={{ background: '#fff', padding: '16px 16px 6px', position: 'relative', zIndex: 9 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {CATEGORIES.map((cat, idx) => (
            <motion.button
              key={cat.label}
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate('/rotiserias', { state: { category: cat.label } })}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <div
                onMouseEnter={() => setHoveredCat(cat.label)}
                onMouseLeave={() => setHoveredCat(null)}
                onTouchStart={() => setHoveredCat(cat.label)}
                onTouchEnd={() => setHoveredCat(null)}
                style={{
                  width: 68, height: 68, borderRadius: 14,
                  border: '2px solid transparent',
                  boxSizing: 'border-box', padding: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', background: '#EFEFEF',
                  transform: hoveredCat === cat.label ? 'scale(1.08)' : 'scale(1)',
                  boxShadow: hoveredCat === cat.label ? '0 6px 16px rgba(0,0,0,0.15)' : '0 0 0 rgba(0,0,0,0)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.15s, background 0.15s',
                }}
              >
                {cat.image ? (
                  <img
                    className="category-scroll-img"
                    src={cat.image}
                    alt={cat.label}
                    style={{
                      width: '100%', height: '130%', objectFit: 'cover', borderRadius: 0,
                      animationDelay: `${idx * 0.4}s`,
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 26 }}>{cat.icon}</span>
                )}
              </div>
              <span style={{
                fontSize: 11.5, lineHeight: 1.2, textAlign: 'center',
                fontWeight: 600,
                color: '#374151',
              }}>
                {cat.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Accesos principales ── */}
      <div style={{ background: '#fff', padding: '8px 16px 32px' }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {CARDS.map(card => (
            <motion.div
              key={card.id}
              variants={cardVariants}
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.015, y: -3 }}
              transition={{ type: 'spring', stiffness: 350, damping: 24 }}
              onClick={() => navigate(card.to)}
              style={{
                position: 'relative',
                height: 140,
                borderRadius: 28,
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
              }}
            >
              {/* Imagen de la card */}
              <img
                src={card.image}
                alt={card.title}
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                }}
              />

              {/* Overlay de la card */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(160deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.48) 60%, rgba(0,0,0,0.68) 100%)',
              }} />

              {/* Flecha arriba-derecha */}
              <div style={{
                position: 'absolute', top: 16, right: 16,
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.28)',
                borderRadius: 999,
                width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ChevronRight size={16} color="#fff" strokeWidth={2.5} />
              </div>

              {/* Texto inferior */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '16px 20px 22px',
              }}>
                <h2 style={{
                  color: '#fff', fontSize: 22, fontWeight: 900,
                  letterSpacing: '-0.02em', lineHeight: 1.1,
                  textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  margin: 0,
                }}>
                  {card.title}
                </h2>
                <p style={{
                  color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: 600,
                  marginTop: 4, textShadow: '0 1px 4px rgba(0,0,0,0.35)',
                }}>
                  {card.subtitle}
                </p>
                <div style={{
                  marginTop: 12, height: 3, width: 40, borderRadius: 2,
                  background: card.accent, opacity: 0.95,
                }} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
