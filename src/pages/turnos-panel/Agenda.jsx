import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useTurnosNegocio } from '../../contexts/TurnosNegocioContext.js';
import toast from 'react-hot-toast';
import { Calendar, UserCircle, CheckCircle, XCircle, Check, Phone, Copy, MessageCircle, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_STYLES = {
  pending:   { borderColor: '#f59e0b', bg: '#fffbeb', badge: 'bg-amber-100 text-amber-700',  text: 'Pendiente'  },
  confirmed: { borderColor: '#22c55e', bg: '#f0fdf4', badge: 'bg-green-100 text-green-700',  text: 'Confirmado' },
  completed: { borderColor: '#93c5fd', bg: '#eff6ff', badge: 'bg-blue-100 text-blue-600',    text: 'Completado' },
};

function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function timeToMin(t) { const [h, m] = String(t).split(':').map(Number); return h * 60 + m; }

function formatWANumber(phone) {
  const digits = phone.replace(/\D/g, '');
  const noLeadingZero = digits.startsWith('0') ? digits.slice(1) : digits;
  return noLeadingZero.startsWith('54') ? noLeadingZero : `54${noLeadingZero}`;
}

function shiftDate(dateStr, delta) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + delta);
  return localDateStr(d);
}

export default function Agenda() {
  const negocio = useTurnosNegocio();
  const today = localDateStr(new Date());

  const [date, setDate]                     = useState(today);
  const [professionals, setProfessionals]   = useState([]);
  const [selectedProfId, setSelectedProfId] = useState(null);
  const [slots, setSlots]                   = useState([]);
  const [appointments, setAppointments]     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [openMenuId, setOpenMenuId]         = useState(null);

  // Load professionals once
  useEffect(() => {
    supabase
      .from('appointment_professionals')
      .select('id, name, avatar_url')
      .eq('business_id', negocio.id)
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setProfessionals(data || []);
        if (data?.length) setSelectedProfId(data[0].id);
      });
  }, []);

  // Reload when date changes
  useEffect(() => {
    loadDayData();
    setOpenMenuId(null);
  }, [date]);

  // Auto-refresh every 30s and on tab focus
  useEffect(() => {
    const interval = setInterval(loadDayData, 30000);
    const onVisible = () => { if (document.visibilityState === 'visible') loadDayData(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
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
    toast.success(status === 'completed' ? 'Marcado como atendido' : 'Estado actualizado');
  }

  // Per-professional appointment map: profId → { HH:MM → appt }
  const apptByProf = useMemo(() => {
    const map = {};
    appointments.forEach(a => {
      if (!map[a.professional_id]) map[a.professional_id] = {};
      map[a.professional_id][String(a.start_time).slice(0, 5)] = a;
    });
    return map;
  }, [appointments]);

  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const selectedProf  = professionals.find(p => p.id === selectedProfId) || null;
  const profSlots     = slots.filter(s => s.professional_id === selectedProfId);
  const profApptMap   = selectedProfId ? (apptByProf[selectedProfId] || {}) : {};
  const totalBooked   = appointments.filter(a => a.professional_id === selectedProfId).length;

  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Header: title + date navigation */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-400 capitalize mt-0.5">{cap(formattedDate)}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDate(d => shiftDate(d, -1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setDate(today)}
            className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              date === today ? 'bg-[#e31b23] text-white border-[#e31b23]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setDate(d => shiftDate(d, 1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30 ml-1"
          />
        </div>
      </div>

      {/* Professional tabs */}
      {professionals.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {professionals.map(prof => {
            const booked = apptByProf[prof.id] ? Object.keys(apptByProf[prof.id]).length : 0;
            const isActive = selectedProfId === prof.id;
            return (
              <button
                key={prof.id}
                onClick={() => { setSelectedProfId(prof.id); setOpenMenuId(null); }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-colors"
                style={{
                  background: isActive ? '#111' : '#fff',
                  color: isActive ? '#fff' : '#4B5563',
                  border: isActive ? '1px solid #111' : '1px solid #E5E7EB',
                }}
              >
                {prof.avatar_url
                  ? <img src={prof.avatar_url} alt={prof.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                  : <UserCircle size={16} className={isActive ? 'text-white/70' : 'text-gray-300'} />}
                {prof.name}
                {booked > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-[#e31b23]/10 text-[#e31b23]'}`}>
                    {booked}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Timeline */}
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
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

          {/* Prof header */}
          {selectedProf && (
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
              {selectedProf.avatar_url
                ? <img src={selectedProf.avatar_url} alt={selectedProf.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                : <UserCircle size={28} className="text-gray-300 shrink-0" />}
              <span className="font-semibold text-sm text-gray-900">{selectedProf.name}</span>
              <div className="ml-auto flex items-center gap-2 text-xs">
                {totalBooked > 0 && (
                  <span className="font-semibold text-[#e31b23] bg-[#e31b23]/8 px-2 py-0.5 rounded-lg">
                    {totalBooked} ocupado{totalBooked !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Slot list */}
          {profSlots.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-gray-300 text-sm">Sin turnos generados para este día</p>
              <p className="text-gray-300 text-xs mt-1">Configurá el horario en la sección Horarios</p>
            </div>
          ) : (
            <div>
              {profSlots.map(slot => {
                const st   = String(slot.start_time).slice(0, 5);
                const appt = profApptMap[st];

                // Cancelled slot, no appointment → hidden
                if (!slot.is_active && !appt) return null;

                // ── Occupied slot ──────────────────────────────────────
                if (appt) {
                  const ss     = STATUS_STYLES[appt.status] || STATUS_STYLES.pending;
                  const isOpen = openMenuId === appt.id;

                  return (
                    <div key={slot.id}>
                      <div
                        className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 border-l-4"
                        style={{ borderLeftColor: ss.borderColor, background: ss.bg }}
                      >
                        <span className="text-xs font-mono font-bold text-gray-500 w-11 shrink-0">{st}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{appt.customer_name}</p>
                          {appt.appointment_services?.name && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{appt.appointment_services.name}</p>
                          )}
                        </div>
                        <span className={`hidden sm:inline-flex text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${ss.badge}`}>
                          {ss.text}
                        </span>
                        <button
                          onClick={() => setOpenMenuId(isOpen ? null : appt.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white/60 rounded-lg transition-colors shrink-0"
                        >
                          <MoreVertical size={15} />
                        </button>
                      </div>

                      {/* Expanded actions panel */}
                      {isOpen && (
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 space-y-3">

                          {/* Phone */}
                          {appt.customer_phone && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Phone size={13} className="text-gray-400 shrink-0" />
                              <span className="text-sm font-medium text-gray-700">{appt.customer_phone}</span>
                              <button
                                onClick={() => { navigator.clipboard.writeText(appt.customer_phone); toast.success('Teléfono copiado'); }}
                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-200 px-2 py-1 rounded-lg transition-colors"
                              >
                                <Copy size={11} /> Copiar
                              </button>
                              <a
                                href={`https://wa.me/${formatWANumber(appt.customer_phone)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1 rounded-lg transition-colors"
                              >
                                <MessageCircle size={11} /> WhatsApp
                              </a>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex gap-1.5 flex-wrap">
                            {appt.status === 'pending' && (
                              <button
                                onClick={() => { updateStatus(appt.id, 'confirmed'); setOpenMenuId(null); }}
                                className="flex items-center gap-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                              >
                                <CheckCircle size={12} /> Confirmar
                              </button>
                            )}
                            {appt.status !== 'completed' && (
                              <button
                                onClick={() => { updateStatus(appt.id, 'completed'); setOpenMenuId(null); }}
                                className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                              >
                                <Check size={12} /> Atendido
                              </button>
                            )}
                            <button
                              onClick={() => { updateStatus(appt.id, 'cancelled'); setOpenMenuId(null); }}
                              className="flex items-center gap-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                            >
                              <XCircle size={12} /> Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // ── Free slot ──────────────────────────────────────────
                const isPast = date === today && timeToMin(st) <= nowMin;
                return (
                  <div
                    key={slot.id}
                    className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 border-l-4 ${isPast ? 'opacity-40' : ''}`}
                    style={{ borderLeftColor: 'transparent' }}
                  >
                    <span className="text-xs font-mono text-gray-300 w-11 shrink-0">{st}</span>
                    <span className="text-xs text-gray-300">{isPast ? 'Pasado' : 'Libre'}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
