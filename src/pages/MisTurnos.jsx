import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, Clock, MapPin, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';

const STATUS_CONFIG = {
  pending:   { label: 'Pendiente',  bg: '#FEF3C7', color: '#92400E' },
  confirmed: { label: 'Confirmado', bg: '#D1FAE5', color: '#065F46' },
  cancelled: { label: 'Cancelado',  bg: '#FEE2E2', color: '#991B1B' },
  completed: { label: 'Completado', bg: '#E0E7FF', color: '#3730A3' },
};

function fmtDate(dateStr) {
  // Add T12:00:00 to avoid UTC-boundary timezone shift
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function fmtTime(t) { return t ? t.slice(0, 5) : ''; }

function isFuture(appt) {
  return new Date(`${appt.date}T${appt.start_time}-03:00`) > new Date();
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: '#F3F4F6', color: '#374151' };
  return (
    <span
      className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
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
  const [mode, setMode] = useState(null); // null | 'email'
  const [form, setForm] = useState({ email: '', password: '' });
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

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: '#FFF8F8' }}
      >
        <CalendarCheck size={28} style={{ color: '#D32F2F' }} />
      </div>
      <h2 className="font-extrabold text-lg text-gray-900 mb-1">Iniciá sesión</h2>
      <p className="text-sm text-gray-500 mb-6">Para ver tus turnos necesitás estar logueado.</p>

      {mode !== 'email' ? (
        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={handleGoogle}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <GoogleIcon /> Continuar con Google
          </button>
          <button
            onClick={() => setMode('email')}
            className="w-full py-2 text-sm font-bold text-primary"
          >
            Usar email y contraseña
          </button>
        </div>
      ) : (
        <form onSubmit={handleEmail} className="w-full max-w-xs space-y-3">
          <input
            type="email" required autoCapitalize="none"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="Email"
            className="input"
          />
          <input
            type="password" required
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="Contraseña"
            className="input"
          />
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Un momento...' : 'Iniciar sesión'}
          </button>
          <button type="button" onClick={() => setMode(null)} className="w-full py-1 text-sm text-gray-400 font-bold">
            Volver
          </button>
        </form>
      )}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="card p-4 space-y-3 animate-pulse">
      <div className="flex justify-between">
        <div className="h-4 bg-gray-200 rounded w-2/5" />
        <div className="h-5 bg-gray-200 rounded-full w-20" />
      </div>
      <div className="h-3 bg-gray-200 rounded w-1/3" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
  );
}

export default function MisTurnos() {
  const { session, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

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

  const isUpdating = (id, action) => updating === id + action;

  return (
    <div className="min-h-screen" style={{ background: '#FFF8F8', paddingBottom: 80 }}>
      <div className="max-w-2xl mx-auto px-4 py-4">

        {/* Título de sección */}
        <div className="flex items-center gap-2 mb-4">
          <CalendarCheck size={20} style={{ color: '#D32F2F' }} />
          <h1 className="font-extrabold text-lg text-gray-900">Mis turnos</h1>
        </div>

        {/* No logueado */}
        {!authLoading && !session && <LoginPrompt />}

        {/* Cargando */}
        {(authLoading || loading) && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        )}

        {/* Sin turnos */}
        {!loading && !authLoading && session && appointments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: '#FFF8F8' }}
            >
              <CalendarCheck size={28} style={{ color: '#D32F2F' }} />
            </div>
            <p className="font-bold text-gray-700">No tenés turnos reservados</p>
            <p className="text-sm text-gray-400 mt-1">Buscá un negocio en Turnos y reservá.</p>
          </div>
        )}

        {/* Lista de turnos */}
        {!loading && !authLoading && session && appointments.length > 0 && (
          <div className="space-y-3">
            {appointments.map((appt, i) => {
              const canAct = isFuture(appt) && appt.status !== 'cancelled' && appt.status !== 'completed';
              const business = appt.appointment_businesses;
              const service  = appt.appointment_services;
              const prof     = appt.appointment_professionals;

              return (
                <motion.div
                  key={appt.id}
                  className="card p-4"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                >
                  {/* Encabezado: negocio + badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-extrabold text-sm text-gray-900 leading-tight">
                      {business?.name ?? '—'}
                    </p>
                    <StatusBadge status={appt.status} />
                  </div>

                  {/* Servicio */}
                  {service?.name && (
                    <p className="text-xs font-semibold text-gray-500 mb-2">{service.name}</p>
                  )}

                  {/* Fecha y hora */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1 capitalize">
                      <CalendarCheck size={12} />
                      {fmtDate(appt.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {fmtTime(appt.start_time)}
                    </span>
                    {business?.address && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {business.address}
                      </span>
                    )}
                    {prof?.name && (
                      <span className="flex items-center gap-1">
                        <UserIcon size={12} />
                        {prof.name}
                      </span>
                    )}
                  </div>

                  {/* Precio */}
                  {service?.price != null && (
                    <p className="text-xs font-bold text-primary mt-1.5">
                      ${Number(service.price).toLocaleString('es-AR')}
                    </p>
                  )}

                  {/* Acciones para turnos futuros */}
                  {canAct && (
                    <div className="flex gap-2 mt-3">
                      {appt.status !== 'confirmed' && (
                        <button
                          onClick={() => updateStatus(appt.id, 'confirmed')}
                          disabled={!!updating}
                          className="flex-1 py-2 rounded-xl text-xs font-bold transition-colors"
                          style={{
                            background: isUpdating(appt.id, 'confirmed') ? '#D1FAE5' : '#2E7D32',
                            color: '#fff',
                            opacity: !!updating ? 0.7 : 1,
                          }}
                        >
                          {isUpdating(appt.id, 'confirmed') ? 'Confirmando...' : 'Confirmar'}
                        </button>
                      )}
                      <button
                        onClick={() => updateStatus(appt.id, 'cancelled')}
                        disabled={!!updating}
                        className="flex-1 py-2 rounded-xl text-xs font-bold transition-colors"
                        style={{
                          background: isUpdating(appt.id, 'cancelled') ? '#FEE2E2' : '#FFF8F8',
                          color: '#D32F2F',
                          border: '1.5px solid #FECACA',
                          opacity: !!updating ? 0.7 : 1,
                        }}
                      >
                        {isUpdating(appt.id, 'cancelled') ? 'Cancelando...' : 'Cancelar'}
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
