
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

    // Get comprehensive user data
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

    // Get bounty submissions
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
          status
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

    // Get user activity logs
    const { data: userActivity, error: activityError } = await supabase
      .from('user_activity')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false })
      .limit(50);

    // Calculate comprehensive stats
    const stats = {
      // User profile stats
      profileCompleted: user?.profile_completed || false,
      squadTestCompleted: user?.squad_test_completed || false,
      placementTestCompleted: user?.placement_test_completed || false,
      isAdmin: user?.is_admin || false,
      
      // XP stats
      totalXP: userXP?.total_xp || 0,
      bountyXP: userXP?.bounty_xp || 0,
      courseXP: userXP?.course_xp || 0,
      streakXP: userXP?.streak_xp || 0,
      
      // Activity stats
      totalSubmissions: bountySubmissions?.length || 0,
      totalCourseCompletions: courseCompletions?.length || 0,
      totalActivity: userActivity?.length || 0,
      
      // Squad and placement stats
      currentSquad: user?.squad || null,
      placementTestScore: placementTest?.score || null,
      placementTestDate: placementTest?.completed_at || null,
      
      // Recent activity
      lastActive: user?.last_active || user?.created_at,
      lastSeen: user?.last_seen || user?.created_at
    };

    return NextResponse.json({
      user: user || null,
      stats,
      submissions: bountySubmissions || [],
      courseCompletions: courseCompletions || [],
      placementTest: placementTest || null,
      activity: userActivity || []
    });

  } catch (error) {
    console.error('[USER TRACKING API ERROR]', error);
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
    const { 
      walletAddress, 
      displayName, 
      squad, 
      activityType = 'general',
      metadata = {} 
    } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Upsert user record
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({
        wallet_address: walletAddress,
        display_name: displayName || `User ${walletAddress.slice(0, 6)}...`,
        squad: squad || null,
        profile_completed: !!displayName,
        last_active: new Date().toISOString(),
        last_seen: new Date().toISOString()
      }, {
        onConflict: 'wallet_address'
      })
      .select()
      .single();

    if (userError) {
      console.error('[UPSERT USER ERROR]', userError);
      return NextResponse.json({ error: 'Failed to update user data' }, { status: 500 });
    }

    // Log user activity
    const { error: activityError } = await supabase
      .from('user_activity')
      .insert({
        wallet_address: walletAddress,
        activity_type: activityType,
        metadata: metadata,
        created_at: new Date().toISOString()
      });

    if (activityError) {
      console.error('[LOG ACTIVITY ERROR]', activityError);
      // Don't fail the request if activity logging fails
    }

    return NextResponse.json({
      success: true,
      user,
      message: 'User data updated successfully'
    });

  } catch (error) {
    console.error('[USER TRACKING POST ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
