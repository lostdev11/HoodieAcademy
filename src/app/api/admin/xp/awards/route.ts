import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Check if wallet is admin
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_wallet_admin', { 
      wallet: walletAddress 
    });

    if (adminError) {
      console.error('[ADMIN CHECK ERROR]', adminError);
      return NextResponse.json({ error: 'Failed to verify admin status' }, { status: 500 });
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get XP awards from user activity
    const { data: activities, error: activitiesError } = await supabase
      .from('user_activity')
      .select('*')
      .in('activity_type', ['xp_awarded', 'bounty_submission_approved', 'bounty_winner_awarded'])
      .order('created_at', { ascending: false })
      .limit(100);

    if (activitiesError) {
      console.error('[FETCH XP AWARDS ERROR]', activitiesError);
      return NextResponse.json({ error: 'Failed to fetch XP awards' }, { status: 500 });
    }

    // Transform activities into XP awards format
    const xpAwards = activities?.map(activity => ({
      id: activity.id,
      wallet_address: activity.wallet_address,
      xp_amount: activity.activity_data?.xp_awarded || activity.activity_data?.xp_bonus || 0,
      reason: activity.activity_data?.reason || activity.activity_type.replace(/_/g, ' '),
      awarded_by: activity.activity_data?.awarded_by || 'System',
      created_at: activity.created_at
    })).filter(award => award.xp_amount > 0) || [];

    return NextResponse.json({
      awards: xpAwards,
      total: xpAwards.length
    });

  } catch (error) {
    console.error('[ADMIN XP AWARDS API ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
