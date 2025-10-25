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
 * GET /api/social/posts
 * Fetch social feed posts with pagination
 * Query params:
 *   - limit: Number of posts to fetch (default: 20, max: 50)
 *   - offset: Pagination offset (default: 0)
 *   - squad: Filter by squad (optional)
 *   - wallet: Filter by wallet address (optional)
 *   - tags: Filter by tags (comma-separated, optional)
 *   - sort: Sort order ('newest', 'popular', 'trending') (default: 'newest')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');
    const squad = searchParams.get('squad');
    const wallet = searchParams.get('wallet');
    const tags = searchParams.get('tags')?.split(',');
    const sort = searchParams.get('sort') || 'newest';

    const supabase = getSupabaseClient();

    // Build query
    let query = supabase
      .from('social_posts')
      .select(`
        *,
        users!social_posts_wallet_address_fkey(
          wallet_address,
          display_name,
          level,
          squad
        )
      `)
      .eq('moderation_status', 'approved')
      .eq('is_hidden', false);

    // Apply filters
    if (squad) {
      query = query.eq('squad', squad);
    }
    if (wallet) {
      query = query.eq('wallet_address', wallet);
    }
    if (tags && tags.length > 0) {
      query = query.contains('tags', tags);
    }

    // Apply sorting
    switch (sort) {
      case 'popular':
        query = query.order('likes_count', { ascending: false });
        break;
      case 'trending':
        // Trending = combination of recent + popular
        query = query
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('likes_count', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: posts, error, count } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      
      // Check if table doesn't exist
      if (error.message?.includes('relation "social_posts" does not exist') || 
          error.code === '42P01') {
        return NextResponse.json(
          { 
            success: true,
            posts: [],
            message: 'Social feed not yet set up. Run setup-social-feed.sql to create tables.',
            needsSetup: true,
            pagination: { limit, offset, total: 0, hasMore: false }
          }
        );
      }
      
      // Check if foreign key relationship doesn't exist yet
      if (error.message?.includes('Could not find a relationship') || 
          error.message?.includes('schema cache')) {
        console.log('Foreign key relationship not found - fetching posts without user data');
        // Try fetching without the relationship
        const { data: postsWithoutUser, error: simpleError } = await supabase
          .from('social_posts')
          .select('*')
          .eq('moderation_status', 'approved')
          .eq('is_hidden', false)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (simpleError) {
          return NextResponse.json(
            { error: 'Failed to fetch posts', details: simpleError.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          posts: postsWithoutUser || [],
          pagination: {
            limit,
            offset,
            total: postsWithoutUser?.length || 0,
            hasMore: false
          }
        });
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch posts', details: error.message },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('social_posts')
      .select('*', { count: 'exact', head: true })
      .eq('moderation_status', 'approved')
      .eq('is_hidden', false);

    // Map users to author for consistency with frontend
    const postsWithAuthor = posts?.map((post: any) => ({
      ...post,
      author: post.users || null
    })) || [];

    return NextResponse.json({
      success: true,
      posts: postsWithAuthor,
      pagination: {
        limit,
        offset,
        total: totalCount || 0,
        hasMore: (offset + limit) < (totalCount || 0)
      }
    });

  } catch (error) {
    console.error('Error in GET /api/social/posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/social/posts
 * Create a new social post
 * Body:
 *   - walletAddress: User's wallet (required)
 *   - content: Post content (required, 1-5000 chars)
 *   - postType: 'text' | 'image' | 'link' | 'poll' (default: 'text')
 *   - imageUrl: Image URL if postType is 'image' (optional)
 *   - linkUrl: Link URL if postType is 'link' (optional)
 *   - tags: Array of tags (optional)
 *   - squad: User's squad (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      content,
      postType = 'text',
      imageUrl,
      linkUrl,
      linkTitle,
      linkDescription,
      tags = [],
      squad
    } = body;

    // Validation
    if (!walletAddress || !content) {
      return NextResponse.json(
        { error: 'walletAddress and content are required' },
        { status: 400 }
      );
    }

    if (content.length < 1 || content.length > 5000) {
      return NextResponse.json(
        { error: 'Content must be between 1 and 5000 characters' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('wallet_address, display_name, squad')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (userError) {
      console.error('Error checking user:', userError);
      return NextResponse.json(
        { error: 'Failed to verify user' },
        { status: 500 }
      );
    }

    // Create post - try with relationship first, fallback to simple query if FK doesn't exist
    let post: any;
    let postError: any;

    // First attempt: with foreign key relationship
    const { data: postWithUser, error: errorWithUser } = await supabase
      .from('social_posts')
      .insert({
        wallet_address: walletAddress,
        content,
        post_type: postType,
        image_url: imageUrl,
        link_url: linkUrl,
        link_title: linkTitle,
        link_description: linkDescription,
        tags,
        squad: squad || user?.squad,
        moderation_status: 'approved',
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        users!social_posts_wallet_address_fkey(
          wallet_address,
          display_name,
          level,
          squad,
          is_admin
        )
      `)
      .single();

    post = postWithUser;
    postError = errorWithUser;

    // If relationship doesn't exist, create without it and fetch user separately
    if (errorWithUser && (errorWithUser.message?.includes('Could not find a relationship') || errorWithUser.message?.includes('schema cache'))) {
      console.log('Foreign key relationship not found - creating post without relationship');
      
      const { data: simplePost, error: simpleError } = await supabase
        .from('social_posts')
        .insert({
          wallet_address: walletAddress,
          content,
          post_type: postType,
          image_url: imageUrl,
          link_url: linkUrl,
          link_title: linkTitle,
          link_description: linkDescription,
          tags,
          squad: squad || user?.squad,
          moderation_status: 'approved',
          created_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (simpleError) {
        console.error('Error creating post:', simpleError);
        return NextResponse.json(
          { error: 'Failed to create post', details: simpleError.message },
          { status: 500 }
        );
      }

      post = simplePost;
      
      // Manually attach user data
      if (post) {
        post.users = user ? {
          wallet_address: user.wallet_address,
          display_name: user.display_name,
          squad: user.squad
        } : null;
      }
    } else if (postError) {
      console.error('Error creating post:', postError);
      return NextResponse.json(
        { error: 'Failed to create post', details: postError.message },
        { status: 500 }
      );
    }

    // Award XP for creating post (using auto-reward API)
    if (post?.id) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/xp/auto-reward`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress,
            action: 'SOCIAL_POST_CREATED',
            referenceId: post.id,
            metadata: {
              post_id: post.id,
              post_type: postType
            }
          })
        });
      } catch (xpError) {
        console.warn('XP award failed (non-critical):', xpError);
      }
    }

    // Map users to author for consistency with frontend
    const postWithAuthor: any = {
      ...post,
      author: post.users || null
    };

    return NextResponse.json({
      success: true,
      post: postWithAuthor,
      message: 'Post created successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/social/posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/social/posts?id={postId}&wallet={walletAddress}
 * Delete a post (only author can delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');
    const walletAddress = searchParams.get('wallet');

    if (!postId || !walletAddress) {
      return NextResponse.json(
        { error: 'Post ID and wallet address are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Verify ownership
    const { data: post, error: fetchError } = await supabase
      .from('social_posts')
      .select('wallet_address')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.wallet_address !== walletAddress) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only delete your own posts' },
        { status: 403 }
      );
    }

    // Delete post (cascade will delete comments and reactions)
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
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/social/posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

