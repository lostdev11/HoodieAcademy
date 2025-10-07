'use client';

import { createClient } from '@supabase/supabase-js';
import { DashboardStats, UserTrackingData, DailyActivity, InactiveUser } from '@/types/tracking';

/**
 * Admin dashboard queries and data access layer
 * Provides typed functions for fetching admin dashboard data
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Get comprehensive dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
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
      totalXPResult,
      topCoursesResult,
      inactiveUsersResult
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
        }),
      
      // Top courses by active users (7d)
      supabase
        .from('event_log')
        .select('course_id')
        .in('kind', ['course_start', 'lesson_start', 'lesson_complete'])
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .not('course_id', 'is', null)
        .then(result => {
          if (result.error) return [];
          const courseCounts = result.data?.reduce((acc, event) => {
            if (event.course_id) {
              acc[event.course_id] = (acc[event.course_id] || 0) + 1;
            }
            return acc;
          }, {} as Record<string, number>) || {};
          
          return Object.entries(courseCounts)
            .map(([course_id, active_users]) => ({ course_id, active_users }))
            .sort((a, b) => b.active_users - a.active_users)
            .slice(0, 10);
        }),
      
      // Inactive users (7d)
      supabase
        .from('inactive_users_7d')
        .select('*')
        .order('last_active_at', { ascending: true, nullsFirst: true })
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
      totalXP: totalXPResult || 0,
      topCourses: topCoursesResult || [],
      inactiveUsers: inactiveUsersResult.data || []
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

/**
 * Get user tracking data for admin dashboard
 */
export async function getUserTrackingData(userId: string): Promise<UserTrackingData | null> {
  try {
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
      user: {
        id: user.id,
        wallet_address: user.wallet_address,
        display_name: user.display_name,
        squad: user.squad,
        primary_wallet: user.primary_wallet,
        last_active_at: user.last_active_at,
        created_at: user.created_at,
        is_admin: user.is_admin
      },
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

/**
 * Get daily activity data for charts
 */
export async function getDailyActivity(days: number = 30): Promise<DailyActivity[]> {
  try {
    const { data, error } = await supabase
      .from('activity_daily')
      .select('day, dau')
      .gte('day', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('day', { ascending: true });

    if (error) {
      console.error('Error fetching daily activity:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching daily activity:', error);
    return [];
  }
}

/**
 * Get all users with their tracking data
 */
export async function getAllUsersWithTracking(): Promise<Array<{
  user: any;
  stats: {
    total_xp: number;
    total_submissions: number;
    approved_submissions: number;
    pending_submissions: number;
    rejected_submissions: number;
    last_active: string | null;
  };
}>> {
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError || !users) {
      return [];
    }

    // Get stats for all users in parallel
    const userStatsPromises = users.map(async (user) => {
      const [
        xpBalanceResult,
        submissionsResult
      ] = await Promise.all([
        supabase
          .from('xp_balances')
          .select('total_xp')
          .eq('user_id', user.id)
          .single(),
        
        supabase
          .from('bounty_submissions')
          .select('status')
          .eq('user_id', user.id)
      ]);

      const totalXP = xpBalanceResult.data?.total_xp || 0;
      const submissions = submissionsResult.data || [];

      const approvedSubmissions = submissions.filter(s => s.status === 'approved').length;
      const pendingSubmissions = submissions.filter(s => s.status === 'pending_review').length;
      const rejectedSubmissions = submissions.filter(s => s.status === 'rejected').length;

      return {
        user,
        stats: {
          total_xp: totalXP,
          total_submissions: submissions.length,
          approved_submissions: approvedSubmissions,
          pending_submissions: pendingSubmissions,
          rejected_submissions: rejectedSubmissions,
          last_active: user.last_active_at
        }
      };
    });

    const results = await Promise.all(userStatsPromises);
    return results;
  } catch (error) {
    console.error('Error fetching all users with tracking:', error);
    return [];
  }
}

/**
 * Get bounty statistics
 */
export async function getBountyStats(): Promise<{
  total: number;
  open: number;
  closed: number;
  draft: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
}> {
  try {
    const [
      bountiesResult,
      submissionsResult
    ] = await Promise.all([
      supabase
        .from('bounties')
        .select('status'),
      
      supabase
        .from('bounty_submissions')
        .select('status')
    ]);

    const bounties = bountiesResult.data || [];
    const submissions = submissionsResult.data || [];

    const bountyCounts = bounties.reduce((acc, bounty) => {
      acc[bounty.status] = (acc[bounty.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const submissionCounts = submissions.reduce((acc, submission) => {
      acc[submission.status] = (acc[submission.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: bounties.length,
      open: bountyCounts.open || 0,
      closed: bountyCounts.closed || 0,
      draft: bountyCounts.draft || 0,
      totalSubmissions: submissions.length,
      pendingSubmissions: submissionCounts.pending_review || 0,
      approvedSubmissions: submissionCounts.approved || 0,
      rejectedSubmissions: submissionCounts.rejected || 0
    };
  } catch (error) {
    console.error('Error fetching bounty stats:', error);
    return {
      total: 0,
      open: 0,
      closed: 0,
      draft: 0,
      totalSubmissions: 0,
      pendingSubmissions: 0,
      approvedSubmissions: 0,
      rejectedSubmissions: 0
    };
  }
}

/**
 * Refresh materialized views (admin only)
 */
export async function refreshMaterializedViews(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .rpc('refresh_materialized_view', { view_name: 'activity_daily' });

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
