import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('📡 [USERS API] Fetching all users...');
    
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [USERS API] Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ [USERS API] Fetched users:', users?.length || 0);
    return NextResponse.json(users || []);
  } catch (error) {
    console.error('❌ [USERS API] Error in users API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wallet_address, display_name, squad } = body;
    
    if (!wallet_address) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    console.log('📡 [USERS API] Creating/updating user:', wallet_address);

    // Check if wallet is admin
    const adminWallets = [
      'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
      'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
      '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
      '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
    ];
    
    const isAdmin = adminWallets.includes(wallet_address);

    const userData = {
      wallet_address,
      display_name: display_name || `User ${wallet_address.slice(0, 6)}...`,
      squad: squad || null,
      last_active: new Date().toISOString(),
      is_admin: isAdmin,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: user, error } = await supabase
      .from('users')
      .upsert(userData, { 
        onConflict: 'wallet_address',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [USERS API] Error creating/updating user:', error);
      return NextResponse.json(
        { error: 'Failed to create/update user', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ [USERS API] User created/updated successfully:', user);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('❌ [USERS API] Error in users POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}