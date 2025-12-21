import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

interface UserActivityScore {
  wallet_address: string;
  display_name: string;
  username?: string;
  squad?: string;
  avatar_url?: string;
  totalScore: number;
  breakdown: {
    xpScore: number;
    courseScore: number;
    bountyScore: number;
    activityScore: number;
    communityScore: number;
    consistencyScore: number;
  };
  metrics: {
    xpEarned: number;
    coursesCompleted: number;
    bountiesSubmitted: number;
    bountiesWon: number;
    activityCount: number;
    activeDays: number;
    feedbackSubmitted: number;
    socialPosts: number;
  };
  recommendationReason: string;
}

/**
 * Calculate Hoodie of the Month recommendations based on user activity
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const monthOffset = parseInt(searchParams.get('monthOffset') || '0'); // 0 = current month, 1 = last month, etc.

    // Calculate date range for the month
    const now = new Date();
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    const monthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59);

    console.log(`📊 Calculating Hoodie of the Month for ${monthStart.toISOString()} to ${monthEnd.toISOString()}`);

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('wallet_address, display_name, username, squad, profile_picture, total_xp, created_at')
      .not('wallet_address', 'is', null);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    const recommendations: UserActivityScore[] = [];

    // Calculate scores for each user
    for (const user of users) {
      const walletAddress = user.wallet_address;
      if (!walletAddress) continue;

      // 1. XP earned this month (from user_activity table)
      const { data: xpActivities } = await supabase
        .from('user_activity')
        .select('*')
        .eq('wallet_address', walletAddress)
        .eq('activity_type', 'xp_awarded')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      const xpEarned = xpActivities?.reduce((sum, activity) => {
        const xpAmount = activity.metadata?.xp_amount || activity.metadata?.amount || 0;
        return sum + (typeof xpAmount === 'number' ? xpAmount : 0);
      }, 0) || 0;

      // Also check if user's total_xp increased (fallback)
      // We'll use a simpler approach: check recent activity
      const { data: recentActivities } = await supabase
        .from('user_activity')
        .select('*')
        .eq('wallet_address', walletAddress)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      // 2. Course completions this month
      const { data: courseCompletions } = await supabase
        .from('course_completions')
        .select('*')
        .eq('wallet_address', walletAddress)
        .gte('completed_at', monthStart.toISOString())
        .lte('completed_at', monthEnd.toISOString());

      const coursesCompleted = courseCompletions?.length || 0;

      // 3. Bounty submissions this month
      const { data: bountySubmissions } = await supabase
        .from('bounty_submissions')
        .select('*')
        .eq('wallet_address', walletAddress)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      const bountiesSubmitted = bountySubmissions?.length || 0;

      // Count bounty wins (where placement is 1, 2, or 3)
      const bountiesWon = bountySubmissions?.filter(
        sub => sub.placement && [1, 2, 3].includes(sub.placement)
      ).length || 0;

      // 4. Activity count (all activities this month)
      const activityCount = recentActivities?.length || 0;

      // 5. Active days (unique days with activity)
      const activeDaysSet = new Set(
        recentActivities?.map(activity => 
          new Date(activity.created_at).toISOString().split('T')[0]
        ) || []
      );
      const activeDays = activeDaysSet.size;

      // 6. Feedback submitted
      const { data: feedback } = await supabase
        .from('user_feedback')
        .select('*')
        .eq('wallet_address', walletAddress)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      const feedbackSubmitted = feedback?.length || 0;

      // 7. Social posts (if social_feed table exists)
      let socialPosts = 0;
      try {
        const { data: socialPostsData } = await supabase
          .from('social_feed')
          .select('*')
          .eq('wallet_address', walletAddress)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());
        socialPosts = socialPostsData?.length || 0;
      } catch (e) {
        // Table might not exist, that's okay
      }

      // Calculate weighted scores
      const xpScore = Math.min(xpEarned / 10, 100); // Max 100 points for XP (1000 XP = 100 points)
      const courseScore = coursesCompleted * 20; // 20 points per course
      const bountyScore = (bountiesSubmitted * 5) + (bountiesWon * 30); // 5 per submission, 30 per win
      const activityScore = Math.min(activityCount / 2, 50); // Max 50 points for activity (100 activities = 50 points)
      const communityScore = (feedbackSubmitted * 10) + (socialPosts * 5); // Community engagement
      const consistencyScore = Math.min(activeDays * 2, 40); // Max 40 points for consistency (20 active days = 40 points)

      const totalScore = xpScore + courseScore + bountyScore + activityScore + communityScore + consistencyScore;

      // Generate recommendation reason
      const reasons: string[] = [];
      if (xpEarned > 500) reasons.push(`Earned ${xpEarned} XP`);
      if (coursesCompleted > 0) reasons.push(`Completed ${coursesCompleted} course${coursesCompleted > 1 ? 's' : ''}`);
      if (bountiesWon > 0) reasons.push(`Won ${bountiesWon} bounty${bountiesWon > 1 ? 'ies' : ''}`);
      if (bountiesSubmitted > 5) reasons.push(`Submitted ${bountiesSubmitted} bounty submissions`);
      if (activeDays > 15) reasons.push(`Active ${activeDays} days`);
      if (feedbackSubmitted > 0) reasons.push(`Submitted ${feedbackSubmitted} feedback item${feedbackSubmitted > 1 ? 's' : ''}`);

      const recommendationReason = reasons.length > 0 
        ? reasons.join(', ')
        : 'Consistent participation in academy activities';

      recommendations.push({
        wallet_address: walletAddress,
        display_name: user.display_name || 'Unknown',
        username: user.username,
        squad: user.squad,
        avatar_url: user.profile_picture,
        totalScore,
        breakdown: {
          xpScore,
          courseScore,
          bountyScore,
          activityScore,
          communityScore,
          consistencyScore
        },
        metrics: {
          xpEarned,
          coursesCompleted,
          bountiesSubmitted,
          bountiesWon,
          activityCount,
          activeDays,
          feedbackSubmitted,
          socialPosts
        },
        recommendationReason
      });
    }

    // Sort by total score (descending) and return top N
    recommendations.sort((a, b) => b.totalScore - a.totalScore);
    const topRecommendations = recommendations.slice(0, limit);

    return NextResponse.json({
      success: true,
      recommendations: topRecommendations,
      month: {
        start: monthStart.toISOString(),
        end: monthEnd.toISOString(),
        label: targetMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      },
      totalUsersAnalyzed: users.length
    });

  } catch (error) {
    console.error('Error calculating Hoodie of the Month recommendations:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

