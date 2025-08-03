'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Crown, Award } from 'lucide-react';
import { useLevel } from '@/hooks/useLevel';

type LevelBadgeProps = {
  xp: number;
  showDetails?: boolean;
  showUnlocks?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'premium';
};

export const LevelBadge = ({ 
  xp, 
  showDetails = true, 
  showUnlocks = false,
  className = '',
  variant = 'default'
}: LevelBadgeProps) => {
  const levelData = useLevel(xp);

  if (variant === 'compact') {
    return (
      <div className={`bg-gray-800/50 border border-gray-700 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{levelData.icon}</span>
            <div>
              <div className="text-white font-semibold">Level {levelData.level}</div>
              <div className={`text-xs ${levelData.color || 'text-gray-400'}`}>
                {levelData.title}
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
            {levelData.currentXP.toLocaleString()} XP
          </Badge>
        </div>
      </div>
    );
  }

  if (variant === 'premium') {
    return (
      <Card className={`bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 rounded-xl shadow-lg ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <Crown className="w-5 h-5 text-yellow-400" />
            {levelData.icon} Level {levelData.level}
            {levelData.isMaxLevel && (
              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                MAX
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${levelData.color || 'text-white'}`}>
              {levelData.title}
            </div>
            {levelData.description && (
              <div className="text-sm text-gray-400 mt-1">
                {levelData.description}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300">Progress</span>
              <span className="text-purple-400 font-medium">
                {levelData.currentXP.toLocaleString()} / {levelData.nextXP.toLocaleString()} XP
              </span>
            </div>
            <Progress value={levelData.progress} className="h-2" />
            {!levelData.isMaxLevel && (
              <p className="text-xs text-gray-400">
                {levelData.xpNeeded.toLocaleString()} XP needed for next level
              </p>
            )}
          </div>

          {showUnlocks && levelData.unlocks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-300 text-sm font-medium">Current Unlocks</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {levelData.unlocks.map((unlock, index) => (
                  <Badge key={index} variant="secondary" className="bg-green-500/20 text-green-400 text-xs">
                    {unlock}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={`bg-gray-900 border border-purple-600/30 rounded-xl shadow-lg ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-lg">
          <Trophy className="w-5 h-5 text-purple-400" />
          🎓 Level {levelData.level}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showDetails ? (
          <>
            <div className="text-center">
              <div className={`text-xl font-bold ${levelData.color || 'text-white'}`}>
                {levelData.title}
              </div>
              {levelData.description && (
                <div className="text-sm text-gray-400 mt-1">
                  {levelData.description}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-300">Progress to Level {levelData.level + 1}</span>
                <span className="text-purple-400 font-medium">
                  {levelData.currentXP.toLocaleString()} / {levelData.nextXP.toLocaleString()} XP
                </span>
              </div>
              <Progress value={levelData.progress} className="h-2" />
              {!levelData.isMaxLevel && (
                <p className="text-xs text-gray-400">
                  {levelData.xpNeeded.toLocaleString()} XP needed for next level
                </p>
              )}
            </div>

            {showUnlocks && levelData.unlocks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-300 text-sm font-medium">Unlocks</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {levelData.unlocks.map((unlock, index) => (
                    <Badge key={index} variant="secondary" className="bg-green-500/20 text-green-400 text-xs">
                      {unlock}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          // Compact version
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-lg">{levelData.icon}</span>
                <span className="text-white font-semibold">{levelData.title}</span>
              </div>
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                {levelData.currentXP.toLocaleString()} XP
              </Badge>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Progress</span>
                <span className="text-purple-400">{Math.round(levelData.progress)}%</span>
              </div>
              <Progress value={levelData.progress} className="h-1" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Level-up animation component
export const LevelUpAnimation = ({ 
  isVisible, 
  newLevel, 
  newTitle 
}: { 
  isVisible: boolean; 
  newLevel: number; 
  newTitle: string; 
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-8 rounded-xl text-center animate-pulse">
        <div className="text-6xl mb-4">🎉</div>
        <div className="text-2xl font-bold text-white mb-2">LEVEL UP!</div>
        <div className="text-xl text-white mb-2">Level {newLevel}</div>
        <div className="text-lg text-yellow-100">{newTitle}</div>
      </div>
    </div>
  );
}; 