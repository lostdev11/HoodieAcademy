import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getXPReward, XP_REWARDS } from '@/lib/xp-rewards-config';

/**
 * Automatic XP Reward API
 * Awards XP for various actions with duplicate prevention and cooldown management
 */

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

interface AutoRewardRequest {
  walletAddress: string;
  action: string; // e.g., 'FEEDBACK_APPROVED', 'COURSE_COMPLETED'
  referenceId?: string; // e.g., feedback ID, course ID (for duplicate prevention)
  customXPAmount?: number; // Optional: override default XP amount
  metadata?: Record<string, any>; // Additional data to store
  skipDuplicateCheck?: boolean; // Optional: force award even if duplicate
}

/**
 * POST /api/xp/auto-reward
 * Automatically award XP for an action with duplicate prevention
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body: AutoRewardRequest = await request.json();
    
    const { 
      walletAddress, 
      action, 
      referenceId, 
      customXPAmount,
      metadata = {},
      skipDuplicateCheck = false
    } = body;

    console.log('🎁 [AUTO XP] Processing reward:', { 
      walletAddress: walletAddress?.slice(0, 10) + '...', 
      action, 
      referenceId 
    });

    // Validate required fields
    if (!walletAddress || !action) {
      return NextResponse.json(
        { error: 'walletAddress and action are required' },
        { status: 400 }
      );
    }

    // Get reward configuration
    const rewardConfig = getXPReward(action);
    
    if (!rewardConfig) {
      return NextResponse.json(
        { error: `Unknown action: ${action}. Check XP_REWARDS configuration.` },
        { status: 400 }
      );
    }

    if (!rewardConfig.enabled) {
      return NextResponse.json(
        { error: `Action ${action} is currently disabled` },
        { status: 400 }
      );
    }

    // Determine XP amount (custom or configured)
    // Use 'let' instead of 'const' because it may be capped by daily limit
    let xpAmount = customXPAmount || rewardConfig.xpAmount;

    if (xpAmount <= 0) {
      return NextResponse.json(
        { error: 'XP amount must be greater than 0' },
        { status: 400 }
      );
    }

    // === DUPLICATE PREVENTION ===
    if (!skipDuplicateCheck && referenceId) {
      const { data: existingReward, error: checkError } = await supabase
        .from('user_activity')
        .select('id, created_at')
        .eq('wallet_address', walletAddress)
        .eq('activity_type', 'xp_awarded')
        .filter('metadata->>action', 'eq', action)
        .filter('metadata->>reference_id', 'eq', referenceId)
        .maybeSingle();

      if (existingReward) {
        console.log('⚠️ [AUTO XP] Duplicate reward prevented:', { 
          action, 
          referenceId,
          previousAward: existingReward.created_at
        });
        
        return NextResponse.json({
          success: false,
          duplicate: true,
          message: `XP already awarded for ${action} (reference: ${referenceId})`,
          previousAward: existingReward.created_at
        }, { status: 409 }); // 409 Conflict
      }
    }

    // === DAILY LIMIT CHECK ===
    if (rewardConfig.maxPerDay) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todayRewards, error: limitError } = await supabase
        .from('user_activity')
        .select('id')
        .eq('wallet_address', walletAddress)
        .eq('activity_type', 'xp_awarded')
        .filter('metadata->>action', 'eq', action)
        .gte('created_at', today.toISOString());

      if (!limitError && todayRewards && todayRewards.length >= rewardConfig.maxPerDay) {
        console.log('⚠️ [AUTO XP] Daily limit reached:', { 
          action, 
          limit: rewardConfig.maxPerDay,
          current: todayRewards.length
        });
        
        return NextResponse.json({
          success: false,
          limitReached: true,
          message: `Daily limit reached for ${action} (${rewardConfig.maxPerDay} per day)`,
          currentCount: todayRewards.length,
          maxPerDay: rewardConfig.maxPerDay
        }, { status: 429 }); // 429 Too Many Requests
      }
    }

    // === COOLDOWN CHECK ===
    if (rewardConfig.cooldown) {
      const { data: lastReward, error: cooldownError } = await supabase
        .from('user_activity')
        .select('created_at')
        .eq('wallet_address', walletAddress)
        .eq('activity_type', 'xp_awarded')
        .filter('metadata->>action', 'eq', action)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastReward) {
        const cooldownMs = rewardConfig.cooldown * 60 * 60 * 1000; // Convert hours to ms
        const timeSinceLastReward = Date.now() - new Date(lastReward.created_at).getTime();
        
        if (timeSinceLastReward < cooldownMs) {
          const remainingMs = cooldownMs - timeSinceLastReward;
          const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
          
          console.log('⚠️ [AUTO XP] Cooldown active:', { 
            action, 
            remainingHours 
          });
          
          return NextResponse.json({
            success: false,
            cooldownActive: true,
            message: `Cooldown active for ${action}. Try again in ${remainingHours} hours.`,
            remainingHours
          }, { status: 429 });
        }
      }
    }

    // === DAILY XP CAP CHECK (300 XP max per day) ===
    const DAILY_XP_CAP = 300;
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all XP earned today
    const { data: todayXP, error: dailyCapError } = await supabase
      .from('user_activity')
      .select('metadata')
      .eq('wallet_address', walletAddress)
      .eq('activity_type', 'xp_awarded')
      .gte('created_at', today.toISOString());

    if (!dailyCapError && todayXP) {
      const totalXPToday = todayXP.reduce((sum, activity) => {
        return sum + (activity.metadata?.xp_amount || 0);
      }, 0);

      const xpRemaining = DAILY_XP_CAP - totalXPToday;

      // If user has hit the daily cap
      if (totalXPToday >= DAILY_XP_CAP) {
        console.log('⚠️ [AUTO XP] Daily cap reached:', { 
          walletAddress: walletAddress.slice(0, 10) + '...',
          totalXPToday,
          dailyCap: DAILY_XP_CAP
        });
        
        return NextResponse.json({
          success: false,
          dailyCapReached: true,
          message: `Daily XP cap reached (${DAILY_XP_CAP} XP/day). Come back tomorrow!`,
          totalXPToday,
          dailyCap: DAILY_XP_CAP,
          xpRemaining: 0
        }, { status: 429 });
      }

      // If this award would exceed the daily cap, cap it
      if (totalXPToday + xpAmount > DAILY_XP_CAP) {
        const originalAmount = xpAmount;
        xpAmount = xpRemaining;
        console.log('⚠️ [AUTO XP] Capping XP to daily limit:', { 
          originalAmount,
          cappedAmount: xpAmount,
          totalXPToday,
          xpRemaining
        });
      }
    }

    // === AWARD XP ===
    // Get or create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('total_xp, level, wallet_address, display_name')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (userError && userError.code !== 'PGRST116') {
      console.error('❌ [AUTO XP] Error fetching user:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user', details: userError.message },
        { status: 500 }
      );
    }

    // Create user if doesn't exist
    if (!user) {
      const { error: createError } = await supabase
        .from('users')
        .upsert({
          wallet_address: walletAddress,
          display_name: `User ${walletAddress.slice(0, 6)}...`,
          total_xp: 0,
          level: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'wallet_address'
        });

      if (createError) {
        console.error('❌ [AUTO XP] Error creating user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user', details: createError.message },
          { status: 500 }
        );
      }
    }

    // Calculate new XP and level
    const previousXP = user?.total_xp || 0;
    const newTotalXP = previousXP + xpAmount;
    const previousLevel = user?.level || 1;
    const newLevel = Math.floor(newTotalXP / 1000) + 1;
    const levelUp = newLevel > previousLevel;

    // Update user XP
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        total_xp: newTotalXP,
        level: newLevel,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', walletAddress)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [AUTO XP] Error updating user XP:', updateError);
      return NextResponse.json(
        { error: 'Failed to award XP', details: updateError.message },
        { status: 500 }
      );
    }

    // Log activity
    const activityMetadata = {
      xp_amount: xpAmount,
      action: action,
      reference_id: referenceId,
      reason: rewardConfig.description,
      category: rewardConfig.category,
      previous_xp: previousXP,
      new_total_xp: newTotalXP,
      previous_level: previousLevel,
      new_level: newLevel,
      level_up: levelUp,
      ...metadata
    };

    const { error: activityError } = await supabase
      .from('user_activity')
      .insert({
        wallet_address: walletAddress,
        activity_type: 'xp_awarded',
        metadata: activityMetadata,
        created_at: new Date().toISOString()
      });

    if (activityError) {
      console.error('⚠️ [AUTO XP] Failed to log activity:', activityError);
    }

    // Calculate updated daily totals (reuse DAILY_XP_CAP and today from above)
    const { data: updatedTodayXP } = await supabase
      .from('user_activity')
      .select('metadata')
      .eq('wallet_address', walletAddress)
      .eq('activity_type', 'xp_awarded')
      .gte('created_at', today.toISOString());

    const newTotalXPToday = updatedTodayXP?.reduce((sum, activity) => {
      return sum + (activity.metadata?.xp_amount || 0);
    }, 0) || 0;

    const xpRemainingToday = Math.max(0, DAILY_XP_CAP - newTotalXPToday);

    console.log('✅ [AUTO XP] Reward awarded successfully:', {
      wallet: walletAddress.slice(0, 10) + '...',
      action,
      xpAmount,
      newTotalXP,
      levelUp,
      xpRemainingToday
    });

    return NextResponse.json({
      success: true,
      xpAwarded: xpAmount,
      action,
      reason: rewardConfig.description,
      previousXP,
      newTotalXP,
      previousLevel,
      newLevel,
      levelUp,
      referenceId,
      message: `${xpAmount} XP awarded for ${rewardConfig.description}`,
      user: updatedUser,
      dailyProgress: {
        earnedToday: newTotalXPToday,
        dailyCap: DAILY_XP_CAP,
        remaining: xpRemainingToday,
        percentUsed: Math.round((newTotalXPToday / DAILY_XP_CAP) * 100)
      }
    });

  } catch (error) {
    console.error('❌ [AUTO XP] Unexpected error:', error);
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
 * GET /api/xp/auto-reward
 * Get available XP reward actions and their configurations
 * OR get user's daily XP progress
 * 
 * Query params:
 *   - action: Get specific action config
 *   - wallet: Get user's daily XP progress
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const walletAddress = searchParams.get('wallet');

    // If requesting daily XP progress for a user
    if (walletAddress) {
      const DAILY_XP_CAP = 300;
      
      try {
        const supabase = getSupabaseClient();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: todayXP, error } = await supabase
          .from('user_activity')
          .select('metadata, created_at')
          .eq('wallet_address', walletAddress)
          .eq('activity_type', 'xp_awarded')
          .gte('created_at', today.toISOString())
          .order('created_at', { ascending: false });

        // If table doesn't exist or other error, return default values
        if (error) {
          console.warn('⚠️ [AUTO XP] Table might not exist, returning defaults:', error.message);
          return NextResponse.json({
            success: true,
            dailyProgress: {
              earnedToday: 0,
              dailyCap: DAILY_XP_CAP,
              remaining: DAILY_XP_CAP,
              percentUsed: 0,
              capReached: false
            },
            recentActivities: [],
            tableNotSetup: true
          });
        }

        const totalXPToday = todayXP?.reduce((sum, activity) => {
          return sum + (activity.metadata?.xp_amount || 0);
        }, 0) || 0;

        const xpRemaining = Math.max(0, DAILY_XP_CAP - totalXPToday);
        const percentUsed = Math.round((totalXPToday / DAILY_XP_CAP) * 100);

        return NextResponse.json({
          success: true,
          dailyProgress: {
            earnedToday: totalXPToday,
            dailyCap: DAILY_XP_CAP,
            remaining: xpRemaining,
            percentUsed,
            capReached: totalXPToday >= DAILY_XP_CAP
          },
          recentActivities: todayXP?.map(activity => ({
            action: activity.metadata?.action,
            xpAmount: activity.metadata?.xp_amount,
            reason: activity.metadata?.reason,
            timestamp: activity.created_at
          })).slice(0, 10) || []
        });
      } catch (innerError) {
        console.error('❌ [AUTO XP] Error in GET daily progress:', innerError);
        // Return safe defaults instead of crashing - MUST return valid JSON
        return NextResponse.json({
          success: true,
          dailyProgress: {
            earnedToday: 0,
            dailyCap: DAILY_XP_CAP,
            remaining: DAILY_XP_CAP,
            percentUsed: 0,
            capReached: false
          },
          recentActivities: [],
          error: 'Failed to fetch progress, using defaults'
        });
      }
    }

    // If specific action requested
    if (action) {
      const config = getXPReward(action);
      if (!config) {
        return NextResponse.json(
          { error: `Action ${action} not found` },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ action, ...config });
    }

    // Return all enabled actions with daily cap info
    const enabledActions = Object.entries(XP_REWARDS)
      .filter(([_, config]) => config.enabled)
      .map(([key, config]) => ({
        action: key,
        ...config
      }));

    return NextResponse.json({
      actions: enabledActions,
      totalActions: enabledActions.length,
      dailyXPCap: 300,
      message: 'Maximum 300 XP can be earned per day from all activities'
    });

  } catch (error) {
    console.error('❌ [AUTO XP] Error in GET request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

