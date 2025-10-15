import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Mark as dynamic
export const dynamic = 'force-dynamic';

/**
 * POST /api/xp/award-auto
 * Auto-award XP for various activities
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address, xp_amount, activity_type, metadata = {} } = body;
    
    // Validation
    if (!wallet_address || !xp_amount || !activity_type) {
      return NextResponse.json(
        { error: 'Missing required fields: wallet_address, xp_amount, activity_type' },
        { status: 400 }
      );
    }
    
    if (xp_amount <= 0) {
      return NextResponse.json(
        { error: 'XP amount must be positive' },
        { status: 400 }
      );
    }
    
    // Call database function to award XP
    const { data, error } = await supabase
      .rpc('award_xp', {
        p_wallet_address: wallet_address,
        p_xp_amount: xp_amount,
        p_activity_type: activity_type,
        p_metadata: metadata
      });
    
    if (error) {
      console.error('Error awarding XP:', error);
      return NextResponse.json(
        { error: 'Failed to award XP', details: error.message },
        { status: 500 }
      );
    }
    
    console.log(`✅ Awarded ${xp_amount} XP to ${wallet_address} for ${activity_type}`);
    
    return NextResponse.json({
      success: true,
      result: data,
      message: `Awarded ${xp_amount} XP${data.leveled_up ? ' and leveled up!' : ''}`
    });
    
  } catch (error) {
    console.error('Error in award-auto POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/xp/award-auto
 * Get user's XP data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    
    if (!wallet) {
      return NextResponse.json(
        { error: 'Missing wallet parameter' },
        { status: 400 }
      );
    }
    
    // Call database function to get XP
    const { data, error } = await supabase
      .rpc('get_user_xp', {
        p_wallet_address: wallet
      });
    
    if (error) {
      console.error('Error fetching XP:', error);
      return NextResponse.json(
        { error: 'Failed to fetch XP', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      xp: data || {
        wallet_address: wallet,
        total_xp: 0,
        level: 1,
        exists: false
      }
    });
    
  } catch (error) {
    console.error('Error in award-auto GET:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

