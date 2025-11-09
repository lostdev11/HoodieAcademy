import { NextRequest, NextResponse } from 'next/server';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ [ANALYTICS API] Supabase configuration missing', {
      hasUrl: Boolean(supabaseUrl),
      hasServiceKey: Boolean(supabaseServiceKey)
    });
    throw new Error('Supabase configuration missing');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

type DailyClaimRow = {
  wallet_address: string | null;
  event_type: string | null;
  xp_awarded: number | null;
  streak_days?: number | null;
  time_since_midnight_minutes: number | null;
  processing_time_ms: number | null;
};

type OverviewRpcResult = {
  total_claims: number;
  unique_claimers: number;
  successful_claims: number;
  rejected_claims: number;
  avg_time_to_claim_minutes: number | null;
  median_time_to_claim_minutes: number | null;
  total_xp_awarded: number;
  avg_processing_time_ms: number | null;
};

type BreakdownRpcRow = {
  event_type: string;
  count: number;
  percentage: number;
};

type SquadRpcRow = {
  squad: string | null;
  total_claims: number;
  unique_members: number;
  total_xp_awarded: number;
  avg_time_to_claim_minutes: number | null;
};

const DEFAULT_OVERVIEW = {
  totalClaims: 0,
  uniqueClaimers: 0,
  successfulClaims: 0,
  rejectedClaims: 0,
  avgTimeToClaimMinutes: 0,
  medianTimeToClaimMinutes: 0,
  totalXpAwarded: 0,
  avgProcessingTimeMs: 0
};

function getUtcDayBoundaries() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString()
  };
}

async function fetchTodayAnalyticsRows(supabase: SupabaseClient): Promise<DailyClaimRow[]> {
  const { startIso, endIso } = getUtcDayBoundaries();
  try {
    const { data, error } = await supabase
      .from('daily_claim_analytics')
      .select('wallet_address,event_type,xp_awarded,time_since_midnight_minutes,processing_time_ms')
      .gte('timestamp', startIso)
      .lt('timestamp', endIso)
      .limit(5000);

    if (error) {
      console.warn('⚠️ [ANALYTICS API] Fallback query failed:', error.message);
      return [];
    }

    return data || [];
  } catch (fallbackError: any) {
    console.warn('⚠️ [ANALYTICS API] Fallback query threw:', fallbackError);
    return [];
  }
}

function calculateOverviewFromRows(rows: DailyClaimRow[]) {
  if (!rows.length) {
    return DEFAULT_OVERVIEW;
  }

  const totalClaims = rows.length;
  const uniqueClaimers = new Set(rows.map((row) => row.wallet_address).filter(Boolean)).size;
  const successfulRows = rows.filter((row) => row.event_type === 'claim_success');
  const successfulClaims = successfulRows.length;
  const rejectedClaims = totalClaims - successfulClaims;

  const timeValues = successfulRows
    .map((row) => (typeof row.time_since_midnight_minutes === 'number' ? Number(row.time_since_midnight_minutes) : null))
    .filter((value): value is number => value !== null && Number.isFinite(value));

  const sortedTimes = [...timeValues].sort((a, b) => a - b);
  const medianTimeToClaimMinutes = sortedTimes.length
    ? sortedTimes.length % 2 === 0
      ? (sortedTimes[sortedTimes.length / 2 - 1] + sortedTimes[sortedTimes.length / 2]) / 2
      : sortedTimes[Math.floor(sortedTimes.length / 2)]
    : 0;

  const avgTimeToClaimMinutes = timeValues.length
    ? timeValues.reduce((sum, value) => sum + value, 0) / timeValues.length
    : 0;

  const totalXpAwarded = successfulRows.reduce((sum, row) => {
    const value = typeof row.xp_awarded === 'number' ? Number(row.xp_awarded) : 0;
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  const processingTimes = rows
    .map((row) => (typeof row.processing_time_ms === 'number' ? Number(row.processing_time_ms) : null))
    .filter((value): value is number => value !== null && Number.isFinite(value));

  const avgProcessingTimeMs = processingTimes.length
    ? processingTimes.reduce((sum, value) => sum + value, 0) / processingTimes.length
    : 0;

  return {
    totalClaims,
    uniqueClaimers,
    successfulClaims,
    rejectedClaims,
    avgTimeToClaimMinutes: Number(avgTimeToClaimMinutes.toFixed(2)),
    medianTimeToClaimMinutes: Number(medianTimeToClaimMinutes.toFixed(2)),
    totalXpAwarded,
    avgProcessingTimeMs: Number(avgProcessingTimeMs.toFixed(2))
  };
}

function calculateBreakdownFromRows(rows: DailyClaimRow[]) {
  if (!rows.length) {
    return [];
  }

  const totalClaims = rows.length;
  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    const key = row.event_type || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([eventType, count]) => ({
      eventType,
      count,
      percentage: totalClaims > 0 ? Number(((count / totalClaims) * 100).toFixed(2)) : 0
    }))
    .sort((a, b) => b.count - a.count);
}

async function calculateTopSquadsFromRows(supabase: SupabaseClient, rows: DailyClaimRow[], limit: number) {
  const successfulRows = rows.filter((row) => row.event_type === 'claim_success' && row.wallet_address);

  if (!successfulRows.length) {
    return [];
  }

  const uniqueWallets = Array.from(
    new Set(successfulRows.map((row) => row.wallet_address).filter((wallet): wallet is string => Boolean(wallet)))
  );

  let squadLookup = new Map<string, string>();

  if (uniqueWallets.length) {
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('wallet_address,squad')
        .in('wallet_address', uniqueWallets);

      if (usersError) {
        console.warn('⚠️ [ANALYTICS API] Unable to load squad data for fallback:', usersError.message);
      } else if (users) {
        squadLookup = new Map(
          users
            .filter((user): user is { wallet_address: string; squad: string | null } => Boolean(user.wallet_address))
            .map((user) => [user.wallet_address, user.squad || 'No Squad'])
        );
      }
    } catch (usersException: any) {
      console.warn('⚠️ [ANALYTICS API] Squad lookup threw during fallback:', usersException);
    }
  }

  const squadStats = new Map<
    string,
    {
      squad: string;
      totalClaims: number;
      uniqueMembers: Set<string>;
      totalXpAwarded: number;
      timeValues: number[];
    }
  >();

  successfulRows.forEach((row) => {
    const wallet = row.wallet_address as string;
    const squad = squadLookup.get(wallet) || 'No Squad';

    if (!squadStats.has(squad)) {
      squadStats.set(squad, {
        squad,
        totalClaims: 0,
        uniqueMembers: new Set(),
        totalXpAwarded: 0,
        timeValues: []
      });
    }

    const entry = squadStats.get(squad)!;
    entry.totalClaims += 1;
    entry.uniqueMembers.add(wallet);

    const xpValue = typeof row.xp_awarded === 'number' ? Number(row.xp_awarded) : 0;
    if (Number.isFinite(xpValue)) {
      entry.totalXpAwarded += xpValue;
    }

    if (typeof row.time_since_midnight_minutes === 'number' && Number.isFinite(Number(row.time_since_midnight_minutes))) {
      entry.timeValues.push(Number(row.time_since_midnight_minutes));
    }
  });

  return Array.from(squadStats.values())
    .map((entry) => ({
      squad: entry.squad,
      totalClaims: entry.totalClaims,
      uniqueMembers: entry.uniqueMembers.size,
      totalXpAwarded: entry.totalXpAwarded,
      avgTimeToClaimMinutes: entry.timeValues.length
        ? Number(
            (entry.timeValues.reduce((sum, value) => sum + value, 0) / entry.timeValues.length).toFixed(2)
          )
        : 0
    }))
    .sort((a, b) => b.totalClaims - a.totalClaims)
    .slice(0, Math.max(limit, 0));
}

async function buildOverviewFallback(supabase: SupabaseClient) {
  const rows = await fetchTodayAnalyticsRows(supabase);
  return calculateOverviewFromRows(rows);
}

async function buildBreakdownFallback(supabase: SupabaseClient) {
  const rows = await fetchTodayAnalyticsRows(supabase);
  return calculateBreakdownFromRows(rows);
}

async function buildTopSquadsFallback(supabase: SupabaseClient, limit: number) {
  const rows = await fetchTodayAnalyticsRows(supabase);
  return calculateTopSquadsFromRows(supabase, rows, limit);
}

/**
 * GET /api/admin/daily-claim-analytics?type=overview|breakdown|squads|time-distribution|streak-distribution|trend
 * 
 * Fetches daily claim analytics for admin dashboard
 * 
 * Query parameters:
 * - type: The type of analytics to fetch
 * - days: Number of days for trend (default: 7)
 * - limit: Limit for squad results (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const days = parseInt(searchParams.get('days') || '7');
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log('📊 [ANALYTICS API] Fetching analytics:', { type, days, limit });

    const supabase = getSupabaseClient();

    // TODO: Verify admin authentication
    // For now, we'll allow access without auth check
    // In production, verify the JWT token includes admin claim

    switch (type) {
      case 'overview': {
        // Get today's overall stats
        const { data, error } = await supabase.rpc('get_daily_claim_stats_today').single<OverviewRpcResult>();

        if (error || !data) {
          console.warn(
            '⚠️ [ANALYTICS API] Error fetching overview (database function may not exist). Using fallback resolver:',
            error?.message
          );
          const fallbackOverview = await buildOverviewFallback(supabase);
          return NextResponse.json({
            success: true,
            data: fallbackOverview
          });
        }

        return NextResponse.json({
          success: true,
          data: {
            totalClaims: data.total_claims,
            uniqueClaimers: data.unique_claimers,
            successfulClaims: data.successful_claims,
            rejectedClaims: data.rejected_claims,
            avgTimeToClaimMinutes: data.avg_time_to_claim_minutes ?? 0,
            medianTimeToClaimMinutes: data.median_time_to_claim_minutes ?? 0,
            totalXpAwarded: data.total_xp_awarded,
            avgProcessingTimeMs: data.avg_processing_time_ms ?? 0
          }
        });
      }

      case 'breakdown': {
        // Get event type breakdown
        const { data, error } = await supabase.rpc('get_claim_event_breakdown_today');

        if (error || !data) {
          console.warn(
            '⚠️ [ANALYTICS API] Error fetching breakdown (database function may not exist). Using fallback resolver:',
            error?.message
          );
          const fallbackBreakdown = await buildBreakdownFallback(supabase);
          return NextResponse.json({
            success: true,
            data: fallbackBreakdown
          });
        }

        return NextResponse.json({
          success: true,
          data: ((data || []) as BreakdownRpcRow[]).map((row) => ({
            eventType: row.event_type,
            count: row.count,
            percentage: Number(row.percentage ?? 0)
          }))
        });
      }

      case 'squads': {
        // Get top squads
        const { data, error } = await supabase.rpc('get_top_squads_by_claims_today', { p_limit: limit });

        if (error || !data) {
          console.warn(
            '⚠️ [ANALYTICS API] Error fetching squads (database function may not exist). Using fallback resolver:',
            error?.message
          );
          const fallbackSquads = await buildTopSquadsFallback(supabase, limit);
          return NextResponse.json({
            success: true,
            data: fallbackSquads
          });
        }

        return NextResponse.json({
          success: true,
          data: ((data || []) as SquadRpcRow[]).map((row) => ({
            squad: row.squad ?? 'No Squad',
            totalClaims: row.total_claims,
            uniqueMembers: row.unique_members,
            totalXpAwarded: row.total_xp_awarded,
            avgTimeToClaimMinutes: row.avg_time_to_claim_minutes ?? 0
          }))
        });
      }

      case 'time-distribution': {
        // Get time-to-claim distribution (hourly)
        const { data, error } = await supabase
          .rpc('get_time_to_claim_distribution_today');

        if (error) {
          console.error('❌ [ANALYTICS API] Error fetching time distribution:', error);
          return NextResponse.json(
            { error: 'Failed to fetch time distribution', details: error.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: data.map((row: any) => ({
            hourBucket: row.hour_bucket,
            claimCount: row.claim_count,
            percentage: row.percentage
          }))
        });
      }

      case 'streak-distribution': {
        // Get streak distribution
        const { data, error } = await supabase
          .rpc('get_streak_distribution_today');

        if (error) {
          console.error('❌ [ANALYTICS API] Error fetching streak distribution:', error);
          return NextResponse.json(
            { error: 'Failed to fetch streak distribution', details: error.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: data.map((row: any) => ({
            streakDays: row.streak_days,
            userCount: row.user_count,
            percentage: row.percentage
          }))
        });
      }

      case 'trend': {
        // Get historical trend
        const { data, error } = await supabase
          .rpc('get_daily_claim_trend', { p_days: days });

        if (error) {
          console.error('❌ [ANALYTICS API] Error fetching trend:', error);
          return NextResponse.json(
            { error: 'Failed to fetch trend data', details: error.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: data.map((row: any) => ({
            date: row.date,
            totalClaims: row.total_claims,
            uniqueClaimers: row.unique_claimers,
            successfulClaims: row.successful_claims,
            rejectedClaims: row.rejected_claims,
            totalXpAwarded: row.total_xp_awarded
          }))
        });
      }

      default: {
        return NextResponse.json(
          { error: 'Invalid analytics type. Valid types: overview, breakdown, squads, time-distribution, streak-distribution, trend' },
          { status: 400 }
        );
      }
    }

  } catch (error) {
    console.error('❌ [ANALYTICS API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

