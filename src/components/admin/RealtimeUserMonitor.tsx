'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Users, 
  Wallet, 
  Clock, 
  Eye, 
  RefreshCw,
  Play,
  Pause,
  Settings,
  Filter,
  Search
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { userDataSync } from '@/lib/user-data-sync';

interface RealtimeUserMonitorProps {
  className?: string;
}

interface ActivityEvent {
  id: string;
  wallet_address: string;
  activity_type: string;
  metadata: any;
  created_at: string;
  user_display_name?: string;
  user_squad?: string;
}

interface ConnectionEvent {
  id: string;
  wallet_address: string;
  connection_type: string;
  connection_timestamp: string;
  session_data: any;
  user_display_name?: string;
  user_squad?: string;
}

export default function RealtimeUserMonitor({ className = '' }: RealtimeUserMonitorProps) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [connections, setConnections] = useState<ConnectionEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [maxEvents, setMaxEvents] = useState(50);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [stats, setStats] = useState({
    totalActivities: 0,
    totalConnections: 0,
    activeUsers: 0,
    recentConnections: 0
  });

  const activitiesRef = useRef<HTMLDivElement>(null);
  const connectionsRef = useRef<HTMLDivElement>(null);

  // Fetch recent activities
  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('user_activity')
        .select(`
          *,
          users!inner(display_name, squad)
        `)
        .order('created_at', { ascending: false })
        .limit(maxEvents);

      if (error) throw error;

      const activitiesWithUser = data?.map((activity: any) => ({
        ...activity,
        user_display_name: activity.users?.display_name,
        user_squad: activity.users?.squad
      })) || [];

      setActivities(activitiesWithUser);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  // Fetch recent connections
  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_connections')
        .select(`
          *,
          users!inner(display_name, squad)
        `)
        .order('connection_timestamp', { ascending: false })
        .limit(maxEvents);

      if (error) throw error;

      const connectionsWithUser = data?.map((connection: any) => ({
        ...connection,
        user_display_name: connection.users?.display_name,
        user_squad: connection.users?.squad
      })) || [];

      setConnections(connectionsWithUser);
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  // Calculate stats
  const calculateStats = () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentActivities = activities.filter(activity => 
      new Date(activity.created_at) > oneHourAgo
    );
    
    const recentConnections = connections.filter(connection => 
      new Date(connection.connection_timestamp) > oneHourAgo
    );

    const activeUsers = new Set([
      ...recentActivities.map(a => a.wallet_address),
      ...recentConnections.map(c => c.wallet_address)
    ]).size;

    setStats({
      totalActivities: activities.length,
      totalConnections: connections.length,
      activeUsers,
      recentConnections: recentConnections.length
    });
  };

  // Filter events
  const getFilteredEvents = () => {
    let events: (ActivityEvent | ConnectionEvent)[] = [];

    if (filter === 'all' || filter === 'activities') {
      events = [...events, ...activities];
    }
    if (filter === 'all' || filter === 'connections') {
      events = [...events, ...connections];
    }

    // Search filter
    if (searchTerm) {
      events = events.filter(event => 
        event.wallet_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event as ActivityEvent).user_display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event as ConnectionEvent).user_display_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by timestamp
    events.sort((a, b) => {
      const timeA = 'created_at' in a ? a.created_at : a.connection_timestamp;
      const timeB = 'created_at' in b ? b.created_at : b.connection_timestamp;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });

    return events.slice(0, maxEvents);
  };

  // Auto-scroll to top when new events arrive
  useEffect(() => {
    if (activitiesRef.current) {
      activitiesRef.current.scrollTop = 0;
    }
  }, [activities]);

  useEffect(() => {
    if (connectionsRef.current) {
      connectionsRef.current.scrollTop = 0;
    }
  }, [connections]);

  // Update stats when data changes
  useEffect(() => {
    calculateStats();
  }, [activities, connections]);

  // Initial fetch
  useEffect(() => {
    fetchActivities();
    fetchConnections();
  }, []);

  // Auto-refresh when monitoring
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      fetchActivities();
      fetchConnections();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [isMonitoring, maxEvents]);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'wallet_connected': return <Wallet className="w-4 h-4 text-green-500" />;
      case 'course_completed': return <Activity className="w-4 h-4 text-blue-500" />;
      case 'bounty_submitted': return <Activity className="w-4 h-4 text-yellow-500" />;
      case 'profile_updated': return <Users className="w-4 h-4 text-purple-500" />;
      default: return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getConnectionIcon = (connectionType: string) => {
    switch (connectionType) {
      case 'connect': return <Wallet className="w-4 h-4 text-green-500" />;
      case 'disconnect': return <Wallet className="w-4 h-4 text-red-500" />;
      case 'verification_success': return <Activity className="w-4 h-4 text-green-500" />;
      case 'verification_failed': return <Activity className="w-4 h-4 text-red-500" />;
      default: return <Wallet className="w-4 h-4 text-slate-400" />;
    }
  };

  const filteredEvents = getFilteredEvents();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Activities</p>
                <p className="text-2xl font-bold text-white">{stats.totalActivities}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Connections</p>
                <p className="text-2xl font-bold text-purple-500">{stats.totalConnections}</p>
              </div>
              <Wallet className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Users</p>
                <p className="text-2xl font-bold text-green-500">{stats.activeUsers}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Recent (1h)</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.recentConnections}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Real-time User Activity Monitor
            </span>
            <div className="flex items-center gap-2">
              <Badge variant={isMonitoring ? "default" : "secondary"}>
                {isMonitoring ? 'Live' : 'Paused'}
              </Badge>
              <span className="text-xs text-slate-400">
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by wallet address or user name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Events</option>
              <option value="activities">Activities Only</option>
              <option value="connections">Connections Only</option>
            </select>

            <select
              value={maxEvents}
              onChange={(e) => setMaxEvents(Number(e.target.value))}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={25}>25 Events</option>
              <option value={50}>50 Events</option>
              <option value={100}>100 Events</option>
              <option value={200}>200 Events</option>
            </select>

            <Button
              onClick={() => setIsMonitoring(!isMonitoring)}
              variant={isMonitoring ? "destructive" : "default"}
              size="sm"
              className="flex items-center gap-2"
            >
              {isMonitoring ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isMonitoring ? 'Pause' : 'Resume'}
            </Button>

            <Button
              onClick={() => {
                fetchActivities();
                fetchConnections();
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

          {/* Events Feed */}
          <div className="space-y-2 max-h-96 overflow-y-auto" ref={activitiesRef}>
            {filteredEvents.map((event, index) => {
              const isActivity = 'activity_type' in event;
              const timestamp = isActivity ? event.created_at : event.connection_timestamp;
              const eventType = isActivity ? event.activity_type : event.connection_type;
              const userDisplayName = isActivity ? event.user_display_name : event.user_display_name;

              return (
                <div
                  key={`${isActivity ? 'activity' : 'connection'}-${event.id}`}
                  className="flex items-center justify-between p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isActivity ? getActivityIcon(eventType) : getConnectionIcon(eventType)}
                    <div>
                      <p className="text-white font-medium capitalize">
                        {eventType.replace(/_/g, ' ')}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {userDisplayName || `User ${event.wallet_address.slice(0, 6)}...`}
                        <span className="mx-2">•</span>
                        <code className="text-xs bg-slate-600 px-1 py-0.5 rounded">
                          {event.wallet_address.slice(0, 8)}...{event.wallet_address.slice(-6)}
                        </code>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {isActivity ? 'Activity' : 'Connection'}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {formatTimeAgo(timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              No events found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
