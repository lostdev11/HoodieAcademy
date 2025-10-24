// Centralized user management utilities to prevent duplicates
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface UserData {
  wallet_address: string;
  display_name?: string;
  squad?: string;
  squad_id?: string;
  total_xp?: number;
  level?: number;
  streak?: number;
  is_admin?: boolean;
  banned?: boolean;
}

/**
 * Safely create or update a user, preventing duplicates
 * Always use this function instead of direct database operations
 */
export async function createOrUpdateUser(userData: UserData) {
  try {
    console.log('🔄 [USER MANAGEMENT] Creating/updating user:', userData.wallet_address.slice(0, 8) + '...');

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', userData.wallet_address)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ [USER MANAGEMENT] Error fetching user:', fetchError);
      throw fetchError;
    }

    // Prepare user data with defaults
    const now = new Date().toISOString();
    const finalUserData = {
      wallet_address: userData.wallet_address,
      display_name: userData.display_name || existingUser?.display_name || `User ${userData.wallet_address.slice(0, 6)}...`,
      squad: userData.squad || existingUser?.squad || null,
      squad_id: userData.squad_id || existingUser?.squad_id || null,
      total_xp: userData.total_xp ?? existingUser?.total_xp ?? 0,
      level: userData.level ?? existingUser?.level ?? 1,
      streak: userData.streak ?? existingUser?.streak ?? 0,
      is_admin: userData.is_admin ?? existingUser?.is_admin ?? false,
      banned: userData.banned ?? existingUser?.banned ?? false,
      last_active: now,
      updated_at: now,
      ...(existingUser ? {} : { created_at: now }) // Only set created_at for new users
    };

    // Use upsert to prevent duplicates
    const { data: user, error: upsertError } = await supabase
      .from('users')
      .upsert(finalUserData, { 
        onConflict: 'wallet_address',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (upsertError) {
      console.error('❌ [USER MANAGEMENT] Error upserting user:', upsertError);
      throw upsertError;
    }

    console.log('✅ [USER MANAGEMENT] User created/updated successfully:', user?.display_name || 'No display name');
    return { success: true, user, isNew: !existingUser };
  } catch (error) {
    console.error('💥 [USER MANAGEMENT] Unexpected error:', error);
    throw error;
  }
}

/**
 * Get user by wallet address
 */
export async function getUserByWallet(walletAddress: string) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ [USER MANAGEMENT] Error fetching user:', error);
      throw error;
    }

    return user;
  } catch (error) {
    console.error('💥 [USER MANAGEMENT] Error in getUserByWallet:', error);
    throw error;
  }
}

/**
 * Check if user exists
 */
export async function userExists(walletAddress: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    return !error && !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Get all users with deduplication
 */
export async function getAllUsers() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ [USER MANAGEMENT] Error fetching users:', error);
      throw error;
    }

    // Deduplicate by wallet_address (keep most recent)
    const uniqueUsersMap = new Map();
    users?.forEach(user => {
      const existing = uniqueUsersMap.get(user.wallet_address);
      if (!existing || new Date(user.updated_at) > new Date(existing.updated_at)) {
        uniqueUsersMap.set(user.wallet_address, user);
      }
    });

    const deduplicatedUsers = Array.from(uniqueUsersMap.values());
    console.log(`✅ [USER MANAGEMENT] Fetched ${deduplicatedUsers.length} unique users (${users?.length || 0} total)`);
    
    return deduplicatedUsers;
  } catch (error) {
    console.error('💥 [USER MANAGEMENT] Error in getAllUsers:', error);
    throw error;
  }
}
