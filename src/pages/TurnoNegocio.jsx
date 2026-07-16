import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MapPin, CheckCircle, UserCircle, Bell } from 'lucide-react';
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

const STEP_LABELS = ['Servicio', 'Profesional', 'Día y Horario', 'Confirmar'];
const DAYS_AHEAD = 28;

function pad(n) { return String(n).padStart(2, '0'); }
function toISODate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function timeToMin(t) { const [h, m] = String(t).split(':').map(Number); return h * 60 + m; }
function minToTime(min) { return `${pad(Math.floor(min / 60))}:${pad(min % 60)}:00`; }
function fmtTime(t) { return t ? t.slice(0, 5) : ''; }

function getContrastColor(hex) {
  if (!hex || hex.length < 4) return '#1A1A1A';
  const h = hex.replace('#', '');
  const r = parseInt(h.length === 3 ? h[0]+h[0] : h.substring(0,2), 16) / 255;
  const g = parseInt(h.length === 3 ? h[1]+h[1] : h.substring(2,4), 16) / 255;
  const b = parseInt(h.length === 3 ? h[2]+h[2] : h.substring(4,6), 16) / 255;
  const l = (Math.max(r,g,b) + Math.min(r,g,b)) / 2;
  return l > 0.5 ? '#1A1A1A' : '#FFFFFF';
}

function getMondayOf(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0=Sun
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return d;
}

function getNextDays() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const days = [];
  for (let i = 0; i < DAYS_AHEAD; i++) {
    // new Date(year, month, day) auto-advances month when day > month length
    const date = new Date(y, m, d + i);
    days.push({ date, iso: toISODate(date), dow: date.getDay() });
  }
  return days;
}

function SuccessScreen({ business, service, professional, day, time }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: '#2E7D32' }}
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
      <div style={{
        width: 140, height: 140, borderRadius: '50%', background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
        animation: 'circlePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      }}>
        <svg viewBox="0 0 52 52" width={78} height={78} fill="none">
          <path
            d="M14 27 L22 35 L38 17"
            stroke="#2E7D32" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"
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

  const [business, setBusiness]             = useState(null);
  const [services, setServices]             = useState([]);
  const [professionals, setProfessionals]   = useState([]);
  const [slots, setSlots]                   = useState([]);
  const [loading, setLoading]               = useState(true);

  const [step, setStep]                               = useState(1);
  const [selectedService, setSelectedService]         = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedDay, setSelectedDay]                 = useState(null);
  const [selectedTime, setSelectedTime]               = useState(null);
  const [booked, setBooked]                           = useState([]);
  const [loadingBooked, setLoadingBooked]             = useState(false);

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
      if (profs.length === 1) setSelectedProfessional(profs[0]);
      setLoading(false);
    });
  }, [id]);

  // Reset calendar when professional changes
  useEffect(() => {
    setSelectedDay(null);
    setSelectedTime(null);
  }, [selectedProfessional]);

  // Load booked appointments for selected day + professional
  useEffect(() => {
    if (!selectedDay || !selectedProfessional) { setBooked([]); return; }
    setLoadingBooked(true);
    supabase.from('appointments')
      .select('start_time, end_time, status')
      .eq('business_id', id)
      .eq('professional_id', selectedProfessional.id)
      .eq('date', selectedDay.iso)
      .neq('status', 'cancelled')
      .then(({ data }) => { setBooked(data || []); setLoadingBooked(false); });
  }, [id, selectedDay, selectedProfessional]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => navigate('/turnos'), 2800);
    return () => clearTimeout(t);
  }, [success, navigate]);

  // Dynamic status bar color while viewing this business
  useEffect(() => {
    if (!business) return;
    const color = business.status_bar_color || business.background_color || '#0D9488';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', color);
    return () => { if (meta) meta.setAttribute('content', '#0F172A'); };
  }, [business]);

  // ── Calendar computation ──────────────────────────────────────────────────
  const todayIso = toISODate(new Date());
  const nowMin   = new Date().getHours() * 60 + new Date().getMinutes();

  // All bookable days (28 days from today)
  const allDays = useMemo(() => getNextDays(), []);

  // Which days have at least one bookable slot
  const dayAvailability = useMemo(() => {
    if (!selectedProfessional) return {};
    const result = {};
    allDays.forEach(day => {
      result[day.iso] = slots.some(s => {
        if (s.specific_date !== day.iso || s.professional_id !== selectedProfessional.id) return false;
        if (day.iso === todayIso && timeToMin(s.start_time) <= nowMin) return false;
        return true;
      });
    });
    return result;
  }, [slots, selectedProfessional, allDays, todayIso, nowMin]);

  const dayPickerRef = useRef(null);

  // Auto-scroll day strip to keep selected day centered
  useEffect(() => {
    if (!selectedDay || !dayPickerRef.current) return;
    const el = dayPickerRef.current.querySelector(`[data-date="${selectedDay.iso}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selectedDay]);

  // Auto-select first available day when entering step 3
  useEffect(() => {
    if (step !== 3 || !selectedProfessional || selectedDay) return;
    const first = allDays.find(day =>
      slots.some(s => {
        if (s.specific_date !== day.iso || s.professional_id !== selectedProfessional.id) return false;
        if (day.iso === todayIso && timeToMin(s.start_time) <= nowMin) return false;
        return true;
      })
    );
    if (first) setSelectedDay(first);
  }, [step, selectedProfessional, selectedDay, slots, todayIso, nowMin, allDays]);

  // ── Slot states for the selected day ──────────────────────────────────────
  const calendarSlots = useMemo(() => {
    if (!selectedDay || !selectedProfessional) return [];
    const dur = selectedService?.duration_minutes || 30;
    const isToday = selectedDay.iso === todayIso;

    return slots
      .filter(s => s.specific_date === selectedDay.iso && s.professional_id === selectedProfessional.id)
      .map(slot => {
        const tMin    = timeToMin(slot.start_time);
        const timeStr = String(slot.start_time).slice(0, 5);
        const isPast  = isToday && tMin <= nowMin;
        const tEnd    = tMin + dur;
        const isOccupied = !isPast && booked.some(a => {
          const aStart = timeToMin(a.start_time);
          const aEnd   = timeToMin(a.end_time);
          return tMin < aEnd && aStart < tEnd;
        });
        const state = isPast ? 'past' : isOccupied ? 'booked' : 'available';
        return { id: slot.id, timeStr, state };
      })
      .filter(slot => slot.state !== 'past')
      .sort((a, b) => a.timeStr.localeCompare(b.timeStr));
  }, [slots, selectedDay, selectedProfessional, booked, selectedService, todayIso, nowMin]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleBack = () => {
    if (step === 1) {
      navigate(-1);
    } else if (step === 3) {
      setSelectedDay(null);
      setSelectedTime(null);
      setStep(professionals.length === 1 ? 1 : 2);
    } else {
      setStep(s => s - 1);
    }
  };

  const canContinue =
    step === 1 ? !!selectedService :
    step === 2 ? !!selectedProfessional :
    true;

  const handleContinue = () => {
    if (step === 1 && professionals.length === 1) setStep(3);
    else setStep(s => s + 1);
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
      if (session?.user?.id) subscribeToPush(session.user.id, supabase).catch(() => {});
    } catch (err) {
      toast.error('Error al reservar: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render guards ─────────────────────────────────────────────────────────
  if (success) return (
    <SuccessScreen
      business={business}
      service={selectedService}
      professional={selectedProfessional}
      day={selectedDay}
      time={selectedTime}
    />
  );

  const RedHeader = ({ title, onBack }) => (
    <header className="sticky top-0 z-40" style={{ background: '#0D9488', borderRadius: '0 0 24px 24px', padding: '0 18px 18px', boxShadow: '0 4px 20px rgba(13,148,136,0.25)' }}>
      <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', cursor: 'pointer' }}>
            <ChevronLeft size={22} color="white" />
          </button>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 18, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</span>
        </div>
        <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }}>
          <Bell size={20} color="white" />
        </div>
      </div>
    </header>
  );

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#F9FAFB' }}>
        <RedHeader title="Reserva de Turno" onBack={() => navigate(-1)} />
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-200" />)}
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen" style={{ background: '#F9FAFB' }}>
        <RedHeader title="Reserva de Turno" onBack={() => navigate(-1)} />
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <p className="font-semibold text-gray-600">Negocio no encontrado</p>
        </div>
      </div>
    );
  }

  const catInfo = CATEGORY_INFO[business.category] || CATEGORY_INFO.otro;

  const GLASS = {
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 16,
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  };

  const textColor  = getContrastColor(business.background_color || '#FFFFFF');
  const isLight    = textColor === '#1A1A1A';
  const mutedColor = isLight ? '#6B7280' : 'rgba(255,255,255,0.55)';
  const dimColor   = isLight ? '#E9D5D8' : 'rgba(255,255,255,0.2)';

  const visibleLabels  = professionals.length === 1
    ? STEP_LABELS.filter(l => l !== 'Profesional')
    : STEP_LABELS;
  const indicatorStep = (professionals.length === 1 && step >= 3) ? step - 1 : step;

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', background: business.background_color || '#FFFFFF', paddingBottom: 100 }}>

      {/* Cover image header — extends behind iOS status bar (black-translucent) */}
      <div style={{ position: 'relative', height: 'calc(220px + env(safe-area-inset-top, 0px))', overflow: 'hidden' }}>
        {business.logo_url ? (
          <img
            src={business.logo_url}
            alt={business.name}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              objectPosition: business.cover_position || '50% 50%',
            }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: `linear-gradient(145deg, ${catInfo.color}cc 0%, ${catInfo.color}66 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 64, opacity: 0.35 }}>{catInfo.emoji}</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.18) 55%, rgba(0,0,0,0.32) 100%)',
        }} />

        {/* Status bar color strip — fills the safe area at the top so the bar shows this color */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 'env(safe-area-inset-top, 0px)',
          background: business.status_bar_color || business.background_color || '#0D9488',
          zIndex: 3,
        }} />

        {/* Back button — pushed below the status bar */}
        <button
          onClick={handleBack}
          style={{
            position: 'absolute', top: 'calc(14px + env(safe-area-inset-top, 0px))', left: 14,
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.25)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronLeft size={20} color="#fff" />
        </button>

        {/* Business info at bottom of header */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 16px 16px' }}>
          <p style={{ margin: '0 0 4px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color: '#fff', padding: '3px 10px', borderRadius: 99,
              fontSize: 11, fontWeight: 700,
              border: '1px solid rgba(255,255,255,0.22)',
            }}>
              {catInfo.emoji} {catInfo.label}
            </span>
          </p>
          <h1 style={{
            color: '#fff', fontWeight: 800, fontSize: 22, margin: 0,
            lineHeight: 1.2, textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}>
            {business.name}
          </h1>
          {business.address && (
            <p style={{
              color: 'rgba(255,255,255,0.8)', fontSize: 12, margin: '4px 0 0',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <MapPin size={11} /> {business.address}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {business.description && (
          <p style={{ color: mutedColor, fontSize: 13, lineHeight: 1.5, margin: 0 }}>
            {business.description}
          </p>
        )}

        {/* Step indicator */}
        <div className="card p-4" style={GLASS}>
          <div className="flex items-center">
            {visibleLabels.map((_, idx) => (
              <Fragment key={idx}>
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 transition-colors duration-300"
                  style={{ background: idx <= indicatorStep - 1 ? '#0D9488' : dimColor }}
                />
                {idx < visibleLabels.length - 1 && (
                  <div
                    className="flex-1 h-1 rounded-full mx-1 transition-colors duration-300"
                    style={{ background: idx < indicatorStep - 1 ? '#0D9488' : dimColor }}
                  />
                )}
              </Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            {visibleLabels.map((label, idx) => (
              <span key={label} className="text-[9px] font-bold" style={{ color: idx <= indicatorStep - 1 ? textColor : mutedColor }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >

            {/* Step 1: Servicio */}
            {step === 1 && (
              <div className="card p-5 space-y-3" style={GLASS}>
                <h2 className="font-bold text-base" style={{ color: textColor }}>Elegí el servicio</h2>
                {services.length === 0 ? (
                  <p className="text-sm" style={{ color: mutedColor }}>Este negocio no tiene servicios configurados todavía.</p>
                ) : services.map(s => {
                  const active = selectedService?.id === s.id;
                  return (
                    <button
                      key={s.id} type="button" onClick={() => setSelectedService(s)}
                      className="flex items-center gap-3 rounded-xl border-2 p-3 w-full text-left transition-colors"
                      style={{ borderColor: active ? '#0D9488' : '#E9D5D8', background: active ? '#FFF8F8' : '#fff' }}
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

            {/* Step 2: Profesional */}
            {step === 2 && (
              <div className="card p-5 space-y-3" style={GLASS}>
                <h2 className="font-bold text-base" style={{ color: textColor }}>Elegí el profesional</h2>
                {professionals.length === 0 ? (
                  <p className="text-sm" style={{ color: mutedColor }}>No hay profesionales disponibles.</p>
                ) : professionals.map(prof => {
                  const active = selectedProfessional?.id === prof.id;
                  return (
                    <button
                      key={prof.id} type="button" onClick={() => setSelectedProfessional(prof)}
                      className="flex items-center gap-3 rounded-xl border-2 p-3 w-full text-left transition-colors"
                      style={{ borderColor: active ? '#0D9488' : '#E9D5D8', background: active ? '#FFF8F8' : '#fff' }}
                    >
                      {prof.avatar_url
                        ? <img src={prof.avatar_url} alt={prof.name} loading="lazy" className="w-10 h-10 rounded-full object-cover shrink-0" />
                        : <UserCircle size={40} className="text-gray-300 shrink-0" />}
                      <span className="font-semibold text-sm flex-1">{prof.name}</span>
                      {active && <CheckCircle size={18} className="text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 3: Día y Horario (combined calendar view) */}
            {step === 3 && (
              <div className="space-y-3">

                {/* Week calendar card */}
                <div className="card p-4 space-y-3" style={GLASS}>

                  {/* Month label - tracks selected day */}
                  {selectedDay && (
                    <p className="text-sm font-bold capitalize" style={{ color: textColor }}>
                      {selectedDay.date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                    </p>
                  )}

                  {/* Horizontally scrollable day strip */}
                  <div
                    ref={dayPickerRef}
                    className="flex gap-1 overflow-x-auto pb-1"
                    style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none' }}
                  >
                    {allDays.map(day => {
                      const isPast      = day.iso < todayIso;
                      const isAvailable = !isPast && dayAvailability[day.iso];
                      const isSelected  = selectedDay?.iso === day.iso;
                      const isDisabled  = isPast || !isAvailable;
                      const dayAbbr     = day.date.toLocaleDateString('es-AR', { weekday: 'short' }).slice(0, 3).toUpperCase();

                      return (
                        <button
                          key={day.iso}
                          data-date={day.iso}
                          disabled={isDisabled}
                          onClick={() => { setSelectedDay(day); setSelectedTime(null); }}
                          className="flex flex-col items-center py-2.5 rounded-xl transition-all shrink-0"
                          style={{
                            minWidth: 44,
                            background: isSelected ? '#111' : 'transparent',
                            color: isSelected ? '#fff' : isDisabled ? dimColor : textColor,
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <span className="text-[10px] font-bold leading-none">{dayAbbr}</span>
                          <span className="text-base font-extrabold leading-none mt-1">{day.date.getDate()}</span>
                          <span
                            className="w-1 h-1 rounded-full mt-1"
                            style={{ background: isSelected ? '#fff' : isAvailable ? '#2E7D32' : 'transparent' }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Slot grid card */}
                <div className="card p-5 space-y-4" style={GLASS}>
                  {selectedDay ? (
                    <>
                      <p className="text-sm font-semibold capitalize" style={{ color: textColor }}>
                        {selectedDay.date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        {selectedProfessional && professionals.length > 1 && (
                          <span className="font-normal" style={{ color: mutedColor }}> · {selectedProfessional.name}</span>
                        )}
                      </p>

                      {loadingBooked ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-5 h-5 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : calendarSlots.length === 0 ? (
                        <p className="text-sm py-4 text-center" style={{ color: mutedColor }}>
                          No hay horarios para este día. Elegí otro día.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {calendarSlots.map(slot => {
                            const isAvail  = slot.state === 'available';
                            const isBooked = slot.state === 'booked';

                            return (
                              <button
                                key={slot.id}
                                disabled={!isAvail}
                                onClick={() => {
                                  setSelectedTime(slot.timeStr + ':00');
                                  setStep(4);
                                }}
                                className="rounded-xl border py-3.5 text-sm font-bold transition-all flex flex-col items-center gap-0.5"
                                style={
                                  isAvail ? {
                                    background: '#f0fdf4',
                                    borderColor: '#86efac',
                                    color: '#166534',
                                    cursor: 'pointer',
                                  } : {
                                    background: '#fff1f2',
                                    borderColor: '#fecaca',
                                    color: '#f87171',
                                    cursor: 'not-allowed',
                                    opacity: 0.8,
                                  }
                                }
                              >
                                <span>{slot.timeStr}</span>
                                {isBooked && <span className="text-[10px] font-normal opacity-70">Reservado</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Legend */}
                      {calendarSlots.length > 0 && (
                        <div className="flex items-center gap-4 pt-1 flex-wrap" style={{ borderTop: `1px solid ${dimColor}` }}>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded" style={{ background: '#bbf7d0', border: '1px solid #86efac' }} />
                            <span className="text-xs" style={{ color: mutedColor }}>Disponible</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded" style={{ background: '#fee2e2', border: '1px solid #fecaca' }} />
                            <span className="text-xs" style={{ color: mutedColor }}>Reservado</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-center py-6" style={{ color: mutedColor }}>
                      Seleccioná un día para ver los horarios disponibles
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Confirmar */}
            {step === 4 && (
              <>
                {!session ? (
                  <div className="card p-5 space-y-4" style={GLASS}>
                    <div>
                      <h2 className="font-bold text-base" style={{ color: textColor }}>Iniciá sesión para confirmar</h2>
                      <p className="text-sm mt-1" style={{ color: mutedColor }}>Guardamos tu turno en tu cuenta y te avisamos 2hs antes.</p>
                    </div>
                    {loginMode !== 'email' ? (
                      <div className="space-y-3">
                        <button type="button" onClick={handleGoogleLogin} className="btn-primary w-full flex items-center justify-center gap-2">
                          <GoogleIcon /> Continuar con Google
                        </button>
                        <button type="button" onClick={() => setLoginMode('email')} className="w-full py-2 text-sm font-bold text-primary text-center">
                          Usar email y contraseña
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleEmailLogin} className="space-y-3">
                        <input
                          type="email" required value={loginForm.email} autoCapitalize="none"
                          onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                          placeholder="Email" className="input"
                        />
                        <input
                          type="password" required value={loginForm.password}
                          onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                          placeholder="Contraseña" className="input"
                        />
                        <button type="submit" disabled={loginSubmitting} className="btn-primary w-full">
                          {loginSubmitting ? 'Un momento...' : 'Iniciar sesión'}
                        </button>
                        <button type="button" onClick={() => setLoginMode(null)} className="w-full py-1 text-sm font-bold text-center" style={{ color: mutedColor }}>
                          Volver
                        </button>
                      </form>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="card p-5 space-y-3" style={GLASS}>
                      <h2 className="font-bold text-base" style={{ color: textColor }}>Tus datos</h2>
                      <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: mutedColor }}>Tu nombre</label>
                        <input
                          value={form.name} placeholder="Juan García" className="input"
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: mutedColor }}>Teléfono</label>
                        <input
                          value={form.phone} placeholder="3571-123456" className="input"
                          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: mutedColor }}>Notas (opcional)</label>
                        <input
                          value={form.notes} placeholder="Algo que quieras avisar..." className="input"
                          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="card p-5" style={GLASS}>
                      <h2 className="font-bold text-base mb-3" style={{ color: textColor }}>Resumen</h2>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span style={{ color: mutedColor }}>Negocio</span>
                          <span className="font-semibold text-right" style={{ color: textColor }}>{business.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: mutedColor }}>Servicio</span>
                          <span className="font-semibold text-right" style={{ color: textColor }}>{selectedService?.name}</span>
                        </div>
                        {selectedProfessional && (
                          <div className="flex justify-between">
                            <span style={{ color: mutedColor }}>Profesional</span>
                            <span className="font-semibold text-right" style={{ color: textColor }}>{selectedProfessional.name}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span style={{ color: mutedColor }}>Día</span>
                          <span className="font-semibold text-right capitalize" style={{ color: textColor }}>
                            {selectedDay?.date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: mutedColor }}>Horario</span>
                          <span className="font-semibold text-right" style={{ color: textColor }}>{fmtTime(selectedTime)}</span>
                        </div>
                        {selectedService?.price != null && (
                          <div className="mt-2 pt-2 flex justify-between font-bold text-base" style={{ borderTop: `1px solid ${dimColor}` }}>
                            <span style={{ color: textColor }}>Precio</span>
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

      {/* Fixed bottom bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white"
        style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.10)', padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-2xl mx-auto">
          {step === 3 ? (
            <p className="text-center text-sm text-gray-400 py-1">
              {selectedDay
                ? 'Seleccioná un horario verde para continuar'
                : 'Elegí un día en el calendario'}
            </p>
          ) : step < 4 ? (
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