'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Users, TrendingUp, Activity, Crown, Target } from 'lucide-react';
import { useSquadRankings } from '@/hooks/useSquadTracking';
import { Progress } from '@/components/ui/progress';

interface SquadRankingsCardProps {
  highlightSquad?: string;
  compact?: boolean;
}

export default function SquadRankingsCard({ highlightSquad, compact = false }: SquadRankingsCardProps) {
  const [metric, setMetric] = useState<'xp' | 'members' | 'activity' | 'avg_xp'>('xp');
  const [period, setPeriod] = useState<'all' | 'week' | 'month'>('all');
  
  const { rankings, globalStats, loading, error, refresh } = useSquadRankings(metric, period);

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-cyan-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2 text-gray-400">
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading squad rankings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-800/50 border-red-500/30">
        <CardContent className="p-6">
          <p className="text-red-400 text-center">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  const topSquad = rankings[0];
  const maxValue = topSquad ? (
    metric === 'xp' ? topSquad.totalXP :
    metric === 'members' ? topSquad.totalMembers :
    metric === 'activity' ? topSquad.activityRate :
    topSquad.avgXPPerMember
  ) : 1;

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-purple-400" />
            <span className="text-purple-400">Squad Rankings</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            className="text-gray-400 hover:text-cyan-400"
          >
            <Activity className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </CardTitle>

        {/* Metric Selector */}
        {!compact && (
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={metric === 'xp' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMetric('xp')}
              className={metric === 'xp' ? 'bg-purple-600 hover:bg-purple-700' : ''}
            >
              <Trophy className="w-3 h-3 mr-1" />
              Total XP
            </Button>
            <Button
              variant={metric === 'members' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMetric('members')}
              className={metric === 'members' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
            >
              <Users className="w-3 h-3 mr-1" />
              Members
            </Button>
            <Button
              variant={metric === 'activity' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMetric('activity')}
              className={metric === 'activity' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              <Activity className="w-3 h-3 mr-1" />
              Activity
            </Button>
            <Button
              variant={metric === 'avg_xp' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMetric('avg_xp')}
              className={metric === 'avg_xp' ? 'bg-orange-600 hover:bg-orange-700' : ''}
            >
              <Target className="w-3 h-3 mr-1" />
              Avg XP
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Global Stats */}
        {!compact && globalStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 pb-4 border-b border-slate-600">
            <div className="text-center">
              <p className="text-xs text-gray-400">Total Users</p>
              <p className="text-lg font-bold text-cyan-400">{globalStats.totalUsers}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Active Users</p>
              <p className="text-lg font-bold text-green-400">{globalStats.totalActiveUsers}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Total XP</p>
              <p className="text-lg font-bold text-purple-400">{globalStats.totalXP?.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Avg/User</p>
              <p className="text-lg font-bold text-orange-400">{globalStats.avgXPPerUser}</p>
            </div>
          </div>
        )}

        {/* Rankings */}
        <div className="space-y-2">
          {rankings.map((squad) => {
            const value = 
              metric === 'xp' ? squad.totalXP :
              metric === 'members' ? squad.totalMembers :
              metric === 'activity' ? squad.activityRate :
              squad.avgXPPerMember;
            
            const percentage = (value / maxValue) * 100;
            const isHighlighted = highlightSquad === squad.squad;

            return (
              <div
                key={squad.squad}
                className={`p-3 rounded-lg transition-all ${
                  isHighlighted
                    ? 'bg-gradient-to-r from-cyan-900/40 to-purple-900/40 border-2 border-cyan-500/50'
                    : squad.rank === 1
                    ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30'
                    : 'bg-slate-700/30 border border-slate-600/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* Rank */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      squad.rank === 1 ? 'bg-yellow-500/20' :
                      squad.rank === 2 ? 'bg-gray-400/20' :
                      squad.rank === 3 ? 'bg-orange-700/20' :
                      'bg-slate-600/30'
                    }`}>
                      {squad.rank <= 3 ? (
                        <Trophy className={`w-4 h-4 ${
                          squad.rank === 1 ? 'text-yellow-400' :
                          squad.rank === 2 ? 'text-gray-300' :
                          'text-orange-400'
                        }`} />
                      ) : (
                        <span className="text-xs font-bold text-gray-400">#{squad.rank}</span>
                      )}
                    </div>

                    {/* Squad Name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{squad.emoji}</span>
                        <span className={`font-semibold truncate ${
                          isHighlighted ? 'text-cyan-300' : 'text-white'
                        }`}>
                          {squad.squad}
                        </span>
                        {isHighlighted && (
                          <Badge className="bg-cyan-600 text-white text-xs">You</Badge>
                        )}
                      </div>
                      
                      {!compact && (
                        <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
                          <span>{squad.totalMembers} members</span>
                          <span>•</span>
                          <span>{squad.activeMembers} active</span>
                          <span>•</span>
                          <span>{squad.activityRate}% rate</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Value */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-purple-400">
                      {metric === 'activity' ? `${value}%` : value.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {metric === 'xp' ? 'Total XP' :
                       metric === 'members' ? 'Members' :
                       metric === 'activity' ? 'Active' :
                       'Avg XP'}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <Progress value={percentage} className="h-2 mt-2" />
              </div>
            );
          })}
        </div>

        {/* Winner Celebration */}
        {topSquad && !compact && (
          <div className="mt-4 pt-4 border-t border-slate-600">
            <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-lg p-4 text-center">
              <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-sm text-gray-300">
                {topSquad.emoji} <span className="font-bold text-yellow-400">{topSquad.squad}</span> leads in {
                  metric === 'xp' ? 'Total XP' :
                  metric === 'members' ? 'Member Count' :
                  metric === 'activity' ? 'Activity Rate' :
                  'Average XP'
                }!
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

