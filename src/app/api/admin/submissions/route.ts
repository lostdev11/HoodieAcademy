import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('[ADMIN SUBMISSIONS API] Fetching all submissions for admin review...');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch submissions from submissions table only
    const submissionsResult = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (submissionsResult.error) {
      console.warn('[ADMIN SUBMISSIONS API] Error fetching submissions:', submissionsResult.error);
      return NextResponse.json({ 
        error: 'Failed to fetch submissions',
        details: submissionsResult.error.message
      }, { status: 500 });
    }

    // Transform submissions to match expected format
    const allSubmissions = (submissionsResult.data || []).map(submission => ({
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
      bounty: null, // No bounty data available yet
      submission: {
        id: submission.id,
        title: submission.title || 'Untitled Submission',
        description: submission.description || '',
        image_url: submission.image_url,
        created_at: submission.created_at,
        status: submission.status
      }
    }));

    console.log('[ADMIN SUBMISSIONS API] Returning', allSubmissions.length, 'submissions');

    return NextResponse.json({ submissions: allSubmissions });

  } catch (error) {
    console.error('[ADMIN SUBMISSIONS API ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}