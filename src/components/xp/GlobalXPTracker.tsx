'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Globe, Trophy, Star, TrendingUp, Award } from 'lucide-react';

type GlobalXPTrackerProps = {
  userXP: number;
  level?: number; // optional, if you're building a leveling system
  nextUnlock?: number; // optional: XP needed to unlock next perk
  rank?: string; // optional: user's global rank
  totalUsers?: number; // optional: total users for rank context
  className?: string;
  showDetails?: boolean; // optional: show detailed breakdown
};

// XP to level calculation (example: every 1000 XP = 1 level)
const calculateLevel = (xp: number): number => {
  return Math.floor(xp / 1000) + 1;
};

// XP needed for next level
const getXPForNextLevel = (currentLevel: number): number => {
  return currentLevel * 1000;
};

// XP progress to next level
const getXPProgress = (currentXP: number, nextLevelXP: number): number => {
  const currentLevelXP = (Math.floor(currentXP / 1000)) * 1000;
  const progress = ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  return Math.min(Math.max(progress, 0), 100);
};

export const GlobalXPTracker = ({ 
  userXP, 
  level, 
  nextUnlock, 
  rank,
  totalUsers,
  className = '',
  showDetails = true 
}: GlobalXPTrackerProps) => {
  const calculatedLevel = level ?? calculateLevel(userXP);
  const nextLevelXP = getXPForNextLevel(calculatedLevel);
  const progress = nextUnlock 
    ? Math.min((userXP / nextUnlock) * 100, 100) 
    : getXPProgress(userXP, nextLevelXP);

  return (
    <Card className={`bg-gray-800 border border-purple-600/30 rounded-xl shadow-lg ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-lg">
          <Globe className="w-5 h-5 text-purple-400" />
          🌍 Global XP Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showDetails ? (
          <>
            {/* XP Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{userXP.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Total XP</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{calculatedLevel}</div>
                <div className="text-xs text-gray-400">Level</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-300">Progress to Level {calculatedLevel + 1}</span>
                <span className="text-purple-400 font-medium">
                  {userXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-400">
                {nextLevelXP - userXP} XP needed for next level
              </p>
            </div>

            {/* Rank Information */}
            {rank && (
              <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300 text-sm">Global Rank</span>
                </div>
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                  #{rank}
                  {totalUsers && (
                    <span className="text-gray-400 ml-1">/ {totalUsers}</span>
                  )}
                </Badge>
              </div>
            )}

            {/* Next Unlock (if provided) */}
            {nextUnlock && (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-indigo-400" />
                  <span className="text-indigo-300 text-sm font-medium">Next Unlock</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white text-sm">Unlock at {nextUnlock.toLocaleString()} XP</span>
                  <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-400">
                    {nextUnlock - userXP} XP needed
                  </Badge>
                </div>
              </div>
            )}
          </>
        ) : (
          // Compact version for sidebars/dashboards
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-white font-semibold">{userXP.toLocaleString()} XP</span>
              </div>
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                Lv.{calculatedLevel}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Progress</span>
                <span className="text-purple-400">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1" />
            </div>

            {rank && (
              <div className="text-xs text-gray-400">
                Rank #{rank}
                {totalUsers && ` / ${totalUsers}`}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 