import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Star, Shield, Clock, ChevronRight, Navigation } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '../lib/supabase.js';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const MAP_CENTER = [-64.3894, -33.8837]; // Vicuña Mackenna lng, lat

const QUICK_DESTINATIONS = [
  { icon: '🏥', label: 'Hospital', address: 'Hospital Regional' },
  { icon: '🚉', label: 'Terminal', address: 'Terminal de Ómnibus' },
  { icon: '🏫', label: 'Escuela', address: 'Escuelas' },
];

export default function RemisesPage() {
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const [drivers, setDrivers] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  // Init Mapbox
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: MAP_CENTER,
      zoom: 14,
      pitch: 45,
      bearing: -10,
      antialias: true,
    });

    map.current.on('load', () => {
      setMapLoaded(true);

      // Agregar capa 3D de edificios
      map.current.addLayer({
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 13,
        paint: {
          'fill-extrusion-color': '#1a1a2e',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.8,
        },
      });
    });

    // Remover controles default
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Cargar drivers y markers
  useEffect(() => {
    const fetchDrivers = async () => {
      const { data } = await supabase.from('drivers').select('*').eq('is_active', true);
      setDrivers(data || []);
    };
    fetchDrivers();

    const ch = supabase.channel('remises-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, fetchDrivers)
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, []);

  // Actualizar markers cuando cambian drivers o el mapa carga
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    // Limpiar markers anteriores
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    drivers.filter(d => d.lat && d.lng).forEach(driver => {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          position: relative;
          width: 44px;
          height: 44px;
        ">
          <div style="
            position: absolute;
            inset: 0;
            background: rgba(227,27,35,0.2);
            border-radius: 50%;
            animation: pulse 2s infinite;
          "></div>
          <div style="
            position: absolute;
            inset: 4px;
            background: #e31b23;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid rgba(255,255,255,0.9);
            box-shadow: 0 4px 20px rgba(227,27,35,0.5);
            font-size: 18px;
          ">🚗</div>
        </div>
      `;
      el.style.cssText = 'cursor: pointer; width: 44px; height: 44px;';

      const popup = new mapboxgl.Popup({ offset: 25, className: 'remis-popup' })
        .setHTML(`
          <div style="padding: 8px; min-width: 140px;">
            <p style="font-weight: 700; font-size: 14px; margin: 0 0 2px 0; color: #111;">${driver.name || 'Conductor'}</p>
            <p style="font-size: 12px; color: #666; margin: 0 0 4px 0;">${driver.vehicle || 'Vehículo'}</p>
            <p style="font-size: 13px; color: #f59e0b; font-weight: 700; margin: 0;">★ ${driver.rating?.toFixed(1) || '5.0'}</p>
          </div>
        `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([driver.lng, driver.lat])
        .setPopup(popup)
        .addTo(map.current);

      markersRef.current.push(marker);
    });
  }, [drivers, mapLoaded]);

  const centerOnUser = () => {
    navigator.geolocation.getCurrentPosition(pos => {
      map.current?.flyTo({
        center: [pos.coords.longitude, pos.coords.latitude],
        zoom: 15,
        pitch: 45,
        duration: 1500,
        essential: true,
      });
    });
  };

  return (
    <div className="relative flex flex-col" style={{ height: 'calc(100vh - 56px - 64px)', overflow: 'hidden' }}>

      {/* CSS para animación pulse */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.8); opacity: 0; }
        }
        .mapboxgl-ctrl-attrib { display: none !important; }
        .mapboxgl-ctrl-logo { display: none !important; }
        .remis-popup .mapboxgl-popup-content {
          border-radius: 12px !important;
          padding: 0 !important;
          box-shadow: 0 8px 30px rgba(0,0,0,0.15) !important;
        }
        .mapboxgl-ctrl-group {
          border-radius: 12px !important;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
        }
      `}</style>

      {/* Mapa */}
      <div ref={mapContainer} style={{ position: 'absolute', inset: 0 }} />

      {/* Badge conductores disponibles */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
        style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(12px)',
          borderRadius: 999,
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: drivers.length > 0 ? '#22c55e' : '#9ca3af',
          boxShadow: drivers.length > 0 ? '0 0 8px #22c55e' : 'none',
          animation: drivers.length > 0 ? 'pulse 2s infinite' : 'none',
          flexShrink: 0,
        }} />
        <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>
          {drivers.length > 0
            ? `${drivers.length} conductor${drivers.length !== 1 ? 'es' : ''} disponible${drivers.length !== 1 ? 's' : ''}`
            : 'Sin conductores cerca'}
        </span>
      </motion.div>

      {/* Botón centrar ubicación */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        onClick={centerOnUser}
        style={{
          position: 'absolute',
          bottom: sheetExpanded ? 260 : 170,
          right: 16,
          zIndex: 10,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'white',
          border: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'bottom 0.3s ease',
        }}
      >
        <Navigation size={18} color="#e31b23" />
      </motion.button>

      {/* Bottom Sheet */}
      <motion.div
        initial={{ y: 120 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          background: 'white',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e5e7eb' }} />
        </div>

        <div style={{ padding: '8px 16px 20px' }}>

          {/* Search bar */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/remis/pedir')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: '#f9fafb',
              border: '1.5px solid #f3f4f6',
              borderRadius: 16,
              padding: '14px 16px',
              marginBottom: 16,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#e31b23',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Search size={16} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111' }}>¿A dónde vas?</p>
              <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>Ingresá tu destino</p>
            </div>
            <ChevronRight size={18} color="#d1d5db" />
          </motion.button>

          {/* Destinos rápidos */}
          <div style={{ display: 'flex', gap: 8 }}>
            {QUICK_DESTINATIONS.map(dest => (
              <motion.button
                key={dest.label}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/remis/pedir')}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  background: '#f9fafb',
                  border: '1.5px solid #f3f4f6',
                  borderRadius: 14,
                  padding: '12px 8px',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 22 }}>{dest.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{dest.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Features */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid #f3f4f6',
          }}>
            {[
              { icon: Clock, label: 'Tiempo real', color: '#3b82f6' },
              { icon: Star, label: 'Calificados', color: '#f59e0b' },
              { icon: Shield, label: 'Verificados', color: '#22c55e' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: `${color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} color={color} />
                </div>
                <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>

        </div>
      </motion.div>
    </div>
  );
}
