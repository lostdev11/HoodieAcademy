import { createClient } from '@supabase/supabase-js'

// Check if the URL is a valid Supabase URL (not placeholder)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isValidSupabaseUrl = supabaseUrl && 
  supabaseUrl !== 'your_supabase_url_here' && 
  supabaseUrl.startsWith('https://');

const supabase = isValidSupabaseUrl && supabaseKey && supabaseKey !== 'your_supabase_anon_key_here'
  ? createClient(supabaseUrl, supabaseKey)
  : createClient('https://mock.supabase.co', 'mock-key');

export default supabase 