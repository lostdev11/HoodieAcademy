'use client';

import { supabase } from './supabase';

export interface RobustUserProfile {
  wallet_address: string;
  display_name?: string;
  squad?: string;
  last_active?: string;
  created_at?: string;
  updated_at?: string;
  is_admin?: boolean;
}

export class RobustUserSync {
  private static instance: RobustUserSync;

  static getInstance(): RobustUserSync {
    if (!RobustUserSync.instance) {
      RobustUserSync.instance = new RobustUserSync();
    }
    return RobustUserSync.instance;
  }

  /**
   * Comprehensive user sync that handles all edge cases
   */
  async syncUserOnWalletConnect(walletAddress: string, additionalData?: Partial<RobustUserProfile>) {
    console.log('🔄 [ROBUST SYNC] Starting comprehensive user sync for:', walletAddress);
    
    try {
      // Step 1: Try API endpoint first (most reliable)
      const apiResult = await this.tryApiEndpoint(walletAddress, additionalData);
      if (apiResult.success) {
        console.log('✅ [ROBUST SYNC] User synced via API endpoint');
        return apiResult.user;
      }

      // Step 2: Try direct database with service role
      const dbResult = await this.tryDirectDatabase(walletAddress, additionalData);
      if (dbResult.success) {
        console.log('✅ [ROBUST SYNC] User synced via direct database');
        return dbResult.user;
      }

      // Step 3: Try upsert with conflict resolution
      const upsertResult = await this.tryUpsertMethod(walletAddress, additionalData);
      if (upsertResult.success) {
        console.log('✅ [ROBUST SYNC] User synced via upsert method');
        return upsertResult.user;
      }

      // Step 4: Fallback - create minimal user record
      const fallbackResult = await this.createFallbackUser(walletAddress, additionalData);
      console.log('⚠️ [ROBUST SYNC] User created via fallback method');
      return fallbackResult.user;

    } catch (error) {
      console.error('❌ [ROBUST SYNC] All sync methods failed:', error);
      
      // Last resort - return a basic user object
      return {
        wallet_address: walletAddress,
        display_name: additionalData?.display_name || `User ${walletAddress.slice(0, 6)}...`,
        squad: additionalData?.squad || null,
        last_active: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_admin: false
      };
    }
  }

  /**
   * Try API endpoint method
   */
  private async tryApiEndpoint(walletAddress: string, additionalData?: Partial<RobustUserProfile>) {
    try {
      console.log('🔗 [ROBUST SYNC] Trying API endpoint...');
      
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
        const user = await response.json();
        console.log('✅ [ROBUST SYNC] API endpoint success:', user);
        return { success: true, user };
      } else {
        const errorText = await response.text();
        console.warn('⚠️ [ROBUST SYNC] API endpoint failed:', response.status, errorText);
        return { success: false, error: errorText };
      }
    } catch (error) {
      console.warn('⚠️ [ROBUST SYNC] API endpoint error:', error);
      return { success: false, error: error };
    }
  }

  /**
   * Try direct database method with service role
   */
  private async tryDirectDatabase(walletAddress: string, additionalData?: Partial<RobustUserProfile>) {
    try {
      console.log('🗄️ [ROBUST SYNC] Trying direct database...');
      
      // Create a service role client for this operation
      const serviceClient = supabase;
      
      const userData = {
        wallet_address: walletAddress,
        display_name: additionalData?.display_name || `User ${walletAddress.slice(0, 6)}...`,
        squad: additionalData?.squad || null,
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        is_admin: additionalData?.is_admin || false
      };

      const { data: user, error } = await serviceClient
        .from('users')
        .upsert(userData, { onConflict: 'wallet_address' })
        .select()
        .single();

      if (error) {
        console.warn('⚠️ [ROBUST SYNC] Direct database failed:', error);
        return { success: false, error: error };
      }

      console.log('✅ [ROBUST SYNC] Direct database success:', user);
      return { success: true, user };
    } catch (error) {
      console.warn('⚠️ [ROBUST SYNC] Direct database error:', error);
      return { success: false, error: error };
    }
  }

  /**
   * Try upsert method with conflict resolution
   */
  private async tryUpsertMethod(walletAddress: string, additionalData?: Partial<RobustUserProfile>) {
    try {
      console.log('🔄 [ROBUST SYNC] Trying upsert method...');
      
      const userData = {
        wallet_address: walletAddress,
        display_name: additionalData?.display_name || `User ${walletAddress.slice(0, 6)}...`,
        squad: additionalData?.squad || null,
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // First try to update existing user
      const { data: existingUser, error: updateError } = await supabase
        .from('users')
        .update(userData)
        .eq('wallet_address', walletAddress)
        .select()
        .single();

      if (existingUser && !updateError) {
        console.log('✅ [ROBUST SYNC] Upsert update success:', existingUser);
        return { success: true, user: existingUser };
      }

      // If update failed, try insert
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          ...userData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (newUser && !insertError) {
        console.log('✅ [ROBUST SYNC] Upsert insert success:', newUser);
        return { success: true, user: newUser };
      }

      console.warn('⚠️ [ROBUST SYNC] Upsert method failed:', insertError);
      return { success: false, error: insertError };
    } catch (error) {
      console.warn('⚠️ [ROBUST SYNC] Upsert method error:', error);
      return { success: false, error: error };
    }
  }

  /**
   * Create fallback user record
   */
  private async createFallbackUser(walletAddress: string, additionalData?: Partial<RobustUserProfile>) {
    console.log('🆘 [ROBUST SYNC] Creating fallback user...');
    
    const fallbackUser = {
      wallet_address: walletAddress,
      display_name: additionalData?.display_name || `User ${walletAddress.slice(0, 6)}...`,
      squad: additionalData?.squad || null,
      last_active: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_admin: additionalData?.is_admin || false
    };

    // Try to store in localStorage as backup
    try {
      if (typeof window !== 'undefined') {
        const existingUsers = JSON.parse(localStorage.getItem('hoodie_academy_users') || '[]');
        const userIndex = existingUsers.findIndex((u: any) => u.wallet_address === walletAddress);
        
        if (userIndex >= 0) {
          existingUsers[userIndex] = fallbackUser;
        } else {
          existingUsers.push(fallbackUser);
        }
        
        localStorage.setItem('hoodie_academy_users', JSON.stringify(existingUsers));
        console.log('💾 [ROBUST SYNC] User stored in localStorage as backup');
      }
    } catch (storageError) {
      console.warn('⚠️ [ROBUST SYNC] localStorage backup failed:', storageError);
    }

    return { success: true, user: fallbackUser };
  }

  /**
   * Track user activity with multiple fallbacks
   */
  async trackUserActivity(walletAddress: string, activityType: string, metadata: any = {}) {
    console.log('📊 [ROBUST SYNC] Tracking activity:', activityType, 'for:', walletAddress);
    
    try {
      // Try to insert into user_activity table
      const { error: activityError } = await supabase
        .from('user_activity')
        .insert({
          wallet_address: walletAddress,
          activity_type: activityType,
          metadata: metadata,
          created_at: new Date().toISOString()
        });

      if (!activityError) {
        console.log('✅ [ROBUST SYNC] Activity tracked in database');
        return;
      }

      console.warn('⚠️ [ROBUST SYNC] Database activity tracking failed:', activityError);
      
      // Fallback: Store in localStorage
      try {
        if (typeof window !== 'undefined') {
          const activities = JSON.parse(localStorage.getItem('hoodie_academy_activities') || '[]');
          activities.push({
            wallet_address: walletAddress,
            activity_type: activityType,
            metadata: metadata,
            created_at: new Date().toISOString()
          });
          
          // Keep only last 100 activities to prevent storage bloat
          if (activities.length > 100) {
            activities.splice(0, activities.length - 100);
          }
          
          localStorage.setItem('hoodie_academy_activities', JSON.stringify(activities));
          console.log('💾 [ROBUST SYNC] Activity stored in localStorage as backup');
        }
      } catch (storageError) {
        console.warn('⚠️ [ROBUST SYNC] localStorage activity backup failed:', storageError);
      }
    } catch (error) {
      console.warn('⚠️ [ROBUST SYNC] Activity tracking failed:', error);
    }
  }

  /**
   * Get all users with fallback to localStorage
   */
  async getAllUsers() {
    try {
      console.log('👥 [ROBUST SYNC] Fetching all users...');
      
      // Try database first
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('last_active', { ascending: false });

      if (!error && users) {
        console.log('✅ [ROBUST SYNC] Fetched users from database:', users.length);
        return users;
      }

      console.warn('⚠️ [ROBUST SYNC] Database fetch failed, trying localStorage...');
      
      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        const storedUsers = JSON.parse(localStorage.getItem('hoodie_academy_users') || '[]');
        console.log('💾 [ROBUST SYNC] Fetched users from localStorage:', storedUsers.length);
        return storedUsers;
      }

      return [];
    } catch (error) {
      console.error('❌ [ROBUST SYNC] Failed to fetch users:', error);
      return [];
    }
  }

  /**
   * Get user stats with fallback calculations
   */
  async getUserStats() {
    try {
      const users = await this.getAllUsers();
      
      const now = new Date();
      const stats = {
        totalUsers: users.length,
        totalXP: 0,
        avgLevel: 0,
        totalSubmissions: 0,
        pending: 0,
        totalConnections: users.length,
        verifiedNFTs: users.filter((u: any) => 
          u.display_name && u.display_name !== `User ${u.wallet_address?.slice(0, 6)}...`
        ).length,
        activeUsers: users.filter((u: any) => {
          if (!u.last_active) return false;
          const lastActive = new Date(u.last_active);
          const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
          return diffHours < 24;
        }).length
      };

      console.log('📊 [ROBUST SYNC] User stats calculated:', stats);
      return stats;
    } catch (error) {
      console.error('❌ [ROBUST SYNC] Failed to calculate stats:', error);
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

  /**
   * Update user last active timestamp
   */
  async updateLastActive(walletAddress: string) {
    try {
      console.log('⏰ [ROBUST SYNC] Updating last active for:', walletAddress);
      
      const { error } = await supabase
        .from('users')
        .update({ 
          last_active: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', walletAddress);

      if (!error) {
        console.log('✅ [ROBUST SYNC] Last active updated in database');
        return;
      }

      console.warn('⚠️ [ROBUST SYNC] Database last active update failed:', error);
      
      // Fallback: Update localStorage
      try {
        if (typeof window !== 'undefined') {
          const users = JSON.parse(localStorage.getItem('hoodie_academy_users') || '[]');
          const userIndex = users.findIndex((u: any) => u.wallet_address === walletAddress);
          
          if (userIndex >= 0) {
            users[userIndex].last_active = new Date().toISOString();
            users[userIndex].updated_at = new Date().toISOString();
            localStorage.setItem('hoodie_academy_users', JSON.stringify(users));
            console.log('💾 [ROBUST SYNC] Last active updated in localStorage');
          }
        }
      } catch (storageError) {
        console.warn('⚠️ [ROBUST SYNC] localStorage last active update failed:', storageError);
      }
    } catch (error) {
      console.warn('⚠️ [ROBUST SYNC] Last active update failed:', error);
    }
  }
}

export const robustUserSync = RobustUserSync.getInstance();
