import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useTurnosNegocio } from '../../contexts/TurnosNegocioContext.js';
import toast from 'react-hot-toast';
import { Zap, Sun, Sunset } from 'lucide-react';

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

export default function Horarios() {
  const negocio = useTurnosNegocio();
  const [professionals, setProfessionals] = useState([]);
  const [selectedProf, setSelectedProf] = useState('');
  const [schedule, setSchedule] = useState(buildDefaultSchedule);
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

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
        end_time: String(row.end_time).slice(0, 5),
      };
      loadedDuration = row.slot_duration_minutes;
    });
    setSchedule(base);
    setDuration(loadedDuration);
    setLoading(false);
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

  async function generateSlots() {
    if (!selectedProf) return;
    setGenerating(true);

    const today = new Date();
    const slotsToInsert = [];

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
    toast.success(`${newSlots.length} turnos generados para las próximas 4 semanas`);
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

      {/* Duración global */}
      <div className="bg-white rounded-2xl px-5 py-4 shadow-sm flex items-center gap-4">
        <span className="text-sm font-semibold text-gray-700 shrink-0">Duración del turno</span>
        <select
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e31b23]/30"
        >
          {[15, 20, 30, 45, 60, 90, 120].map(m => (
            <option key={m} value={m}>{m} minutos</option>
          ))}
        </select>
        <span className="text-xs text-gray-400">Se aplica a ambas franjas de todos los días</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#e31b23] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
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
                    <div className={`flex items-center gap-3 flex-wrap rounded-xl px-3 py-2 transition-colors ${
                      day.morning.is_active ? 'bg-amber-50' : 'bg-gray-50'
                    }`}>
                      <label className="flex items-center gap-2 cursor-pointer w-32 shrink-0">
                        <input
                          type="checkbox"
                          checked={day.morning.is_active}
                          onChange={e => updateShift(dow, 'morning', 'is_active', e.target.checked)}
                          className="w-4 h-4 accent-[#e31b23]"
                        />
                        <Sun size={13} className={day.morning.is_active ? 'text-amber-500' : 'text-gray-400'} />
                        <span className={`text-xs font-semibold ${day.morning.is_active ? 'text-amber-700' : 'text-gray-400'}`}>
                          Mañana
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={day.morning.start_time}
                          disabled={!day.morning.is_active}
                          onChange={e => updateShift(dow, 'morning', 'start_time', e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e31b23]/30 disabled:bg-white disabled:text-gray-300 w-[110px]"
                        />
                        <span className="text-gray-400 text-sm">–</span>
                        <input
                          type="time"
                          value={day.morning.end_time}
                          disabled={!day.morning.is_active}
                          onChange={e => updateShift(dow, 'morning', 'end_time', e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e31b23]/30 disabled:bg-white disabled:text-gray-300 w-[110px]"
                        />
                      </div>
                    </div>

                    {/* Turno Tarde */}
                    <div className={`flex items-center gap-3 flex-wrap rounded-xl px-3 py-2 transition-colors ${
                      day.afternoon.is_active ? 'bg-indigo-50' : 'bg-gray-50'
                    }`}>
                      <label className="flex items-center gap-2 cursor-pointer w-32 shrink-0">
                        <input
                          type="checkbox"
                          checked={day.afternoon.is_active}
                          onChange={e => updateShift(dow, 'afternoon', 'is_active', e.target.checked)}
                          className="w-4 h-4 accent-[#e31b23]"
                        />
                        <Sunset size={13} className={day.afternoon.is_active ? 'text-indigo-500' : 'text-gray-400'} />
                        <span className={`text-xs font-semibold ${day.afternoon.is_active ? 'text-indigo-700' : 'text-gray-400'}`}>
                          Tarde
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={day.afternoon.start_time}
                          disabled={!day.afternoon.is_active}
                          onChange={e => updateShift(dow, 'afternoon', 'start_time', e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e31b23]/30 disabled:bg-white disabled:text-gray-300 w-[110px]"
                        />
                        <span className="text-gray-400 text-sm">–</span>
                        <input
                          type="time"
                          value={day.afternoon.end_time}
                          disabled={!day.afternoon.is_active}
                          onChange={e => updateShift(dow, 'afternoon', 'end_time', e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e31b23]/30 disabled:bg-white disabled:text-gray-300 w-[110px]"
                        />
                      </div>
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
      )}

      <p className="text-xs text-gray-400 px-1">
        "Guardar horario" guarda la plantilla semanal. "Generar turnos" crea los slots disponibles para las próximas 4 semanas sin duplicar los existentes.
      </p>
    </div>
  );
}
