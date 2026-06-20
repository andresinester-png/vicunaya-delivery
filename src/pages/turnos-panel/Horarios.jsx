import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useTurnosNegocio } from '../../contexts/TurnosNegocioContext.js';
import toast from 'react-hot-toast';
import { Zap, CalendarDays, Plus, Trash2, X, CalendarPlus, Sun, Sunset, Clock } from 'lucide-react';

// Mon→Sun display order; 0 = Sunday in JS
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABEL = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 0: 'Dom' };
const DAY_FULL  = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo' };

const EMPTY_BAND_FORM = { start_time: '09:00', end_time: '13:00', days: [] };

function slotCount(startTime, endTime, dur) {
  if (!dur || dur <= 0) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const total = (eh * 60 + em) - (sh * 60 + sm);
  return total > 0 ? Math.floor(total / dur) : 0;
}

function generateSlotsForBand(band, date, dur, negocioId, profId) {
  const slots = [];
  const [sh, sm] = band.start_time.split(':').map(Number);
  const [eh, em] = band.end_time.split(':').map(Number);
  let cur = sh * 60 + sm;
  const end = eh * 60 + em;
  while (cur + dur <= end) {
    const sH = String(Math.floor(cur / 60)).padStart(2, '0');
    const sM = String(cur % 60).padStart(2, '0');
    const eSlot = cur + dur;
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
    cur += dur;
  }
  return slots;
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const todayISO = () => new Date().toISOString().slice(0, 10);

// Specific-date shift helpers (reused from previous section)
const DEFAULT_DS_SHIFT = { is_active: false, start_time: '09:00', end_time: '13:00' };
const DEFAULT_DS_AFT   = { is_active: false, start_time: '17:00', end_time: '21:00' };
const EMPTY_DATE_FORM  = { date: '', morning: { ...DEFAULT_DS_SHIFT }, afternoon: { ...DEFAULT_DS_AFT } };

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

function dsSlotCount(shift, dur) {
  if (!shift?.is_active || !dur || dur <= 0) return 0;
  return slotCount(shift.start_time, shift.end_time, dur);
}

export default function Horarios() {
  const negocio = useTurnosNegocio();

  const [professionals, setProfessionals] = useState([]);
  const [selectedProf, setSelectedProf] = useState('');

  // Bands (new franja system)
  const [bands, setBands] = useState([]);
  const [duration, setDuration] = useState('30'); // string for free editing
  const [bandForm, setBandForm] = useState(null); // null=hidden, obj=open
  const [savingBand, setSavingBand] = useState(false);
  const [deletingBand, setDeletingBand] = useState(null);

  // Specific dates (kept from previous system)
  const [dateRows, setDateRows] = useState([]);
  const [dateForm, setDateForm] = useState(null);
  const [savingDate, setSavingDate] = useState(false);
  const [deletingDate, setDeletingDate] = useState(null);

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // ── Load professionals ──────────────────────────────────────────────────
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
    loadBands();
    loadDateSchedules();
  }, [selectedProf]);

  // ── Bands ───────────────────────────────────────────────────────────────
  async function loadBands() {
    setLoading(true);
    const { data } = await supabase
      .from('appointment_bands')
      .select('*')
      .eq('professional_id', selectedProf)
      .order('start_time');
    setBands(data || []);
    if (data?.length) setDuration(String(data[0].slot_duration_minutes));
    setLoading(false);
  }

  async function saveBand() {
    if (!bandForm.start_time || !bandForm.end_time) { toast.error('Completá el horario'); return; }
    if (!bandForm.days.length) { toast.error('Seleccioná al menos un día'); return; }
    const dur = parseInt(duration, 10);
    if (!dur || dur <= 0) { toast.error('Ingresá una duración válida'); return; }

    const [sh, sm] = bandForm.start_time.split(':').map(Number);
    const [eh, em] = bandForm.end_time.split(':').map(Number);
    if (sh * 60 + sm >= eh * 60 + em) { toast.error('La hora de fin debe ser mayor a la de inicio'); return; }

    setSavingBand(true);

    // If editing an existing band we update it; otherwise insert
    if (bandForm.id) {
      const { error } = await supabase.from('appointment_bands').update({
        start_time: bandForm.start_time,
        end_time:   bandForm.end_time,
        days_of_week: bandForm.days,
        slot_duration_minutes: dur,
      }).eq('id', bandForm.id);
      setSavingBand(false);
      if (error) { toast.error('Error al guardar'); return; }
    } else {
      // Update duration on all existing bands too (global setting)
      if (bands.length > 0) {
        await supabase
          .from('appointment_bands')
          .update({ slot_duration_minutes: dur })
          .eq('professional_id', selectedProf);
      }
      const { error } = await supabase.from('appointment_bands').insert({
        business_id: negocio.id,
        professional_id: selectedProf,
        start_time: bandForm.start_time,
        end_time:   bandForm.end_time,
        days_of_week: bandForm.days,
        slot_duration_minutes: dur,
      });
      setSavingBand(false);
      if (error) { toast.error('Error al guardar'); return; }
    }

    setBandForm(null);
    toast.success('Franja guardada');
    loadBands();
  }

  async function deleteBand(id) {
    setDeletingBand(id);
    const { error } = await supabase.from('appointment_bands').delete().eq('id', id);
    setDeletingBand(null);
    if (error) { toast.error('Error al eliminar'); return; }
    toast.success('Franja eliminada');
    loadBands();
  }

  // When duration changes, sync to all existing bands (global setting)
  async function applyDurationToAll() {
    const dur = parseInt(duration, 10);
    if (!dur || dur <= 0 || !bands.length) return;
    await supabase
      .from('appointment_bands')
      .update({ slot_duration_minutes: dur })
      .eq('professional_id', selectedProf);
    loadBands();
    toast.success('Duración actualizada');
  }

  // ── Specific dates ──────────────────────────────────────────────────────
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
    if (!dateForm.morning.is_active && !dateForm.afternoon.is_active) {
      toast.error('Activá al menos una franja'); return;
    }
    setSavingDate(true);
    const rows = ['morning', 'afternoon'].map(shift => ({
      business_id: negocio.id,
      professional_id: selectedProf,
      specific_date: dateForm.date,
      shift,
      is_active: dateForm[shift].is_active,
      start_time: dateForm[shift].start_time,
      end_time:   dateForm[shift].end_time,
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
    await supabase
      .from('appointment_date_schedules')
      .delete()
      .eq('professional_id', selectedProf)
      .eq('specific_date', dateStr);
    setDeletingDate(null);
    toast.success('Fecha eliminada');
    loadDateSchedules();
  }

  // ── Derived state ───────────────────────────────────────────────────────
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

      const matching = bands.filter(b => b.days_of_week.includes(dow));
      if (!matching.length) continue;

      const totalSlots = matching.reduce(
        (sum, b) => sum + slotCount(String(b.start_time).slice(0, 5), String(b.end_time).slice(0, 5), dur),
        0
      );
      result.push({
        dateStr,
        label: cap(date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })),
        bands: matching,
        totalSlots,
        isSpecific: false,
      });
    }

    // Specific dates not in weekly pattern
    Object.entries(groupedDates).forEach(([dateStr, shifts]) => {
      if (dateStr < todayStr || weeklySet.has(dateStr)) return;
      const m = shifts.morning   || { is_active: false, start_time: '09:00', end_time: '13:00' };
      const a = shifts.afternoon || { is_active: false, start_time: '17:00', end_time: '21:00' };
      if (!m.is_active && !a.is_active) return;
      const d = new Date(dateStr + 'T12:00:00');
      result.push({
        dateStr,
        label: cap(d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })),
        bands: null,
        morningDS: m,
        afternoonDS: a,
        totalSlots: dsSlotCount(m, dur) + dsSlotCount(a, dur),
        isSpecific: true,
      });
    });

    return result.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [bands, dur, groupedDates]);

  // ── Generate slots ──────────────────────────────────────────────────────
  async function generateSlots() {
    if (!selectedProf || !bands.length) { toast.error('Primero configurá al menos una franja'); return; }
    if (!dur) { toast.error('Ingresá una duración válida'); return; }
    setGenerating(true);

    const today = new Date();
    const slotsToInsert = [];

    // Weekly bands
    for (let offset = 0; offset < 28; offset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      const dow = date.getDay();
      for (const band of bands) {
        if (!band.days_of_week.includes(dow)) continue;
        slotsToInsert.push(
          ...generateSlotsForBand(
            { start_time: String(band.start_time).slice(0, 5), end_time: String(band.end_time).slice(0, 5) },
            date, dur, negocio.id, selectedProf
          )
        );
      }
    }

    // Specific dates
    const todayStr = today.toISOString().slice(0, 10);
    Object.entries(groupedDates).forEach(([dateStr, shifts]) => {
      if (dateStr < todayStr) return;
      const d = new Date(dateStr + 'T12:00:00');
      ['morning', 'afternoon'].forEach(shift => {
        const s = shifts[shift];
        if (s?.is_active) {
          slotsToInsert.push(
            ...generateSlotsForBand(
              { start_time: s.start_time, end_time: s.end_time },
              d, dur, negocio.id, selectedProf
            )
          );
        }
      });
    });

    // Deduplicate against existing
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
    toast.success(`${newSlots.length} turnos generados para las próximas 4 semanas`);
  }

  // ── Empty state ─────────────────────────────────────────────────────────
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

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header + professional selector */}
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

      {/* Duration */}
      <div className="bg-white rounded-2xl px-5 py-4 shadow-sm flex items-center gap-4 flex-wrap">
        <Clock size={15} className="text-gray-400 shrink-0" />
        <span className="text-sm font-semibold text-gray-700 shrink-0">Duración del turno</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="480"
            placeholder="ej: 30"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            onBlur={() => {
              const v = parseInt(duration, 10);
              if (v && v > 0) setDuration(String(v));
              else setDuration('');
            }}
            className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30"
          />
          <span className="text-sm text-gray-500">minutos</span>
        </div>
        {bands.length > 0 && dur > 0 && (
          <button
            onClick={applyDurationToAll}
            className="ml-auto text-xs font-semibold text-[#e31b23] hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            Aplicar a todas las franjas
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#e31b23] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Franjas horarias ─────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">Franjas horarias</h2>
              {!bandForm && (
                <button
                  onClick={() => setBandForm({ ...EMPTY_BAND_FORM })}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#e31b23] hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={13} /> Agregar franja
                </button>
              )}
            </div>

            {/* Add / edit form */}
            {bandForm && (
              <div className="px-4 py-4 bg-gray-50 border-b border-gray-100 space-y-4">
                {/* Time range */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-gray-500 w-14 shrink-0">Horario</span>
                  <input
                    type="time"
                    value={bandForm.start_time}
                    onChange={e => setBandForm(f => ({ ...f, start_time: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30 bg-white w-[130px]"
                  />
                  <span className="text-gray-400">–</span>
                  <input
                    type="time"
                    value={bandForm.end_time}
                    onChange={e => setBandForm(f => ({ ...f, end_time: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30 bg-white w-[130px]"
                  />
                  {dur > 0 && bandForm.start_time && bandForm.end_time && (
                    <span className="text-xs text-gray-400 ml-1">
                      {slotCount(bandForm.start_time, bandForm.end_time, dur)} turnos/día
                    </span>
                  )}
                </div>

                {/* Day checkboxes */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-gray-500 w-14 shrink-0">Días</span>
                  {DAY_ORDER.map(dow => {
                    const checked = bandForm.days.includes(dow);
                    return (
                      <button
                        key={dow}
                        type="button"
                        onClick={() => {
                          setBandForm(f => ({
                            ...f,
                            days: checked ? f.days.filter(d => d !== dow) : [...f.days, dow],
                          }));
                        }}
                        className={`w-10 h-10 rounded-xl text-xs font-bold transition-colors ${
                          checked
                            ? 'bg-[#e31b23] text-white'
                            : 'bg-white border border-gray-200 text-gray-400 hover:border-[#e31b23]/40 hover:text-[#e31b23]'
                        }`}
                      >
                        {DAY_LABEL[dow]}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={saveBand}
                    disabled={savingBand}
                    className="bg-[#e31b23] hover:bg-[#c41520] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                  >
                    {savingBand ? 'Guardando...' : 'Guardar franja'}
                  </button>
                  <button
                    onClick={() => setBandForm(null)}
                    className="p-2 text-gray-400 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Band list */}
            {bands.length === 0 && !bandForm ? (
              <div className="px-4 py-8 text-center">
                <p className="text-gray-400 text-sm">Sin franjas configuradas.</p>
                <p className="text-gray-300 text-xs mt-1">Usá "Agregar franja" para definir un bloque de horario y los días en que aplica.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {bands.map(band => {
                  const st = String(band.start_time).slice(0, 5);
                  const et = String(band.end_time).slice(0, 5);
                  const slotsPerDay = dur ? slotCount(st, et, dur) : '—';
                  return (
                    <div key={band.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{st} – {et}</span>
                          <span className="text-xs text-gray-400">· {slotsPerDay} turno{slotsPerDay !== 1 ? 's' : ''}/día</span>
                        </div>
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          {DAY_ORDER.filter(d => band.days_of_week.includes(d)).map(d => (
                            <span key={d} className="text-xs bg-[#e31b23]/10 text-[#e31b23] font-semibold px-2 py-0.5 rounded-lg">
                              {DAY_LABEL[d]}
                            </span>
                          ))}
                          {!band.days_of_week.length && (
                            <span className="text-xs text-gray-300 italic">Sin días asignados</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteBand(band.id)}
                        disabled={deletingBand === band.id}
                        className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Generate button */}
            {bands.length > 0 && (
              <div className="px-4 py-4 border-t border-gray-100">
                <button
                  onClick={generateSlots}
                  disabled={generating || !dur}
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                >
                  <Zap size={14} />
                  {generating ? 'Generando...' : 'Generar turnos (próximas 4 semanas)'}
                </button>
              </div>
            )}
          </div>

          {/* ── Fechas específicas ────────────────────────────────────────── */}
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

                {['morning', 'afternoon'].map(shift => {
                  const s = dateForm[shift];
                  const isM = shift === 'morning';
                  return (
                    <div key={shift} className={`flex items-center gap-3 flex-wrap rounded-xl px-3 py-2 transition-colors ${s.is_active ? (isM ? 'bg-amber-50' : 'bg-indigo-50') : 'bg-white border border-gray-100'}`}>
                      <label className="flex items-center gap-2 cursor-pointer w-32 shrink-0">
                        <input type="checkbox" checked={s.is_active}
                          onChange={e => setDateForm(f => ({ ...f, [shift]: { ...f[shift], is_active: e.target.checked } }))}
                          className="w-4 h-4 accent-[#e31b23]" />
                        {isM ? <Sun size={13} className={s.is_active ? 'text-amber-500' : 'text-gray-400'} />
                               : <Sunset size={13} className={s.is_active ? 'text-indigo-500' : 'text-gray-400'} />}
                        <span className={`text-xs font-semibold ${s.is_active ? (isM ? 'text-amber-700' : 'text-indigo-700') : 'text-gray-400'}`}>
                          {isM ? 'Mañana' : 'Tarde'}
                        </span>
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

                <button
                  onClick={saveSpecificDate}
                  disabled={savingDate}
                  className="bg-[#e31b23] hover:bg-[#c41520] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  {savingDate ? 'Guardando...' : 'Guardar fecha'}
                </button>
              </div>
            )}

            {Object.keys(groupedDates).length === 0 && !dateForm ? (
              <div className="px-4 py-6 text-center">
                <p className="text-gray-400 text-xs">Para días especiales fuera del horario habitual.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {Object.entries(groupedDates)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([dateStr, shifts]) => {
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

          {/* ── Vista previa ──────────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700">Vista previa — próximas 4 semanas</h2>
              {preview.length > 0 && (
                <span className="ml-auto text-xs text-gray-400">
                  {preview.length} días · {preview.reduce((a, d) => a + d.totalSlots, 0)} turnos totales
                </span>
              )}
            </div>

            {preview.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <CalendarDays size={28} className="mx-auto text-gray-200 mb-2" />
                <p className="text-gray-400 text-sm">
                  {!dur ? 'Ingresá una duración para ver la vista previa' : 'Configurá franjas para ver los días habilitados'}
                </p>
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
                        <div className="flex gap-2 mt-1.5 flex-wrap">
                          {item.isSpecific ? (
                            <>
                              {item.morningDS?.is_active && (
                                <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg font-medium">
                                  <Sun size={11} /> {item.morningDS.start_time} – {item.morningDS.end_time}
                                  <span className="text-amber-400 font-normal">·</span>
                                  {dsSlotCount(item.morningDS, dur)} turnos
                                </span>
                              )}
                              {item.afternoonDS?.is_active && (
                                <span className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-medium">
                                  <Sunset size={11} /> {item.afternoonDS.start_time} – {item.afternoonDS.end_time}
                                  <span className="text-indigo-400 font-normal">·</span>
                                  {dsSlotCount(item.afternoonDS, dur)} turnos
                                </span>
                              )}
                            </>
                          ) : (
                            item.bands.map((band, bi) => {
                              const st = String(band.start_time).slice(0, 5);
                              const et = String(band.end_time).slice(0, 5);
                              const sc = slotCount(st, et, dur);
                              return (
                                <span key={bi} className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg font-medium">
                                  {st} – {et}
                                  <span className="text-gray-400 font-normal">·</span>
                                  {sc} turno{sc !== 1 ? 's' : ''}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg whitespace-nowrap">
                        {item.totalSlots} total
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 px-1">
            La vista previa se actualiza en tiempo real. "Generar turnos" convierte las franjas activas (y fechas específicas) en slots disponibles para los próximos 28 días, evitando duplicados.
          </p>
        </>
      )}
    </div>
  );
}
