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
    console.log('🎯 [XP BOUNTY] Request received');
    const supabase = getSupabaseClient();
    
    const { 
      targetWallet, 
      xpAmount, 
      reason, 
      awardedBy, 
      bountyType = 'manual',
      metadata = {} 
    } = await request.json();
    
    console.log('📦 [XP BOUNTY] Request data:', { 
      targetWallet, 
      xpAmount, 
      reason, 
      awardedBy, 
      bountyType,
      metadata 
    });

    if (!targetWallet || !xpAmount || !reason) {
      console.error('❌ [XP BOUNTY] Missing required parameters');
      return NextResponse.json(
        { error: 'Missing required parameters: targetWallet, xpAmount, reason' },
        { status: 400 }
      );
    }

    // For admin awards, verify admin access
    if (bountyType === 'admin' && awardedBy) {
      console.log('🔍 [XP BOUNTY] Verifying admin access for:', awardedBy);
      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('wallet_address', awardedBy)
        .single();

      if (adminError || !adminUser?.is_admin) {
        console.error('❌ [XP BOUNTY] Admin check failed:', { adminError, adminUser });
        return NextResponse.json(
          { error: 'Unauthorized: Admin access required' },
          { status: 403 }
        );
      }
    }

    // Get current user data
    console.log('👤 [XP BOUNTY] Fetching current user data for:', targetWallet);
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('total_xp, level, display_name')
      .eq('wallet_address', targetWallet)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('❌ [XP BOUNTY] Error fetching user:', userError);
      return NextResponse.json(
        { error: 'User not found', details: userError.message },
        { status: 404 }
      );
    }

    // If user doesn't exist, create them
    if (!currentUser) {
      console.log('👤 [XP BOUNTY] User not found, creating new user:', targetWallet);
      const { data: newUser, error: createError } = await supabase
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
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ [XP BOUNTY] Error creating user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user', details: createError.message },
          { status: 500 }
        );
      }
    }

    // Calculate new XP and level
    const previousXP = currentUser?.total_xp || 0;
    const newTotalXP = previousXP + xpAmount;
    const newLevel = Math.floor(newTotalXP / 1000) + 1; // 1000 XP per level
    const levelUp = newLevel > (currentUser?.level || 1);

    console.log('📊 [XP BOUNTY] XP calculation:', {
      previousXP,
      xpAmount,
      newTotalXP,
      previousLevel: currentUser?.level || 1,
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
      console.error('❌ [XP BOUNTY] Error updating user XP:', updateError);
      return NextResponse.json(
        { error: 'Failed to award XP', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('✅ [XP BOUNTY] Successfully updated user XP:', {
      wallet: targetWallet,
      previousXP,
      newXP: newTotalXP,
      levelUp
    });

    // Log the XP bounty activity
    const { error: activityError } = await supabase
      .from('user_activity')
      .insert({
        wallet_address: targetWallet,
        activity_type: 'xp_bounty',
        metadata: {
          xp_amount: xpAmount,
          reason: reason,
          bounty_type: bountyType,
          awarded_by: awardedBy || 'system',
          previous_xp: previousXP,
          new_total_xp: newTotalXP,
          level_up: levelUp,
          ...metadata
        },
        created_at: new Date().toISOString()
      });

    if (activityError) {
      console.error('⚠️ [XP BOUNTY] Failed to log activity (non-critical):', activityError);
    }

    // Trigger real-time updates
    console.log('🔄 [XP BOUNTY] XP awarded, triggering real-time updates');

    return NextResponse.json({
      success: true,
      user: updatedUser,
      xpAwarded: xpAmount,
      newTotalXP: newTotalXP,
      levelUp: levelUp,
      bountyType: bountyType,
      message: `Successfully awarded ${xpAmount} XP for ${reason}`,
      // Include data for real-time updates
      refreshLeaderboard: true,
      targetWallet,
      newTotalXP,
      xpAwarded: xpAmount,
      reason,
      levelUp
    });

  } catch (error) {
    console.error('❌ [XP BOUNTY] Error in XP bounty API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check XP bounty status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    const bountyType = searchParams.get('type');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Get user's current XP and recent bounty activities
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('total_xp, level, display_name')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get recent bounty activities
    const { data: activities, error: activityError } = await supabase
      .from('user_activity')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('activity_type', 'xp_bounty')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      user: {
        wallet_address: walletAddress,
        total_xp: user.total_xp,
        level: user.level,
        display_name: user.display_name
      },
      recentBounties: activities || [],
      bountyType: bountyType || 'all'
    });

  } catch (error) {
    console.error('❌ [XP BOUNTY] Error in GET request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
