import { createBrowserClient } from '@supabase/ssr';
import { createClient } from "@supabase/supabase-js";

let supabase: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowser() {
  if (!supabase) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      console.log('SupabaseClient: Initializing with URL:', supabaseUrl ? 'Available' : 'Missing');
      console.log('SupabaseClient: Anon key available:', !!supabaseAnonKey);
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('SupabaseClient: Missing environment variables');
        throw new Error('Missing Supabase environment variables');
      }
      
      supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
      console.log('SupabaseClient: Client created successfully');
    } catch (error) {
      console.error('SupabaseClient: Error creating client:', error);
      throw error;
    }
  }
  return supabase;
}

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // <-- server only
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
