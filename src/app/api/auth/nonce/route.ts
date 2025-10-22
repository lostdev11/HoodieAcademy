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

/**
 * GET /api/auth/nonce?wallet=<wallet_address>
 * 
 * Generates a one-time nonce for signature verification
 * This prevents replay attacks on daily login claims
 * 
 * @param wallet - The wallet address requesting a nonce
 * @returns { nonce: string, expiresAt: string, signatureMessage: string }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    console.log('🔑 [AUTH NONCE] Generating nonce for:', walletAddress.slice(0, 10) + '...');

    const supabase = getSupabaseClient();

    // Generate nonce using database function
    const { data, error } = await supabase
      .rpc('generate_auth_nonce', { p_wallet_address: walletAddress })
      .single();

    if (error) {
      console.error('❌ [AUTH NONCE] Error generating nonce:', error);
      return NextResponse.json(
        { error: 'Failed to generate nonce', details: error.message },
        { status: 500 }
      );
    }

    const { nonce, expires_at } = data;
    
    // Get current date in ISO format for signature message
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Create the signature message that the client should sign
    const signatureMessage = `Hoodie Academy Daily Claim • ${currentDate} • nonce:${nonce}`;

    console.log('✅ [AUTH NONCE] Nonce generated successfully');

    return NextResponse.json({
      nonce,
      expiresAt: expires_at,
      signatureMessage,
      walletAddress
    });

  } catch (error) {
    console.error('❌ [AUTH NONCE] Error in nonce generation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/nonce/verify
 * 
 * Verifies a nonce and signature (for testing purposes)
 * The actual verification happens in the daily-login endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const { walletAddress, nonce, signature } = await request.json();

    if (!walletAddress || !nonce) {
      return NextResponse.json(
        { error: 'Wallet address and nonce are required' },
        { status: 400 }
      );
    }

    console.log('🔍 [AUTH NONCE] Verifying nonce for:', walletAddress.slice(0, 10) + '...');

    const supabase = getSupabaseClient();

    // Verify and mark nonce as used atomically
    const { data, error } = await supabase
      .rpc('verify_and_use_nonce', {
        p_wallet_address: walletAddress,
        p_nonce: nonce
      })
      .single();

    if (error) {
      console.error('❌ [AUTH NONCE] Error verifying nonce:', error);
      return NextResponse.json(
        { error: 'Failed to verify nonce', details: error.message },
        { status: 500 }
      );
    }

    const { valid, reason } = data;

    if (!valid) {
      console.log('⚠️ [AUTH NONCE] Nonce verification failed:', reason);
      return NextResponse.json(
        { 
          valid: false, 
          reason,
          error: 'Nonce verification failed'
        },
        { status: 401 }
      );
    }

    console.log('✅ [AUTH NONCE] Nonce verified successfully');

    return NextResponse.json({
      valid: true,
      reason,
      walletAddress
    });

  } catch (error) {
    console.error('❌ [AUTH NONCE] Error in nonce verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

