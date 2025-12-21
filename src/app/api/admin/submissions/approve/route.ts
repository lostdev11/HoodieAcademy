import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAdminStatusWithFallback } from '@/lib/admin-utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    // Check if user is admin
    if (!checkAdminStatusWithFallback(walletAddress)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get the submission from bounty_submissions table
    const { data: submission, error: submissionError } = await supabase
      .from('bounty_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      console.error('[FETCH SUBMISSION ERROR]', submissionError);
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submissionTable = 'bounty_submissions';

    if (action === 'approve') {
      // Update the submission status to approved in the correct table
      const { data: updatedSubmission, error: updateError } = await supabase
        .from(submissionTable)
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

      // Mark bounty as completed for the user if it's a bounty submission
      if (submissionTable === 'bounty_submissions' && submission.bounty_id) {
        try {
          // Get bounty details to determine XP reward
          const { data: bounty, error: bountyError } = await supabase
            .from('bounties')
            .select('reward, reward_type')
            .eq('id', submission.bounty_id)
            .single();

          if (bounty && !bountyError) {
            // Calculate XP reward (default to 10 if not specified or not XP type)
            const xpReward = bounty.reward_type === 'XP' ? parseInt(bounty.reward) || 10 : 10;
            
            // Mark bounty as completed using the database function
            const { error: completionError } = await supabase.rpc('mark_bounty_completed', {
              p_wallet_address: submission.wallet_address,
              p_bounty_id: submission.bounty_id,
              p_submission_id: submissionId,
              p_xp_awarded: xpReward,
              p_sol_prize: bounty.reward_type === 'SOL' ? parseFloat(bounty.reward) || 0 : 0
            });

            if (completionError) {
              console.error('[BOUNTY COMPLETION ERROR]', completionError);
              // Don't fail the approval for completion tracking errors
            } else {
              console.log(`[BOUNTY COMPLETED] User ${submission.wallet_address} completed bounty ${submission.bounty_id}`);
              
              // Sync XP to users table after successful completion
              try {
                // Get current XP from user_xp table (source of truth)
                const { data: userXP, error: userXPError } = await supabase
                  .from('user_xp')
                  .select('total_xp, level')
                  .eq('wallet_address', submission.wallet_address)
                  .maybeSingle();

                if (!userXPError && userXP) {
                  // Update users table to keep in sync
                  const { error: syncError } = await supabase
                    .from('users')
                    .upsert({
                      wallet_address: submission.wallet_address,
                      total_xp: userXP.total_xp,
                      level: userXP.level,
                      updated_at: new Date().toISOString()
                    }, {
                      onConflict: 'wallet_address'
                    });

                  if (syncError) {
                    console.error('[XP SYNC ERROR] Failed to sync XP to users table:', syncError);
                  } else {
                    console.log(`[XP SYNCED] Synced ${xpReward} XP to users table for ${submission.wallet_address}`);
                  }
                } else {
                  // If user_xp doesn't exist, create user with XP
                  const { error: createUserError } = await supabase
                    .from('users')
                    .upsert({
                      wallet_address: submission.wallet_address,
                      total_xp: xpReward,
                      level: Math.floor(xpReward / 1000) + 1,
                      updated_at: new Date().toISOString()
                    }, {
                      onConflict: 'wallet_address'
                    });

                  if (createUserError) {
                    console.error('[USER CREATION ERROR] Failed to create/update user:', createUserError);
                  }
                }
              } catch (syncError) {
                console.error('[XP SYNC ERROR] Error syncing XP to users table:', syncError);
                // Don't fail the approval for sync errors
              }
            }
          }
        } catch (completionError) {
          console.error('[BOUNTY COMPLETION ERROR]', completionError);
          // Don't fail the approval for completion tracking errors
        }
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
              bounty_id: submission.bounty_id,
              table: submissionTable
            }
          });
      } catch (logError) {
        console.warn('Failed to log approval activity:', logError);
        // Don't fail the operation for logging errors
      }

      return NextResponse.json({
        success: true,
        submission: updatedSubmission,
        table: submissionTable
      });

    } else if (action === 'reject') {
      // Update the submission with rejection in the correct table
      const { data: updatedSubmission, error: updateError } = await supabase
        .from(submissionTable)
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
              bounty_id: submission.bounty_id,
              table: submissionTable
            }
          });
      } catch (logError) {
        console.warn('Failed to log rejection activity:', logError);
        // Don't fail the operation for logging errors
      }

      return NextResponse.json({
        success: true,
        submission: updatedSubmission,
        table: submissionTable
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
