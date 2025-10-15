import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/wallet/verify
 * 
 * Validates if a wallet address is allowed to connect
 * Used by the hybrid approach to verify localStorage wallet
 * 
 * Request body:
 * {
 *   "wallet": "wallet_address_here"
 * }
 * 
 * Response:
 * {
 *   "valid": true/false,
 *   "isAdmin": true/false,
 *   "reason": "explanation"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet } = body;

    // Validate request
    if (!wallet || typeof wallet !== 'string') {
      return NextResponse.json(
        { 
          valid: false, 
          isAdmin: false,
          reason: 'Invalid wallet address provided' 
        },
        { status: 400 }
      );
    }

    console.log('🔍 Verifying wallet:', wallet);

    // Check if wallet is allowed using the database function
    const { data, error } = await supabase
      .rpc('verify_wallet_allowed', { p_wallet_address: wallet });

    if (error) {
      console.error('❌ Error verifying wallet:', error);
      
      // Fallback: Check users table directly
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('wallet_address, is_admin, banned')
        .eq('wallet_address', wallet)
        .maybeSingle();

      if (userError) {
        console.error('❌ Error checking user:', userError);
        // If DB is having issues, allow the connection (fail open)
        return NextResponse.json({
          valid: true,
          isAdmin: false,
          reason: 'Database check failed, allowing connection'
        });
      }

      // If user doesn't exist, it's a new wallet - allow it
      if (!userData) {
        console.log('✅ New wallet, allowing connection');
        return NextResponse.json({
          valid: true,
          isAdmin: false,
          reason: 'New wallet'
        });
      }

      // If user exists, check if banned
      const isBanned = userData.banned === true;
      
      if (isBanned) {
        console.log('⛔ Wallet is banned');
        
        // Log the failed verification
        await supabase.rpc('log_wallet_connection', {
          p_wallet_address: wallet,
          p_action: 'verify',
          p_success: false,
          p_ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          p_user_agent: request.headers.get('user-agent') || 'unknown',
          p_metadata: { reason: 'Wallet is banned' }
        });

        return NextResponse.json({
          valid: false,
          isAdmin: false,
          reason: 'Wallet is banned'
        });
      }

      return NextResponse.json({
        valid: true,
        isAdmin: userData.is_admin || false,
        reason: 'Allowed'
      });
    }

    // Use the function result
    const result = data?.[0];
    const isValid = result?.allowed === true;
    const isAdmin = result?.is_admin === true;
    const reason = result?.reason || 'Unknown';

    console.log('✅ Wallet verification result:', { isValid, isAdmin, reason });

    // Log successful verification
    if (isValid) {
      await supabase.rpc('log_wallet_connection', {
        p_wallet_address: wallet,
        p_action: 'verify',
        p_success: true,
        p_ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        p_user_agent: request.headers.get('user-agent') || 'unknown',
        p_metadata: { reason }
      });
    }

    return NextResponse.json({
      valid: isValid,
      isAdmin: isAdmin,
      reason: reason
    });

  } catch (error) {
    console.error('💥 Wallet verification error:', error);
    
    // On error, fail open (allow connection) to prevent lockout
    return NextResponse.json({
      valid: true,
      isAdmin: false,
      reason: 'Verification error, allowing connection'
    }, { status: 200 }); // Return 200 to prevent client errors
  }
}

// GET method for health check
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/wallet/verify',
    method: 'POST',
    status: 'active',
    description: 'Validates wallet addresses for connection'
  });
}

