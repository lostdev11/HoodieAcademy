// Utility function for logging user activities
export interface ActivityLogData {
  wallet_address: string;
  activity_type: string;
  profile_data?: {
    display_name?: string;
    squad?: string;
    pfp_url?: string;
    pfp_asset_id?: string;
    [key: string]: any;
  };
  course_data?: {
    course_id?: string;
    course_name?: string;
    completion_status?: string;
    score?: number;
    time_spent?: number;
    [key: string]: any;
  };
  wallet_data?: {
    provider?: string;
    connection_method?: string;
    verification_result?: any;
    [key: string]: any;
  };
  achievement_data?: {
    badge_id?: string;
    badge_name?: string;
    badge_type?: string;
    [key: string]: any;
  };
  session_data?: {
    session_id?: string;
    login_method?: string;
    [key: string]: any;
  };
  metadata?: {
    [key: string]: any;
  };
  notes?: string;
}

export async function logUserActivity(activityData: ActivityLogData): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/user-activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activityData)
    });

    if (response.ok) {
      console.log('📊 Activity logged:', activityData.activity_type, 'for', activityData.wallet_address);
      return true;
    } else {
      console.warn('⚠️ Failed to log activity:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.warn('⚠️ Error logging activity:', error);
    return false;
  }
}

// Convenience functions for common activities
export async function logProfileUpdate(
  wallet_address: string, 
  profileData: { display_name?: string; squad?: string; pfp_url?: string; pfp_asset_id?: string }
) {
  return logUserActivity({
    wallet_address,
    activity_type: 'profile_update',
    profile_data: profileData,
    notes: 'Profile information updated'
  });
}

export async function logSquadAssignment(
  wallet_address: string, 
  squad: string, 
  previousSquad?: string
) {
  return logUserActivity({
    wallet_address,
    activity_type: 'squad_assignment',
    profile_data: { squad },
    metadata: { previous_squad: previousSquad },
    notes: `Squad assigned: ${squad}${previousSquad ? ` (was: ${previousSquad})` : ''}`
  });
}

export async function logCourseActivity(
  wallet_address: string, 
  activity_type: 'course_start' | 'course_complete' | 'course_approval',
  courseData: { course_id: string; course_name?: string; score?: number; time_spent?: number }
) {
  return logUserActivity({
    wallet_address,
    activity_type,
    course_data: courseData,
    notes: `Course ${activity_type.replace('_', ' ')}: ${courseData.course_name || courseData.course_id}`
  });
}

export type WalletLogMeta = {
  provider?: string;
  verification_result?: any;
  reason?: string;                 // ✅ add this
  [key: string]: unknown;          // optional: future-proof arbitrary fields
};

// ensure the function uses the widened type
export async function logWalletConnection(
  wallet: string,
  event: 'wallet_connect' | 'wallet_disconnect' | 'nft_verification' | 'wallet_error',
  meta: WalletLogMeta = {}
) {
  return logUserActivity({
    wallet_address: wallet,
    activity_type: event,
    wallet_data: meta,
    notes: `Wallet ${event.replace('_', ' ')}${meta.reason ? ` - ${meta.reason}` : ''}`
  });
}

export async function logBadgeEarned(
  wallet_address: string, 
  badgeData: { badge_id: string; badge_name: string; badge_type: string }
) {
  return logUserActivity({
    wallet_address,
    activity_type: 'badge_earned',
    achievement_data: badgeData,
    notes: `Badge earned: ${badgeData.badge_name}`
  });
}

export async function logLogin(
  wallet_address: string, 
  loginMethod: string = 'wallet'
) {
  return logUserActivity({
    wallet_address,
    activity_type: 'login',
    session_data: { login_method: loginMethod },
    notes: `User logged in via ${loginMethod}`
  });
}

export async function logPfpUpdate(
  wallet_address: string, 
  pfpData: { pfp_url: string; pfp_asset_id: string }
) {
  return logUserActivity({
    wallet_address,
    activity_type: 'pfp_update',
    profile_data: pfpData,
    notes: 'Profile picture updated with NFT'
  });
}

export async function logNftVerification(
  wallet_address: string, 
  verificationResult: { success: boolean; nft_count: number; wifhoodie_count: number }
) {
  return logUserActivity({
    wallet_address,
    activity_type: 'nft_verification',
    wallet_data: { verification_result: verificationResult },
    notes: `NFT verification ${verificationResult.success ? 'successful' : 'failed'}`
  });
}
