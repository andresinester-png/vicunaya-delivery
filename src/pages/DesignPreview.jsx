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
            Rojo vermellón, amarillo maíz y crema. Títulos en Bricolage Grotesque.
          </p>
        </header>

        {/* Paleta */}
        <Section title="Paleta">
          <div className="px-4 grid grid-cols-5 gap-2">
            {[
              ['Marca', 'bg-primary', 'text-white'],
              ['Acento', 'bg-accent', 'text-ink'],
              ['Tinta', 'bg-ink', 'text-white'],
              ['Éxito', 'bg-success', 'text-white'],
              ['Crema', 'bg-card border border-line', 'text-ink'],
            ].map(([label, bg, fg]) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <div className={`h-14 w-full rounded-2xl ${bg}`} />
                <span className={`text-[11px] font-semibold ${fg === 'text-white' ? 'text-ink' : fg}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
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
