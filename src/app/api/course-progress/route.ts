import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/course-progress
 * Fetch user's course progress
 * Query params: wallet_address (required), course_slug (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet_address');
    const courseSlug = searchParams.get('course_slug');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('course_progress')
      .select('*')
      .eq('wallet_address', walletAddress);

    // If course_slug provided, get specific course
    if (courseSlug) {
      query = query.eq('course_slug', courseSlug).single();
      
      const { data, error } = await query;

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching course progress:', error);
        return NextResponse.json(
          { error: 'Failed to fetch course progress' },
          { status: 500 }
        );
      }

      if (!data) {
        return NextResponse.json({
          hasProgress: false,
          progress: null
        });
      }

      return NextResponse.json({
        hasProgress: true,
        progress: data
      });
    } else {
      // Get all courses for user
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all course progress:', error);
        return NextResponse.json(
          { error: 'Failed to fetch course progress' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        hasProgress: data && data.length > 0,
        courses: data || [],
        totalCourses: data ? data.length : 0
      });
    }
  } catch (error) {
    console.error('Error in GET /api/course-progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/course-progress
 * Update user's course progress
 * Body: { wallet_address, course_slug, lesson_data, lesson_index?, status? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address, course_slug, lesson_data, lesson_index, status } = body;

    if (!wallet_address || !course_slug) {
      return NextResponse.json(
        { error: 'Wallet address and course slug are required' },
        { status: 400 }
      );
    }

    // If updating a single lesson
    if (lesson_index !== undefined && status !== undefined) {
      // Fetch existing progress
      const { data: existing } = await supabase
        .from('course_progress')
        .select('lesson_data')
        .eq('wallet_address', wallet_address)
        .eq('course_slug', course_slug)
        .single();

      let updatedLessonData = existing?.lesson_data || [];
      
      // Ensure it's an array
      if (!Array.isArray(updatedLessonData)) {
        updatedLessonData = [];
      }

      // Update specific lesson
      const lessonExists = updatedLessonData.some((l: any) => l.index === lesson_index);
      
      if (lessonExists) {
        updatedLessonData = updatedLessonData.map((l: any) => 
          l.index === lesson_index ? { index: lesson_index, status } : l
        );
      } else {
        updatedLessonData.push({ index: lesson_index, status });
      }

      // Update using the helper function
      const { data, error } = await supabase
        .rpc('update_lesson_progress', {
          p_wallet_address: wallet_address,
          p_course_slug: course_slug,
          p_lesson_data: updatedLessonData
        });

      if (error) {
        console.error('Error updating lesson progress:', error);
        return NextResponse.json(
          { error: 'Failed to update progress' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Lesson progress updated',
        progress: data
      });
    }

    // If updating full lesson data
    if (lesson_data) {
      const { data, error } = await supabase
        .rpc('update_lesson_progress', {
          p_wallet_address: wallet_address,
          p_course_slug: course_slug,
          p_lesson_data: lesson_data
        });

      if (error) {
        console.error('Error updating course progress:', error);
        return NextResponse.json(
          { error: 'Failed to update progress' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Course progress updated',
        progress: data
      });
    }

    return NextResponse.json(
      { error: 'Either lesson_data or (lesson_index + status) is required' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in POST /api/course-progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/course-progress
 * Reset course progress
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet_address');
    const courseSlug = searchParams.get('course_slug');

    if (!walletAddress || !courseSlug) {
      return NextResponse.json(
        { error: 'Wallet address and course slug are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('course_progress')
      .delete()
      .eq('wallet_address', walletAddress)
      .eq('course_slug', courseSlug);

    if (error) {
      console.error('Error deleting course progress:', error);
      return NextResponse.json(
        { error: 'Failed to delete progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Course progress reset'
    });

  } catch (error) {
    console.error('Error in DELETE /api/course-progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

