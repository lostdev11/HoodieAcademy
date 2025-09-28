import { supabase } from './supabase';
import { getSupabaseAdmin } from './supabaseAdmin';

/**
 * Check if a wallet address has admin privileges with fallback
 */
export async function checkAdminStatus(walletAddress: string): Promise<boolean> {
  // Hardcoded admin wallets as fallback
  const adminWallets = [
    'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
    'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
    '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
    '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
  ];
  
  // First check hardcoded list
  if (adminWallets.includes(walletAddress)) {
    return true;
  }
  
  try {
    // Use admin client to bypass RLS policies
    const adminClient = getSupabaseAdmin();
    if (!adminClient) {
      console.error('Admin client not available, using hardcoded fallback');
      return false;
    }

    const { data, error } = await adminClient
      .from('users')
      .select('is_admin')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) {
      console.error('Admin status check error:', error);
      // If there's a database error, try using the regular client as fallback
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('users')
          .select('is_admin')
          .eq('wallet_address', walletAddress)
          .single();
        
        if (fallbackError) {
          console.error('Fallback admin check also failed:', fallbackError);
          return false;
        }
        
        return !!fallbackData?.is_admin;
      } catch (fallbackErr) {
        console.error('Fallback admin check error:', fallbackErr);
        return false;
      }
    }

    if (!data) {
      console.warn('No user data found for wallet:', walletAddress);
      return false;
    }

    return !!data.is_admin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Check admin status with hardcoded fallback (for API routes)
 */
export function checkAdminStatusWithFallback(walletAddress: string): boolean {
  const adminWallets = [
    'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
    'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
    '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
    '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
  ];
  
  return adminWallets.includes(walletAddress);
}

/**
 * Get admin wallets from the database
 */
export async function getAdminWallets(): Promise<string[]> {
  try {
    // Use admin client to bypass RLS policies
    const adminClient = getSupabaseAdmin();
    if (!adminClient) {
      console.error('Admin client not available');
      return [];
    }

    const { data, error } = await adminClient
      .from('users')
      .select('wallet_address')
      .eq('is_admin', true);

    if (error || !data) {
      console.error('Get admin wallets error:', error);
      return [];
    }

    return data.map((user: { wallet_address: string }) => user.wallet_address);
  } catch (error) {
    console.error('Error getting admin wallets:', error);
    return [];
  }
}

/**
 * Verify admin access for API routes
 */
export async function verifyAdminAccess(walletAddress: string): Promise<{
  isAdmin: boolean;
  error?: string;
}> {
  if (!walletAddress) {
    return { isAdmin: false, error: 'Wallet address required' };
  }

  try {
    // Use admin client to bypass RLS policies
    const adminClient = getSupabaseAdmin();
    if (!adminClient) {
      return { isAdmin: false, error: 'Admin client not available' };
    }

    const { data, error } = await adminClient
      .from('users')
      .select('is_admin')
      .eq('wallet_address', walletAddress)
      .single();

    if (error || !data) {
      return { isAdmin: false, error: 'User not found or database error' };
    }

    if (!data.is_admin) {
      return { isAdmin: false, error: 'Admin access required' };
    }

    return { isAdmin: true };
  } catch (error) {
    console.error('Error verifying admin access:', error);
    return { isAdmin: false, error: 'Database connection error' };
  }
}

/**
 * Check if current user can access admin features
 */
export function canAccessAdmin(walletAddress: string | null, isAdmin: boolean): boolean {
  return !!walletAddress && isAdmin;
}
