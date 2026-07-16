import { useEffect, useState } from 'react';
import { Home, MapPin, MoreVertical, Plus, X, Pencil, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase.js';
import PlacesInput from '../components/PlacesInput.jsx';

const LABEL_PRESETS = ['Casa', 'Trabajo', 'Otro'];

// ── Address card ──────────────────────────────────────────────────
function AddressCard({ address, isDefault, onMenu }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      padding: '14px 12px 14px 16px',
      display: 'flex', alignItems: 'flex-start', gap: 12,
      boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: isDefault ? '#FFF8F8' : '#F3F4F6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isDefault
          ? <Home size={20} color="#0F172A" />
          : <MapPin size={20} color="#9CA3AF" />}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: '#111', margin: '0 0 3px', letterSpacing: '-0.01em' }}>
          {address.label}
        </p>
        <p style={{ fontSize: 13, color: '#6B7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {address.address}
        </p>
        {address.notes && (
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {address.notes}
          </p>
        )}
      </div>
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={onMenu}
        style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: '#F3F4F6', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: 1,
        }}
      >
        <MoreVertical size={17} color="#6B7280" />
      </motion.button>
    </div>
  );
}

// ── Sheet row button ──────────────────────────────────────────────
function SheetRow({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        width: '100%', padding: '16px 20px',
        background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 12, background: danger ? '#FFF8F8' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ fontSize: 15, fontWeight: 600, color: danger ? '#EF4444' : '#111' }}>{label}</span>
    </button>
  );
}

// ── Action bottom sheet ───────────────────────────────────────────
function ActionSheet({ address, onSetDefault, onEdit, onDelete, onClose }) {
  const [step, setStep] = useState('menu');

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50 }}
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
          background: '#fff', borderRadius: '24px 24px 0 0',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E5E7EB' }} />
        </div>

        {/* Address preview */}
        <div style={{ padding: '10px 20px 14px', borderBottom: '1px solid #F3F4F6' }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#111', margin: 0 }}>{address.label}</p>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: '3px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {address.address}
          </p>
        </div>

        {step === 'menu' ? (
          <div style={{ paddingTop: 4 }}>
            {!address.is_default && (
              <SheetRow
                icon={<Check size={19} color="#0F172A" />}
                label="Usar como dirección de entrega"
                onClick={onSetDefault}
              />
            )}
            <SheetRow
              icon={<Pencil size={19} color="#374151" />}
              label="Editar dirección"
              onClick={onEdit}
            />
            <SheetRow
              icon={<Trash2 size={19} color="#EF4444" />}
              label="Eliminar dirección"
              onClick={() => setStep('confirm')}
              danger
            />
          </div>
        ) : (
          <div style={{ padding: '20px' }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: '0 0 6px' }}>¿Eliminar esta dirección?</p>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 20px' }}>Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setStep('menu')}
                style={{ flex: 1, padding: '14px', borderRadius: 14, border: '2px solid #E5E7EB', background: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', color: '#374151' }}
              >
                Cancelar
              </button>
              <button
                onClick={onDelete}
                style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: '#EF4444', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}

// ── Add / Edit modal ──────────────────────────────────────────────
function AddressModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    label:   initial?.label   || 'Casa',
    address: initial?.address || '',
    notes:   initial?.notes   || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.address.trim()) { toast.error('Ingresá la dirección'); return; }
    onSave(form);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 52 }}
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 53,
          background: '#fff', borderRadius: '24px 24px 0 0',
          maxHeight: '92vh', display: 'flex', flexDirection: 'column',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
          <h3 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>
            {initial?.id ? 'Editar dirección' : 'Nueva dirección'}
          </h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color="#6B7280" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Label */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Etiqueta
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {LABEL_PRESETS.map(lbl => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => set('label', lbl)}
                  style={{
                    padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: form.label === lbl ? '2px solid #0F172A' : '2px solid #E9D5D8',
                    background: form.label === lbl ? '#FFF8F8' : '#fff',
                    color: form.label === lbl ? '#0F172A' : '#6B7280',
                    transition: 'all 0.15s',
                  }}
                >
                  {lbl}
                </button>
              ))}
            </div>
            <input
              value={form.label}
              onChange={e => set('label', e.target.value)}
              placeholder="Casa, Trabajo, Otro..."
              className="input"
            />
          </div>

          {/* Address */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Dirección
            </label>
            <PlacesInput
              value={form.address}
              onChange={v => set('address', v)}
              placeholder="San Martín 123"
              className="input"
            />
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Aclaración (opcional)
            </label>
            <input
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Piso 3, depto B, timbre 2..."
              className="input"
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%', padding: '15px', borderRadius: 16, border: 'none',
              background: '#0D9488', color: '#fff', fontWeight: 700, fontSize: 15,
              cursor: 'pointer', boxShadow: '0 4px 14px rgba(13,148,136,0.35)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              marginBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            Guardar dirección
          </button>
        </form>
      </motion.div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function Addresses() {
  const [session,    setSession]    = useState(null);
  const [addresses,  setAddresses]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [editModal,  setEditModal]  = useState(null);   // null | {} | address
  const [actionAddr, setActionAddr] = useState(null);   // address for action sheet

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setSession(user); load(user.id); }
      else setLoading(false);
    });
  }, []);

  const load = async (uid) => {
    const { data } = await supabase
      .from('addresses').select('*').eq('user_id', uid)
      .order('is_default', { ascending: false }).order('created_at');
    setAddresses(data || []);
    setLoading(false);
  };

  const handleSave = async (form) => {
    if (!session) return;
    const isNew = !editModal?.id;
    try {
      if (isNew) {
        const noDefault = addresses.every(a => !a.is_default);
        const { error } = await supabase.from('addresses').insert({
          label:      form.label,
          address:    form.address,
          notes:      form.notes || null,
          user_id:    session.id,
          is_default: noDefault,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('addresses').update({
          label:   form.label,
          address: form.address,
          notes:   form.notes || null,
        }).eq('id', editModal.id);
        if (error) throw error;
      }
      toast.success(isNew ? 'Dirección guardada' : 'Dirección actualizada');
      setEditModal(null);
      load(session.id);
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    if (error) { toast.error('Error al eliminar'); return; }
    toast.success('Dirección eliminada');
    setActionAddr(null);
    load(session.id);
  };

  const handleSetDefault = async (id) => {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', session.id);
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    setActionAddr(null);
    load(session.id);
  };

  const defaultAddr = addresses.find(a => a.is_default);
  const others      = addresses.filter(a => !a.is_default);

  // ── Loading ──
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div className="animate-spin" style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #0D9488', borderTopColor: 'transparent' }} />
    </div>
  );

  // ── Not logged in ──
  if (!session) return (
    <div style={{ padding: '60px 24px', textAlign: 'center' }}>
      <MapPin size={52} strokeWidth={1.2} style={{ color: '#D1D5DB', margin: '0 auto 16px', display: 'block' }} />
      <p style={{ fontWeight: 700, fontSize: 16, color: '#374151', margin: '0 0 8px' }}>Iniciá sesión para ver tus direcciones</p>
      <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>Usá Google en tu perfil para acceder.</p>
    </div>
  );

  return (
    <div style={{ background: '#FFF8F8', minHeight: '100%', paddingBottom: 120 }}>

      {/* Page header */}
      <div style={{ background: '#fff', padding: '20px 20px 16px', borderBottom: '1px solid #F3F4F6' }}>
        <h1 style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-0.03em', margin: 0, color: '#111' }}>
          Mis direcciones
        </h1>
      </div>

      <div style={{ padding: '20px 16px' }}>

        {/* ── Dirección de entrega ── */}
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>
          Dirección de entrega
        </p>

        {defaultAddr ? (
          <AddressCard
            address={defaultAddr}
            isDefault
            onMenu={() => setActionAddr(defaultAddr)}
          />
        ) : (
          <div style={{
            background: '#fff', borderRadius: 16, padding: '16px',
            border: '2px dashed #E5E7EB',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Home size={20} color="#D1D5DB" />
            </div>
            <p style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 500, margin: 0 }}>
              Sin dirección predeterminada
            </p>
          </div>
        )}

        {/* ── Otras direcciones ── */}
        {others.length > 0 && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '24px 0 10px' }}>
              Otras direcciones
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {others.map(addr => (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  isDefault={false}
                  onMenu={() => setActionAddr(addr)}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Empty state ── */}
        {addresses.length === 0 && (
          <div style={{ textAlign: 'center', padding: '52px 0' }}>
            <MapPin size={52} strokeWidth={1.2} style={{ color: '#D1D5DB', margin: '0 auto 16px', display: 'block' }} />
            <p style={{ fontWeight: 700, fontSize: 15, color: '#374151', margin: '0 0 8px' }}>
              No tenés direcciones guardadas
            </p>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
              Agregá tus lugares frecuentes para pedir más rápido.
            </p>
          </div>
        )}
      </div>

      {/* ── Fixed "Agregar dirección" button ── */}
      <div style={{
        position: 'fixed', bottom: 64, left: 0, right: 0,
        padding: '10px 16px 12px',
        background: 'linear-gradient(to top, #FFF8F8 70%, transparent)',
        zIndex: 30,
      }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setEditModal({})}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#0D9488', color: '#fff', fontWeight: 700, fontSize: 15,
            padding: '16px', borderRadius: 18, border: 'none', cursor: 'pointer',
            boxShadow: '0 6px 24px rgba(13,148,136,0.40)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          <Plus size={20} strokeWidth={2.5} />
          Agregar dirección
        </motion.button>
      </div>

      {/* ── Action sheet ── */}
      <AnimatePresence>
        {actionAddr && (
          <ActionSheet
            key="action-sheet"
            address={actionAddr}
            onSetDefault={() => handleSetDefault(actionAddr.id)}
            onEdit={() => { setEditModal(actionAddr); setActionAddr(null); }}
            onDelete={() => handleDelete(actionAddr.id)}
            onClose={() => setActionAddr(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Add / edit modal ── */}
      <AnimatePresence>
        {editModal !== null && (
          <AddressModal
            key="address-modal"
            initial={editModal}
            onSave={handleSave}
            onClose={() => setEditModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
