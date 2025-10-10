import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for admin operations
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
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
    console.log('🎯 [XP AWARD] Request received');
    const supabase = getSupabaseClient();
    
    const { targetWallet, xpAmount, reason, awardedBy } = await request.json();
    console.log('📦 [XP AWARD] Request data:', { targetWallet, xpAmount, reason, awardedBy });

    if (!targetWallet || !xpAmount || !reason || !awardedBy) {
      console.error('❌ [XP AWARD] Missing required parameters');
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify admin access
    console.log('🔍 [XP AWARD] Verifying admin access for:', awardedBy);
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', awardedBy)
      .single();

    if (adminError || !adminUser?.is_admin) {
      console.error('❌ [XP AWARD] Admin check failed:', { adminError, adminUser });
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }
    
    console.log('✅ [XP AWARD] Admin access verified');

    // Get current user data
    console.log('🔍 [XP AWARD] Looking up user:', targetWallet);
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('wallet_address, display_name, total_xp, level, is_admin')
      .eq('wallet_address', targetWallet)
      .single();

    if (userError || !currentUser) {
      console.error('❌ [XP AWARD] User lookup failed:', { userError, currentUser });
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ [XP AWARD] User found:', { 
      wallet: currentUser.wallet_address, 
      displayName: currentUser.display_name,
      currentXP: currentUser.total_xp || 0,
      currentLevel: currentUser.level || 1
    });

    // Calculate new XP and level
    const newTotalXP = (currentUser.total_xp || 0) + xpAmount;
    const newLevel = Math.floor(newTotalXP / 1000) + 1; // 1000 XP per level

    // Update user XP and level
    const { data, error } = await supabase
      .from('users')
      .update({
        total_xp: newTotalXP,
        level: newLevel,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', targetWallet)
      .select()
      .single();

    if (error) {
      console.error('❌ [XP AWARD] Error updating user XP:', error);
      return NextResponse.json(
        { error: 'Failed to award XP', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ [XP AWARD] Successfully updated user XP:', {
      previousXP: currentUser.total_xp,
      newXP: newTotalXP,
      previousLevel: currentUser.level,
      newLevel: newLevel
    });

    // Log the XP award activity
    const { error: activityError } = await supabase
      .from('user_activity')
      .insert({
        wallet_address: targetWallet,
        activity_type: 'xp_awarded',
        metadata: {
          xp_amount: xpAmount,
          reason: reason,
          awarded_by: awardedBy,
          previous_xp: currentUser.total_xp || 0,
          new_total_xp: newTotalXP,
          level_up: newLevel > (currentUser.level || 1)
        },
        created_at: new Date().toISOString()
      });

    if (activityError) {
      console.error('⚠️  Failed to log activity (non-critical):', activityError);
    }

    // Trigger leaderboard refresh (this will be handled by the frontend)
    console.log('🔄 [XP AWARD] XP awarded, leaderboard should refresh automatically');

    return NextResponse.json({
      success: true,
      user: data,
      xpAwarded: xpAmount,
      newTotalXP: newTotalXP,
      levelUp: newLevel > (currentUser.level || 1),
      message: `Successfully awarded ${xpAmount} XP to user`,
      // Include data that frontend can use to trigger refresh
      refreshLeaderboard: true,
      targetWallet,
      newTotalXP,
      xpAwarded: xpAmount,
      reason
    });

  } catch (error) {
    console.error('Error in XP award API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}