import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * GET /api/xp - Fetch comprehensive XP data for a user
 * Query params:
 *   - wallet: User's wallet address (required)
 *   - includeHistory: Include XP history from user_activity (optional, default: false)
 *   - includeCourses: Include course completion details (optional, default: false)
 *   - includeBounties: Include bounty completion details (optional, default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    const includeHistory = searchParams.get('includeHistory') === 'true';
    const includeCourses = searchParams.get('includeCourses') === 'true';
    const includeBounties = searchParams.get('includeBounties') === 'true';

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    console.log('📊 [XP API] Fetching XP data for:', walletAddress);
    const supabase = getSupabaseClient();

    // Get user's current XP and level
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('wallet_address, display_name, total_xp, level, squad, created_at, updated_at')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('❌ [XP API] Error fetching user:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data', details: userError.message },
        { status: 500 }
      );
    }

    // If user doesn't exist, return default data
    if (!user) {
      console.log('⚠️ [XP API] User not found:', walletAddress);
      return NextResponse.json({
        walletAddress,
        exists: false,
        totalXP: 0,
        level: 1,
        xpToNextLevel: 1000,
        progressToNextLevel: 0,
        message: 'User not found. XP will be created when first action is performed.'
      });
    }

    const totalXP = user.total_xp || 0;
    const level = user.level || 1;
    const xpInCurrentLevel = totalXP % 1000;
    const xpToNextLevel = 1000 - xpInCurrentLevel;
    const progressToNextLevel = (xpInCurrentLevel / 1000) * 100;

    // Base response
    const response: any = {
      walletAddress: user.wallet_address,
      displayName: user.display_name,
      exists: true,
      totalXP,
      level,
      squad: user.squad,
      xpInCurrentLevel,
      xpToNextLevel,
      progressToNextLevel,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      breakdown: {
        courseXP: 0,
        bountyXP: 0,
        dailyLoginXP: 0,
        adminAwardXP: 0,
        otherXP: 0
      }
    };

    // Fetch XP history if requested
    if (includeHistory) {
      const { data: activities, error: activityError } = await supabase
        .from('user_activity')
        .select('activity_type, metadata, created_at')
        .eq('wallet_address', walletAddress)
        .in('activity_type', [
          'xp_awarded',
          'xp_bounty',
          'course_completion',
          'daily_login_bonus'
        ])
        .order('created_at', { ascending: false })
        .limit(100);

      if (!activityError && activities) {
        response.xpHistory = activities.map((activity: any) => ({
          type: activity.activity_type,
          xpAmount: activity.metadata?.xp_amount || 0,
          reason: activity.metadata?.reason || activity.activity_type,
          date: activity.created_at,
          metadata: activity.metadata
        }));

        // Calculate XP breakdown from history
        activities.forEach((activity: any) => {
          const xpAmount = activity.metadata?.xp_amount || 0;
          switch (activity.activity_type) {
            case 'course_completion':
              response.breakdown.courseXP += xpAmount;
              break;
            case 'xp_bounty':
              response.breakdown.bountyXP += xpAmount;
              break;
            case 'daily_login_bonus':
              response.breakdown.dailyLoginXP += xpAmount;
              break;
            case 'xp_awarded':
              response.breakdown.adminAwardXP += xpAmount;
              break;
            default:
              response.breakdown.otherXP += xpAmount;
          }
        });
      }
    }

    // Fetch course completions if requested
    if (includeCourses) {
      const { data: courses, error: courseError } = await supabase
        .from('course_completions')
        .select('course_id, completed_at, xp_earned')
        .eq('wallet_address', walletAddress)
        .order('completed_at', { ascending: false });

      if (!courseError && courses) {
        response.courseCompletions = courses;
        response.totalCoursesCompleted = courses.length;
        response.totalCourseXP = courses.reduce((sum: number, course: any) => 
          sum + (course.xp_earned || 0), 0
        );
      }
    }

    // Fetch bounty completions if requested
    if (includeBounties) {
      const { data: bounties, error: bountyError } = await supabase
        .from('user_activity')
        .select('metadata, created_at')
        .eq('wallet_address', walletAddress)
        .eq('activity_type', 'xp_bounty')
        .order('created_at', { ascending: false });

      if (!bountyError && bounties) {
        response.bountyCompletions = bounties.map((bounty: any) => ({
          xpEarned: bounty.metadata?.xp_amount || 0,
          reason: bounty.metadata?.reason,
          bountyType: bounty.metadata?.bounty_type,
          completedAt: bounty.created_at
        }));
        response.totalBountyXP = bounties.reduce((sum: number, bounty: any) => 
          sum + (bounty.metadata?.xp_amount || 0), 0
        );
      }
    }

    console.log('✅ [XP API] Successfully fetched XP data:', {
      wallet: walletAddress.slice(0, 8) + '...',
      totalXP,
      level
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [XP API] Error in GET request:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/xp - Award XP to a user
 * Body:
 *   - targetWallet: User's wallet address (required)
 *   - xpAmount: Amount of XP to award (required)
 *   - source: Source of XP (required: 'course' | 'bounty' | 'daily_login' | 'admin' | 'other')
 *   - reason: Reason for XP award (required)
 *   - metadata: Additional metadata (optional)
 *   - awardedBy: Admin wallet address (required if source is 'admin')
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🎯 [XP API] POST request received');
    const supabase = getSupabaseClient();
    
    const { 
      targetWallet, 
      xpAmount, 
      source,
      reason, 
      metadata = {},
      awardedBy
    } = await request.json();
    
    console.log('📦 [XP API] Request data:', { 
      targetWallet, 
      xpAmount, 
      source,
      reason, 
      awardedBy 
    });

    // Validate required parameters
    if (!targetWallet || !xpAmount || !source || !reason) {
      console.error('❌ [XP API] Missing required parameters');
      return NextResponse.json(
        { error: 'Missing required parameters: targetWallet, xpAmount, source, reason' },
        { status: 400 }
      );
    }

    // Validate source
    const validSources = ['course', 'bounty', 'daily_login', 'admin', 'other'];
    if (!validSources.includes(source)) {
      return NextResponse.json(
        { error: `Invalid source. Must be one of: ${validSources.join(', ')}` },
        { status: 400 }
      );
    }

    // If source is admin, verify admin access
    if (source === 'admin') {
      if (!awardedBy) {
        return NextResponse.json(
          { error: 'awardedBy is required for admin XP awards' },
          { status: 400 }
        );
      }

      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('wallet_address', awardedBy)
        .single();

      if (adminError || !adminUser?.is_admin) {
        console.error('❌ [XP API] Admin check failed:', { adminError, adminUser });
        return NextResponse.json(
          { error: 'Unauthorized: Admin access required' },
          { status: 403 }
        );
      }
    }

    // Get current user data
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('total_xp, level, display_name, wallet_address')
      .eq('wallet_address', targetWallet)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('❌ [XP API] Error fetching user:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data', details: userError.message },
        { status: 500 }
      );
    }

    // If user doesn't exist, create them
    if (!currentUser) {
      console.log('👤 [XP API] User not found, creating new user:', targetWallet);
      const { error: createError } = await supabase
        .from('users')
        .upsert({
          wallet_address: targetWallet,
          display_name: `User ${targetWallet.slice(0, 6)}...`,
          total_xp: 0,
          level: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'wallet_address'
        });

      if (createError) {
        console.error('❌ [XP API] Error creating user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user', details: createError.message },
          { status: 500 }
        );
      }
    }

    // Calculate new XP and level
    const previousXP = currentUser?.total_xp || 0;
    const newTotalXP = previousXP + xpAmount;
    const previousLevel = currentUser?.level || 1;
    const newLevel = Math.floor(newTotalXP / 1000) + 1; // 1000 XP per level
    const levelUp = newLevel > previousLevel;

    console.log('📊 [XP API] XP calculation:', {
      previousXP,
      xpAmount,
      newTotalXP,
      previousLevel,
      newLevel,
      levelUp
    });

    // Update user XP and level
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        total_xp: newTotalXP,
        level: newLevel,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', targetWallet)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [XP API] Error updating user XP:', updateError);
      return NextResponse.json(
        { error: 'Failed to award XP', details: updateError.message },
        { status: 500 }
      );
    }

    // Map source to activity type
    const activityTypeMap: Record<string, string> = {
      'course': 'course_completion',
      'bounty': 'xp_bounty',
      'daily_login': 'daily_login_bonus',
      'admin': 'xp_awarded',
      'other': 'xp_awarded'
    };

    const activityType = activityTypeMap[source] || 'xp_awarded';

    // Log the XP award activity
    const { error: activityError } = await supabase
      .from('user_activity')
      .insert({
        wallet_address: targetWallet,
        activity_type: activityType,
        metadata: {
          xp_amount: xpAmount,
          reason: reason,
          source: source,
          awarded_by: awardedBy || 'system',
          previous_xp: previousXP,
          new_total_xp: newTotalXP,
          previous_level: previousLevel,
          new_level: newLevel,
          level_up: levelUp,
          ...metadata
        },
        created_at: new Date().toISOString()
      });

    if (activityError) {
      console.error('⚠️ [XP API] Failed to log activity (non-critical):', activityError);
    }

    console.log('✅ [XP API] Successfully awarded XP:', {
      wallet: targetWallet.slice(0, 8) + '...',
      xpAwarded: xpAmount,
      newTotalXP,
      levelUp
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      xpAwarded: xpAmount,
      previousXP,
      newTotalXP,
      previousLevel,
      newLevel,
      levelUp,
      source,
      reason,
      message: `Successfully awarded ${xpAmount} XP for ${reason}`,
      // Data for real-time updates
      refreshLeaderboard: true,
      targetWallet,
      xpInCurrentLevel: newTotalXP % 1000,
      xpToNextLevel: 1000 - (newTotalXP % 1000),
      progressToNextLevel: ((newTotalXP % 1000) / 1000) * 100
    });

  } catch (error) {
    console.error('❌ [XP API] Error in POST request:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

