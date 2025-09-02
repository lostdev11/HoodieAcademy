import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

let supabase: ReturnType<typeof createBrowserClient> | null = null;
let supabaseAdmin: ReturnType<typeof createClient> | null = null;
let isInitializing = false;
let isAdminInitializing = false;

export function getSupabaseBrowser() {
  if (!supabase && !isInitializing) {
    try {
      isInitializing = true;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      console.log('SupabaseClient: Initializing with URL:', supabaseUrl ? 'Available' : 'Missing');
      console.log('SupabaseClient: Anon key available:', !!supabaseAnonKey);
      
      if (!supabaseUrl || !supabaseAnonKey) {
        const missingVars = [];
        if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
        if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
        
        const errorMsg = `Missing Supabase environment variables: ${missingVars.join(', ')}. Please check your .env.local file.`;
        console.error('SupabaseClient:', errorMsg);
        throw new Error(errorMsg);
      }
      
      supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
      console.log('SupabaseClient: Client created successfully');
    } catch (error) {
      console.error('SupabaseClient: Error creating client:', error);
      throw error;
    } finally {
      isInitializing = false;
    }
  }
  return supabase;
}

export function getSupabaseAdmin() {
  if (!supabaseAdmin && !isAdminInitializing) {
    try {
      isAdminInitializing = true;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      console.log('SupabaseAdmin: Initializing with URL:', supabaseUrl ? 'Available' : 'Missing');
      console.log('SupabaseAdmin: Service role key available:', !!supabaseServiceRoleKey);
      
      if (!supabaseUrl || !supabaseServiceRoleKey) {
        const missingVars = [];
        if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
        if (!supabaseServiceRoleKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
        
        const errorMsg = `Missing Supabase admin environment variables: ${missingVars.join(', ')}. Please check your .env.local file.`;
        console.error('SupabaseAdmin:', errorMsg);
        throw new Error(errorMsg);
      }
      
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
      console.log('SupabaseAdmin: Admin client created successfully');
    } catch (error) {
      console.error('SupabaseAdmin: Error creating admin client:', error);
      throw error;
    } finally {
      isAdminInitializing = false;
    }
  }
  return supabaseAdmin;
}
