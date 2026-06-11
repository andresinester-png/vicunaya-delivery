import { MapPin } from 'lucide-react';

export default function PlacesInput({ value, onChange, placeholder, className, autoFocus }) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        autoFocus={autoFocus}
      />
    </div>
  );
}
