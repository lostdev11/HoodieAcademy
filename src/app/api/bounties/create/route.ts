import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, short_desc, reward, deadline, status, squad_tag, walletAddress } = body;

    // Validate required fields
    if (!title || !walletAddress) {
      return NextResponse.json(
        { error: 'Title and wallet address are required' },
        { status: 400 }
      );
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError || !userData?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Create bounty
    const bountyData = {
      title,
      short_desc,
      reward,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      status: status || 'active',
      squad_tag,
      hidden: false,
      submissions: 0
      // Temporarily removed created_by to fix schema cache issue
    };

    const { data: bounty, error: bountyError } = await supabase
      .from('bounties')
      .insert([bountyData])
      .select()
      .single();

    if (bountyError) {
      console.error('Error creating bounty:', bountyError);
      return NextResponse.json(
        { error: 'Failed to create bounty', details: bountyError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, bounty });
  } catch (error) {
    console.error('Error in bounty creation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
