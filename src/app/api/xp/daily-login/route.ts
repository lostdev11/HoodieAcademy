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
    const referenceId = `login_${today}`;
    
    console.log('📅 [DAILY LOGIN] Processing login for:', walletAddress.slice(0, 10) + '...', 'on', today);

    // === OPTIMIZED: Direct database calls instead of HTTP fetch ===
    
    // 1. Check for duplicate (fast check)
    const { data: existingReward } = await supabase
      .from('xp_rewards')
      .select('id')
      .eq('wallet_address', walletAddress)
      .eq('reference_id', referenceId)
      .maybeSingle();

    if (existingReward) {
      console.log('⚠️ [DAILY LOGIN] Already claimed today');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      return NextResponse.json({
        success: false,
        message: 'Daily login bonus already claimed today',
        alreadyClaimed: true,
        duplicate: true,
        nextAvailable: tomorrow.toISOString(),
        today
      });
    }

    // 2. Get current user XP (fast single query)
    const { data: userXP } = await supabase
      .from('user_xp')
      .select('wallet_address, total_xp, level')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    const previousXP = userXP?.total_xp || 0;
    const previousLevel = userXP?.level || 1;
    const xpAmount = 5; // Daily login bonus is always 5 XP
    const newTotalXP = previousXP + xpAmount;
    const newLevel = Math.floor(newTotalXP / 1000) + 1;
    const levelUp = newLevel > previousLevel;

    // 3. Update XP (upsert for speed)
    const { error: xpError } = await supabase
      .from('user_xp')
      .upsert({
        wallet_address: walletAddress,
        total_xp: newTotalXP,
        level: newLevel,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'wallet_address'
      });

    if (xpError) {
      console.error('❌ [DAILY LOGIN] Error updating XP:', xpError);
      return NextResponse.json(
        { error: 'Failed to update XP' },
        { status: 500 }
      );
    }

    // 4. Record the reward (fire and forget - don't wait)
    supabase
      .from('xp_rewards')
      .insert({
        wallet_address: walletAddress,
        action: 'DAILY_LOGIN',
        xp_amount: xpAmount,
        reference_id: referenceId,
        metadata: {
          login_date: today,
          login_timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      })
      .then(() => console.log('✅ [DAILY LOGIN] Reward recorded'))
      .catch((err) => console.warn('⚠️ [DAILY LOGIN] Failed to record reward:', err));

    console.log('✅ [DAILY LOGIN] Daily bonus awarded:', xpAmount, 'XP');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return NextResponse.json({
      success: true,
      xpAwarded: xpAmount,
      newTotalXP,
      previousXP,
      levelUp,
      previousLevel,
      newLevel,
      message: `Daily login bonus: +${xpAmount} XP!`,
      nextAvailable: tomorrow.toISOString(),
      today,
      refreshLeaderboard: true,
      targetWallet: walletAddress,
      reason: 'Daily login bonus'
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
    // Get the most recent daily login claim (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - (24 * 60 * 60 * 1000));
    
    const { data: recentActivity, error: activityError } = await supabase
      .from('user_activity')
      .select('created_at, metadata')
      .eq('wallet_address', walletAddress)
      .eq('activity_type', 'daily_login_bonus')
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const alreadyClaimed = !activityError && recentActivity;

    // Calculate next available time (24 hours from last claim, or now if never claimed)
    let nextAvailable: Date;
    if (alreadyClaimed && recentActivity) {
      const lastClaimTime = new Date(recentActivity.created_at);
      nextAvailable = new Date(lastClaimTime.getTime() + (24 * 60 * 60 * 1000)); // 24 hours from last claim
    } else {
      nextAvailable = new Date(); // Available now
    }

    return NextResponse.json({
      walletAddress,
      today: today,
      alreadyClaimed: alreadyClaimed,
      lastClaimed: alreadyClaimed ? recentActivity.created_at : null,
      nextAvailable: nextAvailable.toISOString(),
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
