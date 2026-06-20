import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useTurnosNegocio } from '../../contexts/TurnosNegocioContext.js';
import toast from 'react-hot-toast';
import { Zap, Sun, Sunset, CalendarDays, Plus, Trash2, X, CalendarPlus } from 'lucide-react';

const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

const DEFAULT_SHIFT = {
  morning:   { is_active: false, start_time: '09:00', end_time: '13:00' },
  afternoon: { is_active: false, start_time: '17:00', end_time: '21:00' },
};

const EMPTY_DATE_FORM = {
  date: '',
  morning:   { is_active: false, start_time: '09:00', end_time: '13:00' },
  afternoon: { is_active: false, start_time: '17:00', end_time: '21:00' },
};

function buildDefaultSchedule() {
  return Object.fromEntries(
    DAYS.map(d => [d.value, {
      morning:   { ...DEFAULT_SHIFT.morning },
      afternoon: { ...DEFAULT_SHIFT.afternoon },
    }])
  );
}

function generateSlotsForShift(shift, date, duration, negocioId, profId) {
  if (!shift.is_active) return [];
  const [sh, sm] = shift.start_time.split(':').map(Number);
  const [eh, em] = shift.end_time.split(':').map(Number);
  let cur = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const slots = [];
  while (cur + duration <= endMin) {
    const sH = String(Math.floor(cur / 60)).padStart(2, '0');
    const sM = String(cur % 60).padStart(2, '0');
    const eSlot = cur + duration;
    const eH = String(Math.floor(eSlot / 60)).padStart(2, '0');
    const eM = String(eSlot % 60).padStart(2, '0');
    slots.push({
      business_id: negocioId,
      professional_id: profId,
      specific_date: date.toISOString().slice(0, 10),
      start_time: `${sH}:${sM}`,
      end_time: `${eH}:${eM}`,
      is_active: true,
    });
    cur += duration;
  }
  return slots;
}

function slotCount(shift, dur) {
  if (!shift || !shift.is_active) return 0;
  const [sh, sm] = shift.start_time.split(':').map(Number);
  const [eh, em] = shift.end_time.split(':').map(Number);
  const total = (eh * 60 + em) - (sh * 60 + sm);
  return total > 0 ? Math.floor(total / dur) : 0;
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

export default function Horarios() {
  const negocio = useTurnosNegocio();
  const [professionals, setProfessionals] = useState([]);
  const [selectedProf, setSelectedProf] = useState('');
  const [schedule, setSchedule] = useState(buildDefaultSchedule);
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Specific dates
  const [dateRows, setDateRows] = useState([]); // raw DB rows
  const [dateForm, setDateForm] = useState(null); // null = hidden, {...} = open form
  const [savingDate, setSavingDate] = useState(false);
  const [deletingDate, setDeletingDate] = useState(null);

  useEffect(() => {
    supabase
      .from('appointment_professionals')
      .select('id, name')
      .eq('business_id', negocio.id)
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setProfessionals(data || []);
        if (data?.length) setSelectedProf(data[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selectedProf) return;
    loadSchedule();
    loadDateSchedules();
  }, [selectedProf]);

  async function loadSchedule() {
    setLoading(true);
    const { data } = await supabase
      .from('appointment_schedules')
      .select('*')
      .eq('professional_id', selectedProf);

    const base = buildDefaultSchedule();
    let loadedDuration = 30;
    (data || []).forEach(row => {
      const shift = row.shift || 'morning';
      base[row.day_of_week][shift] = {
        is_active: row.is_active,
        start_time: String(row.start_time).slice(0, 5),
        end_time:   String(row.end_time).slice(0, 5),
      };
      loadedDuration = row.slot_duration_minutes;
    });
    setSchedule(base);
    setDuration(loadedDuration);
    setLoading(false);
  }

  async function loadDateSchedules() {
    const { data } = await supabase
      .from('appointment_date_schedules')
      .select('*')
      .eq('professional_id', selectedProf)
      .gte('specific_date', todayISO())
      .order('specific_date');
    setDateRows(data || []);
  }

  function updateShift(dow, shift, field, value) {
    setSchedule(prev => ({
      ...prev,
      [dow]: {
        ...prev[dow],
        [shift]: { ...prev[dow][shift], [field]: value },
      },
    }));
  }

  function updateDateFormShift(shift, field, value) {
    setDateForm(f => ({
      ...f,
      [shift]: { ...f[shift], [field]: value },
    }));
  }

  // Grouped specific dates for display and preview
  const groupedDates = useMemo(() => groupDateSchedules(dateRows), [dateRows]);

  // Vista previa: próximas 4 semanas (weekly pattern) + specific dates
  const preview = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const weeklyDateSet = new Set();
    const result = [];

    // Weekly pattern
    for (let offset = 0; offset < 28; offset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      const dow = date.getDay();
      const day = schedule[dow];
      const dateStr = date.toISOString().slice(0, 10);
      weeklyDateSet.add(dateStr);
      if (!day.morning.is_active && !day.afternoon.is_active) continue;
      result.push({
        dateStr,
        label: cap(date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })),
        morning:    day.morning,
        afternoon:  day.afternoon,
        totalSlots: slotCount(day.morning, duration) + slotCount(day.afternoon, duration),
        isSpecific: false,
      });
    }

    // Specific dates not in weekly pattern
    Object.entries(groupedDates).forEach(([dateStr, shifts]) => {
      if (dateStr < todayStr) return;
      if (weeklyDateSet.has(dateStr)) return;
      const morning   = shifts.morning   || { is_active: false, start_time: '09:00', end_time: '13:00' };
      const afternoon = shifts.afternoon || { is_active: false, start_time: '17:00', end_time: '21:00' };
      if (!morning.is_active && !afternoon.is_active) return;
      const d = new Date(dateStr + 'T12:00:00');
      result.push({
        dateStr,
        label: cap(d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })),
        morning, afternoon,
        totalSlots: slotCount(morning, duration) + slotCount(afternoon, duration),
        isSpecific: true,
      });
    });

    return result.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [schedule, duration, groupedDates]);

  async function saveSchedule() {
    if (!selectedProf) return;
    setSaving(true);
    const rows = [];
    DAYS.forEach(({ value: dow }) => {
      ['morning', 'afternoon'].forEach(shift => {
        rows.push({
          business_id: negocio.id,
          professional_id: selectedProf,
          day_of_week: dow,
          shift,
          slot_duration_minutes: duration,
          ...schedule[dow][shift],
        });
      });
    });
    const { error } = await supabase
      .from('appointment_schedules')
      .upsert(rows, { onConflict: 'professional_id,day_of_week,shift' });
    setSaving(false);
    if (error) { toast.error('Error al guardar'); return; }
    toast.success('Horario guardado');
  }

  async function saveSpecificDate() {
    if (!dateForm.date) { toast.error('Seleccioná una fecha'); return; }
    if (!dateForm.morning.is_active && !dateForm.afternoon.is_active) {
      toast.error('Activá al menos una franja'); return;
    }
    setSavingDate(true);
    const upsertRows = [];
    ['morning', 'afternoon'].forEach(shift => {
      const s = dateForm[shift];
      upsertRows.push({
        business_id: negocio.id,
        professional_id: selectedProf,
        specific_date: dateForm.date,
        shift,
        is_active: s.is_active,
        start_time: s.start_time,
        end_time:   s.end_time,
      });
    });
    const { error } = await supabase
      .from('appointment_date_schedules')
      .upsert(upsertRows, { onConflict: 'professional_id,specific_date,shift' });
    setSavingDate(false);
    if (error) { toast.error('Error al guardar fecha'); return; }
    setDateForm(null);
    toast.success('Fecha específica guardada');
    loadDateSchedules();
  }

  async function deleteSpecificDate(dateStr) {
    setDeletingDate(dateStr);
    const { error } = await supabase
      .from('appointment_date_schedules')
      .delete()
      .eq('professional_id', selectedProf)
      .eq('specific_date', dateStr);
    setDeletingDate(null);
    if (error) { toast.error('Error al eliminar'); return; }
    toast.success('Fecha eliminada');
    loadDateSchedules();
  }

  async function generateSlots() {
    if (!selectedProf) return;
    setGenerating(true);

    const today = new Date();
    const slotsToInsert = [];

    // Weekly pattern (28 days)
    for (let offset = 0; offset < 28; offset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      const dow = date.getDay();
      const daySchedule = schedule[dow];
      slotsToInsert.push(
        ...generateSlotsForShift(daySchedule.morning,   date, duration, negocio.id, selectedProf),
        ...generateSlotsForShift(daySchedule.afternoon, date, duration, negocio.id, selectedProf),
      );
    }

    // Specific dates
    Object.entries(groupedDates).forEach(([dateStr, shifts]) => {
      if (dateStr < today.toISOString().slice(0, 10)) return;
      const d = new Date(dateStr + 'T12:00:00');
      if (shifts.morning)   slotsToInsert.push(...generateSlotsForShift(shifts.morning,   d, duration, negocio.id, selectedProf));
      if (shifts.afternoon) slotsToInsert.push(...generateSlotsForShift(shifts.afternoon, d, duration, negocio.id, selectedProf));
    });

    const todayStr = today.toISOString().slice(0, 10);
    const { data: existing } = await supabase
      .from('appointment_slots')
      .select('specific_date, start_time')
      .eq('professional_id', selectedProf)
      .gte('specific_date', todayStr);

    const existingSet = new Set(
      (existing || []).map(s => `${s.specific_date}_${String(s.start_time).slice(0, 5)}`)
    );
    const newSlots = slotsToInsert.filter(
      s => !existingSet.has(`${s.specific_date}_${s.start_time}`)
    );

    if (newSlots.length > 0) {
      const { error } = await supabase.from('appointment_slots').insert(newSlots);
      if (error) { toast.error('Error al generar turnos'); setGenerating(false); return; }
    }

    setGenerating(false);
    toast.success(`${newSlots.length} turnos generados`);
  }

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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-gray-900">Horarios</h1>
        {professionals.length > 1 && (
          <select
            value={selectedProf}
            onChange={e => setSelectedProf(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30"
          >
            {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      {/* Duración global — free number input */}
      <div className="bg-white rounded-2xl px-5 py-4 shadow-sm flex items-center gap-4 flex-wrap">
        <span className="text-sm font-semibold text-gray-700 shrink-0">Duración del turno</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="480"
            value={duration}
            onChange={e => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v > 0) setDuration(v);
            }}
            className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30"
          />
          <span className="text-sm text-gray-500">minutos</span>
        </div>
        <span className="text-xs text-gray-400">Se aplica a ambas franjas de todos los días</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#e31b23] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Configuración semanal */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {DAYS.map(({ value: dow, label }) => {
                const day = schedule[dow];
                const dayActive = day.morning.is_active || day.afternoon.is_active;
                return (
                  <div key={dow} className={`px-4 py-4 ${!dayActive ? 'opacity-60' : ''}`}>
                    <p className="text-sm font-bold text-gray-800 mb-3">{label}</p>
                    <div className="space-y-2 pl-1">

                      {/* Turno Mañana */}
                      <div className={`flex items-center gap-3 flex-wrap rounded-xl px-3 py-2 transition-colors ${day.morning.is_active ? 'bg-amber-50' : 'bg-gray-50'}`}>
                        <label className="flex items-center gap-2 cursor-pointer w-32 shrink-0">
                          <input
                            type="checkbox"
                            checked={day.morning.is_active}
                            onChange={e => updateShift(dow, 'morning', 'is_active', e.target.checked)}
                            className="w-4 h-4 accent-[#e31b23]"
                          />
                          <Sun size={13} className={day.morning.is_active ? 'text-amber-500' : 'text-gray-400'} />
                          <span className={`text-xs font-semibold ${day.morning.is_active ? 'text-amber-700' : 'text-gray-400'}`}>Mañana</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input type="time" value={day.morning.start_time} disabled={!day.morning.is_active}
                            onChange={e => updateShift(dow, 'morning', 'start_time', e.target.value)}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e31b23]/30 disabled:bg-white disabled:text-gray-300 w-[110px]" />
                          <span className="text-gray-400 text-sm">–</span>
                          <input type="time" value={day.morning.end_time} disabled={!day.morning.is_active}
                            onChange={e => updateShift(dow, 'morning', 'end_time', e.target.value)}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e31b23]/30 disabled:bg-white disabled:text-gray-300 w-[110px]" />
                        </div>
                        {day.morning.is_active && slotCount(day.morning, duration) > 0 && (
                          <span className="text-xs text-amber-600 font-medium ml-auto">
                            {slotCount(day.morning, duration)} turnos
                          </span>
                        )}
                      </div>

                      {/* Turno Tarde */}
                      <div className={`flex items-center gap-3 flex-wrap rounded-xl px-3 py-2 transition-colors ${day.afternoon.is_active ? 'bg-indigo-50' : 'bg-gray-50'}`}>
                        <label className="flex items-center gap-2 cursor-pointer w-32 shrink-0">
                          <input
                            type="checkbox"
                            checked={day.afternoon.is_active}
                            onChange={e => updateShift(dow, 'afternoon', 'is_active', e.target.checked)}
                            className="w-4 h-4 accent-[#e31b23]"
                          />
                          <Sunset size={13} className={day.afternoon.is_active ? 'text-indigo-500' : 'text-gray-400'} />
                          <span className={`text-xs font-semibold ${day.afternoon.is_active ? 'text-indigo-700' : 'text-gray-400'}`}>Tarde</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input type="time" value={day.afternoon.start_time} disabled={!day.afternoon.is_active}
                            onChange={e => updateShift(dow, 'afternoon', 'start_time', e.target.value)}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e31b23]/30 disabled:bg-white disabled:text-gray-300 w-[110px]" />
                          <span className="text-gray-400 text-sm">–</span>
                          <input type="time" value={day.afternoon.end_time} disabled={!day.afternoon.is_active}
                            onChange={e => updateShift(dow, 'afternoon', 'end_time', e.target.value)}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e31b23]/30 disabled:bg-white disabled:text-gray-300 w-[110px]" />
                        </div>
                        {day.afternoon.is_active && slotCount(day.afternoon, duration) > 0 && (
                          <span className="text-xs text-indigo-600 font-medium ml-auto">
                            {slotCount(day.afternoon, duration)} turnos
                          </span>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-4 py-4 border-t border-gray-100 flex items-center gap-3 flex-wrap">
              <button
                onClick={saveSchedule}
                disabled={saving}
                className="flex-1 sm:flex-none bg-[#e31b23] hover:bg-[#c41520] disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                {saving ? 'Guardando...' : 'Guardar horario'}
              </button>
              <button
                onClick={generateSlots}
                disabled={generating}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                <Zap size={14} />
                {generating ? 'Generando...' : 'Generar turnos (4 semanas)'}
              </button>
            </div>
          </div>

          {/* Fechas específicas */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarPlus size={16} className="text-[#e31b23]" />
                <h2 className="text-sm font-semibold text-gray-800">Fechas específicas</h2>
              </div>
              {!dateForm && (
                <button
                  onClick={() => setDateForm({ ...EMPTY_DATE_FORM })}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#e31b23] hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={13} /> Agregar fecha
                </button>
              )}
            </div>

            {/* Add form */}
            {dateForm && (
              <div className="px-4 py-4 bg-gray-50 border-b border-gray-100 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    min={todayISO()}
                    value={dateForm.date}
                    onChange={e => setDateForm(f => ({ ...f, date: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30 bg-white"
                  />
                  <button onClick={() => setDateForm(null)} className="ml-auto p-1.5 text-gray-400 hover:bg-gray-200 rounded-lg">
                    <X size={14} />
                  </button>
                </div>

                {/* Morning */}
                <div className={`flex items-center gap-3 flex-wrap rounded-xl px-3 py-2 transition-colors ${dateForm.morning.is_active ? 'bg-amber-50' : 'bg-white border border-gray-100'}`}>
                  <label className="flex items-center gap-2 cursor-pointer w-32 shrink-0">
                    <input
                      type="checkbox"
                      checked={dateForm.morning.is_active}
                      onChange={e => updateDateFormShift('morning', 'is_active', e.target.checked)}
                      className="w-4 h-4 accent-[#e31b23]"
                    />
                    <Sun size={13} className={dateForm.morning.is_active ? 'text-amber-500' : 'text-gray-400'} />
                    <span className={`text-xs font-semibold ${dateForm.morning.is_active ? 'text-amber-700' : 'text-gray-400'}`}>Mañana</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="time" value={dateForm.morning.start_time} disabled={!dateForm.morning.is_active}
                      onChange={e => updateDateFormShift('morning', 'start_time', e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e31b23]/30 disabled:bg-white disabled:text-gray-300 w-[110px]" />
                    <span className="text-gray-400 text-sm">–</span>
                    <input type="time" value={dateForm.morning.end_time} disabled={!dateForm.morning.is_active}
                      onChange={e => updateDateFormShift('morning', 'end_time', e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e31b23]/30 disabled:bg-white disabled:text-gray-300 w-[110px]" />
                  </div>
                </div>

                {/* Afternoon */}
                <div className={`flex items-center gap-3 flex-wrap rounded-xl px-3 py-2 transition-colors ${dateForm.afternoon.is_active ? 'bg-indigo-50' : 'bg-white border border-gray-100'}`}>
                  <label className="flex items-center gap-2 cursor-pointer w-32 shrink-0">
                    <input
                      type="checkbox"
                      checked={dateForm.afternoon.is_active}
                      onChange={e => updateDateFormShift('afternoon', 'is_active', e.target.checked)}
                      className="w-4 h-4 accent-[#e31b23]"
                    />
                    <Sunset size={13} className={dateForm.afternoon.is_active ? 'text-indigo-500' : 'text-gray-400'} />
                    <span className={`text-xs font-semibold ${dateForm.afternoon.is_active ? 'text-indigo-700' : 'text-gray-400'}`}>Tarde</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="time" value={dateForm.afternoon.start_time} disabled={!dateForm.afternoon.is_active}
                      onChange={e => updateDateFormShift('afternoon', 'start_time', e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e31b23]/30 disabled:bg-white disabled:text-gray-300 w-[110px]" />
                    <span className="text-gray-400 text-sm">–</span>
                    <input type="time" value={dateForm.afternoon.end_time} disabled={!dateForm.afternoon.is_active}
                      onChange={e => updateDateFormShift('afternoon', 'end_time', e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e31b23]/30 disabled:bg-white disabled:text-gray-300 w-[110px]" />
                  </div>
                </div>

                <button
                  onClick={saveSpecificDate}
                  disabled={savingDate}
                  className="bg-[#e31b23] hover:bg-[#c41520] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  {savingDate ? 'Guardando...' : 'Guardar fecha'}
                </button>
              </div>
            )}

            {/* List of saved specific dates */}
            {Object.keys(groupedDates).length === 0 && !dateForm ? (
              <div className="px-4 py-6 text-center">
                <p className="text-gray-400 text-xs">Sin fechas específicas. Usá esto para días especiales fuera del horario habitual.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {Object.entries(groupedDates)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([dateStr, shifts]) => {
                    const d = new Date(dateStr + 'T12:00:00');
                    const label = cap(d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }));
                    const morning   = shifts.morning;
                    const afternoon = shifts.afternoon;
                    return (
                      <div key={dateStr} className="px-4 py-3 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{label}</p>
                          <div className="flex gap-2 mt-1.5 flex-wrap">
                            {morning?.is_active && (
                              <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg font-medium">
                                <Sun size={10} /> {morning.start_time} – {morning.end_time}
                              </span>
                            )}
                            {afternoon?.is_active && (
                              <span className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg font-medium">
                                <Sunset size={10} /> {afternoon.start_time} – {afternoon.end_time}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteSpecificDate(dateStr)}
                          disabled={deletingDate === dateStr}
                          className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Vista previa de fechas concretas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">
                Vista previa — próximas 4 semanas
              </h2>
              {preview.length > 0 && (
                <span className="ml-auto text-xs text-gray-400">
                  {preview.length} días · {preview.reduce((a, d) => a + d.totalSlots, 0)} turnos totales
                </span>
              )}
            </div>

            {preview.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <CalendarDays size={28} className="mx-auto text-gray-200 mb-2" />
                <p className="text-gray-400 text-sm">Activá al menos una franja para ver las fechas habilitadas</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {preview.map((item, i) => (
                    <div key={i} className={`px-4 py-3 flex items-start gap-4 ${item.isSpecific ? 'bg-purple-50/40' : ''}`}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                          {item.isSpecific && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">específica</span>
                          )}
                        </div>
                        <div className="flex gap-3 mt-1.5 flex-wrap">
                          {item.morning.is_active && (
                            <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg font-medium">
                              <Sun size={11} />
                              {item.morning.start_time} – {item.morning.end_time}
                              <span className="text-amber-400 font-normal">·</span>
                              {slotCount(item.morning, duration)} turnos
                            </span>
                          )}
                          {item.afternoon.is_active && (
                            <span className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-medium">
                              <Sunset size={11} />
                              {item.afternoon.start_time} – {item.afternoon.end_time}
                              <span className="text-indigo-400 font-normal">·</span>
                              {slotCount(item.afternoon, duration)} turnos
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                        {item.totalSlots} total
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 px-1">
            La vista previa se actualiza en tiempo real. "Guardar" guarda la plantilla semanal. "Generar turnos" convierte todo (plantilla + fechas específicas) en slots disponibles.
          </p>
        </>
      )}
    </div>
  );
}
