import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { 
      title, 
      short_desc, 
      reward, 
      reward_type,
      start_date, 
      deadline, 
      status, 
      hidden, 
      squad_tag, 
      walletAddress 
    } = body;

    // Validate required fields
    if (!title || !short_desc || !reward || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Update bounty
    const bountyData = {
      title,
      short_desc,
      reward,
      reward_type: reward_type || 'XP',
      start_date: start_date ? new Date(start_date).toISOString() : null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      status: status || 'active',
      hidden: hidden || false,
      squad_tag: squad_tag || null,
      updated_at: new Date().toISOString()
    };

    const { data: bounty, error: bountyError } = await supabase
      .from('bounties')
      .update(bountyData)
      .eq('id', params.id)
      .select()
      .single();

    if (bountyError) {
      console.error('Error updating bounty:', bountyError);
      return NextResponse.json(
        { error: 'Failed to update bounty', details: bountyError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, bounty });
  } catch (error) {
    console.error('Error in bounty update API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
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

    // Delete bounty
    const { error: deleteError } = await supabase
      .from('bounties')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error deleting bounty:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete bounty', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in bounty delete API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}