import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
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

    // Get all users with their XP data
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        wallet_address,
        display_name,
        total_xp,
        last_active
      `)
      .order('total_xp', { ascending: false });

    if (usersError) {
      console.error('[FETCH USERS ERROR]', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get course completion counts for each user (handle missing table gracefully)
    const { data: courseCompletions, error: courseError } = await supabase
      .from('course_completions')
      .select('wallet_address, course_id')
      .not('completed_at', 'is', null);

    if (courseError) {
      console.warn('[FETCH COURSE COMPLETIONS WARNING]', courseError.message);
      // Continue with empty data if table doesn't exist
    }

    // Get bounty submission counts for each user (handle missing table gracefully)
    const { data: bountySubmissions, error: bountyError } = await supabase
      .from('bounty_submissions')
      .select('wallet_address, placement');

    if (bountyError) {
      console.warn('[FETCH BOUNTY SUBMISSIONS WARNING]', bountyError.message);
      // Continue with empty data if table doesn't exist
    }

    // Calculate stats for each user
    const enrichedUsers = users?.map(user => {
      const completedCourses = courseCompletions?.filter(cc => cc.wallet_address === user.wallet_address).length || 0;
      const userSubmissions = bountySubmissions?.filter(bs => bs.wallet_address === user.wallet_address) || [];
      const bountyWins = userSubmissions.filter(sub => sub.placement).length;

      return {
        ...user,
        completed_courses: completedCourses,
        bounty_submissions: userSubmissions.length,
        bounty_wins: bountyWins,
        level: Math.floor((user.total_xp || 0) / 1000) + 1
      };
    }) || [];

    return NextResponse.json({
      users: enrichedUsers,
      total: enrichedUsers.length
    });

  } catch (error) {
    console.error('[ADMIN XP USERS API ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
