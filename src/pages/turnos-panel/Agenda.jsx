import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useTurnosNegocio } from '../../contexts/TurnosNegocioContext.js';
import toast from 'react-hot-toast';
import { Calendar, Clock, User, CheckCircle, XCircle, Check } from 'lucide-react';

const STATUS = {
  pending:   { label: 'Pendiente',   cls: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Confirmado',  cls: 'bg-green-100 text-green-800' },
  completed: { label: 'Completado',  cls: 'bg-blue-100 text-blue-800' },
  cancelled: { label: 'Cancelado',   cls: 'bg-gray-100 text-gray-500' },
};

const BORDER = {
  pending:   'border-amber-400',
  confirmed: 'border-green-400',
  completed: 'border-blue-400',
  cancelled: 'border-gray-200',
};

export default function Agenda() {
  const negocio = useTurnosNegocio();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAppointments(); }, [date]);

  async function fetchAppointments() {
    setLoading(true);
    const { data } = await supabase
      .from('appointments')
      .select('*, appointment_services(name), appointment_professionals(name)')
      .eq('business_id', negocio.id)
      .eq('date', date)
      .order('start_time');
    setAppointments(data || []);
    setLoading(false);
  }

  async function updateStatus(id, status) {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) { toast.error('Error al actualizar'); return; }
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    toast.success('Estado actualizado');
  }

  const formatted = new Date(date + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-gray-900">Agenda</h1>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30"
        />
      </div>

      <p className="text-gray-500 text-sm capitalize">{formatted}</p>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#e31b23] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <Calendar size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm">No hay turnos para este día</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map(appt => (
            <div
              key={appt.id}
              className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${BORDER[appt.status] || 'border-gray-200'} ${appt.status === 'cancelled' ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Clock size={14} className="text-gray-400 shrink-0" />
                    <span className="font-bold text-gray-900 text-sm">
                      {String(appt.start_time).slice(0, 5)} – {String(appt.end_time).slice(0, 5)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS[appt.status]?.cls || ''}`}>
                      {STATUS[appt.status]?.label || appt.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User size={13} className="text-gray-400 shrink-0" />
                    <span className="font-medium text-gray-900">{appt.customer_name}</span>
                    {appt.customer_phone && <span className="text-gray-400 text-xs">· {appt.customer_phone}</span>}
                  </div>
                  <div className="text-xs text-gray-400 flex gap-1.5 flex-wrap">
                    {appt.appointment_services?.name && <span>{appt.appointment_services.name}</span>}
                    {appt.appointment_professionals?.name && (
                      <span>· {appt.appointment_professionals.name}</span>
                    )}
                  </div>
                </div>

                {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                  <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                    {appt.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(appt.id, 'confirmed')}
                        className="flex items-center gap-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        <CheckCircle size={12} /> Confirmar
                      </button>
                    )}
                    <button
                      onClick={() => updateStatus(appt.id, 'completed')}
                      className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      <Check size={12} /> Completado
                    </button>
                    <button
                      onClick={() => updateStatus(appt.id, 'cancelled')}
                      className="flex items-center gap-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      <XCircle size={12} /> Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
