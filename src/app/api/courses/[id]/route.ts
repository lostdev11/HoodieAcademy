import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/courses/[id]
 * Get a specific course with access control
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet_address');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Get user's squad and admin status
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

    // Get course with sections
    const { data: course, error } = await supabase
      .from('courses')
      .select(`
        *,
        course_sections (
          id,
          title,
          description,
          content,
          order_index,
          estimated_duration,
          is_required
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching course:', error);
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (!userIsAdmin) {
      // Check if course is published and not hidden
      if (!course.is_published || course.is_hidden) {
        return NextResponse.json(
          { error: 'Course not available' },
          { status: 403 }
        );
      }

      // Check squad access
      if (course.squad_id !== userSquad && course.squad_id !== 'all') {
        return NextResponse.json(
          { error: 'Access denied: Course not available for your squad' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      course,
      userSquad,
      isAdmin: userIsAdmin
    });

  } catch (error) {
    console.error('Error in GET /api/courses/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/courses/[id]
 * Update a course (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      is_published,
      is_hidden,
      updated_by 
    } = body;

    if (!updated_by) {
      return NextResponse.json(
        { error: 'Updated_by is required' },
        { status: 400 }
      );
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', updated_by)
      .single();

    if (userError || !user?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Update course
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (content !== undefined) updateData.content = content;
    if (squad_id !== undefined) updateData.squad_id = squad_id;
    if (squad_name !== undefined) updateData.squad_name = squad_name;
    if (difficulty_level !== undefined) updateData.difficulty_level = difficulty_level;
    if (estimated_duration !== undefined) updateData.estimated_duration = estimated_duration;
    if (xp_reward !== undefined) updateData.xp_reward = xp_reward;
    if (tags !== undefined) updateData.tags = tags;
    if (prerequisites !== undefined) updateData.prerequisites = prerequisites;
    if (is_published !== undefined) updateData.is_published = is_published;
    if (is_hidden !== undefined) updateData.is_hidden = is_hidden;

    const { data: course, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating course:', error);
      return NextResponse.json(
        { error: 'Failed to update course' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      course
    });

  } catch (error) {
    console.error('Error in PUT /api/courses/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/courses/[id]
 * Delete a course (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const deletedBy = searchParams.get('deleted_by');

    if (!deletedBy) {
      return NextResponse.json(
        { error: 'Deleted_by is required' },
        { status: 400 }
      );
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', deletedBy)
      .single();

    if (userError || !user?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Delete course (cascade will handle related records)
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting course:', error);
      return NextResponse.json(
        { error: 'Failed to delete course' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/courses/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
