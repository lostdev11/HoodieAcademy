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
 * Verify admin status
 */
async function verifyAdmin(adminWallet: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('is_admin')
    .eq('wallet_address', adminWallet)
    .single();
  
  return !error && data?.is_admin === true;
}

/**
 * GET /api/admin/social
 * Get all social posts for moderation (including hidden/flagged)
 * Query params:
 *   - adminWallet: Admin's wallet address (required)
 *   - limit: Number of posts (default: 50)
 *   - offset: Pagination offset (default: 0)
 *   - status: Filter by moderation_status (optional)
 *   - flagged: Show only flagged posts (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminWallet = searchParams.get('adminWallet');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const flaggedOnly = searchParams.get('flagged') === 'true';

    if (!adminWallet) {
      return NextResponse.json(
        { error: 'Admin wallet address is required' },
        { status: 400 }
      );
    }

    // Verify admin
    const isAdmin = await verifyAdmin(adminWallet);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseClient();

    // Build query (admin sees ALL posts, including hidden/flagged)
    let query = supabase
      .from('social_posts')
      .select(`
        *,
        author:users!social_posts_wallet_address_fkey(
          wallet_address,
          display_name,
          level,
          squad,
          is_admin,
          banned
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('moderation_status', status);
    }
    if (flaggedOnly) {
      query = query.eq('is_reported', true);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: posts, error } = await query;

    if (error) {
      console.error('Error fetching posts for admin:', error);
      return NextResponse.json(
        { error: 'Failed to fetch posts', details: error.message },
        { status: 500 }
      );
    }

    // Get counts for different statuses
    const { data: stats } = await supabase
      .from('social_posts')
      .select('moderation_status, is_reported, is_hidden', { count: 'exact' });

    const statusCounts = {
      total: stats?.length || 0,
      approved: stats?.filter(p => p.moderation_status === 'approved').length || 0,
      pending: stats?.filter(p => p.moderation_status === 'pending').length || 0,
      rejected: stats?.filter(p => p.moderation_status === 'rejected').length || 0,
      flagged: stats?.filter(p => p.is_reported).length || 0,
      hidden: stats?.filter(p => p.is_hidden).length || 0
    };

    return NextResponse.json({
      success: true,
      posts,
      stats: statusCounts,
      pagination: {
        limit,
        offset,
        total: statusCounts.total
      }
    });

  } catch (error) {
    console.error('Error in GET /api/admin/social:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/social
 * Moderate a social post
 * Body:
 *   - adminWallet: Admin's wallet (required)
 *   - postId: Post ID (required)
 *   - action: 'approve' | 'reject' | 'hide' | 'unhide' | 'pin' | 'unpin' | 'delete' (required)
 *   - reason: Moderation reason (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminWallet, postId, action, reason } = body;

    // Validation
    if (!adminWallet || !postId || !action) {
      return NextResponse.json(
        { error: 'adminWallet, postId, and action are required' },
        { status: 400 }
      );
    }

    // Verify admin
    const isAdmin = await verifyAdmin(adminWallet);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseClient();

    // Get post to verify it exists
    const { data: post, error: fetchError } = await supabase
      .from('social_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    let updateData: any = {
      moderated_by: adminWallet,
      moderated_at: new Date().toISOString()
    };

    if (reason) {
      updateData.moderation_reason = reason;
    }

    // Handle different actions
    switch (action) {
      case 'approve':
        updateData.moderation_status = 'approved';
        updateData.is_hidden = false;
        break;
      
      case 'reject':
        updateData.moderation_status = 'rejected';
        updateData.is_hidden = true;
        break;
      
      case 'hide':
        updateData.is_hidden = true;
        break;
      
      case 'unhide':
        updateData.is_hidden = false;
        break;
      
      case 'pin':
        updateData.is_pinned = true;
        break;
      
      case 'unpin':
        updateData.is_pinned = false;
        break;
      
      case 'delete':
        // Hard delete
        const { error: deleteError } = await supabase
          .from('social_posts')
          .delete()
          .eq('id', postId);

        if (deleteError) {
          console.error('Error deleting post:', deleteError);
          return NextResponse.json(
            { error: 'Failed to delete post' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Post deleted successfully',
          action: 'deleted'
        });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update post
    const { data: updatedPost, error: updateError } = await supabase
      .from('social_posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating post:', updateError);
      return NextResponse.json(
        { error: 'Failed to moderate post' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Post ${action}ed successfully`,
      post: updatedPost,
      action
    });

  } catch (error) {
    console.error('Error in POST /api/admin/social:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/social
 * Get social feed analytics
 * Body:
 *   - adminWallet: Admin's wallet (required)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminWallet } = body;

    if (!adminWallet) {
      return NextResponse.json(
        { error: 'Admin wallet is required' },
        { status: 400 }
      );
    }

    // Verify admin
    const isAdmin = await verifyAdmin(adminWallet);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseClient();

    // Get comprehensive analytics
    const [postsData, commentsData, reactionsData, topUsers] = await Promise.all([
      // Total posts
      supabase.from('social_posts').select('*', { count: 'exact', head: true }),
      
      // Total comments
      supabase.from('social_comments').select('*', { count: 'exact', head: true }),
      
      // Total reactions
      supabase.from('social_reactions').select('*', { count: 'exact', head: true }),
      
      // Top posters
      supabase
        .from('social_posts')
        .select('wallet_address, author:users!social_posts_wallet_address_fkey(display_name)')
        .limit(1000)
    ]);

    // Calculate top posters
    const postsByUser: Record<string, number> = {};
    topUsers.data?.forEach(post => {
      postsByUser[post.wallet_address] = (postsByUser[post.wallet_address] || 0) + 1;
    });

    const topPostersArray = Object.entries(postsByUser)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([wallet, count]) => ({
        wallet,
        postCount: count
      }));

    return NextResponse.json({
      success: true,
      analytics: {
        totalPosts: postsData.count || 0,
        totalComments: commentsData.count || 0,
        totalReactions: reactionsData.count || 0,
        topPosters: topPostersArray
      }
    });

  } catch (error) {
    console.error('Error in PATCH /api/admin/social:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

