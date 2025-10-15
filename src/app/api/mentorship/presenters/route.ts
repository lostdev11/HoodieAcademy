import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/mentorship/presenters
 * 
 * Get all active presenters (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching active presenters');

    const { data, error } = await supabase
      .from('active_presenters')
      .select('*')
      .order('granted_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching presenters:', error);
      return NextResponse.json(
        { error: 'Failed to fetch presenters' },
        { status: 500 }
      );
    }

    console.log('✅ Found presenters:', data?.length || 0);
    return NextResponse.json({ presenters: data || [] });

  } catch (error) {
    console.error('💥 Error in presenters API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mentorship/presenters
 * 
 * Grant presenter role to a user (admin only)
 * 
 * Request body:
 * {
 *   "wallet_address": "string",
 *   "role_name": "admin" | "mentor" | "presenter",
 *   "can_create_sessions": boolean,
 *   "can_go_live": boolean,
 *   "assigned_by": "admin_wallet",
 *   "expires_days": number (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      wallet_address,
      role_name = 'presenter',
      can_create_sessions = true,
      can_go_live = true,
      assigned_by,
      expires_days
    } = body;

    if (!wallet_address || !assigned_by) {
      return NextResponse.json(
        { error: 'Missing required fields: wallet_address, assigned_by' },
        { status: 400 }
      );
    }

    // Verify admin making the request
    const { data: adminCheck } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', assigned_by)
      .single();

    if (!adminCheck?.is_admin) {
      return NextResponse.json(
        { error: 'Only admins can grant presenter roles' },
        { status: 403 }
      );
    }

    console.log('👤 Granting presenter role:', { wallet_address, role_name, assigned_by });

    // Grant role using database function
    const { data: roleId, error: grantError } = await supabase
      .rpc('grant_presenter_role', {
        p_wallet_address: wallet_address,
        p_role_name: role_name,
        p_can_create_sessions: can_create_sessions,
        p_can_go_live: can_go_live,
        p_assigned_by: assigned_by,
        p_expires_days: expires_days
      });

    if (grantError) {
      console.error('❌ Error granting role:', grantError);
      return NextResponse.json(
        { error: 'Failed to grant presenter role' },
        { status: 500 }
      );
    }

    console.log('✅ Presenter role granted:', roleId);

    return NextResponse.json({
      success: true,
      message: 'Presenter role granted',
      role_id: roleId,
      wallet_address: wallet_address
    }, { status: 201 });

  } catch (error) {
    console.error('💥 Error granting presenter role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mentorship/presenters
 * 
 * Revoke presenter role (admin only)
 * 
 * Request body:
 * {
 *   "wallet_address": "string",
 *   "admin_wallet": "string"
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address, admin_wallet } = body;

    if (!wallet_address || !admin_wallet) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify admin
    const { data: adminCheck } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', admin_wallet)
      .single();

    if (!adminCheck?.is_admin) {
      return NextResponse.json(
        { error: 'Only admins can revoke presenter roles' },
        { status: 403 }
      );
    }

    console.log('🗑️ Revoking presenter role:', wallet_address);

    // Revoke role
    const { data: revoked, error: revokeError } = await supabase
      .rpc('revoke_presenter_role', {
        p_wallet_address: wallet_address
      });

    if (revokeError) {
      console.error('❌ Error revoking role:', revokeError);
      return NextResponse.json(
        { error: 'Failed to revoke presenter role' },
        { status: 500 }
      );
    }

    console.log('✅ Presenter role revoked');

    return NextResponse.json({
      success: true,
      message: 'Presenter role revoked'
    });

  } catch (error) {
    console.error('💥 Error revoking presenter role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

