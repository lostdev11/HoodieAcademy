import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/courses/progress
 * Get user's course progress
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet_address');
    const courseId = searchParams.get('course_id');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Get user's squad
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('squad_id')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    const userSquad = user?.squad_id;

    if (courseId) {
      // Get specific course progress
      const { data: progress, error } = await supabase
        .from('course_progress')
        .select(`
          *,
          courses (
            id,
            title,
            squad_id,
            xp_reward
          )
        `)
        .eq('user_wallet', walletAddress)
        .eq('course_id', courseId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching course progress:', error);
        return NextResponse.json(
          { error: 'Failed to fetch course progress' },
          { status: 500 }
        );
      }

      // Check if user has access to this course
      if (progress?.courses) {
        const course = progress.courses;
        if (course.squad_id !== userSquad && course.squad_id !== 'all') {
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          );
        }
      }

      return NextResponse.json({
        progress: progress || null
      });

    } else {
      // Get all course progress for user
      const { data: progressList, error } = await supabase
        .from('course_progress')
        .select(`
          *,
          courses (
            id,
            title,
            squad_id,
            squad_name,
            difficulty_level,
            xp_reward,
            is_published,
            is_hidden
          )
        `)
        .eq('user_wallet', walletAddress)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching course progress:', error);
        return NextResponse.json(
          { error: 'Failed to fetch course progress' },
          { status: 500 }
        );
      }

      // Filter progress for courses user has access to
      const accessibleProgress = progressList?.filter(p => {
        const course = p.courses;
        return course && (
          course.squad_id === userSquad || 
          course.squad_id === 'all'
        );
      }) || [];

      return NextResponse.json({
        progress: accessibleProgress
      });
    }

  } catch (error) {
    console.error('Error in GET /api/courses/progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses/progress
 * Update course progress
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      wallet_address, 
      course_id, 
      progress_percentage, 
      current_section, 
      notes,
      time_spent 
    } = body;

    if (!wallet_address || !course_id) {
      return NextResponse.json(
        { error: 'Wallet address and course ID are required' },
        { status: 400 }
      );
    }

    // Get user's squad
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('squad_id')
      .eq('wallet_address', wallet_address)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    const userSquad = user?.squad_id;

    // Check if user has access to this course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('squad_id, is_published, is_hidden')
      .eq('id', course_id)
      .single();

    if (courseError) {
      console.error('Error fetching course:', courseError);
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    if (course.squad_id !== userSquad && course.squad_id !== 'all') {
      return NextResponse.json(
        { error: 'Access denied: Course not available for your squad' },
        { status: 403 }
      );
    }

    if (!course.is_published || course.is_hidden) {
      return NextResponse.json(
        { error: 'Course not available' },
        { status: 403 }
      );
    }

    // Update or insert progress
    const updateData: any = {
      user_wallet: wallet_address,
      course_id,
      last_accessed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (progress_percentage !== undefined) {
      updateData.progress_percentage = Math.max(0, Math.min(100, progress_percentage));
      updateData.is_completed = progress_percentage >= 100;
      if (progress_percentage >= 100) {
        updateData.completed_at = new Date().toISOString();
      }
    }

    if (current_section !== undefined) updateData.current_section = current_section;
    if (notes !== undefined) updateData.notes = notes;
    if (time_spent !== undefined) updateData.time_spent = time_spent;

    const { data: progress, error } = await supabase
      .from('course_progress')
      .upsert(updateData, {
        onConflict: 'user_wallet,course_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating course progress:', error);
      return NextResponse.json(
        { error: 'Failed to update course progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      progress
    });

  } catch (error) {
    console.error('Error in POST /api/courses/progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
