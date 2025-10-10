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

    // Build query
    let query = supabase
      .from('courses')
      .select(`
        *,
        course_sections (
          id,
          title,
          description,
          order_index,
          estimated_duration,
          is_required
        )
      `)
      .eq('is_published', true)
      .order('squad_id', { ascending: true })
      .order('order_index', { ascending: true });

    // Filter by squad if specified
    if (squadId) {
      query = query.eq('squad_id', squadId);
    }

    // Include hidden courses only for admins
    if (!includeHidden || !userIsAdmin) {
      query = query.eq('is_hidden', false);
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

    return NextResponse.json({
      courses: accessibleCourses,
      userSquad,
      isAdmin: userIsAdmin
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