import { CreditCard, Building2, Banknote } from 'lucide-react';

const METHODS = [
  {
    id: 'card',
    label: 'Tarjeta débito/crédito',
    sublabel: 'Vía MercadoPago — seguro y rápido',
    icon: CreditCard,
    badge: 'MP',
  },
  {
    id: 'transfer',
    label: 'Transferencia bancaria',
    sublabel: 'Te mostramos el CBU y subís el comprobante',
    icon: Building2,
  },
  {
    id: 'cash',
    label: 'Efectivo al entregar',
    sublabel: 'Pagás cuando llega tu pedido',
    icon: Banknote,
  },
];

export default function PaymentSelector({ value, onChange }) {
  return (
    <div className="space-y-3">
      {METHODS.map(m => {
        const Icon = m.icon;
        const selected = value === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
              selected ? 'border-primary bg-primary-bg' : 'border-neutral-200 bg-white hover:border-neutral-300'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
              <Icon size={20} />
            </div>
            <div className="flex-1">
              <p className={`font-semibold text-sm ${selected ? 'text-primary' : 'text-gray-900'}`}>{m.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{m.sublabel}</p>
            </div>
            {m.badge && (
              <span className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded-md">{m.badge}</span>
            )}
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? 'border-primary' : 'border-gray-300'}`}>
              {selected && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
