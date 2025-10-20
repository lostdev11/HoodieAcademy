import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * GET /api/social/comments?postId={postId}
 * Fetch comments for a post
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { data: comments, error } = await supabase
      .from('social_comments')
      .select(`
        *,
        author:users!social_comments_wallet_address_fkey(
          wallet_address,
          display_name,
          level,
          squad
        ),
        replies:social_comments!parent_comment_id(
          *,
          author:users!social_comments_wallet_address_fkey(
            wallet_address,
            display_name,
            level,
            squad
          )
        )
      `)
      .eq('post_id', postId)
      .is('parent_comment_id', null) // Only top-level comments
      .eq('is_hidden', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      comments
    });

  } catch (error) {
    console.error('Error in GET /api/social/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/social/comments
 * Create a new comment or reply
 * Body:
 *   - walletAddress: User's wallet (required)
 *   - postId: Post ID (required)
 *   - content: Comment content (required, 1-2000 chars)
 *   - parentCommentId: Parent comment ID for nested replies (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      postId,
      content,
      parentCommentId
    } = body;

    // Validation
    if (!walletAddress || !postId || !content) {
      return NextResponse.json(
        { error: 'walletAddress, postId, and content are required' },
        { status: 400 }
      );
    }

    if (content.length < 1 || content.length > 2000) {
      return NextResponse.json(
        { error: 'Content must be between 1 and 2000 characters' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Verify post exists
    const { data: post, error: postError } = await supabase
      .from('social_posts')
      .select('id, wallet_address')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Create comment
    const { data: comment, error: commentError } = await supabase
      .from('social_comments')
      .insert({
        post_id: postId,
        parent_comment_id: parentCommentId,
        wallet_address: walletAddress,
        content,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (commentError) {
      console.error('Error creating comment:', commentError);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    // Award XP for commenting
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/xp/auto-reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          action: 'SOCIAL_COMMENT_POSTED',
          referenceId: comment.id,
          customXPAmount: 3,
          metadata: {
            comment_id: comment.id,
            post_id: postId,
            is_reply: !!parentCommentId
          }
        })
      });
    } catch (xpError) {
      console.warn('XP award failed (non-critical):', xpError);
    }

    return NextResponse.json({
      success: true,
      comment,
      message: 'Comment created successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/social/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/social/comments?id={commentId}&wallet={walletAddress}
 * Delete a comment (only author can delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');
    const walletAddress = searchParams.get('wallet');

    if (!commentId || !walletAddress) {
      return NextResponse.json(
        { error: 'Comment ID and wallet address are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Verify ownership
    const { data: comment, error: fetchError } = await supabase
      .from('social_comments')
      .select('wallet_address')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (comment.wallet_address !== walletAddress) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only delete your own comments' },
        { status: 403 }
      );
    }

    // Delete comment
    const { error: deleteError } = await supabase
      .from('social_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/social/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

