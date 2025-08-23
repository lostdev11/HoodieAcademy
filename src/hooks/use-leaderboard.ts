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

  const loadUserData = async () => {
    if (!walletAddress) return;

    setIsLoading(true);
    try {
      const rank = await leaderboardService.getUserRank(walletAddress);
      const score = await leaderboardService.getUserScore(walletAddress);
      const progress = await leaderboardService.getUserProgress(walletAddress);

      setUserRank(rank);
      setUserScore(score);
      setUserProgress(progress ? [progress] : []);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProgress = async (update: UserProgressUpdate) => {
    if (!walletAddress) return;

    try {
      leaderboardService.updateProgress(update);
      await loadUserData(); // Reload user data after update
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const initializeUser = async (displayName: string) => {
    if (!walletAddress) return;

    try {
      leaderboardService.initializeUser(walletAddress, displayName);
      await loadUserData();
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  };

  const getAchievements = async () => {
    if (!walletAddress) return [];
    const userProgress = await leaderboardService.getUserProgress(walletAddress);
    if (!userProgress) return [];
    return leaderboardService.checkAchievements(userProgress);
  };

  const exportUserData = async () => {
    if (!walletAddress) return null;
    return leaderboardService.exportUserData(walletAddress);
  };

  const importUserData = async (data: any) => {
    if (!walletAddress) return;
    leaderboardService.importUserData(data);
    await loadUserData();
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