import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAdminStatusWithFallback } from '@/lib/admin-utils';

export const dynamic = 'force-dynamic';

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

/**
 * POST /api/admin/exams/approve
 * Approve or reject an exam submission
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      submission_id,
      admin_wallet,
      action,
      admin_notes
    } = body;

    console.log('[EXAM APPROVAL] Request:', {
      submission_id,
      admin_wallet,
      action
    });

    // Validation
    if (!submission_id || !admin_wallet || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: submission_id, admin_wallet, action' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve or reject' },
        { status: 400 }
      );
    }

    // Check admin status
    if (!checkAdminStatusWithFallback(admin_wallet)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get submission
    const { data: submission, error: subError } = await supabase
      .from('exam_submissions')
      .select(`
        *,
        course_exams!inner (
          id,
          course_id,
          course_slug,
          title,
          xp_reward,
          bonus_xp,
          passing_score
        )
      `)
      .eq('id', submission_id)
      .single();

    if (subError || !submission) {
      console.error('[SUBMISSION NOT FOUND]', subError);
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    const exam = Array.isArray(submission.course_exams) 
      ? submission.course_exams[0] 
      : submission.course_exams;

    if (action === 'approve') {
      // Calculate XP to award
      const baseXP = exam.xp_reward || 100;
      const bonusXP = submission.score === 100 ? (exam.bonus_xp || 0) : 0;
      const totalXP = baseXP + bonusXP;

      console.log('[APPROVING EXAM]', {
        submissionId: submission_id,
        score: submission.score,
        baseXP,
        bonusXP,
        totalXP
      });

      // Update submission status
      const { error: updateError } = await supabase
        .from('exam_submissions')
        .update({
          status: 'approved',
          reviewed_by: admin_wallet,
          reviewed_at: new Date().toISOString(),
          admin_notes: admin_notes || null,
          xp_awarded: totalXP,
          xp_awarded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', submission_id);

      if (updateError) {
        console.error('[UPDATE SUBMISSION ERROR]', updateError);
        return NextResponse.json(
          { error: 'Failed to update submission' },
          { status: 500 }
        );
      }

      // Award XP to user
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('total_xp')
        .eq('wallet_address', submission.wallet_address)
        .single();

      if (user) {
        await supabase
          .from('users')
          .update({
            total_xp: (user.total_xp || 0) + totalXP,
            updated_at: new Date().toISOString()
          })
          .eq('wallet_address', submission.wallet_address);
      }

      // Mark course as completed
      if (submission.passed) {
        await supabase
          .from('course_completions')
          .insert([{
            wallet_address: submission.wallet_address,
            course_id: exam.course_id,
            course_slug: exam.course_slug,
            completed_at: new Date().toISOString(),
            xp_awarded: totalXP
          }])
          .onConflict('wallet_address,course_slug')
          .ignoreDuplicates();
      }

      // Log activity
      try {
        await supabase
          .from('user_activity')
          .insert({
            wallet_address: submission.wallet_address,
            activity_type: 'exam_approved',
            activity_data: {
              exam_id: exam.id,
              submission_id,
              score: submission.score,
              xp_awarded: totalXP,
              course_slug: exam.course_slug
            }
          });
      } catch (logError) {
        console.warn('Failed to log approval activity:', logError);
      }

      console.log('[EXAM APPROVED]', {
        submissionId: submission_id,
        xpAwarded: totalXP,
        user: submission.wallet_address
      });

      return NextResponse.json({
        success: true,
        message: `Exam approved! ${totalXP} XP awarded.`,
        xp_awarded: totalXP,
        submission_id
      });

    } else if (action === 'reject') {
      // Update submission status to rejected
      const { error: updateError } = await supabase
        .from('exam_submissions')
        .update({
          status: 'rejected',
          reviewed_by: admin_wallet,
          reviewed_at: new Date().toISOString(),
          admin_notes: admin_notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', submission_id);

      if (updateError) {
        console.error('[UPDATE SUBMISSION ERROR]', updateError);
        return NextResponse.json(
          { error: 'Failed to update submission' },
          { status: 500 }
        );
      }

      // Log activity
      try {
        await supabase
          .from('user_activity')
          .insert({
            wallet_address: submission.wallet_address,
            activity_type: 'exam_rejected',
            activity_data: {
              exam_id: exam.id,
              submission_id,
              score: submission.score,
              course_slug: exam.course_slug,
              reason: admin_notes
            }
          });
      } catch (logError) {
        console.warn('Failed to log rejection activity:', logError);
      }

      console.log('[EXAM REJECTED]', {
        submissionId: submission_id,
        user: submission.wallet_address,
        reason: admin_notes
      });

      return NextResponse.json({
        success: true,
        message: 'Exam submission rejected',
        submission_id
      });
    }

  } catch (error) {
    console.error('[EXAM APPROVAL ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

