import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MapPin, CheckCircle, UserCircle, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase.js';
import useProfileStore from '../store/profileStore.js';
import { useAuth } from '../context/AuthContext.jsx';
import { subscribeToPush } from '../lib/pushNotifications.js';
import { KYVRA } from '../lib/theme.js';
import { CATEGORY_INFO } from './Turnos.jsx';

const FF = "'Plus Jakarta Sans', sans-serif";

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

function getNextDays() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const days = [];
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const date = new Date(y, m, d + i);
    days.push({ date, iso: toISODate(date), dow: date.getDay() });
  }
  return days;
}

function SuccessScreen({ business, service, professional, day, time }) {
  return (
    <motion.div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(145deg, #0D9488 0%, #0F766E 100%)',
      }}
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
            stroke="#0D9488" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"
            style={{ strokeDasharray: 40, strokeDashoffset: 40, animation: 'checkmarkDraw 0.5s 0.4s ease-out forwards' }}
          />
        </svg>
      </div>
      <motion.p
        style={{ fontSize: 30, fontWeight: 900, color: '#fff', marginTop: 28, textAlign: 'center', padding: '0 32px', fontFamily: FF }}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.4, ease: 'easeOut' }}
      >
        ¡Turno confirmado!
      </motion.p>
      <motion.p
        style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginTop: 8, textAlign: 'center', padding: '0 32px', fontFamily: FF, lineHeight: 1.5 }}
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

  const [form, setForm]             = useState({ name: '', phone: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);

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

  useEffect(() => {
    setSelectedDay(null);
    setSelectedTime(null);
  }, [selectedProfessional]);

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

  useEffect(() => {
    if (!business) return;
    const color = business.status_bar_color || business.background_color || '#0D9488';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', color);
    return () => { if (meta) meta.setAttribute('content', '#0F172A'); };
  }, [business]);

  const todayIso = toISODate(new Date());
  const nowMin   = new Date().getHours() * 60 + new Date().getMinutes();
  const allDays  = useMemo(() => getNextDays(), []);

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

  useEffect(() => {
    if (!selectedDay || !dayPickerRef.current) return;
    const el = dayPickerRef.current.querySelector(`[data-date="${selectedDay.iso}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selectedDay]);

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
        business_id:     business.id,
        professional_id: selectedProfessional.id,
        service_id:      selectedService.id,
        customer_name:   form.name.trim(),
        customer_phone:  form.phone.trim(),
        date:            selectedDay.iso,
        start_time:      selectedTime,
        end_time:        endTime,
        status:          'pending',
        notes:           form.notes.trim() || null,
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

  if (success) return (
    <SuccessScreen
      business={business}
      service={selectedService}
      professional={selectedProfessional}
      day={selectedDay}
      time={selectedTime}
    />
  );

  const TealHeader = ({ title, onBack }) => (
    <header style={{ position: 'sticky', top: 0, zIndex: 40, background: KYVRA.teal, borderRadius: '0 0 24px 24px', padding: '0 18px 18px', boxShadow: '0 4px 20px rgba(13,148,136,0.25)' }}>
      <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', cursor: 'pointer' }}>
            <ChevronLeft size={22} color="white" />
          </button>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 18, fontFamily: FF }}>{title}</span>
        </div>
        <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }}>
          <Bell size={20} color="white" />
        </div>
      </div>
    </header>
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: '#F9FAFB' }}>
        <style>{`@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <TealHeader title="Reserva de Turno" onBack={() => navigate(-1)} />
        <div style={{ maxWidth: 672, margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{
              height: 96, borderRadius: 16,
              background: 'linear-gradient(90deg,#f0f4f8 25%,#e2e8f0 50%,#f0f4f8 75%)',
              backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
            }} />
          ))}
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div style={{ minHeight: '100dvh', background: '#F9FAFB' }}>
        <TealHeader title="Reserva de Turno" onBack={() => navigate(-1)} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '96px 24px', textAlign: 'center' }}>
          <p style={{ fontWeight: 600, color: KYVRA.textSec, fontFamily: FF }}>Negocio no encontrado</p>
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
  const dimColor   = isLight ? '#E2E8F0' : 'rgba(255,255,255,0.2)';

  const visibleLabels  = professionals.length === 1
    ? STEP_LABELS.filter(l => l !== 'Profesional')
    : STEP_LABELS;
  const indicatorStep = (professionals.length === 1 && step >= 3) ? step - 1 : step;

  // Input styles that adapt to the business background
  const glassInput = {
    width: '100%', boxSizing: 'border-box',
    padding: '12px 14px', borderRadius: 12,
    border: isLight ? `1.5px solid ${KYVRA.border}` : '1.5px solid rgba(255,255,255,0.35)',
    background: isLight ? KYVRA.bg : 'rgba(255,255,255,0.18)',
    fontSize: 15, fontWeight: 600,
    color: textColor, outline: 'none', fontFamily: FF,
  };

  // Service/professional selected card style
  const selectionBtn = (active) => ({
    display: 'flex', alignItems: 'center', gap: 12, borderRadius: 14,
    border: `2px solid ${active ? KYVRA.teal : dimColor}`,
    background: active
      ? (isLight ? KYVRA.tealBg : 'rgba(13,148,136,0.25)')
      : (isLight ? KYVRA.white : 'rgba(255,255,255,0.10)'),
    padding: '12px', width: '100%', textAlign: 'left', cursor: 'pointer',
    transition: 'all 0.18s', fontFamily: FF,
  });

  const canConfirm = !!session && !!form.name.trim() && !!form.phone.trim() && !submitting;

  return (
    <div style={{ minHeight: '100dvh', background: business.background_color || '#FFFFFF', paddingBottom: 100, fontFamily: FF }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Cover image header */}
      <div style={{ position: 'relative', height: 'calc(220px + env(safe-area-inset-top, 0px))', overflow: 'hidden' }}>
        {business.logo_url ? (
          <img
            src={business.logo_url}
            alt={business.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: business.cover_position || '50% 50%' }}
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

        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.18) 55%, rgba(0,0,0,0.32) 100%)' }} />

        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 'env(safe-area-inset-top, 0px)', background: business.status_bar_color || business.background_color || KYVRA.teal, zIndex: 3 }} />

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
          <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 22, margin: 0, lineHeight: 1.2, textShadow: '0 2px 8px rgba(0,0,0,0.5)', fontFamily: FF }}>
            {business.name}
          </h1>
          {business.address && (
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4, fontFamily: FF }}>
              <MapPin size={11} /> {business.address}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 672, margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {business.description && (
          <p style={{ color: mutedColor, fontSize: 13, lineHeight: 1.5, margin: 0, fontFamily: FF }}>
            {business.description}
          </p>
        )}

        {/* Step indicator */}
        <div style={{ ...GLASS, padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {visibleLabels.map((_, idx) => (
              <Fragment key={idx}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  background: idx <= indicatorStep - 1 ? KYVRA.teal : dimColor,
                  boxShadow: idx === indicatorStep - 1 ? `0 0 0 3px rgba(13,148,136,0.28)` : 'none',
                  transition: 'all 0.3s',
                }} />
                {idx < visibleLabels.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, borderRadius: 2, margin: '0 4px',
                    background: idx < indicatorStep - 1 ? KYVRA.teal : dimColor,
                    transition: 'background 0.3s',
                  }} />
                )}
              </Fragment>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            {visibleLabels.map((label, idx) => (
              <span key={label} style={{ fontSize: 9, fontWeight: 700, color: idx <= indicatorStep - 1 ? textColor : mutedColor, fontFamily: FF }}>
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
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >

            {/* Step 1: Servicio */}
            {step === 1 && (
              <div style={{ ...GLASS, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h2 style={{ fontWeight: 700, fontSize: 16, color: textColor, margin: 0, fontFamily: FF }}>Elegí el servicio</h2>
                {services.length === 0 ? (
                  <p style={{ fontSize: 14, color: mutedColor, margin: 0, fontFamily: FF }}>Este negocio no tiene servicios configurados todavía.</p>
                ) : services.map(s => {
                  const active = selectedService?.id === s.id;
                  return (
                    <button key={s.id} type="button" onClick={() => setSelectedService(s)} style={selectionBtn(active)}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: active ? KYVRA.tealDark : textColor, margin: '0 0 2px', fontFamily: FF }}>{s.name}</p>
                        <p style={{ fontSize: 12, color: mutedColor, margin: 0, fontFamily: FF }}>{s.duration_minutes} min</p>
                      </div>
                      {s.price != null && (
                        <p style={{ fontWeight: 700, fontSize: 14, color: KYVRA.teal, flexShrink: 0, margin: 0, fontFamily: FF }}>${Number(s.price).toLocaleString('es-AR')}</p>
                      )}
                      {active && <CheckCircle size={18} color={KYVRA.teal} style={{ flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 2: Profesional */}
            {step === 2 && (
              <div style={{ ...GLASS, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h2 style={{ fontWeight: 700, fontSize: 16, color: textColor, margin: 0, fontFamily: FF }}>Elegí el profesional</h2>
                {professionals.length === 0 ? (
                  <p style={{ fontSize: 14, color: mutedColor, margin: 0, fontFamily: FF }}>No hay profesionales disponibles.</p>
                ) : professionals.map(prof => {
                  const active = selectedProfessional?.id === prof.id;
                  return (
                    <button key={prof.id} type="button" onClick={() => setSelectedProfessional(prof)} style={selectionBtn(active)}>
                      {prof.avatar_url
                        ? <img src={prof.avatar_url} alt={prof.name} loading="lazy" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        : <UserCircle size={40} color={dimColor} style={{ flexShrink: 0 }} />}
                      <span style={{ fontWeight: 600, fontSize: 14, flex: 1, color: active ? KYVRA.tealDark : textColor, fontFamily: FF }}>{prof.name}</span>
                      {active && <CheckCircle size={18} color={KYVRA.teal} style={{ flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 3: Día y Horario */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Day picker */}
                <div style={{ ...GLASS, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {selectedDay && (
                    <p style={{ fontSize: 14, fontWeight: 700, color: textColor, textTransform: 'capitalize', margin: 0, fontFamily: FF }}>
                      {selectedDay.date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                    </p>
                  )}
                  <div
                    ref={dayPickerRef}
                    style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none' }}
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
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            padding: '10px 0', borderRadius: 12, flexShrink: 0, minWidth: 44,
                            background: isSelected ? '#111' : 'transparent',
                            color: isSelected ? '#fff' : isDisabled ? dimColor : textColor,
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            border: 'none', transition: 'all 0.2s', fontFamily: FF,
                          }}
                        >
                          <span style={{ fontSize: 10, fontWeight: 700, lineHeight: 1 }}>{dayAbbr}</span>
                          <span style={{ fontSize: 18, fontWeight: 900, lineHeight: 1, marginTop: 4 }}>{day.date.getDate()}</span>
                          <span style={{
                            width: 4, height: 4, borderRadius: '50%', marginTop: 4,
                            background: isSelected ? '#fff' : isAvailable ? KYVRA.teal : 'transparent',
                          }} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Slot grid */}
                <div style={{ ...GLASS, padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {selectedDay ? (
                    <>
                      <p style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize', color: textColor, margin: 0, fontFamily: FF }}>
                        {selectedDay.date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        {selectedProfessional && professionals.length > 1 && (
                          <span style={{ fontWeight: 400, color: mutedColor }}> · {selectedProfessional.name}</span>
                        )}
                      </p>

                      {loadingBooked ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.12)', borderTopColor: KYVRA.teal, animation: 'spin 0.8s linear infinite' }} />
                        </div>
                      ) : calendarSlots.length === 0 ? (
                        <p style={{ fontSize: 14, padding: '16px 0', textAlign: 'center', color: mutedColor, fontFamily: FF }}>
                          No hay horarios para este día. Elegí otro día.
                        </p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          {calendarSlots.map(slot => {
                            const isAvail  = slot.state === 'available';
                            const isBooked = slot.state === 'booked';
                            return (
                              <button
                                key={slot.id}
                                disabled={!isAvail}
                                onClick={() => { setSelectedTime(slot.timeStr + ':00'); setStep(4); }}
                                style={{
                                  borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700,
                                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                                  transition: 'all 0.15s', fontFamily: FF,
                                  ...(isAvail ? {
                                    background: KYVRA.tealBg,
                                    border: `1px solid rgba(13,148,136,0.35)`,
                                    color: KYVRA.tealDark,
                                    cursor: 'pointer',
                                  } : {
                                    background: '#fff1f2',
                                    border: '1px solid #fecaca',
                                    color: '#f87171',
                                    cursor: 'not-allowed',
                                    opacity: 0.8,
                                  }),
                                }}
                              >
                                <span>{slot.timeStr}</span>
                                {isBooked && <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>Reservado</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {calendarSlots.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 4, flexWrap: 'wrap', borderTop: `1px solid ${dimColor}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 12, height: 12, borderRadius: 4, background: KYVRA.tealBg, border: `1px solid rgba(13,148,136,0.35)` }} />
                            <span style={{ fontSize: 12, color: mutedColor, fontFamily: FF }}>Disponible</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 12, height: 12, borderRadius: 4, background: '#fee2e2', border: '1px solid #fecaca' }} />
                            <span style={{ fontSize: 12, color: mutedColor, fontFamily: FF }}>Reservado</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p style={{ fontSize: 14, textAlign: 'center', padding: '24px 0', color: mutedColor, fontFamily: FF }}>
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
                  <div style={{ ...GLASS, padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <h2 style={{ fontWeight: 700, fontSize: 16, color: textColor, margin: '0 0 6px', fontFamily: FF }}>Iniciá sesión para confirmar</h2>
                      <p style={{ fontSize: 14, color: mutedColor, margin: 0, fontFamily: FF }}>Guardamos tu turno en tu cuenta y te avisamos 2hs antes.</p>
                    </div>
                    {loginMode !== 'email' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <button type="button" onClick={handleGoogleLogin} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                          width: '100%', background: KYVRA.teal, color: '#fff', border: 'none', borderRadius: 14,
                          padding: '14px 20px', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: FF,
                          boxShadow: '0 4px 16px rgba(13,148,136,0.30)',
                        }}>
                          <GoogleIcon /> Continuar con Google
                        </button>
                        <button type="button" onClick={() => setLoginMode('email')} style={{
                          background: 'none', border: 'none', color: KYVRA.teal,
                          fontSize: 13.5, fontWeight: 700, cursor: 'pointer', padding: '8px 0',
                          width: '100%', textAlign: 'center', fontFamily: FF,
                        }}>
                          Usar email y contraseña
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <input
                          type="email" required value={loginForm.email} autoCapitalize="none"
                          onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                          placeholder="Email" style={glassInput}
                        />
                        <input
                          type="password" required value={loginForm.password}
                          onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                          placeholder="Contraseña" style={glassInput}
                        />
                        <button type="submit" disabled={loginSubmitting} style={{
                          width: '100%', background: loginSubmitting ? KYVRA.textMuted : KYVRA.teal, color: '#fff',
                          border: 'none', borderRadius: 14, padding: '14px',
                          fontSize: 14.5, fontWeight: 700, cursor: loginSubmitting ? 'default' : 'pointer', fontFamily: FF,
                        }}>
                          {loginSubmitting ? 'Un momento...' : 'Iniciar sesión'}
                        </button>
                        <button type="button" onClick={() => setLoginMode(null)} style={{
                          background: 'none', border: 'none', color: mutedColor,
                          fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '4px 0',
                          width: '100%', textAlign: 'center', fontFamily: FF,
                        }}>
                          Volver
                        </button>
                      </form>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Form: your data */}
                    <div style={{ ...GLASS, padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <h2 style={{ fontWeight: 700, fontSize: 16, color: textColor, margin: 0, fontFamily: FF }}>Tus datos</h2>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: mutedColor, marginBottom: 6, fontFamily: FF }}>Tu nombre</label>
                        <input value={form.name} placeholder="Juan García" style={glassInput}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: mutedColor, marginBottom: 6, fontFamily: FF }}>Teléfono</label>
                        <input value={form.phone} placeholder="3571-123456" style={glassInput}
                          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: mutedColor, marginBottom: 6, fontFamily: FF }}>Notas (opcional)</label>
                        <input value={form.notes} placeholder="Algo que quieras avisar..." style={glassInput}
                          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                      </div>
                    </div>

                    {/* Summary */}
                    <div style={{ ...GLASS, padding: '20px' }}>
                      <h2 style={{ fontWeight: 700, fontSize: 16, color: textColor, margin: '0 0 14px', fontFamily: FF }}>Resumen</h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: mutedColor, fontFamily: FF }}>Negocio</span>
                          <span style={{ fontWeight: 600, textAlign: 'right', color: textColor, fontFamily: FF }}>{business.name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: mutedColor, fontFamily: FF }}>Servicio</span>
                          <span style={{ fontWeight: 600, textAlign: 'right', color: textColor, fontFamily: FF }}>{selectedService?.name}</span>
                        </div>
                        {selectedProfessional && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: mutedColor, fontFamily: FF }}>Profesional</span>
                            <span style={{ fontWeight: 600, textAlign: 'right', color: textColor, fontFamily: FF }}>{selectedProfessional.name}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: mutedColor, fontFamily: FF }}>Día</span>
                          <span style={{ fontWeight: 600, textAlign: 'right', textTransform: 'capitalize', color: textColor, fontFamily: FF }}>
                            {selectedDay?.date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: mutedColor, fontFamily: FF }}>Horario</span>
                          <span style={{ fontWeight: 600, textAlign: 'right', color: textColor, fontFamily: FF }}>{fmtTime(selectedTime)}</span>
                        </div>
                        {selectedService?.price != null && (
                          <div style={{ marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, borderTop: `1px solid ${dimColor}` }}>
                            <span style={{ color: textColor, fontFamily: FF }}>Precio</span>
                            <span style={{ color: KYVRA.teal, fontFamily: FF }}>${Number(selectedService.price).toLocaleString('es-AR')}</span>
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
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: '#fff',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.10)',
        padding: '12px 16px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
      }}>
        <div style={{ maxWidth: 672, margin: '0 auto' }}>
          {step === 3 ? (
            <p style={{ textAlign: 'center', fontSize: 14, color: KYVRA.textMuted, padding: '4px 0', fontFamily: FF }}>
              {selectedDay ? 'Seleccioná un horario para continuar' : 'Elegí un día en el calendario'}
            </p>
          ) : step < 4 ? (
            <button type="button" onClick={handleContinue} disabled={!canContinue} style={{
              width: '100%', background: !canContinue ? KYVRA.border : KYVRA.teal,
              color: !canContinue ? KYVRA.textMuted : '#fff',
              border: 'none', borderRadius: 14, padding: '15px 20px',
              fontSize: 15, fontWeight: 800, cursor: !canContinue ? 'default' : 'pointer',
              fontFamily: FF,
              boxShadow: !canContinue ? 'none' : '0 4px 16px rgba(13,148,136,0.25)',
              transition: 'all 0.15s',
            }}>
              Continuar
            </button>
          ) : (
            <button type="button" onClick={handleConfirm} disabled={!canConfirm} style={{
              width: '100%', background: !canConfirm ? KYVRA.border : KYVRA.teal,
              color: !canConfirm ? KYVRA.textMuted : '#fff',
              border: 'none', borderRadius: 14, padding: '15px 20px',
              fontSize: 15, fontWeight: 800, cursor: !canConfirm ? 'default' : 'pointer',
              fontFamily: FF,
              boxShadow: !canConfirm ? 'none' : '0 4px 16px rgba(13,148,136,0.25)',
              transition: 'all 0.15s',
            }}>
              {submitting ? 'Reservando...' : 'Confirmar turno'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
