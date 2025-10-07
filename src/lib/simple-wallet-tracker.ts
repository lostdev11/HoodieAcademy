'use client';

import { supabase } from './supabase';

/**
 * Simple Wallet Tracker - Non-intrusive wallet-to-user mapping
 * This enhances the existing system without disrupting current wallet connection flow
 */
export class SimpleWalletTracker {
  private static instance: SimpleWalletTracker;

  static getInstance(): SimpleWalletTracker {
    if (!SimpleWalletTracker.instance) {
      SimpleWalletTracker.instance = new SimpleWalletTracker();
    }
    return SimpleWalletTracker.instance;
  }

  /**
   * Track wallet connection - minimal, non-blocking
   * This runs in the background and won't affect wallet connection
   */
  async trackWalletConnection(walletAddress: string, metadata?: any): Promise<void> {
    try {
      console.log('📊 [SIMPLE TRACKER] Tracking wallet connection:', walletAddress);
      
      // Ensure user exists in the existing users table
      await this.ensureUserExists(walletAddress);
      
      // Log the connection event
      await this.logConnectionEvent(walletAddress, metadata);
      
      console.log('✅ [SIMPLE TRACKER] Wallet connection tracked successfully');
    } catch (error) {
      // Don't let tracking errors affect wallet connection
      console.warn('⚠️ [SIMPLE TRACKER] Tracking failed (non-blocking):', error);
    }
  }

  /**
   * Ensure user exists in the existing users table
   */
  private async ensureUserExists(walletAddress: string): Promise<void> {
    try {
      // Check if user already exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('wallet_address', walletAddress)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // If user exists, just update last_active
      if (existingUser) {
        await supabase
          .from('users')
          .update({ 
            last_active: new Date().toISOString(),
            last_seen: new Date().toISOString()
          })
          .eq('wallet_address', walletAddress);
        return;
      }

      // Create new user with minimal data
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          wallet_address: walletAddress,
          display_name: `User ${walletAddress.slice(0, 6)}...`,
          last_active: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.warn('Failed to create user:', insertError);
      }
    } catch (error) {
      console.warn('Error ensuring user exists:', error);
    }
  }

  /**
   * Log connection event for analytics
   */
  private async logConnectionEvent(walletAddress: string, metadata?: any): Promise<void> {
    try {
      // Try to log to the existing event_log table if it exists
      const { error } = await supabase
        .from('event_log')
        .insert({
          wallet_address: walletAddress,
          kind: 'wallet_connect',
          payload: {
            timestamp: new Date().toISOString(),
            metadata: metadata || {},
            source: 'simple_wallet_tracker'
          }
        });

      if (error) {
        console.warn('Failed to log connection event:', error);
      }
    } catch (error) {
      console.warn('Error logging connection event:', error);
    }
  }

  /**
   * Get user data for admin dashboard
   */
  async getUserData(walletAddress: string): Promise<any> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  /**
   * Get all users for admin dashboard
   */
  async getAllUsers(): Promise<any[]> {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('last_active', { ascending: false });

      if (error) throw error;
      return users || [];
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }

  /**
   * Update user data (for future XP, submissions, etc.)
   */
  async updateUser(walletAddress: string, updates: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', walletAddress);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Add XP to user (for future leaderboard)
   */
  async addXP(walletAddress: string, xpAmount: number, source: string = 'general'): Promise<void> {
    try {
      // Get current user
      const user = await this.getUserData(walletAddress);
      if (!user) {
        throw new Error('User not found');
      }

      const newTotalXP = (user.total_xp || 0) + xpAmount;
      const newLevel = Math.floor(newTotalXP / 1000) + 1; // Simple level calculation

      await this.updateUser(walletAddress, {
        total_xp: newTotalXP,
        level: newLevel
      });

      // Log XP event
      await supabase
        .from('event_log')
        .insert({
          wallet_address: walletAddress,
          kind: 'custom',
          payload: {
            event: 'xp_added',
            amount: xpAmount,
            source: source,
            new_total: newTotalXP,
            new_level: newLevel
          }
        });

    } catch (error) {
      console.error('Error adding XP:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const simpleWalletTracker = SimpleWalletTracker.getInstance();
