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

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 [DAILY LOGIN] Request received');
    const supabase = getSupabaseClient();
    
    const { walletAddress } = await request.json();
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const DAILY_LOGIN_XP = 5;

    console.log('📅 [DAILY LOGIN] Checking daily login for:', walletAddress, 'on', today);

    // Check if user already received daily login bonus today
    const { data: todayActivity, error: activityError } = await supabase
      .from('user_activity')
      .select('id')
      .eq('wallet_address', walletAddress)
      .eq('activity_type', 'daily_login_bonus')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)
      .single();

    if (activityError && activityError.code !== 'PGRST116') {
      console.error('❌ [DAILY LOGIN] Error checking today activity:', activityError);
      return NextResponse.json(
        { error: 'Failed to check daily login status' },
        { status: 500 }
      );
    }

    if (todayActivity) {
      console.log('⚠️ [DAILY LOGIN] User already received daily bonus today');
      return NextResponse.json({
        success: false,
        message: 'Daily login bonus already claimed today',
        alreadyClaimed: true,
        nextAvailable: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Get current user data
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('total_xp, level, display_name')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('❌ [DAILY LOGIN] Error fetching user:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If user doesn't exist, create them
    if (!currentUser) {
      console.log('👤 [DAILY LOGIN] User not found, creating new user:', walletAddress);
      const { data: newUser, error: createError } = await supabase
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
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ [DAILY LOGIN] Error creating user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }
    }

    // Calculate new XP and level
    const previousXP = currentUser?.total_xp || 0;
    const newTotalXP = previousXP + DAILY_LOGIN_XP;
    const newLevel = Math.floor(newTotalXP / 1000) + 1;
    const levelUp = newLevel > (currentUser?.level || 1);

    console.log('📊 [DAILY LOGIN] XP calculation:', {
      previousXP,
      dailyBonus: DAILY_LOGIN_XP,
      newTotalXP,
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
      .eq('wallet_address', walletAddress)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [DAILY LOGIN] Error updating user XP:', updateError);
      return NextResponse.json(
        { error: 'Failed to award daily login bonus' },
        { status: 500 }
      );
    }

    // Log the daily login bonus activity
    const { error: logError } = await supabase
      .from('user_activity')
      .insert({
        wallet_address: walletAddress,
        activity_type: 'daily_login_bonus',
        metadata: {
          xp_amount: DAILY_LOGIN_XP,
          reason: 'Daily login bonus',
          previous_xp: previousXP,
          new_total_xp: newTotalXP,
          level_up: levelUp,
          login_date: today
        },
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.error('⚠️ [DAILY LOGIN] Failed to log activity (non-critical):', logError);
    }

    console.log('✅ [DAILY LOGIN] Successfully awarded daily login bonus:', {
      wallet: walletAddress,
      xpAwarded: DAILY_LOGIN_XP,
      newTotalXP,
      levelUp
    });

    // Calculate next available time (24 hours from now)
    const nextAvailable = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return NextResponse.json({
      success: true,
      user: updatedUser,
      xpAwarded: DAILY_LOGIN_XP,
      newTotalXP: newTotalXP,
      levelUp: levelUp,
      message: `Daily login bonus: +${DAILY_LOGIN_XP} XP!`,
      nextAvailable: nextAvailable.toISOString(),
      // Include data for real-time updates
      refreshLeaderboard: true,
      targetWallet: walletAddress,
      newTotalXP,
      xpAwarded: DAILY_LOGIN_XP,
      reason: 'Daily login bonus',
      levelUp
    });

  } catch (error) {
    console.error('❌ [DAILY LOGIN] Error in daily login API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check daily login status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const today = new Date().toISOString().split('T')[0];

    // Check if user already received daily login bonus today
    const { data: todayActivity, error: activityError } = await supabase
      .from('user_activity')
      .select('created_at, metadata')
      .eq('wallet_address', walletAddress)
      .eq('activity_type', 'daily_login_bonus')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)
      .single();

    const alreadyClaimed = !activityError && todayActivity;

    return NextResponse.json({
      walletAddress,
      today: today,
      alreadyClaimed: alreadyClaimed,
      lastClaimed: alreadyClaimed ? todayActivity.created_at : null,
      nextAvailable: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      dailyBonusXP: 5
    });

  } catch (error) {
    console.error('❌ [DAILY LOGIN] Error in GET request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
