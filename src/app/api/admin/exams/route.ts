import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/admin/exams
 * Fetch all exam submissions for admin review
 * Query params: status (optional), course_slug (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const courseSlug = searchParams.get('course_slug');
    const adminWallet = searchParams.get('wallet');

    console.log('[ADMIN EXAMS API] Fetching exam submissions for review');

    // Verify admin access
    if (adminWallet) {
      const { data: admin } = await supabase
        .from('users')
        .select('is_admin')
        .eq('wallet_address', adminWallet)
        .single();

      if (!admin?.is_admin) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    // Build query with joins to get all relevant data
    let query = supabase
      .from('exam_submissions')
      .select(`
        *,
        course_exams!inner (
          id,
          course_id,
          course_slug,
          title,
          description,
          passing_score,
          xp_reward,
          bonus_xp,
          total_questions,
          squad_restricted,
          allowed_squads
        ),
        users!inner (
          wallet_address,
          username,
          squad,
          total_xp,
          level
        )
      `)
      .order('submitted_at', { ascending: false });

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter by course if provided
    if (courseSlug) {
      query = query.eq('course_exams.course_slug', courseSlug);
    }

    const { data: submissions, error } = await query;

    if (error) {
      console.error('[ADMIN EXAMS API] Error fetching submissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch submissions', details: error.message },
        { status: 500 }
      );
    }

    console.log('[ADMIN EXAMS API] Found', submissions?.length || 0, 'submissions');

    // Transform data for easier frontend consumption
    const transformedSubmissions = (submissions || []).map(sub => {
      const exam = Array.isArray(sub.course_exams) ? sub.course_exams[0] : sub.course_exams;
      const user = Array.isArray(sub.users) ? sub.users[0] : sub.users;

      return {
        id: sub.id,
        exam_id: sub.exam_id,
        wallet_address: sub.wallet_address,
        score: sub.score,
        passed: sub.passed,
        status: sub.status,
        attempt_number: sub.attempt_number,
        submitted_at: sub.submitted_at,
        time_taken_seconds: sub.time_taken_seconds,
        xp_awarded: sub.xp_awarded,
        reviewed_by: sub.reviewed_by,
        reviewed_at: sub.reviewed_at,
        admin_notes: sub.admin_notes,
        
        exam: exam ? {
          id: exam.id,
          course_id: exam.course_id,
          course_slug: exam.course_slug,
          title: exam.title,
          description: exam.description,
          passing_score: exam.passing_score,
          xp_reward: exam.xp_reward,
          bonus_xp: exam.bonus_xp,
          total_questions: exam.total_questions,
          squad_restricted: exam.squad_restricted,
          allowed_squads: exam.allowed_squads
        } : null,
        
        user: user ? {
          wallet_address: user.wallet_address,
          username: user.username,
          squad: user.squad,
          total_xp: user.total_xp,
          level: user.level
        } : null,
        
        answers: sub.answers
      };
    });

    return NextResponse.json(transformedSubmissions);

  } catch (error) {
    console.error('[ADMIN EXAMS API ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

