'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Target,
  Sparkles,
  Award,
  Medal,
  Crown,
  Star,
  Zap,
  BarChart3,
  Calendar,
  Filter,
  Search
} from 'lucide-react';
import TokenGate from '@/components/TokenGate';
import Link from 'next/link';
import PageLayout from "@/components/layouts/PageLayout";

export default function LeaderboardPage() {
  return (
    <TokenGate>
      <PageLayout
        title="🏆 Hoodie Academy Leaderboard"
        subtitle="Track your progress and compete with fellow scholars"
        showHomeButton={true}
        showBackButton={true}
        backHref="/dashboard"
      >
        {/* Status Display */}
        <div className="text-center mb-6">
          <div className="text-sm text-gray-400">Status</div>
          <div className="text-lg text-yellow-400 font-mono">
            Coming Soon
          </div>
        </div>

        {/* Main Content */}
        <main className="space-y-6">
            {/* Coming Soon Banner */}
            <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-yellow-400 mb-2">Leaderboard Coming Soon!</h2>
                  <p className="text-gray-300 mb-4">
                    We're building an epic leaderboard system where you can track your progress, compete with fellow Hoodie scholars, and earn recognition for your achievements.
                  </p>
                  <div className="bg-slate-700/50 p-4 rounded-lg mb-6">
                    <h3 className="text-sm font-semibold text-yellow-400 mb-2">What's Coming</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-gray-300">Real-time rankings & competition</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-gray-300">Progress tracking & analytics</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-gray-300">Achievement badges & rewards</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-gray-300">Squad-based competitions</span>
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
                    <Link href="/courses">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Start Learning
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview of Leaderboard Features */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Rankings */}
              <Card className="bg-slate-800/50 border-yellow-500/30">
                <CardHeader>
                  <CardTitle className="text-yellow-400 flex items-center space-x-2">
                    <Crown className="w-5 h-5" />
                    <span>Rankings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                          <Medal className="w-4 h-4 text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Course Completion</p>
                          <p className="text-xs text-gray-400">Track your learning progress</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                        Coming Soon
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                          <Star className="w-4 h-4 text-orange-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Achievement Points</p>
                          <p className="text-xs text-gray-400">Earn points for milestones</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                        Coming Soon
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Analytics */}
              <Card className="bg-slate-800/50 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-purple-400 flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Progress Charts</p>
                          <p className="text-xs text-gray-400">Visualize your growth</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                        Coming Soon
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <Target className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Goal Setting</p>
                          <p className="text-xs text-gray-400">Set and track objectives</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                        Coming Soon
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Competition */}
              <Card className="bg-slate-800/50 border-green-500/30">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>Competition</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Squad Battles</p>
                          <p className="text-xs text-gray-400">Compete with your squad</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                        Coming Soon
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-pink-500/20 rounded-full flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-pink-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Seasonal Events</p>
                          <p className="text-xs text-gray-400">Limited-time competitions</p>
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

            {/* Leaderboard Stats Preview */}
            <Card className="bg-slate-800/50 border-yellow-500/30">
              <CardHeader>
                <CardTitle className="text-yellow-400">Leaderboard Stats Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-yellow-400">0</p>
                    <p className="text-sm text-gray-400">Total Participants</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-400">0</p>
                    <p className="text-sm text-gray-400">Active Learners</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-400">0</p>
                    <p className="text-sm text-gray-400">Courses Completed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-400">0</p>
                    <p className="text-sm text-gray-400">Achievements Earned</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Community Features Preview */}
            <Card className="bg-slate-800/50 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400">Community Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4">
                    <Trophy className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-2">Earn Recognition</h3>
                    <p className="text-sm text-gray-400">Get recognized for your achievements and climb the ranks</p>
                  </div>
                  <div className="text-center p-4">
                    <Users className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-2">Compete & Collaborate</h3>
                    <p className="text-sm text-gray-400">Challenge your squad members and collaborate on learning goals</p>
                  </div>
                  <div className="text-center p-4">
                    <Badge className="w-12 h-12 text-purple-400 mx-auto mb-3 flex items-center justify-center">
                      <span className="text-lg">🏆</span>
                    </Badge>
                    <h3 className="text-lg font-semibold text-white mb-2">Win Rewards</h3>
                    <p className="text-sm text-gray-400">Earn exclusive badges, titles, and rewards for top performance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </PageLayout>
      </TokenGate>
    );
  } 