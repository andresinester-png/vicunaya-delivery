import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase.js';

export default function RateDriver() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleRate = async () => {
    if (!rating) { toast.error('Seleccioná una calificación'); return; }
    setSaving(true);
    const { data: trip } = await supabase.from('trips').select('driver_id').eq('id', id).single();
    await supabase.from('trips').update({ driver_rating: rating }).eq('id', id);
    if (trip?.driver_id) {
      const { data: driverTrips } = await supabase.from('trips').select('driver_rating').eq('driver_id', trip.driver_id).not('driver_rating', 'is', null);
      const ratings = driverTrips?.map(t => t.driver_rating) || [];
      const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
      await supabase.from('drivers').update({ rating: parseFloat(avg.toFixed(2)) }).eq('id', trip.driver_id);
    }
    setSaving(false);
    setDone(true);
  };

  if (done) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="card p-8 text-center max-w-xs w-full">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="font-bold text-xl mb-2">¡Gracias!</h2>
        <p className="text-gray-500 text-sm mb-6">Tu calificación ayuda a mejorar el servicio</p>
        <button onClick={() => navigate('/')} className="btn-primary w-full">Volver al inicio</button>
      </div>
    </div>
  );

  const LABELS = ['', 'Muy malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="card p-8 text-center max-w-xs w-full">
        <div className="text-5xl mb-4">🚗</div>
        <h2 className="font-bold text-xl mb-1">¿Cómo fue tu viaje?</h2>
        <p className="text-gray-500 text-sm mb-6">Calificá a tu conductor</p>

        <div className="flex justify-center gap-2 mb-3">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
              className="transition-transform hover:scale-110 active:scale-95">
              <Star size={40} className={`transition-colors ${n <= (hover || rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
            </button>
          ))}
        </div>

        {(hover || rating) > 0 && (
          <p className="text-sm font-semibold text-gray-700 mb-4">{LABELS[hover || rating]}</p>
        )}

        <button onClick={handleRate} disabled={saving || !rating} className="btn-primary w-full mb-3">
          {saving ? 'Guardando...' : 'Enviar calificación'}
        </button>
        <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          Saltar
        </button>
      </div>
    </div>
  );
}
