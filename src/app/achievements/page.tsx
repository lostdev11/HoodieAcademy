'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Star, 
  Award, 
  Zap, 
  Target, 
  Flame,
  Sparkles,
  Crown,
  BookOpen,
  Users,
  Heart,
  MessageCircle
} from 'lucide-react';
import TokenGate from '@/components/TokenGate';
import Link from 'next/link';

export default function AchievementsPage() {
  return (
    <TokenGate>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <header className="bg-slate-800/50 border-b border-yellow-500/30 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Trophy className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-yellow-400">Achievements</h1>
                <p className="text-gray-300">Unlock badges and rewards for your accomplishments</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto p-6">
          {/* Coming Soon Banner */}
          <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30 mb-8">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-yellow-400 mb-2">Achievements Coming Soon!</h2>
                <p className="text-gray-300 mb-4">
                  We're working hard to bring you an amazing achievements system with badges, rewards, and special recognition for your progress.
                </p>
                <div className="bg-slate-700/50 p-4 rounded-lg mb-6">
                  <h3 className="text-sm font-semibold text-yellow-400 mb-2">What's Coming</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-gray-300">Course completion badges</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-gray-300">Quiz mastery rewards</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-gray-300">Streak achievements</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-gray-300">Leaderboard milestones</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <Button asChild className="bg-yellow-600 hover:bg-yellow-700">
                  <Link href="/dashboard">
                    <Trophy className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10">
                  <Link href="/leaderboard">
                    <Award className="w-4 h-4 mr-2" />
                    View Leaderboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview of Achievement Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Course Completion */}
            <Card className="bg-slate-800/50 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span>Course Mastery</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                        <Star className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">First Course</p>
                        <p className="text-xs text-gray-400">Complete your first course</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                      Coming Soon
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Course Champion</p>
                        <p className="text-xs text-gray-400">Complete all courses</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                      Coming Soon
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quiz Excellence */}
            <Card className="bg-slate-800/50 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-green-400 flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Quiz Excellence</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                        <Zap className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Perfect Score</p>
                        <p className="text-xs text-gray-400">Get 100% on any quiz</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                      Coming Soon
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <Flame className="w-4 h-4 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Quiz Streak</p>
                        <p className="text-xs text-gray-400">Pass 5 quizzes in a row</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                      Coming Soon
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Community */}
            <Card className="bg-slate-800/50 border-pink-500/30">
              <CardHeader>
                <CardTitle className="text-pink-400 flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Community</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-pink-500/20 rounded-full flex items-center justify-center">
                        <Heart className="w-4 h-4 text-pink-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Squad Leader</p>
                        <p className="text-xs text-gray-400">Lead your squad to victory</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                      Coming Soon
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Active Participant</p>
                        <p className="text-xs text-gray-400">Engage in community discussions</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                      Coming Soon
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Tracking */}
          <Card className="bg-slate-800/50 border-purple-500/30 mt-8">
            <CardHeader>
              <CardTitle className="text-purple-400">Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-cyan-400">0</p>
                  <p className="text-sm text-gray-400">Achievements Unlocked</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">0</p>
                  <p className="text-sm text-gray-400">Badges Earned</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-400">0</p>
                  <p className="text-sm text-gray-400">Streaks Active</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-pink-400">0</p>
                  <p className="text-sm text-gray-400">Points Earned</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </TokenGate>
  );
} 