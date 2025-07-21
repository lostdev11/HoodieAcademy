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

// User tracking types
export interface User {
  id?: string
  wallet_address: string
  display_name?: string
  squad?: string
  profile_completed: boolean
  squad_test_completed: boolean
  created_at?: string
  last_active?: string
}

export interface PlacementTest {
  id?: string
  wallet_address: string
  squad: string
  completed_at?: string
}

// User tracking functions
export async function recordPlacementTest(wallet_address: string, squad: string, display_name?: string) {
  try {
    console.log('Recording placement test:', { wallet_address, squad, display_name })
    
    // Upsert user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert([
        {
          wallet_address,
          display_name: display_name || `User ${wallet_address.slice(0, 6)}...`,
          squad,
          profile_completed: !!display_name,
          squad_test_completed: true,
          last_active: new Date().toISOString(),
        }
      ], {
        onConflict: 'wallet_address'
      })

    if (userError) {
      console.error('Error upserting user:', userError)
      throw userError
    }

    // Insert placement test record
    const { data: placementData, error: placementError } = await supabase
      .from('placement_tests')
      .insert([
        {
          wallet_address,
          squad,
          completed_at: new Date().toISOString(),
        }
      ])

    if (placementError) {
      console.error('Error inserting placement test:', placementError)
      throw placementError
    }

    console.log('Successfully recorded placement test:', { userData, placementData })
    return { userData, placementData }
  } catch (error) {
    console.error('Error in recordPlacementTest:', error)
    throw error
  }
}

export async function updateUserActivity(wallet_address: string, activity_type: string = 'general') {
  try {
    const { error } = await supabase
      .from('users')
      .update({ last_active: new Date().toISOString() })
      .eq('wallet_address', wallet_address)

    if (error) {
      console.error('Error updating user activity:', error)
      throw error
    }

    console.log('Updated user activity for:', wallet_address)
  } catch (error) {
    console.error('Error in updateUserActivity:', error)
    throw error
  }
}

export async function fetchAllUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in fetchAllUsers:', error)
    return []
  }
}

export async function fetchPlacementTests(): Promise<PlacementTest[]> {
  try {
    const { data, error } = await supabase
      .from('placement_tests')
      .select('*')
      .order('completed_at', { ascending: false })

    if (error) {
      console.error('Error fetching placement tests:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in fetchPlacementTests:', error)
    return []
  }
}

export async function getUserStats() {
  try {
    const users = await fetchAllUsers()
    const placements = await fetchPlacementTests()

    const totalUsers = users.length
    const activeUsers = users.filter(user => 
      new Date(user.last_active || user.created_at || '') > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length
    const placementTestsCompleted = placements.length
    
    // Calculate squad distribution
    const squadDistribution: { [squad: string]: number } = {}
    placements.forEach(placement => {
      squadDistribution[placement.squad] = (squadDistribution[placement.squad] || 0) + 1
    })

    return {
      totalUsers,
      activeUsers,
      placementTestsCompleted,
      squadDistribution
    }
  } catch (error) {
    console.error('Error getting user stats:', error)
    return {
      totalUsers: 0,
      activeUsers: 0,
      placementTestsCompleted: 0,
      squadDistribution: {}
    }
  }
} 