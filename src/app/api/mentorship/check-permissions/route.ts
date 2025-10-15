import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/mentorship/check-permissions
 * 
 * Check if a user has permission to go live
 * 
 * Request body:
 * {
 *   "wallet_address": "string",
 *   "session_id": "uuid" (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address, session_id } = body;

    if (!wallet_address) {
      return NextResponse.json(
        { error: 'Missing wallet_address' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking permissions:', { wallet_address, session_id });

    // First check if user is admin - admins have automatic access
    const { data: adminCheck } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', wallet_address)
      .single();

    if (adminCheck?.is_admin) {
      console.log('✅ User is admin - granting automatic access');
      return NextResponse.json({
        allowed: true,
        reason: 'Admin access',
        role: 'admin',
        wallet_address: wallet_address
      });
    }

    // Check mentorship permissions
    const { data, error } = await supabase
      .rpc('can_user_go_live', {
        p_wallet_address: wallet_address,
        p_session_id: session_id
      });

    if (error) {
      console.error('❌ Permission check error:', error);
      return NextResponse.json(
        { error: 'Permission check failed' },
        { status: 500 }
      );
    }

    const permission = data?.[0];

    console.log('✅ Permission result:', permission);

    return NextResponse.json({
      allowed: permission?.allowed || false,
      reason: permission?.reason || 'Unknown',
      role: permission?.role || 'none',
      wallet_address: wallet_address
    });

  } catch (error) {
    console.error('💥 Error checking permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

