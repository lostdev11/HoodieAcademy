'use client';

import { useState, useEffect, useRef } from 'react';
import { walletTracker, WalletConnectionData } from '@/lib/wallet-connection-tracker';

interface RealtimeWalletMonitorProps {
  className?: string;
  refreshInterval?: number; // in milliseconds
}

export default function RealtimeWalletMonitor({ 
  className = '', 
  refreshInterval = 5000 
}: RealtimeWalletMonitorProps) {
  const [recentConnections, setRecentConnections] = useState<WalletConnectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [stats, setStats] = useState({
    totalConnections: 0,
    uniqueWallets: 0,
    successRate: 0,
    lastUpdate: new Date()
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isMonitoring) {
      loadRecentConnections();
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => stopMonitoring();
  }, [isMonitoring, refreshInterval]);

  const startMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      loadRecentConnections();
    }, refreshInterval);
  };

  const stopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const loadRecentConnections = async () => {
    try {
      setError(null);
      const connections = await walletTracker.getWalletConnections(undefined, 20);
      setRecentConnections(connections);
      
      // Calculate basic stats
      const uniqueWallets = new Set(connections.map(c => c.wallet_address));
      const successfulConnections = connections.filter(c => 
        ['connect', 'verification_success', 'reconnect'].includes(c.connection_type)
      ).length;
      const successRate = connections.length > 0 ? (successfulConnections / connections.length) * 100 : 0;
      
      setStats({
        totalConnections: connections.length,
        uniqueWallets: uniqueWallets.size,
        successRate,
        lastUpdate: new Date()
      });
      
    } catch (err) {
      console.error('Error loading recent connections:', err);
      setError('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getConnectionIcon = (connectionType: string) => {
    switch (connectionType) {
      case 'connect':
        return (
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        );
      case 'disconnect':
        return (
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        );
      case 'verification_success':
        return (
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
        );
      case 'verification_failed':
        return (
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
        );
      default:
        return (
          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
        );
    }
  };

  const getConnectionColor = (connectionType: string) => {
    switch (connectionType) {
      case 'connect':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'disconnect':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'verification_success':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'verification_failed':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading && recentConnections.length === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Real-time Wallet Monitor</h2>
          <p className="text-sm text-gray-600">
            Last updated: {stats.lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {isMonitoring ? 'Monitoring' : 'Paused'}
            </span>
          </div>
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`px-4 py-2 rounded text-sm font-medium ${
              isMonitoring
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isMonitoring ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Recent Connections</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalConnections}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Unique Wallets</p>
              <p className="text-xl font-bold text-gray-900">{stats.uniqueWallets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-xl font-bold text-gray-900">{stats.successRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Connections Feed */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Live Connection Feed</h3>
          <p className="text-sm text-gray-600">Real-time wallet connection events</p>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {error ? (
            <div className="p-4 text-center">
              <div className="text-red-600 mb-2">{error}</div>
              <button
                onClick={loadRecentConnections}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : recentConnections.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No recent connections found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recentConnections.map((connection, index) => (
                <div
                  key={index}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    index === 0 ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getConnectionIcon(connection.connection_type)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {connection.wallet_address.slice(0, 8)}...{connection.wallet_address.slice(-8)}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConnectionColor(connection.connection_type)}`}>
                            {connection.connection_type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <span className="capitalize">{connection.provider}</span>
                          <span>{connection.session_data?.device_type || 'Unknown device'}</span>
                          <span>{connection.session_data?.browser || 'Unknown browser'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-900">
                        {formatTime(connection.session_data?.timestamp || '')}
                      </div>
                      {connection.verification_result && (
                        <div className="text-xs text-gray-500 mt-1">
                          {connection.verification_result.nft_count ? 
                            `${connection.verification_result.nft_count} NFTs` : 
                            'Verification data'
                          }
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Auto-refresh indicator */}
      {isMonitoring && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Auto-refreshing every {refreshInterval / 1000}s</span>
          </div>
        </div>
      )}
    </div>
  );
}
