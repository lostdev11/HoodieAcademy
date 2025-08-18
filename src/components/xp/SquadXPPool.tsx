'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Trophy, TrendingUp, Crown, Medal } from 'lucide-react';

type SquadXPData = {
  name: string;
  xp: number;
  color: string; // e.g. "bg-red-500"
  memberCount?: number; // optional: number of squad members
  rank?: number; // optional: squad rank
  icon?: string; // optional: squad icon/emoji
};

type SquadXPPoolProps = {
  squads: SquadXPData[];
  showDetails?: boolean; // optional: show detailed breakdown
  className?: string;
  title?: string; // optional: custom title
};

export const SquadXPPool = ({ 
  squads, 
  showDetails = true, 
  className = '',
  title = "👥 Squad XP Pool"
}: SquadXPPoolProps) => {
  const maxXP = Math.max(...squads.map(s => s.xp));
  const totalXP = squads.reduce((sum, squad) => sum + squad.xp, 0);
  
  // Sort squads by XP (highest first)
  const sortedSquads = [...squads].sort((a, b) => b.xp - a.xp);

  return (
    <Card className={`bg-gray-900 border border-indigo-600/30 rounded-xl shadow-xl ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-lg">
          <Users className="w-5 h-5 text-indigo-400" />
          {title}
        </CardTitle>
        {showDetails && (
          <div className="text-sm text-gray-400">
            Total Pool: {totalXP.toLocaleString()} XP
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showDetails ? (
          <>
            {/* Squad Rankings */}
            <div className="space-y-3">
              {sortedSquads.map((squad, index) => {
                const width = `${(squad.xp / maxXP) * 100}%`;
                const percentage = ((squad.xp / totalXP) * 100).toFixed(1);
                
                return (
                  <div key={squad.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Crown className="w-4 h-4 text-yellow-400" />}
                        {index === 1 && <Medal className="w-4 h-4 text-gray-400" />}
                        {index === 2 && <Medal className="w-4 h-4 text-orange-400" />}
                        {index > 2 && (
                          <div className="w-4 h-4 flex items-center justify-center">
                            <span className="text-xs text-gray-500">#{index + 1}</span>
                          </div>
                        )}
                        <span className="text-white font-medium">{squad.name}</span>
                        {squad.icon && <span className="text-lg">{squad.icon}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{squad.xp.toLocaleString()} XP</span>
                        <Badge variant="secondary" className="bg-gray-500/20 text-gray-400 text-xs">
                          {percentage}%
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="bg-gray-700 h-3 rounded-full overflow-hidden">
                        <div 
                          className={`${squad.color} h-3 rounded-full transition-all duration-300`} 
                          style={{ width }}
                        />
                      </div>
                      {squad.memberCount && (
                        <div className="absolute -top-6 right-0 text-xs text-gray-400">
                          {squad.memberCount} members
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Squad Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {sortedSquads[0]?.name || 'N/A'}
                </div>
                <div className="text-xs text-gray-400">Leading Squad</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-400">
                  {((sortedSquads[0]?.xp / totalXP) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-400">Market Share</div>
              </div>
            </div>
          </>
        ) : (
          // Compact version for sidebars/dashboards
          <div className="space-y-3">
            {sortedSquads.slice(0, 3).map((squad, index) => {
              const width = `${(squad.xp / maxXP) * 100}%`;
              
              return (
                <div key={squad.name} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-1">
                      {index === 0 && <Crown className="w-3 h-3 text-yellow-400" />}
                      <span className="text-white">{squad.name}</span>
                    </div>
                    <span className="text-gray-400">{squad.xp.toLocaleString()}</span>
                  </div>
                  <div className="bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`${squad.color} h-1.5 rounded-full`} 
                      style={{ width }}
                    />
                  </div>
                </div>
              );
            })}
            
            {squads.length > 3 && (
              <div className="text-xs text-gray-400 text-center">
                +{squads.length - 3} more squads
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Compact variant for leaderboards
export const SquadXPPoolCompact = ({ 
  squads, 
  className = '' 
}: {
  squads: SquadXPData[];
  className?: string;
}) => {
  const sortedSquads = [...squads].sort((a, b) => b.xp - a.xp);
  const maxXP = Math.max(...squads.map(s => s.xp));

  return (
    <div className={`bg-gray-800/50 border border-gray-700 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-indigo-400" />
        <span className="text-white font-medium text-sm">Squad XP Pool</span>
      </div>
      
      <div className="space-y-2">
        {sortedSquads.slice(0, 4).map((squad, index) => {
          const width = `${(squad.xp / maxXP) * 100}%`;
          
          return (
            <div key={squad.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-600 flex items-center justify-center">
                <span className="text-xs text-gray-300">{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white truncate">{squad.name}</span>
                  <span className="text-gray-400">{squad.xp.toLocaleString()}</span>
                </div>
                <div className="bg-gray-700 h-1 rounded-full overflow-hidden mt-1">
                  <div 
                    className={`${squad.color} h-1 rounded-full`} 
                    style={{ width }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 