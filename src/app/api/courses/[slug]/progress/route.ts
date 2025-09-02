import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { CourseProgressUpdateSchema } from '@/types/course';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First get the course ID from the slug
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', params.slug)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get user's progress for this course
    const { data: progress, error } = await supabase
      .from('course_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching progress:', error);
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }

    // Return progress or null if no progress exists
    return NextResponse.json(progress || null);
  } catch (error) {
    console.error('Error in progress GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First get the course ID from the slug
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', params.slug)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = CourseProgressUpdateSchema.parse(body);

    // Prepare update data
    const updateData: any = { ...validatedData };
    
    // If marking as completed, set percent to 100 and completed_at to now
    if (validatedData.is_completed) {
      updateData.percent = 100;
      updateData.completed_at = new Date().toISOString();
    }

    // Try to update existing progress first
    let { data: progress, error } = await supabase
      .from('course_progress')
      .update(updateData)
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .select()
      .single();

    // If no existing progress, create new record
    if (error && error.code === 'PGRST116') {
      const insertData = {
        user_id: user.id,
        course_id: course.id,
        percent: updateData.percent || 0,
        is_completed: updateData.is_completed || false,
        completed_at: updateData.completed_at || null,
      };

      const { data: newProgress, error: insertError } = await supabase
        .from('course_progress')
        .insert([insertData])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating progress:', insertError);
        return NextResponse.json({ error: 'Failed to create progress' }, { status: 500 });
      }

      progress = newProgress;
    } else if (error) {
      console.error('Error updating progress:', error);
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
    }

    return NextResponse.json(progress);
  } catch (error) {
    if (error instanceof Error && error.message.includes('ZodError')) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }
    
    console.error('Error in progress PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
