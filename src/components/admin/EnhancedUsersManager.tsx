'use client';

import { useState, useEffect, useCallback } from 'react';
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
  TrendingUp, Star, CheckCircle, Clock, XCircle, FileText,
  ExternalLink, Zap, Crown, Shield, Activity
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";

interface UserSubmission {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  bounty_id?: string;
  created_at: string;
  updated_at: string;
  bounty?: {
    id: string;
    title: string;
    description: string;
    xp_reward: number;
  };
}

interface UserActivity {
  activity_type: string;
  activity_data: any;
  created_at: string;
}

interface EnhancedUser {
  id: string;
  wallet_address: string;
  display_name?: string;
  username?: string;
  squad?: string;
  total_xp: number;
  level: number;
  profile_picture?: string;
  bio?: string;
  created_at: string;
  last_active: string;
  updated_at: string;
  submissions: UserSubmission[];
  submissionStats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  recentActivity: UserActivity[];
  connectionData: {
    firstConnection: string | null;
    lastConnection: string | null;
    totalConnections: number;
    hasVerifiedNFT: boolean;
    connectionHistory: any[];
  };
  displayName: string;
  formattedWallet: string;
  lastActiveFormatted: string;
  joinedFormatted: string;
  firstConnectionFormatted: string;
  lastConnectionFormatted: string;
}

interface EnhancedUsersManagerProps {
  walletAddress?: string;
  onViewUserSubmissions?: (user: EnhancedUser) => void;
}

export function EnhancedUsersManager({ walletAddress, onViewUserSubmissions }: EnhancedUsersManagerProps) {
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<EnhancedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [squadFilter, setSquadFilter] = useState<string>('all');
  const [connectionFilter, setConnectionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('xp_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<EnhancedUser | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<EnhancedUser | null>(null);
  const [editForm, setEditForm] = useState({
    display_name: '',
    username: '',
    squad: '',
    bio: '',
    level: 0,
    total_xp: 0
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [stats, setStats] = useState<any>({});
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(120000); // 2 minutes for users
  
  const itemsPerPage = 10;

  // Fetch users with comprehensive data
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const url = walletAddress ? `/api/admin/users?wallet=${walletAddress}` : '/api/admin/users';
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('Failed to fetch users:', response.status, response.statusText);
        setUsers([]);
        return;
      }

      const data = await response.json();
      console.log('Fetched users for admin:', data);
      setUsers(Array.isArray(data.users) ? data.users : []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  // Save user data
  const handleSaveUser = async () => {
    if (!editingUser || !walletAddress) return;

    setSaveLoading(true);
    try {
      const response = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: walletAddress,
          targetWallet: editingUser.wallet_address,
          updates: editForm
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      // Refresh users data
      await fetchUsers();
      
      // Close edit modal
      setIsEditModalOpen(false);
      setEditingUser(null);
      setEditForm({
        display_name: '',
        username: '',
        squad: '',
        bio: '',
        level: 0,
        total_xp: 0
      });

    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (user: EnhancedUser) => {
    if (!walletAddress) return;

    const confirmDelete = confirm(
      `Are you sure you want to delete user ${user.displayName}?\n\n` +
      `This will permanently remove:\n` +
      `- User profile and data\n` +
      `- All submissions and activity\n` +
      `- XP and progress\n\n` +
      `This action cannot be undone!`
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_wallet: walletAddress,
          target_wallet: user.wallet_address
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Error: ${data.error || 'Failed to delete user'}`);
        return;
      }

      alert(`User ${user.displayName} has been deleted successfully`);
      
      // Refresh users data
      await fetchUsers();

    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  // Open edit modal
  const handleEditUser = (user: EnhancedUser) => {
    setEditingUser(user);
    setEditForm({
      display_name: user.display_name || '',
      username: user.username || '',
      squad: user.squad || '',
      bio: user.bio || '',
      level: user.level || 0,
      total_xp: user.total_xp || 0
    });
    setIsEditModalOpen(true);
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !walletAddress) return;

    console.log('Setting up auto-refresh for enhanced users with interval:', refreshInterval);
    const interval = setInterval(() => {
      console.log('Auto-refreshing enhanced users...');
      fetchUsers();
    }, refreshInterval);

    return () => {
      console.log('Clearing enhanced users auto-refresh interval');
      clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, fetchUsers]);

  // Filter and search users
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.wallet_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.squad?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Squad filter
    if (squadFilter !== 'all') {
      filtered = filtered.filter(user => user.squad === squadFilter);
    }

    // Connection filter
    if (connectionFilter !== 'all') {
      switch (connectionFilter) {
        case 'verified':
          filtered = filtered.filter(user => user.connectionData.hasVerifiedNFT);
          break;
        case 'unverified':
          filtered = filtered.filter(user => !user.connectionData.hasVerifiedNFT);
          break;
        case 'active':
          filtered = filtered.filter(user => user.connectionData.totalConnections > 0);
          break;
        case 'inactive':
          filtered = filtered.filter(user => user.connectionData.totalConnections === 0);
          break;
        case 'frequent':
          filtered = filtered.filter(user => user.connectionData.totalConnections >= 5);
          break;
      }
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'xp_desc':
          return b.total_xp - a.total_xp;
        case 'xp_asc':
          return a.total_xp - b.total_xp;
        case 'level_desc':
          return b.level - a.level;
        case 'level_asc':
          return a.level - b.level;
        case 'submissions_desc':
          return b.submissionStats.total - a.submissionStats.total;
        case 'submissions_asc':
          return a.submissionStats.total - b.submissionStats.total;
        case 'pending_desc':
          return b.submissionStats.pending - a.submissionStats.pending;
        case 'pending_asc':
          return a.submissionStats.pending - b.submissionStats.pending;
        case 'connections_desc':
          return b.connectionData.totalConnections - a.connectionData.totalConnections;
        case 'connections_asc':
          return a.connectionData.totalConnections - b.connectionData.totalConnections;
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
  }, [users, searchTerm, squadFilter, connectionFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Get unique squads for filter
  const uniqueSquads = Array.from(new Set(users.map(u => u.squad).filter(Boolean))) as string[];

  // Export users to CSV
  const handleExport = async () => {
    try {
      setExportLoading(true);
      const csvData = filteredUsers.map(user => ({
        'Wallet Address': user.wallet_address,
        'Display Name': user.displayName,
        'Squad': user.squad || 'No Squad',
        'XP Total': user.total_xp,
        'Level': user.level,
        'Total Submissions': user.submissionStats.total,
        'Pending Submissions': user.submissionStats.pending,
        'Approved Submissions': user.submissionStats.approved,
        'Rejected Submissions': user.submissionStats.rejected,
        'Total Connections': user.connectionData.totalConnections,
        'Has Verified NFT': user.connectionData.hasVerifiedNFT ? 'Yes' : 'No',
        'First Connection': user.firstConnectionFormatted,
        'Last Connection': user.lastConnectionFormatted,
        'Joined': user.joinedFormatted,
        'Last Active': user.lastActiveFormatted,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleViewUserSubmissions = (user: EnhancedUser) => {
    if (onViewUserSubmissions) {
      onViewUserSubmissions(user);
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
            <div className="flex gap-2 items-center">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-slate-400">Auto-refresh:</label>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-sm"
                  disabled={!autoRefresh}
                >
                  <option value={60000}>1m</option>
                  <option value={120000}>2m</option>
                  <option value={300000}>5m</option>
                  <option value={600000}>10m</option>
                </select>
                <Button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  variant={autoRefresh ? "default" : "outline"}
                  size="sm"
                  className={autoRefresh ? "bg-green-600 hover:bg-green-700" : "border-slate-600 text-slate-300"}
                >
                  {autoRefresh ? "ON" : "OFF"}
                </Button>
                {autoRefresh && (
                  <div className="flex items-center space-x-1 text-green-400 text-xs">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Live</span>
                  </div>
                )}
              </div>
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
            Manage academy users, view their submissions, and track their activity.
          </p>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <Card className="bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers || 0}</p>
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
                <p className="text-2xl font-bold text-white">{(stats.totalXP || 0).toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-white">{stats.avgLevel || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Total Submissions</p>
                <p className="text-2xl font-bold text-white">{stats.totalSubmissions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Pending</p>
                <p className="text-2xl font-bold text-white">{stats.pendingSubmissions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-cyan-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Total Connections</p>
                <p className="text-2xl font-bold text-white">{stats.totalConnections || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-emerald-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Verified NFTs</p>
                <p className="text-2xl font-bold text-white">{stats.usersWithVerifiedNFTs || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-indigo-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Active Users</p>
                <p className="text-2xl font-bold text-white">{stats.activeUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-slate-800/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

            <Select value={connectionFilter} onValueChange={setConnectionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by connection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="verified">Verified NFTs</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
                <SelectItem value="active">Active Users</SelectItem>
                <SelectItem value="inactive">Inactive Users</SelectItem>
                <SelectItem value="frequent">Frequent Connectors</SelectItem>
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
                <SelectItem value="submissions_desc">Submissions (High to Low)</SelectItem>
                <SelectItem value="submissions_asc">Submissions (Low to High)</SelectItem>
                <SelectItem value="pending_desc">Pending (High to Low)</SelectItem>
                <SelectItem value="pending_asc">Pending (Low to High)</SelectItem>
                <SelectItem value="connections_desc">Connections (High to Low)</SelectItem>
                <SelectItem value="connections_asc">Connections (Low to High)</SelectItem>
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
                              alt={user.displayName} 
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {user.displayName}
                          </h3>
                          <p className="text-sm text-slate-400 font-mono">
                            {user.formattedWallet}
                          </p>
                        </div>
                        {user.squad && (
                          <Badge className={getSquadColor(user.squad)}>
                            {user.squad.replace('hoodie-', '').replace('-', ' ')}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getLevelColor(user.level)}`}>
                            {user.total_xp.toLocaleString()}
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
                            {user.submissionStats.total}
                          </div>
                          <div className="text-xs text-slate-400">Submissions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-400">
                            {user.submissionStats.pending}
                          </div>
                          <div className="text-xs text-slate-400">Pending</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">
                            {user.submissionStats.approved}
                          </div>
                          <div className="text-xs text-slate-400">Approved</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Joined {user.joinedFormatted}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Last active {user.lastActiveFormatted}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          <span>{user.connectionData.totalConnections} connections</span>
                        </div>
                        {user.connectionData.hasVerifiedNFT && (
                          <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Verified NFT</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        onClick={() => handleViewUserSubmissions(user)}
                        size="sm"
                        variant="outline"
                        className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        View Submissions
                      </Button>
                      
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
                              {user.displayName}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6">
                            {/* User Profile */}
                            <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg">
                              <div className="w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center">
                                {user.profile_picture ? (
                                  <img 
                                    src={user.profile_picture} 
                                    alt={user.displayName} 
                                    className="w-16 h-16 rounded-full object-cover"
                                  />
                                ) : (
                                  <User className="w-8 h-8 text-slate-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold">
                                  {user.displayName}
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
                                  {user.total_xp.toLocaleString()}
                                </div>
                                <div className="text-sm text-slate-400">XP Total</div>
                                <div className="text-lg font-semibold text-white">
                                  Level {user.level}
                                </div>
                              </div>
                            </div>

                            {/* Submissions */}
                            <Tabs defaultValue="submissions" className="w-full">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="submissions">Submissions</TabsTrigger>
                                <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                                <TabsTrigger value="connections">Connections</TabsTrigger>
                              </TabsList>

                              <TabsContent value="submissions" className="space-y-4">
                                {user.submissions && user.submissions.length > 0 ? (
                                  <div className="space-y-2">
                                    {user.submissions.map((submission) => (
                                      <div key={submission.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                                        <div>
                                          <div className="font-medium">{submission.title}</div>
                                          <div className="text-sm text-slate-400">
                                            {submission.bounty?.title || 'No Bounty'} • 
                                            Submitted {new Date(submission.created_at).toLocaleDateString()}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <Badge className={getStatusColor(submission.status)}>
                                            {submission.status}
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-slate-400">
                                    No submissions yet
                                  </div>
                                )}
                              </TabsContent>

                              <TabsContent value="activity" className="space-y-4">
                                {user.recentActivity && user.recentActivity.length > 0 ? (
                                  <div className="space-y-2">
                                    {user.recentActivity.map((activity, index) => (
                                      <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                                        <div>
                                          <div className="font-medium">{activity.activity_type.replace(/_/g, ' ')}</div>
                                          <div className="text-sm text-slate-400">
                                            {new Date(activity.created_at).toLocaleDateString()}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-slate-400">
                                    No recent activity
                                  </div>
                                )}
                              </TabsContent>

                              <TabsContent value="connections" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div className="p-4 bg-slate-700/50 rounded-lg">
                                    <div className="text-sm text-slate-400">Total Connections</div>
                                    <div className="text-2xl font-bold text-white">{user.connectionData.totalConnections}</div>
                                  </div>
                                  <div className="p-4 bg-slate-700/50 rounded-lg">
                                    <div className="text-sm text-slate-400">First Connection</div>
                                    <div className="text-lg font-semibold text-white">{user.firstConnectionFormatted}</div>
                                  </div>
                                  <div className="p-4 bg-slate-700/50 rounded-lg">
                                    <div className="text-sm text-slate-400">Last Connection</div>
                                    <div className="text-lg font-semibold text-white">{user.lastConnectionFormatted}</div>
                                  </div>
                                  <div className="p-4 bg-slate-700/50 rounded-lg">
                                    <div className="text-sm text-slate-400">NFT Verification</div>
                                    <div className="text-lg font-semibold text-white">
                                      {user.connectionData.hasVerifiedNFT ? (
                                        <span className="text-emerald-400">Verified</span>
                                      ) : (
                                        <span className="text-slate-400">Not Verified</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {user.connectionData.connectionHistory && user.connectionData.connectionHistory.length > 0 ? (
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-white mb-3">Connection History</h4>
                                    {user.connectionData.connectionHistory.map((connection, index) => (
                                      <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                                        <div>
                                          <div className="font-medium capitalize">{connection.connection_type.replace(/_/g, ' ')}</div>
                                          <div className="text-sm text-slate-400">
                                            {new Date(connection.session_data?.timestamp || '').toLocaleString()}
                                          </div>
                                          {connection.verification_result && (
                                            <div className="text-xs text-slate-500 mt-1">
                                              {connection.verification_result.provider && `Provider: ${connection.verification_result.provider}`}
                                            </div>
                                          )}
                                        </div>
                                        <Badge className={
                                          connection.connection_type === 'connect' 
                                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                                        }>
                                          {connection.connection_type}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-slate-400">
                                    No connection history available
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
                          <DropdownMenuItem 
                            className="text-blue-600"
                            onClick={() => handleEditUser(user)}
                          >
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
                          <DropdownMenuItem 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Delete User
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

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-600 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit User Profile
            </DialogTitle>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Display Name</Label>
                  <Input
                    id="display_name"
                    value={editForm.display_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Enter display name"
                  />
                </div>
                
                <div>
                  <Label className="text-white">Username</Label>
                  <Input
                    id="username"
                    value={editForm.username}
                    onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Enter username"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Squad</Label>
                  <Input
                    id="squad"
                    value={editForm.squad}
                    onChange={(e) => setEditForm(prev => ({ ...prev, squad: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Enter squad"
                  />
                </div>
                
                <div>
                  <Label className="text-white">Level</Label>
                  <Input
                    id="level"
                    type="number"
                    value={editForm.level}
                    onChange={(e) => setEditForm(prev => ({ ...prev, level: parseInt(e.target.value) || 0 }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white">Total XP</Label>
                <Input
                  id="total_xp"
                  type="number"
                  value={editForm.total_xp}
                  onChange={(e) => setEditForm(prev => ({ ...prev, total_xp: parseInt(e.target.value) || 0 }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  min="0"
                />
              </div>

              <div>
                <Label className="text-white">Bio</Label>
                <textarea
                  id="bio"
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Enter bio"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="border-slate-600 text-slate-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveUser}
                  disabled={saveLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
