import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    console.log('[ADMIN SUBMISSIONS API] Fetching all submissions for admin review...');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch submissions from both tables
    const [submissionsResult, bountySubmissionsResult] = await Promise.all([
      // Regular submissions
      supabase
        .from('submissions')
        .select(`
          *,
          bounties (
            id,
            title,
            short_desc,
            reward,
            reward_type
          )
        `)
        .order('created_at', { ascending: false }),
      
      // Bounty submissions
      supabase
        .from('bounty_submissions')
        .select(`
          *,
          bounties (
            id,
            title,
            short_desc,
            reward,
            reward_type
          )
        `)
        .order('created_at', { ascending: false })
    ]);

    if (submissionsResult.error) {
      console.warn('[ADMIN SUBMISSIONS API] Error fetching regular submissions:', submissionsResult.error);
    }

    if (bountySubmissionsResult.error) {
      console.warn('[ADMIN SUBMISSIONS API] Error fetching bounty submissions:', bountySubmissionsResult.error);
    }

    // Transform regular submissions
    const regularSubmissions = (submissionsResult.data || []).map(submission => ({
      id: submission.id,
      wallet_address: submission.wallet_address,
      bounty_id: submission.bounty_id,
      submission_id: submission.id,
      xp_awarded: 0,
      placement: null,
      sol_prize: 0,
      status: submission.status,
      created_at: submission.created_at,
      updated_at: submission.updated_at,
      table: 'submissions',
      bounty: submission.bounties,
      submission: {
        id: submission.id,
        title: submission.title,
        description: submission.description,
        image_url: submission.image_url,
        created_at: submission.created_at,
        status: submission.status
      }
    }));

    // Transform bounty submissions
    const bountySubmissions = (bountySubmissionsResult.data || []).map(submission => ({
      id: submission.id,
      wallet_address: submission.wallet_address,
      bounty_id: submission.bounty_id,
      submission_id: submission.id,
      xp_awarded: 0,
      placement: null,
      sol_prize: 0,
      status: submission.status,
      created_at: submission.created_at,
      updated_at: submission.updated_at,
      table: 'bounty_submissions',
      bounty: submission.bounties,
      submission: {
        id: submission.id,
        title: `Bounty Submission for ${submission.bounties?.title || 'Unknown Bounty'}`,
        description: submission.submission_content,
        image_url: null,
        created_at: submission.created_at,
        status: submission.status
      }
    }));

    // Combine and sort all submissions
    const allSubmissions = [...regularSubmissions, ...bountySubmissions]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log('[ADMIN SUBMISSIONS API] Returning', allSubmissions.length, 'total submissions');
    console.log('Regular submissions:', regularSubmissions.length);
    console.log('Bounty submissions:', bountySubmissions.length);

    return NextResponse.json(allSubmissions);

  } catch (error) {
    console.error('[ADMIN SUBMISSIONS API ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}