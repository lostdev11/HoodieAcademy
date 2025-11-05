import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'; // Prevent caching

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    const category = searchParams.get('category');

    // Build query
    let query = supabase
      .from('feedback_updates')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('fixed_date', { ascending: false })
      .limit(limit);

    // Filter by category if provided
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: updates, error } = await query;

    if (error) {
      console.error('Error fetching feedback updates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feedback updates', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updates: updates || [],
      total: updates?.length || 0
    });

  } catch (error) {
    console.error('Error in feedback updates API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Admin endpoint to create new feedback updates
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { 
      title, 
      description, 
      category, 
      status = 'fixed',
      requested_by,
      priority = 0,
      original_submission_id,
      adminWallet 
    } = await request.json();

    // Verify admin access
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', adminWallet)
      .single();

    if (adminError || !adminUser?.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, category' },
        { status: 400 }
      );
    }

    // Insert new feedback update
    const { data, error } = await supabase
      .from('feedback_updates')
      .insert({
        title,
        description,
        category,
        status,
        requested_by,
        priority,
        original_submission_id,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating feedback update:', error);
      return NextResponse.json(
        { error: 'Failed to create feedback update', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      update: data,
      message: 'Feedback update created successfully'
    });

  } catch (error) {
    console.error('Error in feedback updates POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

