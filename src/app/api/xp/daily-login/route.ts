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
    console.log('📅 [DAILY LOGIN] Processing login for:', walletAddress.slice(0, 10) + '...', 'on', today);

    // Use the auto-reward API with proper duplicate prevention
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const autoRewardResponse = await fetch(`${siteUrl}/api/xp/auto-reward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress,
        action: 'DAILY_LOGIN',
        referenceId: `login_${today}`, // Prevents duplicates for the same day
        metadata: {
          login_date: today,
          login_timestamp: new Date().toISOString()
        }
      })
    });

    const autoRewardData = await autoRewardResponse.json();

    // If already awarded or duplicate
    if (!autoRewardResponse.ok) {
      if (autoRewardData.duplicate) {
        console.log('⚠️ [DAILY LOGIN] Already claimed today');
        
        // Calculate next available (tomorrow at midnight)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        return NextResponse.json({
          success: false,
          message: 'Daily login bonus already claimed today',
          alreadyClaimed: true,
          nextAvailable: tomorrow.toISOString(),
          today
        });
      }
      
      // Other errors (daily cap, etc.)
      return NextResponse.json({
        success: false,
        message: autoRewardData.message || 'Failed to award daily login bonus',
        error: autoRewardData.error
      }, { status: autoRewardResponse.status });
    }

    // XP was successfully awarded via auto-reward API
    console.log('✅ [DAILY LOGIN] Successfully awarded daily login bonus via auto-reward');

    // Calculate next available time (tomorrow at midnight)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return NextResponse.json({
      success: true,
      user: autoRewardData.user,
      xpAwarded: autoRewardData.xpAwarded,
      newTotalXP: autoRewardData.newTotalXP,
      previousXP: autoRewardData.previousXP,
      levelUp: autoRewardData.levelUp,
      previousLevel: autoRewardData.previousLevel,
      newLevel: autoRewardData.newLevel,
      message: `Daily login bonus: +${autoRewardData.xpAwarded} XP!`,
      nextAvailable: tomorrow.toISOString(),
      today,
      // Include data for real-time updates
      refreshLeaderboard: true,
      targetWallet: walletAddress,
      reason: 'Daily login bonus',
      dailyProgress: autoRewardData.dailyProgress
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
