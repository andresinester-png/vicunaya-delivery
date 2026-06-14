import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, X, ChevronRight, CalendarClock, LayoutGrid } from 'lucide-react';
import { supabase } from '../lib/supabase.js';

export const CATEGORY_INFO = {
  peluqueria:  { label: 'Peluquería',  emoji: '💇', bg: '#EFF6FF', color: '#2563EB' },
  barberia:    { label: 'Barbería',    emoji: '💈', bg: '#EFF6FF', color: '#2563EB' },
  estetica:    { label: 'Estética',    emoji: '💆', bg: '#FEF2F2', color: '#DC2626' },
  unas:        { label: 'Uñas',        emoji: '💅', bg: '#FFF1F2', color: '#E11D48' },
  spa:         { label: 'Spa',         emoji: '🧖', bg: '#ECFDF5', color: '#059669' },
  taller:      { label: 'Taller',      emoji: '🔧', bg: '#FFF7ED', color: '#EA580C' },
  medico:      { label: 'Médico',      emoji: '🩺', bg: '#EFF6FF', color: '#0284C7' },
  veterinaria: { label: 'Veterinaria', emoji: '🐾', bg: '#F0FDF4', color: '#16A34A' },
  gimnasio:    { label: 'Gimnasio',    emoji: '🏋️', bg: '#FEF2F2', color: '#DC2626' },
  lavadero:    { label: 'Lavadero',    emoji: '🚗', bg: '#ECFEFF', color: '#0891B2' },
  otro:        { label: 'Otro',        emoji: '📅', bg: '#F3F4F6', color: '#6B7280' },
};

// Imágenes ilustrativas por categoría, usadas cuando el negocio no tiene logo propio
const CATEGORY_IMAGES = {
  estetica:    'https://lh3.googleusercontent.com/aida-public/AB6AXuD-2oFKbZfi8sQeugHeMpeJQ2UY5YuCAmsm4J5Z-YgSqGIC5VE8XpnpgJ9SAmTmxbw2Lj_kY5BReP2eq-6YkzYT3vrDlaG9KObf83HwSLVX-RwXcRaXPE7clbW6ssUkoMZ1a2T_s_bNmUfmysRPcg3IyIGJihids9is1NEYUnmeo2ErYcLcWfQMKkHTj3_1bvJL-6BdMuaXdEgIuyMlJN0B6u9FqKFQCksyBOUfvA7aMtmvgsGyX2XwLdCcH7rtPxA-nz4lS2e6li8Y',
  peluqueria:  'https://lh3.googleusercontent.com/aida-public/AB6AXuDYc9235Mm-emjynmdFLtVYZckEaaz0ShkTHMar5AoKFtCtcOBmPfXBo-Z1rT157tpFhdJf824gna8udnl0x6YVeHh3ZYG4n9tn_N37ns4Ce-3232PLIYeAkiTrsoJHWKzTysjF5Ep1UVXqUU9jZn0atyYP_u_oeN_WynE7FkZlfFJb1gWQVrklTbXcvEZsoLf24kwUZnuvARegRWXgKW4G4VoB9ff9fiHuHYWPY2CuYvz5qJaz1MDbbVuE7xx7RM2_JVXULzLTyFNC',
  taller:      'https://lh3.googleusercontent.com/aida-public/AB6AXuCLsyQ61mpIZf_m9gN_pISjjp7CMzdAA5NUN7hUEmV2QIhm7BGSm2N9Dpec-kLrQ9RZa_1CbeYVk_E9lSqiPrLFZqZ4tcyzMTXDNX5QIxxrGJPBVeaG13n8DHcJMXsOznVoZYTxgtr1e2pUnGY9T3yeQu2M_xCRbMREQrHmkLUNpKt52H__Xb79lH_UlkGXs_0LI4GQ386vxNAv5n7ltEtrl592kXqNkMEMdSm32sNx-F_c5vce9YI_oY0wnY7eZhPaeteUyizccbSX',
  veterinaria: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfB0rQnaQ6ksKuY9xp2RM2kyCqBsCpP527UXrABVQlw-tqTeEozcI3-qV5I09CXU-I3R8x9DB9pxzRX3FriBnF3osYyegGOxeOPgm8hjI_CwGJ6nC94VOAQ85ovSO_Ei4UTOJEuxlw5NO1L3nxe56O_jYgCnwII0JAxKVbnyqU7aTgm3CpY6EteKvsOhufQ3Eoqg0jNXL4NkyuwhLkIQx5JkG2NU4_D4HbPaECJeJDQWcQdp5TlE4Fe95Tz4f43AdsxFlTrFkpbzQc',
};

const FILTER_CATEGORIES = [
  { key: 'peluqueria',  label: 'Peluquería',  image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAChaQiSJx9SEpQjHijDqPGb5uE0N7cujVqe05_MnoTTlhosk5RJ2hpWC2d-1j-SskWkfDiG8TYneyAzk3WB30HLFLSeZDeBn9EIJVc0SdwTn0J_HLYeDi-QvqRpN4i_dUBoyzDoKNZKpiZpOu1oKPSMpDfiINLA55QG5HPrmByE-gyEaWiMJr_vcmc9aeQLxyZbnVd0pH4yfX7akV5z49e6QolEQgvEdSu8YNahn6r1BoQc7-R5d2zRvTdPc4w8FoF48aV3_Unn-Ju' },
  { key: 'estetica',    label: 'Estética',    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzBiQzG-tsIOcFhFtW86cvr7ZnQDfxxUeqQGTPwiqfM9NRl5m4f06aDVF3bHE3smyBhsoSvFjodqw3GflmjfXD3zz4hPiNlK0B0lqdp_Mc1POD8a9UoP-VMWyjZNTfAWsDb31Pic_1mimOIVajP2ihRskzaZL0eOmNgbTUcBS50s3b6BM5TafJcmqeya9s0Sbd1o3Vbn68KB5EsQz3UG_VHh6NGPhAVf7ez2I0ETt5mWq6AKETiT4CCjJxfQgVEsHH1wikqqHtOQ55' },
  { key: 'taller',      label: 'Taller',      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkBTTRf3JJ_NzlcVOFimhv6UEyiVNOudUQHvL_aPBSjokTix2KcU2eD0Hp-KUi9jzPjMN37cC-RvYy2NiAgMNMUWICyk4Pn2uE-wVKXA-48dxZiBI3lku43CaVnuHtTLbJl4y7k9p2TrHbXmd4-aKkWjGPHyYp2ukPaWBQSzCEQG_6aT50qCKySsMjlHMx-tDbVrpGIH-m0hFw1CSXK6XCC4dw1PkcmGS70QkfbPI0GptFOn4GcRe9hHgwxwfoEX-UCLoBPVdjdGen' },
  { key: 'veterinaria', label: 'Veterinaria', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNnQXnMS5qNh5sweOtB-nignu_OJ3LXwtDoCNh3EZ54j8LUz6EDN4vefOh8cHJX3uDcTcaLO6NKh-1SKWab9OsicWaA0q92RKEQKyPWv0JAqhpHKfYngGOob36jfDiYv2gYQS4Z5RSc6XVGuIPZZSXHKz6V_nG5w9Q1GqpfCgcPfFbsfONhZCczYfTQv7hXIdsqN_EIB13KRkqCv6LHKNmK10MSdqpavXZd7vrZb-oxMUUQgW37Tg_H9-DIBNT9dh65kUXVpQIRxqg' },
  { key: 'lavadero',    label: 'Lavadero',    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDnFbVj4HzqC3a6_hA3kS2qTxryGqMUEZgc6rC0ZCtKkf_5YuPuW8OChrxDaqQ7oUoBpSvxZv0itU1ow4ly1_RfPdDGqSF0j7Esrvdja4uxIrWgqxFMJIaOeEQrTwqT95UiY5TislXIYbfbXGzol0XTphrQ1_haCFcEK6DwhEypM9PrsbMB7qNtBWlz6t8qqZpb9jFeFb5AIl0bNQNb5CLVRsQk-Hwgp1ctEWKqdvfxT-IUYVWUThae7BAcxcCv9d0G0FjxTuEORovd' },
  { key: 'Todos',       label: 'Todos' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
};

export default function Turnos() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState('Todos');

  useEffect(() => {
    supabase.from('appointment_businesses').select('*').eq('is_active', true).order('name')
      .then(({ data, error }) => {
        if (!error && data) setBusinesses(data);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    let list = businesses;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.name.toLowerCase().includes(q) ||
        (b.description || '').toLowerCase().includes(q) ||
        (CATEGORY_INFO[b.category]?.label || b.category || '').toLowerCase().includes(q)
      );
    }

    if (catFilter !== 'Todos') list = list.filter(b => b.category === catFilter);

    return list;
  }, [businesses, search, catFilter]);

  return (
    <div style={{ background: '#F9FAFB', minHeight: '100%' }}>

      {/* Header rojo con título y buscador */}
      <div
        style={{ background: 'linear-gradient(180deg, #e31b23 0%, #c0121a 100%)' }}
        className="px-4 pt-4 pb-5"
      >
        <h1 className="text-white font-extrabold text-2xl tracking-tight mb-3">Turnos</h1>
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Peluquerías, talleres, turnos..."
            className="w-full bg-white rounded-xl text-sm border-none outline-none"
            style={{ padding: '11px 16px 11px 38px', boxSizing: 'border-box' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-4">

        {/* Grid de categorías */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {FILTER_CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setCatFilter(cat.key)}
              className="bg-white shadow-sm border border-slate-50 rounded-xl overflow-hidden flex flex-col active:scale-95 transition-transform duration-150"
            >
              <div className="aspect-square w-full p-2">
                {cat.image ? (
                  <img src={cat.image} alt={cat.label} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-primary-bg flex items-center justify-center">
                    <LayoutGrid size={26} className="text-primary" strokeWidth={2} />
                  </div>
                )}
              </div>
              <span className="text-[11px] font-semibold text-center text-slate-600 py-1.5 truncate px-1">
                {cat.label}
              </span>
            </button>
          ))}
        </div>

        {/* Chips de filtro */}
        <div
          className="sticky top-0 z-10 -mx-4 px-4 py-2 mb-4 flex gap-2 overflow-x-auto bg-[#F9FAFB]/80 backdrop-blur-sm"
          style={{ scrollbarWidth: 'none' }}
        >
          {FILTER_CATEGORIES.map(cat => {
            const active = catFilter === cat.key;
            return (
              <motion.button
                key={cat.key}
                whileTap={{ scale: 0.94 }}
                onClick={() => setCatFilter(cat.key)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                  active
                    ? 'bg-[#e31b23] text-white shadow-[0_4px_12px_rgba(227,27,35,0.35)]'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {cat.label}
              </motion.button>
            );
          })}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl animate-pulse bg-gray-200" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CalendarClock size={48} strokeWidth={1} />
            <p className="mt-3 text-gray-500 font-medium">Sin resultados</p>
            {(search || catFilter !== 'Todos') && (
              <button
                onClick={() => { setSearch(''); setCatFilter('Todos'); }}
                className="mt-2 text-primary font-bold text-sm"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            className="space-y-3"
          >
            {filtered.map(b => {
              const info = CATEGORY_INFO[b.category] || CATEGORY_INFO.otro;
              const image = b.logo_url || CATEGORY_IMAGES[b.category];
              return (
                <motion.div key={b.id} variants={cardVariants}>
                  <Link
                    to={`/turnos/${b.id}`}
                    className="group flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-50 transition-shadow"
                    style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                  >
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl shrink-0 overflow-hidden"
                      style={{ background: info.bg }}
                    >
                      {image ? (
                        <img src={image} alt={b.name} className="w-full h-full object-cover" />
                      ) : info.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{b.name}</p>
                      {b.description && <p className="text-xs text-gray-400 truncate mt-0.5">{b.description}</p>}
                      <span className="inline-block text-xs mt-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        {info.label}
                      </span>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 shrink-0 transition-colors group-hover:text-primary" />
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
