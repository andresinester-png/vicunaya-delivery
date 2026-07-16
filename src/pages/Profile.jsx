import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Settings, Building2, LogOut,
  ChevronRight, ArrowLeft, Bell, FileText,
  Phone, Mail, Calendar, Check, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';

const RED  = '#0F172A';
const FONT = "'Plus Jakarta Sans', sans-serif";
const BG   = '#F5F5F5';

/* ── helpers ── */
function initials(profile) {
  const n = (profile?.nombre  || '').trim().charAt(0).toUpperCase();
  const a = (profile?.apellido || '').trim().charAt(0).toUpperCase();
  return n || a || '?';
}

function fullName(profile) {
  const parts = [profile?.nombre, profile?.apellido].filter(Boolean);
  return parts.length ? parts.join(' ') : 'Usuario';
}

/* ── shared primitives ── */
function SubHeader({ title, onBack }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 16px', background: '#fff',
      borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 10,
    }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#111', display: 'flex' }}>
        <ArrowLeft size={22} />
      </button>
      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 17 }}>{title}</span>
    </div>
  );
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '13px 14px', borderRadius: 12,
  border: '1.5px solid #E5E7EB', fontSize: 15,
  fontWeight: 600, color: '#111', outline: 'none',
  fontFamily: FONT, background: '#FAFAFA',
  transition: 'border-color 0.15s',
};

const labelStyle = {
  display: 'block', fontSize: 11.5, fontWeight: 800, color: '#6B7280',
  marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT,
};

function FocusInput({ style, readOnly, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      readOnly={readOnly}
      style={{
        ...inputStyle, ...style,
        borderColor: readOnly ? '#F0F0F0' : focused ? RED : '#E5E7EB',
        background: readOnly ? '#F5F5F5' : '#FAFAFA',
        color: readOnly ? '#9CA3AF' : '#111',
        cursor: readOnly ? 'not-allowed' : 'text',
      }}
      onFocus={() => !readOnly && setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function BtnPrimary({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', background: disabled ? '#e57373' : RED, color: '#fff',
      border: 'none', borderRadius: 14, padding: '15px 20px',
      fontSize: 15, fontWeight: 800, cursor: disabled ? 'default' : 'pointer',
      boxShadow: disabled ? 'none' : '0 6px 20px rgba(13,148,136,0.25)',
      fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>
      {children}
    </button>
  );
}

/* ── sub-screen: Información personal ── */
function PersonalInfoScreen({ onBack, profile, session, onSaved }) {
  const [form, setForm] = useState({
    nombre:          profile?.nombre          || '',
    apellido:        profile?.apellido        || '',
    fecha_nacimiento: profile?.fecha_nacimiento || '',
    telefono:        profile?.telefono        || '',
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

  return (
    <div style={{ minHeight: '100%', background: BG, fontFamily: FONT }}>
      <SubHeader title="Información personal" onBack={onBack} />
      <div style={{ padding: '20px 16px 40px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480, margin: '0 auto' }}>

        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Nombre</label>
              <FocusInput value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Juan" autoComplete="given-name" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Apellido</label>
              <FocusInput value={form.apellido} onChange={e => set('apellido', e.target.value)} placeholder="García" autoComplete="family-name" />
            </div>
          </div>

          <div>
            <label style={labelStyle}><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={11} /> Fecha de nacimiento</span></label>
            <FocusInput type="date" value={form.fecha_nacimiento} onChange={e => set('fecha_nacimiento', e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={11} /> Teléfono</span></label>
            <FocusInput type="tel" inputMode="numeric" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="3816 123456" autoComplete="tel" />
          </div>

          <div>
            <label style={labelStyle}><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Mail size={11} /> Email</span></label>
            <FocusInput value={session?.user?.email || ''} readOnly />
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, fontFamily: FONT, fontWeight: 500 }}>El email no se puede modificar</p>
          </div>
        </div>

        <BtnPrimary onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : <><Check size={16} /> Guardar cambios</>}
        </BtnPrimary>
      </div>
    </div>
  );
}

/* ── sub-screen: Configuración ── */
function ConfigScreen({ onBack }) {
  const [notifEnabled, setNotifEnabled] = useState(Notification?.permission === 'granted');
  const navigate = useNavigate();

  const toggleNotif = async () => {
    if (notifEnabled) {
      toast('Para desactivar las notificaciones, hacelo desde la configuración del navegador', { icon: 'ℹ️', duration: 4000 });
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setNotifEnabled(true);
      toast.success('Notificaciones activadas');
    } else {
      toast.error('Permiso denegado para notificaciones');
    }
  };

  return (
    <div style={{ minHeight: '100%', background: BG, fontFamily: FONT }}>
      <SubHeader title="Configuración" onBack={onBack} />
      <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>

        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {/* Notificaciones */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bell size={18} color="#D97706" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#111', margin: 0, fontFamily: FONT }}>Notificaciones</p>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0', fontFamily: FONT, fontWeight: 500 }}>
                {notifEnabled ? 'Activadas' : 'Desactivadas'}
              </p>
            </div>
            <button
              onClick={toggleNotif}
              style={{
                width: 48, height: 27, borderRadius: 99, border: 'none', cursor: 'pointer',
                background: notifEnabled ? RED : '#D1D5DB', padding: 0, position: 'relative',
                flexShrink: 0, transition: 'background 0.2s',
              }}
            >
              <span style={{
                position: 'absolute', top: 3,
                left: notifEnabled ? 24 : 3,
                width: 21, height: 21, borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>

          <div style={{ borderTop: '1px solid #F5F5F5' }} />

          {/* Legal */}
          <button
            onClick={() => navigate('/legal')}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 11, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={18} color="#3B82F6" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#111', margin: 0, fontFamily: FONT }}>Información legal</p>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0', fontFamily: FONT, fontWeight: 500 }}>Términos y política de privacidad</p>
            </div>
            <ChevronRight size={17} color="#D1D5DB" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── modal: Registrar mi negocio ── */
function NegocioModal({ onClose }) {
  const waUrl = 'https://wa.me/543584176892?text=Hola%2C%20quiero%20registrar%20mi%20negocio%20en%20Vicu%C3%B1aYa';
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: '100%', maxWidth: 480, background: '#fff',
        borderRadius: '24px 24px 0 0', padding: '32px 24px 48px',
        fontFamily: FONT, textAlign: 'center',
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <X size={22} color="#9CA3AF" />
        </button>

        <div style={{ fontSize: 56, marginBottom: 16 }}>🏪</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111', margin: '0 0 8px', letterSpacing: '-0.01em' }}>
          Registrá tu negocio
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', fontWeight: 500, margin: '0 0 8px', lineHeight: 1.6 }}>
          Próximamente podrás hacerlo desde la app.
        </p>
        <p style={{ fontSize: 14, color: '#6B7280', fontWeight: 500, margin: '0 0 32px', lineHeight: 1.6 }}>
          Por ahora, contactanos por WhatsApp y te damos de alta en el momento.
        </p>

        <a
          href={waUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: '#25D366', color: '#fff', borderRadius: 14,
            padding: '15px 20px', fontSize: 15, fontWeight: 800,
            textDecoration: 'none', boxShadow: '0 6px 20px rgba(37,211,102,0.3)',
            fontFamily: FONT,
          }}
        >
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

/* ── main screen ── */
function MainScreen({ profile, session, onNav, onLogout }) {
  const name  = fullName(profile);
  const email = session?.user?.email || '';
  const init  = initials(profile);

  const menuItems = [
    {
      key: 'personal',
      Icon: User,
      label: 'Información personal',
      desc:  'Nombre, teléfono, fecha de nacimiento',
      iconBg: '#FEE2E2', iconColor: RED,
    },
    {
      key: 'config',
      Icon: Settings,
      label: 'Configuración',
      desc:  'Notificaciones e información legal',
      iconBg: '#F0FDF4', iconColor: '#16A34A',
    },
    {
      key: 'negocio',
      Icon: Building2,
      label: 'Registrar mi negocio',
      desc:  'Sumá tu local a Kyvra',
      iconBg: '#EFF6FF', iconColor: '#3B82F6',
    },
  ];

  return (
    <div style={{ minHeight: '100%', background: BG, fontFamily: FONT, paddingBottom: 32 }}>

      {/* Header */}
      <div style={{ background: '#fff', padding: '28px 20px 24px', textAlign: 'center', borderBottom: '1px solid #F0F0F0' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: RED, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 900, fontFamily: FONT,
          margin: '0 auto 12px', boxShadow: '0 6px 20px rgba(13,148,136,0.25)',
        }}>
          {init}
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111', margin: '0 0 4px', letterSpacing: '-0.01em', fontFamily: FONT }}>
          {name}
        </h2>
        {email && (
          <p style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500, margin: 0, fontFamily: FONT }}>
            {email}
          </p>
        )}
      </div>

      {/* Menu cards */}
      <div style={{ padding: '20px 16px 0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {menuItems.map(({ key, Icon, label, desc, iconBg, iconColor }, i) => (
            <div key={key}>
              {i > 0 && <div style={{ borderTop: '1px solid #F5F5F5' }} />}
              <button
                onClick={() => onNav(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', width: '100%',
                  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: iconBg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={18} color={iconColor} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#111', margin: 0, fontFamily: FONT }}>{label}</p>
                  <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0', fontFamily: FONT, fontWeight: 500 }}>{desc}</p>
                </div>
                <ChevronRight size={17} color="#D1D5DB" />
              </button>
            </div>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', background: '#fff', border: `1.5px solid #FEE2E2`,
            borderRadius: 16, padding: '14px 20px',
            fontSize: 15, fontWeight: 800, color: RED, cursor: 'pointer',
            boxShadow: '0 1px 6px rgba(0,0,0,0.06)', fontFamily: FONT,
            marginTop: 6,
          }}
        >
          <LogOut size={18} color={RED} />
          Cerrar sesión
        </button>

        <p style={{ textAlign: 'center', fontSize: 11.5, color: '#C4C4C4', marginTop: 8, fontFamily: FONT, fontWeight: 500 }}>
          Kyvra · Vicuña Mackenna, Córdoba
        </p>
      </div>
    </div>
  );
}

/* ── root export ── */
export default function Profile() {
  const navigate = useNavigate();
  const { session, profile, refreshProfile } = useAuth();

  const [view,       setView]       = useState('main'); // 'main' | 'personal' | 'config'
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
    return (
      <PersonalInfoScreen
        onBack={() => setView('main')}
        profile={profile}
        session={session}
        onSaved={refreshProfile}
      />
    );
  }

  if (view === 'config') {
    return <ConfigScreen onBack={() => setView('main')} />;
  }

  return (
    <>
      <MainScreen
        profile={profile}
        session={session}
        onNav={handleNav}
        onLogout={handleLogout}
      />
      {negocioOpen && <NegocioModal onClose={() => setNegocioOpen(false)} />}
    </>
  );
}
