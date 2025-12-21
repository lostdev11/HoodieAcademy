import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { wallet, predictionType, stakeSol } = body as {
      wallet?: string;
      predictionType?: string;
      stakeSol?: number;
    };

    if (!wallet || !predictionType || typeof stakeSol !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Missing wallet, predictionType, or stakeSol' },
        { status: 400 }
      );
    }

    // Validate prediction type matches schema constraint
    if (!['beat_median_score', 'complete_under_time'].includes(predictionType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid predictionType. Must be "beat_median_score" or "complete_under_time"' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from('onchain_trials_predictions')
      .insert({
        wallet,
        prediction_type: predictionType,
        stake_amount: stakeSol, // Schema uses DECIMAL for SOL amount
        result: 'pending', // Default to pending
      })
      .select('id, prediction_type, stake_amount, created_at, locked_at')
      .single();

    if (error) {
      console.error('Error inserting prediction:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create prediction', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      prediction: data,
    });
  } catch (err) {
    console.error('Prediction route error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

