import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * Helper to check if user is admin
 */
async function checkAdmin(walletAddress: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  
  // Check if wallet is in admin_wallets table
  const { data: adminWallet } = await supabase
    .from('admin_wallets')
    .select('wallet_address')
    .eq('wallet_address', walletAddress)
    .maybeSingle();

  if (adminWallet) return true;

  // Check if user has is_admin flag
  const { data: user } = await supabase
    .from('users')
    .select('is_admin')
    .eq('wallet_address', walletAddress)
    .maybeSingle();

  return !!user?.is_admin;
}

/**
 * GET /api/starter-pack/admin
 * Get all claims for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    const status = searchParams.get('status');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Verify admin access
    const isAdmin = await checkAdmin(walletAddress);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('starter_pack_claims')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: claims, error } = await query;

    if (error) {
      console.error('Error fetching claims:', error);
      return NextResponse.json(
        { error: 'Failed to fetch claims', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ claims: claims || [] });
  } catch (error) {
    console.error('Error in GET admin claims:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/starter-pack/admin
 * Approve or reject a claim
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { claimId, action, walletAddress, rejectionReason } = body;

    if (!claimId || !action || !walletAddress) {
      return NextResponse.json(
        { error: 'Claim ID, action, and wallet address are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Verify admin access
    const isAdmin = await checkAdmin(walletAddress);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get the claim
    const { data: claim, error: claimError } = await supabase
      .from('starter_pack_claims')
      .select('*')
      .eq('id', claimId)
      .single();

    if (claimError || !claim) {
      return NextResponse.json(
        { error: 'Claim not found', details: claimError?.message },
        { status: 404 }
      );
    }

    if (claim.status !== 'pending') {
      return NextResponse.json(
        { error: `Claim is already ${claim.status}` },
        { status: 400 }
      );
    }

    // Update claim status
    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected',
      updated_at: new Date().toISOString(),
    };

    if (action === 'approve') {
      updateData.approved_by = walletAddress;
      updateData.approved_at = new Date().toISOString();
    } else {
      updateData.rejected_by = walletAddress;
      updateData.rejected_at = new Date().toISOString();
      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }
    }

    const { data: updatedClaim, error: updateError } = await supabase
      .from('starter_pack_claims')
      .update(updateData)
      .eq('id', claimId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating claim:', updateError);
      return NextResponse.json(
        { error: 'Failed to update claim', details: updateError.message },
        { status: 500 }
      );
    }

    // If approved, trigger delivery (async - don't wait)
    if (action === 'approve') {
      // Trigger delivery worker in background
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/starter-pack/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId }),
      }).catch(err => {
        console.error('Error triggering delivery worker:', err);
      });
    }

    return NextResponse.json({
      success: true,
      claim: updatedClaim,
      message: action === 'approve' 
        ? 'Claim approved. Delivery will be processed shortly.'
        : 'Claim rejected.'
    });
  } catch (error) {
    console.error('Error in POST admin action:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

