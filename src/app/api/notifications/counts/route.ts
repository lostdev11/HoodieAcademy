import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Mark as dynamic route
export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications/counts
 * 
 * Fetches notification counts for a user
 * Returns counts of new/unread items across the platform
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const isAdmin = searchParams.get('is_admin') === 'true';

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    console.log('📊 Fetching notification counts for:', wallet, 'Admin:', isAdmin);

    // Get user's last seen timestamps from localStorage (passed via query or stored)
    // For now, we'll calculate based on recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const counts: any = {
      newSubmissions: 0,
      newFeedback: 0,
      pendingMentorships: 0,
      newUsers: 0,
      pendingPermissions: 0,
      newAnnouncements: 0,
      newEvents: 0,
      newBounties: 0,
      newCourses: 0,
      unreadMessages: 0,
    };

    // Admin-specific notifications
    if (isAdmin) {
      // Count pending bounty submissions
      const { count: submissionsCount } = await supabase
        .from('bounty_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      counts.newSubmissions = submissionsCount || 0;

      // Count unread feedback
      const { count: feedbackCount } = await supabase
        .from('user_feedback')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gte('created_at', sevenDaysAgo.toISOString());
      
      counts.newFeedback = feedbackCount || 0;

      // Count pending mentorship presenter applications
      const { count: mentorshipCount } = await supabase
        .from('mentorship_presenters')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false)
        .gte('created_at', sevenDaysAgo.toISOString());
      
      counts.pendingMentorships = mentorshipCount || 0;

      // Count new users (last 7 days)
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());
      
      counts.newUsers = usersCount || 0;

      // Count pending student permissions for live sessions
      const { count: permissionsCount } = await supabase
        .from('session_student_permissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waiting');
      
      counts.pendingPermissions = permissionsCount || 0;
    }

    // User-facing notifications (everyone sees these)
    
    // New announcements
    const { count: announcementsCount } = await supabase
      .from('council_notices')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());
    
    counts.newAnnouncements = announcementsCount || 0;

    // New events
    const { count: eventsCount } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());
    
    counts.newEvents = eventsCount || 0;

    // New bounties
    const { count: bountiesCount } = await supabase
      .from('bounties')
      .select('*', { count: 'exact', head: true })
      .eq('hidden', false)
      .gte('created_at', sevenDaysAgo.toISOString());
    
    counts.newBounties = bountiesCount || 0;

    // New courses (published)
    const { count: coursesCount } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .eq('is_visible', true)
      .gte('created_at', sevenDaysAgo.toISOString());
    
    counts.newCourses = coursesCount || 0;

    console.log('✅ Notification counts calculated:', counts);

    return NextResponse.json({
      success: true,
      counts,
      wallet,
      isAdmin,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching notification counts:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

