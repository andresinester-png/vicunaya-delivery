import { MapPin } from 'lucide-react';

export default function PlacesInput({ value, onChange, placeholder, className, style, autoFocus }) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        style={style}
        autoFocus={autoFocus}
      />
    </div>
  );
}
