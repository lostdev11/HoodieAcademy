import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Mark as dynamic
export const dynamic = 'force-dynamic';

/**
 * POST /api/governance/vote
 * Cast a vote on a governance proposal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proposal_id, voter_wallet, vote_choice } = body;
    
    // Validation
    if (!proposal_id || !voter_wallet || !vote_choice) {
      return NextResponse.json(
        { error: 'Missing required fields: proposal_id, voter_wallet, vote_choice' },
        { status: 400 }
      );
    }
    
    if (!['for', 'against', 'abstain'].includes(vote_choice)) {
      return NextResponse.json(
        { error: 'Invalid vote_choice. Must be: for, against, or abstain' },
        { status: 400 }
      );
    }
    
    // Call database function to cast vote
    const { data, error } = await supabase
      .rpc('cast_governance_vote', {
        p_proposal_id: proposal_id,
        p_voter_wallet: voter_wallet,
        p_vote_choice: vote_choice
      });
    
    if (error) {
      console.error('Error casting vote:', error);
      return NextResponse.json(
        { error: 'Failed to cast vote', details: error.message },
        { status: 500 }
      );
    }
    
    // Check if vote was successful
    if (data && !data.success) {
      return NextResponse.json(
        { error: data.error || 'Vote failed' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      vote: data,
      message: 'Vote cast successfully'
    });
    
  } catch (error) {
    console.error('Error in vote POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/governance/vote
 * Get user's vote on a specific proposal
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const proposal_id = searchParams.get('proposal_id');
    const voter_wallet = searchParams.get('voter_wallet');
    
    if (!proposal_id || !voter_wallet) {
      return NextResponse.json(
        { error: 'Missing required parameters: proposal_id, voter_wallet' },
        { status: 400 }
      );
    }
    
    const { data: vote, error } = await supabase
      .from('governance_votes')
      .select('*')
      .eq('proposal_id', proposal_id)
      .eq('voter_wallet', voter_wallet)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching vote:', error);
      return NextResponse.json(
        { error: 'Failed to fetch vote', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      vote: vote || null,
      has_voted: !!vote
    });
    
  } catch (error) {
    console.error('Error in vote GET:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

