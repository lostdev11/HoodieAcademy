import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get wallet address from query parameters or headers
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    console.log('🔍 Admin auth check API called for wallet:', walletAddress);

    // Check admin status in database
    const { data, error } = await supabase
      .from('users')
      .select('wallet_address, is_admin, display_name, squad')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      console.log('❌ User not found:', walletAddress);
      return NextResponse.json(
        { wallet: walletAddress, isAdmin: false, user: null },
        { status: 200 }
      );
    }

    const isAdmin = !!data.is_admin;
    console.log('✅ Admin auth check response:', { 
      wallet: data.wallet_address, 
      isAdmin, 
      displayName: data.display_name,
      squad: data.squad
    });

    return NextResponse.json({
      wallet: data.wallet_address,
      isAdmin,
      user: {
        displayName: data.display_name,
        squad: data.squad
      }
    });

  } catch (error) {
    console.error('💥 Admin auth check API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle POST requests (for testing)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required in body' },
        { status: 400 }
      );
    }

    console.log('🔍 Admin auth check POST called for wallet:', walletAddress);

    // Check admin status in database
    const { data, error } = await supabase
      .from('users')
      .select('wallet_address, is_admin, display_name, squad')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      console.log('❌ User not found:', walletAddress);
      return NextResponse.json(
        { wallet: walletAddress, isAdmin: false, user: null },
        { status: 200 }
      );
    }

    const isAdmin = !!data.is_admin;
    console.log('✅ Admin auth check POST response:', { 
      wallet: data.wallet_address, 
      isAdmin, 
      displayName: data.display_name,
      squad: data.squad
    });

    return NextResponse.json({
      wallet: data.wallet_address,
      isAdmin,
      user: {
        displayName: data.display_name,
        squad: data.squad
      }
    });

  } catch (error) {
    console.error('💥 Admin auth check POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
