'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  TrendingUp,
  Trophy,
  Target,
  MessageSquare,
  Heart,
  Zap,
  Clock,
  Award,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SquadActivityCardProps {
  squad: string;
  period?: 'day' | 'week' | 'month' | 'all';
}

interface SquadStats {
  totalMembers: number;
  activeMembers: number;
  activeMemberRate: number;
  squadTotalXP: number;
  periodXP: number;
  averageXPPerMember: number;
  completedBounties: number;
  pendingBounties: number;
  socialPosts: number;
  socialComments: number;
  socialReactions: number;
  totalEngagement: number;
}

interface TopContributor {
  walletAddress: string;
  displayName: string;
  xpEarned: number;
  totalXP: number;
  level: number;
}

interface ActivityTrend {
  date: string;
  xp: number;
}

export default function SquadActivityCard({ squad, period = 'week' }: SquadActivityCardProps) {
  const [stats, setStats] = useState<SquadStats | null>(null);
  const [topContributors, setTopContributors] = useState<TopContributor[]>([]);
  const [activityTrend, setActivityTrend] = useState<ActivityTrend[]>([]);
  const [squadRank, setSquadRank] = useState(0);
  const [totalSquads, setTotalSquads] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (squad && squad !== 'Unassigned') {
      fetchSquadActivity();
    }
  }, [squad, period]);

  const fetchSquadActivity = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/squad/activity?squad=${squad}&period=${period}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
        setTopContributors(data.topContributors || []);
        setActivityTrend(data.activityTrend || []);
        setSquadRank(data.squad?.rank || 0);
        setTotalSquads(data.squad?.totalRanks || 0);
      }
    } catch (error) {
      console.error('Error fetching squad activity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-purple-500/30">
        <CardContent className="p-8 text-center">
          <Activity className="w-8 h-8 animate-pulse mx-auto mb-2 text-purple-400" />
          <p className="text-gray-400">Loading squad activity...</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const getPeriodLabel = () => {
    switch (period) {
      case 'day': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'all': return 'All Time';
      default: return 'This Week';
    }
  };

  const maxTrendXP = Math.max(...activityTrend.map(t => t.xp), 1);

  return (
    <div className="space-y-4">
      {/* Squad Overview Card */}
      <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-purple-400 flex items-center justify-between">
            <div className="flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              {squad} Squad Activity
            </div>
            {squadRank > 0 && (
              <Badge className="bg-yellow-600">
                Rank #{squadRank} of {totalSquads}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Total Members */}
            <div className="bg-slate-700/50 rounded-lg p-3 text-center">
              <Users className="w-6 h-6 text-purple-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{stats.totalMembers}</p>
              <p className="text-xs text-gray-400">Total Members</p>
            </div>

            {/* Active Members */}
            <div className="bg-slate-700/50 rounded-lg p-3 text-center">
              <Activity className="w-6 h-6 text-green-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-400">{stats.activeMembers}</p>
              <p className="text-xs text-gray-400">{stats.activeMemberRate}% Active</p>
            </div>

            {/* Squad Total XP */}
            <div className="bg-slate-700/50 rounded-lg p-3 text-center">
              <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-yellow-400">{stats.squadTotalXP.toLocaleString()}</p>
              <p className="text-xs text-gray-400">Total XP</p>
            </div>

            {/* Period XP */}
            <div className="bg-slate-700/50 rounded-lg p-3 text-center">
              <TrendingUp className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-cyan-400">{stats.periodXP.toLocaleString()}</p>
              <p className="text-xs text-gray-400">{getPeriodLabel()}</p>
            </div>
          </div>

          {/* Engagement Stats */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-slate-700/30 rounded p-2 text-center">
              <Target className="w-4 h-4 text-green-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{stats.completedBounties}</p>
              <p className="text-xs text-gray-400">Bounties</p>
            </div>
            <div className="bg-slate-700/30 rounded p-2 text-center">
              <MessageSquare className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{stats.socialPosts}</p>
              <p className="text-xs text-gray-400">Posts</p>
            </div>
            <div className="bg-slate-700/30 rounded p-2 text-center">
              <Heart className="w-4 h-4 text-pink-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{stats.totalEngagement}</p>
              <p className="text-xs text-gray-400">Engagement</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Trend */}
      <Card className="bg-slate-800/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-purple-400 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            XP Activity Trend (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {activityTrend.map((day, index) => (
              <div key={index} className="flex items-center space-x-3">
                <span className="text-xs text-gray-400 w-20">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <div className="flex-1">
                  <Progress 
                    value={(day.xp / maxTrendXP) * 100} 
                    className="h-2"
                  />
                </div>
                <span className="text-xs text-cyan-400 w-16 text-right">
                  {day.xp.toLocaleString()} XP
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Contributors */}
      {topContributors.length > 0 && (
        <Card className="bg-slate-800/50 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-purple-400 flex items-center text-sm">
              <Award className="w-4 h-4 mr-2" />
              Top Contributors ({getPeriodLabel()})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topContributors.slice(0, 5).map((contributor, index) => (
                <div key={contributor.walletAddress} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{contributor.displayName}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                          Level {contributor.level}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {contributor.totalXP.toLocaleString()} Total XP
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-400">+{contributor.xpEarned}</p>
                    <p className="text-xs text-gray-400">XP earned</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

