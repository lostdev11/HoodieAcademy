import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/courses
 * Get courses with squad-based access control
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet_address');
    const squadId = searchParams.get('squad_id');
    const includeHidden = searchParams.get('include_hidden') === 'true';
    const isAdmin = searchParams.get('is_admin') === 'true';

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Get user's squad
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('squad_id, is_admin')
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
    const userIsAdmin = user?.is_admin || false;

    // Build query - don't include course_sections if table doesn't exist
    let query = supabase
      .from('courses')
      .select('*')
      .order('squad_id', { ascending: true })
      .order('order_index', { ascending: true });

    // Filter by squad if specified
    if (squadId) {
      query = query.eq('squad_id', squadId);
    }

    // Admin vs Regular User Logic
    if (userIsAdmin) {
      // Admins see ALL courses (published, unpublished, hidden, visible)
      // No additional filters needed
    } else {
      // Regular users only see published, non-hidden courses
      query = query.eq('is_published', true).eq('is_hidden', false);
    }

    const { data: courses, error } = await query;

    if (error) {
      console.error('Error fetching courses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch courses' },
        { status: 500 }
      );
    }

    // Filter courses based on user's squad access
    const accessibleCourses = courses?.filter(course => {
      // Admins can see all courses
      if (userIsAdmin) return true;
      
      // Users can only see courses for their squad or 'all' squad courses
      return course.squad_id === userSquad || course.squad_id === 'all';
    }) || [];

    // Add course statistics for admin view
    const courseStats = userIsAdmin ? {
      total: courses?.length || 0,
      published: courses?.filter(c => c.is_published).length || 0,
      unpublished: courses?.filter(c => !c.is_published).length || 0,
      visible: courses?.filter(c => !c.is_hidden).length || 0,
      hidden: courses?.filter(c => c.is_hidden).length || 0
    } : null;

    return NextResponse.json({
      courses: accessibleCourses,
      userSquad,
      isAdmin: userIsAdmin,
      stats: courseStats
    });

  } catch (error) {
    console.error('Error in GET /api/courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses
 * Create a new course (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      description, 
      content, 
      squad_id, 
      squad_name, 
      difficulty_level, 
      estimated_duration, 
      xp_reward, 
      tags, 
      prerequisites,
      created_by 
    } = body;

    // Validate required fields
    if (!title || !squad_id || !squad_name || !created_by) {
      return NextResponse.json(
        { error: 'Title, squad_id, squad_name, and created_by are required' },
        { status: 400 }
      );
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', created_by)
      .single();

    if (userError || !user?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Create course
    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        title,
        description,
        content,
        squad_id,
        squad_name,
        difficulty_level: difficulty_level || 'beginner',
        estimated_duration: estimated_duration || 0,
        xp_reward: xp_reward || 0,
        tags: tags || [],
        prerequisites: prerequisites || [],
        created_by,
        published_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating course:', error);
      return NextResponse.json(
        { error: 'Failed to create course' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      course
    });

  } catch (error) {
    console.error('Error in POST /api/courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/courses
 * Update course properties (hide/show, publish/unpublish, etc.) - Admin only
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      course_id,
      admin_wallet,
      is_hidden,
      is_published,
      order_index
    } = body;

    console.log('[COURSE UPDATE] Request:', {
      course_id,
      admin_wallet,
      is_hidden,
      is_published
    });

    // Validate required fields
    if (!course_id || !admin_wallet) {
      return NextResponse.json(
        { error: 'course_id and admin_wallet are required' },
        { status: 400 }
      );
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', admin_wallet)
      .single();

    if (userError || !user?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Build update object - only include fields that were provided
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (is_hidden !== undefined) {
      updateData.is_hidden = is_hidden;
    }

    if (is_published !== undefined) {
      updateData.is_published = is_published;
    }

    if (order_index !== undefined) {
      updateData.order_index = order_index;
    }

    // Update course
    const { data: course, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', course_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating course:', error);
      return NextResponse.json(
        { error: 'Failed to update course', details: error.message },
        { status: 500 }
      );
    }

    // Log activity
    try {
      await supabase
        .from('user_activity')
        .insert({
          wallet_address: admin_wallet,
          activity_type: 'course_updated',
          activity_data: {
            course_id,
            course_title: course.title,
            changes: updateData
          }
        });
    } catch (logError) {
      console.warn('Failed to log course update activity:', logError);
    }

    console.log('[COURSE UPDATED]', {
      courseId: course_id,
      changes: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Course updated successfully',
      course
    });

  } catch (error) {
    console.error('Error in PATCH /api/courses:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/courses
 * Delete a course permanently (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { course_id, admin_wallet } = body;

    console.log('[COURSE DELETE] Request:', {
      course_id,
      admin_wallet
    });

    // Validate required fields
    if (!course_id || !admin_wallet) {
      return NextResponse.json(
        { error: 'course_id and admin_wallet are required' },
        { status: 400 }
      );
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', admin_wallet)
      .single();

    if (userError || !user?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get course details before deletion for logging
    const { data: course, error: fetchError } = await supabase
      .from('courses')
      .select('id, title, squad_name, created_by')
      .eq('id', course_id)
      .single();

    if (fetchError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Delete course (cascade will handle related records if foreign keys are set up)
    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', course_id);

    if (deleteError) {
      console.error('Error deleting course:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete course', details: deleteError.message },
        { status: 500 }
      );
    }

    // Log the deletion activity
    try {
      await supabase
        .from('user_activity')
        .insert({
          wallet_address: admin_wallet,
          activity_type: 'course_deleted',
          activity_data: {
            course_id,
            course_title: course.title,
            course_squad: course.squad_name,
            deleted_by: admin_wallet,
            deleted_at: new Date().toISOString()
          }
        });
    } catch (logError) {
      console.warn('Failed to log course deletion activity:', logError);
    }

    console.log('[COURSE DELETED]', {
      courseId: course_id,
      courseTitle: course.title,
      deletedBy: admin_wallet
    });

    return NextResponse.json({
      success: true,
      message: `Course "${course.title}" has been permanently deleted`,
      deleted_course: {
        id: course.id,
        title: course.title,
        squad_name: course.squad_name
      }
    });

  } catch (error) {
    console.error('Error in DELETE /api/courses:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}