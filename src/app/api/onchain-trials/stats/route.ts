import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json(
      { success: false, error: 'Missing wallet parameter' },
      { status: 400 }
    );
  }

  try {
    const supabase = createSupabaseServerClient();

    // you can either read directly from players table
    // or from a view; here we read players then compute successRate
    const { data, error } = await supabase
      .from('onchain_trials_players')
      .select('*')
      .eq('wallet', wallet)
      .single();

    if (error || !data) {
      console.error('Error fetching player stats:', error);
      return NextResponse.json(
        { success: true, stats: null }, // treat as no stats yet
        { status: 200 }
      );
    }

    const totalGames = data.total_games ?? 0;
    const totalWins = data.total_wins ?? 0;
    const successRate =
      totalGames > 0 ? Number(((totalWins / totalGames) * 100).toFixed(2)) : 0;

    const stats = {
      wallet: data.wallet,
      username: data.username,
      totalGames,
      totalWins,
      bestScoreMs: data.best_score_ms,
      currentStreak: data.current_streak ?? 0,
      longestStreak: data.longest_streak ?? 0,
      successRate,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (err) {
    console.error('Stats route error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

