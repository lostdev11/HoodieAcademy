import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/user-feedback
 * Fetch user feedback submissions (admin use)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status') || 'all';
    const category = searchParams.get('category') || 'all';

    let query = supabase
      .from('user_feedback_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user feedback:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feedback submissions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      submissions: data || [] 
    });
  } catch (error) {
    console.error('Error in GET /api/user-feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user-feedback
 * Submit user feedback
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, category, wallet_address } = body;

    // Validation
    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Title, description, and category are required' },
        { status: 400 }
      );
    }

    if (title.length > 100) {
      return NextResponse.json(
        { error: 'Title must be 100 characters or less' },
        { status: 400 }
      );
    }

    if (description.length > 1000) {
      return NextResponse.json(
        { error: 'Description must be 1000 characters or less' },
        { status: 400 }
      );
    }

    const validCategories = ['bug_report', 'feature_request', 'improvement', 'ui_ux', 'performance'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Insert feedback submission
    const { data, error } = await supabase
      .from('user_feedback_submissions')
      .insert({
        title,
        description,
        category,
        wallet_address: wallet_address || 'anonymous',
        status: 'pending',
        upvotes: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting user feedback:', error);
      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      submission: data
    });
  } catch (error) {
    console.error('Error in POST /api/user-feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user-feedback
 * Update feedback status (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, admin_notes } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'reviewing', 'approved', 'implemented', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const updateData: any = { status };
    if (admin_notes) {
      updateData.admin_notes = admin_notes;
    }

    const { data, error } = await supabase
      .from('user_feedback_submissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating feedback:', error);
      return NextResponse.json(
        { error: 'Failed to update feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback updated successfully',
      submission: data
    });
  } catch (error) {
    console.error('Error in PATCH /api/user-feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

