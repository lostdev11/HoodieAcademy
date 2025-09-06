import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const squad = searchParams.get('squad');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabase
      .from('bounties')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (squad && squad !== 'all') {
      query = query.eq('squad_tag', squad);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,short_desc.ilike.%${search}%`);
    }

    const { data: bounties, error } = await query;

    if (error) {
      console.error('Error fetching bounties:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bounties', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(bounties || []);
  } catch (error) {
    console.error('Error in bounties API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const body = await request.json();
    
    const { 
      title, 
      short_desc, 
      squad_tag, 
      reward, 
      reward_type = 'XP',
      start_date,
      deadline, 
      status = 'active', 
      hidden = false,
      walletAddress 
    } = body;
    
    if (!title || !short_desc || !reward || !walletAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
    
    const bountyData = {
      title,
      short_desc,
      squad_tag: squad_tag || null,
      reward,
      reward_type: reward_type || 'XP',
      start_date: start_date ? new Date(start_date).toISOString() : null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      status,
      hidden,
      submissions: 0, // Initialize with 0 submissions
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating bounty with data:', bountyData);
    
    const { data: bounty, error } = await supabase
      .from('bounties')
      .insert([bountyData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating bounty:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({ 
        error: 'Failed to create bounty', 
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }
    
    return NextResponse.json(bounty, { status: 201 });
  } catch (error) {
    console.error('Error in bounties POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Bounty ID is required' }, { status: 400 });
    }
    
    updateData.updated_at = new Date().toISOString();
    
    const { data: bounty, error } = await supabase
      .from('bounties')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating bounty:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(bounty);
  } catch (error) {
    console.error('Error in bounties PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Bounty ID is required' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('bounties')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting bounty:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in bounties DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
