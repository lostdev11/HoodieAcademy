import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/wallet/disconnect
 * 
 * Logs wallet disconnection events
 * Part of the hybrid approach - tracks when users disconnect
 * 
 * Request body:
 * {
 *   "wallet": "wallet_address_here",
 *   "reason": "user_initiated" | "session_expired" | "banned" (optional)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "disconnectionId": "uuid"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, reason = 'user_initiated' } = body;

    // Validate request
    if (!wallet || typeof wallet !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid wallet address provided' 
        },
        { status: 400 }
      );
    }

    console.log('🔌 Logging wallet disconnection:', wallet);

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Log the disconnection
    const { data: disconnectionId, error: logError } = await supabase
      .rpc('log_wallet_connection', {
        p_wallet_address: wallet,
        p_action: 'disconnect',
        p_success: true,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_metadata: { reason }
      });

    if (logError) {
      console.error('❌ Error logging disconnection:', logError);
      // Continue anyway - disconnection should still work
    }

    // Deactivate any active sessions for this wallet (optional)
    const { error: sessionError } = await supabase
      .from('wallet_sessions')
      .update({ is_active: false })
      .eq('wallet_address', wallet)
      .eq('is_active', true);

    if (sessionError) {
      console.error('❌ Error deactivating sessions:', sessionError);
      // Continue anyway
    }

    console.log('✅ Wallet disconnection logged:', {
      wallet,
      disconnectionId,
      reason
    });

    return NextResponse.json({
      success: true,
      disconnectionId: disconnectionId
    });

  } catch (error) {
    console.error('💥 Wallet disconnection logging error:', error);
    
    // Don't block disconnection even if logging fails
    return NextResponse.json({
      success: true,
      error: 'Logging failed but disconnection allowed'
    }, { status: 200 });
  }
}

// GET method for health check
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/wallet/disconnect',
    method: 'POST',
    status: 'active',
    description: 'Logs wallet disconnection events'
  });
}

