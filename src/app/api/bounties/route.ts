import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function GET(req: NextRequest) {
  try {
    
    const supabase = getSupabaseClient();
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const showHidden = searchParams.get('showHidden') === 'true';
    
    let query = supabase
      .from('bounties')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Only filter out hidden bounties if showHidden is not true
    if (!showHidden) {
      query = query.eq('hidden', false);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ [BOUNTIES GET] Database error:', error);
      return NextResponse.json({ 
        error: 'Database error', 
        details: error.message,
        code: error.code 
      }, { status: 400 });
    }
    
    console.log(`✅ [BOUNTIES GET] Retrieved ${data?.length || 0} bounties`);
    console.log('📋 [BOUNTIES GET] Sample bounty:', data?.[0]);
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('💥 [BOUNTIES GET] Unexpected error:', error);
    console.error('💥 [BOUNTIES GET] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('🎯 [BOUNTIES POST] Creating bounty...');
    const supabase = getSupabaseClient();
    
    const body = await req.json();
    const { 
      title, 
      short_desc, 
      reward, 
      reward_type = 'XP',
      start_date,
      deadline, 
      status = 'active', 
      squad_tag, 
      walletAddress,
      hidden = false,
      nft_prize,
      nft_prize_image,
      nft_prize_description
    } = body;

    console.log('📦 [BOUNTIES POST] Request data:', { 
      title, 
      short_desc, 
      reward, 
      reward_type,
      walletAddress: walletAddress ? `${walletAddress.slice(0, 8)}...` : 'none'
    });

    // Validate required fields
    if (!title || !walletAddress) {
      return NextResponse.json(
        { error: 'Title and wallet address are required' },
        { status: 400 }
      );
    }

    // Check if user is admin
    console.log('🔍 [BOUNTIES POST] Checking admin permissions...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError || !userData?.is_admin) {
      console.error('❌ [BOUNTIES POST] Admin check failed:', { userError, userData });
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.log('✅ [BOUNTIES POST] Admin check passed');

    // Create bounty with proper schema
    const bountyData = {
      title,
      short_desc,
      reward,
      reward_type,
      start_date: start_date ? new Date(start_date).toISOString() : null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      status,
      squad_tag: squad_tag === 'none' ? null : squad_tag,
      hidden,
      submissions: 0,
      nft_prize: reward_type === 'NFT' ? nft_prize : null,
      nft_prize_image: reward_type === 'NFT' ? nft_prize_image : null,
      nft_prize_description: reward_type === 'NFT' ? nft_prize_description : null
    };

    console.log('📝 [BOUNTIES POST] Inserting bounty:', bountyData);

    const { data: bounty, error: bountyError } = await supabase
      .from('bounties')
      .insert([bountyData])
      .select()
      .single();

    if (bountyError) {
      console.error('❌ [BOUNTIES POST] Database error:', bountyError);
      return NextResponse.json(
        { error: 'Failed to create bounty', details: bountyError.message },
        { status: 500 }
      );
    }

    console.log('✅ [BOUNTIES POST] Bounty created successfully:', bounty.id);
    return NextResponse.json({ success: true, bounty });
  } catch (error) {
    console.error('💥 [BOUNTIES POST] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}