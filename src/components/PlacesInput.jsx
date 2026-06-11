import { useState, useRef } from 'react';
import { MapPin } from 'lucide-react';

export default function PlacesInput({ value, onChange, placeholder, className, autoFocus }) {
  const [suggestions, setSuggestions] = useState([]);
  const debounceRef = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    clearTimeout(debounceRef.current);
    if (val.length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const query = `${val}, Vicuña Mackenna, Córdoba, Argentina`;
        const res = await fetch(`/api/places?input=${encodeURIComponent(query)}`);
        const data = await res.json();
        const results = (data.suggestions || [])
          .map(s => s.placePrediction)
          .filter(p => {
            const text = p?.text?.text || '';
            return text.toLowerCase().includes('vicuña mackenna') || text.toLowerCase().includes('vicuna mackenna');
          })
          .slice(0, 5);
        setSuggestions(results);
      } catch(err) {
        console.error('Places error:', err);
        setSuggestions([]);
      }
    }, 300);
  };

  const handleBlur = () => setTimeout(() => setSuggestions([]), 150);

  const getMain = (s) => s?.structuredFormat?.mainText?.text || s?.text?.text || '';
  const getSecondary = (s) => s?.structuredFormat?.secondaryText?.text || '';
  const getValue = (s) => s?.text?.text || '';

  return (
    <div className="relative">
      <input
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
        autoFocus={autoFocus}
      />
      {suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={() => { onChange(getValue(s)); setSuggestions([]); }}
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
              >
                <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium leading-tight">{getMain(s)}</p>
                  <p className="truncate text-xs text-gray-400">{getSecondary(s)}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
