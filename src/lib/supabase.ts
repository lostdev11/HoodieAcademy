import { createClient } from '@supabase/supabase-js'

console.log("✅ SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("✅ SUPABASE KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Create Supabase client only if environment variables are available and valid
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if the URL is a valid Supabase URL (not placeholder)
const isValidSupabaseUrl = supabaseUrl && 
  supabaseUrl !== 'your_supabase_url_here' && 
  supabaseUrl.startsWith('https://');

export const supabase = isValidSupabaseUrl && supabaseKey && supabaseKey !== 'your_supabase_anon_key_here'
  ? createClient(supabaseUrl, supabaseKey)
  : createClient('https://mock.supabase.co', 'mock-key');

// Database types
export interface Message {
  id: string
  text: string
  sender: string
  squad: string
  timestamp: string
  created_at: string
}

export interface NewMessage {
  text: string
  sender: string
  squad: string
} 

// User tracking types
export interface User {
  id?: string
  wallet_address: string
  display_name?: string
  squad?: string
  profile_completed: boolean
  squad_test_completed: boolean
  created_at?: string
  last_active?: string
}

export interface PlacementTest {
  id?: string
  wallet_address: string
  squad: string
  completed_at?: string
}

// User tracking functions
export async function recordPlacementTest(wallet_address: string, squad: string, display_name?: string) {
  try {
    // Upsert user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert([
        {
          wallet_address,
          display_name: display_name || `User ${wallet_address.slice(0, 6)}...`,
          squad,
          profile_completed: !!display_name,
          squad_test_completed: true,
          last_active: new Date().toISOString(),
        }
      ], {
        onConflict: 'wallet_address'
      })

    if (userError) {
      console.error('Error upserting user:', userError)
      throw userError
    }

    // Insert placement test record
    const { data: placementData, error: placementError } = await supabase
      .from('placement_tests')
      .insert([
        {
          wallet_address,
          squad,
          completed_at: new Date().toISOString(),
        }
      ])

    if (placementError) {
      console.error('Error inserting placement test:', placementError)
      throw placementError
    }

    return { userData, placementData }
  } catch (error) {
    console.error('Error in recordPlacementTest:', error)
    throw error
  }
}

export async function updateUserActivity(wallet_address: string, activity_type: string = 'general') {
  try {
    const { error } = await supabase
      .from('users')
      .update({ last_active: new Date().toISOString() })
      .eq('wallet_address', wallet_address)

    if (error) {
      console.error('Error updating user activity:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in updateUserActivity:', error)
    throw error
  }
}

export async function fetchAllUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in fetchAllUsers:', error)
    return []
  }
}

export async function fetchPlacementTests(): Promise<PlacementTest[]> {
  try {
    const { data, error } = await supabase
      .from('placement_tests')
      .select('*')
      .order('completed_at', { ascending: false })

    if (error) {
      console.error('Error fetching placement tests:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in fetchPlacementTests:', error)
    return []
  }
}

export async function getUserStats() {
  try {
    const users = await fetchAllUsers()
    const placements = await fetchPlacementTests()

    const totalUsers = users.length
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeUsers = users.filter(user =>
      new Date(user.last_active ?? user.created_at ?? 0) > oneWeekAgo
    ).length;
    // 🧠 Log inactive users for debugging
    const inactiveUsers = users.filter(user =>
      new Date(user.last_active ?? user.created_at ?? 0) <= oneWeekAgo
    );
    console.log('Inactive users in the last 7 days:', inactiveUsers.map(u => ({
      wallet: u.wallet_address,
      last_active: u.last_active,
      display_name: u.display_name ?? 'Unnamed'
    })));
    const placementTestsCompleted = placements.length
    // Calculate squad distribution
    const squadDistribution: { [squad: string]: number } = {}
    placements.forEach(placement => {
      squadDistribution[placement.squad] = (squadDistribution[placement.squad] || 0) + 1
    })

    return {
      totalUsers,
      activeUsers,
      placementTestsCompleted,
      squadDistribution
    }
  } catch (error) {
    console.error('Error getting user stats:', error)
    return {
      totalUsers: 0,
      activeUsers: 0,
      placementTestsCompleted: 0,
      squadDistribution: {}
    }
  }
} 

// Course completion types
export interface CourseCompletion {
  id?: string;
  wallet_address: string;
  course_id: string;
  started_at?: string;
  completed_at?: string;
  approved?: boolean;
  final_exam_approved?: boolean;
  final_exam_approved_by?: string;
  final_exam_approved_at?: string;
}

export interface Assignment {
  id?: string;
  course_slug: string;
  content: string;
  user_id: string;
  submitted_at?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  feedback?: string;
}

// Start a course for a user
export async function startCourse(user_id: string, course_id: string) {
  try {
    const { data, error } = await supabase
      .from('user_course_completions')
      .upsert({
        user_id,
        course_id,
        course_started_at: new Date().toISOString()
      }, { onConflict: 'user_id,course_id' });
    
    if (error) throw error;
    console.log(`Course started for user ${user_id} - ${course_id}`);
    return data;
  } catch (error) {
    console.error('Error starting course:', error);
    throw error;
  }
}

// Complete a course for a user
export async function completeCourse(user_id: string, course_id: string) {
  try {
    const { data, error } = await supabase
      .from('user_course_completions')
      .update({
        course_completed_at: new Date().toISOString()
      })
      .eq('user_id', user_id)
      .eq('course_id', course_id);
    
    if (error) throw error;
    console.log(`Course completed for user ${user_id} - ${course_id}`);
    return data;
  } catch (error) {
    console.error('Error completing course:', error);
    throw error;
  }
}

// Record course completion for a wallet address
export async function recordCourseCompletion(walletAddress: string, courseId: string) {
  const { data, error } = await supabase
    .from('course_progress')
    .upsert([
      {
        wallet_address: walletAddress,
        course_id: courseId,
        completed_at: new Date().toISOString(),
      },
    ]);

  if (error) {
    console.error('Error recording course completion:', error);
  }

  return data;
}

// Fetch all course completions (admin)
export async function fetchAllCourseCompletions(): Promise<CourseCompletion[]> {
  try {
    const { data, error } = await supabase
      .from('user_course_completions')
      .select('*')
      .order('course_completed_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all course completions:', error);
    return [];
  }
}

// Fetch course completions for a specific user
export async function fetchUserCourseCompletions(user_id: string): Promise<CourseCompletion[]> {
  try {
    const { data, error } = await supabase
      .from('user_course_completions')
      .select('*')
      .eq('user_id', user_id)
      .order('course_completed_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user course completions:', error);
    return [];
  }
}

// Approve a course completion
export async function approveBadge(user_id: string, course_id: string) {
  try {
    const { error } = await supabase
      .from('user_course_completions')
      .update({ approved: true })
      .eq('user_id', user_id)
      .eq('course_id', course_id);

    if (error) throw error;
    console.log(`Badge approved for ${user_id} - ${course_id}`);
  } catch (error) {
    console.error('Error approving badge:', error);
    throw error;
  }
}

// Reset a course completion
export async function resetCourses(user_id: string, course_id: string) {
  try {
    const { error } = await supabase
      .from('user_course_completions')
      .delete()
      .eq('user_id', user_id)
      .eq('course_id', course_id);

    if (error) throw error;
    console.log(`Course reset for ${user_id} - ${course_id}`);
  } catch (error) {
    console.error('Error resetting course:', error);
    throw error;
  }
}

// Approve a user
export async function approveUser(wallet_address: string) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ approved: true })
      .eq('wallet_address', wallet_address);

    if (error) throw error;
    console.log(`User approved: ${wallet_address}`);
  } catch (error) {
    console.error('Error approving user:', error);
    throw error;
  }
}

// Unapprove a user
export async function unapproveUser(wallet_address: string) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ approved: false })
      .eq('wallet_address', wallet_address);

    if (error) throw error;
    console.log(`User unapproved: ${wallet_address}`);
  } catch (error) {
    console.error('Error unapproving user:', error);
    throw error;
  }
}

// Fetch a user by wallet address
export async function fetchUserByWallet(wallet_address: string): Promise<User & { is_admin?: boolean } | null> {
  console.log("🔍 Admin: Checking admin status for wallet:", wallet_address);
  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', wallet_address)
    .single();

  console.log("🔍 Admin: User data from Supabase:", userData);
  console.log("🔍 Admin: Is admin?", userData?.is_admin);
  
  if (error) return null;
  return userData;
} 

// Log user activity
export async function logUserActivity(user_id: string, event_type: string, metadata?: any) {
  try {
    const { error } = await supabase
      .from('user_activity_log')
      .insert({
        user_id,
        event_type,
        metadata: metadata || null,
        timestamp: new Date().toISOString()
      });

    if (error) throw error;
    console.log(`Activity logged: ${event_type} for user ${user_id}`);
  } catch (error) {
    console.error('Error logging user activity:', error);
    throw error;
  }
}

// Get user activity logs
export async function getUserActivityLogs(user_id: string, limit: number = 50) {
  try {
    const { data, error } = await supabase
      .from('user_activity_log')
      .select('*')
      .eq('user_id', user_id)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user activity logs:', error);
    throw error;
  }
}

// Get all activity logs (admin only)
export async function getAllActivityLogs(limit: number = 100) {
  try {
    const { data, error } = await supabase
      .from('user_activity_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching all activity logs:', error);
    throw error;
  }
} 

// Approve final exam for a course completion
export async function approveFinalExam(wallet_address: string, course_id: string, admin_user_id: string) {
  try {
    const { error } = await supabase
      .from('course_completions')
      .update({
        final_exam_approved: true,
        final_exam_approved_by: admin_user_id,
        final_exam_approved_at: new Date().toISOString()
      })
      .eq('wallet_address', wallet_address)
      .eq('course_id', course_id);

    if (error) throw error;
    console.log(`Final exam approved for ${wallet_address} - ${course_id} by admin ${admin_user_id}`);
  } catch (error) {
    console.error('Error approving final exam:', error);
    throw error;
  }
}

// Unapprove final exam for a course completion
export async function unapproveFinalExam(wallet_address: string, course_id: string) {
  try {
    const { error } = await supabase
      .from('course_completions')
      .update({
        final_exam_approved: false,
        final_exam_approved_by: null,
        final_exam_approved_at: null
      })
      .eq('wallet_address', wallet_address)
      .eq('course_id', course_id);

    if (error) throw error;
    console.log(`Final exam unapproved for ${wallet_address} - ${course_id}`);
  } catch (error) {
    console.error('Error unapproving final exam:', error);
    throw error;
  }
}

// Get final exam approvals by admin
export async function getFinalExamApprovalsByAdmin(admin_user_id: string) {
  try {
    const { data, error } = await supabase
      .from('course_completions')
      .select('*')
      .eq('final_exam_approved_by', admin_user_id)
      .order('final_exam_approved_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching final exam approvals by admin:', error);
    throw error;
  }
}

// Assignment submission functions
export async function submitAssignment(course_slug: string, content: string, user_id: string): Promise<Assignment> {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        course_slug,
        content,
        user_id,
        submitted_at: new Date().toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting assignment:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in submitAssignment:', error);
    throw error;
  }
}

export async function getAssignmentsByUser(user_id: string): Promise<Assignment[]> {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('user_id', user_id)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching user assignments:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAssignmentsByUser:', error);
    throw error;
  }
}

export async function getAllAssignments(): Promise<Assignment[]> {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching all assignments:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllAssignments:', error);
    throw error;
  }
}

export async function reviewAssignment(assignment_id: string, status: 'approved' | 'rejected', reviewer_id: string, feedback?: string): Promise<Assignment> {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .update({
        status,
        reviewed_by: reviewer_id,
        reviewed_at: new Date().toISOString(),
        feedback
      })
      .eq('id', assignment_id)
      .select()
      .single();

    if (error) {
      console.error('Error reviewing assignment:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in reviewAssignment:', error);
    throw error;
  }
} 