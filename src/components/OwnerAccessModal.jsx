import { useState, useEffect } from 'react';
import { X, Loader2, RefreshCw, Key, Copy, Check, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabaseAdmin } from '../lib/supabase.js';

const PROTECTED = ['andresinester@gmail.com', 'admin@vicunaya.com'];

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function CopyField({ label, value }) {
  const copy = () => { navigator.clipboard.writeText(value); toast.success(`${label} copiado`); };
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{label}</span>
        <button onClick={copy} className="p-1 text-gray-400 hover:text-gray-700 transition-colors rounded">
          <Copy size={12} />
        </button>
      </div>
      <p className="font-mono text-sm font-bold text-gray-900 break-all">{value}</p>
    </div>
  );
}

function CredentialsBox({ email, password, onClose }) {
  const copyAll = () => {
    navigator.clipboard.writeText(`Email: ${email}\nContraseña: ${password}`);
    toast.success('Copiado al portapapeles');
  };
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 text-green-600 bg-green-50 rounded-xl px-3 py-2.5">
        <Check size={16} className="shrink-0 mt-0.5" />
        <p className="text-sm font-semibold">¡Listo! Compartí estas credenciales con el dueño.</p>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
        <CopyField label="Email" value={email} />
        <div className="border-t border-gray-200 pt-3">
          <CopyField label="Contraseña" value={password} />
        </div>
      </div>
      <button
        onClick={copyAll}
        className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-600 py-2.5 rounded-xl transition-colors"
      >
        <Copy size={14} /> Copiar todo
      </button>
      <button onClick={onClose} className="btn-primary w-full">Listo</button>
    </div>
  );
}

function PasswordRow({ value, onChange, onGenerate }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Contraseña</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Escribí o generá una contraseña…"
          className="input font-mono flex-1 text-sm"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={onGenerate}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} /> Generar
        </button>
      </div>
    </div>
  );
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '92vh' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 shrink-0">
          <div>
            <h2 className="font-extrabold text-lg">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[280px]">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors shrink-0">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

async function saveCredential({ email, password, businessType, businessId }) {
  await supabaseAdmin.from('owner_credentials').upsert(
    { email, plain_password: password, business_type: businessType, business_id: businessId, updated_at: new Date().toISOString() },
    { onConflict: 'business_id' }
  );
}

// ── CreateAccessModal ────────────────────────────────────────────────────────
export function CreateAccessModal({ entityId, entityName, table, onClose, onSaved }) {
  const businessType = table === 'restaurants' ? 'restaurant' : 'turnos';

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [saving,      setSaving]      = useState(false);
  const [credentials, setCredentials] = useState(null);

  const handleCreate = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed)    { toast.error('Ingresá un email'); return; }
    if (!password)   { toast.error('Escribí o generá una contraseña'); return; }
    if (PROTECTED.includes(trimmed)) { toast.error('No se puede usar ese email'); return; }

    setSaving(true);
    try {
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: trimmed,
        password,
        email_confirm: true,
      });
      if (authErr) throw authErr;

      const { error: dbErr } = await supabaseAdmin
        .from(table)
        .update({ owner_id: authData.user.id })
        .eq('id', entityId);
      if (dbErr) throw dbErr;

      await saveCredential({ email: trimmed, password, businessType, businessId: entityId });

      setCredentials({ email: trimmed, password });
      onSaved();
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (credentials) {
    return (
      <ModalShell title="Acceso creado" onClose={onClose}>
        <CredentialsBox email={credentials.email} password={credentials.password} onClose={onClose} />
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Crear acceso" subtitle={entityName} onClose={onClose}>
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email del dueño *</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="dueno@ejemplo.com"
          className="input"
          autoCapitalize="none"
        />
      </div>
      <PasswordRow
        value={password}
        onChange={setPassword}
        onGenerate={() => setPassword(generatePassword())}
      />
      <button
        onClick={handleCreate}
        disabled={saving || !email.trim() || !password}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 size={17} className="animate-spin" /> : <Key size={17} />}
        {saving ? 'Creando acceso…' : 'Crear acceso'}
      </button>
    </ModalShell>
  );
}

// ── ResetPasswordModal ───────────────────────────────────────────────────────
export function ResetPasswordModal({ userId, email, businessId, businessType, onClose }) {
  const [password,    setPassword]    = useState('');
  const [saving,      setSaving]      = useState(false);
  const [credentials, setCredentials] = useState(null);

  const handleReset = async () => {
    if (!password) { toast.error('Escribí o generá una contraseña'); return; }
    if (PROTECTED.includes(email)) { toast.error('No se puede modificar esta cuenta'); return; }

    setSaving(true);
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
      if (error) throw error;

      if (businessId && businessType) {
        await saveCredential({ email, password, businessType, businessId });
      }

      setCredentials({ email, password });
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (credentials) {
    return (
      <ModalShell title="Contraseña reseteada" onClose={onClose}>
        <CredentialsBox email={credentials.email} password={credentials.password} onClose={onClose} />
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Resetear contraseña" subtitle={email} onClose={onClose}>
      <p className="text-sm text-gray-500">
        Nueva contraseña para <span className="font-semibold text-gray-700">{email}</span>. La anterior quedará inactiva.
      </p>
      <PasswordRow
        value={password}
        onChange={setPassword}
        onGenerate={() => setPassword(generatePassword())}
      />
      <button
        onClick={handleReset}
        disabled={saving || !password}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 size={17} className="animate-spin" /> : <RefreshCw size={17} />}
        {saving ? 'Reseteando…' : 'Resetear contraseña'}
      </button>
    </ModalShell>
  );
}

// ── ViewPasswordModal ────────────────────────────────────────────────────────
export function ViewPasswordModal({ businessId, email, onClose }) {
  const [cred,    setCred]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabaseAdmin
      .from('owner_credentials')
      .select('plain_password, updated_at')
      .eq('business_id', businessId)
      .single()
      .then(({ data }) => { setCred(data); setLoading(false); });
  }, [businessId]);

  return (
    <ModalShell title="Contraseña guardada" subtitle={email} onClose={onClose}>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : cred ? (
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
            <CopyField label="Email" value={email} />
            <div className="border-t border-gray-200 pt-3">
              <CopyField label="Contraseña" value={cred.plain_password} />
            </div>
          </div>
          {cred.updated_at && (
            <p className="text-xs text-gray-400 text-center">
              Guardada el{' '}
              {new Date(cred.updated_at).toLocaleDateString('es-AR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          )}
          <button
            onClick={() => {
              navigator.clipboard.writeText(`Email: ${email}\nContraseña: ${cred.plain_password}`);
              toast.success('Copiado al portapapeles');
            }}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-600 py-2.5 rounded-xl transition-colors"
          >
            <Copy size={14} /> Copiar todo
          </button>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 space-y-1">
          <Eye size={32} strokeWidth={1} className="mx-auto" />
          <p className="text-sm font-semibold mt-2">Sin contraseña guardada</p>
          <p className="text-xs">Usá "Resetear" para establecer una nueva.</p>
        </div>
      )}
    </ModalShell>
  );
}
