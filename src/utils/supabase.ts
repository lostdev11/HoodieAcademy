import { createClient } from "@supabase/supabase-js";

export function createServerClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY! // now only accessible on server
  );
} 