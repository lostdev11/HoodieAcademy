import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowser } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Missing walletAddress parameter' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = getSupabaseBrowser();
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('retailstar_rewards')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('Error testing connection:', testError);
      return NextResponse.json(
        { error: 'Database connection test failed', details: testError },
        { status: 500 }
      );
    }

    // Get all rewards
    const { data: rewards, error: rewardsError } = await supabase
      .from('retailstar_rewards')
      .select('*')
      .limit(10);

    if (rewardsError) {
      console.error('Error getting rewards:', rewardsError);
      return NextResponse.json(
        { error: 'Failed to get rewards', details: rewardsError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      rewardsCount: rewards?.length || 0,
      sampleRewards: rewards || []
    });

  } catch (error) {
    console.error('Error in test API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
