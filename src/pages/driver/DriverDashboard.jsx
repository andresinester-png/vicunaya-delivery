import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { Power, CheckCircle, XCircle, Navigation, Star, LogOut, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { supabase, MAP_CENTER } from '../../lib/supabase.js';

const myIcon = new L.DivIcon({
  className: '',
  html: `<div style="background:#e31b23;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:4px solid white;box-shadow:0 2px 14px rgba(227,27,35,0.45);font-size:22px">🚗</div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const PAYMENT_LABELS = { card: 'Tarjeta', transfer: 'Transferencia', cash: 'Efectivo' };

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [pendingTrips, setPendingTrips] = useState([]);
  const [myPos, setMyPos] = useState(MAP_CENTER);
  const watchRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('drivers').select('*').eq('id', user.id).single();
      if (data) { setDriver(data); setIsActive(data.is_active); }
    };
    init();
    fetchPending();

    const ch = supabase.channel('driver-pending')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trips' }, () => {
        fetchPending();
        toast('🔔 Nuevo pedido de viaje', { duration: 6000 });
      })
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, []);

  const fetchPending = async () => {
    const { data } = await supabase.from('trips').select('*').eq('status', 'searching').order('created_at', { ascending: false });
    setPendingTrips(data || []);
  };

  const toggleActive = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const next = !isActive;
    setIsActive(next);
    if (next) {
      watchRef.current = navigator.geolocation.watchPosition(
        ({ coords }) => {
          setMyPos([coords.latitude, coords.longitude]);
          supabase.from('drivers').update({ is_active: true, lat: coords.latitude, lng: coords.longitude, updated_at: new Date().toISOString() }).eq('id', user.id);
        },
        () => toast.error('No se pudo obtener tu ubicación'),
        { enableHighAccuracy: true, maximumAge: 3000 }
      );
      toast.success('¡Estás activo!');
    } else {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
      await supabase.from('drivers').update({ is_active: false }).eq('id', user.id);
      toast('Estás offline', { icon: '😴' });
    }
  };

  const acceptTrip = async (tripId) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('trips').update({ driver_id: user.id, status: 'accepted' }).eq('id', tripId).eq('status', 'searching');
    if (error) toast.error('Este viaje ya fue tomado');
    else { toast.success('¡Viaje aceptado!'); fetchPending(); }
  };

  const handleLogout = async () => {
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from('drivers').update({ is_active: false }).eq('id', user.id);
    await supabase.auth.signOut();
    navigate('/driver/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <nav className="bg-white shadow-nav z-40 shrink-0">
        <div className="h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-primary font-extrabold text-xl">Vicuña</span>
            <span className="bg-primary text-white font-extrabold text-xl px-1 rounded-md">Ya</span>
            <span className="text-xs text-gray-400 hidden sm:block">· Conductor</span>
          </div>
          <div className="flex items-center gap-3">
            {driver && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold hidden sm:block">{driver.name}</span>
                <div className="flex items-center gap-0.5 text-amber-500 text-xs">
                  <Star size={11} fill="currentColor" />
                  <span className="font-bold">{driver.rating?.toFixed(1)}</span>
                </div>
              </div>
            )}
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mapa */}
      <div style={{ height: '32vh' }} className="shrink-0">
        <MapContainer center={myPos} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={myPos} icon={myIcon} />
        </MapContainer>
      </div>

      {/* Panel */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Toggle */}
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="font-bold">{isActive ? '🟢 Estás activo' : '⚫ Estás offline'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{isActive ? 'Los pasajeros te pueden ver en el mapa' : 'Activáte para recibir viajes'}</p>
          </div>
          <button onClick={toggleActive}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${isActive ? 'bg-red-50 text-red-600 border-2 border-red-200' : 'btn-primary'}`}>
            <Power size={15} /> {isActive ? 'Offline' : 'Activarme'}
          </button>
        </div>

        {/* Viajes */}
        <div>
          <h2 className="font-bold text-base mb-3">
            Viajes disponibles
            {pendingTrips.length > 0 && (
              <span className="ml-2 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingTrips.length}</span>
            )}
          </h2>
          {pendingTrips.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">
              <Navigation size={36} strokeWidth={1} className="mx-auto mb-2" />
              <p className="text-sm">Sin viajes disponibles ahora</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTrips.map(trip => (
                <div key={trip.id} className="card p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold">{trip.passenger_name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Phone size={11} /> {trip.passenger_phone}
                      </p>
                    </div>
                    {trip.estimated_price && (
                      <p className="font-extrabold text-lg text-primary">${trip.estimated_price.toLocaleString('es-AR')}</p>
                    )}
                  </div>
                  <div className="space-y-1.5 text-sm mb-4">
                    <p className="flex items-center gap-2 text-gray-700">
                      <div className="w-2 h-2 bg-primary rounded-full shrink-0" />
                      {trip.origin_address}
                    </p>
                    <p className="flex items-center gap-2 text-gray-700">
                      <Navigation size={12} className="text-gray-400 shrink-0" />
                      {trip.dest_address}
                    </p>
                    <p className="text-xs text-gray-400">
                      {trip.distance_km && `${trip.distance_km} km · `}
                      {PAYMENT_LABELS[trip.payment_method] || 'Efectivo'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => acceptTrip(trip.id)} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-1.5">
                      <CheckCircle size={15} /> Aceptar
                    </button>
                    <button className="flex-1 py-2.5 px-4 rounded-xl border-2 border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5">
                      <XCircle size={15} /> Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
