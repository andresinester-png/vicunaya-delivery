import { useEffect, useState } from 'react';
import { Home, MapPin, MoreVertical, Plus, X, Pencil, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase.js';
import { KYVRA } from '../lib/theme.js';
import PlacesInput from '../components/PlacesInput.jsx';

const FF = "'Plus Jakarta Sans', sans-serif";
const LABEL_PRESETS = ['Casa', 'Trabajo', 'Otro'];

function AddressCard({ address, isDefault, onMenu }) {
  return (
    <div style={{
      background: KYVRA.white, borderRadius: 20,
      padding: '14px 12px 14px 16px',
      display: 'flex', alignItems: 'flex-start', gap: 12,
      border: isDefault ? `1.5px solid rgba(13,148,136,0.30)` : `1px solid ${KYVRA.border}`,
      boxShadow: isDefault ? '0 4px 16px rgba(13,148,136,0.12)' : '0 2px 12px rgba(15,23,42,0.05)',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 13, flexShrink: 0,
        background: isDefault ? KYVRA.tealBg : KYVRA.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isDefault
          ? <Home size={20} color={KYVRA.teal} />
          : <MapPin size={20} color={KYVRA.textMuted} />}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: KYVRA.navy, margin: 0, letterSpacing: '-0.01em', fontFamily: FF }}>
            {address.label}
          </p>
          {isDefault && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
              background: KYVRA.tealBg, color: KYVRA.teal, flexShrink: 0,
            }}>
              Predeterminada
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, color: KYVRA.textSec, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FF }}>
          {address.address}
        </p>
        {address.notes && (
          <p style={{ fontSize: 12, color: KYVRA.textMuted, margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: FF }}>
            {address.notes}
          </p>
        )}
      </div>
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={onMenu}
        style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: KYVRA.bg, border: `1px solid ${KYVRA.border}`, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
        }}
      >
        <MoreVertical size={17} color={KYVRA.textSec} />
      </motion.button>
    </div>
  );
}

function SheetRow({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        width: '100%', padding: '16px 20px',
        background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
        fontFamily: FF,
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: danger ? 'rgba(239,68,68,0.10)' : KYVRA.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 15, fontWeight: 600, color: danger ? '#EF4444' : KYVRA.navy, fontFamily: FF }}>{label}</span>
    </button>
  );
}

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
          fontFamily: FF,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: KYVRA.border }} />
        </div>

        <div style={{ padding: '10px 20px 14px', borderBottom: `1px solid ${KYVRA.border}` }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: KYVRA.navy, margin: 0, fontFamily: FF }}>{address.label}</p>
          <p style={{ fontSize: 13, color: KYVRA.textMuted, margin: '3px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: FF }}>
            {address.address}
          </p>
        </div>

        {step === 'menu' ? (
          <div style={{ paddingTop: 4 }}>
            {!address.is_default && (
              <SheetRow
                icon={<Check size={19} color={KYVRA.teal} />}
                label="Usar como dirección de entrega"
                onClick={onSetDefault}
              />
            )}
            <SheetRow
              icon={<Pencil size={19} color={KYVRA.textSec} />}
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
            <p style={{ fontSize: 16, fontWeight: 800, color: KYVRA.navy, margin: '0 0 6px', fontFamily: FF }}>¿Eliminar esta dirección?</p>
            <p style={{ fontSize: 13, color: KYVRA.textMuted, margin: '0 0 20px', fontFamily: FF }}>Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setStep('menu')}
                style={{
                  flex: 1, padding: '14px', borderRadius: 14,
                  border: `1.5px solid ${KYVRA.border}`, background: KYVRA.white,
                  fontWeight: 700, fontSize: 14, cursor: 'pointer', color: KYVRA.textSec, fontFamily: FF,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={onDelete}
                style={{
                  flex: 1, padding: '14px', borderRadius: 14,
                  border: 'none', background: '#EF4444', color: '#fff',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: FF,
                }}
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

const modalInputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 12,
  border: `1.5px solid ${KYVRA.border}`, fontSize: 15, fontWeight: 600,
  color: KYVRA.navy, outline: 'none', fontFamily: FF, background: KYVRA.bg,
};

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
          fontFamily: FF,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${KYVRA.border}`, flexShrink: 0 }}>
          <h3 style={{ fontWeight: 800, fontSize: 17, margin: 0, color: KYVRA.navy, fontFamily: FF }}>
            {initial?.id ? 'Editar dirección' : 'Nueva dirección'}
          </h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: KYVRA.bg, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color={KYVRA.textSec} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Label */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: KYVRA.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: FF }}>
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
                    border: form.label === lbl ? `2px solid ${KYVRA.teal}` : `2px solid ${KYVRA.border}`,
                    background: form.label === lbl ? KYVRA.tealBg : KYVRA.white,
                    color: form.label === lbl ? KYVRA.tealDark : KYVRA.textSec,
                    transition: 'all 0.15s', fontFamily: FF,
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
              style={modalInputStyle}
            />
          </div>

          {/* Address */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: KYVRA.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: FF }}>
              Dirección
            </label>
            <PlacesInput
              value={form.address}
              onChange={v => set('address', v)}
              placeholder="San Martín 123"
              style={modalInputStyle}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: KYVRA.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: FF }}>
              Aclaración (opcional)
            </label>
            <input
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Piso 3, depto B, timbre 2..."
              style={modalInputStyle}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%', padding: '15px', borderRadius: 16, border: 'none',
              background: KYVRA.teal, color: '#fff', fontWeight: 700, fontSize: 15,
              cursor: 'pointer', boxShadow: '0 4px 14px rgba(13,148,136,0.35)',
              fontFamily: FF, marginBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            Guardar dirección
          </button>
        </form>
      </motion.div>
    </>
  );
}

export default function Addresses() {
  const [session,    setSession]    = useState(null);
  const [addresses,  setAddresses]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [editModal,  setEditModal]  = useState(null);
  const [actionAddr, setActionAddr] = useState(null);

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

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: `3px solid ${KYVRA.border}`, borderTopColor: KYVRA.teal,
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!session) return (
    <div style={{ padding: '60px 24px', textAlign: 'center', fontFamily: FF }}>
      <div style={{ width: 72, height: 72, borderRadius: 24, background: KYVRA.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <MapPin size={32} color={KYVRA.teal} strokeWidth={1.5} />
      </div>
      <p style={{ fontWeight: 700, fontSize: 16, color: KYVRA.navy, margin: '0 0 8px', fontFamily: FF }}>Iniciá sesión para ver tus direcciones</p>
      <p style={{ fontSize: 14, color: KYVRA.textMuted, margin: 0, fontFamily: FF }}>Accedé desde tu perfil para gestionar tus direcciones.</p>
    </div>
  );

  return (
    <div style={{ background: KYVRA.bg, minHeight: '100%', paddingBottom: 120 }}>

      {/* Page header */}
      <div style={{ background: KYVRA.white, padding: '20px 20px 16px', borderBottom: `1px solid ${KYVRA.border}` }}>
        <h1 style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-0.03em', margin: 0, color: KYVRA.navy, fontFamily: FF }}>
          Mis direcciones
        </h1>
      </div>

      <div style={{ padding: '20px 16px' }}>

        {/* Default address */}
        <p style={{ fontSize: 11, fontWeight: 700, color: KYVRA.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px', fontFamily: FF }}>
          Dirección de entrega
        </p>

        {defaultAddr ? (
          <AddressCard address={defaultAddr} isDefault onMenu={() => setActionAddr(defaultAddr)} />
        ) : (
          <div style={{
            background: KYVRA.white, borderRadius: 20, padding: '16px',
            border: `2px dashed ${KYVRA.border}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: KYVRA.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Home size={20} color={KYVRA.textMuted} />
            </div>
            <p style={{ fontSize: 14, color: KYVRA.textMuted, margin: 0, fontFamily: FF }}>
              Sin dirección predeterminada
            </p>
          </div>
        )}

        {/* Other addresses */}
        {others.length > 0 && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, color: KYVRA.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '24px 0 10px', fontFamily: FF }}>
              Otras direcciones
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {others.map(addr => (
                <AddressCard key={addr.id} address={addr} isDefault={false} onMenu={() => setActionAddr(addr)} />
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {addresses.length === 0 && (
          <div style={{ textAlign: 'center', padding: '52px 0', fontFamily: FF }}>
            <div style={{ width: 72, height: 72, borderRadius: 24, background: KYVRA.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MapPin size={32} color={KYVRA.teal} strokeWidth={1.5} />
            </div>
            <p style={{ fontWeight: 700, fontSize: 15, color: KYVRA.navy, margin: '0 0 8px', fontFamily: FF }}>
              No tenés direcciones guardadas
            </p>
            <p style={{ fontSize: 13, color: KYVRA.textMuted, margin: 0, fontFamily: FF }}>
              Agregá tus lugares frecuentes para pedir más rápido.
            </p>
          </div>
        )}
      </div>

      {/* Fixed "Agregar dirección" button */}
      <div style={{
        position: 'fixed', bottom: 64, left: 0, right: 0,
        padding: '10px 16px 12px',
        background: `linear-gradient(to top, ${KYVRA.bg} 70%, transparent)`,
        zIndex: 30,
      }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setEditModal({})}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: KYVRA.teal, color: '#fff', fontWeight: 700, fontSize: 15,
            padding: '16px', borderRadius: 18, border: 'none', cursor: 'pointer',
            boxShadow: '0 6px 24px rgba(13,148,136,0.40)', fontFamily: FF,
          }}
        >
          <Plus size={20} strokeWidth={2.5} />
          Agregar dirección
        </motion.button>
      </div>

      {/* Action sheet */}
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

      {/* Add / edit modal */}
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
