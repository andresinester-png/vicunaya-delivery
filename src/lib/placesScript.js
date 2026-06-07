import { Loader } from '@googlemaps/js-api-loader';

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
let promise = null;

export function loadPlacesScript() {
  if (promise) return promise;
  promise = new Loader({
    apiKey: API_KEY,
    version: 'weekly',
    libraries: ['places'],
  }).importLibrary('places');
  return promise;
}
