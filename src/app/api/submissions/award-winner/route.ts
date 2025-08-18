import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      submissionId, 
      walletAddress, 
      bountyId, 
      placement, 
      xpBonus, 
      solPrize 
    } = body;

    if (!submissionId || !walletAddress || !bountyId || !placement) {
      return NextResponse.json({ 
        error: 'Missing required fields: submissionId, walletAddress, bountyId, placement' 
      }, { status: 400 });
    }

    // Validate placement
    if (!['first', 'second', 'third'].includes(placement)) {
      return NextResponse.json({ 
        error: 'Invalid placement. Must be first, second, or third' 
      }, { status: 400 });
    }

    // Award winner bonus using database function
    const { data: xpResult, error } = await supabase.rpc('award_winner_bonus', {
      p_wallet_address: walletAddress,
      p_bounty_id: bountyId,
      p_submission_id: submissionId,
      p_placement: placement,
      p_xp_bonus: xpBonus || 0,
      p_sol_prize: solPrize || 0
    });

    if (error) {
      console.error('[AWARD WINNER ERROR]', error);
      return NextResponse.json({ error: 'Failed to award winner bonus' }, { status: 500 });
    }

    console.log('[WINNER BONUS AWARDED]', {
      walletAddress,
      bountyId,
      submissionId,
      placement,
      xpBonus,
      solPrize
    });

    return NextResponse.json({
      success: true,
      totalXP: xpResult,
      placement,
      xpBonus,
      solPrize
    });

  } catch (error) {
    console.error('[AWARD WINNER ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 