'use client';

import { supabase } from './supabase';
import { logWalletConnection } from './activity-logger';

export interface WalletConnectionData {
  wallet_address: string;
  connection_type: 'connect' | 'disconnect' | 'verification_success' | 'verification_failed' | 'reconnect' | 'error';
  provider: 'phantom' | 'metamask' | 'solflare' | 'backpack' | 'unknown';
  user_agent?: string;
  ip_address?: string;
  verification_result?: {
    nft_count?: number;
    wifhoodie_found?: boolean;
    token_balance?: number;
    verification_method?: string;
    [key: string]: any;
  };
  session_data?: {
    session_id?: string;
    connection_method?: string;
    device_type?: string;
    browser?: string;
    os?: string;
    timestamp: string;
    [key: string]: any;
  };
  metadata?: {
    page_url?: string;
    referrer?: string;
    screen_resolution?: string;
    timezone?: string;
    language?: string;
    [key: string]: any;
  };
  notes?: string;
}

export interface WalletAnalytics {
  total_connections: number;
  unique_wallets: number;
  connection_success_rate: number;
  most_used_provider: string;
  average_session_duration: number;
  recent_connections: WalletConnectionData[];
  connection_trends: {
    daily: { date: string; connections: number }[];
    weekly: { week: string; connections: number }[];
    monthly: { month: string; connections: number }[];
  };
  provider_breakdown: { provider: string; count: number; percentage: number }[];
  verification_stats: {
    total_verifications: number;
    successful_verifications: number;
    failed_verifications: number;
    success_rate: number;
  };
}

export class WalletConnectionTracker {
  private static instance: WalletConnectionTracker;
  private connectionCache: Map<string, WalletConnectionData> = new Map();
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): WalletConnectionTracker {
    if (!WalletConnectionTracker.instance) {
      WalletConnectionTracker.instance = new WalletConnectionTracker();
    }
    return WalletConnectionTracker.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo() {
    if (typeof window === 'undefined') return {};

    const userAgent = window.navigator.userAgent;
    const screen = window.screen;
    
    return {
      user_agent: userAgent,
      device_type: /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'mobile' : 'desktop',
      browser: this.getBrowserName(userAgent),
      os: this.getOSName(userAgent),
      screen_resolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      page_url: window.location.href,
      referrer: document.referrer || 'direct'
    };
  }

  private getBrowserName(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOSName(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  async trackConnection(
    walletAddress: string,
    connectionType: WalletConnectionData['connection_type'],
    provider: WalletConnectionData['provider'] = 'unknown',
    verificationResult?: WalletConnectionData['verification_result'],
    additionalMetadata?: Partial<WalletConnectionData['metadata']>
  ): Promise<boolean> {
    try {
      const deviceInfo = this.getDeviceInfo();
      const timestamp = new Date().toISOString();

      const connectionData: WalletConnectionData = {
        wallet_address: walletAddress,
        connection_type: connectionType,
        provider,
        user_agent: deviceInfo.user_agent,
        ip_address: undefined, // Will be set server-side
        verification_result: verificationResult,
        session_data: {
          session_id: this.sessionId,
          connection_method: 'wallet_extension',
          device_type: deviceInfo.device_type,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          timestamp,
          ...deviceInfo
        },
        metadata: {
          page_url: deviceInfo.page_url,
          referrer: deviceInfo.referrer,
          screen_resolution: deviceInfo.screen_resolution,
          timezone: deviceInfo.timezone,
          language: deviceInfo.language,
          ...additionalMetadata
        },
        notes: `Wallet ${connectionType} via ${provider}`
      };

      // Store in cache for quick access
      this.connectionCache.set(walletAddress, connectionData);

      // Log to both wallet_connections table and user_activity_logs
      const [dbResult, activityResult] = await Promise.allSettled([
        this.logToDatabase(connectionData),
        logWalletConnection(walletAddress, connectionType as any, {
          provider,
          verification_result: verificationResult,
          reason: connectionType
        })
      ]);

      if (dbResult.status === 'rejected') {
        console.error('Failed to log wallet connection to database:', dbResult.reason);
      }

      if (activityResult.status === 'rejected') {
        console.error('Failed to log wallet connection to activity log:', activityResult.reason);
      }

      console.log(`📊 Wallet ${connectionType} tracked for ${walletAddress}`);
      return true;

    } catch (error) {
      console.error('Error tracking wallet connection:', error);
      return false;
    }
  }

  private async logToDatabase(connectionData: WalletConnectionData): Promise<void> {
    const { error } = await supabase
      .from('wallet_connections')
      .insert({
        wallet_address: connectionData.wallet_address,
        connection_type: connectionData.connection_type,
        user_agent: connectionData.user_agent,
        ip_address: connectionData.ip_address,
        verification_result: connectionData.verification_result,
        session_data: connectionData.session_data,
        notes: connectionData.notes
      });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  async getWalletConnections(
    walletAddress?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<WalletConnectionData[]> {
    try {
      let query = supabase
        .from('wallet_connections')
        .select('*')
        .order('connection_timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (walletAddress) {
        query = query.eq('wallet_address', walletAddress);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching wallet connections:', error);
      return [];
    }
  }

  async getWalletAnalytics(
    timeRange: '24h' | '7d' | '30d' | '90d' = '30d'
  ): Promise<WalletAnalytics> {
    try {
      const timeRanges = {
        '24h': 1,
        '7d': 7,
        '30d': 30,
        '90d': 90
      };

      const days = timeRanges[timeRange];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get all connections in time range
      const { data: connections, error } = await supabase
        .from('wallet_connections')
        .select('*')
        .gte('connection_timestamp', startDate.toISOString())
        .order('connection_timestamp', { ascending: false });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const connectionsData = connections || [];

      // Calculate analytics
      const uniqueWallets = new Set(connectionsData.map(c => c.wallet_address));
      const totalConnections = connectionsData.length;
      const successfulConnections = connectionsData.filter(c => 
        ['connect', 'verification_success', 'reconnect'].includes(c.connection_type)
      ).length;
      const connectionSuccessRate = totalConnections > 0 ? (successfulConnections / totalConnections) * 100 : 0;

      // Provider breakdown
      const providerCounts: { [key: string]: number } = {};
      connectionsData.forEach(conn => {
        const provider = conn.session_data?.provider || 'unknown';
        providerCounts[provider] = (providerCounts[provider] || 0) + 1;
      });

      const mostUsedProvider = Object.entries(providerCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';

      const providerBreakdown = Object.entries(providerCounts).map(([provider, count]) => ({
        provider,
        count,
        percentage: totalConnections > 0 ? (count / totalConnections) * 100 : 0
      }));

      // Verification stats
      const verificationConnections = connectionsData.filter(c => 
        ['verification_success', 'verification_failed'].includes(c.connection_type)
      );
      const successfulVerifications = verificationConnections.filter(c => 
        c.connection_type === 'verification_success'
      ).length;
      const verificationSuccessRate = verificationConnections.length > 0 ? 
        (successfulVerifications / verificationConnections.length) * 100 : 0;

      // Connection trends (simplified)
      const dailyTrends = this.calculateDailyTrends(connectionsData, days);
      const weeklyTrends = this.calculateWeeklyTrends(connectionsData, days);
      const monthlyTrends = this.calculateMonthlyTrends(connectionsData, days);

      return {
        total_connections: totalConnections,
        unique_wallets: uniqueWallets.size,
        connection_success_rate: connectionSuccessRate,
        most_used_provider: mostUsedProvider,
        average_session_duration: 0, // Would need session tracking for this
        recent_connections: connectionsData.slice(0, 10),
        connection_trends: {
          daily: dailyTrends,
          weekly: weeklyTrends,
          monthly: monthlyTrends
        },
        provider_breakdown: providerBreakdown,
        verification_stats: {
          total_verifications: verificationConnections.length,
          successful_verifications: successfulVerifications,
          failed_verifications: verificationConnections.length - successfulVerifications,
          success_rate: verificationSuccessRate
        }
      };

    } catch (error) {
      console.error('Error calculating wallet analytics:', error);
      return {
        total_connections: 0,
        unique_wallets: 0,
        connection_success_rate: 0,
        most_used_provider: 'unknown',
        average_session_duration: 0,
        recent_connections: [],
        connection_trends: {
          daily: [],
          weekly: [],
          monthly: []
        },
        provider_breakdown: [],
        verification_stats: {
          total_verifications: 0,
          successful_verifications: 0,
          failed_verifications: 0,
          success_rate: 0
        }
      };
    }
  }

  private calculateDailyTrends(connections: any[], days: number) {
    const trends: { date: string; connections: number }[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayConnections = connections.filter(conn => 
        conn.connection_timestamp.startsWith(dateStr)
      ).length;
      
      trends.push({ date: dateStr, connections: dayConnections });
    }
    
    return trends;
  }

  private calculateWeeklyTrends(connections: any[], days: number) {
    const trends: { week: string; connections: number }[] = [];
    const today = new Date();
    
    for (let i = Math.ceil(days / 7) - 1; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekStr = `${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`;
      
      const weekConnections = connections.filter(conn => {
        const connDate = new Date(conn.connection_timestamp);
        return connDate >= weekStart && connDate <= weekEnd;
      }).length;
      
      trends.push({ week: weekStr, connections: weekConnections });
    }
    
    return trends;
  }

  private calculateMonthlyTrends(connections: any[], days: number) {
    const trends: { month: string; connections: number }[] = [];
    const today = new Date();
    
    for (let i = Math.ceil(days / 30) - 1; i >= 0; i--) {
      const monthStart = new Date(today);
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      
      const monthStr = monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      const monthConnections = connections.filter(conn => {
        const connDate = new Date(conn.connection_timestamp);
        return connDate >= monthStart && connDate <= monthEnd;
      }).length;
      
      trends.push({ month: monthStr, connections: monthConnections });
    }
    
    return trends;
  }

  async getWalletConnectionSummary(walletAddress: string) {
    try {
      const { data, error } = await supabase
        .from('wallet_connections_summary')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching wallet connection summary:', error);
      return null;
    }
  }

  // Utility method to track wallet disconnection
  async trackDisconnection(walletAddress: string, provider: WalletConnectionData['provider'] = 'unknown') {
    return this.trackConnection(walletAddress, 'disconnect', provider);
  }

  // Utility method to track verification results
  async trackVerification(
    walletAddress: string,
    success: boolean,
    verificationData: WalletConnectionData['verification_result'],
    provider: WalletConnectionData['provider'] = 'unknown'
  ) {
    return this.trackConnection(
      walletAddress,
      success ? 'verification_success' : 'verification_failed',
      provider,
      verificationData
    );
  }
}

// Export singleton instance
export const walletTracker = WalletConnectionTracker.getInstance();


