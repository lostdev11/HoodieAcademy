import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// Type for user data from the users table
interface UserData {
  id: string;
  wallet_address: string;
  display_name: string | null;
  squad: string | null;
  is_admin: boolean;
  created_at: string;
  last_active: string; // Use last_active instead of updated_at
}

export async function fetchAllUsers(): Promise<UserData[]> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Fetch from your custom users table - only select columns that exist
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, wallet_address, display_name, squad, is_admin, created_at, last_active');
      
    if (error) {
      console.error('Error fetching users:', error.message);
      throw error;
    }
    
    return (users || []) as UserData[];
  } catch (error) {
    console.error('Error in fetchAllUsers:', error);
    throw error;
  }
}
