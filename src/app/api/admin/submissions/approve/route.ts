import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { submissionId, action, walletAddress } = await request.json();

    if (!submissionId || !action || !walletAddress) {
      return NextResponse.json({ 
        error: 'Missing required fields: submissionId, action, walletAddress' 
      }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be approve or reject' 
      }, { status: 400 });
    }

    // Temporarily skip admin check for testing
    // TODO: Re-enable admin check once database is properly set up
    console.log('[ADMIN CHECK] Skipping admin verification for testing');

    // Get the submission details
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError) {
      console.error('[FETCH SUBMISSION ERROR]', submissionError);
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (action === 'approve') {
      // Update the submission status to approved
      const { data: updatedSubmission, error: updateError } = await supabase
        .from('submissions')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (updateError) {
        console.error('[UPDATE SUBMISSION ERROR]', updateError);
        return NextResponse.json({ error: 'Failed to approve submission' }, { status: 500 });
      }

      // Log the approval activity
      try {
        await supabase
          .from('user_activity')
          .insert({
            wallet_address: submission.wallet_address,
            activity_type: 'submission_approved',
            activity_data: {
              submission_id: submissionId,
              bounty_id: submission.bounty_id
            }
          });
      } catch (logError) {
        console.warn('Failed to log approval activity:', logError);
        // Don't fail the operation for logging errors
      }

      return NextResponse.json({
        success: true,
        submission: updatedSubmission
      });

    } else if (action === 'reject') {
      // Update the submission with rejection
      const { data: updatedSubmission, error: updateError } = await supabase
        .from('submissions')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (updateError) {
        console.error('[UPDATE SUBMISSION ERROR]', updateError);
        return NextResponse.json({ error: 'Failed to reject submission' }, { status: 500 });
      }

      // Log the rejection activity
      try {
        await supabase
          .from('user_activity')
          .insert({
            wallet_address: submission.wallet_address,
            activity_type: 'submission_rejected',
            activity_data: {
              submission_id: submissionId,
              bounty_id: submission.bounty_id
            }
          });
      } catch (logError) {
        console.warn('Failed to log rejection activity:', logError);
        // Don't fail the operation for logging errors
      }

      return NextResponse.json({
        success: true,
        submission: updatedSubmission
      });
    }

  } catch (error) {
    console.error('[SUBMISSION APPROVAL API ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
