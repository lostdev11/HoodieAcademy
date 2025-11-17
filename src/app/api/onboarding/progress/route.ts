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

// Default onboarding tasks configuration
const DEFAULT_ONBOARDING_TASKS = [
  {
    id: 'complete_profile',
    title: 'Complete Your Profile',
    description: 'Add your display name and profile picture',
    xpReward: 25,
    icon: 'user',
    action: { type: 'navigate', path: '/profile' }
  },
  {
    id: 'select_squad',
    title: 'Choose Your Squad',
    description: 'Join a squad that matches your interests',
    xpReward: 50,
    icon: 'users',
    action: { type: 'navigate', path: '/choose-your-squad' }
  },
  {
    id: 'start_first_course',
    title: 'Start Your First Course',
    description: 'Begin learning with your first course',
    xpReward: 75,
    icon: 'book',
    action: { type: 'navigate', path: '/courses' }
  },
  {
    id: 'claim_daily_login',
    title: 'Claim Daily Login Bonus',
    description: 'Get your daily XP bonus',
    xpReward: 5,
    icon: 'calendar',
    action: { type: 'api', endpoint: '/api/xp/daily-login' }
  },
  {
    id: 'explore_bounties',
    title: 'Explore Bounties',
    description: 'Check out available bounties to earn rewards',
    xpReward: 30,
    icon: 'target',
    action: { type: 'navigate', path: '/bounties' }
  }
];

/**
 * GET /api/onboarding/progress
 * Get onboarding progress for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    console.log('📋 [ONBOARDING] Fetching progress for:', walletAddress.slice(0, 10) + '...');
    const supabase = getSupabaseClient();

    // Get user's onboarding tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('onboarding_tasks')
      .select('*')
      .eq('wallet_address', walletAddress);

    if (tasksError) {
      console.error('❌ [ONBOARDING] Error fetching tasks:', tasksError);
      return NextResponse.json(
        { error: 'Failed to fetch onboarding tasks', details: tasksError.message },
        { status: 500 }
      );
    }

    // Check if user has completed onboarding and get user profile
    const { data: user } = await supabase
      .from('users')
      .select('onboarding_completed, onboarding_completed_at, display_name, squad, squad_id')
      .eq('wallet_address', walletAddress)
      .single();

    // Check course availability - courses must be published and visible
    const { data: courses } = await supabase
      .from('courses')
      .select('id, is_visible, is_published, is_hidden')
      .eq('is_published', true);

    // Filter for visible courses (handle both is_visible and is_hidden schemas)
    const hasAvailableCourses = courses && courses.length > 0 && 
      courses.some(c => {
        // Course is available if:
        // - is_published is true (already filtered)
        // - is_visible is not false (or doesn't exist)
        // - is_hidden is not true (or doesn't exist)
        const isVisible = c.is_visible !== false;
        const isNotHidden = c.is_hidden !== true;
        return isVisible && isNotHidden;
      });

    // Check if user has completed profile (has display name)
    const hasCompletedProfile = !!user?.display_name;

    // Check if user has selected a squad
    const hasSelectedSquad = !!user?.squad && user.squad !== 'Unassigned';

    // If no tasks exist, initialize them
    if (!tasks || tasks.length === 0) {
      console.log('🆕 [ONBOARDING] Initializing tasks for new user');
      
      // Create all default tasks
      const tasksToInsert = DEFAULT_ONBOARDING_TASKS.map(task => ({
        wallet_address: walletAddress,
        task_id: task.id,
        completed: false,
        xp_awarded: 0
      }));

      const { error: insertError } = await supabase
        .from('onboarding_tasks')
        .insert(tasksToInsert);

      if (insertError) {
        console.error('❌ [ONBOARDING] Error initializing tasks:', insertError);
        return NextResponse.json(
          { error: 'Failed to initialize onboarding tasks', details: insertError.message },
          { status: 500 }
        );
      }

      // Fetch the newly created tasks
      const { data: newTasks } = await supabase
        .from('onboarding_tasks')
        .select('*')
        .eq('wallet_address', walletAddress);

      return NextResponse.json({
        tasks: DEFAULT_ONBOARDING_TASKS.map(task => {
          const dbTask = newTasks?.find(t => t.task_id === task.id);
          let available = true;
          
          // Check task availability based on type
          if (task.id === 'start_first_course') {
            available = hasAvailableCourses || false;
          } else if (task.id === 'complete_profile') {
            available = !hasCompletedProfile; // Available if not completed
          } else if (task.id === 'select_squad') {
            available = !hasSelectedSquad; // Available if not selected
          }
          
          return {
            ...task,
            completed: dbTask?.completed || false,
            completedAt: dbTask?.completed_at || null,
            xpAwarded: dbTask?.xp_awarded || 0,
            available
          };
        }),
        completedCount: 0,
        totalCount: DEFAULT_ONBOARDING_TASKS.length,
        isCompleted: false,
        totalXPEarned: 0
      });
    }

    // Map database tasks to response format
    const tasksWithDetails = DEFAULT_ONBOARDING_TASKS.map(task => {
      const dbTask = tasks.find(t => t.task_id === task.id);

      // Infer completion from current user state to avoid "Unavailable" on actually-done tasks
      let inferredCompleted = false;
      if (task.id === 'complete_profile') {
        inferredCompleted = hasCompletedProfile;
      } else if (task.id === 'select_squad') {
        inferredCompleted = hasSelectedSquad;
      }

      // Determine availability based on current state
      let available = true;
      if (task.id === 'start_first_course') {
        available = hasAvailableCourses || false;
      } else if (task.id === 'complete_profile') {
        available = !hasCompletedProfile; // Available if not completed
      } else if (task.id === 'select_squad') {
        available = !hasSelectedSquad; // Available if not selected
      }

      return {
        ...task,
        completed: Boolean(dbTask?.completed) || inferredCompleted,
        completedAt: dbTask?.completed_at || null,
        xpAwarded: dbTask?.xp_awarded || 0,
        available
      };
    });

    const completedCount = tasksWithDetails.filter(t => t.completed).length;
    const totalXPEarned = tasksWithDetails
      .filter(t => t.completed)
      .reduce((sum, t) => sum + (t.xpAwarded || 0), 0);

    return NextResponse.json({
      tasks: tasksWithDetails,
      completedCount,
      totalCount: DEFAULT_ONBOARDING_TASKS.length,
      isCompleted: user?.onboarding_completed || false,
      totalXPEarned
    });

  } catch (error: any) {
    console.error('❌ [ONBOARDING] Error in GET request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

