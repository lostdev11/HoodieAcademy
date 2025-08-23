import { useEffect, useState } from 'react';

export interface XPProfile {
  totalXP: number;
  completedCourses: string[];
  streak: number;
  lastLogin: string;
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

export function useUserXP() {
  const [profile, setProfile] = useState<XPProfile>({
    totalXP: 0,
    completedCourses: [],
    streak: 0,
    lastLogin: ''
  });

  const [badges, setBadges] = useState<Badge[]>(BADGES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        // This should fetch from your database instead of localStorage
        // For now, set default values as we're removing localStorage
        const today = new Date().toISOString().split('T')[0];
        const defaultProfile: XPProfile = {
          totalXP: 0,
          completedCourses: [],
          streak: 1,
          lastLogin: today
        };
        
        setProfile(defaultProfile);
      } catch (error) {
        console.error('Error loading user profile:', error);
        // Set default values on error
        const today = new Date().toISOString().split('T')[0];
        setProfile({
          totalXP: 0,
          completedCourses: [],
          streak: 1,
          lastLogin: today
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

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

  const completeCourse = async (slug: string, xp = 100) => {
    if (profile.completedCourses.includes(slug)) return;
    
    try {
      const updated = {
        ...profile,
        totalXP: profile.totalXP + xp,
        completedCourses: [...profile.completedCourses, slug]
      };
      
      // This should save to your database instead of localStorage
      // For now, just update the local state
      setProfile(updated);
      
      // TODO: Implement database save here
      console.log('Course completed, should save to database:', updated);
      
    } catch (error) {
      console.error('Error completing course:', error);
    }
  };

  return {
    ...profile,
    completeCourse,
    badges,
    loading
  };
} 