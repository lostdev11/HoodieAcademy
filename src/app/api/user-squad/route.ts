import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/user-squad
 * Get user's current squad and lock status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet_address');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('squad, squad_id, squad_selected_at, squad_lock_end_date, squad_change_count')
      .eq('wallet_address', walletAddress)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user squad:', error);
      return NextResponse.json(
        { error: 'Failed to fetch squad data' },
        { status: 500 }
      );
    }

    if (!user || !user.squad) {
      return NextResponse.json({
        hasSquad: false,
        squad: null,
        isLocked: false,
        remainingDays: 0
      });
    }

    // Check if squad is locked
    const lockEndDate = user.squad_lock_end_date ? new Date(user.squad_lock_end_date) : null;
    const now = new Date();
    const isLocked = lockEndDate ? now < lockEndDate : false;
    
    let remainingDays = 0;
    if (isLocked && lockEndDate) {
      const diffTime = lockEndDate.getTime() - now.getTime();
      remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return NextResponse.json({
      hasSquad: true,
      squad: {
        name: user.squad,
        id: user.squad_id,
        selectedAt: user.squad_selected_at,
        lockEndDate: user.squad_lock_end_date,
        changeCount: user.squad_change_count || 0
      },
      isLocked,
      remainingDays
    });
  } catch (error) {
    console.error('Error in GET /api/user-squad:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user-squad
 * Update user's squad selection with 30-day lock
 * Can also be used to renew current squad for another 30 days
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address, squad, squad_id, renew } = body;

    if (!wallet_address || !squad || !squad_id) {
      return NextResponse.json(
        { error: 'Wallet address, squad name, and squad ID are required' },
        { status: 400 }
      );
    }

    // First, check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('squad, squad_lock_end_date, squad_change_count')
      .eq('wallet_address', wallet_address)
      .single();

    // If renewing current squad, allow it even if locked
    if (renew && existingUser) {
      if (existingUser.squad !== squad) {
        return NextResponse.json(
          { error: 'Can only renew your current squad' },
          { status: 400 }
        );
      }
      
      // Calculate new lock end date (30 days from now)
      const lockEndDate = new Date();
      lockEndDate.setDate(lockEndDate.getDate() + 30);

      const { data, error } = await supabase
        .from('users')
        .update({
          squad_lock_end_date: lockEndDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', wallet_address)
        .select()
        .single();

      if (error) {
        console.error('Error renewing squad:', error);
        return NextResponse.json(
          { error: 'Failed to renew squad' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Squad renewed successfully',
        squad: {
          name: squad,
          id: squad_id,
          selectedAt: data.squad_selected_at,
          lockEndDate: data.squad_lock_end_date,
          changeCount: data.squad_change_count
        },
        lockEndDate: lockEndDate.toISOString(),
        renewed: true
      });
    }

    // Check if squad is currently locked (only for non-renewals and when changing squads)
    // Allow first-time selection even if somehow there's a lock
    // Only block if user is trying to CHANGE to a different squad while locked
    const isFirstSelection = !existingUser || !existingUser.squad;
    const isChangingSquad = existingUser && existingUser.squad && existingUser.squad !== squad;
    
    if (!isFirstSelection && isChangingSquad && existingUser.squad_lock_end_date && !renew) {
      const lockEndDate = new Date(existingUser.squad_lock_end_date);
      const now = new Date();
      
      // Only block if lock is still active (in the future)
      if (now < lockEndDate) {
        const diffTime = lockEndDate.getTime() - now.getTime();
        const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return NextResponse.json(
          { 
            error: 'Squad is locked',
            message: `Your squad is locked for ${remainingDays} more days`,
            remainingDays,
            lockEndDate: lockEndDate.toISOString()
          },
          { status: 423 } // 423 Locked
        );
      }
    }

    // Calculate new lock end date (30 days from now)
    const lockEndDate = new Date();
    lockEndDate.setDate(lockEndDate.getDate() + 30);

    let data;
    let updateError;

    // Update or insert user squad data
    if (existingUser) {
      // User exists - UPDATE
      const { data: updateData, error } = await supabase
        .from('users')
        .update({
          squad,
          squad_id,
          squad_selected_at: new Date().toISOString(),
          squad_lock_end_date: lockEndDate.toISOString(),
          squad_change_count: (existingUser.squad ? (existingUser.squad_change_count || 0) + 1 : 1),
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', wallet_address)
        .select()
        .single();
      
      data = updateData;
      updateError = error;
    } else {
      // User doesn't exist - INSERT
      const { data: insertData, error } = await supabase
        .from('users')
        .insert({
          wallet_address,
          squad,
          squad_id,
          squad_selected_at: new Date().toISOString(),
          squad_lock_end_date: lockEndDate.toISOString(),
          squad_change_count: 1,
          total_xp: 0,
          level: 1,
          streak: 0,
          is_admin: false,
          banned: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      data = insertData;
      updateError = error;
    }

    if (updateError) {
      console.error('Error updating user squad:', updateError);
      return NextResponse.json(
        { error: 'Failed to update squad', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('✅ Squad saved successfully:', { wallet_address, squad, squad_id });

    return NextResponse.json({
      success: true,
      message: 'Squad updated successfully',
      squad: {
        name: squad,
        id: squad_id,
        selectedAt: data.squad_selected_at,
        lockEndDate: data.squad_lock_end_date,
        changeCount: data.squad_change_count
      },
      lockEndDate: lockEndDate.toISOString(),
      isFirstSelection: existingUser === null || !existingUser.squad
    });
  } catch (error) {
    console.error('Error in POST /api/user-squad:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

