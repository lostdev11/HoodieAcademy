'use client';

import { useState, useEffect } from 'react';
import { walletTracker, WalletConnectionData } from '@/lib/wallet-connection-tracker';

interface UserWalletInsightsProps {
  className?: string;
}

interface UserInsight {
  wallet_address: string;
  display_name?: string;
  total_connections: number;
  first_connection: string;
  last_connection: string;
  connection_frequency: number; // connections per day
  preferred_provider: string;
  verification_success_rate: number;
  device_diversity: number; // number of different devices used
  connection_streak: number; // consecutive days with connections
  engagement_score: number; // calculated based on various factors
  risk_score: number; // calculated based on suspicious patterns
}

export default function UserWalletInsights({ className = '' }: UserWalletInsightsProps) {
  const [insights, setInsights] = useState<UserInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'engagement' | 'connections' | 'risk' | 'frequency'>('engagement');
  const [filterBy, setFilterBy] = useState<'all' | 'high_engagement' | 'at_risk' | 'new_users'>('all');

  useEffect(() => {
    loadUserInsights();
  }, []);

  const loadUserInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all wallet connections
      const connections = await walletTracker.getWalletConnections(undefined, 1000);
      
      // Group connections by wallet address
      const walletGroups: { [key: string]: WalletConnectionData[] } = {};
      connections.forEach(conn => {
        if (!walletGroups[conn.wallet_address]) {
          walletGroups[conn.wallet_address] = [];
        }
        walletGroups[conn.wallet_address].push(conn);
      });

      // Calculate insights for each wallet
      const userInsights: UserInsight[] = Object.entries(walletGroups).map(([wallet, walletConnections]) => {
        const sortedConnections = walletConnections.sort((a, b) => 
          new Date(a.session_data?.timestamp || '').getTime() -
          new Date(b.session_data?.timestamp || '').getTime()
        );

        const firstConnection = sortedConnections[0];
        const lastConnection = sortedConnections[sortedConnections.length - 1];
        
        const firstConnectionDate = new Date(firstConnection.session_data?.timestamp || '');
        const lastConnectionDate = new Date(lastConnection.session_data?.timestamp || '');
        
        const daysSinceFirst = Math.max(1, Math.ceil((Date.now() - firstConnectionDate.getTime()) / (1000 * 60 * 60 * 24)));
        const connectionFrequency = walletConnections.length / daysSinceFirst;

        // Calculate provider preferences
        const providerCounts: { [key: string]: number } = {};
        walletConnections.forEach(conn => {
          const provider = conn.session_data?.provider || 'unknown';
          providerCounts[provider] = (providerCounts[provider] || 0) + 1;
        });
        const preferredProvider = Object.entries(providerCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';

        // Calculate verification success rate
        const verificationConnections = walletConnections.filter(c => 
          ['verification_success', 'verification_failed'].includes(c.connection_type)
        );
        const verificationSuccessRate = verificationConnections.length > 0 ? 
          (verificationConnections.filter(c => c.connection_type === 'verification_success').length / verificationConnections.length) * 100 : 0;

        // Calculate device diversity
        const uniqueDevices = new Set(walletConnections.map(c => 
          `${c.session_data?.device_type || 'unknown'}-${c.session_data?.browser || 'unknown'}`
        )).size;

        // Calculate connection streak (simplified)
        const connectionStreak = calculateConnectionStreak(walletConnections);

        // Calculate engagement score (0-100)
        const engagementScore = calculateEngagementScore({
          totalConnections: walletConnections.length,
          connectionFrequency,
          verificationSuccessRate,
          deviceDiversity: uniqueDevices,
          connectionStreak
        });

        // Calculate risk score (0-100, higher = more risky)
        const riskScore = calculateRiskScore({
          totalConnections: walletConnections.length,
          connectionFrequency,
          verificationSuccessRate,
          deviceDiversity: uniqueDevices,
          connectionStreak,
          firstConnectionDate,
          lastConnectionDate
        });

        return {
          wallet_address: wallet,
          total_connections: walletConnections.length,
          first_connection: firstConnectionDate.toISOString(),
          last_connection: lastConnectionDate.toISOString(),
          connection_frequency: connectionFrequency,
          preferred_provider: preferredProvider,
          verification_success_rate: verificationSuccessRate,
          device_diversity: uniqueDevices,
          connection_streak: connectionStreak,
          engagement_score: engagementScore,
          risk_score: riskScore
        };
      });

      setInsights(userInsights);
    } catch (err) {
      console.error('Error loading user insights:', err);
      setError('Failed to load user insights');
    } finally {
      setLoading(false);
    }
  };

  const calculateConnectionStreak = (connections: WalletConnectionData[]): number => {
    // Simplified streak calculation - consecutive days with at least one connection
    const connectionDates = connections.map(c => 
      new Date(c.session_data?.timestamp || '').toDateString()
    );
    const uniqueDates = [...new Set(connectionDates)].sort().reverse();
    
    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
      streak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const currentDate = new Date(uniqueDates[i - 1]);
        const previousDate = new Date(uniqueDates[i]);
        const diffTime = currentDate.getTime() - previousDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          streak++;
        } else {
          break;
        }
      }
    }
    
    return streak;
  };

  const calculateEngagementScore = (metrics: {
    totalConnections: number;
    connectionFrequency: number;
    verificationSuccessRate: number;
    deviceDiversity: number;
    connectionStreak: number;
  }): number => {
    const { totalConnections, connectionFrequency, verificationSuccessRate, deviceDiversity, connectionStreak } = metrics;
    
    // Weighted scoring system
    const connectionScore = Math.min(100, (totalConnections / 10) * 100); // Max at 10+ connections
    const frequencyScore = Math.min(100, connectionFrequency * 20); // Max at 5+ connections per day
    const verificationScore = verificationSuccessRate;
    const diversityScore = Math.min(100, deviceDiversity * 25); // Max at 4+ devices
    const streakScore = Math.min(100, connectionStreak * 10); // Max at 10+ day streak
    
    // Weighted average
    return Math.round(
      connectionScore * 0.3 +
      frequencyScore * 0.25 +
      verificationScore * 0.2 +
      diversityScore * 0.15 +
      streakScore * 0.1
    );
  };

  const calculateRiskScore = (metrics: {
    totalConnections: number;
    connectionFrequency: number;
    verificationSuccessRate: number;
    deviceDiversity: number;
    connectionStreak: number;
    firstConnectionDate: Date;
    lastConnectionDate: Date;
  }): number => {
    const { totalConnections, connectionFrequency, verificationSuccessRate, deviceDiversity, connectionStreak, firstConnectionDate, lastConnectionDate } = metrics;
    
    let riskScore = 0;
    
    // High connection frequency might indicate bot behavior
    if (connectionFrequency > 10) riskScore += 30;
    else if (connectionFrequency > 5) riskScore += 15;
    
    // Low verification success rate
    if (verificationSuccessRate < 50) riskScore += 25;
    else if (verificationSuccessRate < 80) riskScore += 10;
    
    // Very high device diversity might indicate account sharing
    if (deviceDiversity > 5) riskScore += 20;
    else if (deviceDiversity > 3) riskScore += 10;
    
    // Very long streaks might indicate automation
    if (connectionStreak > 30) riskScore += 15;
    
    // Recent activity patterns
    const daysSinceLastConnection = Math.ceil((Date.now() - lastConnectionDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastConnection > 30) riskScore += 10; // Inactive accounts
    
    return Math.min(100, riskScore);
  };

  const getFilteredInsights = () => {
    let filtered = insights;
    
    switch (filterBy) {
      case 'high_engagement':
        filtered = insights.filter(insight => insight.engagement_score >= 70);
        break;
      case 'at_risk':
        filtered = insights.filter(insight => insight.risk_score >= 50);
        break;
      case 'new_users':
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        filtered = insights.filter(insight => 
          new Date(insight.first_connection) > thirtyDaysAgo
        );
        break;
    }
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'engagement':
          return b.engagement_score - a.engagement_score;
        case 'connections':
          return b.total_connections - a.total_connections;
        case 'risk':
          return b.risk_score - a.risk_score;
        case 'frequency':
          return b.connection_frequency - a.connection_frequency;
        default:
          return 0;
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getEngagementColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Insights</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <button
            onClick={loadUserInsights}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredInsights = getFilteredInsights();

  return (
    <div className={`p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">User Wallet Insights</h2>
        <div className="flex space-x-4">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Users</option>
            <option value="high_engagement">High Engagement</option>
            <option value="at_risk">At Risk</option>
            <option value="new_users">New Users</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="engagement">Engagement Score</option>
            <option value="connections">Total Connections</option>
            <option value="risk">Risk Score</option>
            <option value="frequency">Connection Frequency</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm font-medium text-gray-600">Total Users</div>
          <div className="text-2xl font-bold text-gray-900">{insights.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm font-medium text-gray-600">High Engagement</div>
          <div className="text-2xl font-bold text-green-600">
            {insights.filter(i => i.engagement_score >= 70).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm font-medium text-gray-600">At Risk</div>
          <div className="text-2xl font-bold text-red-600">
            {insights.filter(i => i.risk_score >= 50).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm font-medium text-gray-600">Avg Engagement</div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.round(insights.reduce((sum, i) => sum + i.engagement_score, 0) / insights.length) || 0}%
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wallet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Connections</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInsights.map((insight, index) => (
                <tr key={insight.wallet_address} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {insight.wallet_address.slice(0, 8)}...{insight.wallet_address.slice(-8)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Joined {formatDate(insight.first_connection)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEngagementColor(insight.engagement_score)}`}>
                      {insight.engagement_score}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(insight.risk_score)}`}>
                      {insight.risk_score}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {insight.total_connections}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {insight.connection_frequency.toFixed(2)}/day
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {insight.preferred_provider}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(insight.last_connection)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredInsights.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No users found matching the current filters.
        </div>
      )}
    </div>
  );
}
