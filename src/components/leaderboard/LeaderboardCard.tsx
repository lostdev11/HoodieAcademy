'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Medal, 
  Award, 
  BookOpen, 
  Target, 
  Clock, 
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy
} from 'lucide-react';
import { LeaderboardUser, Achievement } from '@/lib/leaderboardData';
import { formatWalletAddress } from '@/services/sns-resolver';

interface LeaderboardCardProps {
  user: LeaderboardUser;
  isCurrentUser?: boolean;
  highlight?: boolean;
}

export function LeaderboardCard({ user, isCurrentUser = false, highlight = false }: LeaderboardCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 border-gray-500/30';
      case 3:
        return 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-amber-500/30';
      default:
        return highlight ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/30' : 'bg-slate-800/50 border-slate-600/30';
    }
  };

  const handleCopyWallet = async () => {
    try {
      await navigator.clipboard.writeText(user.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy wallet address:', err);
    }
  };

  const overallProgress = Math.round(
    user.courseProgress.reduce((acc, course) => acc + course.progress, 0) / user.courseProgress.length
  );

  return (
    <Card className={`${getRankColor(user.rank)} ${isCurrentUser ? 'ring-2 ring-cyan-500/50' : ''} transition-all duration-300 hover:scale-[1.02]`}>
      <CardContent className="p-6">
        {/* Main Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* Rank */}
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-700/50">
              {getRankIcon(user.rank)}
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-white">{user.displayName}</h3>
                {isCurrentUser && (
                  <Badge variant="outline" className="text-xs bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    You
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className="font-mono">{formatWalletAddress(user.walletAddress)}</span>
                <span>•</span>
                <span>Joined {new Date(user.joinDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          {/* Score */}
          <div className="text-right">
            <div className="text-2xl font-bold text-cyan-400">{user.overallCompletionPercentage.toFixed(1)}%</div>
            <div className="text-sm text-gray-400">Completion</div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-green-400">{user.coursesStarted}</div>
            <div className="text-xs text-gray-400">Started</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-400">{user.coursesCompleted}</div>
            <div className="text-xs text-gray-400">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-pink-400">{user.totalLessonsCompleted}</div>
            <div className="text-xs text-gray-400">Lessons</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-yellow-400">{user.achievements.length}</div>
            <div className="text-xs text-gray-400">Achievements</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-300">Overall Progress</span>
            <span className="text-cyan-400">{user.overallCompletionPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={user.overallCompletionPercentage} className="h-2 bg-slate-700 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-pink-500" />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyWallet}
              className="text-gray-400 hover:text-green-400 hover:bg-green-500/10"
              title="Copy wallet address"
            >
              <Copy className="w-4 h-4" />
            </Button>
            {/* Removed Solscan link button */}
          </div>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDetails(!showDetails)}
            className="text-cyan-400 hover:text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/10"
          >
            {showDetails ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Show Details
              </>
            )}
          </Button>
        </div>

        {/* Detailed View */}
        {showDetails && (
          <div className="mt-6 pt-4 border-t border-slate-600/30 space-y-4">
            {/* Course Progress */}
            <div>
              <h4 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center">
                <BookOpen className="w-4 h-4 mr-2" />
                Course Progress
              </h4>
              <div className="space-y-2">
                {user.courseProgress.map((course) => (
                  <div key={course.courseId} className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{course.courseName}</div>
                      <div className="text-xs text-gray-400">
                        {course.lessonsCompleted}/{course.totalLessons} lessons • {course.quizzesPassed}/{course.totalQuizzes} quizzes
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-cyan-400">{course.progress}%</div>
                      {course.completed && (
                        <div className="text-xs text-green-400">Completed</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            {user.achievements.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center">
                  <Award className="w-4 h-4 mr-2" />
                  Achievements
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {user.achievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center space-x-2 p-2 bg-slate-700/30 rounded">
                      <span className="text-lg">{achievement.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{achievement.name}</div>
                        <div className="text-xs text-gray-400">{achievement.description}</div>
                      </div>
                      <div className="text-xs text-yellow-400">+{achievement.points}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-700/30 rounded">
                <div className="text-sm text-gray-400">Total Lessons</div>
                <div className="text-lg font-semibold text-purple-400">{user.totalLessons}</div>
              </div>
              <div className="p-3 bg-slate-700/30 rounded">
                <div className="text-sm text-gray-400">Quizzes Passed</div>
                <div className="text-lg font-semibold text-green-400">{user.totalQuizzes}</div>
              </div>
              <div className="p-3 bg-slate-700/30 rounded">
                <div className="text-sm text-gray-400">Last Active</div>
                <div className="text-sm font-medium text-cyan-400">
                  {new Date(user.lastActive).toLocaleDateString()}
                </div>
              </div>
              <div className="p-3 bg-slate-700/30 rounded">
                <div className="text-sm text-gray-400">Squad</div>
                <div className="text-sm font-medium text-pink-400">{user.squad || 'None'}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 