import { createClient } from '@supabase/supabase-js';

const url            = import.meta.env.VITE_SUPABASE_URL;
const key            = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.warn('Supabase env vars not set. Copy .env.example to .env and fill in your credentials.');
}

export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder');

// Vicuña Mackenna, Córdoba
export const MAP_CENTER = [-33.9086, -64.3791];

export const FARE = { base: 800, perKm: 350 };
