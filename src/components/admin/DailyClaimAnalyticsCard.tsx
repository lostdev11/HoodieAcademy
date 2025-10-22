'use client';

import { useState, useEffect } from 'react';

interface AnalyticsOverview {
  totalClaims: number;
  uniqueClaimers: number;
  successfulClaims: number;
  rejectedClaims: number;
  avgTimeToClaimMinutes: number;
  medianTimeToClaimMinutes: number;
  totalXpAwarded: number;
  avgProcessingTimeMs: number;
}

interface EventBreakdown {
  eventType: string;
  count: number;
  percentage: number;
}

interface SquadStats {
  squad: string;
  totalClaims: number;
  uniqueMembers: number;
  totalXpAwarded: number;
  avgTimeToClaimMinutes: number;
}

export default function DailyClaimAnalyticsCard() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [breakdown, setBreakdown] = useState<EventBreakdown[]>([]);
  const [topSquads, setTopSquads] = useState<SquadStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'squads'>('overview');

  useEffect(() => {
    fetchAnalytics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch overview
      const overviewRes = await fetch('/api/admin/daily-claim-analytics?type=overview');
      if (!overviewRes.ok) throw new Error('Failed to fetch overview');
      const overviewData = await overviewRes.json();
      setOverview(overviewData.data);

      // Fetch breakdown
      const breakdownRes = await fetch('/api/admin/daily-claim-analytics?type=breakdown');
      if (!breakdownRes.ok) throw new Error('Failed to fetch breakdown');
      const breakdownData = await breakdownRes.json();
      setBreakdown(breakdownData.data);

      // Fetch top squads
      const squadsRes = await fetch('/api/admin/daily-claim-analytics?type=squads&limit=5');
      if (!squadsRes.ok) throw new Error('Failed to fetch squads');
      const squadsData = await squadsRes.json();
      setTopSquads(squadsData.data);

    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number | null) => {
    if (!minutes && minutes !== 0) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getEventTypeLabel = (eventType: string) => {
    const labels: { [key: string]: string } = {
      'claim_success': '✅ Success',
      'claim_rejected_already_claimed': '🔄 Already Claimed',
      'signature_invalid': '❌ Invalid Signature',
      'nonce_invalid': '🔐 Invalid Nonce',
      'nonce_expired': '⏰ Nonce Expired',
      'nonce_used': '🔒 Nonce Used',
      'rate_limited': '⏱️ Rate Limited'
    };
    return labels[eventType] || eventType;
  };

  if (loading && !overview) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">📊 Daily Claim Analytics</h3>
        <div className="text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">📊 Daily Claim Analytics</h3>
        <div className="text-red-400">Error: {error}</div>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!overview) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">📊 Daily Claim Analytics</h3>
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm disabled:opacity-50"
        >
          {loading ? '⟳' : '🔄'} Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-4 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'overview'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('breakdown')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'breakdown'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Breakdown
        </button>
        <button
          onClick={() => setActiveTab('squads')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'squads'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Top Squads
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 rounded p-4">
              <div className="text-gray-400 text-sm">Claims Today</div>
              <div className="text-2xl font-bold text-white">{overview.totalClaims}</div>
            </div>
            <div className="bg-gray-700 rounded p-4">
              <div className="text-gray-400 text-sm">Unique Claimers</div>
              <div className="text-2xl font-bold text-white">{overview.uniqueClaimers}</div>
            </div>
            <div className="bg-gray-700 rounded p-4">
              <div className="text-gray-400 text-sm">Success Rate</div>
              <div className="text-2xl font-bold text-green-400">
                {overview.totalClaims > 0
                  ? Math.round((overview.successfulClaims / overview.totalClaims) * 100)
                  : 0}%
              </div>
            </div>
            <div className="bg-gray-700 rounded p-4">
              <div className="text-gray-400 text-sm">XP Awarded</div>
              <div className="text-2xl font-bold text-purple-400">{overview.totalXpAwarded}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded p-4">
              <div className="text-gray-400 text-sm">Avg Time to Claim</div>
              <div className="text-xl font-bold text-white">
                {formatTime(overview.avgTimeToClaimMinutes)}
              </div>
              <div className="text-gray-500 text-xs mt-1">
                Median: {formatTime(overview.medianTimeToClaimMinutes)}
              </div>
            </div>
            <div className="bg-gray-700 rounded p-4">
              <div className="text-gray-400 text-sm">Avg Processing Time</div>
              <div className="text-xl font-bold text-white">
                {overview.avgProcessingTimeMs ? Math.round(overview.avgProcessingTimeMs) : 0}ms
              </div>
              <div className="text-gray-500 text-xs mt-1">Server response time</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-900/20 border border-green-700 rounded p-4">
              <div className="text-green-400 text-sm">✅ Successful Claims</div>
              <div className="text-2xl font-bold text-green-400">{overview.successfulClaims}</div>
            </div>
            <div className="bg-red-900/20 border border-red-700 rounded p-4">
              <div className="text-red-400 text-sm">❌ Rejected Claims</div>
              <div className="text-2xl font-bold text-red-400">{overview.rejectedClaims}</div>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown Tab */}
      {activeTab === 'breakdown' && (
        <div className="space-y-3">
          {breakdown.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No data available</div>
          ) : (
            breakdown.map((item, index) => (
              <div key={index} className="bg-gray-700 rounded p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium">{getEventTypeLabel(item.eventType)}</span>
                  <span className="text-gray-300">{item.count}</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <div className="text-gray-400 text-sm mt-1">{item.percentage}%</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Top Squads Tab */}
      {activeTab === 'squads' && (
        <div className="space-y-3">
          {topSquads.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No squad data available</div>
          ) : (
            topSquads.map((squad, index) => (
              <div key={index} className="bg-gray-700 rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-white font-bold text-lg">
                      {index === 0 && '🥇 '}
                      {index === 1 && '🥈 '}
                      {index === 2 && '🥉 '}
                      {squad.squad}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {squad.uniqueMembers} {squad.uniqueMembers === 1 ? 'member' : 'members'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{squad.totalClaims} claims</div>
                    <div className="text-purple-400 text-sm">{squad.totalXpAwarded} XP</div>
                  </div>
                </div>
                <div className="text-gray-400 text-xs">
                  Avg claim time: {formatTime(squad.avgTimeToClaimMinutes)}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-4 text-gray-500 text-xs text-center">
        Last updated: {new Date().toLocaleTimeString()} • Auto-refreshes every 30s
      </div>
    </div>
  );
}

