import HeroCarousel from '../components/HeroCarousel.jsx';
import RestaurantCard from '../components/RestaurantCard.jsx';
import BottomNav from '../components/BottomNav.jsx';

/* ── Datos de ejemplo para la muestra ── */
const SAMPLE_RESTAURANTS = [
  {
    id: 'demo-1',
    name: 'La Rotisería del Centro',
    logo_url: '',
    image_url: '',
    category: 'Rotisería',
    rating: 4.8,
    delivery_time: 25,
    delivery_price: 0,
    min_order: 2500,
  },
  {
    id: 'demo-2',
    name: 'Pizzería Don Aldo',
    logo_url: '',
    image_url: '',
    category: 'Pizza',
    rating: 4.6,
    delivery_time: 30,
    delivery_price: 600,
    min_order: 3000,
  },
  {
    id: 'demo-3',
    name: 'Sushi Puna',
    logo_url: '',
    image_url: '',
    category: 'Sushi',
    rating: 4.9,
    delivery_time: 40,
    delivery_price: 800,
    min_order: 5000,
  },
];

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-lg font-bold text-ink px-4 mb-3 tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DesignPreview() {
  return (
      <div className="min-h-screen bg-surface pb-24">
        {/* Encabezado de la muestra */}
        <header className="px-4 pt-8 pb-5">
          <span className="badge mb-2 inline-block">Design System</span>
          <h1 className="font-display text-3xl font-extrabold text-ink tracking-tight">
            Vicuñaya — Muestra visual
          </h1>
          <p className="text-sm text-ink-muted mt-1 leading-relaxed">
            Rojo de marca como único acento, sobre blanco y grises. Títulos en Bricolage Grotesque.
          </p>
        </header>

        {/* Paleta */}
        <Section title="Paleta de marca">
          <div className="px-4 grid grid-cols-4 gap-2">
            {[
              ['Marca', 'bg-primary'],
              ['Tinta', 'bg-ink'],
              ['Gris', 'bg-ink-muted'],
              ['Superficie', 'bg-surface border border-line'],
            ].map(([label, bg]) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <div className={`h-14 w-full rounded-xl ${bg}`} />
                <span className="text-[11px] font-semibold text-ink-soft">{label}</span>
              </div>
            ))}
          </div>
          <p className="px-4 text-[11px] text-ink-muted mt-3 leading-relaxed">
            El amarillo (rating), el verde (abierto/cerrado) y los tonos de categoría son colores
            funcionales: viven solo en sus chips/badges, nunca en botones ni en el banner.
          </p>
        </Section>

        {/* Botones */}
        <Section title="Botones">
          <div className="px-4 flex flex-wrap gap-3">
            <button className="btn-primary">Pedir ahora</button>
            <button className="btn-outline">Ver menú</button>
            <span className="badge">Envío gratis</span>
          </div>
        </Section>

        {/* Hero */}
        <Section title="HeroCarousel">
          <HeroCarousel />
        </Section>

        {/* Tarjetas */}
        <Section title="RestaurantCard">
          <div className="px-4 flex flex-col gap-4">
            {SAMPLE_RESTAURANTS.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        </Section>

        {/* Bottom nav */}
        <Section title="BottomNav">
          <p className="px-4 text-xs text-ink-muted mb-2">Fijo al pie de la pantalla ↓</p>
        </Section>

        <BottomNav />
      </div>
  );
}
