import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

const VICUÑA_LAT  = -33.9088;
const VICUÑA_LNG  = -64.3703;
const MAX_KM      = 18;
const BYPASS_EMAILS = ['admin@vicunaya.com', 'andresnester@hotmail.com', 'andresinester@gmail.com'];

function haversine(lat1, lng1, lat2, lng2) {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a    = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const GeoContext = createContext(null);

export function GeoProvider({ children }) {
  const { session } = useAuth();
  // 'loading' | 'inZone' | 'outZone' | 'denied'
  const [geoState, setGeoState] = useState('loading');

  // Geo detection — runs once on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoState('inZone'); // no podemos verificar → permitir
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const km = haversine(coords.latitude, coords.longitude, VICUÑA_LAT, VICUÑA_LNG);
        setGeoState(km <= MAX_KM ? 'inZone' : 'outZone');
      },
      (err) => {
        // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        setGeoState(err.code === 1 ? 'denied' : 'inZone');
      },
      { timeout: 6000, maximumAge: 30 * 60 * 1000 },
    );
  }, []);

  // Admin override — se aplica cuando la sesión está disponible
  useEffect(() => {
    if (BYPASS_EMAILS.includes(session?.user?.email)) {
      setGeoState('inZone');
    }
  }, [session]);

  return (
    <GeoContext.Provider value={{ geoState }}>
      {children}
    </GeoContext.Provider>
  );
}

export const useGeo = () => useContext(GeoContext);
