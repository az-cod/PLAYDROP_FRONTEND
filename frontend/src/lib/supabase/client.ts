import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Browser Supabase client (ported from @supabase/ssr createBrowserClient).
export function createClient() {
  const supabaseUrl =
    process.env.REACT_APP_SUPABASE_URL ||
    'https://cjvyekcdazzlkdzxzepm.supabase.co';
  const supabaseKey =
    process.env.REACT_APP_SUPABASE_ANON_KEY ||
    'sb_publishable_jYJa_y7N9Q0luqiMLJAyeg_HNCBRR7W';

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
