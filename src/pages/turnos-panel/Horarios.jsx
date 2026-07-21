import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useTurnosNegocio } from '../../contexts/TurnosNegocioContext.js';
import toast from 'react-hot-toast';
import { CalendarDays, CalendarPlus, Sun, Sunset, Clock, ChevronDown, ChevronUp, Trash2, Plus, X } from 'lucide-react';

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
  padding: '8px 12px', border: `1.5px solid ${T.border}`, borderRadius: 10,
  fontSize: 14, fontFamily: FF, color: T.navy, background: T.bg,
  boxSizing: 'border-box',
};

const STYLES = `
  .kv-hr-input { transition: border-color 0.15s, box-shadow 0.15s; }
  .kv-hr-input:focus { border-color: #0D9488 !important; box-shadow: 0 0 0 3px rgba(13,148,136,0.10) !important; outline: none; }
  .kv-hr-input:disabled { opacity: 0.4; cursor: not-allowed; }
  .kv-hr-row { transition: background 0.12s; }
  .kv-hr-row:hover { background: rgba(13,148,136,0.03) !important; }
  .kv-hr-plus:hover { border-color: #0D9488 !important; color: #0D9488 !important; }
  .kv-hr-del { transition: background 0.12s, color 0.12s; }
  .kv-hr-del:hover { background: rgba(239,68,68,0.08) !important; color: #F87171 !important; }
  .kv-hr-expand:hover { background: rgba(13,148,136,0.03) !important; }
`;

// ── Business logic constants (unchanged) ───────────────────────────────────
const DAY_ORDER      = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABEL_FULL = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo' };

const DEFAULT_MORNING   = { is_active: false, start_time: '09:00', end_time: '13:00', days_of_week: [] };
const DEFAULT_AFTERNOON = { is_active: false, start_time: '17:00', end_time: '21:00', days_of_week: [] };
const EMPTY_DATE_FORM   = {
  date: '',
  morning:   { is_active: false, start_time: '09:00', end_time: '13:00' },
  afternoon: { is_active: false, start_time: '17:00', end_time: '21:00' },
};

function slotCount(start, end, dur) {
  if (!dur || dur <= 0) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const total = (eh * 60 + em) - (sh * 60 + sm);
  return total > 0 ? Math.floor(total / dur) : 0;
}

function generateSlotsForShift(shift, date, dur, negocioId, profId) {
  const slots = [];
  const [sh, sm] = shift.start_time.split(':').map(Number);
  const [eh, em] = shift.end_time.split(':').map(Number);
  let cur = sh * 60 + sm;
  const endMin = eh * 60 + em;
  while (cur + dur <= endMin) {
    const sH = String(Math.floor(cur / 60)).padStart(2, '0');
    const sM = String(cur % 60).padStart(2, '0');
    const e2 = cur + dur;
    const eH = String(Math.floor(e2 / 60)).padStart(2, '0');
    const eM = String(e2 % 60).padStart(2, '0');
    slots.push({
      business_id: negocioId,
      professional_id: profId,
      specific_date: localDateStr(date),
      start_time: `${sH}:${sM}`,
      end_time: `${eH}:${eM}`,
      is_active: true,
    });
    cur += dur;
  }
  return slots;
}

function groupDateSchedules(rows) {
  const map = {};
  rows.forEach(row => {
    if (!map[row.specific_date]) map[row.specific_date] = { morning: null, afternoon: null };
    map[row.specific_date][row.shift] = {
      is_active: row.is_active,
      start_time: String(row.start_time).slice(0, 5),
      end_time:   String(row.end_time).slice(0, 5),
    };
  });
  return map;
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
const todayISO = () => localDateStr(new Date());

// ── DayRow ─────────────────────────────────────────────────────────────────
function DayRow({ dow, morning, setMorning, afternoon, setAfternoon, dur, isLast }) {
  const inMorning   = morning.days_of_week.includes(dow);
  const inAfternoon = afternoon.days_of_week.includes(dow);
  const isActive    = inMorning || inAfternoon;
  const showPlus    = !inMorning || !inAfternoon;

  function toggleDay() {
    if (isActive) {
      setMorning(m => { const d = m.days_of_week.filter(x => x !== dow); return { ...m, days_of_week: d, is_active: d.length > 0 }; });
      setAfternoon(a => { const d = a.days_of_week.filter(x => x !== dow); return { ...a, days_of_week: d, is_active: d.length > 0 }; });
    } else {
      setMorning(m => ({ ...m, is_active: true, days_of_week: [...m.days_of_week, dow] }));
    }
  }

  function removeMorning() {
    setMorning(m => { const d = m.days_of_week.filter(x => x !== dow); return { ...m, days_of_week: d, is_active: d.length > 0 }; });
  }

  function removeAfternoon() {
    setAfternoon(a => { const d = a.days_of_week.filter(x => x !== dow); return { ...a, days_of_week: d, is_active: d.length > 0 }; });
  }

  function addBand() {
    if (!inMorning) setMorning(m => ({ ...m, is_active: true, days_of_week: [...m.days_of_week, dow] }));
    else            setAfternoon(a => ({ ...a, is_active: true, days_of_week: [...a.days_of_week, dow] }));
  }

  const totalSlots =
    (inMorning   && dur > 0 ? slotCount(morning.start_time,   morning.end_time,   dur) : 0) +
    (inAfternoon && dur > 0 ? slotCount(afternoon.start_time, afternoon.end_time, dur) : 0);

  return (
    <div
      className="kv-hr-row"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 16px',
        borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
        background: T.white,
      }}
    >
      {/* Toggle */}
      <button
        type="button"
        onClick={toggleDay}
        style={{
          position: 'relative', width: 36, height: 20, borderRadius: 10,
          background: isActive ? T.teal : T.border,
          border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
          transition: 'background 0.2s',
        }}
      >
        <span style={{
          position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%',
          background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.22)',
          transition: 'left 0.2s', left: isActive ? 18 : 2,
        }} />
      </button>

      {/* Day name */}
      <span style={{
        fontSize: 13, fontWeight: 700, color: isActive ? T.navy : T.textMuted,
        width: 88, flexShrink: 0, fontFamily: FF,
      }}>
        {DAY_LABEL_FULL[dow]}
      </span>

      {/* Band pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, flexWrap: 'wrap', minWidth: 0 }}>
        {inMorning && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E',
            fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
            whiteSpace: 'nowrap', fontFamily: FF,
          }}>
            <Sun size={10} style={{ flexShrink: 0 }} />
            {morning.start_time}–{morning.end_time}
            <button
              type="button" onClick={removeMorning}
              style={{ color: '#FBBF24', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, marginLeft: 2, display: 'flex' }}
            >
              <X size={10} />
            </button>
          </span>
        )}
        {inAfternoon && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.20)', color: T.tealDark,
            fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
            whiteSpace: 'nowrap', fontFamily: FF,
          }}>
            <Sunset size={10} style={{ flexShrink: 0 }} />
            {afternoon.start_time}–{afternoon.end_time}
            <button
              type="button" onClick={removeAfternoon}
              style={{ color: T.tealSec, background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, marginLeft: 2, display: 'flex' }}
            >
              <X size={10} />
            </button>
          </span>
        )}
        {!isActive && (
          <span style={{ fontSize: 11, color: T.textMuted, fontFamily: FF }}>Sin turnos</span>
        )}
      </div>

      {/* Slot count */}
      {isActive && dur > 0 && (
        <span style={{ fontSize: 11, color: T.textMuted, flexShrink: 0, fontFamily: FF }}>{totalSlots} t.</span>
      )}

      {/* Add band */}
      {showPlus && (
        <button
          type="button"
          onClick={addBand}
          title="Agregar franja"
          className="kv-hr-plus"
          style={{
            width: 24, height: 24, borderRadius: '50%',
            border: `1.5px dashed ${T.border}`, color: T.textMuted,
            background: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, padding: 0,
          }}
        >
          <Plus size={11} />
        </button>
      )}
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────
function SH({ Icon, children, trailing }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, background: 'rgba(13,148,136,0.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={15} color={T.teal} strokeWidth={2} />
      </div>
      <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.navy, letterSpacing: '-0.2px', fontFamily: FF, flex: 1 }}>
        {children}
      </h2>
      {trailing}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function Horarios() {
  const negocio = useTurnosNegocio();

  const [professionals, setProfessionals] = useState([]);
  const [selectedProf, setSelectedProf]   = useState('');

  const [morning,   setMorning]   = useState({ ...DEFAULT_MORNING });
  const [afternoon, setAfternoon] = useState({ ...DEFAULT_AFTERNOON });
  const [duration, setDuration]   = useState('30');

  const [expandedDay, setExpandedDay]     = useState(null);
  const [daySlots, setDaySlots]           = useState([]);
  const [loadingSlots, setLoadingSlots]   = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const [dateRows, setDateRows]         = useState([]);
  const [dateForm, setDateForm]         = useState(null);
  const [savingDate, setSavingDate]     = useState(false);
  const [deletingDate, setDeletingDate] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);

  // ── Professionals ──────────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from('appointment_professionals')
      .select('id, name')
      .eq('business_id', negocio.id)
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setProfessionals(data || []);
        if (data?.length) {
          const saved = localStorage.getItem(`hn_prof_${negocio.id}`);
          const found = saved ? data.find(p => p.id === saved) : null;
          setSelectedProf(found ? found.id : data[0].id);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedProf) return;
    localStorage.setItem(`hn_prof_${negocio.id}`, selectedProf);
    loadShifts();
    loadDateSchedules();
  }, [selectedProf]);

  // ── Load / save shifts ─────────────────────────────────────────────────
  async function loadShifts() {
    setLoading(true);
    setMorning({ ...DEFAULT_MORNING });
    setAfternoon({ ...DEFAULT_AFTERNOON });
    const { data } = await supabase.from('appointment_bands').select('*').eq('professional_id', selectedProf);
    (data || []).forEach(row => {
      const band = {
        is_active:    row.is_active ?? true,
        start_time:   String(row.start_time).slice(0, 5),
        end_time:     String(row.end_time).slice(0, 5),
        days_of_week: row.days_of_week || [],
      };
      if (row.type === 'morning')   setMorning(band);
      if (row.type === 'afternoon') setAfternoon(band);
      setDuration(String(row.slot_duration_minutes || 30));
    });
    setLoading(false);
  }

  async function saveSchedule() {
    const dur = parseInt(duration, 10);
    if (!dur || dur <= 0) { toast.error('Ingresá una duración válida'); return; }
    setSaving(true);

    const bandRows = [
      { business_id: negocio.id, professional_id: selectedProf, type: 'morning',   slot_duration_minutes: dur, ...morning },
      { business_id: negocio.id, professional_id: selectedProf, type: 'afternoon', slot_duration_minutes: dur, ...afternoon },
    ];
    const { error: bandErr } = await supabase.from('appointment_bands').upsert(bandRows, { onConflict: 'professional_id,type' });
    if (bandErr) { setSaving(false); toast.error('Error al guardar horario'); return; }

    const todayStr = todayISO();
    await supabase.from('appointment_slots').delete().eq('professional_id', selectedProf).gte('specific_date', todayStr);

    const today = new Date();
    const slotsToInsert = [];
    for (let offset = 0; offset < 28; offset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      const dow = date.getDay();
      if (morning.is_active && morning.days_of_week.includes(dow))
        slotsToInsert.push(...generateSlotsForShift(morning, date, dur, negocio.id, selectedProf));
      if (afternoon.is_active && afternoon.days_of_week.includes(dow))
        slotsToInsert.push(...generateSlotsForShift(afternoon, date, dur, negocio.id, selectedProf));
    }
    Object.entries(groupedDates).forEach(([dateStr, shifts]) => {
      if (dateStr < todayStr) return;
      const d = new Date(dateStr + 'T12:00:00');
      ['morning', 'afternoon'].forEach(s => {
        const sh = shifts[s];
        if (sh?.is_active) slotsToInsert.push(...generateSlotsForShift(sh, d, dur, negocio.id, selectedProf));
      });
    });

    if (slotsToInsert.length > 0) {
      const { error: slotErr } = await supabase.from('appointment_slots').insert(slotsToInsert);
      if (slotErr) { setSaving(false); toast.error('Horario guardado, error al generar turnos'); return; }
    }

    setSaving(false);
    toast.success(`Horario guardado · ${slotsToInsert.length} turnos generados`);
  }

  // ── Slot cancellation ──────────────────────────────────────────────────
  async function toggleExpandDay(dateStr) {
    if (expandedDay === dateStr) { setExpandedDay(null); setDaySlots([]); return; }
    setExpandedDay(dateStr);
    setDaySlots([]);
    setLoadingSlots(true);
    const { data } = await supabase
      .from('appointment_slots')
      .select('id, start_time, is_active')
      .eq('professional_id', selectedProf)
      .eq('specific_date', dateStr)
      .order('start_time');
    setDaySlots(data || []);
    setLoadingSlots(false);
  }

  function requestBulkCancel(type) {
    const targets = daySlots.filter(s => {
      if (!s.is_active) return false;
      const t = String(s.start_time).slice(0, 5);
      if (type === 'morning')   return t >= morning.start_time   && t < morning.end_time;
      if (type === 'afternoon') return t >= afternoon.start_time && t < afternoon.end_time;
      return true;
    });
    if (!targets.length) { toast.error('No hay turnos activos para cancelar'); return; }
    const label = type === 'morning' ? 'mañana completa' : type === 'afternoon' ? 'tarde completa' : 'todo el día';
    setConfirmDialog({ type, label, count: targets.length });
  }

  async function cancelBulkSlots(type) {
    const targets = daySlots.filter(s => {
      if (!s.is_active) return false;
      const t = String(s.start_time).slice(0, 5);
      if (type === 'morning')   return t >= morning.start_time   && t < morning.end_time;
      if (type === 'afternoon') return t >= afternoon.start_time && t < afternoon.end_time;
      return true;
    });
    if (!targets.length) return;
    const { error } = await supabase.from('appointment_slots').update({ is_active: false }).in('id', targets.map(s => s.id));
    if (error) { toast.error('Error al cancelar'); return; }
    setDaySlots(prev => prev.map(s => targets.find(t => t.id === s.id) ? { ...s, is_active: false } : s));
    toast.success(`${targets.length} turno${targets.length !== 1 ? 's' : ''} cancelado${targets.length !== 1 ? 's' : ''}`);
  }

  async function cancelSingleSlot(slotId) {
    const { error } = await supabase.from('appointment_slots').update({ is_active: false }).eq('id', slotId);
    if (error) { toast.error('Error al cancelar'); return; }
    setDaySlots(prev => prev.map(s => s.id === slotId ? { ...s, is_active: false } : s));
  }

  // ── Specific dates ─────────────────────────────────────────────────────
  async function loadDateSchedules() {
    const { data } = await supabase
      .from('appointment_date_schedules')
      .select('*')
      .eq('professional_id', selectedProf)
      .gte('specific_date', todayISO())
      .order('specific_date');
    setDateRows(data || []);
  }

  async function saveSpecificDate() {
    if (!dateForm.date) { toast.error('Seleccioná una fecha'); return; }
    if (!dateForm.morning.is_active && !dateForm.afternoon.is_active) { toast.error('Activá al menos una franja'); return; }
    setSavingDate(true);
    const rows = ['morning', 'afternoon'].map(s => ({
      business_id: negocio.id, professional_id: selectedProf,
      specific_date: dateForm.date, shift: s,
      is_active: dateForm[s].is_active, start_time: dateForm[s].start_time, end_time: dateForm[s].end_time,
    }));
    const { error } = await supabase.from('appointment_date_schedules').upsert(rows, { onConflict: 'professional_id,specific_date,shift' });
    setSavingDate(false);
    if (error) { toast.error('Error al guardar'); return; }
    setDateForm(null);
    toast.success('Fecha específica guardada');
    loadDateSchedules();
  }

  async function deleteSpecificDate(dateStr) {
    setDeletingDate(dateStr);
    await supabase.from('appointment_date_schedules').delete().eq('professional_id', selectedProf).eq('specific_date', dateStr);
    setDeletingDate(null);
    toast.success('Fecha eliminada');
    loadDateSchedules();
  }

  // ── Derived ────────────────────────────────────────────────────────────
  const groupedDates = useMemo(() => groupDateSchedules(dateRows), [dateRows]);
  const dur = parseInt(duration, 10) || 0;

  const weeklySlotTotal = useMemo(() => {
    return DAY_ORDER.reduce((sum, dow) => {
      const inM = morning.days_of_week.includes(dow);
      const inA = afternoon.days_of_week.includes(dow);
      return sum + (inM && dur > 0 ? slotCount(morning.start_time, morning.end_time, dur) : 0)
                 + (inA && dur > 0 ? slotCount(afternoon.start_time, afternoon.end_time, dur) : 0);
    }, 0);
  }, [morning, afternoon, dur]);

  const preview = useMemo(() => {
    if (!dur) return [];
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const weeklySet = new Set();
    const result = [];

    for (let offset = 0; offset < 28; offset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      const dow = date.getDay();
      const dateStr = localDateStr(date);
      weeklySet.add(dateStr);

      const hasMorning   = morning.is_active   && morning.days_of_week.includes(dow);
      const hasAfternoon = afternoon.is_active && afternoon.days_of_week.includes(dow);
      if (!hasMorning && !hasAfternoon) continue;

      result.push({
        dateStr,
        label: cap(date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })),
        hasMorning, hasAfternoon,
        mCount: hasMorning   ? slotCount(morning.start_time,   morning.end_time,   dur) : 0,
        aCount: hasAfternoon ? slotCount(afternoon.start_time, afternoon.end_time, dur) : 0,
        isSpecific: false,
      });
    }

    Object.entries(groupedDates).forEach(([dateStr, shifts]) => {
      if (dateStr < todayStr || weeklySet.has(dateStr)) return;
      const m = shifts.morning   || { is_active: false };
      const a = shifts.afternoon || { is_active: false };
      if (!m.is_active && !a.is_active) return;
      const d = new Date(dateStr + 'T12:00:00');
      result.push({
        dateStr,
        label: cap(d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })),
        hasMorning: m.is_active, hasAfternoon: a.is_active,
        mCount: m.is_active ? slotCount(m.start_time, m.end_time, dur) : 0,
        aCount: a.is_active ? slotCount(a.start_time, a.end_time, dur) : 0,
        morningDS: m, afternoonDS: a,
        isSpecific: true,
      });
    });

    return result.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [morning, afternoon, dur, groupedDates]);

  // ── Empty state (no professionals) ────────────────────────────────────
  if (professionals.length === 0 && !loading) {
    return (
      <div style={{ fontFamily: FF, maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <style>{STYLES}</style>
        <div style={{ background: GH, borderRadius: 18, padding: '22px 22px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.20) 0%, transparent 68%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(13,148,136,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={15} color={T.tealLight} strokeWidth={2} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.6, color: T.tealLight, textTransform: 'uppercase' }}>KYVRA · HORARIOS</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.3px' }}>Horarios</h1>
          </div>
        </div>
        <div style={{ ...CARD, padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(13,148,136,0.08)', border: '1.5px solid rgba(13,148,136,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={26} color={T.teal} strokeWidth={1.5} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.navy }}>Sin profesionales</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: T.textMuted }}>Primero agregá profesionales en la sección Profesionales</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: FF, maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{STYLES}</style>

      {/* ── Hero ── */}
      <div style={{ background: GH, borderRadius: 18, padding: '22px 22px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.20) 0%, transparent 68%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: 60, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(94,234,212,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(13,148,136,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={15} color={T.tealLight} strokeWidth={2} />
                </div>
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.6, color: T.tealLight, textTransform: 'uppercase' }}>KYVRA · HORARIOS</span>
              </div>
              <h1 style={{ margin: '0 0 10px', fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.3px' }}>Horarios</h1>
              {dur > 0 && weeklySlotTotal > 0 && (
                <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(13,148,136,0.18)', color: T.tealLight, border: '1px solid rgba(13,148,136,0.25)' }}>
                  {weeklySlotTotal} turnos/semana
                </span>
              )}
            </div>

            {/* Professional selector */}
            {professionals.length > 1 && (
              <select
                value={selectedProf}
                onChange={e => setSelectedProf(e.target.value)}
                className="kv-hr-input"
                style={{
                  ...IST,
                  background: 'rgba(255,255,255,0.08)', color: '#fff',
                  border: '1.5px solid rgba(255,255,255,0.15)',
                  borderRadius: 10, cursor: 'pointer', alignSelf: 'flex-start',
                  marginTop: 2,
                }}
              >
                {professionals.map(p => <option key={p.id} value={p.id} style={{ background: T.navy }}>{p.name}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '48px 0' }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            border: `2.5px solid ${T.border}`, borderTopColor: T.teal,
            animation: 'spin 0.7s linear infinite',
          }} />
          <span style={{ fontSize: 13, color: T.textMuted, fontFamily: FF }}>Cargando horarios…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <>
          {/* ── Franjas horarias ── */}
          <div style={{ ...CARD, padding: 20 }}>
            <SH Icon={Sun}>Franjas horarias</SH>

            {/* Franja 1 – morning */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 96, flexShrink: 0 }}>
                <Sun size={14} color="#F59E0B" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#B45309', fontFamily: FF }}>Franja 1</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="time" value={morning.start_time}
                  onChange={e => setMorning(m => ({ ...m, start_time: e.target.value }))}
                  className="kv-hr-input"
                  style={{ ...IST, width: 112 }}
                />
                <span style={{ color: T.textMuted, fontSize: 13 }}>–</span>
                <input
                  type="time" value={morning.end_time}
                  onChange={e => setMorning(m => ({ ...m, end_time: e.target.value }))}
                  className="kv-hr-input"
                  style={{ ...IST, width: 112 }}
                />
                {dur > 0 && (
                  <span style={{ fontSize: 12, color: T.textMuted, fontFamily: FF }}>
                    {slotCount(morning.start_time, morning.end_time, dur)} turnos/día
                  </span>
                )}
              </div>
            </div>

            {/* Franja 2 – afternoon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 96, flexShrink: 0 }}>
                <Sunset size={14} color={T.teal} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T.tealDark, fontFamily: FF }}>Franja 2</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="time" value={afternoon.start_time}
                  onChange={e => setAfternoon(a => ({ ...a, start_time: e.target.value }))}
                  className="kv-hr-input"
                  style={{ ...IST, width: 112 }}
                />
                <span style={{ color: T.textMuted, fontSize: 13 }}>–</span>
                <input
                  type="time" value={afternoon.end_time}
                  onChange={e => setAfternoon(a => ({ ...a, end_time: e.target.value }))}
                  className="kv-hr-input"
                  style={{ ...IST, width: 112 }}
                />
                {dur > 0 && (
                  <span style={{ fontSize: 12, color: T.textMuted, fontFamily: FF }}>
                    {slotCount(afternoon.start_time, afternoon.end_time, dur)} turnos/día
                  </span>
                )}
              </div>
            </div>

            <p style={{ margin: 0, fontSize: 12, color: T.textMuted, fontFamily: FF }}>
              Los horarios aplican a todos los días que tengan esa franja activada.
            </p>
          </div>

          {/* ── Duration ── */}
          <div style={{ ...CARD, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(13,148,136,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={15} color={T.teal} strokeWidth={2} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.navy, flexShrink: 0, fontFamily: FF }}>Duración del turno</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number" min="1" max="480" placeholder="ej: 30"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                onBlur={() => { const v = parseInt(duration, 10); setDuration(v > 0 ? String(v) : ''); }}
                className="kv-hr-input"
                style={{ ...IST, width: 80, textAlign: 'center' }}
              />
              <span style={{ fontSize: 13, color: T.textSec, fontFamily: FF }}>minutos</span>
            </div>
          </div>

          {/* ── Days of week ── */}
          <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: `1.5px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(13,148,136,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CalendarDays size={15} color={T.teal} strokeWidth={2} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: T.navy, fontFamily: FF }}>Días de atención</span>
              </div>
            </div>
            {DAY_ORDER.map((dow, idx) => (
              <DayRow
                key={dow} dow={dow}
                morning={morning}     setMorning={setMorning}
                afternoon={afternoon} setAfternoon={setAfternoon}
                dur={dur}
                isLast={idx === DAY_ORDER.length - 1}
              />
            ))}
          </div>

          {/* ── Specific dates ── */}
          <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: `1.5px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(13,148,136,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CalendarPlus size={15} color={T.teal} strokeWidth={2} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: T.navy, fontFamily: FF }}>Fechas específicas</span>
              </div>
              {!dateForm && (
                <button
                  onClick={() => setDateForm({ ...EMPTY_DATE_FORM })}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 8,
                    background: 'rgba(13,148,136,0.09)', color: T.teal,
                    border: '1px solid rgba(13,148,136,0.20)', cursor: 'pointer', fontFamily: FF,
                  }}
                >
                  <Plus size={13} /> Agregar fecha
                </button>
              )}
            </div>

            {dateForm && (
              <div style={{ padding: 16, background: 'rgba(13,148,136,0.04)', borderBottom: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="date" min={todayISO()} value={dateForm.date}
                    onChange={e => setDateForm(f => ({ ...f, date: e.target.value }))}
                    className="kv-hr-input"
                    style={{ ...IST, flex: 1 }}
                  />
                  <button
                    onClick={() => setDateForm(null)}
                    style={{ width: 32, height: 32, borderRadius: 8, background: 'none', border: `1.5px solid ${T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted }}
                  >
                    <X size={14} />
                  </button>
                </div>

                {['morning', 'afternoon'].map(shift => {
                  const s = dateForm[shift];
                  const isM = shift === 'morning';
                  return (
                    <div
                      key={shift}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                        borderRadius: 10, padding: '10px 12px',
                        background: s.is_active
                          ? (isM ? '#FFFBEB' : 'rgba(13,148,136,0.07)')
                          : T.white,
                        border: `1.5px solid ${s.is_active ? (isM ? '#FDE68A' : 'rgba(13,148,136,0.20)') : T.border}`,
                      }}
                    >
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', width: 110, flexShrink: 0 }}>
                        <input
                          type="checkbox" checked={s.is_active}
                          onChange={e => setDateForm(f => ({ ...f, [shift]: { ...f[shift], is_active: e.target.checked } }))}
                          style={{ width: 15, height: 15, accentColor: T.teal, cursor: 'pointer' }}
                        />
                        {isM
                          ? <Sun size={13} color={s.is_active ? '#F59E0B' : T.textMuted} />
                          : <Sunset size={13} color={s.is_active ? T.teal : T.textMuted} />}
                        <span style={{ fontSize: 12, fontWeight: 700, color: s.is_active ? (isM ? '#B45309' : T.tealDark) : T.textMuted, fontFamily: FF }}>
                          {isM ? 'Mañana' : 'Tarde'}
                        </span>
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="time" value={s.start_time} disabled={!s.is_active}
                          onChange={e => setDateForm(f => ({ ...f, [shift]: { ...f[shift], start_time: e.target.value } }))}
                          className="kv-hr-input"
                          style={{ ...IST, width: 112 }}
                        />
                        <span style={{ color: T.textMuted, fontSize: 13 }}>–</span>
                        <input
                          type="time" value={s.end_time} disabled={!s.is_active}
                          onChange={e => setDateForm(f => ({ ...f, [shift]: { ...f[shift], end_time: e.target.value } }))}
                          className="kv-hr-input"
                          style={{ ...IST, width: 112 }}
                        />
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={saveSpecificDate} disabled={savingDate}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7, alignSelf: 'flex-start',
                    padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                    background: savingDate ? T.border : GTEAL,
                    color: savingDate ? T.textMuted : '#fff',
                    border: 'none', cursor: savingDate ? 'default' : 'pointer',
                    fontFamily: FF, boxShadow: savingDate ? 'none' : '0 3px 10px rgba(13,148,136,0.28)',
                  }}
                >
                  {savingDate ? 'Guardando…' : 'Guardar fecha'}
                </button>
              </div>
            )}

            {Object.keys(groupedDates).length === 0 && !dateForm ? (
              <div style={{ padding: '24px 20px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 12, color: T.textMuted, fontFamily: FF }}>
                  Para días especiales fuera del horario habitual.
                </p>
              </div>
            ) : (
              <div>
                {Object.entries(groupedDates).sort(([a], [b]) => a.localeCompare(b)).map(([dateStr, shifts], idx, arr) => {
                  const d = new Date(dateStr + 'T12:00:00');
                  const label = cap(d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }));
                  return (
                    <div
                      key={dateStr}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '12px 16px',
                        borderBottom: idx < arr.length - 1 ? `1px solid ${T.border}` : 'none',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: FF }}>{label}</p>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {shifts.morning?.is_active && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, background: '#FFFBEB', color: '#92400E', padding: '3px 8px', borderRadius: 8, fontFamily: FF }}>
                              <Sun size={10} /> {shifts.morning.start_time} – {shifts.morning.end_time}
                            </span>
                          )}
                          {shifts.afternoon?.is_active && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, background: 'rgba(13,148,136,0.09)', color: T.tealDark, padding: '3px 8px', borderRadius: 8, fontFamily: FF }}>
                              <Sunset size={10} /> {shifts.afternoon.start_time} – {shifts.afternoon.end_time}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteSpecificDate(dateStr)}
                        disabled={deletingDate === dateStr}
                        className="kv-hr-del"
                        style={{ width: 30, height: 30, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, flexShrink: 0 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Save button ── */}
          <button
            onClick={saveSchedule}
            disabled={saving}
            style={{
              width: '100%', padding: '14px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              background: saving ? T.border : GTEAL,
              color: saving ? T.textMuted : '#fff',
              border: 'none', cursor: saving ? 'default' : 'pointer', fontFamily: FF,
              boxShadow: saving ? 'none' : '0 4px 14px rgba(13,148,136,0.32)',
              transition: 'opacity 0.15s',
            }}
          >
            {saving ? 'Guardando y generando turnos…' : 'Guardar horario'}
          </button>

          {/* ── Preview ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(13,148,136,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CalendarDays size={15} color={T.teal} strokeWidth={2} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: T.navy, flex: 1, fontFamily: FF }}>Vista previa — próximas 4 semanas</span>
              {preview.length > 0 && (
                <span style={{ fontSize: 12, color: T.textMuted, fontFamily: FF }}>
                  {preview.length} días · {preview.reduce((s, d) => s + d.mCount + d.aCount, 0)} turnos
                </span>
              )}
            </div>

            {preview.length === 0 ? (
              <div style={{ ...CARD, padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(13,148,136,0.07)', border: '1.5px solid rgba(13,148,136,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarDays size={24} color={T.teal} strokeWidth={1.5} />
                </div>
                <p style={{ margin: 0, fontSize: 13, color: T.textMuted, fontFamily: FF }}>
                  {!dur ? 'Ingresá una duración para ver la vista previa' : 'Activá al menos un día en el horario semanal'}
                </p>
              </div>
            ) : (
              <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
                {preview.map((item, idx) => {
                  const isExpanded = expandedDay === item.dateStr;
                  const mSlots = isExpanded ? daySlots.filter(s => { const t = String(s.start_time).slice(0, 5); return t >= morning.start_time && t < morning.end_time; }) : [];
                  const aSlots = isExpanded ? daySlots.filter(s => { const t = String(s.start_time).slice(0, 5); return t >= afternoon.start_time && t < afternoon.end_time; }) : [];
                  return (
                    <div
                      key={item.dateStr}
                      style={{
                        borderBottom: idx < preview.length - 1 ? `1px solid ${T.border}` : 'none',
                        background: item.isSpecific ? 'rgba(13,148,136,0.03)' : T.white,
                      }}
                    >
                      <button
                        onClick={() => toggleExpandDay(item.dateStr)}
                        className="kv-hr-expand"
                        style={{
                          width: '100%', padding: '11px 16px',
                          display: 'flex', alignItems: 'center', gap: 10,
                          textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                          transition: 'background 0.12s',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: FF }}>{item.label}</span>
                            {item.isSpecific && (
                              <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(13,148,136,0.12)', color: T.teal, padding: '2px 7px', borderRadius: 20, fontFamily: FF }}>específica</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {item.hasMorning && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, background: '#FFFBEB', color: '#92400E', padding: '3px 8px', borderRadius: 8, fontFamily: FF }}>
                                <Sun size={10} />
                                {item.isSpecific ? `${item.morningDS?.start_time} – ${item.morningDS?.end_time}` : `${morning.start_time} – ${morning.end_time}`}
                                · {item.mCount} turnos
                              </span>
                            )}
                            {item.hasAfternoon && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, background: 'rgba(13,148,136,0.09)', color: T.tealDark, padding: '3px 8px', borderRadius: 8, fontFamily: FF }}>
                                <Sunset size={10} />
                                {item.isSpecific ? `${item.afternoonDS?.start_time} – ${item.afternoonDS?.end_time}` : `${afternoon.start_time} – ${afternoon.end_time}`}
                                · {item.aCount} turnos
                              </span>
                            )}
                          </div>
                        </div>
                        {isExpanded
                          ? <ChevronUp size={14} color={T.textMuted} style={{ flexShrink: 0 }} />
                          : <ChevronDown size={14} color={T.textMuted} style={{ flexShrink: 0 }} />}
                      </button>

                      {isExpanded && (
                        <div style={{ padding: '10px 16px 14px', background: T.bg, borderTop: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {loadingSlots ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                              <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${T.border}`, borderTopColor: T.teal, animation: 'spin 0.7s linear infinite' }} />
                              <span style={{ fontSize: 12, color: T.textMuted, fontFamily: FF }}>Cargando turnos…</span>
                            </div>
                          ) : daySlots.length === 0 ? (
                            <p style={{ margin: 0, fontSize: 12, color: T.textMuted, padding: '8px 0', fontFamily: FF }}>
                              No hay turnos generados para este día. Guardá el horario primero.
                            </p>
                          ) : (
                            <>
                              {/* Bulk cancel buttons */}
                              {(() => {
                                const activeMorning   = mSlots.filter(s => s.is_active).length;
                                const activeAfternoon = aSlots.filter(s => s.is_active).length;
                                const activeAll = activeMorning + activeAfternoon;
                                if (!activeAll) return null;
                                return (
                                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {item.hasMorning && activeMorning > 0 && (
                                      <button
                                        onClick={() => requestBulkCancel('morning')}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8, background: 'none', border: '1.5px solid #FECACA', color: '#DC2626', cursor: 'pointer', fontFamily: FF }}
                                      >
                                        <Sun size={11} /> Cancelar mañana ({activeMorning})
                                      </button>
                                    )}
                                    {item.hasAfternoon && activeAfternoon > 0 && (
                                      <button
                                        onClick={() => requestBulkCancel('afternoon')}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8, background: 'none', border: '1.5px solid #FECACA', color: '#DC2626', cursor: 'pointer', fontFamily: FF }}
                                      >
                                        <Sunset size={11} /> Cancelar tarde ({activeAfternoon})
                                      </button>
                                    )}
                                    {item.hasMorning && item.hasAfternoon && activeAll > 0 && (
                                      <button
                                        onClick={() => requestBulkCancel('all')}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8, background: 'none', border: '1.5px solid #FCA5A5', color: '#B91C1C', cursor: 'pointer', fontFamily: FF }}
                                      >
                                        Cancelar todo el día ({activeAll})
                                      </button>
                                    )}
                                  </div>
                                );
                              })()}

                              {item.hasMorning && mSlots.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <Sun size={11} color="#F59E0B" />
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#B45309', fontFamily: FF }}>Mañana</span>
                                    <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 2, fontFamily: FF }}>
                                      {mSlots.filter(s => s.is_active).length}/{mSlots.length} activos
                                    </span>
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 4 }}>
                                    {mSlots.map(slot => {
                                      const st = String(slot.start_time).slice(0, 5);
                                      return (
                                        <div
                                          key={slot.id}
                                          style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '4px 8px', borderRadius: 8,
                                            background: slot.is_active ? T.white : T.bg,
                                            border: slot.is_active ? '1px solid #FDE68A' : `1px solid ${T.border}`,
                                            opacity: slot.is_active ? 1 : 0.5,
                                          }}
                                        >
                                          <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: slot.is_active ? '#92400E' : T.textMuted, textDecoration: slot.is_active ? 'none' : 'line-through' }}>{st}</span>
                                          {slot.is_active && (
                                            <button onClick={() => cancelSingleSlot(slot.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F87171', padding: 0, display: 'flex', marginLeft: 3 }}>
                                              <X size={10} />
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {item.hasAfternoon && aSlots.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <Sunset size={11} color={T.teal} />
                                    <span style={{ fontSize: 11, fontWeight: 700, color: T.tealDark, fontFamily: FF }}>Tarde</span>
                                    <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 2, fontFamily: FF }}>
                                      {aSlots.filter(s => s.is_active).length}/{aSlots.length} activos
                                    </span>
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 4 }}>
                                    {aSlots.map(slot => {
                                      const st = String(slot.start_time).slice(0, 5);
                                      return (
                                        <div
                                          key={slot.id}
                                          style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '4px 8px', borderRadius: 8,
                                            background: slot.is_active ? T.white : T.bg,
                                            border: slot.is_active ? `1px solid rgba(13,148,136,0.25)` : `1px solid ${T.border}`,
                                            opacity: slot.is_active ? 1 : 0.5,
                                          }}
                                        >
                                          <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: slot.is_active ? T.tealDark : T.textMuted, textDecoration: slot.is_active ? 'none' : 'line-through' }}>{st}</span>
                                          {slot.is_active && (
                                            <button onClick={() => cancelSingleSlot(slot.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F87171', padding: 0, display: 'flex', marginLeft: 3 }}>
                                              <X size={10} />
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p style={{ margin: 0, fontSize: 12, color: T.textMuted, padding: '0 4px', fontFamily: FF, lineHeight: 1.5 }}>
            "Guardar horario" convierte la plantilla semanal en turnos para los próximos 28 días. Hacé click en un día de la vista previa para cancelar turnos puntuales.
          </p>
        </>
      )}

      {/* ── Confirmation modal ── */}
      {confirmDialog && (
        <div
          onClick={() => setConfirmDialog(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(2px)' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: T.white, borderRadius: 18, boxShadow: '0 20px 60px rgba(15,23,42,0.18)', padding: 24, margin: '0 16px', maxWidth: 360, width: '100%' }}
          >
            <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: T.navy, fontFamily: FF }}>
              ¿Cancelar {confirmDialog.label}?
            </p>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: T.textSec, lineHeight: 1.5, fontFamily: FF }}>
              Se cancelarán <strong>{confirmDialog.count}</strong> turno{confirmDialog.count !== 1 ? 's' : ''}. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDialog(null)}
                style={{ padding: '9px 16px', fontSize: 13, fontWeight: 700, color: T.textSec, background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 10, cursor: 'pointer', fontFamily: FF }}
              >
                No, volver
              </button>
              <button
                onClick={() => { const d = confirmDialog; setConfirmDialog(null); cancelBulkSlots(d.type); }}
                style={{ padding: '9px 16px', fontSize: 13, fontWeight: 700, color: '#fff', background: '#DC2626', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: FF, boxShadow: '0 2px 8px rgba(220,38,38,0.30)' }}
              >
                Sí, cancelar {confirmDialog.count} turno{confirmDialog.count !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
