import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Star, Bike } from 'lucide-react';
import { isRestaurantOpen } from '../lib/restaurantUtils.js';
import { getCategoryTheme } from '../lib/categoryTheme.js';

export default function RestaurantCard({ restaurant }) {
  const {
    id, name, image_url, logo_url, category, cover_position,
    rating, delivery_time, delivery_price, min_order, tags,
  } = restaurant;

  const isOpen     = isRestaurantOpen(restaurant);
  const categories = Array.isArray(category) ? category : (category ? [category] : []);
  const theme      = getCategoryTheme(categories[0]);

  // Chips: prioriza campo tags, sino usa category
  const chips = tags
    ? (Array.isArray(tags) ? tags : String(tags).split(',').map(t => t.trim()).filter(Boolean))
    : categories;

  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
    >
      <Link
        to={`/restaurant/${id}`}
        className="block bg-white rounded-3xl overflow-hidden shadow-card no-underline"
      >
        {/* ── Foto de portada ── */}
        <div className="relative h-40 overflow-hidden bg-line">
          {image_url ? (
            <img
              src={image_url}
              alt={name}
              className="w-full h-full object-cover"
              style={{ objectPosition: cover_position || '50% 50%' }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center relative overflow-hidden"
              style={{ background: `linear-gradient(145deg, ${theme.grad[0]} 0%, ${theme.grad[1]} 100%)` }}
            >
              <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10" />
              <div className="absolute -left-5 -bottom-10 w-28 h-28 rounded-full bg-black/10" />
              <span className="relative z-10 text-6xl font-display font-extrabold tracking-tighter text-white/35">
                {name.charAt(0)}
              </span>
            </div>
          )}

          {/* Gradiente bottom sutil */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />

          {/* Badge Abierto/Cerrado */}
          <div className="absolute top-2.5 left-2.5">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold text-white px-2.5 py-1 rounded-full backdrop-blur-sm ${
                isOpen ? 'bg-success/90' : 'bg-black/55'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
              {isOpen ? 'Abierto' : 'Cerrado'}
            </span>
          </div>
        </div>

        {/* ── Cuerpo ── */}
        <div className="px-3.5 pt-3 pb-3.5">

          {/* Logo + nombre + rating */}
          <div className="flex items-start gap-2.5 mb-2">
            <div
              className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center overflow-hidden border-2 border-line shadow-sm"
              style={{ background: logo_url ? '#FBF6EF' : theme.solid }}
            >
              {logo_url ? (
                <img src={logo_url} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-display font-extrabold text-lg">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-display text-[15px] font-bold text-ink tracking-tight leading-tight mb-0.5 truncate">
                {name}
              </h3>
              {rating != null && (
                <div className="flex items-center gap-1">
                  <Star size={12} className="fill-accent text-accent" />
                  <span className="text-xs font-bold text-ink-soft">{rating.toFixed(1)}</span>
                  <span className="text-xs font-medium text-ink-muted">(100+)</span>
                </div>
              )}
            </div>
          </div>

          {/* Chips de categoría */}
          {chips.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-2.5">
              {chips.map(chip => (
                <span
                  key={chip}
                  className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                  style={{ background: theme.chipBg, color: theme.chipText }}
                >
                  {chip}
                </span>
              ))}
            </div>
          )}

          {/* Info de entrega */}
          <div className="flex items-center gap-2 flex-wrap border-t border-line pt-2.5">
            {delivery_time != null && (
              <span className="flex items-center gap-1 text-xs font-semibold text-ink-soft">
                <Clock size={13} className="text-ink-muted" />
                {delivery_time}–{delivery_time + 10} min
              </span>
            )}
            {delivery_time != null && delivery_price != null && (
              <span className="w-[3px] h-[3px] rounded-full bg-line shrink-0" />
            )}
            {delivery_price != null && (
              <span className="flex items-center gap-1 text-xs font-semibold text-ink-soft">
                <Bike size={13} className="text-ink-muted" />
                {delivery_price === 0 ? 'Envío gratis' : `Envío $${delivery_price.toLocaleString('es-AR')}`}
              </span>
            )}
            {min_order != null && (
              <>
                <span className="w-[3px] h-[3px] rounded-full bg-line shrink-0" />
                <span className="text-xs font-semibold text-ink-muted">
                  Mín. ${min_order.toLocaleString('es-AR')}
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function RestaurantSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-card">
      <div className="h-40 skeleton" />
      <div className="px-3.5 pt-3 pb-3.5">
        <div className="flex gap-2.5 mb-2.5">
          <div className="w-11 h-11 rounded-xl shrink-0 skeleton" />
          <div className="flex-1">
            <div className="h-[15px] w-3/5 rounded-md mb-1.5 skeleton" />
            <div className="h-3 w-1/3 rounded-md skeleton" />
          </div>
        </div>
        <div className="flex gap-1.5 mb-2.5">
          <div className="h-[22px] w-16 rounded-md skeleton" />
          <div className="h-[22px] w-14 rounded-md skeleton" />
        </div>
        <div className="h-px bg-line mb-2.5" />
        <div className="flex gap-2.5">
          <div className="h-3.5 w-[72px] rounded-md skeleton" />
          <div className="h-3.5 w-[90px] rounded-md skeleton" />
        </div>
      </div>
    </div>
  );
}
