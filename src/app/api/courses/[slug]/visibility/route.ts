import { NextRequest, NextResponse } from "next/server";
import { assertAdminOr403, handleError } from "../../../../../lib/route-handlers";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { supabase, user } = await assertAdminOr403();
    const { visible } = await req.json() as { visible: boolean };
    const { data, error } = await supabase
      .from("courses")
      .update({ is_visible: !!visible, updated_by: user.id, updated_at: new Date().toISOString() })
      .eq("slug", params.slug)
      .select()
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (e) { return handleError(e); }
}

/**
 * POST /api/courses/[slug]/visibility
 * Toggle course visibility (admin only)
 * Supports both 'id' and 'slug' lookup, and both 'is_hidden' and 'is_visible' fields
 */
export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const body = await request.json();
    const { admin_wallet, is_hidden } = body;

    if (!admin_wallet) {
      return NextResponse.json({ error: 'admin_wallet is required' }, { status: 400 });
    }

    if (is_hidden === undefined) {
      return NextResponse.json({ error: 'is_hidden is required' }, { status: 400 });
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', admin_wallet)
      .single();

    if (userError || !user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Try to find course by ID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.slug);
    
    let query = supabase.from('courses').select('id, title, is_hidden').single();
    
    if (isUUID) {
      query = query.eq('id', params.slug);
    } else {
      query = query.eq('slug', params.slug);
    }

    const { data: existingCourse, error: fetchError } = await query;

    if (fetchError || !existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Update course visibility
    const { data: course, error: updateError } = await supabase
      .from('courses')
      .update({
        is_hidden,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingCourse.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update course visibility', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Course ${is_hidden ? 'hidden' : 'shown'} successfully`,
      course: {
        id: course.id,
        title: course.title,
        is_hidden: course.is_hidden
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/courses/[slug]/visibility
 * Get current visibility status of a course
 */
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.slug);
    
    let query = supabase.from('courses').select('id, title, is_hidden, is_published').single();
    
    if (isUUID) {
      query = query.eq('id', params.slug);
    } else {
      query = query.eq('slug', params.slug);
    }

    const { data: course, error } = await query;

    if (error || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        is_hidden: course.is_hidden,
        is_published: course.is_published
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
