import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { targetWallet, xpAmount, reason, awardedBy } = await request.json();

    if (!targetWallet || !xpAmount || !reason || !awardedBy) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify admin access
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', awardedBy)
      .single();

    if (adminError || !adminUser?.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Get current user data
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('total_xp, level')
      .eq('wallet_address', targetWallet)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

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
      console.error('Error updating user XP:', error);
      return NextResponse.json(
        { error: 'Failed to award XP' },
        { status: 500 }
      );
    }

    // Log the XP award activity
    await supabase
      .from('user_activity')
      .insert({
        wallet_address: targetWallet,
        activity_type: 'xp_awarded',
        activity_data: {
          xp_amount: xpAmount,
          reason: reason,
          awarded_by: awardedBy,
          previous_xp: currentUser.total_xp || 0,
          new_total_xp: newTotalXP,
          level_up: newLevel > (currentUser.level || 1)
        },
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      user: data,
      xpAwarded: xpAmount,
      newTotalXP: newTotalXP,
      levelUp: newLevel > (currentUser.level || 1),
      message: `Successfully awarded ${xpAmount} XP to user`
    });

  } catch (error) {
    console.error('Error in XP award API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}