'use client';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Get user's bounty completions with bounty details
    const { data: completions, error: completionsError } = await supabase
      .from('user_bounty_completions')
      .select(`
        *,
        bounties:bounty_id (
          id,
          title,
          short_desc,
          reward,
          reward_type,
          squad_tag
        )
      `)
      .eq('wallet_address', walletAddress)
      .order('completed_at', { ascending: false });

    if (completionsError) {
      console.error('[FETCH BOUNTY COMPLETIONS ERROR]', completionsError);
      return NextResponse.json({ error: 'Failed to fetch bounty completions' }, { status: 500 });
    }

    // Get total completed bounties count
    const { count: totalCompleted, error: countError } = await supabase
      .from('user_bounty_completions')
      .select('*', { count: 'exact', head: true })
      .eq('wallet_address', walletAddress);

    if (countError) {
      console.warn('[COUNT ERROR]', countError);
    }

    // Get total XP earned from bounties
    const { data: xpData, error: xpError } = await supabase
      .from('user_bounty_completions')
      .select('xp_awarded')
      .eq('wallet_address', walletAddress);

    const totalBountyXP = xpData?.reduce((sum, completion) => sum + (completion.xp_awarded || 0), 0) || 0;

    return NextResponse.json({
      completions: completions || [],
      totalCompleted: totalCompleted || 0,
      totalBountyXP,
      success: true
    });

  } catch (error) {
    console.error('[BOUNTY COMPLETIONS API ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
