import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import { useTurnosNegocio } from '../../contexts/TurnosNegocioContext.js';
import toast from 'react-hot-toast';
import { Zap } from 'lucide-react';

const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

const DEFAULT_DAY = { is_active: false, start_time: '09:00', end_time: '18:00', slot_duration_minutes: 30 };

function buildDefaultSchedule() {
  return Object.fromEntries(DAYS.map(d => [d.value, { ...DEFAULT_DAY }]));
}

export default function Horarios() {
  const negocio = useTurnosNegocio();
  const [professionals, setProfessionals] = useState([]);
  const [selectedProf, setSelectedProf] = useState('');
  const [schedule, setSchedule] = useState(buildDefaultSchedule);
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
    (data || []).forEach(row => {
      base[row.day_of_week] = {
        is_active: row.is_active,
        start_time: String(row.start_time).slice(0, 5),
        end_time: String(row.end_time).slice(0, 5),
        slot_duration_minutes: row.slot_duration_minutes,
      };
    });
    setSchedule(base);
    setLoading(false);
  }

  function updateDay(dow, field, value) {
    setSchedule(prev => ({ ...prev, [dow]: { ...prev[dow], [field]: value } }));
  }

  async function saveSchedule() {
    if (!selectedProf) return;
    setSaving(true);
    const rows = DAYS.map(d => ({
      business_id: negocio.id,
      professional_id: selectedProf,
      day_of_week: d.value,
      ...schedule[d.value],
    }));
    const { error } = await supabase
      .from('appointment_schedules')
      .upsert(rows, { onConflict: 'professional_id,day_of_week' });
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
      if (!daySchedule?.is_active) continue;

      const [sh, sm] = daySchedule.start_time.split(':').map(Number);
      const [eh, em] = daySchedule.end_time.split(':').map(Number);
      const duration = Number(daySchedule.slot_duration_minutes) || 30;
      let cur = sh * 60 + sm;
      const endMin = eh * 60 + em;

      while (cur + duration <= endMin) {
        const sH = String(Math.floor(cur / 60)).padStart(2, '0');
        const sM = String(cur % 60).padStart(2, '0');
        const eSlot = cur + duration;
        const eH = String(Math.floor(eSlot / 60)).padStart(2, '0');
        const eM = String(eSlot % 60).padStart(2, '0');
        slotsToInsert.push({
          business_id: negocio.id,
          professional_id: selectedProf,
          specific_date: date.toISOString().slice(0, 10),
          start_time: `${sH}:${sM}`,
          end_time: `${eH}:${eM}`,
          is_active: true,
        });
        cur += duration;
      }
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

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#e31b23] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {DAYS.map(({ value, label }) => {
              const day = schedule[value];
              return (
                <div key={value} className={`px-4 py-3 flex items-center gap-4 flex-wrap ${!day.is_active ? 'opacity-50' : ''}`}>
                  <label className="flex items-center gap-2 cursor-pointer w-28 shrink-0">
                    <input
                      type="checkbox"
                      checked={day.is_active}
                      onChange={e => updateDay(value, 'is_active', e.target.checked)}
                      className="w-4 h-4 accent-[#e31b23]"
                    />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </label>

                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="time"
                      value={day.start_time}
                      disabled={!day.is_active}
                      onChange={e => updateDay(value, 'start_time', e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e31b23]/30 disabled:bg-gray-50"
                    />
                    <span className="text-gray-400 text-sm">–</span>
                    <input
                      type="time"
                      value={day.end_time}
                      disabled={!day.is_active}
                      onChange={e => updateDay(value, 'end_time', e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e31b23]/30 disabled:bg-gray-50"
                    />
                    <select
                      value={day.slot_duration_minutes}
                      disabled={!day.is_active}
                      onChange={e => updateDay(value, 'slot_duration_minutes', Number(e.target.value))}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e31b23]/30 disabled:bg-gray-50"
                    >
                      {[15, 20, 30, 45, 60, 90, 120].map(m => (
                        <option key={m} value={m}>{m} min</option>
                      ))}
                    </select>
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
        "Guardar horario" guarda la plantilla semanal. "Generar turnos" crea los slots disponibles en el sistema para las próximas 4 semanas, sin duplicar los existentes.
      </p>
    </div>
  );
}
