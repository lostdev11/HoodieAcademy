import { useState, useEffect } from 'react';
import { leaderboardService, UserProgressUpdate } from '@/services/leaderboard-service';

export const useLeaderboard = (walletAddress?: string) => {
  const [userRank, setUserRank] = useState<number>(-1);
  const [userScore, setUserScore] = useState<number>(0);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      loadUserData();
    }
  }, [walletAddress]);

  const loadUserData = () => {
    if (!walletAddress) return;

    setIsLoading(true);
    try {
      const rank = leaderboardService.getUserRank(walletAddress);
      const score = leaderboardService.getUserScore(walletAddress);
      const progress = leaderboardService.getUserProgress(walletAddress);

      setUserRank(rank);
      setUserScore(score);
      setUserProgress(progress ? [progress] : []);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProgress = (update: UserProgressUpdate) => {
    if (!walletAddress) return;

    try {
      leaderboardService.updateProgress(update);
      loadUserData(); // Reload user data after update
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const initializeUser = (displayName: string) => {
    if (!walletAddress) return;

    try {
      leaderboardService.initializeUser(walletAddress, displayName);
      loadUserData();
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  };

  const getAchievements = () => {
    if (!walletAddress) return [];
    const userProgress = leaderboardService.getUserProgress(walletAddress);
    if (!userProgress) return [];
    return leaderboardService.checkAchievements(userProgress);
  };

  const exportUserData = () => {
    if (!walletAddress) return null;
    return leaderboardService.exportUserData(walletAddress);
  };

  const importUserData = (data: any) => {
    if (!walletAddress) return;
    leaderboardService.importUserData(data);
    loadUserData();
  };

  return {
    userRank,
    userScore,
    userProgress,
    isLoading,
    updateProgress,
    initializeUser,
    getAchievements,
    exportUserData,
    importUserData,
    loadUserData
  };
}; 