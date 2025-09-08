import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Get comprehensive user data for admin dashboard
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('[FETCH USER ERROR]', userError);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    // Get user XP data
    const { data: userXP, error: xpError } = await supabase
      .from('user_xp')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    // Get bounty submissions with enhanced data
    const { data: bountySubmissions, error: bountyError } = await supabase
      .from('bounty_submissions')
      .select(`
        *,
        submissions:submission_id (
          id,
          title,
          description,
          image_url,
          created_at,
          status,
          upvotes,
          total_upvotes
        )
      `)
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false });

    // Get course completions
    const { data: courseCompletions, error: courseError } = await supabase
      .from('course_completions')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('completed_at', { ascending: false });

    // Get placement test data
    const { data: placementTest, error: placementError } = await supabase
      .from('placement_tests')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    // Get user activity for tracking
    const { data: userActivity, error: activityError } = await supabase
      .from('user_activity')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false })
      .limit(20);

    // Calculate stats
    const totalBountyXP = bountySubmissions?.reduce((sum, sub) => sum + (sub.xp_awarded || 0), 0) || 0;
    const totalBountySOL = bountySubmissions?.reduce((sum, sub) => sum + (sub.sol_prize || 0), 0) || 0;
    const wins = bountySubmissions?.filter(sub => sub.placement).length || 0;
    const completedCourses = courseCompletions?.length || 0;

    return NextResponse.json({
      user: user || null,
      xp: userXP || {
        total_xp: 0,
        bounty_xp: 0,
        course_xp: 0,
        streak_xp: 0
      },
      bountyStats: {
        totalSubmissions: bountySubmissions?.length || 0,
        totalXP: totalBountyXP,
        totalSOL: totalBountySOL,
        wins,
        pendingSubmissions: (bountySubmissions?.length || 0) - wins
      },
      courseStats: {
        completed: completedCourses,
        inProgress: 0 // This would need to be calculated based on your course progress logic
      },
      placementTest: placementTest || null,
      userActivity: userActivity || [],
      tracking: {
        profileCompleted: user?.profile_completed || false,
        squadTestCompleted: user?.squad_test_completed || false,
        placementTestCompleted: user?.placement_test_completed || false,
        isAdmin: user?.is_admin || false,
        currentSquad: user?.squad || null,
        lastActive: user?.last_active || user?.created_at,
        lastSeen: user?.last_seen || user?.created_at
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('[USER SYNC API ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const body = await request.json();
    const { walletAddress, updates } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Update user data
    if (updates.user) {
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          wallet_address: walletAddress,
          ...updates.user,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'wallet_address'
        });

      if (userError) {
        console.error('[UPDATE USER ERROR]', userError);
        return NextResponse.json({ error: 'Failed to update user data' }, { status: 500 });
      }
    }

    // Update XP data
    if (updates.xp) {
      const { error: xpError } = await supabase
        .from('user_xp')
        .upsert({
          wallet_address: walletAddress,
          ...updates.xp,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'wallet_address'
        });

      if (xpError) {
        console.error('[UPDATE XP ERROR]', xpError);
        return NextResponse.json({ error: 'Failed to update XP data' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User data synced successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[USER SYNC POST ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

