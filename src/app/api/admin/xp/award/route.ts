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

    // Get current user data from both tables to ensure consistency
    console.log('🔍 [XP AWARD] Looking up user:', targetWallet);
    
    const { data: userXP } = await supabase
      .from('user_xp')
      .select('wallet_address, total_xp, level')
      .eq('wallet_address', targetWallet)
      .maybeSingle();

    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('wallet_address, display_name, total_xp, level, is_admin')
      .eq('wallet_address', targetWallet)
      .maybeSingle();

    if (userError && userError.code !== 'PGRST116') {
      console.error('❌ [XP AWARD] User lookup failed:', { userError, currentUser });
      return NextResponse.json(
        { error: 'User lookup failed', details: userError.message },
        { status: 500 }
      );
    }

    if (!currentUser && !userXP) {
      console.error('❌ [XP AWARD] User not found in either table');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Use the highest XP value from either table as the source of truth
    const previousXP = Math.max(userXP?.total_xp || 0, currentUser?.total_xp || 0);
    const previousLevel = Math.max(userXP?.level || 1, currentUser?.level || 1);
    
    console.log('✅ [XP AWARD] User found:', { 
      wallet: currentUser?.wallet_address || userXP?.wallet_address || targetWallet, 
      displayName: currentUser?.display_name || 'Unknown',
      userXP_from_db: userXP?.total_xp || 0,
      user_from_db: currentUser?.total_xp || 0,
      previousXP,
      previousLevel
    });

    // Calculate new XP and level
    const newTotalXP = previousXP + xpAmount;
    const newLevel = Math.floor(newTotalXP / 1000) + 1; // 1000 XP per level

    // Update XP in user_xp table (upsert) - this is the source of truth for some views
    const { error: xpError } = await supabase
      .from('user_xp')
      .upsert({
        wallet_address: targetWallet,
        total_xp: newTotalXP,
        level: newLevel,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'wallet_address'
      });

    if (xpError) {
      console.error('❌ [XP AWARD] Error updating user_xp:', xpError);
      return NextResponse.json(
        { error: 'Failed to award XP', details: xpError.message },
        { status: 500 }
      );
    }

    // Also update users table to keep in sync
    const userToUpsert: any = {
      wallet_address: targetWallet,
      total_xp: newTotalXP,
      level: newLevel,
      updated_at: new Date().toISOString()
    };

    // If user doesn't exist in users table, create them with basic info
    if (!currentUser) {
      userToUpsert.display_name = `User ${targetWallet.slice(0, 6)}...`;
      userToUpsert.created_at = new Date().toISOString();
    } else {
      // Preserve existing display_name if updating
      userToUpsert.display_name = currentUser.display_name;
    }

    const { data, error } = await supabase
      .from('users')
      .upsert(userToUpsert, {
        onConflict: 'wallet_address'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [XP AWARD] Error updating user XP:', error);
      return NextResponse.json(
        { error: 'Failed to award XP', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ [XP AWARD] Successfully updated user XP in both tables:', {
      previousXP,
      newXP: newTotalXP,
      previousLevel,
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
          previous_xp: previousXP,
          new_total_xp: newTotalXP,
          level_up: newLevel > previousLevel
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
      levelUp: newLevel > previousLevel,
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