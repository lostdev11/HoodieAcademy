import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '20');
    const squad = searchParams.get('squad');
    const sortBy = searchParams.get('sortBy') || 'completion_percentage'; // completion_percentage, total_xp, courses_completed

    // Build the query to get comprehensive user data
    let query = supabase
      .from('users')
      .select(`
        wallet_address,
        display_name,
        squad,
        created_at,
        last_active,
        total_xp,
        level,
        is_admin
      `);

    // Apply squad filter if provided
    if (squad && squad !== 'all') {
      query = query.eq('squad', squad);
    }

    const { data: users, error: usersError } = await query;

    if (usersError) {
      console.error('Error fetching users for leaderboard:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard data', details: usersError.message },
        { status: 500 }
      );
    }

    // Get detailed course completion data for each user
    const leaderboardData = await Promise.all(
      users.map(async (user) => {
        // Get course completions with details
        const { data: courseCompletions, error: courseError } = await supabase
          .from('course_completions')
          .select(`
            course_id,
            completed_at,
            final_score,
            lessons_completed,
            total_lessons
          `)
          .eq('wallet_address', user.wallet_address);

        // Get bounty submissions with XP data
        const { data: bountySubmissions, error: bountyError } = await supabase
          .from('bounty_submissions')
          .select(`
            xp_earned,
            sol_earned,
            status
          `)
          .eq('wallet_address', user.wallet_address);

        if (courseError || bountyError) {
          console.warn('Error fetching detailed data for user:', user.wallet_address);
        }

        // Calculate statistics
        const completedCourses = courseCompletions?.length || 0;
        const totalLessonsCompleted = courseCompletions?.reduce((sum, comp) => sum + (comp.lessons_completed || 0), 0) || 0;
        const totalLessonsAvailable = courseCompletions?.reduce((sum, comp) => sum + (comp.total_lessons || 0), 0) || 0;
        const totalBountyXP = bountySubmissions?.reduce((sum, sub) => sum + (sub.xp_earned || 0), 0) || 0;
        const totalBountySOL = bountySubmissions?.reduce((sum, sub) => sum + (sub.sol_earned || 0), 0) || 0;
        
        // Get XP from users table (primary source)
        const totalXP = user.total_xp || 0;
        const userLevel = user.level || 1;

        // Calculate completion percentage
        const completionPercentage = totalLessonsAvailable > 0 
          ? (totalLessonsCompleted / totalLessonsAvailable) * 100 
          : 0;

        // Calculate average quiz score
        const quizScores = courseCompletions?.filter(comp => comp.final_score !== null)
          .map(comp => comp.final_score) || [];
        const averageQuizScore = quizScores.length > 0 
          ? quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length 
          : 0;

        return {
          walletAddress: user.wallet_address,
          displayName: user.display_name || `User ${user.wallet_address.slice(0, 6)}...`,
          squad: user.squad || 'Unassigned',
          rank: 0, // Will be calculated after sorting
          totalScore: totalXP,
          level: userLevel,
          coursesCompleted: completedCourses,
          totalLessons: totalLessonsCompleted,
          totalLessonsAvailable,
          completionPercentage: Math.round(completionPercentage * 100) / 100,
          averageQuizScore: Math.round(averageQuizScore * 100) / 100,
          totalBountyXP,
          totalBountySOL,
          bountySubmissions: bountySubmissions?.length || 0,
          joinDate: user.created_at,
          lastActive: user.last_active || user.created_at,
          profileImage: null, // TODO: Add profile image support
          courseProgress: courseCompletions?.map(comp => ({
            courseId: comp.course_id,
            completed: true,
            completedDate: comp.completed_at,
            lessonsCompleted: comp.lessons_completed || 0,
            totalLessons: comp.total_lessons || 0,
            score: comp.final_score || 0
          })) || []
        };
      })
    );

    // Sort the data based on the requested sort criteria
    leaderboardData.sort((a, b) => {
      switch (sortBy) {
        case 'completion_percentage':
          return b.completionPercentage - a.completionPercentage;
        case 'total_xp':
          return b.totalScore - a.totalScore;
        case 'courses_completed':
          return b.coursesCompleted - a.coursesCompleted;
        default:
          return b.completionPercentage - a.completionPercentage;
      }
    });

    // Assign ranks and apply limit
    const rankedData = leaderboardData
      .slice(0, limit)
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));

    return NextResponse.json(rankedData);
  } catch (error) {
    console.error('Error in leaderboard API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
