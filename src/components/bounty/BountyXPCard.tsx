'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Trophy, TrendingUp } from 'lucide-react';

type BountyXPCardProps = {
  submissionCount: number; // how many times user submitted to this bounty
  placement?: "1st" | "2nd" | "3rd"; // optional - only for winners
  bountyTitle?: string; // optional bounty title for context
  className?: string; // optional className for styling
  showDetails?: boolean; // optional - show detailed breakdown
};

const placementXP = {
  "1st": 250,
  "2nd": 100,
  "3rd": 50,
};

const placementIcons = {
  "1st": "🥇",
  "2nd": "🥈", 
  "3rd": "🥉",
};

export const BountyXPCard = ({ 
  submissionCount, 
  placement, 
  bountyTitle,
  className = '',
  showDetails = true 
}: BountyXPCardProps) => {
  const baseXP = Math.min(submissionCount * 10, 30);
  const bonusXP = placement ? placementXP[placement] : 0;
  const totalXP = baseXP + bonusXP;

  return (
    <Card className={`bg-gray-900 border border-indigo-500/30 rounded-xl shadow-lg ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-lg">
          <Star className="w-5 h-5 text-yellow-400" />
          ✨ XP Earned
          {bountyTitle && (
            <span className="text-sm text-gray-400 font-normal">
              - {bountyTitle}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {showDetails ? (
          <>
            <div className="flex justify-between items-center">
              <span className="text-indigo-300 text-sm">📥 Submissions</span>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                {submissionCount}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-indigo-300 text-sm">🧱 Base XP</span>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                {baseXP} XP
              </Badge>
            </div>
            
            {placement && (
              <div className="flex justify-between items-center">
                <span className="text-indigo-300 text-sm">
                  {placementIcons[placement]} Placement Bonus ({placement})
                </span>
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                  +{bonusXP} XP
                </Badge>
              </div>
            )}
            
            <div className="border-t border-indigo-600/50 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-white font-semibold">🔥 Total</span>
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 font-bold text-lg">
                  {totalXP} XP
                </Badge>
              </div>
            </div>
          </>
        ) : (
          // Compact version for leaderboards/sidebars
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-white font-semibold">{totalXP} XP</span>
            </div>
            <div className="text-xs text-gray-400">
              {submissionCount} sub{submissionCount !== 1 ? 's' : ''}
              {placement && ` • ${placement}`}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Compact variant for use in lists/sidebars
export const BountyXPCardCompact = ({ 
  submissionCount, 
  placement, 
  totalXP,
  className = '' 
}: {
  submissionCount: number;
  placement?: "1st" | "2nd" | "3rd";
  totalXP: number;
  className?: string;
}) => {
  return (
    <div className={`bg-gray-800/50 border border-gray-700 rounded-lg p-3 ${className}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-white font-medium">{totalXP} XP</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span className="text-gray-400">{submissionCount}</span>
          {placement && (
            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 text-xs">
              {placementIcons[placement]}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}; 