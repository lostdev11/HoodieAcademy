import { useMemo } from 'react';
import { 
  LEVELS, 
  Level, 
  getLevelByXP, 
  getNextLevel, 
  getProgressToNextLevel, 
  getXPForNextLevel, 
  getXPNeededForNextLevel,
  getUnlocksForLevel,
  getTotalUnlocks
} from '@/lib/levels';

export type LevelData = {
  level: number;
  title: string;
  currentXP: number;
  nextXP: number;
  progress: number; // 0–100
  xpNeeded: number;
  description?: string;
  icon?: string;
  color?: string;
  unlocks: string[];
  totalUnlocks: string[];
  isMaxLevel: boolean;
  nextLevel?: Level;
};

export const useLevel = (xp: number): LevelData => {
  return useMemo(() => {
    const currentLevel = getLevelByXP(xp);
    const nextLevel = getNextLevel(currentLevel);
    const progress = getProgressToNextLevel(xp);
    const nextXP = getXPForNextLevel(xp);
    const xpNeeded = getXPNeededForNextLevel(xp);
    const unlocks = getUnlocksForLevel(currentLevel.level);
    const totalUnlocks = getTotalUnlocks(currentLevel.level);
    const isMaxLevel = !nextLevel;

    return {
      level: currentLevel.level,
      title: currentLevel.title,
      currentXP: xp,
      nextXP,
      progress: Math.min(progress, 100),
      xpNeeded,
      description: currentLevel.description,
      icon: currentLevel.icon,
      color: currentLevel.color,
      unlocks,
      totalUnlocks,
      isMaxLevel,
      nextLevel: nextLevel || undefined
    };
  }, [xp]);
};

// Hook for level-up detection
export const useLevelUp = (oldXP: number, newXP: number): boolean => {
  return useMemo(() => {
    const oldLevel = getLevelByXP(oldXP);
    const newLevel = getLevelByXP(newXP);
    return newLevel.level > oldLevel.level;
  }, [oldXP, newXP]);
};

// Hook for squad level calculations
export const useSquadLevel = (squadMembers: { xp: number }[]): {
  averageLevel: number;
  highestLevel: number;
  lowestLevel: number;
  totalXP: number;
} => {
  return useMemo(() => {
    if (squadMembers.length === 0) {
      return {
        averageLevel: 0,
        highestLevel: 0,
        lowestLevel: 0,
        totalXP: 0
      };
    }

    const levels = squadMembers.map(member => getLevelByXP(member.xp).level);
    const totalXP = squadMembers.reduce((sum, member) => sum + member.xp, 0);
    
    return {
      averageLevel: Math.round(levels.reduce((sum, level) => sum + level, 0) / levels.length),
      highestLevel: Math.max(...levels),
      lowestLevel: Math.min(...levels),
      totalXP
    };
  }, [squadMembers]);
};

// Hook for level rewards tracking
export const useLevelRewards = (level: number): {
  currentUnlocks: string[];
  totalUnlocks: string[];
  nextUnlocks: string[];
} => {
  return useMemo(() => {
    const currentUnlocks = getUnlocksForLevel(level);
    const totalUnlocks = getTotalUnlocks(level);
    const nextLevel = LEVELS.find(l => l.level === level + 1);
    const nextUnlocks = nextLevel ? getUnlocksForLevel(level + 1) : [];

    return {
      currentUnlocks,
      totalUnlocks,
      nextUnlocks
    };
  }, [level]);
};

// Hook for XP milestones
export const useXPMilestones = (xp: number): {
  nextMilestone: number;
  milestones: number[];
  progressToMilestone: number;
} => {
  return useMemo(() => {
    const milestones = LEVELS.map(level => level.xpRequired).filter(milestone => milestone > xp);
    const nextMilestone = milestones.length > 0 ? milestones[0] : xp;
    const progressToMilestone = nextMilestone > xp ? ((xp / nextMilestone) * 100) : 100;

    return {
      nextMilestone,
      milestones,
      progressToMilestone: Math.min(progressToMilestone, 100)
    };
  }, [xp]);
}; 