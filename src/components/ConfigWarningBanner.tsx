import { isSupabaseConfigured } from '@/integrations/supabase/client';
import { AlertTriangle } from 'lucide-react';

export function ConfigWarningBanner() {
  if (isSupabaseConfigured) return null;

  return (
    <div
      className="w-full py-2 px-4 bg-destructive/20 border-b border-destructive/40 flex items-center justify-center gap-2 text-destructive text-sm font-medium"
      role="alert"
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span>
        Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment (e.g. Netlify).
      </span>
    </div>
  );
}
