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

    // Check admin status using RPC function (bypasses RLS issues)
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_wallet_admin', { 
      wallet: walletAddress 
    });

    if (adminError) {
      console.error('❌ Admin check error:', adminError);
      return NextResponse.json(
        { error: 'Admin check failed', details: adminError.message },
        { status: 500 }
      );
    }

    // Get user details if admin check passed
    let userDetails = null;
    if (isAdmin) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('wallet_address, display_name, squad')
          .eq('wallet_address', walletAddress)
          .single();
        
        if (!userError && userData) {
          userDetails = {
            displayName: userData.display_name,
            squad: userData.squad
          };
        }
      } catch (userErr) {
        console.warn('Could not fetch user details:', userErr);
      }
    }

    console.log('✅ Admin auth check response:', { 
      wallet: walletAddress, 
      isAdmin: !!isAdmin, 
      userDetails
    });

    return NextResponse.json({
      wallet: walletAddress,
      isAdmin: !!isAdmin,
      user: userDetails
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

    // Check admin status using RPC function (bypasses RLS issues)
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_wallet_admin', { 
      wallet: walletAddress 
    });

    if (adminError) {
      console.error('❌ Admin check error:', adminError);
      return NextResponse.json(
        { error: 'Admin check failed', details: adminError.message },
        { status: 500 }
      );
    }

    // Get user details if admin check passed
    let userDetails = null;
    if (isAdmin) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('wallet_address, display_name, squad')
          .eq('wallet_address', walletAddress)
          .single();
        
        if (!userError && userData) {
          userDetails = {
            displayName: userData.display_name,
            squad: userData.squad
          };
        }
      } catch (userErr) {
        console.warn('Could not fetch user details:', userErr);
      }
    }

    console.log('✅ Admin auth check POST response:', { 
      wallet: walletAddress, 
      isAdmin: !!isAdmin, 
      userDetails
    });

    return NextResponse.json({
      wallet: walletAddress,
      isAdmin: !!isAdmin,
      user: userDetails
    });

  } catch (error) {
    console.error('💥 Admin auth check POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
