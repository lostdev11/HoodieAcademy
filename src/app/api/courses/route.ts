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
      // Soften failure: treat as non-admin anonymous user instead of 500
      console.warn('GET /api/courses: proceeding without user due to error:', userError);
    }

    const userSquad = user?.squad_id;
    const userIsAdmin = user?.is_admin || false;

    // Build query - select all columns (let Supabase handle which exist)
    let query = supabase
      .from('courses')
      .select('*');

    // Filter by squad if specified
    if (squadId) {
      query = query.eq('squad_id', squadId);
    }

    // Admin vs Regular User Logic
    if (userIsAdmin) {
      // Admins see ALL courses (published, unpublished, hidden, visible)
      // No additional filters needed
    } else {
      // Regular users only see published courses (if those columns exist)
      try {
        query = query.eq('is_published', true);
      } catch (e) {
        // Column might not exist, ignore
      }
    }

    const { data: courses, error } = await query;

    if (error) {
      console.error('Error fetching courses:', error);
      // Return empty array instead of error to prevent dashboard breaking
      return NextResponse.json({
        courses: [],
        userSquad,
        isAdmin: userIsAdmin,
        stats: null
      });
    }

    // Visibility filtering (handles mixed schemas: is_hidden / is_visible)
    const visibilityFiltered = (courses || []).filter(course => {
      if (userIsAdmin) {
        // Admins can optionally hide hidden courses unless include_hidden=true
        if (!includeHidden) {
          if (course.is_hidden === true) return false;
          if (course.is_visible === false) return false;
        }
        return true;
      }
      // Regular users: must be visible and published
      if (course.is_hidden === true) return false;
      if (course.is_visible === false) return false;
      if (course.is_published === false) return false;
      return true;
    });

    // Filter courses based on user's squad access
    const accessibleCourses = visibilityFiltered.filter(course => {
      if (userIsAdmin) return true;
      return course.squad_id === userSquad || course.squad_id === 'all';
    });

    // Add course statistics (always return for client simplicity)
    const courseStats = (() => {
      const all = courses || [];
      
      // Helper function to determine if a course is hidden (handles both schemas and nulls properly)
      const isCourseHidden = (course: any): boolean => {
        // Check is_hidden first (if it exists and is explicitly true, course is hidden)
        if (course.is_hidden === true) return true;
        // Check is_visible (if it exists and is explicitly false, course is hidden)
        if (course.is_visible === false) return true;
        // If is_hidden exists and is explicitly false, course is visible
        if (course.is_hidden === false) return false;
        // If is_visible exists and is explicitly true, course is visible
        if (course.is_visible === true) return false;
        // Default: if neither is explicitly set or both are null/undefined, assume visible
        return false;
      };
      
      const allPublished = all.filter(c => c.is_published === true).length;
      const allUnpublished = all.filter(c => c.is_published === false).length;
      const allVisible = all.filter(c => !isCourseHidden(c)).length;
      const allHidden = all.filter(c => isCourseHidden(c)).length;

      // Stats for the list as currently filtered (visibility + squad)
      const returned = accessibleCourses;
      const returnedVisible = returned.filter(c => !isCourseHidden(c)).length;
      const returnedHidden = returned.filter(c => isCourseHidden(c)).length;
      const returnedPublished = returned.filter(c => c.is_published === true).length;
      const returnedUnpublished = returned.filter(c => c.is_published === false).length;

      return {
        // Overall across all courses in DB (for admin context/overview)
        totalAll: all.length,
        publishedAll: allPublished,
        unpublishedAll: allUnpublished,
        visibleAll: allVisible,
        hiddenAll: allHidden,
        // Counts for the set actually returned by this request
        totalReturned: returned.length,
        publishedReturned: returnedPublished,
        unpublishedReturned: returnedUnpublished,
        visibleReturned: returnedVisible,
        hiddenReturned: returnedHidden,
        // Backward-compatible fields - for admins, use ALL courses stats; for regular users, use returned subset
        total: userIsAdmin ? all.length : returned.length,
        published: userIsAdmin ? allPublished : returnedPublished,
        unpublished: userIsAdmin ? allUnpublished : returnedUnpublished,
        visible: userIsAdmin ? allVisible : returnedVisible,
        hidden: userIsAdmin ? allHidden : returnedHidden,
        // Echo flags to explain filtering behavior on the client if needed
        filters: {
          include_hidden: includeHidden,
          squad_id: squadId || null,
          isAdmin: userIsAdmin
        }
      };
    })();

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
      order_index,
      // Bulk controls
      bulk,
      scope, // 'all' | 'squad'
      squad_id
    } = body;

    console.log('[COURSE UPDATE] Request:', {
      course_id,
      admin_wallet,
      is_hidden,
      is_published
    });

    // Validate admin_wallet always present
    if (!admin_wallet) {
      return NextResponse.json(
        { error: 'admin_wallet is required' },
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
    const updateData: any = {};

    if (is_hidden !== undefined) {
      // Support both schemas: try is_visible first (matches schema), is_hidden as fallback
      // Don't set both at once - causes errors if one column doesn't exist
      updateData.is_visible = !is_hidden;
    }

    if (is_published !== undefined) {
      updateData.is_published = is_published;
    }

    if (order_index !== undefined) {
      updateData.order_index = order_index;
    }

    // Handle BULK update (hide/unhide/publish) when requested
    if (bulk === true) {

      // Validate scope when targeting a squad
      if (scope === 'squad' && !squad_id) {
        return NextResponse.json(
          { error: 'squad_id is required when scope is "squad"' },
          { status: 400 }
        );
      }

      // Must provide at least one updatable field
      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { error: 'Provide at least one of is_hidden, is_published, order_index for bulk update' },
          { status: 400 }
        );
      }

      // Check table schema first to determine which columns exist
      const { data: sampleCourse } = await supabase
        .from('courses')
        .select('*')
        .limit(1)
        .single();

      const attemptBulk = async (data: Record<string, any>) => {
        // Skip if data is empty
        if (Object.keys(data).length === 0) {
          return { data: null, error: { message: 'Empty update data' } };
        }
        
        let q = supabase.from('courses').update(data);
        
        // Always add a WHERE clause (required by PostgreSQL/Supabase for safety)
        if (scope === 'squad' && squad_id) {
          // Filter by squad - try both possible column names
          const hasSquad = sampleCourse && ('squad' in sampleCourse);
          const hasSquadId = sampleCourse && ('squad_id' in sampleCourse);
          
          if (hasSquad) {
            q = q.eq('squad', squad_id);
          } else if (hasSquadId) {
            q = q.eq('squad_id', squad_id);
          } else {
            // If neither squad column exists, we can't filter by squad
            return { data: null, error: { message: 'Cannot filter by squad: squad or squad_id column not found' } };
          }
        } else {
          // For 'all' scope, use a WHERE clause that matches all rows
          // Since id is UUID (not TEXT), we need a different approach
          // Use created_at IS NOT NULL to match all existing courses (all courses should have a created_at)
          q = q.not('created_at', 'is', null);
        }
        
        // Use select with wildcard - Supabase requires select for updates
        return await q.select('*');
      };
      
      const hasIsVisible = sampleCourse && 'is_visible' in sampleCourse;
      const hasIsHidden = sampleCourse && 'is_hidden' in sampleCourse;
      
      console.log('[COURSE BULK UPDATE] Schema check', { 
        hasIsVisible,
        hasIsHidden,
        hasSquad: sampleCourse ? 'squad' in sampleCourse : false,
        hasSquadId: sampleCourse ? 'squad_id' in sampleCourse : false,
        columns: sampleCourse ? Object.keys(sampleCourse) : []
      });

      // Build correct update data based on which column exists
      const correctUpdateData: Record<string, any> = {};
      
      // Handle visibility column - use whichever exists in the schema
      if (is_hidden !== undefined) {
        if (hasIsHidden) {
          // Schema uses is_hidden column
          correctUpdateData.is_hidden = is_hidden;
        } else if (hasIsVisible) {
          // Schema uses is_visible column (inverse of is_hidden)
          correctUpdateData.is_visible = !is_hidden;
        } else {
          // Neither column exists - this shouldn't happen but handle gracefully
          return NextResponse.json({
            success: false,
            message: 'Courses table does not have is_hidden or is_visible column',
            updatedCount: 0,
            scope: scope || 'all',
            squad_id: squad_id || null,
            error: { message: 'Missing visibility column in courses table' }
          }, { status: 400 });
        }
      }

      // Add other fields if provided
      if (is_published !== undefined) {
        correctUpdateData.is_published = is_published;
      }
      if (order_index !== undefined) {
        correctUpdateData.order_index = order_index;
      }

      console.log('[COURSE BULK UPDATE] Starting bulk update', { scope, squad_id, admin_wallet, changes: correctUpdateData });
      let { data: updatedRows, error: bulkErr } = await attemptBulk(correctUpdateData);

      if (bulkErr) {
        const errorDetails = {
          code: (bulkErr as any)?.code || null,
          message: (bulkErr as any)?.message || String(bulkErr),
          details: (bulkErr as any)?.details || null,
          hint: (bulkErr as any)?.hint || null
        };
        console.error('[COURSE BULK UPDATE] Bulk update failed; returning diagnostic payload', {
          error: bulkErr,
          ...errorDetails,
          attemptedColumns: hasIsHidden ? ['is_hidden'] : hasIsVisible ? ['is_visible'] : ['none found'],
          updateData: correctUpdateData
        });
        return NextResponse.json({
          success: false,
          message: `Bulk update failed: ${errorDetails.message || 'Unknown error'}`,
          updatedCount: 0,
          scope: scope || 'all',
          squad_id: squad_id || null,
          error: errorDetails
        });
      }

      const updatedCount = (updatedRows || []).length;
      console.log('[COURSE BULK UPDATE] Success', { updatedCount, scope: scope || 'all', squad_id: squad_id || null });
      return NextResponse.json({
        success: true,
        message: `Bulk update applied to ${updatedCount} course(s)`,
        updatedCount,
        scope: scope || 'all',
        squad_id: squad_id || null,
        changes: correctUpdateData
      });
    }

    // Single-course update with fallback for schema differences
    let course: any | null = null;
    let error: any | null = null;

    const attemptUpdate = async (data: Record<string, any>) => {
      return await supabase
        .from('courses')
        .update(data)
        .eq('id', course_id)
        .select()
        .single();
    };

    // Validate course_id for single update
    if (!course_id) {
      return NextResponse.json(
        { error: 'course_id is required for single update (or pass bulk=true)' },
        { status: 400 }
      );
    }

    // First attempt: as-is
    {
      const res = await attemptUpdate(updateData);
      course = res.data;
      error = res.error;
    }

    // If column not found (42703), try fallback variants
    if (error && (error.code === '42703' || (error.message && error.message.includes('column')))) {
      console.warn('[COURSE UPDATE] Column mismatch, attempting fallback schema...', { updateData, code: error.code, message: error.message });

      // Attempt 1: update with only is_visible
      const onlyVisible: Record<string, any> = {};
      if (Object.prototype.hasOwnProperty.call(updateData, 'is_visible')) {
        onlyVisible.is_visible = updateData.is_visible;
      }
      if (Object.prototype.hasOwnProperty.call(updateData, 'is_published')) {
        onlyVisible.is_published = updateData.is_published;
      }
      if (Object.prototype.hasOwnProperty.call(updateData, 'order_index')) {
        onlyVisible.order_index = updateData.order_index;
      }
      {
        const res2 = await attemptUpdate(onlyVisible);
        course = res2.data;
        error = res2.error;
      }

      // Attempt 2: if still failing, try only is_hidden
      if (error && (error.code === '42703' || (error.message && error.message.includes('column')))) {
        const onlyHidden: Record<string, any> = {};
        if (Object.prototype.hasOwnProperty.call(updateData, 'is_hidden')) {
          onlyHidden.is_hidden = updateData.is_hidden;
        }
        if (Object.prototype.hasOwnProperty.call(updateData, 'is_published')) {
          onlyHidden.is_published = updateData.is_published;
        }
        if (Object.prototype.hasOwnProperty.call(updateData, 'order_index')) {
          onlyHidden.order_index = updateData.order_index;
        }
        const res3 = await attemptUpdate(onlyHidden);
        course = res3.data;
        error = res3.error;
      }
    }

    if (error) {
      console.error('Error updating course:', error);
      if ((error as any).code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Course not found', details: 'No course matched the provided course_id' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to update course', details: error.message, code: (error as any).code },
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