import { createClient } from '@supabase/supabase-js'

console.log("✅ SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("✅ SUPABASE KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
    console.log('Recording placement test:', { wallet_address, squad, display_name })
    
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

    console.log('Successfully recorded placement test:', { userData, placementData })
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

    console.log('Updated user activity for:', wallet_address)
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

// Start a course for a user
export async function startCourse(wallet_address: string, course_id: string) {
  try {
    const { data, error } = await supabase
      .from('user_course_completions')
      .upsert({
        wallet_address,
        course_id,
        started_at: new Date().toISOString()
      }, { onConflict: 'wallet_address,course_id' });
    
    if (error) throw error;
    console.log(`Course started for wallet ${wallet_address} - ${course_id}`);
    return data;
  } catch (error) {
    console.error('Error starting course:', error);
    throw error;
  }
}

// Complete a course for a user
export async function completeCourse(wallet_address: string, course_id: string) {
  try {
    console.log(`🔍 Completing course: ${course_id} for wallet: ${wallet_address}`);
    console.log(`🔍 Wallet address type: ${typeof wallet_address}, length: ${wallet_address?.length}`);
    console.log(`🔍 Course ID type: ${typeof course_id}, value: ${course_id}`);
    
    if (!wallet_address || wallet_address === 'null' || wallet_address === 'undefined') {
      console.error(`❌ Invalid wallet address: ${wallet_address}`);
      throw new Error('Invalid wallet address');
    }
    
    // First, try to update existing record
    const { data: updateData, error: updateError } = await supabase
      .from('user_course_completions')
      .update({
        completed_at: new Date().toISOString()
      })
      .eq('wallet_address', wallet_address)
      .eq('course_id', course_id);
    console.log('📝 Update result:', updateData, updateError);
    if (updateError) {
      console.log(`📝 Update failed, trying insert for ${course_id}...`);
      // If update fails, try to insert new record
      const { data: insertData, error: insertError } = await supabase
        .from('user_course_completions')
        .insert({
          wallet_address,
          course_id,
          completed_at: new Date().toISOString()
        });
      console.log('🆕 Insert result:', insertData, insertError);
      if (insertError) {
        console.error(`❌ Insert error for ${course_id}:`, insertError);
        throw insertError;
      }
      console.log(`✅ Course completed (insert) for wallet ${wallet_address} - ${course_id}`);
      return insertData;
    }
    console.log(`✅ Course completed (update) for wallet ${wallet_address} - ${course_id}`);
    return updateData;
  } catch (error) {
    console.error('❌ Error completing course:', error);
    throw error;
  }
}

// DEPRECATED: Use completeCourse instead
// Record course completion for a wallet address
export async function recordCourseCompletion(walletAddress: string, courseId: string) {
  console.warn('⚠️ recordCourseCompletion is deprecated. Use completeCourse instead.');
  return completeCourse(walletAddress, courseId);
}

// Fetch all course completions (admin)
export async function fetchAllCourseCompletions(): Promise<CourseCompletion[]> {
  try {
    console.log('🔍 Fetching all course completions from user_course_completions table...');
    const { data, error } = await supabase
      .from('user_course_completions')
      .select('*')
      .order('completed_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching course completions:', error);
      throw error;
    }
    
    console.log('✅ Fetched course completions:', data?.length || 0, 'records');
    if (data && data.length > 0) {
      console.log('📋 Sample completion:', data[0]);
      console.log('📋 All completions:', data);
    } else {
      console.log('⚠️ No course completions found in database');
    }
    
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching all course completions:', error);
    return [];
  }
}

// Fetch course completions for a specific user
export async function fetchUserCourseCompletions(wallet_address: string): Promise<CourseCompletion[]> {
  try {
    const { data, error } = await supabase
      .from('user_course_completions')
      .select('*')
      .eq('wallet_address', wallet_address)
      .order('completed_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user course completions:', error);
    return [];
  }
}

// Approve a course completion
export async function approveBadge(wallet_address: string, course_id: string) {
  try {
    const { error } = await supabase
      .from('user_course_completions')
      .update({ approved: true })
      .eq('wallet_address', wallet_address)
      .eq('course_id', course_id);

    if (error) throw error;
    console.log(`Badge approved for ${wallet_address} - ${course_id}`);
  } catch (error) {
    console.error('Error approving badge:', error);
    throw error;
  }
}

// Reset a course completion
export async function resetCourses(wallet_address: string, course_id: string) {
  try {
    const { error } = await supabase
      .from('user_course_completions')
      .delete()
      .eq('wallet_address', wallet_address)
      .eq('course_id', course_id);

    if (error) throw error;
    console.log(`Course reset for ${wallet_address} - ${course_id}`);
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
    console.log(`🔍 Approving final exam: ${course_id} for wallet: ${wallet_address}`);
    const { data, error } = await supabase
      .from('user_course_completions')
      .update({
        final_exam_approved: true,
        final_exam_approved_by: admin_user_id,
        final_exam_approved_at: new Date().toISOString()
      })
      .eq('wallet_address', wallet_address)
      .eq('course_id', course_id);

    if (error) {
      console.error('❌ Error approving final exam:', error);
      throw error;
    }
    console.log(`✅ Final exam approved for ${wallet_address} - ${course_id} by admin ${admin_user_id}`);
    return data;
  } catch (error) {
    console.error('❌ Error approving final exam:', error);
    throw error;
  }
}

// Unapprove final exam for a course completion
export async function unapproveFinalExam(wallet_address: string, course_id: string) {
  try {
    console.log(`🔍 Unapproving final exam: ${course_id} for wallet: ${wallet_address}`);
    const { data, error } = await supabase
      .from('user_course_completions')
      .update({
        final_exam_approved: false,
        final_exam_approved_by: null,
        final_exam_approved_at: null
      })
      .eq('wallet_address', wallet_address)
      .eq('course_id', course_id);

    if (error) {
      console.error('❌ Error unapproving final exam:', error);
      throw error;
    }
    console.log(`✅ Final exam unapproved for ${wallet_address} - ${course_id}`);
    return data;
  } catch (error) {
    console.error('❌ Error unapproving final exam:', error);
    throw error;
  }
}

// Get final exam approvals by admin
export async function getFinalExamApprovalsByAdmin(admin_user_id: string) {
  try {
    const { data, error } = await supabase
      .from('user_course_completions')
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

// Migration function to consolidate data from course_completions to user_course_completions
export async function migrateCourseCompletionsData() {
  try {
    console.log('🔄 Starting migration of course_completions data...');
    
    // Fetch all data from course_completions table
    const { data: oldData, error: fetchError } = await supabase
      .from('course_completions')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Error fetching old course_completions data:', fetchError);
      throw fetchError;
    }
    
    console.log(`📊 Found ${oldData?.length || 0} records in course_completions table`);
    
    if (!oldData || oldData.length === 0) {
      console.log('✅ No data to migrate');
      return { migrated: 0, errors: 0 };
    }
    
    let migrated = 0;
    let errors = 0;
    
    // Process each record
    for (const record of oldData) {
      try {
        // Check if record already exists in user_course_completions
        const { data: existingRecord } = await supabase
          .from('user_course_completions')
          .select('id')
          .eq('wallet_address', record.wallet_address)
          .eq('course_id', record.course_id)
          .single();
        
        if (existingRecord) {
          // Update existing record with final exam data
          const { error: updateError } = await supabase
            .from('user_course_completions')
            .update({
              final_exam_approved: record.final_exam_approved,
              final_exam_approved_by: record.final_exam_approved_by,
              final_exam_approved_at: record.final_exam_approved_at
            })
            .eq('wallet_address', record.wallet_address)
            .eq('course_id', record.course_id);
          
          if (updateError) {
            console.error(`❌ Error updating record for ${record.wallet_address} - ${record.course_id}:`, updateError);
            errors++;
          } else {
            console.log(`✅ Updated existing record for ${record.wallet_address} - ${record.course_id}`);
            migrated++;
          }
        } else {
          // Insert new record
          const { error: insertError } = await supabase
            .from('user_course_completions')
            .insert({
              wallet_address: record.wallet_address,
              course_id: record.course_id,
              started_at: record.started_at,
              completed_at: record.completed_at,
              approved: record.approved,
              final_exam_approved: record.final_exam_approved,
              final_exam_approved_by: record.final_exam_approved_by,
              final_exam_approved_at: record.final_exam_approved_at
            });
          
          if (insertError) {
            console.error(`❌ Error inserting record for ${record.wallet_address} - ${record.course_id}:`, insertError);
            errors++;
          } else {
            console.log(`✅ Inserted new record for ${record.wallet_address} - ${record.course_id}`);
            migrated++;
          }
        }
      } catch (recordError) {
        console.error(`❌ Error processing record for ${record.wallet_address} - ${record.course_id}:`, recordError);
        errors++;
      }
    }
    
    console.log(`✅ Migration completed: ${migrated} records migrated, ${errors} errors`);
    return { migrated, errors };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
} 

// Update user metadata with wallet information
export async function updateUserWalletMetadata(walletAddress: string) {
  try {
    console.log(`🔍 Updating user metadata with wallet: ${walletAddress}`);
    
    // First check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.warn('⚠️ No authenticated user found, skipping metadata update:', userError.message);
      return null;
    }
    
    if (!user) {
      console.warn('⚠️ No authenticated user found, skipping metadata update');
      return null;
    }
    
    const { data, error } = await supabase.auth.updateUser({
      data: {
        wallet: walletAddress,
        wallet_address: walletAddress,
        last_connected: new Date().toISOString()
      }
    });

    if (error) {
      console.error('❌ Error updating user metadata:', error);
      throw error;
    }

    console.log('✅ User metadata updated successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error in updateUserWalletMetadata:', error);
    // Don't throw the error, just log it and return null
    return null;
  }
}

// Get current user's wallet from metadata
export async function getCurrentUserWallet() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('ℹ️ No authenticated user found:', error.message);
      return null;
    }

    if (!user) {
      console.log('ℹ️ No authenticated user found');
      return null;
    }

    const walletAddress = user.user_metadata?.wallet || user.user_metadata?.wallet_address;
    console.log('✅ Current user wallet:', walletAddress);
    return walletAddress;
  } catch (error) {
    console.log('ℹ️ Error getting current user wallet:', error);
    return null;
  }
}

// Sign in with wallet (creates or signs in user)
export async function signInWithWallet(walletAddress: string) {
  try {
    console.log(`🔍 Signing in with wallet: ${walletAddress}`);
    
    // Create a unique email for the wallet (since Supabase Auth requires email)
    const walletEmail = `${walletAddress}@wallet.local`;
    
    // Try to sign in with the wallet email
    const { data, error } = await supabase.auth.signInWithOtp({
      email: walletEmail,
      options: {
        data: {
          wallet: walletAddress,
          wallet_address: walletAddress,
          display_name: `User ${walletAddress.slice(0, 6)}...`,
          last_connected: new Date().toISOString()
        }
      }
    });

    if (error) {
      console.error('❌ Error signing in with wallet:', error);
      throw error;
    }

    console.log('✅ Sign in initiated:', data);
    return data;
  } catch (error) {
    console.error('❌ Error in signInWithWallet:', error);
    throw error;
  }
}

// Sign out user
export async function signOutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Error signing out:', error);
      throw error;
    }

    console.log('✅ User signed out successfully');
  } catch (error) {
    console.error('❌ Error in signOutUser:', error);
    throw error;
  }
} 

// Exam approval types and functions
export interface ExamApproval {
  id?: string;
  wallet_address: string;
  course_id: string;
  exam_type: string; // 'final', 'midterm', etc.
  submitted_at: string;
  approved_at?: string;
  approved_by?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at?: string;
}

// Get all exam approvals
export async function fetchAllExamApprovals(): Promise<ExamApproval[]> {
  try {
    console.log('🔍 Fetching all exam approvals...');
    const { data, error } = await supabase
      .from('exam_approvals')
      .select('*')
      .order('submitted_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching exam approvals:', error);
      throw error;
    }
    
    console.log('✅ Fetched exam approvals:', data?.length || 0, 'records');
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching all exam approvals:', error);
    return [];
  }
}

// Get exam approvals for a specific user
export async function fetchUserExamApprovals(wallet_address: string): Promise<ExamApproval[]> {
  try {
    const { data, error } = await supabase
      .from('exam_approvals')
      .select('*')
      .eq('wallet_address', wallet_address)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user exam approvals:', error);
    throw error;
  }
}

// Submit an exam for approval
export async function submitExamForApproval(wallet_address: string, course_id: string, exam_type: string = 'final'): Promise<ExamApproval> {
  try {
    const { data, error } = await supabase
      .from('exam_approvals')
      .insert({
        wallet_address,
        course_id,
        exam_type,
        submitted_at: new Date().toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    console.log(`✅ Exam submitted for approval: ${course_id} - ${wallet_address}`);
    return data;
  } catch (error) {
    console.error('Error submitting exam for approval:', error);
    throw error;
  }
}

// Approve an exam
export async function approveExam(exam_id: string, admin_user_id: string, notes?: string): Promise<ExamApproval> {
  try {
    const { data, error } = await supabase
      .from('exam_approvals')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: admin_user_id,
        admin_notes: notes
      })
      .eq('id', exam_id)
      .select()
      .single();

    if (error) throw error;
    console.log(`✅ Exam approved: ${exam_id} by admin ${admin_user_id}`);
    return data;
  } catch (error) {
    console.error('Error approving exam:', error);
    throw error;
  }
}

// Reject an exam
export async function rejectExam(exam_id: string, admin_user_id: string, notes?: string): Promise<ExamApproval> {
  try {
    const { data, error } = await supabase
      .from('exam_approvals')
      .update({
        status: 'rejected',
        approved_at: new Date().toISOString(),
        approved_by: admin_user_id,
        admin_notes: notes
      })
      .eq('id', exam_id)
      .select()
      .single();

    if (error) throw error;
    console.log(`❌ Exam rejected: ${exam_id} by admin ${admin_user_id}`);
    return data;
  } catch (error) {
    console.error('Error rejecting exam:', error);
    throw error;
  }
} 

// Exam progress types and functions
export interface ExamProgress {
  id?: string;
  wallet_address: string;
  course_id: string;
  exam_type: string;
  status: 'not_started' | 'started' | 'in_progress' | 'completed' | 'failed' | 'submitted';
  started_at?: string;
  completed_at?: string;
  submitted_for_approval_at?: string;
  score?: number;
  max_score?: number;
  attempts?: number;
  time_spent_minutes?: number;
  created_at?: string;
  updated_at?: string;
}

// Start an exam
export async function startExam(wallet_address: string, course_id: string, exam_type: string = 'final'): Promise<ExamProgress> {
  try {
    console.log(`🔍 Starting exam: ${exam_type} for course ${course_id} - wallet: ${wallet_address}`);
    
    const { data, error } = await supabase
      .from('exam_progress')
      .upsert({
        wallet_address,
        course_id,
        exam_type,
        status: 'started',
        started_at: new Date().toISOString(),
        attempts: 1
      }, { onConflict: 'wallet_address,course_id,exam_type' })
      .select()
      .single();

    if (error) {
      console.error('❌ Error starting exam:', error);
      throw error;
    }

    console.log(`✅ Exam started: ${course_id} - ${exam_type}`);
    return data;
  } catch (error) {
    console.error('❌ Error in startExam:', error);
    throw error;
  }
}

// Update exam progress
export async function updateExamProgress(wallet_address: string, course_id: string, exam_type: string, status: string, score?: number): Promise<ExamProgress> {
  try {
    console.log(`🔍 Updating exam progress: ${course_id} - ${exam_type} - status: ${status}`);
    
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (score !== undefined) {
      updateData.score = score;
    }

    const { data, error } = await supabase
      .from('exam_progress')
      .update(updateData)
      .eq('wallet_address', wallet_address)
      .eq('course_id', course_id)
      .eq('exam_type', exam_type)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating exam progress:', error);
      throw error;
    }

    console.log(`✅ Exam progress updated: ${course_id} - ${exam_type}`);
    return data;
  } catch (error) {
    console.error('❌ Error in updateExamProgress:', error);
    throw error;
  }
}

// Get exam progress for a user
export async function getExamProgress(wallet_address: string, course_id: string, exam_type: string = 'final'): Promise<ExamProgress | null> {
  try {
    const { data, error } = await supabase
      .from('exam_progress')
      .select('*')
      .eq('wallet_address', wallet_address)
      .eq('course_id', course_id)
      .eq('exam_type', exam_type)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('❌ Error getting exam progress:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error in getExamProgress:', error);
    return null;
  }
}

// Get all exam progress for a user
export async function getUserExamProgress(wallet_address: string): Promise<ExamProgress[]> {
  try {
    const { data, error } = await supabase
      .from('exam_progress')
      .select('*')
      .eq('wallet_address', wallet_address)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error getting user exam progress:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in getUserExamProgress:', error);
    return [];
  }
}

// Get all exam progress (admin)
export async function getAllExamProgress(): Promise<ExamProgress[]> {
  try {
    console.log('🔍 Fetching all exam progress...');
    const { data, error } = await supabase
      .from('exam_progress')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching exam progress:', error);
      throw error;
    }
    
    console.log('✅ Fetched exam progress:', data?.length || 0, 'records');
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching all exam progress:', error);
    return [];
  }
}

// Submit exam progress for approval
export async function submitExamProgressForApproval(wallet_address: string, course_id: string, exam_type: string = 'final'): Promise<ExamProgress> {
  try {
    console.log(`🔍 Submitting exam progress for approval: ${course_id} - ${exam_type} - wallet: ${wallet_address}`);
    
    const { data, error } = await supabase
      .from('exam_progress')
      .update({
        status: 'submitted',
        submitted_for_approval_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', wallet_address)
      .eq('course_id', course_id)
      .eq('exam_type', exam_type)
      .select()
      .single();

    if (error) {
      console.error('❌ Error submitting exam progress for approval:', error);
      throw error;
    }

    console.log(`✅ Exam progress submitted for approval: ${course_id} - ${exam_type}`);
    return data;
  } catch (error) {
    console.error('❌ Error in submitExamProgressForApproval:', error);
    throw error;
  }
} 