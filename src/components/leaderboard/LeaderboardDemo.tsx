'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  Filter, 
  Trophy, 
  TrendingUp, 
  Users, 
  Target,
  RefreshCw,
  Award,
  Crown,
  Star,
  Zap
} from 'lucide-react';
import { LeaderboardUser, LeaderboardStats } from '@/services/enhanced-leaderboard-service';

// Mock data for demonstration
const mockLeaderboardData: LeaderboardUser[] = [
  {
    walletAddress: '0x1234567890abcdef',
    displayName: '@ChainWitch',
    squad: 'Decoder',
    rank: 1,
    level: 112,
    completion: 93,
    courses: 12,
    quizzes: 9,
    badges: 4,
    lastActive: new Date().toISOString(),
    joinDate: new Date('2024-01-15').toISOString(),
    achievements: [
      {
        id: 'first-course',
        name: 'First Steps',
        description: 'Completed your first course',
        icon: '🎯',
        earnedDate: new Date('2024-01-20').toISOString(),
        points: 100
      },
      {
        id: 'perfect-score',
        name: 'Perfect Score',
        description: 'Achieved 100% on a quiz',
        icon: '⭐',
        earnedDate: new Date('2024-02-01').toISOString(),
        points: 200
      }
    ],
    courseProgress: []
  },
  {
    walletAddress: '0xabcdef1234567890',
    displayName: '@Blob.eth',
    squad: 'Speaker',
    rank: 2,
    level: 108,
    completion: 89,
    courses: 10,
    quizzes: 7,
    badges: 3,
    lastActive: new Date().toISOString(),
    joinDate: new Date('2024-01-10').toISOString(),
    achievements: [
      {
        id: 'first-course',
        name: 'First Steps',
        description: 'Completed your first course',
        icon: '🎯',
        earnedDate: new Date('2024-01-25').toISOString(),
        points: 100
      }
    ],
    courseProgress: []
  },
  {
    walletAddress: '0x7890abcdef123456',
    displayName: '@RhinoRunz',
    squad: 'Raider',
    rank: 3,
    level: 100,
    completion: 80,
    courses: 8,
    quizzes: 6,
    badges: 2,
    lastActive: new Date().toISOString(),
    joinDate: new Date('2024-01-05').toISOString(),
    achievements: [],
    courseProgress: []
  },
  {
    walletAddress: '0x4567890abcdef123',
    displayName: '@CryptoQueen',
    squad: 'Creator',
    rank: 4,
    level: 105,
    completion: 75,
    courses: 6,
    quizzes: 5,
    badges: 1,
    lastActive: new Date().toISOString(),
    joinDate: new Date('2024-01-20').toISOString(),
    achievements: [],
    courseProgress: []
  },
  {
    walletAddress: '0xdef1234567890abc',
    displayName: '@SatoshiFan',
    squad: 'Ranger',
    rank: 5,
    level: 102,
    completion: 68,
    courses: 5,
    quizzes: 4,
    badges: 1,
    lastActive: new Date().toISOString(),
    joinDate: new Date('2024-01-30').toISOString(),
    achievements: [],
    courseProgress: []
  }
];

const mockStats: LeaderboardStats = {
  totalParticipants: 123,
  avgCompletion: 72,
  activeLearners: 47,
  userRank: 15
};

type SortOption = 'completion' | 'courses' | 'quizzes' | 'badges' | 'level';
type SquadFilter = 'all' | 'decoder' | 'creator' | 'speaker' | 'raider' | 'ranger';

export default function LeaderboardDemo() {
  const [users, setUsers] = useState<LeaderboardUser[]>(mockLeaderboardData);
  const [filteredUsers, setFilteredUsers] = useState<LeaderboardUser[]>(mockLeaderboardData);
  const [stats, setStats] = useState<LeaderboardStats>(mockStats);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('completion');
  const [squadFilter, setSquadFilter] = useState<SquadFilter>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.squad.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply squad filter
    if (squadFilter !== 'all') {
      filtered = filtered.filter(user => 
        user.squad.toLowerCase() === squadFilter.toLowerCase()
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'completion':
          return b.completion - a.completion;
        case 'courses':
          return b.courses - a.courses;
        case 'quizzes':
          return b.quizzes - a.quizzes;
        case 'badges':
          return b.badges - a.badges;
        case 'level':
          return b.level - a.level;
        default:
          return b.completion - a.completion;
      }
    });

    // Reassign ranks after filtering and sorting
    filtered = filtered.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    setFilteredUsers(filtered);
  }, [users, searchTerm, sortBy, squadFilter]);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setIsLoading(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getSquadColor = (squad: string) => {
    const colors: Record<string, string> = {
      'decoder': 'text-blue-400',
      'creator': 'text-purple-400',
      'speaker': 'text-green-400',
      'raider': 'text-red-400',
      'ranger': 'text-yellow-400',
      'unassigned': 'text-gray-400'
    };
    return colors[squad.toLowerCase()] || 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-cyan-500/30 p-6 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400 flex items-center gap-2">
              <Trophy className="w-8 h-8" />
              Hoodie Academy Leaderboard
            </h1>
            <p className="text-gray-300">Live rankings based on 100-level course completion and engagement</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Last Updated</div>
            <div className="text-lg text-cyan-400 font-mono">
              {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-slate-800/50 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Users className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Participants</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.totalParticipants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Avg Completion</p>
                <p className="text-2xl font-bold text-purple-400">{stats.avgCompletion}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Zap className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active Learners</p>
                <p className="text-2xl font-bold text-green-400">{stats.activeLearners}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Your Rank</p>
                <p className="text-2xl font-bold text-blue-400">
                  {stats.userRank > 0 ? `#${stats.userRank}` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by name, wallet, or squad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-cyan-500/30 text-white"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={squadFilter} onValueChange={(value: SquadFilter) => setSquadFilter(value)}>
            <SelectTrigger className="w-32 bg-slate-800/50 border-cyan-500/30 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Squads</SelectItem>
              <SelectItem value="decoder">Decoders</SelectItem>
              <SelectItem value="creator">Creators</SelectItem>
              <SelectItem value="speaker">Speakers</SelectItem>
              <SelectItem value="raider">Raiders</SelectItem>
              <SelectItem value="ranger">Rangers</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-32 bg-slate-800/50 border-cyan-500/30 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="completion">% Completion</SelectItem>
              <SelectItem value="courses">Courses</SelectItem>
              <SelectItem value="quizzes">Quizzes</SelectItem>
              <SelectItem value="badges">Badges</SelectItem>
              <SelectItem value="level">Level</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={handleRefresh} 
            disabled={isLoading}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Leaderboard Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mr-3" />
          <span className="text-cyan-400">Loading leaderboard...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="bg-slate-800/50 border-cyan-500/30">
          <CardContent className="p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No Users Found</h3>
            <p className="text-gray-400">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Be the first to join the leaderboard!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="rounded-md border border-cyan-500/30 max-h-[600px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-800/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Squad</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Completion</th>
                <th className="px-4 py-3">Courses</th>
                <th className="px-4 py-3">Quizzes</th>
                <th className="px-4 py-3">Badges</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr 
                  key={user.walletAddress} 
                  className="border-t border-slate-700/50 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-4 py-3 font-bold">
                    <span className="flex items-center gap-2">
                      {getRankIcon(user.rank)}
                      {user.rank <= 3 && (
                        <Crown className={`w-4 h-4 ${
                          user.rank === 1 ? 'text-yellow-400' : 
                          user.rank === 2 ? 'text-gray-400' : 'text-orange-600'
                        }`} />
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-slate-700 text-cyan-400">
                          {user.displayName[1]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-white">{user.displayName}</div>
                        <div className="text-xs text-gray-400">{user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge 
                      variant="outline" 
                      className={`${getSquadColor(user.squad)} border-current`}
                    >
                      {user.squad}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="font-medium">{user.level}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-cyan-400 to-purple-400 h-2 rounded-full transition-all"
                          style={{ width: `${user.completion}%` }}
                        />
                      </div>
                      <span className="font-medium">{user.completion}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{user.courses}</td>
                  <td className="px-4 py-3 font-medium">{user.quizzes}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4 text-yellow-400" />
                      <span className="font-medium">{user.badges}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      )}
    </div>
  );
} 