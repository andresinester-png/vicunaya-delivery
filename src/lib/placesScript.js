const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
let promise = null;

export function loadPlacesScript() {
  if (promise) return promise;
  promise = new Promise((resolve) => {
    if (window.google?.maps?.places?.AutocompleteSuggestion) { resolve(); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&loading=async&libraries=places&v=weekly`;
    script.async = true;
    script.onload = resolve;
    document.head.appendChild(script);
  });
  return promise;
}
