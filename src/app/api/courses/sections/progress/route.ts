import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/courses/sections/progress
 * Get user's section progress
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet_address');
    const courseId = searchParams.get('course_id');
    const sectionId = searchParams.get('section_id');

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

    if (sectionId) {
      // Get specific section progress
      const { data: progress, error } = await supabase
        .from('section_progress')
        .select(`
          *,
          course_sections (
            id,
            title,
            course_id,
            order_index
          ),
          courses (
            id,
            title,
            squad_id
          )
        `)
        .eq('user_wallet', walletAddress)
        .eq('section_id', sectionId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching section progress:', error);
        return NextResponse.json(
          { error: 'Failed to fetch section progress' },
          { status: 500 }
        );
      }

      // Check access
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

    } else if (courseId) {
      // Get all section progress for a course
      const { data: progressList, error } = await supabase
        .from('section_progress')
        .select(`
          *,
          course_sections (
            id,
            title,
            order_index,
            is_required
          ),
          courses (
            id,
            title,
            squad_id
          )
        `)
        .eq('user_wallet', walletAddress)
        .eq('course_id', courseId)
        .order('course_sections.order_index', { ascending: true });

      if (error) {
        console.error('Error fetching section progress:', error);
        return NextResponse.json(
          { error: 'Failed to fetch section progress' },
          { status: 500 }
        );
      }

      // Check access
      if (progressList && progressList.length > 0) {
        const course = progressList[0].courses;
        if (course.squad_id !== userSquad && course.squad_id !== 'all') {
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          );
        }
      }

      return NextResponse.json({
        progress: progressList || []
      });

    } else {
      // Get all section progress for user
      const { data: progressList, error } = await supabase
        .from('section_progress')
        .select(`
          *,
          course_sections (
            id,
            title,
            course_id,
            order_index
          ),
          courses (
            id,
            title,
            squad_id
          )
        `)
        .eq('user_wallet', walletAddress)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching section progress:', error);
        return NextResponse.json(
          { error: 'Failed to fetch section progress' },
          { status: 500 }
        );
      }

      // Filter for accessible courses
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
    console.error('Error in GET /api/courses/sections/progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses/sections/progress
 * Update section progress
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      wallet_address, 
      section_id, 
      course_id,
      is_completed,
      time_spent 
    } = body;

    if (!wallet_address || !section_id || !course_id) {
      return NextResponse.json(
        { error: 'Wallet address, section ID, and course ID are required' },
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

    // Update or insert section progress
    const updateData: any = {
      user_wallet: wallet_address,
      section_id,
      course_id,
      updated_at: new Date().toISOString()
    };

    if (is_completed !== undefined) {
      updateData.is_completed = is_completed;
      if (is_completed) {
        updateData.completed_at = new Date().toISOString();
      }
    }

    if (time_spent !== undefined) {
      updateData.time_spent = time_spent;
    }

    const { data: progress, error } = await supabase
      .from('section_progress')
      .upsert(updateData, {
        onConflict: 'user_wallet,section_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating section progress:', error);
      return NextResponse.json(
        { error: 'Failed to update section progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      progress
    });

  } catch (error) {
    console.error('Error in POST /api/courses/sections/progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
