import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { isAdminForUser } from '@/lib/admin';

// Initialize Supabase client with service role for admin operations
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

const BountyUpdate = z.object({
  title: z.string().min(3).optional(),
  short_desc: z.string().optional(),
  reward: z.string().optional(),
  reward_type: z.enum(['XP', 'SOL', 'NFT']).optional(),
  start_date: z.string().nullable().or(z.literal('')).transform(val => val === '' ? null : val).optional(),
  deadline: z.string().nullable().or(z.literal('')).transform(val => val === '' ? null : val).optional(),
  status: z.enum(['active', 'completed', 'expired']).optional(),
  squad_tag: z.string().nullable().or(z.literal('')).transform(val => val === '' || val === 'none' ? null : val).optional(),
  hidden: z.boolean().optional(),
  nft_prize: z.string().nullable().optional(),
  nft_prize_image: z.string().nullable().optional(),
  nft_prize_description: z.string().nullable().optional(),
  submissions: z.number().int().min(0).optional()
}).strip();

// Remove edge runtime to ensure proper environment variable access
// export const runtime = 'edge';

export async function GET(
  _: NextRequest, 
  { params }: { params: { id: string } }
) {
  console.log('🔍 [BOUNTY GET] Request received for bounty ID:', params.id);
  
  try {
    console.log('🔍 [BOUNTY GET] Creating Supabase client...');
    const supabase = getSupabaseClient();
    console.log('✅ [BOUNTY GET] Supabase client created');
    
    console.log('🔍 [BOUNTY GET] Querying database...');
    const { data, error } = await supabase
      .from('bounties')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (error) {
      console.error('❌ [BOUNTY GET] Database error:', error);
      return NextResponse.json({ error: 'Bounty not found', details: error.message }, { status: 404 });
    }
    
    console.log('✅ [BOUNTY GET] Bounty found:', data?.title || data?.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 [BOUNTY GET] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient();
    console.log('🔍 [BOUNTY UPDATE] PATCH request for bounty:', params.id);
    
    // Parse request body first to get wallet address if needed
    const body = await req.json();
    console.log('📦 [BOUNTY UPDATE] Request body:', JSON.stringify(body, null, 2));
    
    // Get wallet address from request header or body for wallet-based auth
    const walletAddress = req.headers.get('X-Wallet-Address') || req.headers.get('x-wallet-address') || body.walletAddress;
    console.log('🔍 [BOUNTY UPDATE] Wallet address from header/body:', walletAddress);
    console.log('🔍 [BOUNTY UPDATE] All headers:', Object.fromEntries(req.headers.entries()));
    
    // Check admin permissions - either via Supabase Auth or wallet-based
    let isAdmin = false;
    
    // Try auth-based check first
    try {
      isAdmin = await isAdminForUser(supabase);
      console.log('✅ [BOUNTY UPDATE] Auth-based admin check:', isAdmin);
    } catch (authError) {
      console.log('⚠️ [BOUNTY UPDATE] Auth-based check failed:', authError);
    }
    
    // If auth failed, try wallet-based check
    if (!isAdmin && walletAddress) {
      console.log('🔍 [BOUNTY UPDATE] Querying users table for wallet:', walletAddress);
      
      const { data: adminUser, error: walletError } = await supabase
        .from('users')
        .select('wallet_address, display_name, is_admin')
        .eq('wallet_address', walletAddress)
        .single();
      
      console.log('📊 [BOUNTY UPDATE] User query result:', { adminUser, walletError });
      
      isAdmin = adminUser?.is_admin || false;
      console.log('✅ [BOUNTY UPDATE] Wallet-based admin check:', isAdmin);
    } else if (!walletAddress) {
      console.log('⚠️ [BOUNTY UPDATE] No wallet address provided in header');
    }
    
    if (!isAdmin) {
      console.log('❌ [BOUNTY UPDATE] Admin check failed - not authorized');
      console.log('   Auth check:', false);
      console.log('   Wallet provided:', !!walletAddress);
      console.log('   Wallet check result:', isAdmin);
      return NextResponse.json({ 
        error: 'Forbidden - Admin access required',
        debug: {
          walletProvided: !!walletAddress,
          wallet: walletAddress ? `${walletAddress.slice(0, 8)}...` : 'none'
        }
      }, { status: 403 });
    }
    
    console.log('✅ [BOUNTY UPDATE] Admin check passed');
    
    // Remove walletAddress from body before validation (it's not part of the bounty schema)
    const { walletAddress: _, ...bountyData } = body;
    
    const parsed = BountyUpdate.safeParse(bountyData);
    if (!parsed.success) {
      console.error('❌ [BOUNTY UPDATE] Validation failed:', parsed.error.errors);
      console.error('❌ [BOUNTY UPDATE] Received data:', JSON.stringify(bountyData, null, 2));
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: parsed.error.errors,
        received: Object.keys(bountyData)
      }, { status: 400 });
    }
    
    console.log('✅ [BOUNTY UPDATE] Validation passed. Updating fields:', Object.keys(parsed.data));
    
    const { data, error } = await supabase
      .from('bounties')
      .update(parsed.data)
      .eq('id', params.id)
      .select('*')
      .single();
    
    if (error) {
      console.error('❌ [BOUNTY UPDATE] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    console.log('✅ [BOUNTY UPDATE] Bounty updated successfully');
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 [BOUNTY UPDATE] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Add PUT method to handle legacy calls
export async function PUT(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  // Just forward to PATCH
  return PATCH(req, { params });
}

export async function DELETE(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient();
    console.log('🔍 [BOUNTY DELETE] DELETE request for bounty:', params.id);
    
    // Get wallet address from query params or header
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('walletAddress') || req.headers.get('X-Wallet-Address') || req.headers.get('x-wallet-address');
    console.log('🔍 [BOUNTY DELETE] Wallet address:', walletAddress);
    
    // Check admin permissions
    let isAdmin = false;
    
    // Try auth-based check first
    try {
      isAdmin = await isAdminForUser(supabase);
      console.log('✅ [BOUNTY DELETE] Auth-based admin check:', isAdmin);
    } catch (authError) {
      console.log('⚠️ [BOUNTY DELETE] Auth-based check failed:', authError);
    }
    
    // If auth failed, try wallet-based check
    if (!isAdmin && walletAddress) {
      console.log('🔍 [BOUNTY DELETE] Querying users table for wallet:', walletAddress);
      
      const { data: adminUser, error: walletError } = await supabase
        .from('users')
        .select('wallet_address, display_name, is_admin')
        .eq('wallet_address', walletAddress)
        .single();
      
      console.log('📊 [BOUNTY DELETE] User query result:', { adminUser, walletError });
      
      isAdmin = adminUser?.is_admin || false;
      console.log('✅ [BOUNTY DELETE] Wallet-based admin check:', isAdmin);
    }
    
    if (!isAdmin) {
      console.log('❌ [BOUNTY DELETE] Admin check failed - not authorized');
      return NextResponse.json({ 
        error: 'Forbidden - Admin access required',
        debug: {
          walletProvided: !!walletAddress,
          wallet: walletAddress ? `${walletAddress.slice(0, 8)}...` : 'none'
        }
      }, { status: 403 });
    }
    
    console.log('✅ [BOUNTY DELETE] Admin check passed, proceeding with deletion');
    
    const { error } = await supabase
      .from('bounties')
      .delete()
      .eq('id', params.id);
    
    if (error) {
      console.error('❌ [BOUNTY DELETE] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    console.log('✅ [BOUNTY DELETE] Bounty deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('💥 [BOUNTY DELETE] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}