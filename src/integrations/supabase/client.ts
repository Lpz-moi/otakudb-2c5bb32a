// Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// User's custom Supabase credentials
const SUPABASE_URL = 'https://qfmbhowiobaifvimwfae.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_yXhO4acNlv-lVHoVgu_LgA_FEaBNZvW';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Expose supabase to window in development for easier debugging in the browser console
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // @ts-ignore
  window.supabase = supabase;
}