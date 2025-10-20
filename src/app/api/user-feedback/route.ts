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
 * Automatically awards XP when feedback is approved or implemented
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

    // Get the feedback submission to retrieve wallet address and previous status
    const { data: feedbackBefore, error: fetchError } = await supabase
      .from('user_feedback_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !feedbackBefore) {
      console.error('Error fetching feedback:', fetchError);
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
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

    // === AUTOMATIC XP REWARD ===
    let xpAwarded = 0;
    let xpReason = '';
    const previousStatus = feedbackBefore.status;
    const newStatus = status;
    
    // Award XP if status changed to approved or implemented
    if (previousStatus !== newStatus && (newStatus === 'approved' || newStatus === 'implemented')) {
      try {
        const action = newStatus === 'approved' ? 'FEEDBACK_APPROVED' : 'FEEDBACK_IMPLEMENTED';
        
        // Call auto-reward API
        const xpResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/xp/auto-reward`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: data.wallet_address,
            action: action,
            referenceId: id, // Prevents duplicate awards
            metadata: {
              feedback_id: id,
              feedback_title: data.title,
              feedback_category: data.category,
              previous_status: previousStatus,
              new_status: newStatus
            }
          })
        });

        if (xpResponse.ok) {
          const xpResult = await xpResponse.json();
          if (xpResult.success) {
            xpAwarded = xpResult.xpAwarded;
            xpReason = xpResult.reason;
            console.log('✅ [FEEDBACK] XP awarded:', { 
              wallet: data.wallet_address.slice(0, 10) + '...',
              xp: xpAwarded,
              reason: xpReason
            });
          }
        } else {
          const xpError = await xpResponse.json();
          // Don't fail the feedback update if XP award fails (duplicate is expected sometimes)
          if (!xpError.duplicate) {
            console.warn('⚠️ [FEEDBACK] XP award failed (non-critical):', xpError);
          }
        }
      } catch (xpError) {
        console.warn('⚠️ [FEEDBACK] XP award error (non-critical):', xpError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback updated successfully',
      submission: data,
      xpAwarded,
      xpReason,
      xpAwardedMessage: xpAwarded > 0 ? `User awarded ${xpAwarded} XP for ${xpReason}` : undefined
    });
  } catch (error) {
    console.error('Error in PATCH /api/user-feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

