'use client';

import { useUserXP } from '@/hooks/useUserXP';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, BookOpen, Trophy, Target, Star, Medal } from 'lucide-react';

export default function TestProfilePage() {
  const { 
    totalXP, 
    level, 
    completedCourses, 
    badges, 
    loading: xpLoading 
  } = useUserXP();

  if (xpLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-cyan-400 text-xl">Loading Profile Test...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white text-center mb-8">Profile Features Test</h1>
        
        {/* XP System Card */}
        <Card className="bg-slate-800/60 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-purple-400 flex items-center gap-2">
              <Zap className="w-6 h-6" />
              Experience & Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Level and XP Display */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {level}
                    </div>
                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-slate-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      ★
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Level {level}</h3>
                    <p className="text-purple-400 font-mono">{totalXP.toLocaleString()} XP</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Next Level</p>
                  <p className="text-purple-400 font-semibold">
                    {((level) * 1000).toLocaleString()} XP
                  </p>
                </div>
              </div>

              {/* XP Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Progress to Level {level + 1}</span>
                  <span className="text-purple-400">
                    {totalXP % 1000}/1,000 XP
                  </span>
                </div>
                <Progress 
                  value={(totalXP % 1000) / 10} 
                  className="h-3 bg-slate-700 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500" 
                />
              </div>

              {/* XP Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <BookOpen className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                  <p className="text-cyan-400 font-semibold">{completedCourses.length}</p>
                  <p className="text-xs text-gray-400">Courses</p>
                </div>
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                  <p className="text-yellow-400 font-semibold">{badges.filter(b => b.unlocked).length}</p>
                  <p className="text-xs text-gray-400">Badges</p>
                </div>
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <Target className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                  <p className="text-orange-400 font-semibold">0</p>
                  <p className="text-xs text-gray-400">Bounties</p>
                </div>
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <Star className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                  <p className="text-pink-400 font-semibold">{totalXP}</p>
                  <p className="text-xs text-gray-400">Total XP</p>
                </div>
              </div>

              {/* Recent Badges */}
              <div>
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Medal className="w-4 h-4" />
                  Recent Badges
                </h4>
                <div className="flex flex-wrap gap-2">
                  {badges.filter(b => b.unlocked).slice(0, 6).map((badge) => (
                    <Badge 
                      key={badge.id} 
                      className="flex items-center gap-1 px-3 py-1 border border-purple-500/30 bg-slate-900/60 text-purple-300"
                    >
                      {badge.icon} {badge.name}
                    </Badge>
                  ))}
                  {badges.filter(b => b.unlocked).length === 0 && (
                    <p className="text-gray-400 text-sm">No badges earned yet</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Information */}
        <Card className="bg-slate-800/60 border-gray-500/30">
          <CardHeader>
            <CardTitle className="text-gray-400">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Total XP:</strong> {totalXP}</p>
              <p><strong>Level:</strong> {level}</p>
              <p><strong>Completed Courses:</strong> {completedCourses.length}</p>
              <p><strong>Unlocked Badges:</strong> {badges.filter(b => b.unlocked).length}</p>
              <p><strong>All Badges:</strong> {badges.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

