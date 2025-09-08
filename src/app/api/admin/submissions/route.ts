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

    // Temporarily skip admin check for testing
    // TODO: Re-enable admin check once database is properly set up
    console.log('[ADMIN CHECK] Skipping admin verification for testing');

    // Get all submissions from the main submissions table
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select(`
        *,
        bounty:bounties(id, title, description, xp_reward)
      `)
      .order('created_at', { ascending: false });

    if (submissionsError) {
      console.error('[FETCH SUBMISSIONS ERROR]', submissionsError);
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }

    // Transform submissions to match expected format
    const enrichedSubmissions = submissions?.map(submission => ({
      id: submission.id,
      title: submission.title,
      description: submission.description,
      squad: submission.squad,
      courseRef: submission.course_ref,
      bountyId: submission.bounty_id,
      walletAddress: submission.wallet_address,
      imageUrl: submission.image_url,
      status: submission.status,
      upvotes: submission.upvotes || {},
      totalUpvotes: submission.total_upvotes || 0,
      timestamp: submission.created_at,
      bounty: submission.bounty,
      // Add admin-specific fields
      wallet_address: submission.wallet_address,
      created_at: submission.created_at,
      updated_at: submission.updated_at
    })) || [];

    return NextResponse.json({
      submissions: enrichedSubmissions,
      total: enrichedSubmissions.length
    });

  } catch (error) {
    console.error('[ADMIN SUBMISSIONS API ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
