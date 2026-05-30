import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

const SLIDES = [
  {
    id: 1,
    from: '#e31b23',
    mid: '#E8003C',
    to:  '#FF6B35',
    tag: '🎉 OFERTA ESPECIAL',
    title: '20%\nOFF',
    subtitle: 'En tu primer pedido',
    note: 'Código: PRIMERO',
    deco: [
      { e: '🍕', rotate: '-12deg', top: '10%',  right: '8%',  size: '74px' },
      { e: '🍗', rotate: '8deg',   top: '48%',  right: '22%', size: '56px' },
      { e: '🥟', rotate: '-6deg',  bottom: '8%', right: '6%', size: '52px' },
    ],
  },
  {
    id: 2,
    from: '#6D28D9',
    mid: '#8B5CF6',
    to:  '#EC4899',
    tag: '🛵 DELIVERY',
    title: 'Envío\nGRATIS',
    subtitle: 'Todos los viernes',
    note: 'Sin monto mínimo',
    deco: [
      { e: '🛵', rotate: '-8deg',  top: '8%',   right: '5%',  size: '76px' },
      { e: '⚡', rotate: '12deg',  top: '52%',  right: '24%', size: '52px' },
      { e: '🎁', rotate: '-14deg', bottom: '6%', right: '8%', size: '50px' },
    ],
  },
  {
    id: 3,
    from: '#047857',
    mid: '#10B981',
    to:  '#0EA5E9',
    tag: '👨‍👩‍👧 PARA TODOS',
    title: 'Combo\nFamiliar',
    subtitle: 'Desde $3.500',
    note: 'Más de 5 opciones',
    deco: [
      { e: '🥩', rotate: '-10deg', top: '8%',   right: '6%',  size: '70px' },
      { e: '🍗', rotate: '6deg',   top: '50%',  right: '22%', size: '58px' },
      { e: '🥗', rotate: '-8deg',  bottom: '6%', right: '5%', size: '54px' },
    ],
  },
];

export default function HeroCarousel() {
  return (
    <div style={{ marginTop: '0', marginBottom: '4px' }}>
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 3200, disableOnInteraction: false, pauseOnMouseEnter: true }}
        pagination={{ clickable: true }}
        loop
        speed={650}
        style={{ paddingBottom: '36px' }}
      >
        {SLIDES.map(slide => (
          <SwiperSlide key={slide.id}>
            {/* Sin margen lateral = full width */}
            <div
              className="relative flex items-center overflow-hidden"
              style={{
                height: 250,
                background: `linear-gradient(135deg, ${slide.from} 0%, ${slide.mid} 50%, ${slide.to} 100%)`,
              }}
            >
              {/* Círculos de fondo */}
              <div style={{ position:'absolute', right:'-60px', top:'-60px',
                width:260, height:260, borderRadius:'50%', background:'rgba(255,255,255,0.10)' }} />
              <div style={{ position:'absolute', left:'-40px', bottom:'-80px',
                width:200, height:200, borderRadius:'50%', background:'rgba(0,0,0,0.08)' }} />

              {/* Emojis decorativos */}
              {slide.deco.map((d, i) => (
                <span
                  key={i}
                  style={{
                    position: 'absolute',
                    top: d.top, bottom: d.bottom,
                    right: d.right,
                    fontSize: d.size,
                    transform: `rotate(${d.rotate})`,
                    lineHeight: 1,
                    userSelect: 'none',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))',
                  }}
                >
                  {d.e}
                </span>
              ))}

              {/* Texto */}
              <div style={{ position:'relative', zIndex:10, paddingLeft:24, paddingRight:'44%' }}>
                <span style={{
                  display: 'block',
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}>
                  {slide.tag}
                </span>

                <h2 style={{
                  color: '#fff',
                  fontSize: 52,
                  fontWeight: 900,
                  lineHeight: 0.95,
                  letterSpacing: '-0.02em',
                  whiteSpace: 'pre-line',
                  marginBottom: 8,
                  textShadow: '0 2px 12px rgba(0,0,0,0.2)',
                }}>
                  {slide.title}
                </h2>

                <p style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 16,
                  fontWeight: 700,
                  lineHeight: 1.3,
                  marginBottom: 12,
                }}>
                  {slide.subtitle}
                </p>

                <span style={{
                  display: 'inline-block',
                  background: 'rgba(255,255,255,0.22)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.35)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '5px 14px',
                  borderRadius: 999,
                }}>
                  {slide.note}
                </span>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
