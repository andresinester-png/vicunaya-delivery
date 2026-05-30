import { createClient } from '@supabase/supabase-js';

const url            = import.meta.env.VITE_SUPABASE_URL;
const key            = import.meta.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.warn('Supabase env vars not set. Copy .env.example to .env and fill in your credentials.');
}

export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder');

// Bypasses RLS — use only in admin panel, never in user-facing flows.
// storageKey + detectSessionInUrl: false give this instance a distinct
// identity so the SDK doesn't log a "multiple GoTrueClient instances" warning.
export const supabaseAdmin = createClient(
  url || 'https://placeholder.supabase.co',
  serviceRoleKey || key || 'placeholder',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storageKey: 'sb-admin',
    },
  }
);

// Vicuña Mackenna, Córdoba
export const MAP_CENTER = [-33.9086, -64.3791];

export const FARE = { base: 800, perKm: 350 };
