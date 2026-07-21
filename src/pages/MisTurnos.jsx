import { useEffect, useState } from 'react';
import { CalendarCheck, Clock, MapPin, User as UserIcon, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';
import { KYVRA } from '../lib/theme.js';

const FF = "'Plus Jakarta Sans', sans-serif";

const STATUS_CONFIG = {
  pending:   { label: 'Pendiente',  bg: 'rgba(245,158,11,0.18)',  color: '#92400E' },
  confirmed: { label: 'Confirmado', bg: 'rgba(13,148,136,0.22)',  color: '#5EEAD4' },
  cancelled: { label: 'Cancelado',  bg: 'rgba(239,68,68,0.18)',   color: '#FCA5A5' },
  completed: { label: 'Completado', bg: 'rgba(22,163,74,0.18)',   color: '#86EFAC' },
};

const STATUS_CONFIG_LIGHT = {
  pending:   { label: 'Pendiente',  bg: 'rgba(245,158,11,0.13)',  color: '#B45309' },
  confirmed: { label: 'Confirmado', bg: KYVRA.tealBg,              color: KYVRA.tealDark },
  cancelled: { label: 'Cancelado',  bg: 'rgba(239,68,68,0.13)',   color: '#DC2626' },
  completed: { label: 'Completado', bg: 'rgba(22,163,74,0.13)',   color: '#15803D' },
};

function fmtDateShort(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function fmtTime(t) { return t ? t.slice(0, 5) : ''; }

function isFuture(appt) {
  return new Date(`${appt.date}T${appt.start_time}-03:00`) > new Date();
}

function StatusBadge({ status, dark }) {
  const cfg = (dark ? STATUS_CONFIG : STATUS_CONFIG_LIGHT)[status]
    || { label: status, bg: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' };
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
      background: cfg.bg, color: cfg.color, display: 'inline-block', flexShrink: 0,
    }}>
      {cfg.label}
    </span>
  );
}

function AppointmentCard({ appt, updating, onUpdateStatus }) {
  const canAct   = isFuture(appt) && appt.status !== 'cancelled' && appt.status !== 'completed';
  const business = appt.appointment_businesses;
  const service  = appt.appointment_services;
  const prof     = appt.appointment_professionals;
  const isUpdating = (action) => updating === appt.id + action;

  const dateObj   = new Date(appt.date + 'T12:00:00');
  const dayNum    = dateObj.getDate();
  const monthAbbr = dateObj.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '').toUpperCase();

  return (
    <div style={{
      background: 'linear-gradient(145deg, #0F172A 0%, #1E293B 55%, #0F2A28 100%)',
      border: '1px solid rgba(13,148,136,0.22)',
      borderRadius: 20, overflow: 'hidden', display: 'flex',
      boxShadow: '0 6px 24px rgba(0,0,0,0.28), 0 0 0 1px rgba(13,148,136,0.06)',
    }}>
      {/* Date block */}
      <div style={{
        width: 72, flexShrink: 0,
        background: 'linear-gradient(160deg, #0D9488 0%, #0F766E 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 8px',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 30%, rgba(94,234,212,0.15) 0%, transparent 70%)' }} />
        <span style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1, fontFamily: FF, position: 'relative' }}>{dayNum}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', fontFamily: FF, marginTop: 3, position: 'relative' }}>{monthAbbr}</span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '14px 16px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.01em', lineHeight: 1.2, fontFamily: FF }}>
            {business?.name ?? '—'}
          </p>
          <StatusBadge status={appt.status} dark />
        </div>

        {service?.name && (
          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', margin: '0 0 8px', fontFamily: FF }}>{service.name}</p>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'rgba(255,255,255,0.50)', fontFamily: FF }}>
            <Clock size={11} /> {fmtTime(appt.start_time)}
          </span>
          {prof?.name && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'rgba(255,255,255,0.50)', fontFamily: FF }}>
              <UserIcon size={11} /> {prof.name}
            </span>
          )}
          {business?.address && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'rgba(255,255,255,0.50)', fontFamily: FF }}>
              <MapPin size={11} /> {business.address}
            </span>
          )}
        </div>

        {service?.price != null && (
          <p style={{ fontSize: 14, fontWeight: 800, color: '#5EEAD4', margin: '6px 0 0', fontFamily: FF }}>
            ${Number(service.price).toLocaleString('es-AR')}
          </p>
        )}

        {canAct && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={() => onUpdateStatus(appt.id, 'cancelled')}
              disabled={!!updating}
              style={{
                flex: 1, padding: '9px', borderRadius: 12, fontFamily: FF, fontWeight: 700, fontSize: 12.5,
                cursor: !!updating ? 'default' : 'pointer', color: '#FCA5A5',
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.20)',
                opacity: !!updating ? 0.7 : 1,
              }}
            >
              {isUpdating('cancelled') ? 'Cancelando...' : 'Cancelar turno'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryCard({ appt }) {
  const business = appt.appointment_businesses;
  const service  = appt.appointment_services;
  return (
    <div style={{ background: KYVRA.white, border: `1px solid ${KYVRA.border}`, borderRadius: 18, boxShadow: '0 2px 10px rgba(15,23,42,0.05)', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px' }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: KYVRA.bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Calendar size={17} color={KYVRA.textMuted} strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 700, color: KYVRA.navy, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FF }}>
          {business?.name ?? '—'}
        </p>
        <p style={{ fontSize: 11.5, color: KYVRA.textMuted, margin: '0 0 4px', fontFamily: FF }}>
          {fmtDateShort(appt.date)} · {fmtTime(appt.start_time)}{service?.name ? ` · ${service.name}` : ''}
        </p>
        <StatusBadge status={appt.status} dark={false} />
      </div>
    </div>
  );
}

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

function LoginPrompt() {
  const [mode, setMode]     = useState(null);
  const [form, setForm]     = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast.error('No se pudo conectar con Google');
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) { toast.error('Completá email y contraseña'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
      if (error) throw error;
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const INPUT = {
    width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 12,
    border: `1.5px solid ${KYVRA.border}`, fontSize: 15, fontWeight: 600,
    color: KYVRA.navy, outline: 'none', fontFamily: FF, background: KYVRA.bg,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 24px', textAlign: 'center', fontFamily: FF }}>
      <div style={{ width: 72, height: 72, borderRadius: 24, background: KYVRA.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <CalendarCheck size={34} color={KYVRA.teal} strokeWidth={1.5} />
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: KYVRA.navy, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Iniciá sesión</h2>
      <p style={{ fontSize: 13.5, color: KYVRA.textSec, margin: '0 0 28px', lineHeight: 1.55 }}>Para ver tus turnos necesitás estar logueado</p>

      {mode !== 'email' ? (
        <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={handleGoogle} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            width: '100%', background: KYVRA.teal, color: '#fff', border: 'none', borderRadius: 14,
            padding: '14px 20px', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: FF,
            boxShadow: '0 4px 16px rgba(13,148,136,0.30)',
          }}>
            <GoogleIcon /> Continuar con Google
          </button>
          <button onClick={() => setMode('email')} style={{
            background: 'none', border: 'none', color: KYVRA.teal,
            fontSize: 13.5, fontWeight: 700, cursor: 'pointer', padding: '8px 0', fontFamily: FF,
          }}>
            Usar email y contraseña
          </button>
        </div>
      ) : (
        <form onSubmit={handleEmail} style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input type="email" required autoCapitalize="none" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="Email" style={INPUT} />
          <input type="password" required value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="Contraseña" style={INPUT} />
          <button type="submit" disabled={submitting} style={{
            width: '100%', background: submitting ? KYVRA.textMuted : KYVRA.teal, color: '#fff',
            border: 'none', borderRadius: 14, padding: '14px', fontSize: 14.5,
            fontWeight: 700, cursor: submitting ? 'default' : 'pointer', fontFamily: FF, marginTop: 4,
          }}>
            {submitting ? 'Un momento...' : 'Iniciar sesión'}
          </button>
          <button type="button" onClick={() => setMode(null)} style={{
            background: 'none', border: 'none', color: KYVRA.textMuted,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '6px 0', fontFamily: FF,
          }}>
            Volver
          </button>
        </form>
      )}
    </div>
  );
}

export default function MisTurnos() {
  const { session, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [updating, setUpdating]         = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!session) { setLoading(false); return; }
    supabase
      .from('appointments')
      .select(`
        id, date, start_time, end_time, status, notes,
        appointment_businesses(name, address),
        appointment_services(name, price),
        appointment_professionals(name)
      `)
      .eq('customer_user_id', session.user.id)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
      .then(({ data, error }) => {
        if (error) toast.error('Error al cargar turnos');
        setAppointments(data || []);
        setLoading(false);
      });
  }, [session, authLoading]);

  const updateStatus = async (id, newStatus) => {
    setUpdating(id + newStatus);
    const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
    if (error) {
      toast.error('Error: ' + error.message);
    } else {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      toast.success(newStatus === 'confirmed' ? '¡Turno confirmado!' : 'Turno cancelado');
    }
    setUpdating(null);
  };

  const activeAppts  = appointments.filter(a => isFuture(a) && (a.status === 'pending' || a.status === 'confirmed'));
  const historyAppts = appointments.filter(a => !isFuture(a) || a.status === 'cancelled' || a.status === 'completed');
  const isReady = !loading && !authLoading && session;

  return (
    <>
      <style>{`@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }`}</style>
      <div style={{ background: KYVRA.bg, minHeight: '100%', fontFamily: FF }}>

        {/* Premium dark branded header */}
        <div style={{
          background: 'linear-gradient(160deg, #061118 0%, #0A1E2A 28%, #0D3A35 55%, #0F172A 100%)',
          padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 16px 24px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, position: 'relative' }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CalendarCheck size={12} color="#fff" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#5EEAD4', letterSpacing: '0.12em', fontFamily: FF }}>MIS TURNOS · KYVRA</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 3px', letterSpacing: '-0.02em', fontFamily: FF, position: 'relative' }}>
            Mis turnos
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.52)', margin: 0, fontFamily: FF, position: 'relative' }}>
            Próximos y anteriores
          </p>
        </div>

        {/* Content area */}
        <div style={{ padding: '20px 16px 8px' }}>

          {!authLoading && !session && <LoginPrompt />}

          {(authLoading || loading) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{
                  height: 100, borderRadius: 20,
                  background: 'linear-gradient(90deg,#f0f4f8 25%,#e2e8f0 50%,#f0f4f8 75%)',
                  backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
                }} />
              ))}
            </div>
          )}

          {isReady && (
            <>
              {/* ── Próximos turnos ── */}
              <section style={{ marginBottom: 28 }}>
                <span style={{
                  display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: KYVRA.textMuted, marginBottom: 10, fontFamily: FF,
                }}>
                  Próximos turnos
                </span>

                {activeAppts.length === 0 ? (
                  <div style={{ background: KYVRA.white, border: `1px solid ${KYVRA.border}`, borderRadius: 20, boxShadow: '0 2px 12px rgba(15,23,42,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 24px', textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 18, background: KYVRA.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                      <CalendarCheck size={26} color={KYVRA.teal} strokeWidth={1.5} />
                    </div>
                    <p style={{ fontWeight: 700, fontSize: 15, color: KYVRA.navy, margin: '0 0 6px', fontFamily: FF }}>No tenés turnos próximos</p>
                    <p style={{ fontSize: 13, color: KYVRA.textSec, margin: 0, lineHeight: 1.55, fontFamily: FF }}>Buscá un negocio en Turnos y reservá</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {activeAppts.map(appt => (
                      <AppointmentCard key={appt.id} appt={appt} updating={updating} onUpdateStatus={updateStatus} />
                    ))}
                  </div>
                )}
              </section>

              {/* ── Historial de turnos ── */}
              <section>
                <div style={{
                  background: 'linear-gradient(160deg, #061118 0%, #0A1E2A 28%, #0D3A35 55%, #0F172A 100%)',
                  borderRadius: 18, padding: '16px 18px', marginBottom: 14,
                  boxShadow: '0 6px 24px rgba(0,0,0,0.22)',
                  display: 'flex', alignItems: 'center', gap: 12,
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.28) 0%, transparent 70%)', pointerEvents: 'none' }} />
                  <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(13,148,136,0.22)', border: '1px solid rgba(13,148,136,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                    <Clock size={17} color="#5EEAD4" strokeWidth={2.2} />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.01em', fontFamily: FF }}>Historial de turnos</p>
                    {historyAppts.length > 0 && (
                      <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', margin: '2px 0 0', fontFamily: FF }}>
                        {historyAppts.length} {historyAppts.length === 1 ? 'turno anterior' : 'turnos anteriores'}
                      </p>
                    )}
                  </div>
                </div>

                {historyAppts.length === 0 ? (
                  <div style={{ background: KYVRA.white, border: `1px solid ${KYVRA.border}`, borderRadius: 18, boxShadow: '0 2px 10px rgba(15,23,42,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 24px', textAlign: 'center' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: KYVRA.navy, margin: '0 0 6px', fontFamily: FF }}>Sin turnos anteriores</p>
                    <p style={{ fontSize: 12.5, color: KYVRA.textMuted, margin: 0, fontFamily: FF }}>Tus turnos completados aparecerán acá</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {historyAppts.map(appt => <HistoryCard key={appt.id} appt={appt} />)}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
}
