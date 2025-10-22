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
 * GET /api/admin/student-of-week
 * Get current student of the week or history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'current';
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log('📚 [Student of Week] GET request:', { action, limit });

    const supabase = getSupabaseClient();

    // TODO: Verify admin authentication

    switch (action) {
      case 'current': {
        // Get current student of the week
        const { data, error } = await supabase
          .rpc('get_current_student_of_week')
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned (which is ok)
          console.error('❌ [Student of Week] Error getting current:', error);
          return NextResponse.json(
            { error: 'Failed to get current student', details: error.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          student: data || null
        });
      }

      case 'history': {
        // Get student of the week history
        const { data, error } = await supabase
          .rpc('get_student_of_week_history', { p_limit: limit });

        if (error) {
          console.error('❌ [Student of Week] Error getting history:', error);
          return NextResponse.json(
            { error: 'Failed to get history', details: error.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          history: data || []
        });
      }

      case 'top-candidates': {
        // Get top students this week (candidates for selection)
        const { data, error } = await supabase
          .rpc('get_top_students_this_week', { p_limit: limit });

        if (error) {
          console.error('❌ [Student of Week] Error getting candidates:', error);
          return NextResponse.json(
            { error: 'Failed to get candidates', details: error.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          candidates: data || []
        });
      }

      default: {
        return NextResponse.json(
          { error: 'Invalid action. Use: current, history, or top-candidates' },
          { status: 400 }
        );
      }
    }

  } catch (error) {
    console.error('❌ [Student of Week] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/student-of-week
 * Set student of the week
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      walletAddress, 
      reason, 
      achievements, 
      selectedBy,
      weekStart,
      weekEnd 
    } = body;

    console.log('📚 [Student of Week] POST request:', { walletAddress, reason });

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress is required' },
        { status: 400 }
      );
    }

    // TODO: Verify admin authentication and get admin wallet
    // For now, use the selectedBy from request or default
    const adminWallet = selectedBy || 'admin';

    const supabase = getSupabaseClient();

    // Set student of the week using database function
    const { data, error } = await supabase
      .rpc('set_student_of_week', {
        p_wallet_address: walletAddress,
        p_reason: reason || null,
        p_achievements: achievements || null,
        p_selected_by: adminWallet,
        p_week_start: weekStart || null,
        p_week_end: weekEnd || null
      })
      .single();

    if (error) {
      console.error('❌ [Student of Week] Error setting student:', error);
      return NextResponse.json(
        { error: 'Failed to set student of the week', details: error.message },
        { status: 500 }
      );
    }

    if (!data.success) {
      return NextResponse.json(
        { error: data.message },
        { status: 400 }
      );
    }

    console.log('✅ [Student of Week] Student set successfully:', data.student_id);

    // Get the full student data
    const { data: currentStudent } = await supabase
      .rpc('get_current_student_of_week')
      .single();

    return NextResponse.json({
      success: true,
      message: 'Student of the Week set successfully!',
      student: currentStudent
    });

  } catch (error) {
    console.error('❌ [Student of Week] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/student-of-week
 * Remove current student of the week
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('📚 [Student of Week] DELETE request');

    const supabase = getSupabaseClient();

    // TODO: Verify admin authentication

    // Unfeatured current student of the week
    const { error } = await supabase
      .from('student_of_the_week')
      .update({ featured: false })
      .eq('featured', true)
      .gte('week_start', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .lte('week_end', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (error) {
      console.error('❌ [Student of Week] Error removing student:', error);
      return NextResponse.json(
        { error: 'Failed to remove student', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ [Student of Week] Student removed successfully');

    return NextResponse.json({
      success: true,
      message: 'Student of the Week removed successfully'
    });

  } catch (error) {
    console.error('❌ [Student of Week] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
