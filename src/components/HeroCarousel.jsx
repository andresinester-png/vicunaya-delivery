import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { ArrowRight } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/pagination';

const SLIDES = [
  {
    id: 1,
    tag: 'Oferta especial',
    title: '20% off en tu primer pedido',
    subtitle: 'Aplicá el código al finalizar la compra.',
    cta: 'Pedir ahora',
    code: 'PRIMERO',
  },
  {
    id: 2,
    tag: 'Delivery',
    title: 'Envío gratis los viernes',
    subtitle: 'Sin monto mínimo en comercios seleccionados.',
    cta: 'Ver comercios',
    code: null,
  },
  {
    id: 3,
    tag: 'Para compartir',
    title: 'Combos familiares desde $3.500',
    subtitle: 'Más de cinco opciones para toda la mesa.',
    cta: 'Explorar combos',
    code: null,
  },
];

export default function HeroCarousel() {
  return (
    <div className="px-4">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true }}
        pagination={{ clickable: true }}
        loop
        speed={600}
        style={{ paddingBottom: '28px' }}
      >
        {SLIDES.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="relative flex flex-col justify-center bg-white border border-line rounded-2xl px-5 py-6 min-h-[150px] overflow-hidden">
              {/* Acento de marca contenido: barra lateral roja */}
              <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary" aria-hidden="true" />

              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary mb-2">
                {slide.tag}
              </span>

              <h2 className="font-display text-2xl font-extrabold text-ink leading-tight tracking-tight text-balance mb-1.5 pr-4">
                {slide.title}
              </h2>

              <p className="text-sm text-ink-muted leading-relaxed mb-4 pr-4">
                {slide.subtitle}
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                <button className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary-dark transition-colors">
                  {slide.cta}
                  <ArrowRight size={15} strokeWidth={2.5} />
                </button>
                {slide.code && (
                  <span className="text-xs font-semibold text-ink-soft">
                    Código:{' '}
                    <span className="font-mono font-bold text-ink bg-surface border border-line px-1.5 py-0.5 rounded">
                      {slide.code}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
