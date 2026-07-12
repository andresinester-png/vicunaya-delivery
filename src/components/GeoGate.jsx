import { Navigate, Outlet } from 'react-router-dom';
import { useGeo } from '../context/GeoContext.jsx';

export default function GeoGate() {
  const { geoState } = useGeo();

  // Mientras detecta la ubicación, no renderizar nada (evita flash)
  if (geoState === 'loading') return null;

  // Fuera de zona o GPS denegado → redirigir al Hub
  if (geoState === 'outZone' || geoState === 'denied') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
