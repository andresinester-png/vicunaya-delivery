import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Settings, Building2, LogOut,
  ChevronRight, ArrowLeft, Bell, FileText,
  Phone, Mail, Calendar, Check, X, MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';
import { KYVRA } from '../lib/theme.js';

const FF = "'Plus Jakarta Sans', sans-serif";

function initials(profile) {
  const n = (profile?.nombre  || '').trim().charAt(0).toUpperCase();
  const a = (profile?.apellido || '').trim().charAt(0).toUpperCase();
  return n || a ? (n + a) : '?';
}

function fullName(profile) {
  const parts = [profile?.nombre, profile?.apellido].filter(Boolean);
  return parts.length ? parts.join(' ') : 'Usuario';
}

function SubHeader({ title, onBack }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 16px', background: KYVRA.white,
      borderBottom: `1px solid ${KYVRA.border}`, position: 'sticky', top: 0, zIndex: 10,
    }}>
      <button onClick={onBack} style={{
        width: 36, height: 36, borderRadius: '50%',
        background: KYVRA.bg, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <ArrowLeft size={18} color={KYVRA.navy} strokeWidth={2.5} />
      </button>
      <span style={{ fontFamily: FF, fontWeight: 800, fontSize: 17, color: KYVRA.navy }}>{title}</span>
    </div>
  );
}

const inputBase = {
  width: '100%', boxSizing: 'border-box',
  padding: '13px 14px', borderRadius: 12,
  border: `1.5px solid ${KYVRA.border}`, fontSize: 15,
  fontWeight: 600, color: KYVRA.navy, outline: 'none',
  fontFamily: FF, background: KYVRA.bg,
  transition: 'border-color 0.15s',
};

const labelBase = {
  display: 'block', fontSize: 11, fontWeight: 700, color: KYVRA.textMuted,
  marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: FF,
};

function FocusInput({ style, readOnly, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      readOnly={readOnly}
      style={{
        ...inputBase, ...style,
        borderColor: readOnly ? KYVRA.border : focused ? KYVRA.teal : KYVRA.border,
        background: readOnly ? '#F1F5F9' : KYVRA.bg,
        color: readOnly ? KYVRA.textMuted : KYVRA.navy,
        cursor: readOnly ? 'not-allowed' : 'text',
      }}
      onFocus={() => !readOnly && setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function PersonalInfoScreen({ onBack, profile, session, onSaved }) {
  const [form, setForm] = useState({
    nombre:           profile?.nombre           || '',
    apellido:         profile?.apellido         || '',
    fecha_nacimiento: profile?.fecha_nacimiento || '',
    telefono:         profile?.telefono         || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.nombre.trim())   { toast.error('El nombre es obligatorio');   return; }
    if (!form.apellido.trim()) { toast.error('El apellido es obligatorio'); return; }
    setSaving(true);
    try {
      const payload = {
        id:       session.user.id,
        nombre:   form.nombre.trim(),
        apellido: form.apellido.trim(),
        telefono: form.telefono.trim(),
      };
      if (form.fecha_nacimiento) payload.fecha_nacimiento = form.fecha_nacimiento;
      const { error } = await supabase.from('profiles').upsert(payload);
      if (error) throw error;
      await onSaved();
      toast.success('Datos actualizados');
      onBack();
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const CARD = {
    background: KYVRA.white, borderRadius: 20,
    border: `1px solid ${KYVRA.border}`,
    padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14,
    boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
  };

  return (
    <div style={{ minHeight: '100%', background: KYVRA.bg, fontFamily: FF }}>
      <SubHeader title="Información personal" onBack={onBack} />
      <div style={{ padding: '20px 16px 40px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480, margin: '0 auto' }}>
        <div style={CARD}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelBase}><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>Nombre</span></label>
              <FocusInput value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Juan" autoComplete="given-name" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelBase}>Apellido</label>
              <FocusInput value={form.apellido} onChange={e => set('apellido', e.target.value)} placeholder="García" autoComplete="family-name" />
            </div>
          </div>
          <div>
            <label style={labelBase}><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={11} /> Fecha de nacimiento</span></label>
            <FocusInput type="date" value={form.fecha_nacimiento} onChange={e => set('fecha_nacimiento', e.target.value)} />
          </div>
          <div>
            <label style={labelBase}><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={11} /> Teléfono</span></label>
            <FocusInput type="tel" inputMode="numeric" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="3816 123456" autoComplete="tel" />
          </div>
          <div>
            <label style={labelBase}><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Mail size={11} /> Email</span></label>
            <FocusInput value={session?.user?.email || ''} readOnly />
            <p style={{ fontSize: 11, color: KYVRA.textMuted, marginTop: 4, fontFamily: FF }}>El email no se puede modificar</p>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} style={{
          width: '100%', background: saving ? KYVRA.textMuted : KYVRA.teal, color: '#fff',
          border: 'none', borderRadius: 14, padding: '15px 20px',
          fontSize: 15, fontWeight: 800, cursor: saving ? 'default' : 'pointer',
          boxShadow: saving ? 'none' : '0 6px 20px rgba(13,148,136,0.30)',
          fontFamily: FF, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {saving ? 'Guardando...' : <><Check size={16} /> Guardar cambios</>}
        </button>
      </div>
    </div>
  );
}

function ConfigScreen({ onBack }) {
  const [notifEnabled, setNotifEnabled] = useState(Notification?.permission === 'granted');
  const navigate = useNavigate();

  const toggleNotif = async () => {
    if (notifEnabled) {
      toast('Para desactivar, hacelo desde la configuración del navegador', { icon: 'ℹ️', duration: 4000 });
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') { setNotifEnabled(true); toast.success('Notificaciones activadas'); }
    else toast.error('Permiso denegado para notificaciones');
  };

  const CARD = {
    background: KYVRA.white, borderRadius: 20,
    border: `1px solid ${KYVRA.border}`,
    boxShadow: '0 2px 12px rgba(15,23,42,0.06)', overflow: 'hidden',
  };
  const ROW = { display: 'flex', alignItems: 'center', gap: 14, padding: '16px', fontFamily: FF };
  const ICON = (bg) => ({
    width: 42, height: 42, borderRadius: 12, background: bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  });

  return (
    <div style={{ minHeight: '100%', background: KYVRA.bg, fontFamily: FF }}>
      <SubHeader title="Configuración" onBack={onBack} />
      <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={CARD}>
          <div style={ROW}>
            <div style={ICON('rgba(245,158,11,0.12)')}>
              <Bell size={18} color="#D97706" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: KYVRA.navy, margin: 0 }}>Notificaciones</p>
              <p style={{ fontSize: 12, color: KYVRA.textMuted, margin: '2px 0 0' }}>
                {notifEnabled ? 'Activadas' : 'Desactivadas'}
              </p>
            </div>
            <button
              onClick={toggleNotif}
              style={{
                width: 48, height: 27, borderRadius: 99, border: 'none', cursor: 'pointer',
                background: notifEnabled ? KYVRA.teal : KYVRA.border, padding: 0,
                position: 'relative', flexShrink: 0, transition: 'background 0.2s',
              }}
            >
              <span style={{
                position: 'absolute', top: 3, left: notifEnabled ? 24 : 3,
                width: 21, height: 21, borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>
          <div style={{ borderTop: `1px solid ${KYVRA.border}` }} />
          <button
            onClick={() => navigate('/legal')}
            style={{ ...ROW, width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={ICON('rgba(59,130,246,0.10)')}>
              <FileText size={18} color="#3B82F6" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: KYVRA.navy, margin: 0 }}>Información legal</p>
              <p style={{ fontSize: 12, color: KYVRA.textMuted, margin: '2px 0 0' }}>Términos y política de privacidad</p>
            </div>
            <ChevronRight size={17} color={KYVRA.textMuted} />
          </button>
        </div>
      </div>
    </div>
  );
}

function NegocioModal({ onClose }) {
  const waUrl = 'https://wa.me/543584176892?text=Hola%2C%20quiero%20registrar%20mi%20negocio%20en%20Vicu%C3%B1aYa';
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: '24px 24px 0 0', padding: '32px 24px 48px', fontFamily: FF, textAlign: 'center', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <X size={22} color={KYVRA.textMuted} />
        </button>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🏪</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: KYVRA.navy, margin: '0 0 8px', letterSpacing: '-0.01em' }}>Registrá tu negocio</h2>
        <p style={{ fontSize: 14, color: KYVRA.textSec, margin: '0 0 8px', lineHeight: 1.6 }}>Próximamente podrás hacerlo desde la app.</p>
        <p style={{ fontSize: 14, color: KYVRA.textSec, margin: '0 0 32px', lineHeight: 1.6 }}>Por ahora, contactanos por WhatsApp y te damos de alta en el momento.</p>
        <a href={waUrl} target="_blank" rel="noreferrer" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: '#25D366', color: '#fff', borderRadius: 14,
          padding: '15px 20px', fontSize: 15, fontWeight: 800,
          textDecoration: 'none', boxShadow: '0 6px 20px rgba(37,211,102,0.3)', fontFamily: FF,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.849L0 24l6.335-1.508A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.017-1.376l-.36-.214-3.727.887.926-3.635-.235-.373A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
          </svg>
          Contactar por WhatsApp
        </a>
      </div>
    </div>
  );
}

function MainScreen({ profile, session, onNav, onLogout }) {
  const navigate = useNavigate();
  const name  = fullName(profile);
  const email = session?.user?.email || '';
  const init  = initials(profile);

  const groups = [
    {
      title: 'Mi cuenta',
      items: [
        { key: 'personal',  Icon: User,      label: 'Información personal', desc: 'Nombre, teléfono, fecha de nacimiento', iconBg: KYVRA.tealBg,            iconColor: KYVRA.teal },
        { key: 'addresses', Icon: MapPin,    label: 'Mis direcciones',       desc: 'Guardá tus lugares frecuentes',        iconBg: 'rgba(99,102,241,0.10)', iconColor: '#6366F1', link: '/direcciones' },
      ],
    },
    {
      title: 'Preferencias',
      items: [
        { key: 'config',    Icon: Settings,  label: 'Configuración',         desc: 'Notificaciones e información legal',   iconBg: 'rgba(245,158,11,0.10)', iconColor: '#D97706' },
      ],
    },
    {
      title: 'Para negocios',
      items: [
        { key: 'negocio',   Icon: Building2, label: 'Registrar mi negocio',  desc: 'Sumá tu local a Kyvra',               iconBg: 'rgba(59,130,246,0.10)', iconColor: '#3B82F6' },
      ],
    },
  ];

  const CARD = {
    background: KYVRA.white, borderRadius: 20,
    border: `1px solid ${KYVRA.border}`,
    boxShadow: '0 2px 12px rgba(15,23,42,0.06)', overflow: 'hidden',
  };

  return (
    <div style={{ minHeight: '100%', background: KYVRA.bg, fontFamily: FF, paddingBottom: 32 }}>

      {/* Gradient header */}
      <div style={{
        background: 'linear-gradient(145deg, #0D9488 0%, #14B8A6 100%)',
        padding: 'calc(40px + env(safe-area-inset-top, 0px)) 24px 32px',
        textAlign: 'center',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(255,255,255,0.22)',
          border: '3px solid rgba(255,255,255,0.50)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, fontWeight: 900, color: '#fff', fontFamily: FF,
          margin: '0 auto 14px', letterSpacing: '-0.02em',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        }}>
          {init}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em', fontFamily: FF }}>
          {name}
        </h2>
        {email && (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', margin: '0 0 16px', fontFamily: FF }}>
            {email}
          </p>
        )}
        <button
          onClick={() => onNav('personal')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.35)',
            borderRadius: 99, padding: '7px 16px', color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FF,
          }}
        >
          <User size={13} /> Editar perfil
        </button>
      </div>

      {/* Groups */}
      <div style={{ padding: '20px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {groups.map(group => (
          <div key={group.title}>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: KYVRA.textMuted,
              margin: '0 0 8px 4px', fontFamily: FF,
            }}>
              {group.title}
            </p>
            <div style={CARD}>
              {group.items.map(({ key, Icon, label, desc, iconBg, iconColor, link }, i) => (
                <div key={key}>
                  {i > 0 && <div style={{ borderTop: `1px solid ${KYVRA.border}`, margin: '0 16px' }} />}
                  <button
                    onClick={() => link ? navigate(link) : onNav(key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '15px 16px', width: '100%',
                      background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: FF,
                    }}
                  >
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={18} color={iconColor} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: KYVRA.navy, margin: 0 }}>{label}</p>
                      <p style={{ fontSize: 12, color: KYVRA.textMuted, margin: '2px 0 0' }}>{desc}</p>
                    </div>
                    <ChevronRight size={17} color={KYVRA.textMuted} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <button
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            width: '100%', background: KYVRA.white,
            border: '1.5px solid rgba(239,68,68,0.25)', borderRadius: 16,
            padding: '14px 20px', fontSize: 14.5, fontWeight: 800, color: '#DC2626',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(15,23,42,0.06)', fontFamily: FF,
          }}
        >
          <LogOut size={17} color="#DC2626" /> Cerrar sesión
        </button>

        <p style={{ textAlign: 'center', fontSize: 11, color: KYVRA.textMuted, marginTop: 4, fontFamily: FF }}>
          Kyvra · Vicuña Mackenna, Córdoba
        </p>
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { session, profile, refreshProfile } = useAuth();
  const [view, setView]               = useState('main');
  const [negocioOpen, setNegocioOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/welcome', { replace: true });
  };

  const handleNav = (key) => {
    if (key === 'negocio') { setNegocioOpen(true); return; }
    setView(key);
  };

  if (view === 'personal') {
    return <PersonalInfoScreen onBack={() => setView('main')} profile={profile} session={session} onSaved={refreshProfile} />;
  }
  if (view === 'config') {
    return <ConfigScreen onBack={() => setView('main')} />;
  }

  return (
    <>
      <MainScreen profile={profile} session={session} onNav={handleNav} onLogout={handleLogout} />
      {negocioOpen && <NegocioModal onClose={() => setNegocioOpen(false)} />}
    </>
  );
}
