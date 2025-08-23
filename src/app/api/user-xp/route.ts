import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Get user XP data
    const { data: userXP, error: xpError } = await supabase
      .from('user_xp')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (xpError && xpError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[FETCH USER XP ERROR]', xpError);
      return NextResponse.json({ error: 'Failed to fetch user XP' }, { status: 500 });
    }

    // Get bounty submissions for this user
    const { data: bountySubmissions, error: bountyError } = await supabase
      .from('bounty_submissions')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false });

    if (bountyError) {
      console.error('[FETCH BOUNTY SUBMISSIONS ERROR]', bountyError);
      return NextResponse.json({ error: 'Failed to fetch bounty submissions' }, { status: 500 });
    }

    // Get XP transaction history
    const { data: transactions, error: transactionError } = await supabase
      .from('xp_transactions')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false })
      .limit(50); // Limit to last 50 transactions

    if (transactionError) {
      console.error('[FETCH XP TRANSACTIONS ERROR]', transactionError);
      return NextResponse.json({ error: 'Failed to fetch XP transactions' }, { status: 500 });
    }

    // Calculate XP breakdown
    const bountyXP = bountySubmissions?.reduce((total: number, sub: any) => total + (sub.xp_awarded || 0), 0) || 0;
    const winnerXP = bountySubmissions?.reduce((total: number, sub: any) => {
      if (sub.placement) {
        switch (sub.placement) {
          case 'first': return total + 250;
          case 'second': return total + 100;
          case 'third': return total + 50;
          default: return total;
        }
      }
      return total;
    }, 0) || 0;

    const response = {
      walletAddress,
      xp: userXP || {
        wallet_address: walletAddress,
        total_xp: 0,
        bounty_xp: 0,
        course_xp: 0,
        streak_xp: 0
      },
      bountySubmissions: bountySubmissions || [],
      transactions: transactions || [],
      breakdown: {
        totalBountyXP: bountyXP,
        winnerXP,
        participationXP: bountyXP - winnerXP
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[FETCH USER XP ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 