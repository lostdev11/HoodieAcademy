import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Mark as dynamic
export const dynamic = 'force-dynamic';

/**
 * GET /api/governance/voting-power
 * Get user's voting power (based on HOOD + XP)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    
    if (!wallet) {
      return NextResponse.json(
        { error: 'Missing required parameter: wallet' },
        { status: 400 }
      );
    }
    
    // Call database function to get voting power
    const { data, error } = await supabase
      .rpc('get_user_voting_power', {
        p_wallet_address: wallet
      });
    
    if (error) {
      console.error('Error fetching voting power:', error);
      return NextResponse.json(
        { error: 'Failed to fetch voting power', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      voting_power: data || {
        wallet_address: wallet,
        hood_balance: 0,
        xp_amount: 0,
        voting_power: 0,
        hood_contribution: 0,
        xp_contribution: 0
      }
    });
    
  } catch (error) {
    console.error('Error in voting-power GET:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

