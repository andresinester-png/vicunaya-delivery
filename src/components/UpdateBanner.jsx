import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos

export default function UpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!import.meta.env.PROD) return;

    const checkVersion = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const { version } = await res.json();
        if (version && version !== __APP_VERSION__) {
          setUpdateAvailable(true);
        }
      } catch {
        // sin conexión o error de red: lo intentamos de nuevo más tarde
      }
    };

    checkVersion();
    const interval = setInterval(checkVersion, CHECK_INTERVAL);
    window.addEventListener('focus', checkVersion);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkVersion);
    };
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] animate-slide-up">
      <div className="bg-primary text-white shadow-card-hover">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
            <RefreshCw size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">Nueva versión disponible</p>
            <p className="text-xs text-white/80 mt-0.5">Actualizá para ver las últimas novedades</p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="shrink-0 rounded-full bg-white text-primary text-sm font-bold px-4 py-2.5 hover:bg-gray-100 transition-colors"
          >
            Actualizar ahora
          </button>
        </div>
        <div className="pb-safe" />
      </div>
    </div>
  );
}
