import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowser } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseBrowser();

    // Fetch leaderboard data from Supabase
    const { data, error } = await supabase
      .from('onchain_trials_scores')
      .select('id, wallet, username, best_score, success_rate, streak, created_at')
      .order('streak', { ascending: false })
      .order('success_rate', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      
      // If table doesn't exist, return empty array (graceful degradation)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({
          success: true,
          leaderboard: [],
          message: 'Leaderboard table not yet created. Please run the SQL migration.'
        });
      }

      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch leaderboard',
          details: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      leaderboard: data || []
    });
  } catch (error) {
    console.error('Unexpected error in leaderboard API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

