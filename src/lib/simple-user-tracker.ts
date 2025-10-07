'use client';

import { supabase } from './supabase';

export interface SimpleUser {
  id?: string;
  wallet_address: string;
  display_name?: string;
  squad?: string;
  created_at: string;
  last_active?: string;
  is_admin?: boolean;
  profile_completed?: boolean;
  squad_test_completed?: boolean;
  placement_test_completed?: boolean;
  username?: string;
  bio?: string;
  profile_picture?: string;
  total_xp?: number;
  level?: number;
}

export class SimpleUserTracker {
  private static instance: SimpleUserTracker;

  static getInstance(): SimpleUserTracker {
    if (!SimpleUserTracker.instance) {
      SimpleUserTracker.instance = new SimpleUserTracker();
    }
    return SimpleUserTracker.instance;
  }

  /**
   * When user connects wallet, add them to the database user list
   */
  async trackWalletConnection(walletAddress: string, additionalData?: Partial<SimpleUser>) {
    try {
      console.log('🔄 [USER TRACKER] Tracking wallet connection:', walletAddress);
      
      const userData = {
        wallet_address: walletAddress,
        display_name: additionalData?.display_name || `User ${walletAddress.slice(0, 6)}...`,
        squad: additionalData?.squad || null,
        last_active: new Date().toISOString(),
        is_admin: this.isAdminWallet(walletAddress),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Try to upsert user - if exists, update last_active and admin status, if not, create new
      const { data: user, error } = await supabase
        .from('users')
        .upsert(userData, { 
          onConflict: 'wallet_address',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [USER TRACKER] Failed to track user:', error);
        return null;
      }

      // Also update admin status for existing users
      if (user && this.isAdminWallet(walletAddress)) {
        const { error: adminError } = await supabase
          .from('users')
          .update({ is_admin: true })
          .eq('wallet_address', walletAddress);
        
        if (adminError) {
          console.warn('⚠️ [USER TRACKER] Failed to update admin status:', adminError);
        } else {
          console.log('✅ [USER TRACKER] Admin status updated for:', walletAddress);
        }
      }

      console.log('✅ [USER TRACKER] User tracked successfully:', user);
      return user;
    } catch (error) {
      console.error('❌ [USER TRACKER] Error tracking wallet connection:', error);
      return null;
    }
  }

  /**
   * Update user's last active timestamp
   */
  async updateLastActive(walletAddress: string) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          last_active: new Date().toISOString()
        })
        .eq('wallet_address', walletAddress);

      if (error) {
        console.warn('⚠️ [USER TRACKER] Failed to update last active:', error);
      } else {
        console.log('✅ [USER TRACKER] Last active updated for:', walletAddress);
      }
    } catch (error) {
      console.warn('⚠️ [USER TRACKER] Error updating last active:', error);
    }
  }

  /**
   * Get all connected users for admin dashboard
   */
  async getAllUsers(): Promise<SimpleUser[]> {
    try {
      console.log('👥 [USER TRACKER] Fetching all users...');
      
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [USER TRACKER] Failed to fetch users:', error);
        return [];
      }

      console.log('✅ [USER TRACKER] Fetched users:', users?.length || 0);
      return users || [];
    } catch (error) {
      console.error('❌ [USER TRACKER] Error fetching users:', error);
      return [];
    }
  }

  /**
   * Check if wallet is admin (hardcoded for now)
   */
  private isAdminWallet(walletAddress: string): boolean {
    const adminWallets = [
      'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
      'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
      '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
      '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
    ];
    
    return adminWallets.includes(walletAddress);
  }

  /**
   * Get user stats for admin dashboard
   */
  async getUserStats() {
    try {
      const users = await this.getAllUsers();
      const now = new Date();
      
      const stats = {
        totalUsers: users.length,
        activeUsers: users.filter(user => {
          if (!user.last_active) return false;
          const lastActive = new Date(user.last_active);
          const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
          return diffHours < 24; // Active in last 24 hours
        }).length,
        adminUsers: users.filter(user => user.is_admin).length,
        newUsersToday: users.filter(user => {
          if (!user.created_at) return false;
          const connected = new Date(user.created_at);
          const today = new Date();
          return connected.toDateString() === today.toDateString();
        }).length
      };

      console.log('📊 [USER TRACKER] User stats:', stats);
      return stats;
    } catch (error) {
      console.error('❌ [USER TRACKER] Error calculating stats:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        adminUsers: 0,
        newUsersToday: 0
      };
    }
  }
}

export const simpleUserTracker = SimpleUserTracker.getInstance();
