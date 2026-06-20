import { Fragment, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MapPin, CheckCircle, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase.js';
import useProfileStore from '../store/profileStore.js';
import { useAuth } from '../context/AuthContext.jsx';
import { subscribeToPush } from '../lib/pushNotifications.js';
import { CATEGORY_INFO } from './Turnos.jsx';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.148 17.64 11.84 17.64 9.2z" fill="#fff"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#fff" opacity="0.85"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#fff" opacity="0.7"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#fff" opacity="0.55"/>
    </svg>
  );
}

const STEP_LABELS = ['Servicio', 'Profesional', 'Día', 'Horario', 'Confirmar'];
const DAYS_AHEAD = 28;

function pad(n) { return String(n).padStart(2, '0'); }
function toISODate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function timeToMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function minToTime(min) { return `${pad(Math.floor(min / 60))}:${pad(min % 60)}:00`; }
function fmtTime(t) { return t ? t.slice(0, 5) : ''; }

function getNextDays() {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push({ date, iso: toISODate(date), dow: date.getDay() });
  }
  return days;
}

function SuccessScreen({ business, service, professional, day, time }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: '#22c55e' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <style>{`
        @keyframes checkmarkDraw { to { stroke-dashoffset: 0; } }
        @keyframes circlePop {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div
        style={{
          width: 140, height: 140, borderRadius: '50%', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          animation: 'circlePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        }}
      >
        <svg viewBox="0 0 52 52" width={78} height={78} fill="none">
          <path
            d="M14 27 L22 35 L38 17"
            stroke="#22c55e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"
            style={{ strokeDasharray: 40, strokeDashoffset: 40, animation: 'checkmarkDraw 0.5s 0.4s ease-out forwards' }}
          />
        </svg>
      </div>

      <motion.p
        className="text-3xl font-extrabold text-white mt-7 text-center px-8"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.4, ease: 'easeOut' }}
      >
        ¡Turno confirmado!
      </motion.p>
      <motion.p
        className="text-base font-semibold mt-2 text-center px-8"
        style={{ color: 'rgba(255,255,255,0.9)' }}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.4, ease: 'easeOut' }}
      >
        {business?.name} · {service?.name}
        {professional && ` · ${professional.name}`}
        <br />
        {day?.date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} a las {fmtTime(time)}
      </motion.p>
    </motion.div>
  );
}

export default function TurnoNegocio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { name: profileName, phone: profilePhone } = useProfileStore();
  const { session } = useAuth();

  const [business, setBusiness]           = useState(null);
  const [services, setServices]           = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [slots, setSlots]                 = useState([]);
  const [loading, setLoading]             = useState(true);

  const [step, setStep]                               = useState(1);
  const [selectedService, setSelectedService]         = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedDay, setSelectedDay]                 = useState(null);
  const [selectedTime, setSelectedTime]               = useState(null);
  const [booked, setBooked]                           = useState([]);

  const [form, setForm]           = useState({ name: '', phone: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]     = useState(false);

  const [loginMode, setLoginMode]           = useState(null);
  const [loginForm, setLoginForm]           = useState({ email: '', password: '' });
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast.error('No se pudo conectar con Google');
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      toast.error('Completá email y contraseña');
      return;
    }
    setLoginSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginForm.email.trim(),
        password: loginForm.password,
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoginSubmitting(false);
    }
  };

  useEffect(() => {
    setForm(f => ({ ...f, name: f.name || profileName || '', phone: f.phone || profilePhone || '' }));
  }, [profileName, profilePhone]);

  // Load all data upfront
  useEffect(() => {
    Promise.all([
      supabase.from('appointment_businesses').select('*').eq('id', id).single(),
      supabase.from('appointment_services').select('*').eq('business_id', id).order('price'),
      supabase.from('appointment_slots').select('*').eq('business_id', id).eq('is_active', true),
      supabase.from('appointment_professionals').select('id, name, avatar_url')
        .eq('business_id', id).eq('is_active', true).order('name'),
    ]).then(([b, s, sl, pr]) => {
      setBusiness(b.data);
      setServices(s.data || []);
      setSlots(sl.data || []);
      const profs = pr.data || [];
      setProfessionals(profs);
      // Auto-select if only one professional (skip the step)
      if (profs.length === 1) setSelectedProfessional(profs[0]);
      setLoading(false);
    });
  }, [id]);

  // Reset day/time when professional changes
  useEffect(() => {
    setSelectedDay(null);
    setSelectedTime(null);
  }, [selectedProfessional]);

  // Load booked appointments for selected day + professional
  useEffect(() => {
    if (!selectedDay || !selectedProfessional) { setBooked([]); return; }
    supabase.from('appointments')
      .select('start_time, end_time, status')
      .eq('business_id', id)
      .eq('professional_id', selectedProfessional.id)
      .eq('date', selectedDay.iso)
      .neq('status', 'cancelled')
      .then(({ data }) => setBooked(data || []));
  }, [id, selectedDay, selectedProfessional]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => navigate('/turnos'), 2800);
    return () => clearTimeout(t);
  }, [success, navigate]);

  // Days that have at least one active slot for the selected professional
  const availableDays = useMemo(() => {
    if (!selectedProfessional) return [];
    const nowIso = toISODate(new Date());
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    return getNextDays().filter(day =>
      slots.some(s => {
        if (s.specific_date !== day.iso || s.professional_id !== selectedProfessional.id) return false;
        // Exclude slots that have already started today
        if (day.iso === nowIso && timeToMin(s.start_time) <= nowMin) return false;
        return true;
      })
    );
  }, [slots, selectedProfessional]);

  // Available booking times: each slot's start_time is a valid booking start
  const timeSlots = useMemo(() => {
    if (!selectedDay || !selectedService || !selectedProfessional) return [];
    const daySlots = slots.filter(s =>
      s.specific_date === selectedDay.iso && s.professional_id === selectedProfessional.id
    );
    const duration = selectedService.duration_minutes;
    const isToday = selectedDay.iso === toISODate(new Date());
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

    return [...new Set(daySlots.map(s => minToTime(timeToMin(s.start_time))))]
      .filter(t => {
        const tMin = timeToMin(t);
        if (isToday && tMin <= nowMin) return false;
        const tEnd = tMin + duration;
        return !booked.some(a => {
          const aStart = timeToMin(a.start_time);
          const aEnd = timeToMin(a.end_time);
          return tMin < aEnd && aStart < tEnd;
        });
      })
      .sort();
  }, [slots, selectedDay, selectedService, selectedProfessional, booked]);

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1);
    else navigate(-1);
  };

  const canContinue =
    step === 1 ? !!selectedService :
    step === 2 ? !!selectedProfessional :
    step === 3 ? !!selectedDay :
    step === 4 ? !!selectedTime :
    true;

  // When pressing Continuar on step 1, if only 1 professional skip to step 3
  const handleContinue = () => {
    if (step === 1 && professionals.length === 1) {
      setStep(3);
    } else {
      setStep(s => s + 1);
    }
  };

  const handleConfirm = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Completá tu nombre y teléfono');
      return;
    }
    setSubmitting(true);
    try {
      const endTime = minToTime(timeToMin(selectedTime) + selectedService.duration_minutes);
      const { error } = await supabase.from('appointments').insert({
        business_id: business.id,
        professional_id: selectedProfessional.id,
        service_id: selectedService.id,
        customer_name: form.name.trim(),
        customer_phone: form.phone.trim(),
        date: selectedDay.iso,
        start_time: selectedTime,
        end_time: endTime,
        status: 'pending',
        notes: form.notes.trim() || null,
        customer_user_id: session?.user?.id ?? null,
      });
      if (error) throw error;
      setSuccess(true);
      if (session?.user?.id) {
        subscribeToPush(session.user.id, supabase).catch(() => {});
      }
    } catch (err) {
      toast.error('Error al reservar: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) return (
    <SuccessScreen
      business={business}
      service={selectedService}
      professional={selectedProfessional}
      day={selectedDay}
      time={selectedTime}
    />
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-nav sticky top-0 z-40">
          <div className="h-14 flex items-center px-4 gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="font-bold">Turno</span>
          </div>
        </nav>
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-200" />)}
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-nav sticky top-0 z-40">
          <div className="h-14 flex items-center px-4 gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="font-bold">Turno</span>
          </div>
        </nav>
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <p className="font-semibold text-gray-600">Negocio no encontrado</p>
        </div>
      </div>
    );
  }

  const catInfo = CATEGORY_INFO[business.category] || CATEGORY_INFO.otro;
  // Visible step labels: if only 1 professional, hide the Profesional step from indicator
  const visibleLabels = professionals.length === 1
    ? STEP_LABELS.filter(l => l !== 'Profesional')
    : STEP_LABELS;
  // Map real step to indicator position
  const indicatorStep = (professionals.length === 1 && step >= 3) ? step - 1 : step;

  return (
    <div className="min-h-screen bg-gray-100" style={{ paddingBottom: 100 }}>
      <nav className="bg-white shadow-nav sticky top-0 z-40">
        <div className="h-14 flex items-center px-4 gap-3">
          <button onClick={handleBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold truncate">{business.name}</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Info del negocio */}
        <div className="card p-4 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 overflow-hidden"
            style={{ background: catInfo.bg }}
          >
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
            ) : catInfo.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{business.name}</p>
            {business.address && (
              <p className="text-xs text-gray-500 truncate mt-0.5 flex items-center gap-1">
                <MapPin size={11} /> {business.address}
              </p>
            )}
          </div>
          <span className="badge text-xs shrink-0" style={{ background: catInfo.bg, color: catInfo.color }}>
            {catInfo.label}
          </span>
        </div>

        {/* Indicador de pasos */}
        <div className="card p-4">
          <div className="flex items-center">
            {visibleLabels.map((_, idx) => (
              <Fragment key={idx}>
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 transition-colors duration-300"
                  style={{ background: idx <= indicatorStep - 1 ? '#e31b23' : '#E5E7EB' }}
                />
                {idx < visibleLabels.length - 1 && (
                  <div
                    className="flex-1 h-1 rounded-full mx-1 transition-colors duration-300"
                    style={{ background: idx < indicatorStep - 1 ? '#e31b23' : '#E5E7EB' }}
                  />
                )}
              </Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            {visibleLabels.map((label, idx) => (
              <span key={label} className="text-[9px] font-bold" style={{ color: idx <= indicatorStep - 1 ? '#111' : '#9CA3AF' }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Contenido del paso */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Paso 1: Servicio */}
            {step === 1 && (
              <div className="card p-5 space-y-3">
                <h2 className="font-bold text-base">Elegí el servicio</h2>
                {services.length === 0 ? (
                  <p className="text-sm text-gray-400">Este negocio no tiene servicios configurados todavía.</p>
                ) : services.map(s => {
                  const active = selectedService?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedService(s)}
                      className="flex items-center gap-3 rounded-xl border-2 p-3 w-full text-left transition-colors"
                      style={{ borderColor: active ? '#e31b23' : '#E5E7EB', background: active ? '#fef2f2' : '#fff' }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{s.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.duration_minutes} min</p>
                      </div>
                      {s.price != null && (
                        <p className="font-bold text-sm text-primary shrink-0">${Number(s.price).toLocaleString('es-AR')}</p>
                      )}
                      {active && <CheckCircle size={18} className="text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Paso 2: Profesional */}
            {step === 2 && (
              <div className="card p-5 space-y-3">
                <h2 className="font-bold text-base">Elegí el profesional</h2>
                {professionals.length === 0 ? (
                  <p className="text-sm text-gray-400">No hay profesionales disponibles.</p>
                ) : professionals.map(prof => {
                  const active = selectedProfessional?.id === prof.id;
                  return (
                    <button
                      key={prof.id}
                      type="button"
                      onClick={() => setSelectedProfessional(prof)}
                      className="flex items-center gap-3 rounded-xl border-2 p-3 w-full text-left transition-colors"
                      style={{ borderColor: active ? '#e31b23' : '#E5E7EB', background: active ? '#fef2f2' : '#fff' }}
                    >
                      {prof.avatar_url
                        ? <img src={prof.avatar_url} alt={prof.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                        : <UserCircle size={40} className="text-gray-300 shrink-0" />}
                      <span className="font-semibold text-sm flex-1">{prof.name}</span>
                      {active && <CheckCircle size={18} className="text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Paso 3: Día */}
            {step === 3 && (
              <div className="card p-5 space-y-3">
                <h2 className="font-bold text-base">Elegí el día</h2>
                {availableDays.length === 0 ? (
                  <p className="text-sm text-gray-400">No hay días disponibles para este profesional.</p>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {availableDays.map(day => {
                      const active = selectedDay?.iso === day.iso;
                      return (
                        <button
                          key={day.iso}
                          type="button"
                          onClick={() => { setSelectedDay(day); setSelectedTime(null); }}
                          className="shrink-0 flex flex-col items-center justify-center rounded-2xl border-2 transition-colors"
                          style={{
                            width: 64, height: 72,
                            borderColor: active ? '#e31b23' : '#E5E7EB',
                            background: active ? '#e31b23' : '#fff',
                            color: active ? '#fff' : '#111',
                          }}
                        >
                          <span className="text-[11px] font-bold uppercase" style={{ opacity: 0.8 }}>
                            {day.date.toLocaleDateString('es-AR', { weekday: 'short' })}
                          </span>
                          <span className="text-lg font-extrabold mt-0.5">{day.date.getDate()}</span>
                          <span className="text-[10px] font-semibold" style={{ opacity: 0.8 }}>
                            {day.date.toLocaleDateString('es-AR', { month: 'short' })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Paso 4: Horario */}
            {step === 4 && (
              <div className="card p-5 space-y-3">
                <h2 className="font-bold text-base">Elegí el horario</h2>
                {selectedDay && (
                  <p className="text-xs text-gray-500 capitalize">
                    {selectedDay.date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    {selectedProfessional && ` · ${selectedProfessional.name}`}
                  </p>
                )}
                {timeSlots.length === 0 ? (
                  <p className="text-sm text-gray-400">No quedan horarios disponibles este día. Probá otro día.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map(t => {
                      const active = selectedTime === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSelectedTime(t)}
                          className="rounded-xl border-2 py-2.5 text-sm font-bold transition-colors"
                          style={{
                            borderColor: active ? '#e31b23' : '#E5E7EB',
                            background: active ? '#e31b23' : '#fff',
                            color: active ? '#fff' : '#374151',
                          }}
                        >
                          {fmtTime(t)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Paso 5: Confirmar */}
            {step === 5 && (
              <>
                {!session ? (
                  <div className="card p-5 space-y-4">
                    <div>
                      <h2 className="font-bold text-base">Iniciá sesión para confirmar</h2>
                      <p className="text-sm text-gray-500 mt-1">Guardamos tu turno en tu cuenta y te avisamos 2hs antes.</p>
                    </div>

                    {loginMode !== 'email' ? (
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={handleGoogleLogin}
                          className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                          <GoogleIcon /> Continuar con Google
                        </button>
                        <button
                          type="button"
                          onClick={() => setLoginMode('email')}
                          className="w-full py-2 text-sm font-bold text-primary text-center"
                        >
                          Usar email y contraseña
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleEmailLogin} className="space-y-3">
                        <input
                          type="email"
                          required
                          value={loginForm.email}
                          onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                          placeholder="Email"
                          className="input"
                          autoCapitalize="none"
                        />
                        <input
                          type="password"
                          required
                          value={loginForm.password}
                          onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                          placeholder="Contraseña"
                          className="input"
                        />
                        <button type="submit" disabled={loginSubmitting} className="btn-primary w-full">
                          {loginSubmitting ? 'Un momento...' : 'Iniciar sesión'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setLoginMode(null)}
                          className="w-full py-1 text-sm font-bold text-gray-400 text-center"
                        >
                          Volver
                        </button>
                      </form>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="card p-5 space-y-3">
                      <h2 className="font-bold text-base">Tus datos</h2>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Tu nombre</label>
                        <input
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Juan García"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Teléfono</label>
                        <input
                          value={form.phone}
                          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                          placeholder="3571-123456"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Notas (opcional)</label>
                        <input
                          value={form.notes}
                          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                          placeholder="Algo que quieras avisar..."
                          className="input"
                        />
                      </div>
                    </div>

                    <div className="card p-5">
                      <h2 className="font-bold text-base mb-3">Resumen</h2>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Negocio</span>
                          <span className="font-semibold text-right">{business.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Servicio</span>
                          <span className="font-semibold text-right">{selectedService?.name}</span>
                        </div>
                        {selectedProfessional && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Profesional</span>
                            <span className="font-semibold text-right">{selectedProfessional.name}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-500">Día</span>
                          <span className="font-semibold text-right capitalize">
                            {selectedDay?.date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Horario</span>
                          <span className="font-semibold text-right">{fmtTime(selectedTime)}</span>
                        </div>
                        {selectedService?.price != null && (
                          <div className="border-t border-neutral-100 mt-2 pt-2 flex justify-between font-bold text-base">
                            <span>Precio</span>
                            <span className="text-primary">${Number(selectedService.price).toLocaleString('es-AR')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Barra inferior fija */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white"
        style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.10)', padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-2xl mx-auto">
          {step < 5 ? (
            <button type="button" onClick={handleContinue} disabled={!canContinue} className="btn-primary w-full">
              Continuar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting || !session || !form.name.trim() || !form.phone.trim()}
              className="btn-primary w-full"
            >
              {submitting ? 'Reservando...' : 'Confirmar turno'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
