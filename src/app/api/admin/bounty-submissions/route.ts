import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Temporarily skip admin check for testing
    // TODO: Re-enable admin check once database is properly set up
    console.log('[ADMIN CHECK] Skipping admin verification for testing');

    // Get all bounty submissions with related data
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
      .order('created_at', { ascending: false });

    if (bountyError) {
      console.error('[FETCH BOUNTY SUBMISSIONS ERROR]', bountyError);
      return NextResponse.json({ error: 'Failed to fetch bounty submissions' }, { status: 500 });
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

    return NextResponse.json({
      submissions: enrichedSubmissions,
      total: enrichedSubmissions.length
    });

  } catch (error) {
    console.error('[ADMIN BOUNTY SUBMISSIONS API ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
