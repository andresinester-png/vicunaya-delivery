import { useState, useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { loadPlacesScript } from '../lib/placesScript.js';

export default function PlacesInput({ value, onChange, placeholder, className, autoFocus }) {
  const [suggestions, setSuggestions] = useState([]);
  const [mapsReady, setMapsReady] = useState(false);
  const autocompleteRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const tryInit = () => {
      if (cancelled) return;
      if (window.google?.maps?.places) {
        autocompleteRef.current = new window.google.maps.places.AutocompleteService();
        setMapsReady(true);
      } else {
        setTimeout(tryInit, 100);
      }
    };

    loadPlacesScript().then(tryInit);

    return () => {
      cancelled = true;
      clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    clearTimeout(debounceRef.current);
    if (!mapsReady || !autocompleteRef.current || val.length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(() => {
      autocompleteRef.current.getPlacePredictions(
        { input: val, componentRestrictions: { country: 'ar' } },
        (results, status) => {
          setSuggestions(
            status === window.google.maps.places.PlacesServiceStatus.OK
              ? results.slice(0, 5)
              : []
          );
        }
      );
    }, 300);
  };

  const handleBlur = () => setTimeout(() => setSuggestions([]), 150);

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
          {suggestions.map(s => (
            <li key={s.place_id}>
              <button
                type="button"
                onMouseDown={() => { onChange(s.description); setSuggestions([]); }}
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
              >
                <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium leading-tight">
                    {s.structured_formatting.main_text}
                  </p>
                  <p className="truncate text-xs text-gray-400">
                    {s.structured_formatting.secondary_text}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
