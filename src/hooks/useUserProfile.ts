import { useState, useEffect } from 'react';

export interface UserProfile {
  walletAddress: string;
  displayName: string | null;
  level: number;
  totalXP: number;
  streak: number;
  isAdmin: boolean;
  banned: boolean;
  squad: {
    name: string;
    id: string;
    selectedAt: string;
    lockEndDate: string;
    changeCount: number;
    isLocked: boolean;
    remainingDays: number;
  } | null;
  hasSquad: boolean;
  createdAt: string;
  lastActive: string | null;
  updatedAt: string;
  completedCourses: string[];
  badges: string[];
  bio: string | null;
  nftCount: number;
}

export function useUserProfile(walletAddress: string | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/user-profile?wallet=${walletAddress}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch user profile');
        }

        if (data.success && data.profile) {
          setProfile(data.profile);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [walletAddress]);

  const refresh = async () => {
    if (!walletAddress) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/user-profile?wallet=${walletAddress}&_t=${Date.now()}`);
      const data = await response.json();

      if (data.success && data.profile) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error('Error refreshing user profile:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    error,
    refresh,
    // Helper getters
    squad: profile?.squad?.name || 'Unassigned',
    hasSquad: profile?.hasSquad || false,
    level: profile?.level || 1,
    totalXP: profile?.totalXP || 0,
    isAdmin: profile?.isAdmin || false
  };
}

