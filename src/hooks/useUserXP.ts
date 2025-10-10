import { useEffect, useState } from 'react';
import { xpService, XPData } from '@/services/xp-service';

export interface XPProfile {
  totalXP: number;
  completedCourses: string[];
  streak: number;
  lastLogin: string;
  level: number;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  progressToNextLevel: number;
  breakdown?: {
    courseXP: number;
    bountyXP: number;
    dailyLoginXP: number;
    adminAwardXP: number;
    otherXP: number;
  };
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpRequired: number;
  unlocked: boolean;
}

const BADGES: Badge[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first course',
    icon: '👣',
    xpRequired: 100,
    unlocked: false
  },
  {
    id: 'dedicated-learner',
    name: 'Dedicated Learner',
    description: 'Complete 5 courses',
    icon: '📚',
    xpRequired: 500,
    unlocked: false
  },
  {
    id: 'streak-master',
    name: 'Streak Master',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    xpRequired: 0, // Based on streak, not XP
    unlocked: false
  },
  {
    id: 'xp-collector',
    name: 'XP Collector',
    description: 'Earn 1000 total XP',
    icon: '⭐',
    xpRequired: 1000,
    unlocked: false
  },
  {
    id: 'course-master',
    name: 'Course Master',
    description: 'Complete 10 courses',
    icon: '🏆',
    xpRequired: 1000,
    unlocked: false
  },
  {
    id: 'elite-hoodie',
    name: 'Elite Hoodie',
    description: 'Earn 5000 total XP',
    icon: '👑',
    xpRequired: 5000,
    unlocked: false
  }
];

export function useUserXP(walletAddress?: string) {
  const [profile, setProfile] = useState<XPProfile>({
    totalXP: 0,
    completedCourses: [],
    streak: 0,
    lastLogin: '',
    level: 1,
    xpInCurrentLevel: 0,
    xpToNextLevel: 1000,
    progressToNextLevel: 0
  });

  const [badges, setBadges] = useState<Badge[]>(BADGES);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadUserProfile = async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 [useUserXP] Fetching XP data from consolidated API...');
      
      // Use the new consolidated XP service
      const xpData: XPData = await xpService.getUserXP(walletAddress, {
        includeCourses: true,
        includeHistory: false, // Only fetch history when needed
        includeBounties: false
      });
      
      console.log('🔄 [useUserXP] Loaded fresh XP data:', {
        wallet: walletAddress.slice(0, 8) + '...',
        totalXP: xpData.totalXP,
        level: xpData.level,
        exists: xpData.exists
      });
      
      const today = new Date().toISOString().split('T')[0];
      const completedCourses = xpData.courseCompletions?.map(course => course.course_id) || [];
      
      const userProfile: XPProfile = {
        totalXP: xpData.totalXP,
        level: xpData.level,
        completedCourses,
        streak: 1, // TODO: Implement streak tracking
        lastLogin: today,
        xpInCurrentLevel: xpData.xpInCurrentLevel,
        xpToNextLevel: xpData.xpToNextLevel,
        progressToNextLevel: xpData.progressToNextLevel,
        breakdown: xpData.breakdown
      };
      
      console.log('✅ [useUserXP] Setting profile with XP:', xpData.totalXP);
      setProfile(userProfile);
    } catch (error) {
      console.error('❌ [useUserXP] Error loading user profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to load XP data');
      
      // Set default values on error
      const today = new Date().toISOString().split('T')[0];
      setProfile({
        totalXP: 0,
        completedCourses: [],
        streak: 1,
        lastLogin: today,
        level: 1,
        xpInCurrentLevel: 0,
        xpToNextLevel: 1000,
        progressToNextLevel: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, [walletAddress, refreshKey]);

  // Auto-refresh XP every 30 seconds
  useEffect(() => {
    if (!walletAddress) return;

    const interval = setInterval(() => {
      console.log('⏰ [useUserXP] Auto-refreshing XP...');
      loadUserProfile();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [walletAddress]);

  // Listen for XP award events
  useEffect(() => {
    if (!walletAddress) return;

    const handleXPAwarded = (event: CustomEvent) => {
      const { targetWallet } = event.detail;
      // If XP was awarded to this user, refresh immediately
      if (targetWallet === walletAddress) {
        console.log('🎯 [useUserXP] XP awarded to this user, refreshing...');
        loadUserProfile();
      }
    };

    const handleForceRefresh = () => {
      console.log('🔄 [useUserXP] Force refresh triggered');
      loadUserProfile();
    };

    window.addEventListener('xpAwarded', handleXPAwarded as EventListener);
    window.addEventListener('xpUpdated', handleXPAwarded as EventListener);
    window.addEventListener('forceXPRefresh', handleForceRefresh as EventListener);

    // Check if refresh is required on mount
    if (xpService.isRefreshRequired()) {
      console.log('🔄 [useUserXP] Refresh required on mount');
      loadUserProfile();
    }

    return () => {
      window.removeEventListener('xpAwarded', handleXPAwarded as EventListener);
      window.removeEventListener('xpUpdated', handleXPAwarded as EventListener);
      window.removeEventListener('forceXPRefresh', handleForceRefresh as EventListener);
    };
  }, [walletAddress]);

  // Update badges based on current progress
  useEffect(() => {
    const updatedBadges = BADGES.map(badge => {
      let unlocked = false;
      
      switch (badge.id) {
        case 'first-steps':
          unlocked = profile.completedCourses.length >= 1;
          break;
        case 'dedicated-learner':
          unlocked = profile.completedCourses.length >= 5;
          break;
        case 'streak-master':
          unlocked = profile.streak >= 7;
          break;
        case 'xp-collector':
          unlocked = profile.totalXP >= 1000;
          break;
        case 'course-master':
          unlocked = profile.completedCourses.length >= 10;
          break;
        case 'elite-hoodie':
          unlocked = profile.totalXP >= 5000;
          break;
        default:
          unlocked = profile.totalXP >= badge.xpRequired;
      }
      
      return { ...badge, unlocked };
    });
    
    setBadges(updatedBadges);
  }, [profile]);

  const completeCourse = async (slug: string, courseTitle: string, customXP?: number) => {
    if (!walletAddress) {
      console.error('❌ [useUserXP] No wallet address provided');
      return;
    }

    if (profile.completedCourses.includes(slug)) {
      console.log('⚠️ [useUserXP] Course already completed:', slug);
      return;
    }
    
    try {
      console.log('🎓 [useUserXP] Awarding course completion XP:', { slug, courseTitle, customXP });
      
      // Use the XP service to award course XP
      const result = await xpService.awardCourseXP(
        walletAddress,
        slug,
        courseTitle,
        customXP
      );

      if (result.success) {
        console.log('✅ [useUserXP] Course XP awarded successfully');
        // The loadUserProfile will be triggered by the event listener
        // but we can also refresh immediately
        loadUserProfile();
      }
    } catch (error) {
      console.error('❌ [useUserXP] Error completing course:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete course');
    }
  };

  // Function to manually refresh XP data
  const refresh = () => {
    console.log('🔄 [useUserXP] Manual refresh triggered');
    setRefreshKey(prev => prev + 1);
  };

  // Function to force global refresh
  const forceRefresh = () => {
    console.log('🔄 [useUserXP] Force global refresh triggered');
    xpService.forceRefresh();
    setRefreshKey(prev => prev + 1);
  };

  return {
    profile,
    ...profile,
    completeCourse,
    badges,
    loading,
    error,
    refresh,
    forceRefresh
  };
} 