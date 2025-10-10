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
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet_address');
    console.log('API: Loading course:', slug);
    
    // Create Supabase client - use service key if wallet_address is provided (admin mode)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      walletAddress ? process.env.SUPABASE_SERVICE_ROLE_KEY! : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    let isAdmin = false;
    let userSquad = null;
    
    // Get user info if wallet address provided
    if (walletAddress) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('squad_id, is_admin')
        .eq('wallet_address', walletAddress)
        .single();

      if (user && !userError) {
        userSquad = user.squad_id;
        isAdmin = user.is_admin || false;
      }
    } else {
      // Try auth-based user lookup
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('is_admin, squad_id')
          .eq('id', user.id)
          .single();
        
        isAdmin = userData?.is_admin || false;
        userSquad = userData?.squad_id;
      }
    }

    // Try to fetch by ID first (if slug looks like a UUID), then by slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    
    let query = supabase
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
      `);
    
    if (isUUID) {
      query = query.eq('id', slug);
    } else {
      query = query.eq('slug', slug);
    }

    const { data: dbCourse, error: dbError } = await query.single();

    if (dbCourse && !dbError) {
      // Check access permissions
      if (!isAdmin) {
        // Check if course is published and not hidden
        if (!dbCourse.is_published || dbCourse.is_hidden) {
          return NextResponse.json(
            { error: 'Course not available' },
            { status: 403 }
          );
        }

        // Check squad access
        if (dbCourse.squad_id !== userSquad && dbCourse.squad_id !== 'all') {
          return NextResponse.json(
            { error: 'Access denied: Course not available for your squad' },
            { status: 403 }
          );
        }
      }

      console.log('API: Course loaded from database:', dbCourse.title);
      return NextResponse.json({
        course: dbCourse,
        userSquad,
        isAdmin
      });
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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

    // Check if slug is UUID (ID) or actual slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.slug);
    
    const { data: course, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq(isUUID ? 'id' : 'slug', params.slug)
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
    console.error('Error in PUT /api/courses/[slug]:', error);
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
    
    // Check if slug is UUID (ID) or actual slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.slug);
    
    // Handle both database updates and file-based updates
    if (body.slug) {
      // Database update
      const validatedData = CourseUpdateSchema.parse(body);
      
      const { data: course, error } = await supabase
        .from('courses')
        .update(validatedData)
        .eq(isUUID ? 'id' : 'slug', params.slug)
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
        .eq(isUUID ? 'id' : 'slug', params.slug);

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
    const { searchParams } = new URL(request.url);
    const deletedBy = searchParams.get('deleted_by');

    if (!deletedBy) {
      return NextResponse.json(
        { error: 'Deleted_by is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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

    // Check if slug is UUID (ID) or actual slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.slug);

    // Delete course (cascade will handle related records)
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq(isUUID ? 'id' : 'slug', params.slug);

    if (error) {
      console.error('Error deleting course:', error);
      return NextResponse.json(
        { error: 'Failed to delete course' },
        { status: 500 }
      );
    }

    // Revalidate courses cache
    revalidateTag('courses');

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/courses/[slug]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
