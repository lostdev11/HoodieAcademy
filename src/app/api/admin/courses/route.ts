import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidateTag } from 'next/cache';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // For admin API access, return all courses regardless of visibility/published status
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin courses:', error);
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }

    return NextResponse.json(courses || []);
  } catch (error) {
    console.error('Error in admin courses GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const body = await request.json();
    
    // Insert new course
    const { data: course, error } = await supabase
      .from('courses')
      .insert([body])
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
    console.error('Error in admin courses POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
