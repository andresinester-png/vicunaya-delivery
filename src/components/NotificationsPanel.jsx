import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Package, ChefHat, Bike, CheckCircle2, Calendar, Clock } from 'lucide-react';

const FONT   = "'Plus Jakarta Sans', sans-serif";
const RED    = '#D32F2F';
const PURPLE = '#7C3AED';

const TIPO_CONFIG = {
  pedido_aceptado:    { Icon: CheckCircle2, color: '#16A34A', bg: '#F0FDF4' },
  pedido_preparando:  { Icon: ChefHat,      color: '#D97706', bg: '#FFFBEB' },
  pedido_en_camino:   { Icon: Bike,         color: '#2563EB', bg: '#EFF6FF' },
  pedido_entregado:   { Icon: Package,      color: PURPLE,    bg: '#F5F3FF' },
  turno_confirmado:   { Icon: Calendar,     color: RED,       bg: '#FEE2E2' },
  turno_recordatorio: { Icon: Clock,        color: '#D97706', bg: '#FFFBEB' },
};

function timeAgo(iso) {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60)    return 'ahora';
  if (s < 3600)  return `hace ${Math.floor(s / 60)}m`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)}h`;
  return `hace ${Math.floor(s / 86400)}d`;
}

function NotifItem({ n }) {
  const cfg    = TIPO_CONFIG[n.tipo] ?? TIPO_CONFIG.pedido_aceptado;
  const { Icon } = cfg;
  const unread = !n.leida;

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14,
      padding: '14px 18px 14px 0',
      background:  unread ? '#EDE7F6' : '#F5F5F5',
      borderBottom: '1px solid #E5E5E5',
      borderLeft:  `4px solid ${unread ? PURPLE : 'transparent'}`,
      paddingLeft: 14,
    }}>
      {/* Ícono de categoría */}
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: cfg.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} color={cfg.color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Fila: punto + título + hora */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {unread && (
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: PURPLE, flexShrink: 0,
            }} />
          )}
          <p style={{
            flex: 1, margin: 0,
            fontFamily: FONT, fontSize: 13, lineHeight: 1.3,
            fontWeight: unread ? 800 : 400,
            color: unread ? '#1A1035' : '#666',
          }}>
            {n.titulo}
          </p>
          <span style={{
            flexShrink: 0,
            fontSize: 10, fontFamily: FONT,
            fontWeight: unread ? 700 : 400,
            color: unread ? PURPLE : '#BDBDBD',
          }}>
            {timeAgo(n.created_at)}
          </span>
        </div>

        {n.mensaje && (
          <p style={{
            margin: '5px 0 0',
            fontFamily: FONT, fontSize: 12, lineHeight: 1.45,
            fontWeight: 500,
            color: unread ? '#4A3568' : '#9CA3AF',
          }}>
            {n.mensaje}
          </p>
        )}
      </div>
    </div>
  );
}

export default function NotificationsPanel({ open, onClose, notifications, onMarkAllAsRead }) {
  const unread = notifications.filter(n => !n.leida).length;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="notif-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 55 }}
          />

          {/* Drawer desde la derecha */}
          <motion.div
            key="notif-drawer"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: 'min(380px, 100vw)',
              background: '#fff', zIndex: 56,
              display: 'flex', flexDirection: 'column',
              boxShadow: '-6px 0 40px rgba(0,0,0,0.18)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', background: RED, flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Bell size={19} color="#fff" />
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 16, fontFamily: FONT }}>
                  Notificaciones{unread > 0 ? ` (${unread})` : ''}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {unread > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    style={{
                      background: 'rgba(255,255,255,0.22)', border: 'none', borderRadius: 8,
                      padding: '5px 11px', color: '#fff', fontSize: 11, fontWeight: 700,
                      cursor: 'pointer', fontFamily: FONT,
                    }}
                  >
                    Leer todo
                  </button>
                )}
                <button
                  onClick={onClose}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', padding: 4 }}
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Lista */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9CA3AF' }}>
                  <Bell size={44} color="#E5E7EB" style={{ margin: '0 auto 14px' }} />
                  <p style={{ fontWeight: 700, fontSize: 14, margin: 0, fontFamily: FONT }}>Sin notificaciones</p>
                  <p style={{ fontSize: 12, margin: '6px 0 0', fontFamily: FONT, fontWeight: 500 }}>
                    Acá vas a ver el estado de tus pedidos y turnos
                  </p>
                </div>
              ) : (
                notifications.map(n => <NotifItem key={n.id} n={n} />)
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
