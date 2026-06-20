import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useTurnosNegocio } from '../../contexts/TurnosNegocioContext.js';
import toast from 'react-hot-toast';
import { Zap, CalendarDays, CalendarPlus, Sun, Sunset, Clock, ChevronDown, ChevronUp, Trash2, Plus, X } from 'lucide-react';

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABEL = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 0: 'Dom' };

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
      specific_date: date.toISOString().slice(0, 10),
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
const todayISO = () => new Date().toISOString().slice(0, 10);

// ── Day toggle button ──────────────────────────────────────────────────────
function DayButton({ dow, active, disabled, onClick, color }) {
  const on = active;
  const base = 'w-9 h-9 rounded-lg text-xs font-bold transition-colors shrink-0';
  const off = 'bg-gray-100 text-gray-400';
  const onStyle = color === 'amber'
    ? 'bg-amber-500 text-white'
    : 'bg-indigo-500 text-white';
  const hov = disabled ? 'cursor-not-allowed opacity-40' : (color === 'amber' ? 'hover:bg-amber-100' : 'hover:bg-indigo-100');
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className={`${base} ${on ? onStyle : `${off} ${hov}`}`}>
      {DAY_LABEL[dow]}
    </button>
  );
}

// ── Shift card (Mañana / Tarde) ────────────────────────────────────────────
function ShiftCard({ label, color, shift, dur, onChange }) {
  const isAmber = color === 'amber';
  const Icon = isAmber ? Sun : Sunset;
  const activeBg = isAmber ? 'bg-amber-50 border-amber-200' : 'bg-indigo-50 border-indigo-200';
  const activeLabel = isAmber ? 'text-amber-800' : 'text-indigo-800';

  function toggleDay(dow) {
    const days = shift.days_of_week.includes(dow)
      ? shift.days_of_week.filter(d => d !== dow)
      : [...shift.days_of_week, dow];
    onChange({ ...shift, days_of_week: days });
  }

  return (
    <div className={`rounded-2xl border ${shift.is_active ? activeBg : 'bg-white border-gray-200'} p-4 space-y-4 transition-colors`}>
      {/* Header: checkbox + label + time range */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={shift.is_active}
            onChange={e => onChange({ ...shift, is_active: e.target.checked })}
            className="w-4 h-4 accent-[#e31b23]"
          />
          <Icon size={15} className={shift.is_active ? (isAmber ? 'text-amber-500' : 'text-indigo-500') : 'text-gray-300'} />
          <span className={`text-sm font-bold ${shift.is_active ? activeLabel : 'text-gray-400'}`}>{label}</span>
        </label>
        <div className="flex items-center gap-2 ml-1">
          <input
            type="time"
            value={shift.start_time}
            disabled={!shift.is_active}
            onChange={e => onChange({ ...shift, start_time: e.target.value })}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e31b23]/30 disabled:text-gray-300 disabled:bg-white w-[110px]"
          />
          <span className="text-gray-400 text-sm">–</span>
          <input
            type="time"
            value={shift.end_time}
            disabled={!shift.is_active}
            onChange={e => onChange({ ...shift, end_time: e.target.value })}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e31b23]/30 disabled:text-gray-300 disabled:bg-white w-[110px]"
          />
        </div>
        {shift.is_active && dur > 0 && (
          <span className={`text-xs font-medium ml-auto ${isAmber ? 'text-amber-600' : 'text-indigo-600'}`}>
            {slotCount(shift.start_time, shift.end_time, dur)} turnos/día
          </span>
        )}
      </div>

      {/* Day toggles */}
      <div className="flex gap-1.5 flex-wrap">
        {DAY_ORDER.map(dow => (
          <DayButton
            key={dow}
            dow={dow}
            active={shift.days_of_week.includes(dow)}
            disabled={!shift.is_active}
            onClick={() => toggleDay(dow)}
            color={color}
          />
        ))}
      </div>

      {shift.is_active && shift.days_of_week.length > 0 && dur > 0 && (
        <p className={`text-xs ${isAmber ? 'text-amber-600' : 'text-indigo-600'}`}>
          Activo: {shift.days_of_week.map(d => DAY_LABEL[d]).join(', ')} · {slotCount(shift.start_time, shift.end_time, dur) * shift.days_of_week.length} turnos/semana
        </p>
      )}
    </div>
  );
}

export default function Horarios() {
  const negocio = useTurnosNegocio();

  const [professionals, setProfessionals] = useState([]);
  const [selectedProf, setSelectedProf] = useState('');

  // Fixed two-shift system
  const [morning,   setMorning]   = useState({ ...DEFAULT_MORNING });
  const [afternoon, setAfternoon] = useState({ ...DEFAULT_AFTERNOON });
  const [duration, setDuration]   = useState('30');

  // Slot cancellation
  const [expandedDay, setExpandedDay]       = useState(null);
  const [daySlots, setDaySlots]             = useState([]);
  const [loadingSlots, setLoadingSlots]     = useState(false);
  const [cancellingShift, setCancellingShift] = useState(null);

  // Specific dates
  const [dateRows, setDateRows]     = useState([]);
  const [dateForm, setDateForm]     = useState(null);
  const [savingDate, setSavingDate] = useState(false);
  const [deletingDate, setDeletingDate] = useState(null);

  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [generating, setGenerating] = useState(false);

  // ── Professionals ────────────────────────────────────────────────────────
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

  // ── Load / save shifts ───────────────────────────────────────────────────
  async function loadShifts() {
    setLoading(true);
    setMorning({ ...DEFAULT_MORNING });
    setAfternoon({ ...DEFAULT_AFTERNOON });

    const { data } = await supabase
      .from('appointment_bands')
      .select('*')
      .eq('professional_id', selectedProf);

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
    const rows = [
      { business_id: negocio.id, professional_id: selectedProf, type: 'morning',   slot_duration_minutes: dur, ...morning },
      { business_id: negocio.id, professional_id: selectedProf, type: 'afternoon', slot_duration_minutes: dur, ...afternoon },
    ];
    const { error } = await supabase
      .from('appointment_bands')
      .upsert(rows, { onConflict: 'professional_id,type' });
    setSaving(false);
    if (error) { toast.error('Error al guardar'); return; }
    toast.success('Horario guardado');
  }

  // ── Slot cancellation ────────────────────────────────────────────────────
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

  async function cancelShiftSlots(shift) {
    const band = shift === 'morning' ? morning : afternoon;
    const targets = daySlots.filter(s => {
      const t = String(s.start_time).slice(0, 5);
      return t >= band.start_time && t < band.end_time && s.is_active;
    });
    if (!targets.length) { toast.error('No hay turnos activos para cancelar'); return; }
    setCancellingShift(shift);
    const { error } = await supabase
      .from('appointment_slots')
      .update({ is_active: false })
      .in('id', targets.map(s => s.id));
    setCancellingShift(null);
    if (error) { toast.error('Error al cancelar'); return; }
    setDaySlots(prev => prev.map(s => targets.find(t => t.id === s.id) ? { ...s, is_active: false } : s));
    toast.success('Franja cancelada para ese día');
  }

  async function cancelSingleSlot(slotId) {
    const { error } = await supabase
      .from('appointment_slots')
      .update({ is_active: false })
      .eq('id', slotId);
    if (error) { toast.error('Error al cancelar'); return; }
    setDaySlots(prev => prev.map(s => s.id === slotId ? { ...s, is_active: false } : s));
  }

  // ── Specific dates ───────────────────────────────────────────────────────
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
    const { error } = await supabase
      .from('appointment_date_schedules')
      .upsert(rows, { onConflict: 'professional_id,specific_date,shift' });
    setSavingDate(false);
    if (error) { toast.error('Error al guardar'); return; }
    setDateForm(null);
    toast.success('Fecha específica guardada');
    loadDateSchedules();
  }

  async function deleteSpecificDate(dateStr) {
    setDeletingDate(dateStr);
    await supabase.from('appointment_date_schedules').delete()
      .eq('professional_id', selectedProf).eq('specific_date', dateStr);
    setDeletingDate(null);
    toast.success('Fecha eliminada');
    loadDateSchedules();
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const groupedDates = useMemo(() => groupDateSchedules(dateRows), [dateRows]);
  const dur = parseInt(duration, 10) || 0;

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
      const dateStr = date.toISOString().slice(0, 10);
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

  // ── Generate slots ───────────────────────────────────────────────────────
  async function generateSlots() {
    if (!dur) { toast.error('Ingresá una duración válida'); return; }
    setGenerating(true);
    const today = new Date();
    const slotsToInsert = [];

    for (let offset = 0; offset < 28; offset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      const dow = date.getDay();
      if (morning.is_active   && morning.days_of_week.includes(dow))
        slotsToInsert.push(...generateSlotsForShift(morning,   date, dur, negocio.id, selectedProf));
      if (afternoon.is_active && afternoon.days_of_week.includes(dow))
        slotsToInsert.push(...generateSlotsForShift(afternoon, date, dur, negocio.id, selectedProf));
    }

    const todayStr = today.toISOString().slice(0, 10);
    Object.entries(groupedDates).forEach(([dateStr, shifts]) => {
      if (dateStr < todayStr) return;
      const d = new Date(dateStr + 'T12:00:00');
      ['morning', 'afternoon'].forEach(s => {
        const sh = shifts[s];
        if (sh?.is_active) slotsToInsert.push(...generateSlotsForShift(sh, d, dur, negocio.id, selectedProf));
      });
    });

    const { data: existing } = await supabase
      .from('appointment_slots').select('specific_date, start_time')
      .eq('professional_id', selectedProf).gte('specific_date', todayStr);
    const existingSet = new Set((existing || []).map(s => `${s.specific_date}_${String(s.start_time).slice(0, 5)}`));
    const newSlots = slotsToInsert.filter(s => !existingSet.has(`${s.specific_date}_${s.start_time}`));

    if (newSlots.length > 0) {
      const { error } = await supabase.from('appointment_slots').insert(newSlots);
      if (error) { toast.error('Error al generar turnos'); setGenerating(false); return; }
    }
    setGenerating(false);
    toast.success(`${newSlots.length} turnos generados`);
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (professionals.length === 0 && !loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Horarios</h1>
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
          <p className="text-gray-400 text-sm">Primero agregá profesionales en la sección Profesionales</p>
        </div>
      </div>
    );
  }

  // ── Helper: slot counts for expanded day ─────────────────────────────────
  function shiftSlotSummary(shift) {
    const band = shift === 'morning' ? morning : afternoon;
    if (!band.is_active) return null;
    const all    = daySlots.filter(s => { const t = String(s.start_time).slice(0, 5); return t >= band.start_time && t < band.end_time; });
    const active = all.filter(s => s.is_active);
    return { total: all.length, active: active.length };
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-gray-900">Horarios</h1>
        {professionals.length > 1 && (
          <select value={selectedProf} onChange={e => setSelectedProf(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30">
            {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      {/* Duration */}
      <div className="bg-white rounded-2xl px-5 py-4 shadow-sm flex items-center gap-4 flex-wrap">
        <Clock size={15} className="text-gray-400 shrink-0" />
        <span className="text-sm font-semibold text-gray-700 shrink-0">Duración del turno</span>
        <div className="flex items-center gap-2">
          <input
            type="number" min="1" max="480" placeholder="ej: 30"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            onBlur={() => { const v = parseInt(duration, 10); setDuration(v > 0 ? String(v) : ''); }}
            className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30"
          />
          <span className="text-sm text-gray-500">minutos</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#e31b23] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Two fixed shifts ─────────────────────────────────────────── */}
          <div className="space-y-3">
            <ShiftCard label="Turno Mañana"  color="amber"  shift={morning}   dur={dur} onChange={setMorning} />
            <ShiftCard label="Turno Tarde"   color="indigo" shift={afternoon} dur={dur} onChange={setAfternoon} />
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveSchedule}
              disabled={saving}
              className="flex-1 bg-[#e31b23] hover:bg-[#c41520] disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar horario'}
            </button>
            <button
              onClick={generateSlots}
              disabled={generating || !dur}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              <Zap size={14} />
              {generating ? 'Generando...' : 'Generar turnos (4 sem.)'}
            </button>
          </div>

          {/* ── Fechas específicas ────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarPlus size={16} className="text-[#e31b23]" />
                <h2 className="text-sm font-semibold text-gray-800">Fechas específicas</h2>
              </div>
              {!dateForm && (
                <button onClick={() => setDateForm({ ...EMPTY_DATE_FORM })}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#e31b23] hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                  <Plus size={13} /> Agregar fecha
                </button>
              )}
            </div>

            {dateForm && (
              <div className="px-4 py-4 bg-gray-50 border-b border-gray-100 space-y-3">
                <div className="flex items-center gap-3">
                  <input type="date" min={todayISO()} value={dateForm.date}
                    onChange={e => setDateForm(f => ({ ...f, date: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30 bg-white" />
                  <button onClick={() => setDateForm(null)} className="ml-auto p-1.5 text-gray-400 hover:bg-gray-200 rounded-lg"><X size={14} /></button>
                </div>
                {['morning', 'afternoon'].map(shift => {
                  const s = dateForm[shift]; const isM = shift === 'morning';
                  return (
                    <div key={shift} className={`flex items-center gap-3 flex-wrap rounded-xl px-3 py-2 ${s.is_active ? (isM ? 'bg-amber-50' : 'bg-indigo-50') : 'bg-white border border-gray-100'}`}>
                      <label className="flex items-center gap-2 cursor-pointer w-32 shrink-0">
                        <input type="checkbox" checked={s.is_active}
                          onChange={e => setDateForm(f => ({ ...f, [shift]: { ...f[shift], is_active: e.target.checked } }))}
                          className="w-4 h-4 accent-[#e31b23]" />
                        {isM ? <Sun size={13} className={s.is_active ? 'text-amber-500' : 'text-gray-400'} />
                               : <Sunset size={13} className={s.is_active ? 'text-indigo-500' : 'text-gray-400'} />}
                        <span className={`text-xs font-semibold ${s.is_active ? (isM ? 'text-amber-700' : 'text-indigo-700') : 'text-gray-400'}`}>{isM ? 'Mañana' : 'Tarde'}</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input type="time" value={s.start_time} disabled={!s.is_active}
                          onChange={e => setDateForm(f => ({ ...f, [shift]: { ...f[shift], start_time: e.target.value } }))}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none disabled:text-gray-300 w-[110px]" />
                        <span className="text-gray-400">–</span>
                        <input type="time" value={s.end_time} disabled={!s.is_active}
                          onChange={e => setDateForm(f => ({ ...f, [shift]: { ...f[shift], end_time: e.target.value } }))}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none disabled:text-gray-300 w-[110px]" />
                      </div>
                    </div>
                  );
                })}
                <button onClick={saveSpecificDate} disabled={savingDate}
                  className="bg-[#e31b23] hover:bg-[#c41520] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                  {savingDate ? 'Guardando...' : 'Guardar fecha'}
                </button>
              </div>
            )}

            {Object.keys(groupedDates).length === 0 && !dateForm ? (
              <div className="px-4 py-5 text-center">
                <p className="text-gray-400 text-xs">Para días especiales fuera del horario habitual.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {Object.entries(groupedDates).sort(([a], [b]) => a.localeCompare(b)).map(([dateStr, shifts]) => {
                  const d = new Date(dateStr + 'T12:00:00');
                  const label = cap(d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }));
                  return (
                    <div key={dateStr} className="px-4 py-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{label}</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {shifts.morning?.is_active && (
                            <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg font-medium">
                              <Sun size={10} /> {shifts.morning.start_time} – {shifts.morning.end_time}
                            </span>
                          )}
                          {shifts.afternoon?.is_active && (
                            <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg font-medium">
                              <Sunset size={10} /> {shifts.afternoon.start_time} – {shifts.afternoon.end_time}
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => deleteSpecificDate(dateStr)} disabled={deletingDate === dateStr}
                        className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Vista previa ──────────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">Vista previa — próximas 4 semanas</h2>
              {preview.length > 0 && (
                <span className="ml-auto text-xs text-gray-400">
                  {preview.length} días · {preview.reduce((s, d) => s + d.mCount + d.aCount, 0)} turnos
                </span>
              )}
            </div>

            {preview.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <CalendarDays size={28} className="mx-auto text-gray-200 mb-2" />
                <p className="text-gray-400 text-sm">
                  {!dur ? 'Ingresá una duración para ver la vista previa' : 'Activá al menos un turno y elegí días'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {preview.map((item) => {
                    const isExpanded = expandedDay === item.dateStr;
                    const mSlots = isExpanded ? daySlots.filter(s => { const t = String(s.start_time).slice(0, 5); return t >= morning.start_time && t < morning.end_time; }) : [];
                    const aSlots = isExpanded ? daySlots.filter(s => { const t = String(s.start_time).slice(0, 5); return t >= afternoon.start_time && t < afternoon.end_time; }) : [];
                    return (
                      <div key={item.dateStr} className={`${item.isSpecific ? 'bg-purple-50/40' : ''}`}>
                        {/* Day row */}
                        <button
                          onClick={() => toggleExpandDay(item.dateStr)}
                          className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50/60 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">{item.label}</span>
                              {item.isSpecific && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">específica</span>}
                            </div>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              {item.hasMorning && (
                                <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg font-medium">
                                  <Sun size={10} />
                                  {item.isSpecific ? `${item.morningDS?.start_time} – ${item.morningDS?.end_time}` : `${morning.start_time} – ${morning.end_time}`}
                                  · {item.mCount} turnos
                                </span>
                              )}
                              {item.hasAfternoon && (
                                <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg font-medium">
                                  <Sunset size={10} />
                                  {item.isSpecific ? `${item.afternoonDS?.start_time} – ${item.afternoonDS?.end_time}` : `${afternoon.start_time} – ${afternoon.end_time}`}
                                  · {item.aCount} turnos
                                </span>
                              )}
                            </div>
                          </div>
                          {isExpanded
                            ? <ChevronUp size={14} className="text-gray-400 shrink-0" />
                            : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
                        </button>

                        {/* Expanded slot cancellation panel */}
                        {isExpanded && (
                          <div className="px-4 pb-3 pt-1 bg-gray-50 border-t border-gray-100 space-y-3">
                            {loadingSlots ? (
                              <div className="flex items-center gap-2 py-2">
                                <div className="w-4 h-4 border-2 border-[#e31b23] border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs text-gray-400">Cargando slots...</span>
                              </div>
                            ) : daySlots.length === 0 ? (
                              <p className="text-xs text-gray-400 py-2">No hay slots generados para este día todavía. Usá "Generar turnos" primero.</p>
                            ) : (
                              <>
                                {item.hasMorning && mSlots.length > 0 && (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <Sun size={11} className="text-amber-500" />
                                      <span className="text-xs font-semibold text-amber-700">Mañana</span>
                                      <span className="text-xs text-gray-400 ml-1">
                                        {mSlots.filter(s => s.is_active).length}/{mSlots.length} activos
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                      {mSlots.map(slot => {
                                        const st = String(slot.start_time).slice(0, 5);
                                        return (
                                          <div key={slot.id} className={`flex items-center justify-between px-2 py-1 rounded-lg ${slot.is_active ? 'bg-white border border-amber-100' : 'bg-gray-100 opacity-50'}`}>
                                            <span className={`text-xs font-mono font-semibold ${slot.is_active ? 'text-amber-800' : 'text-gray-400 line-through'}`}>{st}</span>
                                            {slot.is_active && (
                                              <button onClick={() => cancelSingleSlot(slot.id)} className="text-red-400 hover:text-red-600 ml-1 transition-colors" title="Cancelar">
                                                <X size={11} />
                                              </button>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                {item.hasAfternoon && aSlots.length > 0 && (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <Sunset size={11} className="text-indigo-500" />
                                      <span className="text-xs font-semibold text-indigo-700">Tarde</span>
                                      <span className="text-xs text-gray-400 ml-1">
                                        {aSlots.filter(s => s.is_active).length}/{aSlots.length} activos
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                      {aSlots.map(slot => {
                                        const st = String(slot.start_time).slice(0, 5);
                                        return (
                                          <div key={slot.id} className={`flex items-center justify-between px-2 py-1 rounded-lg ${slot.is_active ? 'bg-white border border-indigo-100' : 'bg-gray-100 opacity-50'}`}>
                                            <span className={`text-xs font-mono font-semibold ${slot.is_active ? 'text-indigo-800' : 'text-gray-400 line-through'}`}>{st}</span>
                                            {slot.is_active && (
                                              <button onClick={() => cancelSingleSlot(slot.id)} className="text-red-400 hover:text-red-600 ml-1 transition-colors" title="Cancelar">
                                                <X size={11} />
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
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 px-1">
            "Guardar" guarda la plantilla semanal. "Generar turnos" la convierte en slots para los próximos 28 días. Hacé click en un día de la vista previa para cancelar sus turnos puntuales.
          </p>
        </>
      )}
    </div>
  );
}
