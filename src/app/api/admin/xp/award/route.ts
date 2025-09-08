import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { targetWallet, xpAmount, reason, awardedBy } = await request.json();

    if (!targetWallet || !xpAmount || !reason || !awardedBy) {
      return NextResponse.json({ 
        error: 'Missing required fields: targetWallet, xpAmount, reason, awardedBy' 
      }, { status: 400 });
    }

    if (xpAmount <= 0) {
      return NextResponse.json({ 
        error: 'XP amount must be positive' 
      }, { status: 400 });
    }

    // Check if awarding wallet is admin
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_wallet_admin', { 
      wallet: awardedBy 
    });

    if (adminError) {
      console.error('[ADMIN CHECK ERROR]', adminError);
      return NextResponse.json({ error: 'Failed to verify admin status' }, { status: 500 });
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get current user XP
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('total_xp')
      .eq('wallet_address', targetWallet)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('[FETCH USER ERROR]', userError);
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }

    const currentXP = user?.total_xp || 0;
    const newXP = currentXP + xpAmount;

    // Update user XP
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .upsert({
        wallet_address: targetWallet,
        total_xp: newXP,
        last_active: new Date().toISOString()
      }, {
        onConflict: 'wallet_address'
      })
      .select()
      .single();

    if (updateError) {
      console.error('[UPDATE USER XP ERROR]', updateError);
      return NextResponse.json({ error: 'Failed to update user XP' }, { status: 500 });
    }

    // Log the XP award activity
    try {
      await supabase
        .from('user_activity')
        .insert({
          wallet_address: targetWallet,
          activity_type: 'xp_awarded',
          activity_data: {
            xp_awarded: xpAmount,
            reason: reason,
            awarded_by: awardedBy,
            previous_xp: currentXP,
            new_xp: newXP
          }
        });
    } catch (logError) {
      console.warn('Failed to log XP award activity:', logError);
      // Don't fail the operation for logging errors
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      xpAwarded: xpAmount,
      previousXP: currentXP,
      newXP: newXP
    });

  } catch (error) {
    console.error('[ADMIN XP AWARD API ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
