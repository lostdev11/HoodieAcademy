import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Mark as dynamic
export const dynamic = 'force-dynamic';

/**
 * POST /api/governance/finalize
 * Finalize a governance proposal (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proposal_id, admin_wallet } = body;
    
    // Validation
    if (!proposal_id || !admin_wallet) {
      return NextResponse.json(
        { error: 'Missing required fields: proposal_id, admin_wallet' },
        { status: 400 }
      );
    }
    
    // Call database function to finalize proposal
    const { data, error } = await supabase
      .rpc('finalize_proposal', {
        p_proposal_id: proposal_id,
        p_admin_wallet: admin_wallet
      });
    
    if (error) {
      console.error('Error finalizing proposal:', error);
      return NextResponse.json(
        { error: 'Failed to finalize proposal', details: error.message },
        { status: 500 }
      );
    }
    
    // Check if finalization was successful
    if (data && !data.success) {
      return NextResponse.json(
        { error: data.error || 'Finalization failed' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({
      success: true,
      result: data,
      message: `Proposal ${data.result === 'passed' ? 'passed' : 'rejected'} successfully`
    });
    
  } catch (error) {
    console.error('Error in finalize POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

