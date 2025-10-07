'use client';

import { supabase } from './supabase';
import { walletTracker } from './wallet-connection-tracker';

export interface UserProfile {
  wallet_address: string;
  display_name?: string;
  squad?: string;
  profile_completed: boolean;
  squad_test_completed: boolean;
  placement_test_completed: boolean;
  is_admin: boolean;
  last_active?: string;
  last_seen?: string;
  created_at?: string;
  updated_at?: string;
  bio?: string;
  profile_picture?: string;
  username?: string;
}

export interface UserXP {
  wallet_address: string;
  total_xp: number;
  bounty_xp: number;
  course_xp: number;
  streak_xp: number;
  level: number;
  updated_at?: string;
}

export interface UserActivity {
  wallet_address: string;
  activity_type: string;
  metadata: any;
  created_at: string;
}

export interface UserStats {
  totalSubmissions: number;
  totalCourseCompletions: number;
  totalBountyCompletions: number;
  totalXP: number;
  currentLevel: number;
  lastActive: string | null;
  profileCompletion: number;
  squadStatus: string;
  adminStatus: boolean;
}

export class UserDataSync {
  private static instance: UserDataSync;

  static getInstance(): UserDataSync {
    if (!UserDataSync.instance) {
      UserDataSync.instance = new UserDataSync();
    }
    return UserDataSync.instance;
  }

  /**
   * Sync user data when wallet connects
   */
  async syncUserOnWalletConnect(walletAddress: string, additionalData?: Partial<UserProfile>) {
    try {
      console.log('🔄 Syncing user data for wallet:', walletAddress);

      // Get or create user profile
      const userProfile = await this.ensureUserProfile(walletAddress, additionalData);
      
      // Initialize XP record
      await this.ensureUserXP(walletAddress);
      
      // Track connection activity
      await this.trackUserActivity(walletAddress, 'wallet_connected', {
        wallet_address: walletAddress,
        connected_at: new Date().toISOString(),
        profile_exists: !!userProfile
      });

      // Update last seen
      await this.updateLastSeen(walletAddress);

      console.log('✅ User data synced successfully');
      return userProfile;
    } catch (error) {
      console.error('❌ Failed to sync user data:', error);
      throw error;
    }
  }

  /**
   * Ensure user profile exists, create if not
   */
  async ensureUserProfile(walletAddress: string, additionalData?: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      const userData: UserProfile = {
        wallet_address: walletAddress,
        display_name: existingUser?.display_name || additionalData?.display_name || `User ${walletAddress.slice(0, 6)}...`,
        squad: existingUser?.squad || additionalData?.squad || null,
        profile_completed: existingUser?.profile_completed || false,
        squad_test_completed: existingUser?.squad_test_completed || false,
        placement_test_completed: existingUser?.placement_test_completed || false,
        is_admin: existingUser?.is_admin || false,
        last_active: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(existingUser ? {} : {
          created_at: new Date().toISOString(),
          bio: additionalData?.bio || null,
          profile_picture: additionalData?.profile_picture || null,
          username: additionalData?.username || null
        }),
        ...additionalData
      };

      const { data: user, error: upsertError } = await supabase
        .from('users')
        .upsert(userData, { onConflict: 'wallet_address' })
        .select()
        .single();

      if (upsertError) {
        throw upsertError;
      }

      return user;
    } catch (error) {
      console.error('Failed to ensure user profile:', error);
      throw error;
    }
  }

  /**
   * Ensure user XP record exists
   */
  async ensureUserXP(walletAddress: string): Promise<UserXP> {
    try {
      const { data: existingXP, error: fetchError } = await supabase
        .from('user_xp')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (!existingXP) {
        const xpData: UserXP = {
          wallet_address: walletAddress,
          total_xp: 0,
          bounty_xp: 0,
          course_xp: 0,
          streak_xp: 0,
          level: 1,
          updated_at: new Date().toISOString()
        };

        const { data: xp, error: insertError } = await supabase
          .from('user_xp')
          .insert(xpData)
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        return xp;
      }

      return existingXP;
    } catch (error) {
      console.error('Failed to ensure user XP:', error);
      throw error;
    }
  }

  /**
   * Track user activity
   */
  async trackUserActivity(walletAddress: string, activityType: string, metadata: any = {}) {
    try {
      const activityData: UserActivity = {
        wallet_address: walletAddress,
        activity_type: activityType,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          page_url: typeof window !== 'undefined' ? window.location.href : null,
          user_agent: typeof window !== 'undefined' ? navigator.userAgent : null
        },
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_activity')
        .insert(activityData);

      if (error) {
        console.warn('Failed to track user activity:', error);
      } else {
        console.log(`📊 Activity tracked: ${activityType} for ${walletAddress}`);
      }
    } catch (error) {
      console.error('Failed to track user activity:', error);
    }
  }

  /**
   * Update user's last seen timestamp
   */
  async updateLastSeen(walletAddress: string) {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          last_seen: new Date().toISOString(),
          last_active: new Date().toISOString()
        })
        .eq('wallet_address', walletAddress);

      if (error) {
        console.warn('Failed to update last seen:', error);
      }
    } catch (error) {
      console.error('Failed to update last seen:', error);
    }
  }

  /**
   * Get comprehensive user data for admin dashboard
   */
  async getUserDataForAdmin(walletAddress: string) {
    try {
      // Get user profile
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (userError) {
        throw userError;
      }

      // Get user XP
      const { data: userXP, error: xpError } = await supabase
        .from('user_xp')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      // Get recent activities
      const { data: activities, error: activityError } = await supabase
        .from('user_activity')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('created_at', { ascending: false })
        .limit(20);

      // Get wallet connections
      const { data: connections, error: connectionError } = await supabase
        .from('wallet_connections')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('connection_timestamp', { ascending: false })
        .limit(10);

      // Get bounty submissions
      const { data: bountySubmissions, error: bountyError } = await supabase
        .from('bounty_submissions')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('created_at', { ascending: false });

      // Get course completions
      const { data: courseCompletions, error: courseError } = await supabase
        .from('course_completions')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('completed_at', { ascending: false });

      // Calculate stats
      const stats: UserStats = {
        totalSubmissions: bountySubmissions?.length || 0,
        totalCourseCompletions: courseCompletions?.length || 0,
        totalBountyCompletions: bountySubmissions?.filter(sub => sub.status === 'approved').length || 0,
        totalXP: userXP?.total_xp || 0,
        currentLevel: userXP?.level || 1,
        lastActive: user?.last_active || user?.created_at,
        profileCompletion: this.calculateProfileCompletion(user),
        squadStatus: this.getSquadStatus(user),
        adminStatus: user?.is_admin || false
      };

      return {
        user,
        userXP,
        activities: activities || [],
        connections: connections || [],
        bountySubmissions: bountySubmissions || [],
        courseCompletions: courseCompletions || [],
        stats
      };
    } catch (error) {
      console.error('Failed to get user data for admin:', error);
      throw error;
    }
  }

  /**
   * Calculate profile completion percentage
   */
  private calculateProfileCompletion(user: UserProfile | null): number {
    if (!user) return 0;

    let completed = 0;
    const total = 4;

    if (user.display_name && user.display_name !== `User ${user.wallet_address.slice(0, 6)}...`) completed++;
    if (user.squad) completed++;
    if (user.bio) completed++;
    if (user.profile_picture) completed++;

    return Math.round((completed / total) * 100);
  }

  /**
   * Get squad status description
   */
  private getSquadStatus(user: UserProfile | null): string {
    if (!user) return 'Not placed';
    if (user.placement_test_completed && user.squad) return `Placed in ${user.squad}`;
    if (user.squad_test_completed) return 'Test completed, awaiting placement';
    return 'Not tested';
  }

  /**
   * Update user profile
   */
  async updateUserProfile(walletAddress: string, updates: Partial<UserProfile>) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', walletAddress)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Track profile update activity
      await this.trackUserActivity(walletAddress, 'profile_updated', {
        updates,
        updated_at: new Date().toISOString()
      });

      return data;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  }

  /**
   * Record course completion
   */
  async recordCourseCompletion(walletAddress: string, courseId: string, courseTitle: string, xpAwarded: number = 0) {
    try {
      // Record completion
      const { error: completionError } = await supabase
        .from('course_completions')
        .insert({
          wallet_address: walletAddress,
          course_id: courseId,
          course_title: courseTitle,
          xp_awarded: xpAwarded,
          completed_at: new Date().toISOString()
        });

      if (completionError) {
        throw completionError;
      }

      // Update XP
      if (xpAwarded > 0) {
        await this.addXP(walletAddress, xpAwarded, 'course');
      }

      // Track activity
      await this.trackUserActivity(walletAddress, 'course_completed', {
        course_id: courseId,
        course_title: courseTitle,
        xp_awarded: xpAwarded,
        completed_at: new Date().toISOString()
      });

      console.log(`✅ Course completion recorded: ${courseTitle} for ${walletAddress}`);
    } catch (error) {
      console.error('Failed to record course completion:', error);
      throw error;
    }
  }

  /**
   * Record bounty submission
   */
  async recordBountySubmission(walletAddress: string, bountyId: string, submissionData: any) {
    try {
      const { data, error } = await supabase
        .from('bounty_submissions')
        .insert({
          wallet_address: walletAddress,
          bounty_id: bountyId,
          ...submissionData,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Track activity
      await this.trackUserActivity(walletAddress, 'bounty_submitted', {
        bounty_id: bountyId,
        submission_id: data.id,
        submitted_at: new Date().toISOString()
      });

      return data;
    } catch (error) {
      console.error('Failed to record bounty submission:', error);
      throw error;
    }
  }

  /**
   * Add XP to user
   */
  async addXP(walletAddress: string, amount: number, source: 'bounty' | 'course' | 'streak' | 'general' = 'general') {
    try {
      // Get current XP
      const { data: currentXP, error: fetchError } = await supabase
        .from('user_xp')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const newTotalXP = (currentXP?.total_xp || 0) + amount;
      const newLevel = Math.floor(newTotalXP / 1000) + 1; // 1000 XP per level

      const updateData: any = {
        total_xp: newTotalXP,
        level: newLevel,
        updated_at: new Date().toISOString()
      };

      // Update specific XP type
      if (source === 'bounty') {
        updateData.bounty_xp = (currentXP?.bounty_xp || 0) + amount;
      } else if (source === 'course') {
        updateData.course_xp = (currentXP?.course_xp || 0) + amount;
      } else if (source === 'streak') {
        updateData.streak_xp = (currentXP?.streak_xp || 0) + amount;
      }

      const { error: updateError } = await supabase
        .from('user_xp')
        .update(updateData)
        .eq('wallet_address', walletAddress);

      if (updateError) {
        throw updateError;
      }

      // Track XP gain activity
      await this.trackUserActivity(walletAddress, 'xp_gained', {
        amount,
        source,
        new_total: newTotalXP,
        new_level: newLevel,
        gained_at: new Date().toISOString()
      });

      console.log(`✅ XP added: +${amount} ${source} XP for ${walletAddress} (Total: ${newTotalXP}, Level: ${newLevel})`);
    } catch (error) {
      console.error('Failed to add XP:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userDataSync = UserDataSync.getInstance();
