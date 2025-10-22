import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * DELETE /api/admin/users/delete
 * Delete a user and all their associated data (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { admin_wallet, target_wallet } = body;

    console.log('[USER DELETE] Request:', {
      admin_wallet,
      target_wallet
    });

    // Validate required fields
    if (!admin_wallet || !target_wallet) {
      return NextResponse.json(
        { error: 'admin_wallet and target_wallet are required' },
        { status: 400 }
      );
    }

    // Check if user is admin
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', admin_wallet)
      .single();

    if (adminError || !admin?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Prevent admin from deleting themselves
    if (admin_wallet === target_wallet) {
      return NextResponse.json(
        { error: 'Cannot delete your own admin account' },
        { status: 400 }
      );
    }

    // Get user details before deletion for logging
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('wallet_address, display_name, username, total_xp')
      .eq('wallet_address', target_wallet)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user from database
    // Note: This will cascade delete related records if foreign keys are set up properly
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('wallet_address', target_wallet);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete user', details: deleteError.message },
        { status: 500 }
      );
    }

    // Log the deletion activity
    try {
      await supabase
        .from('user_activity')
        .insert({
          wallet_address: admin_wallet,
          activity_type: 'user_deleted',
          activity_data: {
            deleted_user: target_wallet,
            deleted_user_name: targetUser.display_name || targetUser.username,
            deleted_user_xp: targetUser.total_xp,
            deleted_by: admin_wallet,
            deleted_at: new Date().toISOString()
          }
        });
    } catch (logError) {
      console.warn('Failed to log user deletion:', logError);
    }

    console.log('[USER DELETED]', {
      target_wallet,
      deleted_by: admin_wallet,
      user_name: targetUser.display_name || targetUser.username
    });

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.display_name || targetUser.username || 'deleted'} has been removed`,
      deleted_user: {
        wallet_address: targetUser.wallet_address,
        display_name: targetUser.display_name,
        username: targetUser.username
      }
    });

  } catch (error) {
    console.error('Error in DELETE /api/admin/users/delete:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

