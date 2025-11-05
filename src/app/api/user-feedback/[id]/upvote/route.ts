import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/user-feedback/[id]/upvote
 * Add or remove an upvote for a feedback submission
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { wallet_address } = body;
    const feedback_id = params.id;

    if (!wallet_address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!feedback_id) {
      return NextResponse.json(
        { error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    // Check if feedback exists
    const { data: feedback, error: feedbackError } = await supabase
      .from('user_feedback_submissions')
      .select('id, wallet_address')
      .eq('id', feedback_id)
      .single();

    if (feedbackError || !feedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    // Prevent users from upvoting their own feedback
    if (feedback.wallet_address === wallet_address) {
      return NextResponse.json(
        { error: 'Cannot upvote your own feedback' },
        { status: 400 }
      );
    }

    // Check if user already upvoted
    const { data: existingVote, error: checkError } = await supabase
      .from('user_feedback_upvotes')
      .select('id')
      .eq('feedback_id', feedback_id)
      .eq('wallet_address', wallet_address)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected
      console.error('Error checking existing vote:', checkError);
      return NextResponse.json(
        { error: 'Failed to check vote status' },
        { status: 500 }
      );
    }

    if (existingVote) {
      // Remove the upvote (toggle off)
      const { error: deleteError } = await supabase
        .from('user_feedback_upvotes')
        .delete()
        .eq('id', existingVote.id);

      if (deleteError) {
        console.error('Error removing upvote:', deleteError);
        return NextResponse.json(
          { error: 'Failed to remove upvote' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        upvoted: false,
        message: 'Upvote removed'
      });
    } else {
      // Add the upvote
      const { error: insertError } = await supabase
        .from('user_feedback_upvotes')
        .insert({
          feedback_id,
          wallet_address
        });

      if (insertError) {
        console.error('Error adding upvote:', insertError);
        return NextResponse.json(
          { error: 'Failed to add upvote' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        upvoted: true,
        message: 'Upvote added'
      });
    }
  } catch (error) {
    console.error('Error in POST /api/user-feedback/[id]/upvote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user-feedback/[id]/upvote
 * Check if a wallet has upvoted a specific feedback
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet_address = searchParams.get('wallet_address');
    const feedback_id = params.id;

    if (!wallet_address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Check if user has upvoted
    const { data, error } = await supabase
      .from('user_feedback_upvotes')
      .select('id')
      .eq('feedback_id', feedback_id)
      .eq('wallet_address', wallet_address)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking upvote status:', error);
      return NextResponse.json(
        { error: 'Failed to check upvote status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      upvoted: !!data
    });
  } catch (error) {
    console.error('Error in GET /api/user-feedback/[id]/upvote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

