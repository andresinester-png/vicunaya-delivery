import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, MapPin, Save, ExternalLink, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import useProfileStore from '../store/profileStore.js';
import { supabase } from '../lib/supabase.js';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.148 17.64 11.84 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { name, phone, address, setProfile } = useProfileStore();
  const [form, setForm] = useState({ name, phone, address });
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setProfile(form);
    setSaved(true);
    toast.success('Perfil guardado');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://delivery-navy.vercel.app/auth/callback' },
    });
    if (error) toast.error('No se pudo conectar con Google');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/welcome', { replace: true });
  };

  const fields = [
    { key: 'name',    icon: User,    label: 'Tu nombre',              placeholder: 'Juan García'           },
    { key: 'phone',   icon: Phone,   label: 'Teléfono',               placeholder: '3571-123456'           },
    { key: 'address', icon: MapPin,  label: 'Dirección favorita',     placeholder: 'San Martín 123'        },
  ];

  return (
    <div className="px-4 py-4">
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 bg-primary-bg rounded-2xl flex items-center justify-center text-3xl">
            👤
          </div>
          <div>
            <h2 className="font-bold text-base">{name || 'Tu nombre'}</h2>
            <p className="text-sm text-gray-500">{phone || 'Sin teléfono'}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="mb-4 w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium transition-colors hover:bg-gray-50"
        >
          <GoogleIcon />
          Continuar con Google
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-2 text-xs text-gray-400">o completá manualmente</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          {fields.map(({ key, icon: Icon, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5">
                <Icon size={12} /> {label}
              </label>
              <input
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="input"
              />
            </div>
          ))}
          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
            <Save size={16} /> Guardar cambios
          </button>
        </form>
      </div>

      {/* Accesos rápidos */}
      <div className="card divide-y divide-neutral-100">
        {[
          { label: 'Mis direcciones',  desc: 'Guardá tus lugares favoritos',  href: '/direcciones',  emoji: '📍' },
          { label: 'Panel de negocio', desc: 'Gestión de pedidos y menú',     href: '/admin/login',  emoji: '🏪' },
          { label: 'Panel conductor',  desc: 'Activarte y recibir viajes',    href: '/driver/login', emoji: '🚗' },
          { label: 'Legal',            desc: 'Privacidad y términos de uso',  href: '/legal',        emoji: '📄' },
        ].map(item => (
          <a key={item.href} href={item.href} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
            <span className="text-2xl">{item.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold text-sm">{item.label}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
            <ExternalLink size={15} className="text-gray-300" />
          </a>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        className="card mt-4 w-full flex items-center justify-center gap-2 p-4 text-sm font-semibold text-primary hover:bg-red-50 transition-colors"
      >
        <LogOut size={16} /> Cerrar sesión
      </button>

      <p className="text-center text-xs text-gray-400 mt-6">VicuñaYa · Vicuña Mackenna, Córdoba</p>
    </div>
  );
}
