import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
 * GET /api/user-profile
 * Fetch complete user profile including squad, XP, level, and all related data
 * Query params:
 *   - wallet: User's wallet address (required)
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

    const supabase = getSupabaseClient();

    // Fetch user data from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json(
        { error: 'User not found', exists: false },
        { status: 404 }
      );
    }

    // Calculate squad lock status
    let isSquadLocked = false;
    let squadRemainingDays = 0;
    
    if (user.squad_lock_end_date) {
      const lockEndDate = new Date(user.squad_lock_end_date);
      const now = new Date();
      isSquadLocked = now < lockEndDate;
      
      if (isSquadLocked) {
        const diffTime = lockEndDate.getTime() - now.getTime();
        squadRemainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    // Calculate level from XP
    const level = Math.floor((user.total_xp || 0) / 1000) + 1;

    // Prepare squad data
    const squadData = user.squad ? {
      name: user.squad,
      id: user.squad_id || user.squad,
      selectedAt: user.squad_selected_at,
      lockEndDate: user.squad_lock_end_date,
      changeCount: user.squad_change_count || 0,
      isLocked: isSquadLocked,
      remainingDays: squadRemainingDays
    } : null;

    // Return complete user profile
    return NextResponse.json({
      success: true,
      exists: true,
      profile: {
        walletAddress: user.wallet_address,
        displayName: user.display_name,
        level,
        totalXP: user.total_xp || 0,
        streak: user.streak || 0,
        isAdmin: user.is_admin || false,
        banned: user.banned || false,
        
        // Squad information
        squad: squadData,
        hasSquad: !!user.squad,
        
        // Timestamps
        createdAt: user.created_at,
        lastActive: user.last_active,
        updatedAt: user.updated_at,
        
        // Additional metadata
        completedCourses: user.completed_courses || [],
        badges: user.badges || [],
        bio: user.bio || null,
        pfp_url: user.profile_picture || null, // Map profile_picture to pfp_url
        
        // NFT holdings (if stored)
        nftCount: user.nft_count || 0
      }
    });

  } catch (error) {
    console.error('Error in GET /api/user-profile:', error);
    return NextResponse.json(
      { error: 'Internal server error', exists: false },
      { status: 500 }
    );
  }
}

