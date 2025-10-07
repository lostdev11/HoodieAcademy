'use client';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Admin utility functions for Hoodie Academy tracking system
 * Handles admin detection via JWT claims or admin wallet list
 */

export interface AdminUser {
  id: string;
  wallet_address?: string;
  primary_wallet?: string;
  is_admin: boolean;
}

/**
 * Check if the current user is an admin
 * Uses JWT role claim or admin wallet list as fallback
 */
export async function isAdminForUser(supabaseClient: any): Promise<boolean> {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return false;

    // Check JWT role claim first
    const role = (user as any).app_metadata?.role;
    if (role === 'admin') return true;

    // Fallback: check admin wallet list
    const { data: userData } = await supabaseClient
      .from('users')
      .select('primary_wallet, wallet_address')
      .eq('id', user.id)
      .single();

    if (!userData) return false;

    const walletAddress = userData.primary_wallet || userData.wallet_address;
    if (!walletAddress) return false;

    // Check if wallet is in admin list
    const { data: adminWallet } = await supabaseClient
      .from('admin_wallets')
      .select('wallet_address')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    return !!adminWallet;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get admin user data with wallet information
 */
export async function getAdminUser(supabase: any): Promise<AdminUser | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const isAdmin = await isAdminForUser(supabase);
    if (!isAdmin) return null;

    const { data: userData } = await supabase
      .from('users')
      .select('id, wallet_address, primary_wallet, is_admin')
      .eq('id', user.id)
      .single();

    if (!userData) return null;

    return {
      id: userData.id,
      wallet_address: userData.wallet_address,
      primary_wallet: userData.primary_wallet,
      is_admin: userData.is_admin || isAdmin
    };
  } catch (error) {
    console.error('Error getting admin user:', error);
    return null;
  }
}

/**
 * Add a wallet to the admin list
 */
export async function addAdminWallet(
  supabase: any,
  walletAddress: string,
  label?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const isAdmin = await isAdminForUser(supabase);
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('admin_wallets')
      .insert({
        wallet_address: walletAddress,
        label: label || 'Admin Wallet'
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Remove a wallet from the admin list
 */
export async function removeAdminWallet(
  supabase: any,
  walletAddress: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const isAdmin = await isAdminForUser(supabase);
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('admin_wallets')
      .delete()
      .eq('wallet_address', walletAddress);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get all admin wallets
 */
export async function getAdminWallets(supabase: any): Promise<Array<{wallet_address: string; label?: string; created_at: string}>> {
  try {
    const isAdmin = await isAdminForUser(supabase);
    if (!isAdmin) {
      return [];
    }

    const { data, error } = await supabase
      .from('admin_wallets')
      .select('wallet_address, label, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin wallets:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching admin wallets:', error);
    return [];
  }
}

/**
 * Check if a specific wallet address is an admin
 */
export async function isWalletAdmin(
  supabase: any,
  walletAddress: string
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('admin_wallets')
      .select('wallet_address')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    return !!data;
  } catch (error) {
    console.error('Error checking wallet admin status:', error);
    return false;
  }
}

/**
 * Get dashboard statistics for admin
 */
export async function getDashboardStats(supabase: any): Promise<{
  totalUsers: number;
  activeUsers: number;
  liveUsers: number;
  newWallets24h: number;
  newWallets7d: number;
  totalBounties: number;
  openBounties: number;
  pendingSubmissions: number;
  totalXP: number;
}> {
  try {
    const isAdmin = await isAdminForUser(supabase);
    if (!isAdmin) {
      throw new Error('Unauthorized');
    }

    // Get all stats in parallel
    const [
      totalUsersResult,
      activeUsersResult,
      liveUsersResult,
      newWallets24hResult,
      newWallets7dResult,
      totalBountiesResult,
      openBountiesResult,
      pendingSubmissionsResult,
      totalXPResult
    ] = await Promise.all([
      // Total users
      supabase.from('users').select('id', { count: 'exact', head: true }),
      
      // Active users (last 7 days)
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('last_active_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Live users (last 5 minutes)
      supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .gte('last_heartbeat_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()),
      
      // New wallets 24h
      supabase
        .from('wallets')
        .select('id', { count: 'exact', head: true })
        .gte('connected_first_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      
      // New wallets 7d
      supabase
        .from('wallets')
        .select('id', { count: 'exact', head: true })
        .gte('connected_first_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Total bounties
      supabase.from('bounties').select('id', { count: 'exact', head: true }),
      
      // Open bounties
      supabase
        .from('bounties')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open'),
      
      // Pending submissions
      supabase
        .from('bounty_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending_review'),
      
      // Total XP (sum of all XP events)
      supabase
        .from('xp_events')
        .select('delta')
        .then(result => {
          if (result.error) return 0;
          return result.data?.reduce((sum, event) => sum + event.delta, 0) || 0;
        })
    ]);

    return {
      totalUsers: totalUsersResult.count || 0,
      activeUsers: activeUsersResult.count || 0,
      liveUsers: liveUsersResult.count || 0,
      newWallets24h: newWallets24hResult.count || 0,
      newWallets7d: newWallets7dResult.count || 0,
      totalBounties: totalBountiesResult.count || 0,
      openBounties: openBountiesResult.count || 0,
      pendingSubmissions: pendingSubmissionsResult.count || 0,
      totalXP: totalXPResult || 0
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

/**
 * Get user tracking data for admin dashboard
 */
export async function getUserTrackingData(
  supabase: any,
  userId: string
): Promise<{
  user: any;
  stats: any;
  recent_events: any[];
  submissions: any[];
  xp_events: any[];
} | null> {
  try {
    const isAdmin = await isAdminForUser(supabase);
    if (!isAdmin) {
      throw new Error('Unauthorized');
    }

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return null;
    }

    // Get user stats in parallel
    const [
      xpBalanceResult,
      submissionsResult,
      xpEventsResult,
      recentEventsResult
    ] = await Promise.all([
      // XP balance
      supabase
        .from('xp_balances')
        .select('total_xp')
        .eq('user_id', userId)
        .single(),
      
      // Submissions
      supabase
        .from('bounty_submissions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      
      // XP events
      supabase
        .from('xp_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      
      // Recent events
      supabase
        .from('event_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
    ]);

    const totalXP = xpBalanceResult.data?.total_xp || 0;
    const submissions = submissionsResult.data || [];
    const xpEvents = xpEventsResult.data || [];
    const recentEvents = recentEventsResult.data || [];

    // Calculate submission stats
    const approvedSubmissions = submissions.filter(s => s.status === 'approved').length;
    const pendingSubmissions = submissions.filter(s => s.status === 'pending_review').length;
    const rejectedSubmissions = submissions.filter(s => s.status === 'rejected').length;

    // Calculate XP by source
    const bountyXP = xpEvents
      .filter(e => e.source === 'bounty_submission')
      .reduce((sum, e) => sum + e.delta, 0);
    
    const courseXP = xpEvents
      .filter(e => e.source === 'course')
      .reduce((sum, e) => sum + e.delta, 0);

    return {
      user,
      stats: {
        total_xp: totalXP,
        bounty_xp: bountyXP,
        course_xp: courseXP,
        total_submissions: submissions.length,
        approved_submissions: approvedSubmissions,
        pending_submissions: pendingSubmissions,
        rejected_submissions: rejectedSubmissions,
        last_active: user.last_active_at
      },
      recent_events: recentEvents,
      submissions,
      xp_events: xpEvents
    };
  } catch (error) {
    console.error('Error fetching user tracking data:', error);
    return null;
  }
}
