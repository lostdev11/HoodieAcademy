'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Users, Trophy, Clock, Lock, TrendingUp } from 'lucide-react';
import { useSquadMembers } from '@/hooks/useSquadTracking';

interface SquadMembersListProps {
  squadName: string;
  compact?: boolean;
  maxHeight?: string;
}

export default function SquadMembersList({ 
  squadName, 
  compact = false,
  maxHeight = '400px' 
}: SquadMembersListProps) {
  const { members, stats, loading, error } = useSquadMembers(squadName);

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-cyan-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2 text-gray-400">
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading squad members...</span>
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

  if (!members || members.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-500/30">
        <CardContent className="p-6">
          <p className="text-gray-400 text-center">No members found in this squad</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-cyan-500/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400">{squadName} Members</span>
          </div>
          <Badge variant="outline" className="text-cyan-400 border-cyan-500/30">
            {stats?.totalMembers || 0} Total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Squad Stats Summary */}
        {!compact && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 pb-4 border-b border-slate-600">
            <div className="text-center">
              <p className="text-xs text-gray-400">Active</p>
              <p className="text-lg font-bold text-green-400">{stats.activeMembers}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Total XP</p>
              <p className="text-lg font-bold text-purple-400">{stats.totalSquadXP.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Avg XP</p>
              <p className="text-lg font-bold text-cyan-400">{stats.avgXPPerMember}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Locked</p>
              <p className="text-lg font-bold text-orange-400">{stats.lockedMembers}</p>
            </div>
          </div>
        )}

        {/* Members List */}
        <ScrollArea className={`${compact ? 'h-48' : ''}`} style={{ maxHeight }}>
          <div className="space-y-2">
            {members.map((member, index) => (
              <div
                key={member.walletAddress}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0 
                    ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30' 
                    : 'bg-slate-700/30 hover:bg-slate-700/50'
                } transition-colors`}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {/* Rank Badge */}
                  {index < 3 && (
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      index === 1 ? 'bg-gray-400/20 text-gray-300' :
                      'bg-orange-700/20 text-orange-400'
                    }`}>
                      <Trophy className="w-4 h-4" />
                    </div>
                  )}
                  {index >= 3 && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-600/30 flex items-center justify-center text-gray-400 text-xs font-bold">
                      #{index + 1}
                    </div>
                  )}

                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{member.displayName}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <span className="font-mono">{member.walletAddress.slice(0, 4)}...{member.walletAddress.slice(-4)}</span>
                      {member.squadLocked && (
                        <Badge variant="outline" className="text-xs border-orange-500/30 text-orange-400">
                          <Lock className="w-3 h-3 mr-1" />
                          {member.daysUntilUnlock}d
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3 text-purple-400" />
                      <span className="text-sm font-bold text-purple-400">{member.totalXP.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-400">Level {member.level}</p>
                  </div>
                  
                  {!compact && (
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span className="text-xs text-cyan-400">{member.daysInSquad}d</span>
                      </div>
                      <p className="text-xs text-gray-400">in squad</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Top Contributor Highlight */}
        {!compact && stats?.topContributor && (
          <div className="mt-4 pt-4 border-t border-slate-600">
            <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-xs text-gray-400">Top Contributor</p>
                    <p className="font-semibold text-yellow-400">{stats.topContributor.displayName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-yellow-400">{stats.topContributor.totalXP.toLocaleString()} XP</p>
                  <p className="text-xs text-gray-400">Level {stats.topContributor.level}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

