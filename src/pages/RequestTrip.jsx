import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Car } from 'lucide-react';
import { supabase, FARE } from '../lib/supabase.js';
import useProfileStore from '../store/profileStore.js';
import PlacesInput from '../components/PlacesInput.jsx';
import PaymentMethod from '../components/PaymentMethod.jsx';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Efectivo al llegar', sublabel: 'Pagás al conductor', icon: Car },
];

async function geocode(address) {
  try {
    const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

export default function RequestTrip() {
  const navigate = useNavigate();
  const profile = useProfileStore();
  const [form, setForm] = useState({ name: profile.name || '', phone: profile.phone || '', origin: profile.address || '', dest: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState(null);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const calcEstimate = () => {
    if (!form.origin || !form.dest) return;
    const km = +(1.5 + Math.random() * 8).toFixed(1);
    setEstimate({ km, price: Math.round(FARE.base + FARE.perKm * km) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.origin || !form.dest) {
      toast.error('Completá todos los campos'); return;
    }
    setLoading(true);
    try {
      const [originCoords, destCoords] = await Promise.all([
        geocode(form.origin),
        geocode(form.dest),
      ]);

      const { data: trip, error } = await supabase.from('trips').insert({
        passenger_name: form.name,
        passenger_phone: form.phone,
        origin_address: form.origin,
        dest_address: form.dest,
        distance_km: estimate?.km,
        estimated_price: estimate?.price,
        payment_method: paymentMethod,
        status: 'searching',
        origin_lat: originCoords?.lat || null,
        origin_lng: originCoords?.lng || null,
        dest_lat: destCoords?.lat || null,
        dest_lng: destCoords?.lng || null,
      }).select().single();
      if (error) throw error;
      navigate(`/remis/viaje/${trip.id}`);
    } catch (err) {
      toast.error('Error al solicitar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-nav sticky top-0 z-40">
        <div className="h-14 flex items-center px-4 gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-bold text-lg">Pedir remis</h1>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="card p-5 space-y-3">
            <h2 className="font-bold text-sm text-gray-600 uppercase tracking-wide">Tus datos</h2>
            <div className="grid grid-cols-2 gap-3">
              <input name="name" value={form.name} onChange={handleChange} placeholder="Tu nombre *" className="input" required />
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="Teléfono *" className="input" required />
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <h2 className="font-bold text-sm text-gray-600 uppercase tracking-wide">Recorrido</h2>
            <div className="relative">
              <div className="absolute left-3.5 top-4 w-2.5 h-2.5 rounded-full bg-primary z-10" />
              <PlacesInput
                value={form.origin}
                onChange={v => setForm(f => ({ ...f, origin: v }))}
                placeholder="¿Dónde te recogemos? *"
                className="input pl-8"
              />
            </div>
            <div className="relative">
              <Navigation size={14} className="absolute left-3.5 top-4 text-gray-400 z-10" />
              <PlacesInput
                value={form.dest}
                onChange={v => { setForm(f => ({ ...f, dest: v })); setTimeout(calcEstimate, 100); }}
                placeholder="¿A dónde vas? *"
                className="input pl-8"
              />
            </div>
            {estimate && (
              <div className="bg-primary-bg border border-primary/20 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">Distancia estimada</p>
                  <p className="font-semibold">{estimate.km} km</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Precio estimado</p>
                  <p className="font-extrabold text-2xl text-primary">${estimate.price.toLocaleString('es-AR')}</p>
                </div>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="font-bold text-sm text-gray-600 uppercase tracking-wide mb-3">Pago</h2>
            <PaymentMethod value={paymentMethod} onChange={setPaymentMethod} />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2">
            <Car size={18} />
            {loading ? 'Buscando conductor...' : 'Solicitar remis'}
          </button>
        </form>
      </div>
    </div>
  );
}
