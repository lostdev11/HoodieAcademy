import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Mark as dynamic
export const dynamic = 'force-dynamic';

/**
 * GET /api/governance/tokenomics
 * Get HOOD token allocation breakdown
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch all allocations
    const { data: allocations, error } = await supabase
      .from('hood_token_allocations')
      .select('*')
      .order('percentage', { ascending: false });
    
    if (error) {
      console.error('Error fetching tokenomics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tokenomics', details: error.message },
        { status: 500 }
      );
    }
    
    // Calculate totals
    const totals = {
      total_supply: 1000000000, // 1 billion
      total_locked: 0,
      total_unlocked: 0,
      total_circulating: 0
    };
    
    if (allocations) {
      totals.total_locked = allocations.reduce((sum, a) => sum + (a.locked_tokens || 0), 0);
      totals.total_unlocked = allocations.reduce((sum, a) => sum + (a.unlocked_tokens || 0), 0);
      totals.total_circulating = totals.total_unlocked;
    }
    
    // Fetch recent unlock history
    const { data: unlockHistory, error: historyError } = await supabase
      .from('hood_unlock_history')
      .select('*')
      .order('unlocked_at', { ascending: false })
      .limit(10);
    
    if (historyError) {
      console.warn('Error fetching unlock history:', historyError);
    }
    
    return NextResponse.json({
      success: true,
      allocations: allocations || [],
      totals,
      unlock_history: unlockHistory || [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in tokenomics GET:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

