import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { EventKind } from '@/types/tracking';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EventSchema = z.object({
  kind: z.enum([
    'wallet_connect','wallet_disconnect','page_view',
    'course_start','course_complete','lesson_start','lesson_complete',
    'exam_started','exam_submitted','exam_approved','exam_rejected',
    'placement_started','placement_completed','custom'
  ]),
  path: z.string().optional(),
  referrer: z.string().optional(),
  payload: z.record(z.any()).default({}),
  sessionId: z.string().uuid().optional(),
  walletAddress: z.string().optional(),
  courseId: z.string().optional(),
  lessonId: z.string().optional(),
  examId: z.string().optional()
});

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const parsed = EventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: parsed.error.flatten() 
      }, { status: 400 });
    }

    const input = parsed.data;

    // Handle heartbeat updates for sessions
    if (input.payload?.type === 'heartbeat' && input.sessionId) {
      const { error: sessionError } = await supabase
        .from('sessions')
        .update({ last_heartbeat_at: new Date().toISOString() })
        .eq('id', input.sessionId)
        .eq('user_id', user.id);

      if (sessionError) {
        console.error('Error updating session heartbeat:', sessionError);
      }
    }

    // Insert event into event_log
    const { error: eventError } = await supabase
      .from('event_log')
      .insert({
        user_id: user.id,
        session_id: input.sessionId ?? null,
        wallet_address: input.walletAddress ?? null,
        kind: input.kind,
        path: input.path ?? null,
        referrer: input.referrer ?? null,
        course_id: input.courseId ?? null,
        lesson_id: input.lessonId ?? null,
        exam_id: input.examId ?? null,
        payload: input.payload
      });

    if (eventError) {
      console.error('Error inserting event:', eventError);
      return NextResponse.json({ 
        error: 'Failed to log event' 
      }, { status: 500 });
    }

    // Handle course progress updates
    if (input.kind === 'course_start' && input.courseId) {
      const { error: progressError } = await supabase
        .from('course_progress')
        .upsert({
          user_id: user.id,
          course_id: input.courseId,
          started_at: new Date().toISOString(),
          last_event_at: new Date().toISOString(),
          progress_percent: 0
        }, { 
          onConflict: 'user_id,course_id',
          ignoreDuplicates: false
        });

      if (progressError) {
        console.error('Error updating course progress:', progressError);
      }
    }

    if (input.kind === 'course_complete' && input.courseId) {
      const { error: progressError } = await supabase
        .from('course_progress')
        .upsert({
          user_id: user.id,
          course_id: input.courseId,
          completed_at: new Date().toISOString(),
          progress_percent: 100,
          last_event_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id,course_id',
          ignoreDuplicates: false
        });

      if (progressError) {
        console.error('Error updating course progress:', progressError);
      }
    }

    // Handle placement progress updates
    if (input.kind === 'placement_started') {
      const { error: placementError } = await supabase
        .from('placement_progress')
        .upsert({
          user_id: user.id,
          status: 'in_progress',
          started_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (placementError) {
        console.error('Error updating placement progress:', placementError);
      }
    }

    if (input.kind === 'placement_completed') {
      const { error: placementError } = await supabase
        .from('placement_progress')
        .upsert({
          user_id: user.id,
          status: 'submitted',
          submitted_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (placementError) {
        console.error('Error updating placement progress:', placementError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in track route:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}