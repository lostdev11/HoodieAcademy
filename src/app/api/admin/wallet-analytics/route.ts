import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') as '24h' | '7d' | '30d' | '90d' || '30d';
    const walletAddress = searchParams.get('wallet_address');

    // Calculate date range
    const timeRanges = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    };

    const days = timeRanges[timeRange];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get connections in time range
    let query = supabase
      .from('wallet_connections')
      .select('*')
      .gte('connection_timestamp', startDate.toISOString())
      .order('connection_timestamp', { ascending: false });

    if (walletAddress) {
      query = query.eq('wallet_address', walletAddress);
    }

    const { data: connections, error } = await query;

    if (error) {
      console.error('Error fetching wallet connections:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch connections',
        details: error.message 
      }, { status: 500 });
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

    // Connection trends
    const dailyTrends = calculateDailyTrends(connectionsData, days);
    const weeklyTrends = calculateWeeklyTrends(connectionsData, days);
    const monthlyTrends = calculateMonthlyTrends(connectionsData, days);

    const analytics = {
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

    return NextResponse.json({ 
      success: true,
      data: analytics
    });

  } catch (error: any) {
    console.error('Error calculating wallet analytics:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

function calculateDailyTrends(connections: any[], days: number) {
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

function calculateWeeklyTrends(connections: any[], days: number) {
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

function calculateMonthlyTrends(connections: any[], days: number) {
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


