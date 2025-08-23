import { getSupabaseBrowser } from '@/lib/supabaseClient';

// Re-export the centralized client
export const supabase = getSupabaseBrowser();

// Add a flag to check if Supabase is properly configured
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url_here' &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://') &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key_here' &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0
);

// Log configuration status only once
if (typeof window !== 'undefined') {
  console.log("✅ SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("✅ SUPABASE KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 20)}...` : 'Missing');
  console.log("✅ Supabase Configuration Status:", {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Valid" : "Invalid/Missing",
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Valid" : "Invalid/Missing",
    configured: isSupabaseConfigured
  });
}

export default supabase; 