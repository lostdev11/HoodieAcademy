import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { wallet } = await req.json();

    if (!wallet) {
      return NextResponse.json({ 
        valid: false, 
        reason: 'Wallet address is required' 
      }, { status: 400 });
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if wallet is banned or has any restrictions
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('wallet_address, is_banned, admin_status')
      .eq('wallet_address', wallet)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      // If there's an error other than "not found", return invalid
      return NextResponse.json({ 
        valid: false, 
        reason: 'Database error' 
      }, { status: 500 });
    }

    // If user exists and is banned
    if (userData && userData.is_banned) {
      return NextResponse.json({ 
        valid: false, 
        reason: 'Wallet is banned',
        isAdmin: false
      });
    }

    // Check if wallet is admin
    const isAdmin = userData?.admin_status === 'admin' || userData?.admin_status === 'super_admin';

    // Wallet is valid
    return NextResponse.json({ 
      valid: true,
      isAdmin: isAdmin,
      reason: 'Wallet is valid'
    });

  } catch (error) {
    console.error('Wallet validation error:', error);
    return NextResponse.json({ 
      valid: false, 
      reason: 'Internal server error' 
    }, { status: 500 });
  }
}
