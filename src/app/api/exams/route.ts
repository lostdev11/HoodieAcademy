import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/exams
 * Fetch all exams or exams for a specific course
 * Query params: course_slug (optional), wallet_address (optional for access check)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseSlug = searchParams.get('course_slug');
    const walletAddress = searchParams.get('wallet_address');

    console.log('[EXAMS API] Fetching exams:', { courseSlug, walletAddress });

    let query = supabase
      .from('course_exams')
      .select('*')
      .eq('is_active', true);

    if (courseSlug) {
      query = query.eq('course_slug', courseSlug);
    }

    const { data: exams, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[EXAMS API] Error fetching exams:', error);
      return NextResponse.json(
        { error: 'Failed to fetch exams', details: error.message },
        { status: 500 }
      );
    }

    // If wallet address provided, check access for each exam
    if (walletAddress && exams) {
      // Get user's squad
      const { data: user } = await supabase
        .from('users')
        .select('squad')
        .eq('wallet_address', walletAddress)
        .single();

      const userSquad = user?.squad;

      // Filter exams based on squad access
      const accessibleExams = exams.map(exam => {
        let canAccess = true;
        let accessReason = '';

        if (exam.squad_restricted) {
          if (!userSquad) {
            canAccess = false;
            accessReason = 'You must join a squad first';
          } else if (!exam.allowed_squads?.includes(userSquad)) {
            canAccess = false;
            accessReason = `This exam is only for: ${exam.allowed_squads?.join(', ')}`;
          }
        }

        return {
          ...exam,
          canAccess,
          accessReason,
          userSquad
        };
      });

      return NextResponse.json(accessibleExams);
    }

    return NextResponse.json(exams);

  } catch (error) {
    console.error('[EXAMS API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/exams
 * Create a new exam (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      course_id, 
      course_slug, 
      title, 
      description,
      total_questions,
      passing_score = 70,
      time_limit_minutes,
      attempts_allowed = 3,
      squad_restricted = false,
      allowed_squads,
      xp_reward = 100,
      bonus_xp = 50,
      requires_approval = true,
      admin_wallet
    } = body;

    if (!course_id || !course_slug || !title || !total_questions) {
      return NextResponse.json(
        { error: 'Missing required fields: course_id, course_slug, title, total_questions' },
        { status: 400 }
      );
    }

    // Check admin status
    const { data: admin } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', admin_wallet)
      .single();

    if (!admin?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Create exam
    const { data: exam, error } = await supabase
      .from('course_exams')
      .insert([{
        course_id,
        course_slug,
        title,
        description,
        total_questions,
        passing_score,
        time_limit_minutes,
        attempts_allowed,
        squad_restricted,
        allowed_squads,
        xp_reward,
        bonus_xp,
        requires_approval,
        created_by: admin_wallet
      }])
      .select()
      .single();

    if (error) {
      console.error('[CREATE EXAM ERROR]', error);
      return NextResponse.json(
        { error: 'Failed to create exam', details: error.message },
        { status: 500 }
      );
    }

    console.log('[EXAM CREATED]', exam);

    return NextResponse.json({
      success: true,
      exam
    }, { status: 201 });

  } catch (error) {
    console.error('[EXAMS API ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

