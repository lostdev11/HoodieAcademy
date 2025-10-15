'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Target, 
  FileText, 
  Megaphone, 
  Calendar, 
  BookOpen,
  Activity,
  TrendingUp,
  Clock,
  Eye,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { adminDataService, AdminDashboardData, AdminStats } from '@/lib/admin-data-service';

interface AdminOverviewDashboardProps {
  className?: string;
  walletAddress?: string | null;
}

export default function AdminOverviewDashboard({ className = '', walletAddress }: AdminOverviewDashboardProps) {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds for testing
  const [refreshCount, setRefreshCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dashboardData = await adminDataService.getAllAdminData(walletAddress || undefined);
      setData(dashboardData);
      setLastUpdated(new Date());
      setRefreshCount(prev => prev + 1);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    console.log('Setting up auto-refresh with interval:', refreshInterval);
    const interval = setInterval(() => {
      console.log('Auto-refreshing data...');
      fetchData();
    }, refreshInterval);

    return () => {
      console.log('Clearing auto-refresh interval');
      clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, fetchData]);

  if (loading && !data) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center p-8 text-slate-300">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Loading dashboard data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center p-8 text-red-400">
          <AlertCircle className="w-6 h-6 mr-2" />
          {error}
          <Button onClick={fetchData} className="ml-4 border-slate-600 text-slate-300" variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats } = data;

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Admin Dashboard Overview</h2>
          <p className="text-slate-400">
            Real-time statistics and system health monitoring
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <span className="text-sm text-slate-400">
              Last updated: {lastUpdated.toLocaleTimeString()} (Refresh #{refreshCount})
            </span>
          )}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-slate-400">Auto-refresh:</label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-slate-700 border border-slate-600 text-white rounded px-2 py-1 text-sm"
              disabled={!autoRefresh}
            >
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
              <option value={60000}>1m</option>
              <option value={300000}>5m</option>
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
          <Button onClick={fetchData} variant="outline" size="sm" className="border-slate-600 text-slate-300">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{stats.totalUsers}</div>
            <p className="text-xs text-slate-500">
              {stats.activeUsers} active (24h)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.activeUsers}</div>
            <p className="text-xs text-slate-500">
              {stats.newUsersToday} new today
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Admin Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">{stats.adminUsers}</div>
            <p className="text-xs text-slate-500">
              System administrators
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              New Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{stats.newUsersToday}</div>
            <p className="text-xs text-slate-500">
              Users joined today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Bounties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-400">{stats.totalBounties}</div>
            <div className="flex space-x-2 mt-2">
              <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-300">
                {stats.activeBounties} Active
              </Badge>
              {stats.hiddenBounties > 0 && (
                <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                  {stats.hiddenBounties} Hidden
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{stats.totalSubmissions}</div>
            <div className="flex space-x-2 mt-2">
              <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-300">
                {stats.pendingSubmissions} Pending
              </Badge>
              <Badge variant="default" className="text-xs bg-green-500/20 text-green-300">
                {stats.approvedSubmissions} Approved
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-400">{stats.totalCourses}</div>
            <div className="flex space-x-2 mt-2">
              <Badge variant="secondary" className="text-xs bg-teal-500/20 text-teal-300">
                {stats.publishedCourses} Published
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Communication Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center">
              <Megaphone className="w-4 h-4 mr-2" />
              Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{stats.totalAnnouncements}</div>
            <div className="flex space-x-2 mt-2">
              <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-300">
                {stats.activeAnnouncements} Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-400">{stats.totalEvents}</div>
            <div className="flex space-x-2 mt-2">
              <Badge variant="secondary" className="text-xs bg-rose-500/20 text-rose-300">
                {stats.activeEvents} Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <Card className="bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-white">System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-slate-300">
                Users: {stats.activeUsers}/{stats.totalUsers} active
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-slate-300">
                Bounties: {stats.activeBounties} active
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-slate-300">
                {stats.pendingSubmissions} pending submissions
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
