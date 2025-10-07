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

    console.log('🧪 Test API: Testing dashboard data for wallet:', walletAddress.slice(0, 8) + '...');

    // Test basic user lookup
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    console.log('👤 Test API: User data:', user);
    console.log('❌ Test API: User error:', userError);

    // Test XP data
    const { data: userXP, error: xpError } = await supabase
      .from('user_xp')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    console.log('⭐ Test API: XP data:', userXP);
    console.log('❌ Test API: XP error:', xpError);

    // Return test data
    return NextResponse.json({
      success: true,
      walletAddress: walletAddress.slice(0, 8) + '...',
      user: user || null,
      userError: userError?.message || null,
      userXP: userXP || null,
      xpError: xpError?.message || null,
      message: 'Test API working - check server logs for details'
    });

  } catch (error) {
    console.error('💥 Test API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
