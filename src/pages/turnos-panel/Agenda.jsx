import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useTurnosNegocio } from '../../contexts/TurnosNegocioContext.js';
import toast from 'react-hot-toast';
import { Calendar, UserCircle, CheckCircle, Phone, MessageCircle, ChevronLeft, ChevronRight, X, Users } from 'lucide-react';

// ── KYVRA tokens ───────────────────────────────────────────────────────────
const T = {
  navy: '#0F172A', teal: '#0D9488', tealDark: '#0F766E', tealSec: '#14B8A6',
  tealLight: '#5EEAD4', bg: '#F8FAFC', white: '#FFFFFF',
  textSec: '#64748B', textMuted: '#94A3B8', border: '#E2E8F0',
};
const FF    = "'Plus Jakarta Sans', sans-serif";
const GH    = 'linear-gradient(160deg, #061118 0%, #0A1E2A 28%, #0D3A35 55%, #0F172A 100%)';
const GTEAL = 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)';

const CARD = {
  background: T.white, borderRadius: 16,
  border: `1.5px solid ${T.border}`,
  boxShadow: '0 2px 8px rgba(15,23,42,0.05)',
};

const IST = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 12px', border: `1.5px solid ${T.border}`, borderRadius: 10,
  fontSize: 14, fontFamily: FF, color: T.navy, background: T.bg,
};

const LST = {
  display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted,
  textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 5, fontFamily: FF,
};

const STYLES = `
  .kv-ag-input { transition: border-color 0.15s, box-shadow 0.15s; }
  .kv-ag-input:focus { border-color: #0D9488 !important; box-shadow: 0 0 0 3px rgba(13,148,136,0.10) !important; outline: none; }
  .kv-ag-slot-free:hover { background: rgba(13,148,136,0.05) !important; border-left-color: rgba(13,148,136,0.28) !important; }
  .kv-ag-slot-occ:hover { filter: brightness(0.97); }
  .kv-ag-nav:hover { background: rgba(255,255,255,0.10) !important; }
  @keyframes kv-spin { to { transform: rotate(360deg); } }
`;

// ── Business logic utilities (unchanged) ───────────────────────────────────
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

// Visual status mapping (pure UI, status values unchanged)
function slotCardStyle(status) {
  if (status === 'completed') return { borderColor: T.border, bg: T.bg };
  return { borderColor: T.teal, bg: 'rgba(13,148,136,0.04)' };
}

// ── Avatar helper ──────────────────────────────────────────────────────────
function ProfAvatar({ src, name, size = 28 }) {
  if (src) return <img src={src} alt={name} loading="lazy" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'rgba(13,148,136,0.12)', border: '1.5px solid rgba(13,148,136,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Users size={size * 0.46} color={T.teal} strokeWidth={1.6} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
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
  const totalSlots    = profSlots.filter(s => s.is_active).length;

  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const isToday = date === today;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: FF, maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <style>{STYLES}</style>

      {/* ── Hero ── */}
      <div style={{ background: GH, borderRadius: 18, padding: '26px 24px 22px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -40, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.20) 0%, transparent 68%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: 40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(94,234,212,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>

          {/* Top row: badge + date nav */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(13,148,136,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Calendar size={13} color={T.tealLight} strokeWidth={2} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.6, color: T.tealLight, textTransform: 'uppercase' }}>KYVRA · AGENDA</span>
            </div>

            {/* Date navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <button
                onClick={() => setDate(d => shiftDate(d, -1))}
                className="kv-ag-nav"
                style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.07)', cursor: 'pointer', color: 'rgba(255,255,255,0.70)', transition: 'background 0.15s' }}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setDate(today)}
                style={{
                  padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  background: isToday ? GTEAL : 'rgba(255,255,255,0.09)',
                  color: isToday ? '#fff' : 'rgba(255,255,255,0.65)',
                  border: isToday ? 'none' : '1px solid rgba(255,255,255,0.14)',
                  cursor: 'pointer', fontFamily: FF,
                  boxShadow: isToday ? '0 2px 8px rgba(13,148,136,0.40)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                Hoy
              </button>
              <button
                onClick={() => setDate(d => shiftDate(d, 1))}
                className="kv-ag-nav"
                style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.07)', cursor: 'pointer', color: 'rgba(255,255,255,0.70)', transition: 'background 0.15s' }}
              >
                <ChevronRight size={15} />
              </button>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="kv-ag-input"
                style={{ padding: '5px 10px', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8, fontSize: 12, fontFamily: FF, color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.07)', cursor: 'pointer', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Date + summary */}
          <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.3px' }}>
            {cap(formattedDate)}
          </h1>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {totalBooked > 0 && (
              <span style={{ padding: '4px 11px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: GTEAL, color: '#fff' }}>
                {totalBooked} turno{totalBooked !== 1 ? 's' : ''} ocupado{totalBooked !== 1 ? 's' : ''}
              </span>
            )}
            {totalSlots > 0 && (
              <span style={{ padding: '4px 11px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.12)' }}>
                {totalSlots} turnos disponibles
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Professional tabs ── */}
      {professionals.length > 0 && (
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
          {professionals.map(prof => {
            const booked = apptByProf[prof.id] ? Object.keys(apptByProf[prof.id]).length : 0;
            const isActive = selectedProfId === prof.id;
            return (
              <button
                key={prof.id}
                onClick={() => setSelectedProfId(prof.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '7px 13px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                  background: isActive ? GH : T.white,
                  color: isActive ? '#fff' : T.textSec,
                  border: isActive ? '1.5px solid rgba(13,148,136,0.40)' : `1.5px solid ${T.border}`,
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: FF,
                  boxShadow: isActive ? '0 2px 10px rgba(13,148,136,0.20)' : '0 1px 3px rgba(15,23,42,0.04)',
                  transition: 'all 0.15s',
                }}
              >
                <ProfAvatar src={prof.avatar_url} name={prof.name} size={22} />
                {prof.name}
                {booked > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 20,
                    background: isActive ? 'rgba(94,234,212,0.20)' : 'rgba(13,148,136,0.10)',
                    color: isActive ? T.tealLight : T.teal,
                    border: isActive ? '1px solid rgba(94,234,212,0.25)' : '1px solid rgba(13,148,136,0.20)',
                  }}>
                    {booked}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Timeline ── */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '56px 0' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2.5px solid ${T.border}`, borderTopColor: T.teal, animation: 'kv-spin 0.7s linear infinite' }} />
          <span style={{ fontSize: 13, color: T.textMuted, fontFamily: FF }}>Cargando agenda…</span>
        </div>
      ) : professionals.length === 0 ? (
        <div style={{ ...CARD, padding: '56px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(13,148,136,0.08)', border: '1.5px solid rgba(13,148,136,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={26} color={T.teal} strokeWidth={1.5} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Sin profesionales activos</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: T.textMuted }}>Agregá profesionales en la sección Profesionales</p>
          </div>
        </div>
      ) : (
        <div style={{ ...CARD, overflow: 'hidden' }}>

          {/* Professional sub-header */}
          {selectedProf && (
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <ProfAvatar src={selectedProf.avatar_url} name={selectedProf.name} size={30} />
              <span style={{ fontWeight: 700, fontSize: 13.5, color: T.navy, fontFamily: FF, flex: 1 }}>{selectedProf.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {totalBooked > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: 'rgba(13,148,136,0.09)', color: T.teal, border: '1px solid rgba(13,148,136,0.18)', fontFamily: FF }}>
                    {totalBooked} ocupado{totalBooked !== 1 ? 's' : ''}
                  </span>
                )}
                {totalSlots > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, fontFamily: FF }}>
                    {totalSlots - totalBooked} libre{totalSlots - totalBooked !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Slot list */}
          {profSlots.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(13,148,136,0.07)', border: '1.5px solid rgba(13,148,136,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={24} color={T.teal} strokeWidth={1.5} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.navy, fontFamily: FF }}>Sin turnos generados</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: T.textMuted, fontFamily: FF }}>Configurá el horario en la sección Horarios</p>
              </div>
            </div>
          ) : (
            <div>
              {profSlots.map((slot, idx) => {
                const st   = String(slot.start_time).slice(0, 5);
                const appt = profApptMap[st];

                if (!slot.is_active && !appt) return null;

                // ── Occupied slot ──────────────────────────────────────
                if (appt) {
                  const cs = slotCardStyle(appt.status);
                  const isCompleted = appt.status === 'completed';
                  return (
                    <div
                      key={slot.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedAppt({ slot, appt })}
                      onKeyDown={e => e.key === 'Enter' && setSelectedAppt({ slot, appt })}
                      className="kv-ag-slot-occ"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '11px 16px',
                        borderBottom: idx < profSlots.length - 1 ? `1px solid ${T.border}` : 'none',
                        borderLeft: `4px solid ${cs.borderColor}`,
                        background: cs.bg,
                        cursor: 'pointer', transition: 'filter 0.12s',
                      }}
                    >
                      <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: isCompleted ? T.textMuted : T.tealDark, width: 40, flexShrink: 0 }}>{st}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: isCompleted ? T.textMuted : T.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: isCompleted ? 'none' : 'none', fontFamily: FF }}>
                          {appt.customer_name}
                        </p>
                        {appt.appointment_services?.name && (
                          <p style={{ margin: '2px 0 0', fontSize: 11.5, color: isCompleted ? T.textMuted : T.textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FF }}>
                            {appt.appointment_services.name}
                          </p>
                        )}
                      </div>
                      {isCompleted ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: T.textMuted, flexShrink: 0, fontFamily: FF }}>
                          <CheckCircle size={12} color={T.textMuted} /> Atendido
                        </span>
                      ) : (
                        appt.customer_phone && (
                          <Phone size={13} color={T.teal} style={{ flexShrink: 0, opacity: 0.7 }} />
                        )
                      )}
                    </div>
                  );
                }

                // ── Free slot ──────────────────────────────────────────
                const isPast = isToday && timeToMin(st) <= nowMin;
                return (
                  <div
                    key={slot.id}
                    role={isPast ? undefined : 'button'}
                    tabIndex={isPast ? undefined : 0}
                    onClick={() => !isPast && setAssignModal({ slot })}
                    onKeyDown={e => !isPast && e.key === 'Enter' && setAssignModal({ slot })}
                    className={!isPast ? 'kv-ag-slot-free' : ''}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '9px 16px',
                      borderBottom: idx < profSlots.length - 1 ? `1px solid ${T.border}` : 'none',
                      borderLeft: '4px solid transparent',
                      background: T.white,
                      cursor: isPast ? 'default' : 'pointer',
                      opacity: isPast ? 0.38 : 1,
                      transition: 'background 0.12s',
                    }}
                  >
                    <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: isPast ? T.textMuted : T.textSec, width: 40, flexShrink: 0 }}>{st}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: isPast ? T.textMuted : T.textSec, fontFamily: FF }}>
                      {isPast ? 'Pasado' : 'Libre'}
                    </span>
                    {!isPast && (
                      <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: T.teal, fontFamily: FF, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        + Asignar
                      </span>
                    )}
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
          onClick={() => setSelectedAppt(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.60)', backdropFilter: 'blur(3px)', padding: 16 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: T.white, borderRadius: 18, boxShadow: '0 24px 64px rgba(15,23,42,0.20)', width: '100%', maxWidth: 360, overflow: 'hidden' }}
          >
            {/* Modal hero */}
            <div style={{ background: GH, padding: '18px 20px 16px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(13,148,136,0.20)', color: T.tealLight, marginBottom: 7, fontFamily: FF, letterSpacing: 0.5 }}>
                    {String(selectedAppt.slot.start_time).slice(0,5)}
                  </span>
                  <p style={{ margin: '0 0 3px', fontSize: 17, fontWeight: 900, color: '#fff', letterSpacing: '-0.2px', fontFamily: FF, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedAppt.appt.customer_name}
                  </p>
                  {selectedAppt.appt.appointment_services?.name && (
                    <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: FF }}>
                      {selectedAppt.appt.appointment_services.name}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedAppt(null)}
                  style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.14)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.65)', flexShrink: 0 }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Phone / WhatsApp */}
            {selectedAppt.appt.customer_phone && (
              <div style={{ margin: '14px 18px 0', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: T.bg, borderRadius: 12, border: `1.5px solid ${T.border}` }}>
                <Phone size={14} color={T.textMuted} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: T.navy, flex: 1, fontFamily: FF }}>{selectedAppt.appt.customer_phone}</span>
                <a
                  href={`https://wa.me/${formatWANumber(selectedAppt.appt.customer_phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#15803D', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '5px 10px', borderRadius: 8, textDecoration: 'none', fontFamily: FF, whiteSpace: 'nowrap' }}
                >
                  <MessageCircle size={12} /> WhatsApp
                </a>
              </div>
            )}

            {/* Action */}
            <div style={{ padding: '14px 18px 18px' }}>
              {selectedAppt.appt.status !== 'completed' ? (
                <button
                  onClick={async () => {
                    await updateStatus(selectedAppt.appt.id, 'completed');
                    setSelectedAppt(null);
                  }}
                  style={{
                    width: '100%', background: GTEAL, color: '#fff',
                    fontSize: 13, fontWeight: 700, padding: '12px 0', borderRadius: 12,
                    border: 'none', cursor: 'pointer', fontFamily: FF,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    boxShadow: '0 3px 12px rgba(13,148,136,0.30)',
                  }}
                >
                  <CheckCircle size={15} /> Marcar como atendido
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 0', fontSize: 13, color: T.textMuted, fontFamily: FF }}>
                  <CheckCircle size={15} color={T.teal} /> Ya fue atendido
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Assign free slot modal ──────────────────────────────────────── */}
      {assignModal && (
        <div
          onClick={() => setAssignModal(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.60)', backdropFilter: 'blur(3px)', padding: 16 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: T.white, borderRadius: 18, boxShadow: '0 24px 64px rgba(15,23,42,0.20)', width: '100%', maxWidth: 360, overflow: 'hidden' }}
          >
            {/* Modal hero */}
            <div style={{ background: GH, padding: '16px 20px 14px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(13,148,136,0.20)', color: T.tealLight, marginBottom: 7, fontFamily: FF, letterSpacing: 0.5 }}>
                    {String(assignModal.slot.start_time).slice(0,5)} — {String(assignModal.slot.end_time).slice(0,5)}
                  </span>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.2px', fontFamily: FF }}>Asignar turno</p>
                  {selectedProf && (
                    <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.50)', fontFamily: FF }}>{selectedProf.name}</p>
                  )}
                </div>
                <button
                  onClick={() => setAssignModal(null)}
                  style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.14)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.65)', flexShrink: 0 }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAssignSave} style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={LST}>Nombre del cliente *</label>
                <input
                  value={assignForm.name}
                  onChange={e => setAssignForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Juan García"
                  required
                  className="kv-ag-input"
                  style={IST}
                />
              </div>
              <div>
                <label style={LST}>Teléfono</label>
                <input
                  value={assignForm.phone}
                  onChange={e => setAssignForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="3571-123456"
                  className="kv-ag-input"
                  style={IST}
                />
              </div>
              <div>
                <label style={LST}>Servicio *</label>
                <select
                  value={assignForm.serviceId}
                  onChange={e => setAssignForm(f => ({ ...f, serviceId: e.target.value }))}
                  required
                  className="kv-ag-input"
                  style={{ ...IST, cursor: 'pointer' }}
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
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 700,
                  background: assignSaving ? T.border : GTEAL,
                  color: assignSaving ? T.textMuted : '#fff',
                  border: 'none', cursor: assignSaving ? 'default' : 'pointer', fontFamily: FF,
                  boxShadow: assignSaving ? 'none' : '0 3px 12px rgba(13,148,136,0.28)',
                  marginTop: 2,
                }}
              >
                {assignSaving ? 'Guardando…' : 'Guardar turno'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
