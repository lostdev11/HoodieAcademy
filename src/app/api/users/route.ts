import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Get user data from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

    if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wallet_address, display_name, squad } = body;

    if (!wallet_address) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Upsert user data
    const { data: user, error } = await supabase
      .from('users')
      .upsert({
        wallet_address,
        display_name: display_name || `User ${wallet_address.slice(0, 6)}...`,
        squad: squad || null,
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'wallet_address'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting user:', error);
      return NextResponse.json({ error: 'Failed to create/update user' }, { status: 500 });
    }

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error in users POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
