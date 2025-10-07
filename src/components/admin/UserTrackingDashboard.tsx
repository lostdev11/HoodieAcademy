'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Activity, 
  TrendingUp, 
  Clock, 
  Eye, 
  Zap,
  RefreshCw,
  BarChart3,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { 
  AdminDashboardData, 
  AdminDashboardStats,
  LiveUser,
  InactiveUser,
  TopCourse
} from '@/types/tracking';
import { getCompleteAdminDashboardData } from '@/lib/admin-analytics';

export default function UserTrackingDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardData = await getCompleteAdminDashboardData();
      setData(dashboardData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading dashboard data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-600">
        <AlertCircle className="w-6 h-6 mr-2" />
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { stats, liveUsers, inactiveUsers, topCourses } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Tracking Dashboard</h2>
          <p className="text-gray-600">
            Real-time user analytics and activity monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button 
            onClick={fetchData} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Daily Active Users"
          value={stats.dau}
          icon={<Users className="w-5 h-5" />}
          trend={null}
        />
        <StatsCard
          title="Weekly Active Users"
          value={stats.wau}
          icon={<BarChart3 className="w-5 h-5" />}
          trend={null}
        />
        <StatsCard
          title="Monthly Active Users"
          value={stats.mau}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={null}
        />
        <StatsCard
          title="Live Users (5 min)"
          value={stats.liveUsers}
          icon={<Activity className="w-5 h-5" />}
          trend={null}
          className="border-green-200 bg-green-50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="New Wallets (24h)"
          value={stats.newWallets24h}
          icon={<Zap className="w-5 h-5" />}
          trend={null}
        />
        <StatsCard
          title="New Wallets (7d)"
          value={stats.newWallets7d}
          icon={<Calendar className="w-5 h-5" />}
          trend={null}
        />
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users className="w-5 h-5" />}
          trend={null}
        />
        <StatsCard
          title="Inactive Users (7d)"
          value={stats.inactiveUsers7d}
          icon={<Clock className="w-5 h-5" />}
          trend={null}
          className="border-orange-200 bg-orange-50"
        />
      </div>

      {/* Live Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            Live Users (Last 5 minutes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {liveUsers.length === 0 ? (
            <p className="text-gray-500">No live users currently</p>
          ) : (
            <div className="space-y-2">
              {liveUsers.map((user) => (
                <LiveUserCard key={user.user_id} user={user} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top Courses (Last 7 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topCourses.length === 0 ? (
            <p className="text-gray-500">No course activity in the last 7 days</p>
          ) : (
            <div className="space-y-2">
              {topCourses.map((course) => (
                <TopCourseCard key={course.course_id} course={course} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inactive Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Inactive Users (7+ days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inactiveUsers.length === 0 ? (
            <p className="text-gray-500">All users have been active recently!</p>
          ) : (
            <div className="space-y-2">
              {inactiveUsers.slice(0, 10).map((user) => (
                <InactiveUserCard key={user.user_id} user={user} />
              ))}
              {inactiveUsers.length > 10 && (
                <p className="text-sm text-gray-500 mt-2">
                  ... and {inactiveUsers.length - 10} more inactive users
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: number | null;
  className?: string;
}

function StatsCard({ title, value, icon, trend, className = "" }: StatsCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          </div>
          <div className="text-gray-400">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

interface LiveUserCardProps {
  user: LiveUser;
}

function LiveUserCard({ user }: LiveUserCardProps) {
  const minutesAgo = Math.round(user.minutes_since_last_heartbeat);
  
  return (
    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
      <div>
        <p className="font-medium">
          {user.display_name || `User ${user.user_id.slice(0, 8)}`}
        </p>
        <p className="text-sm text-gray-600">
          Wallet: {user.wallet_address ? `${user.wallet_address.slice(0, 8)}...` : 'N/A'}
        </p>
      </div>
      <div className="text-right">
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Active {minutesAgo}m ago
        </Badge>
      </div>
    </div>
  );
}

interface TopCourseCardProps {
  course: TopCourse;
}

function TopCourseCard({ course }: TopCourseCardProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div>
        <p className="font-medium">{course.course_id}</p>
        <p className="text-sm text-gray-600">
          {course.total_events} total events
        </p>
      </div>
      <div className="text-right">
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {course.active_users} users
        </Badge>
      </div>
    </div>
  );
}

interface InactiveUserCardProps {
  user: InactiveUser;
}

function InactiveUserCard({ user }: InactiveUserCardProps) {
  const daysAgo = user.last_event_at 
    ? Math.round((Date.now() - new Date(user.last_event_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
      <div>
        <p className="font-medium">
          {user.display_name || `User ${user.user_id.slice(0, 8)}`}
        </p>
        <p className="text-sm text-gray-600">
          Wallet: {user.primary_wallet ? `${user.primary_wallet.slice(0, 8)}...` : 'N/A'}
        </p>
      </div>
      <div className="text-right">
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          {daysAgo ? `${daysAgo}d ago` : 'Never active'}
        </Badge>
      </div>
    </div>
  );
}
