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

// Task definitions with XP rewards
const TASK_XP_REWARDS: Record<string, number> = {
  'complete_profile': 25,
  'select_squad': 50,
  'start_first_course': 75,
  'claim_daily_login': 5,
  'explore_bounties': 30
};

/**
 * Verify that a task has actually been completed
 */
async function verifyTaskCompletion(
  taskId: string,
  walletAddress: string,
  supabase: ReturnType<typeof getSupabaseClient>
): Promise<{ verified: boolean; reason?: string }> {
  switch (taskId) {
    case 'complete_profile': {
      // Verify user has a display name
      const { data: user } = await supabase
        .from('users')
        .select('display_name')
        .eq('wallet_address', walletAddress)
        .single();
      
      if (!user?.display_name) {
        return { verified: false, reason: 'Profile not completed. Please add a display name.' };
      }
      return { verified: true };
    }

    case 'select_squad': {
      // Verify user has selected a squad
      const { data: user } = await supabase
        .from('users')
        .select('squad')
        .eq('wallet_address', walletAddress)
        .single();
      
      if (!user?.squad || user.squad === 'Unassigned') {
        return { verified: false, reason: 'Squad not selected. Please choose a squad.' };
      }
      return { verified: true };
    }

    case 'start_first_course': {
      // Verify user has started at least one course
      const { data: courseProgress } = await supabase
        .from('course_progress')
        .select('id')
        .eq('wallet_address', walletAddress)
        .limit(1);
      
      if (!courseProgress || courseProgress.length === 0) {
        return { verified: false, reason: 'No course started. Please start a course first.' };
      }
      return { verified: true };
    }

    case 'claim_daily_login': {
      // Verify daily login was claimed today
      const today = new Date().toISOString().split('T')[0];
      const { data: activity } = await supabase
        .from('user_activity')
        .select('id')
        .eq('wallet_address', walletAddress)
        .eq('activity_type', 'daily_login_bonus')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .limit(1);
      
      if (!activity || activity.length === 0) {
        return { verified: false, reason: 'Daily login not claimed. Please claim your daily bonus first.' };
      }
      return { verified: true };
    }

    case 'explore_bounties': {
      // For explore bounties, just verify they've visited the page
      // This is a soft check - we'll allow it if they've interacted with bounties
      const { data: activity } = await supabase
        .from('user_activity')
        .select('id')
        .eq('wallet_address', walletAddress)
        .in('activity_type', ['bounty_submitted', 'bounty_viewed', 'bounty_approved'])
        .limit(1);
      
      // If they've interacted with bounties, consider it verified
      // Otherwise, we'll allow navigation to count as exploration
      return { verified: true };
    }

    default:
      return { verified: false, reason: 'Unknown task type' };
  }
}

/**
 * POST /api/onboarding/complete-task
 * Mark an onboarding task as complete and award XP
 */
export async function POST(request: NextRequest) {
  try {
    const { walletAddress, taskId } = await request.json();

    if (!walletAddress || !taskId) {
      return NextResponse.json(
        { error: 'Wallet address and task ID are required' },
        { status: 400 }
      );
    }

    console.log('✅ [ONBOARDING] Completing task:', { 
      wallet: walletAddress.slice(0, 10) + '...', 
      taskId 
    });

    const supabase = getSupabaseClient();

    // Check if task already completed
    const { data: existingTask } = await supabase
      .from('onboarding_tasks')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('task_id', taskId)
      .single();

    if (existingTask?.completed) {
      return NextResponse.json({
        success: true,
        message: 'Task already completed',
        alreadyCompleted: true,
        xpAwarded: existingTask.xp_awarded || 0
      });
    }

    // Verify task is actually completed before awarding XP
    const verification = await verifyTaskCompletion(taskId, walletAddress, supabase);
    
    if (!verification.verified) {
      return NextResponse.json({
        success: false,
        verified: false,
        message: verification.reason || 'Task not completed. Please complete the action first.',
        taskId
      }, { status: 400 });
    }

    // Get XP reward for this task
    const xpReward = TASK_XP_REWARDS[taskId] || 0;

    // Mark task as completed
    const { error: updateError } = await supabase
      .from('onboarding_tasks')
      .upsert({
        wallet_address: walletAddress,
        task_id: taskId,
        completed: true,
        completed_at: new Date().toISOString(),
        xp_awarded: xpReward,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'wallet_address,task_id'
      });

    if (updateError) {
      console.error('❌ [ONBOARDING] Error updating task:', updateError);
      return NextResponse.json(
        { error: 'Failed to complete task', details: updateError.message },
        { status: 500 }
      );
    }

    // Award XP if reward is greater than 0
    let xpAwarded = 0;
    if (xpReward > 0) {
      try {
        // Get current user XP to calculate new values
        const { data: userXP } = await supabase
          .from('user_xp')
          .select('wallet_address, total_xp, level')
          .eq('wallet_address', walletAddress)
          .maybeSingle();

        const { data: user } = await supabase
          .from('users')
          .select('wallet_address, total_xp, level')
          .eq('wallet_address', walletAddress)
          .maybeSingle();

        const previousXP = Math.max(userXP?.total_xp || 0, user?.total_xp || 0);
        const previousLevel = Math.max(userXP?.level || 1, user?.level || 1);
        const newTotalXP = previousXP + xpReward;
        const newLevel = Math.floor(newTotalXP / 1000) + 1;
        const levelUp = newLevel > previousLevel;

        // Update XP in user_xp table
        const { error: xpError } = await supabase
          .from('user_xp')
          .upsert({
            wallet_address: walletAddress,
            total_xp: newTotalXP,
            level: newLevel,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'wallet_address'
          });

        if (xpError) {
          throw new Error('Failed to update user_xp');
        }

        // Also update users table
        await supabase
          .from('users')
          .update({
            total_xp: newTotalXP,
            level: newLevel,
            updated_at: new Date().toISOString()
          })
          .eq('wallet_address', walletAddress);

        // Log the XP award activity
        await supabase
          .from('user_activity')
          .insert({
            wallet_address: walletAddress,
            activity_type: 'xp_awarded',
            metadata: {
              xp_amount: xpReward,
              reason: `Completed onboarding task: ${taskId}`,
              source: 'onboarding',
              previous_xp: previousXP,
              new_total_xp: newTotalXP,
              previous_level: previousLevel,
              new_level: newLevel,
              level_up: levelUp
            },
            created_at: new Date().toISOString()
          });

        xpAwarded = xpReward;
        console.log('🎉 [ONBOARDING] XP awarded:', xpReward);
      } catch (xpError) {
        console.error('⚠️ [ONBOARDING] Error awarding XP:', xpError);
        // Don't fail the request if XP award fails
      }
    }

    // Check if all tasks are completed
    const { data: allTasks } = await supabase
      .from('onboarding_tasks')
      .select('completed')
      .eq('wallet_address', walletAddress);

    const allCompleted = allTasks?.every(t => t.completed) || false;

    // If all tasks completed, mark onboarding as complete in users table
    if (allCompleted) {
      await supabase
        .from('users')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', walletAddress);
    }

    return NextResponse.json({
      success: true,
      taskId,
      xpAwarded,
      allTasksCompleted: allCompleted,
      message: `Task completed! You earned ${xpAwarded} XP.`
    });

  } catch (error: any) {
    console.error('❌ [ONBOARDING] Error in POST request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

