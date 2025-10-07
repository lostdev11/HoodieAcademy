'use client';

import { supabase } from '@/lib/supabase';
import { 
  AdminDashboardStats, 
  AdminDashboardData, 
  ActivityDaily, 
  ActivityWeekly, 
  ActivityMonthly,
  LiveUser,
  InactiveUser,
  TopCourse,
  AdminApproval
} from '@/types/tracking';

/**
 * Admin analytics data access layer
 * Provides typed functions for querying user tracking data
 */

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  try {
    // Get current DAU (today)
    const { data: dauData } = await supabase
      .from('activity_daily')
      .select('dau')
      .eq('day', new Date().toISOString().split('T')[0])
      .single();

    // Get current WAU (this week)
    const { data: wauData } = await supabase
      .from('activity_weekly')
      .select('wau')
      .gte('week', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('week', { ascending: false })
      .limit(1)
      .single();

    // Get current MAU (this month)
    const { data: mauData } = await supabase
      .from('activity_monthly')
      .select('mau')
      .gte('month', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('month', { ascending: false })
      .limit(1)
      .single();

    // Get live users (last 5 minutes)
    const { data: liveUsersData } = await supabase
      .from('live_users')
      .select('*');

    // Get new wallets (24h)
    const { data: newWallets24hData } = await supabase
      .from('wallets')
      .select('*')
      .gte('connected_first_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Get new wallets (7d)
    const { data: newWallets7dData } = await supabase
      .from('wallets')
      .select('*')
      .gte('connected_first_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Get total users
    const { data: totalUsersData } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get inactive users (7d)
    const { data: inactiveUsersData } = await supabase
      .from('inactive_users_7d')
      .select('*');

    return {
      dau: dauData?.dau || 0,
      wau: wauData?.wau || 0,
      mau: mauData?.mau || 0,
      liveUsers: liveUsersData?.length || 0,
      newWallets24h: newWallets24hData?.length || 0,
      newWallets7d: newWallets7dData?.length || 0,
      totalUsers: totalUsersData?.length || 0,
      inactiveUsers7d: inactiveUsersData?.length || 0
    };
  } catch (error) {
    console.error('Failed to get admin dashboard stats:', error);
    throw error;
  }
}

export async function getActivityDaily(days: number = 30): Promise<ActivityDaily[]> {
  try {
    const { data, error } = await supabase
      .from('activity_daily')
      .select('*')
      .gte('day', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('day', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get daily activity:', error);
    throw error;
  }
}

export async function getActivityWeekly(weeks: number = 12): Promise<ActivityWeekly[]> {
  try {
    const { data, error } = await supabase
      .from('activity_weekly')
      .select('*')
      .gte('week', new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('week', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get weekly activity:', error);
    throw error;
  }
}

export async function getActivityMonthly(months: number = 12): Promise<ActivityMonthly[]> {
  try {
    const { data, error } = await supabase
      .from('activity_monthly')
      .select('*')
      .gte('month', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('month', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get monthly activity:', error);
    throw error;
  }
}

export async function getLiveUsers(): Promise<LiveUser[]> {
  try {
    const { data, error } = await supabase
      .from('live_users')
      .select('*')
      .order('last_heartbeat_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get live users:', error);
    throw error;
  }
}

export async function getInactiveUsers(): Promise<InactiveUser[]> {
  try {
    const { data, error } = await supabase
      .from('inactive_users_7d')
      .select('*')
      .order('last_event_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get inactive users:', error);
    throw error;
  }
}

export async function getTopCourses(): Promise<TopCourse[]> {
  try {
    const { data, error } = await supabase
      .from('top_courses_7d')
      .select('*')
      .order('active_users', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get top courses:', error);
    throw error;
  }
}

export async function getRecentApprovals(limit: number = 10): Promise<AdminApproval[]> {
  try {
    const { data, error } = await supabase
      .from('admin_approvals')
      .select(`
        *,
        admin:admin_id(id, display_name, primary_wallet),
        user:user_id(id, display_name, primary_wallet)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get recent approvals:', error);
    throw error;
  }
}

export async function getUserStats(userId: string) {
  try {
    const { data, error } = await supabase
      .rpc('get_user_stats', { target_user_id: userId });

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Failed to get user stats:', error);
    throw error;
  }
}

export async function getCompleteAdminDashboardData(): Promise<AdminDashboardData> {
  try {
    const [
      stats,
      activityDaily,
      activityWeekly,
      activityMonthly,
      liveUsers,
      inactiveUsers,
      topCourses,
      recentApprovals
    ] = await Promise.all([
      getAdminDashboardStats(),
      getActivityDaily(30),
      getActivityWeekly(12),
      getActivityMonthly(12),
      getLiveUsers(),
      getInactiveUsers(),
      getTopCourses(),
      getRecentApprovals(10)
    ]);

    return {
      stats,
      activityDaily,
      activityWeekly,
      activityMonthly,
      liveUsers,
      inactiveUsers,
      topCourses,
      recentApprovals
    };
  } catch (error) {
    console.error('Failed to get complete admin dashboard data:', error);
    throw error;
  }
}

/**
 * Utility function to refresh materialized views
 * Should be called periodically (e.g., via cron job)
 */
export async function refreshActivityViews(): Promise<void> {
  try {
    const { error } = await supabase
      .rpc('refresh_activity_views');

    if (error) throw error;
    console.log('Activity views refreshed successfully');
  } catch (error) {
    console.error('Failed to refresh activity views:', error);
    throw error;
  }
}

/**
 * Utility function to end stale sessions
 * Should be called periodically to clean up old sessions
 */
export async function endStaleSessions(): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc('end_stale_sessions');

    if (error) throw error;
    console.log(`Ended ${data} stale sessions`);
    return data || 0;
  } catch (error) {
    console.error('Failed to end stale sessions:', error);
    throw error;
  }
}
