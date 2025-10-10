import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/exams/submit
 * Submit exam answers for grading
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      exam_id,
      wallet_address,
      answers,
      started_at,
      time_taken_seconds,
      ip_address,
      user_agent
    } = body;

    console.log('[EXAM SUBMISSION] Received:', {
      exam_id,
      wallet_address,
      answersCount: Object.keys(answers || {}).length,
      time_taken_seconds
    });

    // Validation
    if (!exam_id || !wallet_address || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields: exam_id, wallet_address, answers' },
        { status: 400 }
      );
    }

    // Get exam details
    const { data: exam, error: examError } = await supabase
      .from('course_exams')
      .select('*')
      .eq('id', exam_id)
      .single();

    if (examError || !exam) {
      console.error('[EXAM NOT FOUND]', examError);
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      );
    }

    // Check if exam is active
    if (!exam.is_active) {
      return NextResponse.json(
        { error: 'This exam is no longer active' },
        { status: 400 }
      );
    }

    // Check user's squad access
    const { data: user } = await supabase
      .from('users')
      .select('squad')
      .eq('wallet_address', wallet_address)
      .single();

    if (exam.squad_restricted) {
      const userSquad = user?.squad;
      
      if (!userSquad) {
        return NextResponse.json(
          { error: 'You must join a squad before taking this exam' },
          { status: 403 }
        );
      }

      if (!exam.allowed_squads?.includes(userSquad)) {
        return NextResponse.json(
          { 
            error: 'Access denied',
            message: `This exam is only for: ${exam.allowed_squads?.join(', ')}`,
            userSquad,
            requiredSquads: exam.allowed_squads
          },
          { status: 403 }
        );
      }
    }

    // Check attempts limit
    const { data: previousAttempts } = await supabase
      .from('exam_submissions')
      .select('id')
      .eq('exam_id', exam_id)
      .eq('wallet_address', wallet_address);

    const attemptNumber = (previousAttempts?.length || 0) + 1;

    if (attemptNumber > exam.attempts_allowed) {
      return NextResponse.json(
        { 
          error: 'Maximum attempts reached',
          attemptsUsed: previousAttempts?.length,
          attemptsAllowed: exam.attempts_allowed
        },
        { status: 400 }
      );
    }

    // Calculate score
    // Note: In a real system, you'd validate against correct answers stored securely
    // For now, this assumes the frontend sends the calculated score
    // or you implement server-side grading with a separate answers table
    
    const score = calculateScore(answers, exam.total_questions);
    const passed = score >= exam.passing_score;

    console.log('[EXAM GRADING]', {
      score,
      passingScore: exam.passing_score,
      passed,
      totalQuestions: exam.total_questions
    });

    // Create submission
    const { data: submission, error: submissionError } = await supabase
      .from('exam_submissions')
      .insert([{
        exam_id,
        wallet_address,
        answers,
        score,
        passed,
        started_at: started_at || new Date().toISOString(),
        submitted_at: new Date().toISOString(),
        time_taken_seconds,
        status: exam.requires_approval ? 'pending' : (passed ? 'approved' : 'rejected'),
        attempt_number: attemptNumber,
        ip_address: ip_address || null,
        user_agent: user_agent || null,
        xp_awarded: 0 // Will be set on approval
      }])
      .select()
      .single();

    if (submissionError) {
      console.error('[EXAM SUBMISSION ERROR]', submissionError);
      return NextResponse.json(
        { error: 'Failed to submit exam', details: submissionError.message },
        { status: 500 }
      );
    }

    console.log('[EXAM SUBMITTED]', {
      submissionId: submission.id,
      passed,
      score,
      requiresApproval: exam.requires_approval
    });

    // If doesn't require approval and passed, auto-award XP
    if (!exam.requires_approval && passed) {
      const xpToAward = score === 100 ? exam.xp_reward + exam.bonus_xp : exam.xp_reward;
      
      // Award XP
      await supabase
        .from('users')
        .update({
          total_xp: supabase.rpc('increment_xp', { amount: xpToAward })
        })
        .eq('wallet_address', wallet_address);

      // Update submission
      await supabase
        .from('exam_submissions')
        .update({
          xp_awarded: xpToAward,
          xp_awarded_at: new Date().toISOString()
        })
        .eq('id', submission.id);

      // Mark course as completed
      await supabase
        .from('course_completions')
        .insert([{
          wallet_address,
          course_id: exam.course_id,
          course_slug: exam.course_slug,
          xp_awarded: xpToAward
        }])
        .onConflict('wallet_address,course_slug')
        .ignoreDuplicates();
    }

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        score,
        passed,
        status: submission.status,
        requiresApproval: exam.requires_approval,
        attemptNumber,
        attemptsRemaining: exam.attempts_allowed - attemptNumber
      },
      message: passed 
        ? (exam.requires_approval 
            ? '🎉 Exam passed! Waiting for admin approval to receive XP.'
            : `🎉 Exam passed! You earned ${exam.xp_reward} XP!`)
        : `😔 Exam failed. You scored ${score}%. Pass: ${exam.passing_score}%. ${exam.attempts_allowed - attemptNumber} attempts remaining.`
    });

  } catch (error) {
    console.error('[EXAM SUBMIT ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate score from answers
 * Note: This is a simple implementation. In production, you should:
 * 1. Store correct answers securely (not in frontend)
 * 2. Validate against server-side answer key
 * 3. Implement anti-cheating measures
 */
function calculateScore(answers: Record<string, any>, totalQuestions: number): number {
  // For now, assume answers object has a 'score' property calculated on frontend
  // Or implement your own grading logic here
  
  if (typeof answers === 'object' && 'score' in answers) {
    return Math.min(100, Math.max(0, answers.score));
  }

  // Fallback: count answered questions
  const answeredCount = Object.keys(answers).length;
  return Math.round((answeredCount / totalQuestions) * 100);
}

