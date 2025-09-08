import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { bountyXPService } from '@/services/bounty-xp-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { submissionId, placement, walletAddress } = await request.json();

    if (!submissionId || !placement || !walletAddress) {
      return NextResponse.json({ 
        error: 'Missing required fields: submissionId, placement, walletAddress' 
      }, { status: 400 });
    }

    if (!['first', 'second', 'third'].includes(placement)) {
      return NextResponse.json({ 
        error: 'Invalid placement. Must be first, second, or third' 
      }, { status: 400 });
    }

    // Check if wallet is admin
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_wallet_admin', { 
      wallet: walletAddress 
    });

    if (adminError) {
      console.error('[ADMIN CHECK ERROR]', adminError);
      return NextResponse.json({ error: 'Failed to verify admin status' }, { status: 500 });
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get the submission details
    const { data: submission, error: submissionError } = await supabase
      .from('bounty_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError) {
      console.error('[FETCH SUBMISSION ERROR]', submissionError);
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.placement) {
      return NextResponse.json({ 
        error: 'This submission has already been awarded a placement' 
      }, { status: 400 });
    }

    // Get winner bonus from XP service
    const winnerBonus = bountyXPService.awardWinnerBonus(placement);

    // Update the submission with placement and bonus rewards
    const { data: updatedSubmission, error: updateError } = await supabase
      .from('bounty_submissions')
      .update({
        placement,
        xp_awarded: submission.xp_awarded + winnerBonus.xp,
        sol_prize: submission.sol_prize + winnerBonus.sol,
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (updateError) {
      console.error('[UPDATE SUBMISSION ERROR]', updateError);
      return NextResponse.json({ error: 'Failed to award winner' }, { status: 500 });
    }

    // Log the winner award activity
    try {
      await supabase
        .from('user_activity')
        .insert({
          wallet_address: submission.wallet_address,
          activity_type: 'bounty_winner_awarded',
          activity_data: {
            submission_id: submissionId,
            bounty_id: submission.bounty_id,
            placement,
            xp_bonus: winnerBonus.xp,
            sol_bonus: winnerBonus.sol
          }
        });
    } catch (logError) {
      console.warn('Failed to log winner award activity:', logError);
      // Don't fail the operation for logging errors
    }

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
      bonus: winnerBonus
    });

  } catch (error) {
    console.error('[AWARD WINNER API ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}