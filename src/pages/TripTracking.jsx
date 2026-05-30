import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Phone, ChevronLeft, MapPin, Navigation, Star, Clock, Car, CheckCircle, X } from 'lucide-react';
import { supabase, MAP_CENTER } from '../lib/supabase.js';

const driverIcon = new L.DivIcon({
  className: '',
  html: `<div style="background:#e31b23;width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 12px rgba(227,27,35,0.4);font-size:21px">🚗</div>`,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

const STATUS_INFO = {
  searching:   { label: 'Buscando conductor...', icon: Clock,        color: 'text-amber-500' },
  accepted:    { label: 'Conductor en camino',   icon: Car,          color: 'text-blue-500'  },
  arriving:    { label: 'Llegando a buscarte',   icon: Car,          color: 'text-blue-500'  },
  in_progress: { label: 'En viaje',              icon: Navigation,   color: 'text-primary'   },
  completed:   { label: '¡Llegaste!',            icon: CheckCircle,  color: 'text-green-500' },
  cancelled:   { label: 'Cancelado',             icon: X,            color: 'text-red-500'   },
};

export default function TripTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('trips').select('*, drivers(*)').eq('id', id).single();
      setTrip(data);
      if (data?.drivers) setDriver(data.drivers);
      setLoading(false);
    };
    fetch();

    const ch1 = supabase.channel(`trip-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trips', filter: `id=eq.${id}` },
        ({ new: u }) => {
          setTrip(p => ({ ...p, ...u }));
          if (u.status === 'completed') navigate(`/remis/viaje/${id}/calificar`);
        })
      .subscribe();

    const ch2 = supabase.channel(`trip-driver-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'drivers' },
        ({ new: d }) => setDriver(prev => prev?.id === d.id ? d : prev))
      .subscribe();

    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const si = STATUS_INFO[trip?.status] || STATUS_INFO.searching;
  const StatusIcon = si.icon;
  const driverPos = driver?.lat && driver?.lng ? [driver.lat, driver.lng] : MAP_CENTER;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Mapa */}
      <div className="relative" style={{ height: '45vh' }}>
        <MapContainer center={driverPos} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {driver?.lat && driver?.lng && (
            <Marker position={[driver.lat, driver.lng]} icon={driverIcon}>
              <Popup>{driver.name}</Popup>
            </Marker>
          )}
        </MapContainer>

        <button onClick={() => navigate('/remises')}
          className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-card hover:bg-white transition-colors">
          <ChevronLeft size={20} />
        </button>

        {/* Status badge */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white rounded-2xl shadow-lg px-5 py-2.5 flex items-center gap-2.5">
          <StatusIcon className={si.color} size={18} />
          <p className={`font-bold text-sm ${si.color}`}>{si.label}</p>
        </div>
      </div>

      {/* Panel */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-4 px-5 pt-6 pb-6 overflow-y-auto">
        {/* Conductor */}
        {driver ? (
          <div className="flex items-center gap-4 mb-5 pb-5 border-b border-neutral-100">
            <div className="w-14 h-14 bg-primary-bg rounded-2xl flex items-center justify-center text-2xl overflow-hidden shrink-0">
              {driver.photo_url ? <img src={driver.photo_url} alt={driver.name} className="w-full h-full object-cover" /> : '👤'}
            </div>
            <div className="flex-1">
              <p className="font-bold">{driver.name}</p>
              <p className="text-sm text-gray-500">{driver.vehicle} · {driver.license_plate}</p>
              <div className="flex items-center gap-1 text-amber-500 text-sm">
                <Star size={13} fill="currentColor" />
                <span className="font-semibold">{driver.rating?.toFixed(1)}</span>
              </div>
            </div>
            {driver.phone && (
              <a href={`tel:${driver.phone}`} className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                <Phone size={20} />
              </a>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4 mb-5 pb-5 border-b border-neutral-100 animate-pulse">
            <div className="w-14 h-14 bg-gray-200 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
        )}

        {/* Recorrido */}
        <div className="space-y-3 mb-5">
          <div className="flex gap-3 items-center">
            <div className="w-2.5 h-2.5 bg-primary rounded-full shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Origen</p>
              <p className="font-medium text-sm">{trip?.origin_address}</p>
            </div>
          </div>
          <div className="w-px h-4 bg-gray-200 ml-1" />
          <div className="flex gap-3 items-center">
            <MapPin size={14} className="text-gray-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Destino</p>
              <p className="font-medium text-sm">{trip?.dest_address}</p>
            </div>
          </div>
        </div>

        {trip?.estimated_price && (
          <div className="flex justify-between items-center pt-4 border-t border-neutral-100">
            <span className="text-sm text-gray-500">Precio estimado</span>
            <span className="font-extrabold text-xl text-primary">${trip.estimated_price.toLocaleString('es-AR')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
