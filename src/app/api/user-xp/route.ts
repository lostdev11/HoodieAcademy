import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Get user data (XP is now stored in users table)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('wallet_address, total_xp, level')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[FETCH USER ERROR]', userError);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    // Get bounty submissions for this user (optional - table might not exist)
    let bountySubmissions = [];
    try {
      const { data: bountyData, error: bountyError } = await supabase
        .from('bounty_submissions')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('created_at', { ascending: false });

      if (bountyError && bountyError.code !== 'PGRST116') {
        console.warn('[FETCH BOUNTY SUBMISSIONS WARNING]', bountyError);
        // Don't fail the request if bounty submissions table doesn't exist
      } else {
        bountySubmissions = bountyData || [];
      }
    } catch (error) {
      console.warn('[BOUNTY SUBMISSIONS TABLE NOT FOUND]', error);
      // Table doesn't exist, that's fine
      bountySubmissions = [];
    }

    // Get XP transaction history (optional - table might not exist)
    let transactions = [];
    try {
      const { data: transactionData, error: transactionError } = await supabase
        .from('xp_transactions')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('created_at', { ascending: false })
        .limit(50); // Limit to last 50 transactions

      if (transactionError && transactionError.code !== 'PGRST116') {
        console.warn('[FETCH XP TRANSACTIONS WARNING]', transactionError);
        // Don't fail the request if transactions table doesn't exist
      } else {
        transactions = transactionData || [];
      }
    } catch (error) {
      console.warn('[XP TRANSACTIONS TABLE NOT FOUND]', error);
      // Table doesn't exist, that's fine
      transactions = [];
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
      xp: user || {
        wallet_address: walletAddress,
        total_xp: 0,
        level: 1
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