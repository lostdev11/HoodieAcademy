import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    const bountyIdsParam = searchParams.get('bountyIds');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    if (!bountyIdsParam) {
      return NextResponse.json({ submissions: {} });
    }

    const bountyIds = bountyIdsParam.split(',').filter(id => id);

    if (bountyIds.length === 0) {
      return NextResponse.json({ submissions: {} });
    }

    // Fetch all user submissions for the specified bounties in a single query
    const { data: submissions, error } = await supabase
      .from('bounty_submissions')
      .select('*')
      .eq('wallet_address', walletAddress)
      .in('bounty_id', bountyIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }

    // Organize submissions by bounty_id
    const submissionsByBounty: { [bountyId: string]: any } = {};
    
    if (submissions) {
      // Get the most recent submission for each bounty
      for (const submission of submissions) {
        const bountyId = submission.bounty_id;
        if (!submissionsByBounty[bountyId] || 
            new Date(submission.created_at) > new Date(submissionsByBounty[bountyId].created_at)) {
          submissionsByBounty[bountyId] = submission;
        }
      }
    }

    return NextResponse.json({ 
      submissions: submissionsByBounty,
      total: Object.keys(submissionsByBounty).length
    });

  } catch (error) {
    console.error('Error in submissions batch API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

