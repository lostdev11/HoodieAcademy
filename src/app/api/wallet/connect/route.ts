import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/wallet/connect
 * 
 * Logs wallet connection events and creates/updates user record
 * Part of the hybrid approach - localStorage for speed, API for audit trail
 * 
 * Request body:
 * {
 *   "wallet": "wallet_address_here",
 *   "provider": "phantom" | "solflare" (optional),
 *   "metadata": {} (optional)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "connectionId": "uuid",
 *   "isNewUser": true/false,
 *   "isAdmin": true/false
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, provider = 'phantom', metadata = {} } = body;

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

    console.log('🔗 Logging wallet connection:', wallet);

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check if user exists
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('wallet_address, is_admin, banned, xp')
      .eq('wallet_address', wallet)
      .maybeSingle();

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking user:', userCheckError);
    }

    const isNewUser = !existingUser;
    const isAdmin = existingUser?.is_admin || false;
    const isBanned = existingUser?.banned || false;

    // If user is banned, log failed connection and reject
    if (isBanned) {
      console.log('⛔ Banned wallet attempted to connect:', wallet);
      
      await supabase.rpc('log_wallet_connection', {
        p_wallet_address: wallet,
        p_action: 'connect',
        p_success: false,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_metadata: { ...metadata, provider, reason: 'Wallet is banned' }
      });

      return NextResponse.json({
        success: false,
        error: 'Wallet is banned',
        banned: true
      }, { status: 403 });
    }

    // Create or update user record
    if (isNewUser) {
      console.log('👤 Creating new user for wallet:', wallet);
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          wallet_address: wallet,
          is_admin: false,
          xp: 0,
          banned: false,
          last_active: new Date().toISOString(),
          last_verified: new Date().toISOString()
        });

      if (insertError) {
        console.error('❌ Error creating user:', insertError);
        // Continue anyway - connection logging is more important
      }
    } else {
      console.log('♻️ Updating existing user:', wallet);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          last_active: new Date().toISOString(),
          last_verified: new Date().toISOString()
        })
        .eq('wallet_address', wallet);

      if (updateError) {
        console.error('❌ Error updating user:', updateError);
        // Continue anyway
      }
    }

    // Log the connection using the database function
    const { data: connectionData, error: logError } = await supabase
      .rpc('log_wallet_connection', {
        p_wallet_address: wallet,
        p_action: 'connect',
        p_success: true,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_metadata: { ...metadata, provider, isNewUser }
      });

    if (logError) {
      console.error('❌ Error logging connection:', logError);
      // Continue anyway - don't block user connection
    }

    const connectionId = connectionData;

    console.log('✅ Wallet connection logged:', {
      wallet,
      connectionId,
      isNewUser,
      isAdmin
    });

    // Return success response
    return NextResponse.json({
      success: true,
      connectionId: connectionId,
      isNewUser: isNewUser,
      isAdmin: isAdmin,
      wallet: wallet
    });

  } catch (error) {
    console.error('💥 Wallet connection logging error:', error);
    
    // Don't block the user even if logging fails
    return NextResponse.json({
      success: true,
      error: 'Logging failed but connection allowed',
      connectionId: null
    }, { status: 200 });
  }
}

// GET method for health check
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/wallet/connect',
    method: 'POST',
    status: 'active',
    description: 'Logs wallet connection events and manages user records'
  });
}

