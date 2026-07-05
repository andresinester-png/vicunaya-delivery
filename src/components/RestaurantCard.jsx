import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Star, Bike } from 'lucide-react';
import { isRestaurantOpen } from '../lib/restaurantUtils.js';

const CAT_GRADIENT = {
  'Rotisería': ['#FF8C00','#FF4500'],
  'Parrilla':  ['#DC2626','#7F1D1D'],
  'Pizza':     ['#D97706','#92400E'],
  'Empanadas': ['#16A34A','#14532D'],
  'Sushi':     ['#4F46E5','#2E1065'],
  'Vegano':    ['#15803D','#052E16'],
  'Bebidas':   ['#0284C7','#0C4A6E'],
  default:     ['#D32F2F','#7F0028'],
};

const CAT_LOGO_BG = {
  'Rotisería': '#FF8C00', 'Parrilla': '#DC2626', 'Pizza': '#D97706',
  'Empanadas': '#16A34A', 'Sushi':    '#4F46E5', 'Vegano': '#15803D',
  'Bebidas':   '#0284C7', default:    '#D32F2F',
};

const CAT_CHIP = {
  'Rotisería': { bg:'#FFF7ED', color:'#EA580C' },
  'Parrilla':  { bg:'#FEF2F2', color:'#DC2626' },
  'Pizza':     { bg:'#FFFBEB', color:'#D97706' },
  'Empanadas': { bg:'#F0FDF4', color:'#16A34A' },
  'Sushi':     { bg:'#EEF2FF', color:'#4F46E5' },
  'Vegano':    { bg:'#F0FDF4', color:'#15803D' },
  'Bebidas':   { bg:'#EFF6FF', color:'#2563EB' },
  default:     { bg:'#FFF8F8', color:'#D32F2F' },
};

export default function RestaurantCard({ restaurant }) {
  const {
    id, name, image_url, logo_url, category, cover_position,
    rating, delivery_time, delivery_price, min_order, tags,
  } = restaurant;

  const isOpen        = isRestaurantOpen(restaurant);
  const categories    = Array.isArray(category) ? category : (category ? [category] : []);
  const primaryCat    = categories[0];
  const grad      = CAT_GRADIENT[primaryCat] ?? CAT_GRADIENT.default;
  const logoBg    = CAT_LOGO_BG[primaryCat]  ?? CAT_LOGO_BG.default;
  const chipStyle = CAT_CHIP[primaryCat]     ?? CAT_CHIP.default;

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
        style={{
          display:'block', background:'#fff',
          borderRadius:20, overflow:'hidden',
          boxShadow:'0 4px 14px rgba(0,0,0,0.06)',
          textDecoration:'none',
        }}
      >
        {/* ── Foto de portada ── */}
        <div style={{ position:'relative', height:160, overflow:'hidden', background:'#f3f4f6' }}>
          {image_url ? (
            <img src={image_url} alt={name}
              style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition: cover_position || '50% 50%' }} />
          ) : (
            <div style={{
              width:'100%', height:'100%',
              background:`linear-gradient(145deg, ${grad[0]} 0%, ${grad[1]} 100%)`,
              display:'flex', alignItems:'center', justifyContent:'center',
              position:'relative', overflow:'hidden',
            }}>
              <div style={{ position:'absolute', right:-30, top:-30, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.10)' }} />
              <div style={{ position:'absolute', left:-20, bottom:-40, width:110, height:110, borderRadius:'50%', background:'rgba(0,0,0,0.10)' }} />
              <span style={{ fontSize:60, position:'relative', zIndex:1, color:'rgba(255,255,255,0.35)', fontWeight:900, letterSpacing:'-0.04em' }}>
                {name.charAt(0)}
              </span>
            </div>
          )}

          {/* Gradiente bottom sutil */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.22) 0%, transparent 55%)' }} />

          {/* Badge Abierto/Cerrado */}
          <div style={{ position:'absolute', top:10, left:10 }}>
            <span style={{
              display:'inline-flex', alignItems:'center', gap:5,
              background: isOpen ? 'rgba(46,125,50,0.90)' : 'rgba(0,0,0,0.58)',
              color:'#fff', fontSize:11, fontWeight:800,
              padding:'4px 10px', borderRadius:999,
              backdropFilter:'blur(4px)',
            }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#fff', flexShrink:0 }} />
              {isOpen ? 'Abierto' : 'Cerrado'}
            </span>
          </div>
        </div>

        {/* ── Cuerpo ── */}
        <div style={{ padding:'12px 14px 14px' }}>

          {/* Logo + nombre + rating */}
          <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:8 }}>
            {/* Logo (avatar con inicial si no hay imagen) */}
            <div style={{
              width:44, height:44, borderRadius:12, flexShrink:0,
              background: logo_url ? '#f9fafb' : logoBg,
              display:'flex', alignItems:'center', justifyContent:'center',
              overflow:'hidden',
              border:'2px solid #f3f4f6',
              boxShadow:'0 2px 8px rgba(0,0,0,0.10)',
            }}>
              {logo_url ? (
                <img src={logo_url} alt={name}
                  style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              ) : (
                <span style={{ color:'#fff', fontWeight:900, fontSize:18 }}>
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div style={{ flex:1, minWidth:0 }}>
              <h3 style={{
                fontSize:15, fontWeight:800, color:'#111',
                letterSpacing:'-0.02em', lineHeight:1.25,
                marginBottom:3,
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              }}>
                {name}
              </h3>
              {rating != null && (
                <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                  <Star size={12} fill="#F59E0B" color="#F59E0B" />
                  <span style={{ fontSize:12, fontWeight:700, color:'#374151' }}>
                    {rating.toFixed(1)}
                  </span>
                  <span style={{ fontSize:12, color:'#9CA3AF', fontWeight:500 }}>(100+)</span>
                </div>
              )}
            </div>
          </div>

          {/* Chips de categoría */}
          {chips.length > 0 && (
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
              {chips.map(chip => (
                <span key={chip} style={{
                  background: chipStyle.bg, color: chipStyle.color,
                  fontSize:11, fontWeight:700,
                  padding:'3px 8px', borderRadius:6,
                }}>
                  {chip}
                </span>
              ))}
            </div>
          )}

          {/* Info de entrega */}
          <div style={{
            display:'flex', alignItems:'center', gap:8, flexWrap:'wrap',
            borderTop:'1px solid #f3f4f6', paddingTop:10,
          }}>
            {delivery_time != null && (
              <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#6B7280', fontWeight:600 }}>
                <Clock size={13} color="#9CA3AF" />
                {delivery_time}–{delivery_time + 10} min
              </span>
            )}
            {delivery_time != null && delivery_price != null && (
              <span style={{ width:3, height:3, borderRadius:'50%', background:'#D1D5DB', flexShrink:0 }} />
            )}
            {delivery_price != null && (
              <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#6B7280', fontWeight:600 }}>
                <Bike size={13} color="#9CA3AF" />
                {delivery_price === 0 ? 'Envío gratis' : `Envío $${delivery_price.toLocaleString('es-AR')}`}
              </span>
            )}
            {min_order != null && (
              <>
                <span style={{ width:3, height:3, borderRadius:'50%', background:'#D1D5DB', flexShrink:0 }} />
                <span style={{ fontSize:12, color:'#9CA3AF', fontWeight:600 }}>
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
    <div style={{ background:'#fff', borderRadius:20, overflow:'hidden', boxShadow:'0 4px 14px rgba(0,0,0,0.06)' }}>
      <div style={{ height:160 }} className="skeleton" />
      <div style={{ padding:'12px 14px 14px' }}>
        <div style={{ display:'flex', gap:10, marginBottom:10 }}>
          <div style={{ width:44, height:44, borderRadius:12, flexShrink:0 }} className="skeleton" />
          <div style={{ flex:1 }}>
            <div style={{ height:15, width:'60%', borderRadius:6, marginBottom:6 }} className="skeleton" />
            <div style={{ height:12, width:'35%', borderRadius:6 }} className="skeleton" />
          </div>
        </div>
        <div style={{ display:'flex', gap:6, marginBottom:10 }}>
          <div style={{ height:22, width:64, borderRadius:6 }} className="skeleton" />
          <div style={{ height:22, width:56, borderRadius:6 }} className="skeleton" />
        </div>
        <div style={{ height:1, background:'#f3f4f6', marginBottom:10 }} />
        <div style={{ display:'flex', gap:10 }}>
          <div style={{ height:14, width:72, borderRadius:6 }} className="skeleton" />
          <div style={{ height:14, width:90, borderRadius:6 }} className="skeleton" />
        </div>
      </div>
    </div>
  );
}
