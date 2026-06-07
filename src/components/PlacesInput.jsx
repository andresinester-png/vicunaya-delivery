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
      const AC = window.google?.maps?.places?.AutocompleteSuggestion;
      if (!AC) { console.warn('AutocompleteSuggestion no disponible'); return; }
      try {
        const { suggestions: results } = await AC.fetchAutocompleteSuggestions({
          input: val,
          language: 'es',
          region: 'ar',
        });
        setSuggestions(results?.slice(0, 5) || []);
      } catch(err) {
        console.error('Places error:', err);
        setSuggestions([]);
      }
    }, 300);
  };

  const handleBlur = () => setTimeout(() => setSuggestions([]), 150);

  const getLabel = (s) => ({
    main: s.placePrediction?.structuredFormat?.mainText?.text || s.placePrediction?.text?.text || '',
    secondary: s.placePrediction?.structuredFormat?.secondaryText?.text || '',
  });

  const getValue = (s) => s.placePrediction?.text?.text || '';

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
          {suggestions.map((s, i) => {
            const label = getLabel(s);
            return (
              <li key={i}>
                <button
                  type="button"
                  onMouseDown={() => { onChange(getValue(s)); setSuggestions([]); }}
                  className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                >
                  <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium leading-tight">{label.main}</p>
                    <p className="truncate text-xs text-gray-400">{label.secondary}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
