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

    // Get user's bounty submissions
    const { data: bountySubmissions, error: bountyError } = await supabase
      .from('bounty_submissions')
      .select(`
        *,
        submissions:submission_id (
          id,
          title,
          description,
          image_url,
          created_at
        )
      `)
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false });

    if (bountyError) {
      console.error('[FETCH USER BOUNTIES ERROR]', bountyError);
      return NextResponse.json({ error: 'Failed to fetch user bounties' }, { status: 500 });
    }

    // Get bounty details for each submission
    const bountyIds = Array.from(new Set(bountySubmissions?.map(sub => sub.bounty_id) || []));
    const { data: bounties, error: bountiesError } = await supabase
      .from('bounties')
      .select('*')
      .in('id', bountyIds);

    if (bountiesError) {
      console.error('[FETCH BOUNTIES ERROR]', bountiesError);
      return NextResponse.json({ error: 'Failed to fetch bounty details' }, { status: 500 });
    }

    // Combine submission data with bounty details
    const enrichedSubmissions = bountySubmissions?.map(submission => {
      const bounty = bounties?.find(b => b.id === submission.bounty_id);
      return {
        ...submission,
        bounty: bounty,
        submission: submission.submissions
      };
    }) || [];

    // Calculate stats
    const totalSubmissions = enrichedSubmissions.length;
    const totalXP = enrichedSubmissions.reduce((sum, sub) => sum + (sub.xp_awarded || 0), 0);
    const totalSOL = enrichedSubmissions.reduce((sum, sub) => sum + (sub.sol_prize || 0), 0);
    const wins = enrichedSubmissions.filter(sub => sub.placement).length;
    const pendingSubmissions = enrichedSubmissions.filter(sub => !sub.placement).length;

    return NextResponse.json({
      submissions: enrichedSubmissions,
      stats: {
        totalSubmissions,
        totalXP,
        totalSOL,
        wins,
        pendingSubmissions
      }
    });

  } catch (error) {
    console.error('[USER BOUNTIES API ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

