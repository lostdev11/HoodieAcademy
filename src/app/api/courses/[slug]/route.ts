import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { revalidateTag } from 'next/cache';
import { CourseUpdateSchema } from '@/types/course';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    console.log('API: Loading course:', slug);
    
    // First try to get from database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await supabase.auth.getUser();
    let isAdmin = false;
    
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      isAdmin = userData?.is_admin || false;
    }

    // Try database first
    let query = supabase
      .from('courses')
      .select('*')
      .eq('slug', slug);

    if (!isAdmin) {
      query = query.eq('is_published', true);
    }

    const { data: dbCourse, error: dbError } = await query.single();

    if (dbCourse && !dbError) {
      console.log('API: Course loaded from database:', dbCourse.title);
      return NextResponse.json(dbCourse);
    }

    // Fallback to file-based loading
    const coursePath = path.join(process.cwd(), 'public', 'courses', `${slug}.json`);
    console.log('API: Course path:', coursePath);
    
    // Check if file exists
    if (!fs.existsSync(coursePath)) {
      console.error('API: Course file does not exist:', coursePath);
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    // Read and parse course data
    const courseData = fs.readFileSync(coursePath, 'utf8');
    console.log('API: Course file read successfully, size:', courseData.length);
    
    if (!courseData || courseData.trim() === '') {
      console.error('API: Course file is empty');
      return NextResponse.json({ error: 'Course file is empty' }, { status: 500 });
    }
    
    const course = JSON.parse(courseData);
    console.log('API: Course loaded successfully:', course.title);
    console.log('API: Course has modules:', course.modules?.length || 0);
    
    // Validate course structure
    if (!course.modules || !Array.isArray(course.modules) || course.modules.length === 0) {
      console.error('API: Course has no valid modules');
      return NextResponse.json({ error: 'Course has no valid modules' }, { status: 500 });
    }
    
    return NextResponse.json(course);
  } catch (error) {
    console.error('API: Error loading course:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
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
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Handle both database updates and file-based updates
    if (body.slug) {
      // Database update
      const validatedData = CourseUpdateSchema.parse(body);
      
      const { data: course, error } = await supabase
        .from('courses')
        .update(validatedData)
        .eq('slug', params.slug)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }
        console.error('Error updating course:', error);
        return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
      }

      // Revalidate courses cache
      revalidateTag('courses');
      return NextResponse.json(course);
    } else {
      // File-based update (legacy)
      const patch: any = {};
      if (body.title !== undefined) patch.title = body.title;
      if (body.description !== undefined) patch.description = body.description;
      if (body.badge !== undefined) patch.badge = body.badge;
      if (body.emoji !== undefined) patch.emoji = body.emoji;
      if (body.pathType !== undefined) patch.path_type = body.pathType;
      if (body.href !== undefined) patch.href = body.href;
      if (body.totalLessons !== undefined) patch.total_lessons = body.totalLessons;
      if (body.category !== undefined) patch.category = body.category;
      if (body.level !== undefined) patch.level = body.level;
      if (body.access !== undefined) patch.access = body.access;
      if (body.squad !== undefined) patch.squad = body.squad;
      if (body.isVisible !== undefined) patch.is_visible = body.isVisible;
      if (body.isPublished !== undefined) patch.is_published = body.isPublished;
      if (body.isGated !== undefined) patch.is_gated = body.isGated;

      patch.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from("courses")
        .update(patch)
        .eq("slug", params.slug);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('ZodError')) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }
    
    console.error('Error in course PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete course from database (this will cascade to course_progress due to foreign key)
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('slug', params.slug);

    if (error) {
      console.error('Error deleting course:', error);
      return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
    }

    // Revalidate courses cache
    revalidateTag('courses');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in course DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
