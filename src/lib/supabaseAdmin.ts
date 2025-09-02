// src/lib/supabaseAdmin.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Global variable to store the admin client instance
let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  // Check if we already have an admin client
  if (adminClient) {
    return adminClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Service role for server-side writes / upserts; falls back to anon for local dev
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase envs (URL or KEY).");
  }

  // Create the admin client only once
  adminClient = createClient(url, key, {
    auth: { 
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
  });

  return adminClient;
}

// Function to clear the admin client (useful for testing)
export function clearSupabaseAdmin() {
  adminClient = null;
}
