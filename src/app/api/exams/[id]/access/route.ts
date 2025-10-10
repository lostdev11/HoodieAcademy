import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/exams/[id]/access
 * Check if user can take this exam
 * Query params: wallet_address (required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet_address');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    console.log('[EXAM ACCESS CHECK]', {
      examId: params.id,
      wallet: walletAddress
    });

    // Get exam details
    const { data: exam, error: examError } = await supabase
      .from('course_exams')
      .select('*')
      .eq('id', params.id)
      .single();

    if (examError || !exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      );
    }

    // Check if exam is active
    if (!exam.is_active) {
      return NextResponse.json({
        canAccess: false,
        reason: 'This exam is no longer active',
        exam: {
          id: exam.id,
          title: exam.title,
          is_active: exam.is_active
        }
      });
    }

    // Get user details
    const { data: user } = await supabase
      .from('users')
      .select('squad, username')
      .eq('wallet_address', walletAddress)
      .single();

    const userSquad = user?.squad;

    // Check squad restrictions
    if (exam.squad_restricted) {
      if (!userSquad) {
        return NextResponse.json({
          canAccess: false,
          reason: 'You must join a squad before taking this exam',
          exam: {
            id: exam.id,
            title: exam.title,
            squad_restricted: true,
            allowed_squads: exam.allowed_squads
          }
        });
      }

      if (!exam.allowed_squads?.includes(userSquad)) {
        return NextResponse.json({
          canAccess: false,
          reason: `This exam is only available for: ${exam.allowed_squads?.join(', ')}`,
          userSquad,
          requiredSquads: exam.allowed_squads,
          exam: {
            id: exam.id,
            title: exam.title,
            squad_restricted: true,
            allowed_squads: exam.allowed_squads
          }
        });
      }
    }

    // Check previous attempts
    const { data: previousAttempts } = await supabase
      .from('exam_submissions')
      .select('id, score, passed, status, submitted_at')
      .eq('exam_id', params.id)
      .eq('wallet_address', walletAddress)
      .order('submitted_at', { ascending: false });

    const attemptsUsed = previousAttempts?.length || 0;
    const attemptsRemaining = exam.attempts_allowed - attemptsUsed;

    // Check if max attempts reached
    if (attemptsUsed >= exam.attempts_allowed) {
      // Check if user has a passing approved submission
      const hasPassedSubmission = previousAttempts?.some(
        attempt => attempt.passed && attempt.status === 'approved'
      );

      return NextResponse.json({
        canAccess: false,
        reason: hasPassedSubmission 
          ? 'You have already passed this exam'
          : 'Maximum attempts reached',
        attemptsUsed,
        attemptsAllowed: exam.attempts_allowed,
        previousAttempts: previousAttempts?.map(a => ({
          score: a.score,
          passed: a.passed,
          status: a.status,
          submitted_at: a.submitted_at
        }))
      });
    }

    // User can take the exam
    return NextResponse.json({
      canAccess: true,
      attemptsUsed,
      attemptsRemaining,
      attemptsAllowed: exam.attempts_allowed,
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        total_questions: exam.total_questions,
        passing_score: exam.passing_score,
        time_limit_minutes: exam.time_limit_minutes,
        xp_reward: exam.xp_reward,
        bonus_xp: exam.bonus_xp,
        squad_restricted: exam.squad_restricted,
        allowed_squads: exam.allowed_squads,
        requires_approval: exam.requires_approval
      },
      previousAttempts: previousAttempts?.map(a => ({
        score: a.score,
        passed: a.passed,
        status: a.status,
        submitted_at: a.submitted_at
      })),
      userSquad
    });

  } catch (error) {
    console.error('[EXAM ACCESS CHECK ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

