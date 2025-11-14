import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const REQUIRED_ENV_VARS = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;

function validateEnv() {
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      console.error(`[PreviewProgressAPI] Missing environment variable: ${key}`);
      throw new Error('Server configuration error');
    }
  }
}

function getSupabaseClient() {
  validateEnv();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);

    const submissionId = searchParams.get('submission_id');
    const courseId = searchParams.get('course_id');

    if (!submissionId || !courseId) {
      return NextResponse.json(
        { error: 'submission_id and course_id are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('preview_course_progress')
      .select('*')
      .eq('submission_id', submissionId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) {
      console.error('[PreviewProgressAPI:GET] Error fetching progress:', error);
      return NextResponse.json(
        { error: 'Failed to load preview progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      progress: data ?? null,
    });
  } catch (error) {
    console.error('[PreviewProgressAPI:GET] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const submissionId = typeof body.submission_id === 'string' ? body.submission_id : '';
    const courseId = typeof body.course_id === 'string' ? body.course_id : '';
    const completedLessons = Array.isArray(body.completed_lessons)
      ? body.completed_lessons.map(String)
      : [];

    if (!submissionId || !courseId) {
      return NextResponse.json(
        { error: 'submission_id and course_id are required' },
        { status: 400 }
      );
    }

    const percent =
      typeof body.percent === 'number' && !Number.isNaN(body.percent)
        ? Math.max(0, Math.min(100, body.percent))
        : null;

    const upsertPayload: Record<string, any> = {
      submission_id: submissionId,
      course_id: courseId,
      completed_lessons: completedLessons,
      updated_at: new Date().toISOString(),
    };

    if (percent !== null) {
      upsertPayload.percent = percent;
    }

    const { data, error } = await supabase
      .from('preview_course_progress')
      .upsert(upsertPayload, { onConflict: 'submission_id,course_id' })
      .select()
      .single();

    if (error) {
      console.error('[PreviewProgressAPI:POST] Error upserting progress:', error);
      return NextResponse.json(
        { error: 'Failed to save preview progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      progress: data,
    });
  } catch (error) {
    console.error('[PreviewProgressAPI:POST] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


