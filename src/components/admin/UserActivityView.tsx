'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Search, Filter, Download, User, BookOpen, Trophy, Users, TrendingUp } from 'lucide-react';

interface UserActivity {
  id: number;
  wallet_address: string;
  activity_type: string;
  activity_timestamp: string;
  user_agent?: string;
  ip_address?: string;
  profile_data?: any;
  course_data?: any;
  wallet_data?: any;
  achievement_data?: any;
  session_data?: any;
  metadata?: any;
  notes?: string;
  display_name?: string;
  squad?: string;
  course_id?: string;
}

interface UserActivityResponse {
  success: boolean;
  data: UserActivity[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function UserActivityView() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchWallet, setSearchWallet] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSquad, setFilterSquad] = useState<string>('all');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false
  });

  const fetchActivities = async (resetOffset = true) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: resetOffset ? '0' : pagination.offset.toString()
      });

      if (searchWallet) {
        params.append('wallet_address', searchWallet);
      }
      if (filterType && filterType !== 'all') {
        params.append('activity_type', filterType);
      }
      if (filterSquad && filterSquad !== 'all') {
        params.append('squad', filterSquad);
      }

      const response = await fetch(`/api/admin/user-activity?${params}`);
      const data: UserActivityResponse = await response.json();

      if (data.success) {
        setActivities(data.data);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          offset: resetOffset ? 0 : prev.offset,
          hasMore: data.pagination.hasMore
        }));
      } else {
        setError('Failed to fetch activities');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activities';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleSearch = () => {
    fetchActivities(true);
  };

  const handleFilter = (type: string, filterField: 'type' | 'squad') => {
    if (filterField === 'type') {
      setFilterType(type);
    } else {
      setFilterSquad(type);
    }
    fetchActivities(true);
  };

  const loadMore = () => {
    if (pagination.hasMore) {
      setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
      fetchActivities(false);
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Wallet Address', 'Display Name', 'Squad', 'Activity Type', 'Timestamp', 'IP Address', 'Notes'],
      ...activities.map(activity => [
        activity.wallet_address,
        activity.display_name || 'N/A',
        activity.squad || 'N/A',
        activity.activity_type,
        new Date(activity.activity_timestamp).toLocaleString(),
        activity.ip_address || 'N/A',
        activity.notes || 'N/A'
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-activity-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'profile_update': return 'bg-blue-100 text-blue-800';
      case 'squad_assignment': return 'bg-purple-100 text-purple-800';
      case 'wallet_connect': return 'bg-green-100 text-green-800';
      case 'wallet_disconnect': return 'bg-red-100 text-red-800';
      case 'course_start': return 'bg-yellow-100 text-yellow-800';
      case 'course_complete': return 'bg-emerald-100 text-emerald-800';
      case 'course_approval': return 'bg-indigo-100 text-indigo-800';
      case 'badge_earned': return 'bg-pink-100 text-pink-800';
      case 'exam_taken': return 'bg-orange-100 text-orange-800';
      case 'login': return 'bg-cyan-100 text-cyan-800';
      case 'logout': return 'bg-gray-100 text-gray-800';
      case 'pfp_update': return 'bg-violet-100 text-violet-800';
      case 'nft_verification': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getActivitySummary = () => {
    const totalActivities = activities.length;
    const uniqueUsers = new Set(activities.map(a => a.wallet_address)).size;
    const profileUpdates = activities.filter(a => a.activity_type === 'profile_update').length;
    const squadChanges = activities.filter(a => a.activity_type === 'squad_assignment').length;
    const courseActivities = activities.filter(a => a.activity_type.includes('course')).length;
    const walletActivities = activities.filter(a => a.activity_type.includes('wallet')).length;
    const badgeActivities = activities.filter(a => a.activity_type === 'badge_earned').length;

    return {
      totalActivities,
      uniqueUsers,
      profileUpdates,
      squadChanges,
      courseActivities,
      walletActivities,
      badgeActivities
    };
  };

  const summary = getActivitySummary();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>User Activity Dashboard</span>
            <div className="flex items-center space-x-2">
              <Button onClick={() => fetchActivities(true)} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportData} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search wallet address or display name..."
                  value={searchWallet}
                  onChange={(e) => setSearchWallet(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={(value) => handleFilter(value, 'type')}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by activity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="profile_update">Profile Updates</SelectItem>
                <SelectItem value="squad_assignment">Squad Changes</SelectItem>
                <SelectItem value="course_start">Course Starts</SelectItem>
                <SelectItem value="course_complete">Course Completions</SelectItem>
                <SelectItem value="badge_earned">Badges Earned</SelectItem>
                <SelectItem value="wallet_connect">Wallet Connections</SelectItem>
                <SelectItem value="nft_verification">NFT Verifications</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSquad} onValueChange={(value) => handleFilter(value, 'squad')}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by squad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Squads</SelectItem>
                <SelectItem value="🎤 Hoodie Speakers">🎤 Hoodie Speakers</SelectItem>
                <SelectItem value="🔍 Hoodie Decoders">🔍 Hoodie Decoders</SelectItem>
                <SelectItem value="⚡ Hoodie Raiders">⚡ Hoodie Raiders</SelectItem>
                <SelectItem value="🎯 Hoodie Rangers">🎯 Hoodie Rangers</SelectItem>
                <SelectItem value="🎨 Hoodie Creators">🎨 Hoodie Creators</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="w-full sm:w-auto">
              Search
            </Button>
          </div>

          {/* Activity Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{summary.totalActivities}</div>
                <div className="text-sm text-gray-600">Total Activities</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{summary.uniqueUsers}</div>
                <div className="text-sm text-gray-600">Unique Users</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{summary.courseActivities}</div>
                <div className="text-sm text-gray-600">Course Activities</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">{summary.badgeActivities}</div>
                <div className="text-sm text-gray-600">Badges Earned</div>
              </CardContent>
            </Card>
          </div>

          {/* Activities Table */}
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading activities...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>{error}</p>
              <Button onClick={() => fetchActivities()} className="mt-2">
                Try Again
              </Button>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <p>No activities found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-mono text-sm">
                              {truncateAddress(activity.wallet_address)}
                            </div>
                            {activity.display_name && (
                              <div className="text-sm font-medium">{activity.display_name}</div>
                            )}
                            {activity.squad && (
                              <Badge variant="outline" className="text-xs">
                                {activity.squad}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getActivityTypeColor(activity.activity_type)}>
                            {activity.activity_type.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-xs">
                          <div className="space-y-1">
                            {activity.notes && (
                              <div className="text-xs text-gray-600">{activity.notes}</div>
                            )}
                            {activity.course_data && (
                              <div className="text-xs">
                                <div>Course: {activity.course_data.course_name || activity.course_data.course_id}</div>
                                {activity.course_data.score && <div>Score: {activity.course_data.score}</div>}
                              </div>
                            )}
                            {activity.profile_data && (
                              <div className="text-xs">
                                {activity.profile_data.display_name && <div>Name: {activity.profile_data.display_name}</div>}
                                {activity.profile_data.squad && <div>Squad: {activity.profile_data.squad}</div>}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatTimestamp(activity.activity_timestamp)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {activity.ip_address || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.hasMore && (
                <div className="text-center mt-4">
                  <Button onClick={loadMore} variant="outline">
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
