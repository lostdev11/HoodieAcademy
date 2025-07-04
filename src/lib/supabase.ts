import { createClient } from '@supabase/supabase-js'

// Fallback values for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mchwxspjjgyboshzqrsd.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jaHd4c3Bqamd5Ym9zaHpxcnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0ODY5ODIsImV4cCI6MjA2NzA2Mjk4Mn0.MSn5FKMQfTsYmTE6j1dSwEX6H7ASR09zEyGPX0kX1r0'

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  throw new Error('Missing Supabase environment variables')
}

// Log for debugging (remove in production)
console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Not set')
console.log('Supabase Key:', supabaseAnonKey ? 'Set' : 'Not set')

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Database types
export interface Message {
  id: string
  text: string
  sender: string
  squad: string
  timestamp: string
  created_at: string
}

export interface NewMessage {
  text: string
  sender: string
  squad: string
} 