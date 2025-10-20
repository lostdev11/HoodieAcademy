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
 * GET /api/social/reactions
 * Get user's reactions for posts/comments
 * Query params:
 *   - wallet: User's wallet address (required)
 *   - targetType: 'post' or 'comment' (optional)
 *   - targetId: Specific target ID (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');

    if (!wallet) {
      return NextResponse.json(
        { error: 'wallet is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    let query = supabase
      .from('social_reactions')
      .select('*')
      .eq('wallet_address', wallet);

    if (targetType) {
      query = query.eq('target_type', targetType);
    }

    if (targetId) {
      query = query.eq('target_id', targetId);
    }

    const { data: reactions, error } = await query;

    if (error) {
      console.error('Error fetching reactions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reactions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reactions
    });

  } catch (error) {
    console.error('Error in GET /api/social/reactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/social/reactions
 * Add or update a reaction
 * Body:
 *   - walletAddress: User's wallet (required)
 *   - targetType: 'post' or 'comment' (required)
 *   - targetId: Post/comment ID (required)
 *   - reactionType: 'like' | 'dislike' | 'love' | 'fire' | 'rocket' (required)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      targetType,
      targetId,
      reactionType
    } = body;

    // Validation
    if (!walletAddress || !targetType || !targetId || !reactionType) {
      return NextResponse.json(
        { error: 'walletAddress, targetType, targetId, and reactionType are required' },
        { status: 400 }
      );
    }

    const validTargetTypes = ['post', 'comment'];
    if (!validTargetTypes.includes(targetType)) {
      return NextResponse.json(
        { error: 'targetType must be "post" or "comment"' },
        { status: 400 }
      );
    }

    const validReactionTypes = ['like', 'dislike', 'love', 'fire', 'rocket'];
    if (!validReactionTypes.includes(reactionType)) {
      return NextResponse.json(
        { error: 'Invalid reactionType' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Verify target exists
    const targetTable = targetType === 'post' ? 'social_posts' : 'social_comments';
    const { data: target, error: targetError } = await supabase
      .from(targetTable)
      .select('id, wallet_address')
      .eq('id', targetId)
      .single();

    if (targetError || !target) {
      return NextResponse.json(
        { error: `${targetType} not found` },
        { status: 404 }
      );
    }

    // Check if reaction already exists
    const { data: existingReaction } = await supabase
      .from('social_reactions')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .maybeSingle();

    let reaction;
    let isNew = false;

    if (existingReaction) {
      // Update existing reaction if different
      if (existingReaction.reaction_type === reactionType) {
        // Same reaction - remove it (toggle off)
        const { error: deleteError } = await supabase
          .from('social_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (deleteError) {
          console.error('Error removing reaction:', deleteError);
          return NextResponse.json(
            { error: 'Failed to remove reaction' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          action: 'removed',
          message: 'Reaction removed'
        });
      } else {
        // Different reaction - update it
        const { data: updated, error: updateError } = await supabase
          .from('social_reactions')
          .update({ reaction_type: reactionType })
          .eq('id', existingReaction.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating reaction:', updateError);
          return NextResponse.json(
            { error: 'Failed to update reaction' },
            { status: 500 }
          );
        }

        reaction = updated;
      }
    } else {
      // Create new reaction
      const { data: created, error: createError } = await supabase
        .from('social_reactions')
        .insert({
          wallet_address: walletAddress,
          target_type: targetType,
          target_id: targetId,
          reaction_type: reactionType,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating reaction:', createError);
        return NextResponse.json(
          { error: 'Failed to create reaction' },
          { status: 500 }
        );
      }

      reaction = created;
      isNew = true;
    }

    // Award XP for reactions (only for likes/positive reactions, not dislikes)
    if (isNew && ['like', 'love', 'fire', 'rocket'].includes(reactionType)) {
      try {
        // Award XP to the content creator, not the person reacting
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/xp/auto-reward`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: target.wallet_address, // Creator gets XP
            action: 'SOCIAL_POST_LIKED',
            referenceId: `${targetType}_${targetId}_liked_by_${walletAddress}`,
            customXPAmount: 1,
            metadata: {
              target_type: targetType,
              target_id: targetId,
              reaction_type: reactionType,
              liked_by: walletAddress
            }
          })
        });
      } catch (xpError) {
        console.warn('XP award failed (non-critical):', xpError);
      }
    }

    return NextResponse.json({
      success: true,
      reaction,
      action: isNew ? 'created' : 'updated',
      message: `Reaction ${isNew ? 'added' : 'updated'} successfully`
    });

  } catch (error) {
    console.error('Error in POST /api/social/reactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/social/reactions?wallet={walletAddress}&targetType={type}&targetId={id}
 * Remove a reaction
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');

    if (!walletAddress || !targetType || !targetId) {
      return NextResponse.json(
        { error: 'wallet, targetType, and targetId are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { error: deleteError } = await supabase
      .from('social_reactions')
      .delete()
      .eq('wallet_address', walletAddress)
      .eq('target_type', targetType)
      .eq('target_id', targetId);

    if (deleteError) {
      console.error('Error deleting reaction:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete reaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reaction removed successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/social/reactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

