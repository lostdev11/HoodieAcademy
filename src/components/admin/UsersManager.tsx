'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Search, Filter, Eye, Edit, RefreshCw, 
  Calendar, User, Target, ChevronLeft, ChevronRight,
  MoreVertical, Download, Award, BookOpen, Trophy, 
  TrendingUp, Star, CheckCircle, Clock, XCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface UserProfile {
  id: string;
  wallet_address: string;
  username?: string;
  squad?: string;
  xp_total: number;
  level: number;
  courses_completed: number;
  bounties_submitted: number;
  bounties_won: number;
  created_at: string;
  last_active: string;
  profile_picture?: string;
  bio?: string;
  badges?: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    earned_at: string;
  }>;
  course_completions?: Array<{
    course_id: string;
    course_title: string;
    completed_at: string;
    xp_earned: number;
  }>;
  bounty_submissions?: Array<{
    id: string;
    bounty_id: string;
    bounty_title: string;
    status: 'pending' | 'approved' | 'rejected';
    submitted_at: string;
    xp_awarded: number;
  }>;
}

interface UsersManagerProps {
  walletAddress?: string;
}

export function UsersManager({ walletAddress }: UsersManagerProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [squadFilter, setSquadFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('xp_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  const itemsPerPage = 10;

  // Fetch users with comprehensive data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get users with XP data
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          wallet_address,
          username,
          squad,
          xp_total,
          level,
          created_at,
          last_active,
          profile_picture,
          bio
        `)
        .order('xp_total', { ascending: false });

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return;
      }

      // Get course completions for each user
      const { data: courseCompletions, error: courseError } = await supabase
        .from('course_completions')
        .select(`
          user_id,
          course_id,
          completed_at,
          xp_earned,
          courses:course_id (
            title
          )
        `);

      if (courseError) {
        console.error('Error fetching course completions:', courseError);
      }

      // Get bounty submissions for each user
      const { data: bountySubmissions, error: bountyError } = await supabase
        .from('bounty_submissions')
        .select(`
          id,
          wallet_address,
          bounty_id,
          status,
          xp_awarded,
          created_at,
          bounties:bounty_id (
            title
          )
        `);

      if (bountyError) {
        console.error('Error fetching bounty submissions:', bountyError);
      }

      // Get badges for each user
      const { data: badges, error: badgesError } = await supabase
        .from('badges')
        .select(`
          wallet_address,
          badge_id,
          name,
          description,
          icon,
          earned_at
        `);

      if (badgesError) {
        console.error('Error fetching badges:', badgesError);
      }

      // Combine all data
      const enrichedUsers = usersData?.map((user: any) => {
        const userCourseCompletions = courseCompletions?.filter((cc: any) => cc.user_id === user.id) || [];
        const userBountySubmissions = bountySubmissions?.filter((bs: any) => bs.wallet_address === user.wallet_address) || [];
        const userBadges = badges?.filter((b: any) => b.wallet_address === user.wallet_address) || [];

        return {
          ...user,
          courses_completed: userCourseCompletions.length,
          bounties_submitted: userBountySubmissions.length,
          bounties_won: userBountySubmissions.filter((bs: any) => bs.status === 'approved').length,
          course_completions: userCourseCompletions.map((cc: any) => ({
            course_id: cc.course_id,
            course_title: cc.courses?.title || 'Unknown Course',
            completed_at: cc.completed_at,
            xp_earned: cc.xp_earned
          })),
          bounty_submissions: userBountySubmissions.map((bs: any) => ({
            id: bs.id,
            bounty_id: bs.bounty_id,
            bounty_title: bs.bounties?.title || 'Unknown Bounty',
            status: bs.status,
            submitted_at: bs.created_at,
            xp_awarded: bs.xp_awarded
          })),
          badges: userBadges.map((b: any) => ({
            id: b.badge_id,
            name: b.name,
            description: b.description,
            icon: b.icon,
            earned_at: b.earned_at
          }))
        };
      }) || [];

      setUsers(enrichedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter and search users
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.wallet_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.squad?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Squad filter
    if (squadFilter !== 'all') {
      filtered = filtered.filter(user => user.squad === squadFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'xp_desc':
          return b.xp_total - a.xp_total;
        case 'xp_asc':
          return a.xp_total - b.xp_total;
        case 'level_desc':
          return b.level - a.level;
        case 'level_asc':
          return a.level - b.level;
        case 'courses_desc':
          return b.courses_completed - a.courses_completed;
        case 'courses_asc':
          return a.courses_completed - b.courses_completed;
        case 'bounties_desc':
          return b.bounties_submitted - a.bounties_submitted;
        case 'bounties_asc':
          return a.bounties_submitted - b.bounties_submitted;
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, searchTerm, squadFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Get unique squads for filter
  const uniqueSquads = Array.from(new Set(users.map(u => u.squad).filter(Boolean))) as string[];

  // Calculate statistics
  const stats = {
    total: users.length,
    totalXP: users.reduce((sum, user) => sum + user.xp_total, 0),
    avgLevel: users.length > 0 ? Math.round(users.reduce((sum, user) => sum + user.level, 0) / users.length) : 0,
    totalCourses: users.reduce((sum, user) => sum + user.courses_completed, 0),
    totalBounties: users.reduce((sum, user) => sum + user.bounties_submitted, 0),
  };

  // Export users to CSV
  const handleExport = async () => {
    try {
      setExportLoading(true);
      const csvData = filteredUsers.map(user => ({
        'Wallet Address': user.wallet_address,
        'Username': user.username || 'No Username',
        'Squad': user.squad || 'No Squad',
        'XP Total': user.xp_total,
        'Level': user.level,
        'Courses Completed': user.courses_completed,
        'Bounties Submitted': user.bounties_submitted,
        'Bounties Won': user.bounties_won,
        'Badges': user.badges?.length || 0,
        'Created At': new Date(user.created_at).toLocaleString(),
        'Last Active': new Date(user.last_active).toLocaleString(),
      }));

      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting users:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 50) return 'text-purple-500';
    if (level >= 25) return 'text-blue-500';
    if (level >= 10) return 'text-green-500';
    if (level >= 5) return 'text-yellow-500';
    return 'text-gray-500';
  };

  const getSquadColor = (squad?: string) => {
    switch (squad) {
      case 'hoodie-creators': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'hoodie-decoders': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'hoodie-speakers': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'hoodie-raiders': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'hoodie-rangers': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50">
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
          <span className="ml-2 text-slate-400">Loading users...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-slate-800/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <CardTitle>User Management</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleExport} 
                variant="outline" 
                size="sm"
                disabled={exportLoading || filteredUsers.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                {exportLoading ? 'Exporting...' : 'Export CSV'}
              </Button>
              <Button onClick={fetchUsers} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            Manage academy users, view their progress, and track their activity.
          </p>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Total XP</p>
                <p className="text-2xl font-bold text-white">{stats.totalXP.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Avg Level</p>
                <p className="text-2xl font-bold text-white">{stats.avgLevel}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Courses</p>
                <p className="text-2xl font-bold text-white">{stats.totalCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Bounties</p>
                <p className="text-2xl font-bold text-white">{stats.totalBounties}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-slate-800/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={squadFilter} onValueChange={setSquadFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by squad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Squads</SelectItem>
                {uniqueSquads.map(squad => (
                  <SelectItem key={squad} value={squad}>{squad}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xp_desc">XP (High to Low)</SelectItem>
                <SelectItem value="xp_asc">XP (Low to High)</SelectItem>
                <SelectItem value="level_desc">Level (High to Low)</SelectItem>
                <SelectItem value="level_asc">Level (Low to High)</SelectItem>
                <SelectItem value="courses_desc">Courses (High to Low)</SelectItem>
                <SelectItem value="courses_asc">Courses (Low to High)</SelectItem>
                <SelectItem value="bounties_desc">Bounties (High to Low)</SelectItem>
                <SelectItem value="bounties_asc">Bounties (Low to High)</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-slate-400 flex items-center">
              Showing {filteredUsers.length} users
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="bg-slate-800/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Users ({filteredUsers.length})
            </CardTitle>
            <div className="text-sm text-slate-400">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {currentUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-slate-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-300 mb-2">No Users Found</h3>
              <p className="text-slate-500">
                {searchTerm || squadFilter !== 'all'
                  ? 'No users match your current filters.'
                  : 'No users have joined the academy yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentUsers.map((user) => (
                <div key={user.id} className="border border-slate-700 rounded-lg p-4 hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center">
                          {user.profile_picture ? (
                            <img 
                              src={user.profile_picture} 
                              alt={user.username || 'User'} 
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {user.username || 'Anonymous User'}
                          </h3>
                          <p className="text-sm text-slate-400 font-mono">
                            {user.wallet_address.slice(0, 8)}...{user.wallet_address.slice(-6)}
                          </p>
                        </div>
                        {user.squad && (
                          <Badge className={getSquadColor(user.squad)}>
                            {user.squad.replace('hoodie-', '').replace('-', ' ')}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getLevelColor(user.level)}`}>
                            {user.xp_total.toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-400">XP Total</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">
                            Level {user.level}
                          </div>
                          <div className="text-xs text-slate-400">Level</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">
                            {user.courses_completed}
                          </div>
                          <div className="text-xs text-slate-400">Courses</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">
                            {user.bounties_submitted}
                          </div>
                          <div className="text-xs text-slate-400">Bounties</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Last active {new Date(user.last_active).toLocaleDateString()}</span>
                        </div>
                        {user.badges && user.badges.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            <span>{user.badges.length} badges</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Dialog open={isDetailModalOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                        if (open) {
                          setSelectedUser(user);
                          setIsDetailModalOpen(true);
                        } else {
                          setIsDetailModalOpen(false);
                          setSelectedUser(null);
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <User className="w-5 h-5" />
                              {user.username || 'Anonymous User'}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6">
                            {/* User Profile */}
                            <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg">
                              <div className="w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center">
                                {user.profile_picture ? (
                                  <img 
                                    src={user.profile_picture} 
                                    alt={user.username || 'User'} 
                                    className="w-16 h-16 rounded-full object-cover"
                                  />
                                ) : (
                                  <User className="w-8 h-8 text-slate-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold">
                                  {user.username || 'Anonymous User'}
                                </h3>
                                <p className="text-slate-400 font-mono text-sm">
                                  {user.wallet_address}
                                </p>
                                {user.squad && (
                                  <Badge className={`mt-2 ${getSquadColor(user.squad)}`}>
                                    {user.squad.replace('hoodie-', '').replace('-', ' ')}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right">
                                <div className={`text-3xl font-bold ${getLevelColor(user.level)}`}>
                                  {user.xp_total.toLocaleString()}
                                </div>
                                <div className="text-sm text-slate-400">XP Total</div>
                                <div className="text-lg font-semibold text-white">
                                  Level {user.level}
                                </div>
                              </div>
                            </div>

                            {/* Detailed Stats */}
                            <Tabs defaultValue="overview" className="w-full">
                              <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="courses">Courses</TabsTrigger>
                                <TabsTrigger value="bounties">Bounties</TabsTrigger>
                                <TabsTrigger value="badges">Badges</TabsTrigger>
                              </TabsList>

                              <TabsContent value="overview" className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                                    <div className="text-2xl font-bold text-white">
                                      {user.courses_completed}
                                    </div>
                                    <div className="text-sm text-slate-400">Courses Completed</div>
                                  </div>
                                  <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                                    <div className="text-2xl font-bold text-white">
                                      {user.bounties_submitted}
                                    </div>
                                    <div className="text-sm text-slate-400">Bounties Submitted</div>
                                  </div>
                                  <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                                    <div className="text-2xl font-bold text-white">
                                      {user.bounties_won}
                                    </div>
                                    <div className="text-sm text-slate-400">Bounties Won</div>
                                  </div>
                                  <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                                    <div className="text-2xl font-bold text-white">
                                      {user.badges?.length || 0}
                                    </div>
                                    <div className="text-sm text-slate-400">Badges Earned</div>
                                  </div>
                                </div>
                                {user.bio && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Bio</h4>
                                    <p className="text-sm text-slate-300">{user.bio}</p>
                                  </div>
                                )}
                              </TabsContent>

                              <TabsContent value="courses" className="space-y-4">
                                {user.course_completions && user.course_completions.length > 0 ? (
                                  <div className="space-y-2">
                                    {user.course_completions.map((completion, index) => (
                                      <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                                        <div>
                                          <div className="font-medium">{completion.course_title}</div>
                                          <div className="text-sm text-slate-400">
                                            Completed {new Date(completion.completed_at).toLocaleDateString()}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-sm font-medium text-green-400">
                                            +{completion.xp_earned} XP
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-slate-400">
                                    No courses completed yet
                                  </div>
                                )}
                              </TabsContent>

                              <TabsContent value="bounties" className="space-y-4">
                                {user.bounty_submissions && user.bounty_submissions.length > 0 ? (
                                  <div className="space-y-2">
                                    {user.bounty_submissions.map((submission) => (
                                      <div key={submission.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                                        <div>
                                          <div className="font-medium">{submission.bounty_title}</div>
                                          <div className="text-sm text-slate-400">
                                            Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <Badge variant={
                                            submission.status === 'approved' ? 'default' :
                                            submission.status === 'rejected' ? 'destructive' : 'secondary'
                                          }>
                                            {submission.status}
                                          </Badge>
                                          {submission.xp_awarded > 0 && (
                                            <div className="text-sm font-medium text-green-400 mt-1">
                                              +{submission.xp_awarded} XP
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-slate-400">
                                    No bounty submissions yet
                                  </div>
                                )}
                              </TabsContent>

                              <TabsContent value="badges" className="space-y-4">
                                {user.badges && user.badges.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {user.badges.map((badge) => (
                                      <div key={badge.id} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                                        <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                                          <Award className="w-5 h-5 text-yellow-500" />
                                        </div>
                                        <div>
                                          <div className="font-medium">{badge.name}</div>
                                          <div className="text-sm text-slate-400">{badge.description}</div>
                                          <div className="text-xs text-slate-500">
                                            Earned {new Date(badge.earned_at).toLocaleDateString()}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-slate-400">
                                    No badges earned yet
                                  </div>
                                )}
                              </TabsContent>
                            </Tabs>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem className="text-blue-600">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-green-600">
                            <Award className="w-4 h-4 mr-2" />
                            Award XP
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-purple-600">
                            <Trophy className="w-4 h-4 mr-2" />
                            Award Badge
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-slate-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
