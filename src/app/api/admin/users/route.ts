import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    console.log('[ADMIN USERS API] Fetching users for admin dashboard...');

    // For now, return demo users to show the interface working
    // TODO: Replace with real database queries once tables are set up
    const demoUsers = [
      {
        id: 'demo_user_1',
        wallet_address: 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
        display_name: 'Demo User 1',
        username: 'demo_user_1',
        squad: 'hoodie-creators',
        total_xp: 1250,
        level: 15,
        profile_picture: null,
        bio: 'Demo user for testing the admin dashboard',
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        last_active: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        updated_at: new Date().toISOString()
      },
      {
        id: 'demo_user_2',
        wallet_address: 'DemoWallet1234567890123456789012345678901234567890',
        display_name: 'Demo User 2',
        username: 'demo_user_2',
        squad: 'hoodie-decoders',
        total_xp: 850,
        level: 12,
        profile_picture: null,
        bio: 'Another demo user for testing',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        last_active: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        updated_at: new Date().toISOString()
      },
      {
        id: 'demo_user_3',
        wallet_address: 'TestWallet9876543210987654321098765432109876543210',
        display_name: 'Demo User 3',
        username: 'demo_user_3',
        squad: 'hoodie-speakers',
        total_xp: 650,
        level: 8,
        profile_picture: null,
        bio: 'Third demo user for testing',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        last_active: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        updated_at: new Date().toISOString()
      }
    ];

    // Enrich users with submission data
    const enrichedUsers = demoUsers.map(user => ({
      ...user,
      submissions: [], // TODO: Add real submission data
      submissionStats: {
        total: Math.floor(Math.random() * 5),
        pending: Math.floor(Math.random() * 2),
        approved: Math.floor(Math.random() * 3),
        rejected: Math.floor(Math.random() * 1)
      },
      recentActivity: [],
      displayName: user.display_name,
      formattedWallet: `${user.wallet_address.slice(0, 8)}...${user.wallet_address.slice(-6)}`,
      lastActiveFormatted: new Date(user.last_active).toLocaleDateString(),
      joinedFormatted: new Date(user.created_at).toLocaleDateString()
    }));

    console.log('[ADMIN USERS API] Returning', enrichedUsers.length, 'demo users');

    return NextResponse.json({
      users: enrichedUsers,
      total: enrichedUsers.length,
      totalSubmissions: enrichedUsers.reduce((sum, user) => sum + user.submissionStats.total, 0),
      stats: {
        totalUsers: enrichedUsers.length,
        totalXP: enrichedUsers.reduce((sum, user) => sum + user.total_xp, 0),
        avgLevel: Math.round(enrichedUsers.reduce((sum, user) => sum + user.level, 0) / enrichedUsers.length),
        totalSubmissions: enrichedUsers.reduce((sum, user) => sum + user.submissionStats.total, 0),
        pendingSubmissions: enrichedUsers.reduce((sum, user) => sum + user.submissionStats.pending, 0)
      }
    });

  } catch (error) {
    console.error('[ADMIN USERS API ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}