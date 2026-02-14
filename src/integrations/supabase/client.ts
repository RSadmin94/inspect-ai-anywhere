import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Safe read - never throw; no side effects beyond constants
const url = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const key =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  '';

export const isSupabaseConfigured = Boolean(url && key);

let _supabase: SupabaseClient<Database> | null = null;
try {
  if (isSupabaseConfigured) {
    _supabase = createClient<Database>(url, key, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
} catch {
  // Defensive: createClient should not throw with valid url/key, but never crash
  _supabase = null;
}

export const supabase = _supabase;
