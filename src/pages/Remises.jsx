import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { Car, Star, Shield, Search } from 'lucide-react';
import { supabase, MAP_CENTER } from '../lib/supabase.js';

const driverIcon = new L.DivIcon({
  className: '',
  html: `<div style="background:#e31b23;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 4px 14px rgba(227,27,35,0.4);font-size:20px">🚗</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const FEATURES = [
  { icon: Car,    label: 'Tiempo real' },
  { icon: Star,   label: 'Calificaciones' },
  { icon: Shield, label: 'Verificados' },
];

export default function RemisesPage() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('drivers').select('*').eq('is_active', true);
      setDrivers(data || []);
    };
    fetch();
    const ch = supabase.channel('remises-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, fetch)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px - 64px)' }}>
      {/* Mapa */}
      <div className="flex-1 relative">
        <MapContainer center={MAP_CENTER} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {drivers.filter(d => d.lat && d.lng).map(d => (
            <Marker key={d.id} position={[d.lat, d.lng]} icon={driverIcon}>
              <Popup>
                <p className="font-bold text-sm">{d.name}</p>
                <p className="text-xs text-gray-500">{d.vehicle}</p>
                <p className="text-xs text-amber-500 font-bold">★ {d.rating?.toFixed(1)}</p>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Badge flotante */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white rounded-full px-4 py-1.5 flex items-center gap-2 text-sm font-bold"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
        >
          <span className={`w-2 h-2 rounded-full ${drivers.length > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
          {drivers.length > 0
            ? `${drivers.length} conductor${drivers.length !== 1 ? 'es' : ''} disponible${drivers.length !== 1 ? 's' : ''}`
            : 'Sin conductores cerca'}
        </motion.div>
      </div>

      {/* Panel inferior */}
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 250, damping: 28 }}
        className="bg-white px-4 pt-4 pb-2"
        style={{ boxShadow: '0 -8px 30px rgba(0,0,0,0.1)' }}
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/remis/pedir')}
          className="w-full flex items-center gap-3 border-2 border-neutral-100 rounded-2xl px-4 py-3.5 mb-4 bg-gray-50 hover:border-primary/30 transition-colors"
        >
          <Search size={16} className="text-gray-400 shrink-0" />
          <span className="text-gray-400 text-sm font-medium">¿A dónde vas?</span>
        </motion.button>

        <div className="flex justify-around pb-1">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 bg-primary-bg rounded-xl flex items-center justify-center">
                <Icon className="text-primary" size={18} />
              </div>
              <span className="text-[11px] text-gray-500 font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
