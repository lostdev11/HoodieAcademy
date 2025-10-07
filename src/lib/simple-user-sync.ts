'use client';

import { supabase } from './supabase';

export interface SimpleUserProfile {
  wallet_address: string;
  display_name?: string;
  squad?: string;
  last_active?: string;
  created_at?: string;
  updated_at?: string;
}

export class SimpleUserSync {
  private static instance: SimpleUserSync;

  static getInstance(): SimpleUserSync {
    if (!SimpleUserSync.instance) {
      SimpleUserSync.instance = new SimpleUserSync();
    }
    return SimpleUserSync.instance;
  }

  /**
   * Sync user data when wallet connects - simplified version
   */
  async syncUserOnWalletConnect(walletAddress: string, additionalData?: Partial<SimpleUserProfile>) {
    try {
      console.log('🔄 Syncing user data for wallet:', walletAddress);

      // Get or create user profile
      const userProfile = await this.ensureUserProfile(walletAddress, additionalData);
      
      // Track connection activity (if table exists)
      await this.trackUserActivity(walletAddress, 'wallet_connected', {
        wallet_address: walletAddress,
        connected_at: new Date().toISOString(),
        profile_exists: !!userProfile
      });

      console.log('✅ User data synced successfully');
      return userProfile;
    } catch (error) {
      console.error('❌ Failed to sync user data:', error);
      throw error;
    }
  }

  /**
   * Ensure user profile exists, create if not - simplified version with RLS workaround
   */
  async ensureUserProfile(walletAddress: string, additionalData?: Partial<SimpleUserProfile>): Promise<SimpleUserProfile> {
    try {
      // First try to get existing user
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.warn('Error fetching existing user:', fetchError);
      }

      // If user exists, return it
      if (existingUser) {
        console.log('✅ User already exists:', existingUser);
        return existingUser;
      }

      // Try to create user via API endpoint (bypasses RLS)
      console.log('📝 Creating user via API endpoint...');
      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            wallet_address: walletAddress,
            display_name: additionalData?.display_name || `User ${walletAddress.slice(0, 6)}...`,
            squad: additionalData?.squad || null
          })
        });

        if (response.ok) {
          const newUser = await response.json();
          console.log('✅ User created via API:', newUser);
          return newUser;
        } else {
          const errorText = await response.text();
          console.warn('API user creation failed:', response.status, errorText);
        }
      } catch (apiError) {
        console.warn('API user creation failed:', apiError);
      }

      // Fallback: try direct database access (may fail due to RLS)
      console.log('📝 Fallback: trying direct database access...');
      const userData: any = {
        wallet_address: walletAddress,
        display_name: additionalData?.display_name || `User ${walletAddress.slice(0, 6)}...`,
        squad: additionalData?.squad || null,
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const { data: user, error: upsertError } = await supabase
        .from('users')
        .upsert(userData, { onConflict: 'wallet_address' })
        .select()
        .single();

      if (upsertError) {
        console.error('Direct database access also failed:', upsertError);
        throw new Error(`User creation failed: ${upsertError.message}`);
      }

      console.log('✅ User profile ensured via direct access:', user);
      return user;
    } catch (error) {
      console.error('Failed to ensure user profile:', error);
      throw error;
    }
  }

  /**
   * Track user activity - simplified version that handles missing tables
   */
  async trackUserActivity(walletAddress: string, activityType: string, metadata: any = {}) {
    try {
      // Check if user_activity table exists by trying to insert
      const { error: activityError } = await supabase
        .from('user_activity')
        .insert({
          wallet_address: walletAddress,
          activity_type: activityType,
          metadata: metadata,
          created_at: new Date().toISOString()
        });

      if (activityError) {
        console.warn('Activity tracking failed (table may not exist):', activityError);
        // Don't throw error, just log it
      } else {
        console.log('✅ Activity tracked successfully');
      }
    } catch (error) {
      console.warn('Activity tracking failed:', error);
      // Don't throw error, just log it
    }
  }

  /**
   * Get all users for admin dashboard
   */
  async getAllUsers() {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('last_active', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }

      return users || [];
    } catch (error) {
      console.error('Failed to get users:', error);
      return [];
    }
  }

  /**
   * Get user stats for admin dashboard
   */
  async getUserStats() {
    try {
      const users = await this.getAllUsers();
      
      const stats = {
        totalUsers: users.length,
        totalXP: 0, // Will be 0 until user_xp table is created
        avgLevel: 0, // Will be 0 until user_xp table is created
        totalSubmissions: 0, // Will be 0 until activity tracking is set up
        pending: 0,
        totalConnections: users.length, // Use user count as proxy
        verifiedNFTs: users.filter(u => u.display_name && u.display_name !== `User ${u.wallet_address.slice(0, 6)}...`).length,
        activeUsers: users.filter(u => {
          if (!u.last_active) return false;
          const lastActive = new Date(u.last_active);
          const now = new Date();
          const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
          return diffHours < 24;
        }).length
      };

      return stats;
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return {
        totalUsers: 0,
        totalXP: 0,
        avgLevel: 0,
        totalSubmissions: 0,
        pending: 0,
        totalConnections: 0,
        verifiedNFTs: 0,
        activeUsers: 0
      };
    }
  }
}

export const simpleUserSync = SimpleUserSync.getInstance();
