import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useTurnosNegocio } from '../../contexts/TurnosNegocioContext.js';
import toast from 'react-hot-toast';
import { Calendar, UserCircle, CheckCircle, XCircle, Check, Phone, Copy, MessageCircle } from 'lucide-react';

const STATUS_COLORS = {
  pending:   { card: 'bg-amber-50  border border-amber-200',  label: 'text-amber-800',  badge: 'bg-amber-100  text-amber-800',  text: 'Pendiente'  },
  confirmed: { card: 'bg-green-50  border border-green-200',  label: 'text-green-800',  badge: 'bg-green-100  text-green-800',  text: 'Confirmado' },
  completed: { card: 'bg-blue-50   border border-blue-200',   label: 'text-blue-800',   badge: 'bg-blue-100   text-blue-800',   text: 'Completado' },
};

const FREE_CARD = 'bg-white border border-gray-300';

function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function timeToMin(t) { const [h, m] = String(t).split(':').map(Number); return h * 60 + m; }

function formatWANumber(phone) {
  const digits = phone.replace(/\D/g, '');
  const noLeadingZero = digits.startsWith('0') ? digits.slice(1) : digits;
  return noLeadingZero.startsWith('54') ? noLeadingZero : `54${noLeadingZero}`;
}

export default function Agenda() {
  const negocio = useTurnosNegocio();
  const today = localDateStr(new Date());

  const [date, setDate]                   = useState(today);
  const [professionals, setProfessionals] = useState([]);
  const [slots, setSlots]                 = useState([]);
  const [appointments, setAppointments]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedAppt, setSelectedAppt]   = useState(null); // { profId, appt }

  // Load professionals once
  useEffect(() => {
    supabase
      .from('appointment_professionals')
      .select('id, name, avatar_url')
      .eq('business_id', negocio.id)
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setProfessionals(data || []));
  }, []);

  // Load slots + appointments when date changes
  useEffect(() => {
    loadDayData();
    setSelectedAppt(null);
  }, [date]);

  // Auto-refresh every 30s and on tab focus
  useEffect(() => {
    const interval = setInterval(loadDayData, 30000);
    const onVisible = () => { if (document.visibilityState === 'visible') loadDayData(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [date]);

  async function loadDayData() {
    setLoading(true);
    const [{ data: slotsData }, { data: apptData }] = await Promise.all([
      supabase
        .from('appointment_slots')
        .select('id, professional_id, start_time, end_time, is_active')
        .eq('business_id', negocio.id)
        .eq('specific_date', date)
        .order('start_time'),
      supabase
        .from('appointments')
        .select('id, professional_id, start_time, end_time, status, customer_name, customer_phone, appointment_services(name)')
        .eq('business_id', negocio.id)
        .eq('date', date)
        .neq('status', 'cancelled'),
    ]);
    setSlots(slotsData || []);
    setAppointments(apptData || []);
    setLoading(false);
  }

  async function updateStatus(apptId, status) {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', apptId);
    if (error) { toast.error('Error al actualizar'); return; }
    setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status } : a));
    if (selectedAppt?.appt.id === apptId) setSelectedAppt(prev => ({ ...prev, appt: { ...prev.appt, status } }));
    toast.success(status === 'completed' ? 'Marcado como atendido' : 'Estado actualizado');
  }

  // Build per-professional appointment map keyed by start_time HH:MM
  const apptByProf = useMemo(() => {
    const map = {};
    appointments.forEach(a => {
      if (!map[a.professional_id]) map[a.professional_id] = {};
      map[a.professional_id][String(a.start_time).slice(0, 5)] = a;
    });
    return map;
  }, [appointments]);

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const totalBooked = appointments.length;

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-400 capitalize mt-0.5">{cap(formattedDate)}</p>
        </div>
        <div className="flex items-center gap-3">
          {totalBooked > 0 && (
            <span className="text-xs font-semibold bg-[#e31b23]/10 text-[#e31b23] px-3 py-1.5 rounded-xl">
              {totalBooked} turno{totalBooked !== 1 ? 's' : ''} reservado{totalBooked !== 1 ? 's' : ''}
            </span>
          )}
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#e31b23] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : professionals.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <Calendar size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm">No hay profesionales activos</p>
        </div>
      ) : (
        <div className="space-y-4">
          {professionals.map(prof => {
            const profSlots   = slots.filter(s => s.professional_id === prof.id);
            const profApptMap = apptByProf[prof.id] || {};
            const profBooked  = Object.keys(profApptMap).length;
            // Count visible slots: active ones + any with an appointment
            const visibleCount = profSlots.filter(s =>
              s.is_active || !!profApptMap[String(s.start_time).slice(0, 5)]
            ).length;

            return (
              <div key={prof.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">

                {/* Professional header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                  {prof.avatar_url
                    ? <img src={prof.avatar_url} alt={prof.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    : <UserCircle size={32} className="text-gray-300 shrink-0" />}
                  <span className="font-semibold text-sm text-gray-900">{prof.name}</span>
                  <div className="ml-auto flex items-center gap-2 text-xs">
                    {profBooked > 0 && (
                      <span className="font-semibold text-[#e31b23] bg-[#e31b23]/8 px-2 py-0.5 rounded-lg">
                        {profBooked} ocupado{profBooked !== 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="text-gray-400">{visibleCount} turnos</span>
                  </div>
                </div>

                {/* Slot grid */}
                {visibleCount === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-gray-300 text-sm">Sin turnos generados para este día</p>
                    <p className="text-gray-300 text-xs mt-1">Configurá el horario y generá los turnos desde la sección Horarios</p>
                  </div>
                ) : (
                  <div className="p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                    {profSlots.map(slot => {
                      const st   = String(slot.start_time).slice(0, 5);
                      const appt = profApptMap[st];
                      const isSelected = selectedAppt?.appt?.id === appt?.id;

                      // Occupied slot — show regardless of is_active
                      if (appt) {
                        const sc = STATUS_COLORS[appt.status] || STATUS_COLORS.pending;
                        return (
                          <div
                            key={slot.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedAppt(isSelected ? null : { profId: prof.id, appt })}
                            onKeyDown={e => e.key === 'Enter' && setSelectedAppt(isSelected ? null : { profId: prof.id, appt })}
                            className={`relative rounded-xl px-2 py-2.5 text-left transition-all cursor-pointer select-none ${sc.card} ${isSelected ? 'ring-2 ring-[#e31b23]/40' : 'hover:opacity-90'}`}
                          >
                            <p className={`text-xs font-bold pr-4 ${sc.label}`}>{st}</p>
                            <p className={`text-xs font-semibold mt-0.5 truncate ${sc.label}`}>{appt.customer_name}</p>
                            {appt.appointment_services?.name && (
                              <p className={`text-xs mt-0.5 truncate opacity-60 ${sc.label}`}>{appt.appointment_services.name}</p>
                            )}
                            {/* Quick "Atendido" button */}
                            {appt.status !== 'completed' ? (
                              <button
                                onClick={e => { e.stopPropagation(); updateStatus(appt.id, 'completed'); }}
                                className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-md transition-colors"
                                title="Marcar como atendido"
                              >
                                <Check size={10} />
                              </button>
                            ) : (
                              <CheckCircle size={12} className="absolute top-1.5 right-1.5 text-blue-400" />
                            )}
                          </div>
                        );
                      }

                      // Cancelled slot with no appointment → hidden
                      if (!slot.is_active) return null;

                      // Free slot (past or future)
                      const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
                      const isPast = date === today && timeToMin(st) <= nowMin;
                      return (
                        <div
                          key={slot.id}
                          className={`rounded-xl px-2 py-2.5 ${isPast ? 'bg-gray-50 border border-gray-100 opacity-50' : FREE_CARD}`}
                        >
                          <p className={`text-xs font-semibold ${isPast ? 'text-gray-300' : 'text-gray-700'}`}>{st}</p>
                          <p className={`text-xs mt-0.5 ${isPast ? 'text-gray-300' : 'text-gray-500'}`}>
                            {isPast ? 'Pasado' : 'Libre'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Detail panel for selected appointment of this professional */}
                {selectedAppt?.profId === prof.id && (
                  <div className="mx-3 mb-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 space-y-3">

                    {/* Time + status + name */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-gray-900">
                            {String(selectedAppt.appt.start_time).slice(0, 5)} – {String(selectedAppt.appt.end_time).slice(0, 5)}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selectedAppt.appt.status]?.badge || ''}`}>
                            {STATUS_COLORS[selectedAppt.appt.status]?.text || selectedAppt.appt.status}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{selectedAppt.appt.customer_name}</p>
                        {selectedAppt.appt.appointment_services?.name && (
                          <p className="text-xs text-gray-400">{selectedAppt.appt.appointment_services.name}</p>
                        )}
                      </div>

                      {selectedAppt.appt.status !== 'completed' && (
                        <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                          {selectedAppt.appt.status === 'pending' && (
                            <button
                              onClick={() => updateStatus(selectedAppt.appt.id, 'confirmed')}
                              className="flex items-center gap-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                            >
                              <CheckCircle size={12} /> Confirmar
                            </button>
                          )}
                          <button
                            onClick={() => updateStatus(selectedAppt.appt.id, 'completed')}
                            className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                          >
                            <Check size={12} /> Atendido
                          </button>
                          <button
                            onClick={() => updateStatus(selectedAppt.appt.id, 'cancelled')}
                            className="flex items-center gap-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                          >
                            <XCircle size={12} /> Cancelar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Phone + contact buttons */}
                    {selectedAppt.appt.customer_phone && (
                      <div className="flex items-center gap-2 flex-wrap pt-0.5 border-t border-gray-200">
                        <Phone size={13} className="text-gray-400 shrink-0" />
                        <span className="text-sm font-medium text-gray-700">{selectedAppt.appt.customer_phone}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedAppt.appt.customer_phone);
                            toast.success('Teléfono copiado');
                          }}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-200 px-2 py-1 rounded-lg transition-colors"
                        >
                          <Copy size={11} /> Copiar
                        </button>
                        <a
                          href={`https://wa.me/${formatWANumber(selectedAppt.appt.customer_phone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <MessageCircle size={11} /> WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
