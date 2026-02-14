import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || '';

const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL?.trim() &&
  SUPABASE_KEY?.trim()
);

let _client: SupabaseClient<Database> | null = null;

if (isSupabaseConfigured) {
  _client = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
} else {
  console.warn('[Supabase] Not configured. Missing env: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY. License verification and AI analysis will use fallbacks.');
}

export const supabase = _client;
