import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidateTag } from 'next/cache';
import { CourseCreateSchema } from '@/types/course';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Try to fetch courses with minimal fields first
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching courses:', error);
      // Return empty array instead of error to prevent dashboard from failing
      return NextResponse.json([]);
    }

    // Filter for published and visible courses if those fields exist
    const filteredCourses = courses?.filter(course => {
      const isPublished = course.is_published === undefined || course.is_published;
      const isVisible = course.is_visible === undefined || course.is_visible;
      return isPublished && isVisible;
    }) || [];

    return NextResponse.json(filteredCourses);
  } catch (error) {
    console.error('Error in courses GET:', error);
    // Return empty array instead of error to prevent dashboard from failing
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const body = await request.json();
    
    // Validate input
    const validatedData = CourseCreateSchema.parse(body);

    // Check if slug already exists
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', validatedData.slug)
      .single();

    if (existingCourse) {
      return NextResponse.json({ error: 'Course with this slug already exists' }, { status: 400 });
    }

    // Insert new course
    const { data: course, error } = await supabase
      .from('courses')
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      console.error('Error creating course:', error);
      return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
    }

    // Revalidate courses cache
    revalidateTag('courses');

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('ZodError')) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }
    
    console.error('Error in courses POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
