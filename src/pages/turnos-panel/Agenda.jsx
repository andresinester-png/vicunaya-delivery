import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useTurnosNegocio } from '../../contexts/TurnosNegocioContext.js';
import toast from 'react-hot-toast';
import { Calendar, UserCircle, CheckCircle, Phone, MessageCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';

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

function cardStyle(status) {
  if (status === 'completed') return { borderColor: '#d1d5db', bg: '#f9fafb' };
  return { borderColor: '#4ade80', bg: '#f0fdf4' };
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
  const [services, setServices]             = useState([]);

  // Occupied slot modal
  const [selectedAppt, setSelectedAppt] = useState(null); // { slot, appt }

  // Free slot assignment modal
  const [assignModal, setAssignModal]   = useState(null); // { slot }
  const [assignForm, setAssignForm]     = useState({ name: '', phone: '', serviceId: '' });
  const [assignSaving, setAssignSaving] = useState(false);

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

  // Load services once
  useEffect(() => {
    supabase
      .from('appointment_services')
      .select('id, name, duration_minutes')
      .eq('business_id', negocio.id)
      .order('name')
      .then(({ data }) => setServices(data || []));
  }, []);

  // Reload when date changes
  useEffect(() => {
    loadDayData();
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
    if (selectedAppt?.appt?.id === apptId) {
      setSelectedAppt(prev => ({ ...prev, appt: { ...prev.appt, status } }));
    }
    toast.success(status === 'completed' ? 'Marcado como atendido' : 'Estado actualizado');
  }

  async function handleAssignSave(e) {
    e.preventDefault();
    if (!assignForm.name.trim()) { toast.error('Ingresá el nombre del cliente'); return; }
    if (!assignForm.serviceId) { toast.error('Seleccioná un servicio'); return; }
    setAssignSaving(true);

    const slot = assignModal.slot;
    const svc  = services.find(s => s.id === assignForm.serviceId);
    const startStr = String(slot.start_time).slice(0, 5);
    const startMin = timeToMin(startStr);
    const endMin   = startMin + (svc?.duration_minutes || 30);
    const endStr   = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;

    const { error } = await supabase.from('appointments').insert({
      business_id: negocio.id,
      professional_id: selectedProfId,
      service_id: assignForm.serviceId,
      customer_name: assignForm.name.trim(),
      customer_phone: assignForm.phone.trim() || null,
      date: date,
      start_time: startStr,
      end_time: endStr,
      status: 'confirmed',
    });

    setAssignSaving(false);
    if (error) { toast.error('Error al guardar el turno'); return; }

    setAssignModal(null);
    setAssignForm({ name: '', phone: '', serviceId: '' });
    toast.success('Turno asignado');
    loadDayData();
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
                onClick={() => setSelectedProfId(prof.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-colors"
                style={{
                  background: isActive ? '#111' : '#fff',
                  color: isActive ? '#fff' : '#4B5563',
                  border: isActive ? '1px solid #111' : '1px solid #E5E7EB',
                }}
              >
                {prof.avatar_url
                  ? <img src={prof.avatar_url} alt={prof.name} loading="lazy" className="w-5 h-5 rounded-full object-cover shrink-0" />
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
                ? <img src={selectedProf.avatar_url} alt={selectedProf.name} loading="lazy" className="w-7 h-7 rounded-full object-cover shrink-0" />
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
                  const cs = cardStyle(appt.status);
                  return (
                    <div
                      key={slot.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedAppt({ slot, appt })}
                      onKeyDown={e => e.key === 'Enter' && setSelectedAppt({ slot, appt })}
                      className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 border-l-4 cursor-pointer hover:brightness-[0.97] transition-all"
                      style={{ borderLeftColor: cs.borderColor, background: cs.bg }}
                    >
                      <span className="text-xs font-mono font-bold text-gray-500 w-11 shrink-0">{st}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${appt.status === 'completed' ? 'text-gray-400' : 'text-gray-900'}`}>
                          {appt.customer_name}
                        </p>
                        {appt.appointment_services?.name && (
                          <p className={`text-xs truncate mt-0.5 ${appt.status === 'completed' ? 'text-gray-300' : 'text-gray-400'}`}>
                            {appt.appointment_services.name}
                          </p>
                        )}
                      </div>
                      {appt.status === 'completed' && (
                        <span className="text-xs text-gray-400 font-medium shrink-0">Atendido</span>
                      )}
                    </div>
                  );
                }

                // ── Free slot ──────────────────────────────────────────
                const isPast = date === today && timeToMin(st) <= nowMin;
                return (
                  <div
                    key={slot.id}
                    role={isPast ? undefined : 'button'}
                    tabIndex={isPast ? undefined : 0}
                    onClick={() => !isPast && setAssignModal({ slot })}
                    onKeyDown={e => !isPast && e.key === 'Enter' && setAssignModal({ slot })}
                    className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 border-l-4 ${isPast ? 'opacity-40' : 'cursor-pointer hover:bg-gray-50 transition-colors'}`}
                    style={{ borderLeftColor: 'transparent' }}
                  >
                    <span className="text-sm font-bold text-gray-600 w-11 shrink-0">{st}</span>
                    <span className="text-sm font-semibold text-gray-500">{isPast ? 'Sin agenda' : 'Libre'}</span>
                    {!isPast && <span className="ml-auto text-xs text-gray-300">+ Asignar</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Occupied slot modal ─────────────────────────────────────────── */}
      {selectedAppt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedAppt(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-5 pb-4">
              <div>
                <p className="font-bold text-gray-900 text-base">{selectedAppt.appt.customer_name}</p>
                {selectedAppt.appt.appointment_services?.name && (
                  <p className="text-sm text-gray-400 mt-0.5">{selectedAppt.appt.appointment_services.name}</p>
                )}
                <p className="text-xs text-gray-300 mt-1">{String(selectedAppt.slot.start_time).slice(0,5)}</p>
              </div>
              <button
                onClick={() => setSelectedAppt(null)}
                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Phone + WhatsApp */}
            {selectedAppt.appt.customer_phone && (
              <div className="mx-5 mb-4 flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <Phone size={14} className="text-gray-400 shrink-0" />
                <span className="text-sm font-medium text-gray-700 flex-1">{selectedAppt.appt.customer_phone}</span>
                <a
                  href={`https://wa.me/${formatWANumber(selectedAppt.appt.customer_phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <MessageCircle size={13} /> WhatsApp
                </a>
              </div>
            )}

            {/* Mark as attended / already attended */}
            <div className="px-5 pb-5">
              {selectedAppt.appt.status !== 'completed' ? (
                <button
                  onClick={async () => {
                    await updateStatus(selectedAppt.appt.id, 'completed');
                    setSelectedAppt(null);
                  }}
                  className="w-full bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={15} /> Marcar como atendido
                </button>
              ) : (
                <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-400">
                  <CheckCircle size={15} className="text-green-400" /> Ya fue atendido
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Assign free slot modal ──────────────────────────────────────── */}
      {assignModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setAssignModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-5 pb-3">
              <div>
                <p className="font-bold text-gray-900 text-base">Asignar turno</p>
                <p className="text-sm text-gray-400 mt-0.5">
                  {String(assignModal.slot.start_time).slice(0,5)} — {String(assignModal.slot.end_time).slice(0,5)}
                </p>
              </div>
              <button
                onClick={() => setAssignModal(null)}
                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAssignSave} className="px-5 pb-5 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Nombre del cliente *</label>
                <input
                  value={assignForm.name}
                  onChange={e => setAssignForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Juan García"
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Teléfono</label>
                <input
                  value={assignForm.phone}
                  onChange={e => setAssignForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="3571-123456"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Servicio *</label>
                <select
                  value={assignForm.serviceId}
                  onChange={e => setAssignForm(f => ({ ...f, serviceId: e.target.value }))}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30 bg-white"
                >
                  <option value="">Elegí un servicio</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={assignSaving}
                className="w-full bg-[#e31b23] hover:bg-[#c41520] disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl transition-colors mt-1"
              >
                {assignSaving ? 'Guardando...' : 'Guardar turno'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
