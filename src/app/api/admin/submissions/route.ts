import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('[ADMIN SUBMISSIONS API] Fetching all bounty submissions for admin review...');

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

    // Fetch submissions from bounty_submissions table with bounty details
    const submissionsResult = await supabase
      .from('bounty_submissions')
      .select(`
        *,
        bounties:bounty_id (
          id,
          title,
          short_desc,
          reward,
          reward_type,
          status,
          squad_tag
        )
      `)
      .order('created_at', { ascending: false });

    if (submissionsResult.error) {
      console.error('[ADMIN SUBMISSIONS API] Error fetching submissions:', submissionsResult.error);
      return NextResponse.json({ 
        error: 'Failed to fetch submissions',
        details: submissionsResult.error.message
      }, { status: 500 });
    }

    console.log('[ADMIN SUBMISSIONS API] Raw data:', submissionsResult.data);

    // Transform submissions to match expected format
    const allSubmissions = (submissionsResult.data || []).map(submission => {
      const bountyData = Array.isArray(submission.bounties) ? submission.bounties[0] : submission.bounties;
      
      return {
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
        bounty: bountyData ? {
          id: bountyData.id,
          title: bountyData.title,
          short_desc: bountyData.short_desc,
          reward: bountyData.reward,
          reward_type: bountyData.reward_type,
          status: bountyData.status,
          squad_tag: bountyData.squad_tag
        } : null,
        submission: {
          id: submission.id,
          title: submission.title || bountyData?.title || 'Untitled Submission',
          description: submission.submission_content || submission.description || '',
          image_url: submission.image_url,
          created_at: submission.created_at,
          status: submission.status
        }
      };
    });

    console.log('[ADMIN SUBMISSIONS API] Returning', allSubmissions.length, 'submissions');
    console.log('[ADMIN SUBMISSIONS API] First submission:', allSubmissions[0]);

    return NextResponse.json(allSubmissions);

  } catch (error) {
    console.error('[ADMIN SUBMISSIONS API ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}