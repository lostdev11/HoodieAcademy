import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type PredictionRow = {
  id: string;
  wallet: string;
  prediction_type: string;
  stake_amount: number;
  game_score: number | null;
  result: 'win' | 'loss' | 'pending' | null;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { wallet, predictionId, scoreMs } = body as {
      wallet?: string;
      predictionId?: string | null;
      scoreMs?: number | null;
    };

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Missing wallet' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // If no predictionId provided, find the latest pending prediction for this wallet
    let prediction: PredictionRow | null = null;

    if (predictionId) {
      const { data, error: fetchError } = await supabase
        .from('onchain_trials_predictions')
        .select('*')
        .eq('id', predictionId)
        .single<PredictionRow>();

      if (fetchError || !data) {
        console.error('Prediction not found:', fetchError);
        return NextResponse.json(
          { success: false, error: 'Prediction not found' },
          { status: 404 }
        );
      }

      if (data.wallet !== wallet) {
        return NextResponse.json(
          { success: false, error: 'Wallet does not match prediction owner' },
          { status: 403 }
        );
      }

      if (data.result && data.result !== 'pending') {
        return NextResponse.json(
          { success: false, error: 'Prediction already settled' },
          { status: 400 }
        );
      }

      prediction = data;
    } else {
      // Find latest pending prediction for this wallet
      const { data, error: fetchError } = await supabase
        .from('onchain_trials_predictions')
        .select('*')
        .eq('wallet', wallet)
        .eq('result', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle<PredictionRow>();

      if (fetchError) {
        console.error('Error fetching prediction:', fetchError);
        return NextResponse.json(
          { success: false, error: 'Failed to find prediction' },
          { status: 500 }
        );
      }

      if (!data) {
        return NextResponse.json(
          { success: false, error: 'No pending prediction found' },
          { status: 404 }
        );
      }

      prediction = data;
    }

    // Handle "false start" / no score
    if (scoreMs == null) {
      const { error: updateError } = await supabase
        .from('onchain_trials_predictions')
        .update({
          game_score: null,
          result: 'loss',
        })
        .eq('id', prediction.id);

      if (updateError) {
        console.error('Error settling failed prediction:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to settle prediction' },
          { status: 500 }
        );
      }

      // Update player stats (count as a game attempt but no win)
      await upsertPlayerStats(supabase, wallet, null, false);

      const stats = await getPlayerStats(supabase, wallet);

      return NextResponse.json({
        success: true,
        settled: true,
        wasSuccess: false,
        stats,
      });
    }

    // Success logic: define thresholds by prediction type
    let wasSuccess = false;
    switch (prediction.prediction_type) {
      case 'complete_under_time':
        // For MVP, treat as "under 250ms" - adjust threshold as needed
        wasSuccess = scoreMs < 250;
        break;
      case 'beat_median_score':
        // For MVP, treat as "under 300ms" - later compute real median
        wasSuccess = scoreMs < 300;
        break;
      default:
        wasSuccess = false;
    }

    // Update the prediction row
    const { error: settleError } = await supabase
      .from('onchain_trials_predictions')
      .update({
        game_score: scoreMs,
        result: wasSuccess ? 'win' : 'loss',
      })
      .eq('id', prediction.id);

    if (settleError) {
      console.error('Error settling prediction:', settleError);
      return NextResponse.json(
        { success: false, error: 'Failed to settle prediction' },
        { status: 500 }
      );
    }

    // Update player stats (upsert)
    await upsertPlayerStats(supabase, wallet, scoreMs, wasSuccess);

    const stats = await getPlayerStats(supabase, wallet);

    return NextResponse.json({
      success: true,
      settled: true,
      wasSuccess,
      stats,
    });
  } catch (err) {
    console.error('Settle route error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper: upsert/update player stats based on the latest run.
 */
async function upsertPlayerStats(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  wallet: string,
  scoreMs: number | null,
  wasSuccess: boolean
) {
  // Fetch existing player from onchain_trials_scores
  const { data: existing, error } = await supabase
    .from('onchain_trials_scores')
    .select('*')
    .eq('wallet', wallet)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found
    console.error('Error fetching player stats:', error);
  }

  if (!existing) {
    // Insert new player row
    const successRate = wasSuccess ? 1.0 : 0.0;
    const currentStreak = wasSuccess ? 1 : 0;

    const { error: insertError } = await supabase.from('onchain_trials_scores').insert({
      wallet,
      best_score: scoreMs ?? 0,
      success_rate: successRate,
      streak: currentStreak,
    });

    if (insertError) {
      console.error('Error inserting player stats:', insertError);
    }

    return;
  }

  // Update existing row
  // Calculate new stats
  // Note: We don't have total_games/total_wins in schema, so we'll use success_rate and streak
  const prevStreak = existing.streak ?? 0;
  const newCurrentStreak = wasSuccess ? prevStreak + 1 : 0;

  let bestScore = existing.best_score ?? 0;
  if (scoreMs != null) {
    // Lower score is better (time in ms)
    if (bestScore === 0 || scoreMs < bestScore) {
      bestScore = scoreMs;
    }
  }

  // Calculate success rate (simplified - in production you'd count actual wins/losses)
  // For MVP, we'll update based on current streak as a proxy
  const successRate = newCurrentStreak > 0 ? Math.min(1.0, newCurrentStreak / 10.0) : 0.0;

  const { error: updateError } = await supabase
    .from('onchain_trials_scores')
    .update({
      best_score: bestScore,
      success_rate: successRate,
      streak: newCurrentStreak,
      updated_at: new Date().toISOString(),
    })
    .eq('wallet', wallet);

  if (updateError) {
    console.error('Error updating player stats:', updateError);
  }
}

/**
 * Helper: load player stats to feed your PlayerStats component.
 */
async function getPlayerStats(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  wallet: string
) {
  const { data, error } = await supabase
    .from('onchain_trials_players')
    .select('*')
    .eq('wallet', wallet)
    .single();

  if (error || !data) {
    console.error('Error fetching updated player stats:', error);
    return null;
  }

  const totalGames = data.total_games ?? 0;
  const totalWins = data.total_wins ?? 0;
  const successRate =
    totalGames > 0 ? Number(((totalWins / totalGames) * 100).toFixed(2)) : 0;

  // Transform to match PlayerStats interface
  return {
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
}

