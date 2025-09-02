import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    console.log('🔍 Checking courses table...');
    
    // Get all courses from the table
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*');
    
    if (error) {
      console.error('❌ Error fetching courses:', error);
      return NextResponse.json({ 
        status: 'error', 
        message: 'Failed to fetch courses',
        error: error.message 
      }, { status: 500 });
    }
    
    console.log('✅ Courses fetched successfully:', courses?.length || 0, 'courses');
    
    // Check if any courses are published and visible
    const publishedCourses = courses?.filter(course => 
      course.is_published === true && course.is_visible === true
    ) || [];
    
    console.log('📚 Published and visible courses:', publishedCourses.length);
    
    return NextResponse.json({
      status: 'success',
      totalCourses: courses?.length || 0,
      publishedCourses: publishedCourses.length,
      allCourses: courses || [],
      publishedAndVisible: publishedCourses
    });
    
  } catch (error) {
    console.error('❌ Error checking courses:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Failed to check courses',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

