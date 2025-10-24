import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
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
        const { data, error } = await supabase
          .rpc('get_daily_claim_stats_today')
          .single();

        if (error) {
          console.error('❌ [ANALYTICS API] Error fetching overview:', error);
          return NextResponse.json(
            { error: 'Failed to fetch analytics overview', details: error.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            totalClaims: data.total_claims,
            uniqueClaimers: data.unique_claimers,
            successfulClaims: data.successful_claims,
            rejectedClaims: data.rejected_claims,
            avgTimeToClaimMinutes: data.avg_time_to_claim_minutes,
            medianTimeToClaimMinutes: data.median_time_to_claim_minutes,
            totalXpAwarded: data.total_xp_awarded,
            avgProcessingTimeMs: data.avg_processing_time_ms
          }
        });
      }

      case 'breakdown': {
        // Get event type breakdown
        const { data, error } = await supabase
          .rpc('get_claim_event_breakdown_today');

        if (error) {
          console.error('❌ [ANALYTICS API] Error fetching breakdown:', error);
          return NextResponse.json(
            { error: 'Failed to fetch event breakdown', details: error.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: data.map((row: any) => ({
            eventType: row.event_type,
            count: row.count,
            percentage: row.percentage
          }))
        });
      }

      case 'squads': {
        // Get top squads
        const { data, error } = await supabase
          .rpc('get_top_squads_by_claims_today', { p_limit: limit });

        if (error) {
          console.error('❌ [ANALYTICS API] Error fetching squads:', error);
          return NextResponse.json(
            { error: 'Failed to fetch squad analytics', details: error.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: data.map((row: any) => ({
            squad: row.squad,
            totalClaims: row.total_claims,
            uniqueMembers: row.unique_members,
            totalXpAwarded: row.total_xp_awarded,
            avgTimeToClaimMinutes: row.avg_time_to_claim_minutes
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

