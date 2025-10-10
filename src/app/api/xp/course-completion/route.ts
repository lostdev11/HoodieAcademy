import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
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

// XP rewards for different course types
const COURSE_XP_REWARDS = {
  'wallet-wizardry': 100,
  'nft-mastery': 100,
  'meme-coin-mania': 100,
  'community-strategy': 100,
  'sns': 100,
  'technical-analysis': 100,
  'cybersecurity-wallet-practices': 100,
  'ai-automation-curriculum': 100,
  'lore-narrative-crafting': 100,
  'nft-trading-psychology': 100,
  // Default XP for any course not listed
  'default': 50
};

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 [COURSE COMPLETION] Request received');
    const supabase = getSupabaseClient();
    
    const { 
      walletAddress, 
      courseId, 
      courseTitle, 
      customXP = null,
      metadata = {} 
    } = await request.json();
    
    if (!walletAddress || !courseId) {
      return NextResponse.json(
        { error: 'Missing required parameters: walletAddress, courseId' },
        { status: 400 }
      );
    }

    console.log('📚 [COURSE COMPLETION] Processing completion:', {
      walletAddress,
      courseId,
      courseTitle,
      customXP
    });

    // Check if user already completed this course
    const { data: existingCompletion, error: checkError } = await supabase
      .from('course_completions')
      .select('id, completed_at')
      .eq('wallet_address', walletAddress)
      .eq('course_id', courseId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ [COURSE COMPLETION] Error checking existing completion:', checkError);
      return NextResponse.json(
        { error: 'Failed to check course completion status' },
        { status: 500 }
      );
    }

    if (existingCompletion) {
      console.log('⚠️ [COURSE COMPLETION] User already completed this course');
      return NextResponse.json({
        success: false,
        message: 'Course already completed',
        alreadyCompleted: true,
        completedAt: existingCompletion.completed_at
      });
    }

    // Determine XP reward
    const xpReward = customXP || COURSE_XP_REWARDS[courseId as keyof typeof COURSE_XP_REWARDS] || COURSE_XP_REWARDS.default;

    // Get current user data
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('total_xp, level, display_name')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('❌ [COURSE COMPLETION] Error fetching user:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If user doesn't exist, create them
    if (!currentUser) {
      console.log('👤 [COURSE COMPLETION] User not found, creating new user:', walletAddress);
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .upsert({
          wallet_address: walletAddress,
          display_name: `User ${walletAddress.slice(0, 6)}...`,
          total_xp: 0,
          level: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'wallet_address'
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ [COURSE COMPLETION] Error creating user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }
    }

    // Calculate new XP and level
    const previousXP = currentUser?.total_xp || 0;
    const newTotalXP = previousXP + xpReward;
    const newLevel = Math.floor(newTotalXP / 1000) + 1;
    const levelUp = newLevel > (currentUser?.level || 1);

    console.log('📊 [COURSE COMPLETION] XP calculation:', {
      previousXP,
      courseReward: xpReward,
      newTotalXP,
      levelUp
    });

    // Start a transaction to update user XP and record course completion
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        total_xp: newTotalXP,
        level: newLevel,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', walletAddress)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [COURSE COMPLETION] Error updating user XP:', updateError);
      return NextResponse.json(
        { error: 'Failed to award course completion XP' },
        { status: 500 }
      );
    }

    // Record course completion
    const { error: completionError } = await supabase
      .from('course_completions')
      .insert({
        wallet_address: walletAddress,
        course_id: courseId,
        completed_at: new Date().toISOString(),
        xp_earned: xpReward
      });

    if (completionError) {
      console.error('❌ [COURSE COMPLETION] Error recording completion:', completionError);
      // Don't fail the request, but log the error
    }

    // Log the course completion activity
    const { error: activityError } = await supabase
      .from('user_activity')
      .insert({
        wallet_address: walletAddress,
        activity_type: 'course_completion',
        metadata: {
          course_id: courseId,
          course_title: courseTitle || courseId,
          xp_earned: xpReward,
          previous_xp: previousXP,
          new_total_xp: newTotalXP,
          level_up: levelUp,
          ...metadata
        },
        created_at: new Date().toISOString()
      });

    if (activityError) {
      console.error('⚠️ [COURSE COMPLETION] Failed to log activity (non-critical):', activityError);
    }

    console.log('✅ [COURSE COMPLETION] Successfully processed course completion:', {
      wallet: walletAddress,
      course: courseId,
      xpAwarded: xpReward,
      newTotalXP,
      levelUp
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      courseId: courseId,
      courseTitle: courseTitle || courseId,
      xpAwarded: xpReward,
      newTotalXP: newTotalXP,
      levelUp: levelUp,
      message: `Course completed! +${xpReward} XP earned!`,
      // Include data for real-time updates
      refreshLeaderboard: true,
      targetWallet: walletAddress,
      newTotalXP,
      xpAwarded: xpReward,
      reason: `Course completion: ${courseTitle || courseId}`,
      levelUp
    });

  } catch (error) {
    console.error('❌ [COURSE COMPLETION] Error in course completion API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check course completion status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    const courseId = searchParams.get('course');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    let query = supabase
      .from('course_completions')
      .select('*')
      .eq('wallet_address', walletAddress);

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data: completions, error: completionError } = await query
      .order('completed_at', { ascending: false });

    if (completionError) {
      console.error('❌ [COURSE COMPLETION] Error fetching completions:', completionError);
      return NextResponse.json(
        { error: 'Failed to fetch course completions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      walletAddress,
      courseId: courseId || 'all',
      completions: completions || [],
      totalCompletions: completions?.length || 0,
      totalXPEarned: completions?.reduce((sum, completion) => sum + (completion.xp_earned || 0), 0) || 0
    });

  } catch (error) {
    console.error('❌ [COURSE COMPLETION] Error in GET request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
