'use client';

import { getSupabaseBrowser } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';

// Cache for admin status to avoid repeated database calls
const adminCache = new Map<string, { isAdmin: boolean; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function checkAdminStatusDirect(wallet: string): Promise<boolean> {
  try {
    // Check cache first
    const cached = adminCache.get(wallet);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.isAdmin;
    }

    const supabase = getSupabaseBrowser();
    
    // Try RPC first, fallback to direct query
    let isAdmin = false;
    
    try {
      const { data, error } = await supabase.rpc('is_wallet_admin', { wallet });
      
      if (error) {
        console.error('RPC error checking admin status:', error);
        // Fallback to direct query
        throw error;
      }
      
      isAdmin = Boolean(data);
    } catch (rpcError) {
      // Fallback: direct query with service role key if RPC fails
      console.warn('RPC failed, using fallback admin check');
      const { data: userData, error: queryError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('wallet_address', wallet)
        .maybeSingle();
      
      if (queryError) {
        console.error('Error checking admin status:', queryError);
        // Return cached value if available, otherwise false
        return cached?.isAdmin || false;
      }
      
      isAdmin = Boolean(userData?.is_admin);
    }
    
    // Cache the result
    adminCache.set(wallet, { isAdmin, timestamp: Date.now() });
    
    return isAdmin;
  } catch (error) {
    console.error('Failed to check admin status for wallet:', wallet, error);
    // Return cached value if available
    const cached = adminCache.get(wallet);
    return cached?.isAdmin || false;
  }
}

// React hook for checking admin status
export function useAdminStatus(walletAddress: string | null | undefined) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!walletAddress) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const adminStatus = await checkAdminStatusDirect(walletAddress);
        if (!cancelled) {
          setIsAdmin(adminStatus);
        }
      } catch (e) {
        console.error('Admin check failed once:', e);
        if (!cancelled) {
          setError('Failed to check admin status');
          // No tight loop, let user proceed with non-admin UI
          setIsAdmin(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    run(); // one-shot on mount / wallet change

    return () => { cancelled = true; };
  }, [walletAddress]);

  return { isAdmin, isLoading, error };
}

export async function getUserByWallet(wallet: string) {
  try {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase.rpc('get_user_by_wallet', { wallet });
    
    if (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
    
    return data?.[0] || null;
  } catch (error) {
    console.error('Failed to fetch user for wallet:', wallet, error);
    return null;
  }
}

export async function updateUserAdminStatus(
  targetWallet: string, 
  newAdminStatus: boolean, 
  adminWallet: string
): Promise<boolean> {
  try {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase.rpc('update_user_admin_status', {
      target_wallet: targetWallet,
      new_admin_status: newAdminStatus,
      admin_wallet: adminWallet
    });
    
    if (error) {
      console.error('Error updating admin status:', error);
      throw error;
    }
    
    // Clear cache for the target user
    adminCache.delete(targetWallet);
    
    return Boolean(data);
  } catch (error) {
    console.error('Failed to update admin status:', error);
    return false;
  }
}

export function clearAdminCache(wallet?: string) {
  if (wallet) {
    adminCache.delete(wallet);
  } else {
    adminCache.clear();
  }
}

export function isAdminCacheValid(wallet: string): boolean {
  const cached = adminCache.get(wallet);
  return cached ? Date.now() - cached.timestamp < CACHE_DURATION : false;
}

// Utility function to check if current user is admin
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const supabase = getSupabaseBrowser();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;
    
    // Try to get wallet from user metadata or email
    const wallet = user.user_metadata?.wallet_address || user.email;
    if (!wallet) return false;
    
    return await checkAdminStatusDirect(wallet);
  } catch (error) {
    console.error('Error checking current user admin status:', error);
    return false;
  }
}
