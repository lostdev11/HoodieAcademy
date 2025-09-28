'use client';

import { useState, useEffect, useCallback } from 'react';

export interface UserTrackingData {
  user: {
    wallet_address: string;
    display_name?: string;
    squad?: string;
    profile_completed: boolean;
    squad_test_completed: boolean;
    placement_test_completed: boolean;
    is_admin: boolean;
    last_active?: string;
    last_seen?: string;
    created_at?: string;
  } | null;
  stats: {
    profileCompleted: boolean;
    squadTestCompleted: boolean;
    placementTestCompleted: boolean;
    isAdmin: boolean;
    totalXP: number;
    bountyXP: number;
    courseXP: number;
    streakXP: number;
    totalSubmissions: number;
    totalCourseCompletions: number;
    totalBountyCompletions: number;
    totalBountyXP: number;
    totalActivity: number;
    currentSquad: string | null;
    placementTestScore: number | null;
    placementTestDate: string | null;
    lastActive: string | null;
    lastSeen: string | null;
  };
  submissions: any[];
  courseCompletions: any[];
  bountyCompletions: any[];
  placementTest: any;
  activity: any[];
}

export function useUserTracking(walletAddress?: string) {
  const [data, setData] = useState<UserTrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    if (!walletAddress) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/track?wallet=${walletAddress}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      const userData = await response.json();
      setData(userData);
    } catch (err) {
      console.error('Error fetching user tracking data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  const updateUserActivity = useCallback(async (activityType: string, metadata: any = {}) => {
    if (!walletAddress) return;

    try {
      const response = await fetch('/api/users/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          activityType,
          metadata
        })
      });

      if (response.ok) {
        // Refresh user data after activity update
        await fetchUserData();
      }
    } catch (err) {
      console.error('Error updating user activity:', err);
    }
  }, [walletAddress, fetchUserData]);

  const updateUserProfile = useCallback(async (updates: any) => {
    if (!walletAddress) return;

    try {
      const response = await fetch('/api/user-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          updates: {
            user: updates
          }
        })
      });

      if (response.ok) {
        // Refresh user data after profile update
        await fetchUserData();
      }
    } catch (err) {
      console.error('Error updating user profile:', err);
    }
  }, [walletAddress, fetchUserData]);

  const recordPlacementTest = useCallback(async (squad: string, score?: number) => {
    if (!walletAddress) return;

    try {
      // Update user profile with placement test completion
      await updateUserProfile({
        squad,
        placement_test_completed: true,
        squad_test_completed: true
      });

      // Record activity
      await updateUserActivity('placement_test_completed', {
        squad,
        score,
        completed_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error recording placement test:', err);
    }
  }, [walletAddress, updateUserProfile, updateUserActivity]);

  const recordWalletConnection = useCallback(async () => {
    if (!walletAddress) return;

    try {
      await updateUserActivity('wallet_connected', {
        wallet_address: walletAddress,
        connected_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error recording wallet connection:', err);
    }
  }, [walletAddress, updateUserActivity]);

  const recordBountySubmission = useCallback(async (bountyId: string, submissionId: string) => {
    if (!walletAddress) return;

    try {
      await updateUserActivity('bounty_submission', {
        bounty_id: bountyId,
        submission_id: submissionId,
        submitted_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error recording bounty submission:', err);
    }
  }, [walletAddress, updateUserActivity]);

  const recordCourseCompletion = useCallback(async (courseId: string, courseTitle: string) => {
    if (!walletAddress) return;

    try {
      await updateUserActivity('course_completed', {
        course_id: courseId,
        course_title: courseTitle,
        completed_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error recording course completion:', err);
    }
  }, [walletAddress, updateUserActivity]);

  const fetchBountyCompletions = useCallback(async () => {
    if (!walletAddress) return [];

    try {
      const response = await fetch(`/api/users/bounty-completions?wallet=${walletAddress}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch bounty completions: ${response.status}`);
      }

      const data = await response.json();
      return data.completions || [];
    } catch (err) {
      console.error('Error fetching bounty completions:', err);
      return [];
    }
  }, [walletAddress]);

  const recordBountyCompletion = useCallback(async (bountyId: string, submissionId: string) => {
    if (!walletAddress) return;

    try {
      await updateUserActivity('bounty_completed', {
        bounty_id: bountyId,
        submission_id: submissionId,
        completed_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error recording bounty completion:', err);
    }
  }, [walletAddress, updateUserActivity]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return {
    data,
    loading,
    error,
    refetch: fetchUserData,
    updateUserActivity,
    updateUserProfile,
    recordPlacementTest,
    recordWalletConnection,
    recordBountySubmission,
    recordCourseCompletion,
    fetchBountyCompletions,
    recordBountyCompletion
  };
}
