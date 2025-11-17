
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('[USER TRACK] Starting request');
    
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('[USER TRACK] Missing Supabase environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Use service role key to bypass RLS for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      console.log('[USER TRACK] No wallet address provided');
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    console.log('[USER TRACK] Fetching user data for wallet:', walletAddress.slice(0, 8) + '...');

    // Get comprehensive user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (userError) {
      console.error('[USER TRACK] User fetch error:', {
        code: userError.code,
        message: userError.message,
        details: userError.details
      });
      
      // Only return 500 for unexpected errors (not table missing or not found)
      if (userError.code !== 'PGRST116' && userError.code !== '42P01') {
        return NextResponse.json({ 
          error: 'Failed to fetch user data',
          details: userError.message 
        }, { status: 500 });
      }
    }

    // If user doesn't exist yet, return default data
    if (!user) {
      return NextResponse.json({
        user: null,
        stats: {
          profileCompleted: false,
          squadTestCompleted: false,
          placementTestCompleted: false,
          isAdmin: false,
          totalXP: 0,
          bountyXP: 0,
          courseXP: 0,
          streakXP: 0,
          totalSubmissions: 0,
          totalCourseCompletions: 0,
          totalBountyCompletions: 0,
          totalBountyXP: 0,
          totalActivity: 0,
          currentSquad: null,
          placementTestScore: null,
          placementTestDate: null,
          lastActive: null,
          lastSeen: null
        },
        submissions: [],
        courseCompletions: [],
        bountyCompletions: [],
        placementTest: null,
        activity: []
      });
    }

    // XP data is now stored directly in the users table

    // Get bounty submissions (with error handling for missing tables)
    const { data: bountySubmissions, error: bountyError } = await supabase
      .from('bounty_submissions')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false });

    if (bountyError && bountyError.code !== '42P01') {
      console.error('[BOUNTY SUBMISSIONS ERROR]', bountyError);
    }

    // Get course completions (with error handling for missing tables)
    const { data: courseCompletions, error: courseError } = await supabase
      .from('course_completions')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('completed_at', { ascending: false });

    if (courseError && courseError.code !== '42P01') {
      console.error('[COURSE COMPLETIONS ERROR]', courseError);
    }

    // Get bounty completions (with error handling for missing tables)
    const { data: bountyCompletions, error: bountyCompletionError } = await supabase
      .from('user_bounty_completions')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('completed_at', { ascending: false });

    if (bountyCompletionError && bountyCompletionError.code !== '42P01') {
      console.error('[BOUNTY COMPLETIONS ERROR]', bountyCompletionError);
    }

    // Get placement test data (with error handling for missing tables)
    const { data: placementTest, error: placementError } = await supabase
      .from('placement_tests')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (placementError && placementError.code !== '42P01') {
      console.error('[PLACEMENT TEST ERROR]', placementError);
    }

    // Get user activity logs (with error handling for missing tables)
    const { data: userActivity, error: activityError } = await supabase
      .from('user_activity')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false })
      .limit(50);

    if (activityError && activityError.code !== '42P01') {
      console.error('[USER ACTIVITY ERROR]', activityError);
    }

    // Calculate comprehensive stats
    const stats = {
      // User profile stats
      profileCompleted: user?.profile_completed || false,
      squadTestCompleted: user?.squad_test_completed || false,
      placementTestCompleted: user?.placement_test_completed || false,
      isAdmin: user?.is_admin || false,
      
      // XP stats (now stored in users table)
      totalXP: user?.total_xp || 0,
      bountyXP: 0, // TODO: Implement separate bounty XP tracking
      courseXP: 0, // TODO: Implement separate course XP tracking
      streakXP: 0, // TODO: Implement streak XP tracking
      
      // Activity stats
      totalSubmissions: bountySubmissions?.length || 0,
      totalCourseCompletions: courseCompletions?.length || 0,
      totalBountyCompletions: bountyCompletions?.length || 0,
      totalBountyXP: bountyCompletions?.reduce((sum, completion) => sum + (completion.xp_awarded || 0), 0) || 0,
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
      bountyCompletions: bountyCompletions || [],
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
    // Use service role key to bypass RLS for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

    console.log('[USER TRACKING] Processing request for wallet:', walletAddress.slice(0, 8) + '...');

    // First, check if user exists to preserve created_at and display_name for existing users
    const { data: existingUser } = await supabase
      .from('users')
      .select('created_at, display_name')
      .eq('wallet_address', walletAddress)
      .single();

    // Determine display_name: preserve existing if no new one provided, or use new one if provided
    let finalDisplayName: string;
    if (displayName && displayName.trim() !== '') {
      // New display name provided - use it
      finalDisplayName = displayName.trim();
    } else if (existingUser?.display_name && existingUser.display_name.trim() !== '') {
      // Existing user has a display name - preserve it (don't overwrite with default)
      finalDisplayName = existingUser.display_name;
    } else {
      // New user or no existing display name - use default
      finalDisplayName = `User ${walletAddress.slice(0, 6)}...`;
    }

    // Prepare user data with only the fields that exist in the schema
    const userData = {
      wallet_address: walletAddress,
      display_name: finalDisplayName,
      squad: squad || null,
      profile_completed: !!(displayName && displayName.trim() !== ''),
      last_active: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_at: existingUser?.created_at || new Date().toISOString() // Preserve existing or set new
    };

    console.log('[USER TRACKING] User data to upsert:', userData);
    console.log('[USER TRACKING] Display name logic:', {
      provided: displayName,
      existing: existingUser?.display_name,
      final: finalDisplayName
    });

    // Upsert user record with better error handling
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert(userData, {
        onConflict: 'wallet_address'
      })
      .select()
      .single();

    if (userError) {
      console.error('[UPSERT USER ERROR]', userError);
      console.error('[UPSERT USER ERROR DETAILS]', {
        code: userError.code,
        message: userError.message,
        details: userError.details,
        hint: userError.hint
      });
      
      // Try to provide more specific error messages
      let errorMessage = 'Failed to update user data';
      if (userError.code === '23505') {
        errorMessage = 'User already exists with this wallet address';
      } else if (userError.code === '42P01') {
        errorMessage = 'Users table does not exist - please run database setup';
      } else if (userError.code === '42703') {
        errorMessage = 'Database schema mismatch - please run database migration';
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details: userError.message,
        code: userError.code
      }, { status: 500 });
    }

    console.log('[USER TRACKING] User upsert successful:', user);

    // Log user activity (don't fail if this fails)
    try {
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
      } else {
        console.log('[USER TRACKING] Activity logged successfully');
      }
    } catch (activityErr) {
      console.error('[LOG ACTIVITY EXCEPTION]', activityErr);
      // Continue - activity logging is not critical
    }

    return NextResponse.json({
      success: true,
      user,
      message: 'User data updated successfully'
    });

  } catch (error) {
    console.error('[USER TRACKING POST ERROR]', error);
    console.error('[USER TRACKING POST ERROR STACK]', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : 'Unknown'
    }, { status: 500 });
  }
}
