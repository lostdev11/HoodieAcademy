import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { isAdminForUser } from '@/lib/admin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BountyUpdate = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  slug: z.string().optional(),
  reward_xp: z.number().int().min(1).optional(),
  status: z.enum(['draft','open','closed']).optional(),
  open_at: z.string().datetime().optional(),
  close_at: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  max_submissions: z.number().int().positive().optional(),
  allow_multiple_submissions: z.boolean().optional(),
  image_required: z.boolean().optional(),
  submission_type: z.enum(['text', 'image', 'both']).optional(),
  hidden: z.boolean().optional()  // ← Added hidden field
}).strip();  // ← Strip unknown fields instead of rejecting them

export const runtime = 'edge';

export async function GET(
  _: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    
    const { data, error } = await supabase
      .from('bounties')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (error) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching bounty:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 [BOUNTY UPDATE] PATCH request for bounty:', params.id);
    
    // Get wallet address from request header or body for wallet-based auth
    const walletAddress = req.headers.get('x-wallet-address');
    console.log('🔍 [BOUNTY UPDATE] Wallet address from header:', walletAddress);
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
    
    // Parse request body
    const body = await req.json();
    console.log('📦 [BOUNTY UPDATE] Request body:', JSON.stringify(body, null, 2));
    
    const parsed = BountyUpdate.safeParse(body);
    if (!parsed.success) {
      console.error('❌ [BOUNTY UPDATE] Validation failed:', parsed.error.flatten());
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: parsed.error.flatten() 
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
  _: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    // Check admin permissions
    const admin = await isAdminForUser(supabase);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { error } = await supabase
      .from('bounties')
      .delete()
      .eq('id', params.id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bounty:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}