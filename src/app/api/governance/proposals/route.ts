import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Mark as dynamic
export const dynamic = 'force-dynamic';

/**
 * GET /api/governance/proposals
 * Fetch all governance proposals
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'active', 'passed', 'rejected', 'executed'
    
    let query = supabase
      .from('governance_proposals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: proposals, error } = await query;
    
    if (error) {
      console.error('Error fetching proposals:', error);
      return NextResponse.json(
        { error: 'Failed to fetch proposals', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      proposals: proposals || [],
      count: proposals?.length || 0
    });
    
  } catch (error) {
    console.error('Error in proposals GET:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/governance/proposals
 * Create a new governance proposal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      proposal_type,
      requested_unlock_amount,
      target_allocation,
      voting_duration_days = 7,
      created_by
    } = body;
    
    // Validation
    if (!title || !description || !proposal_type || !created_by) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, proposal_type, created_by' },
        { status: 400 }
      );
    }
    
    // Calculate voting end date
    const voting_ends_at = new Date();
    voting_ends_at.setDate(voting_ends_at.getDate() + voting_duration_days);
    
    // Insert proposal
    const { data: proposal, error } = await supabase
      .from('governance_proposals')
      .insert({
        title,
        description,
        proposal_type,
        requested_unlock_amount: requested_unlock_amount || 0,
        target_allocation,
        voting_ends_at: voting_ends_at.toISOString(),
        created_by,
        status: 'active'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating proposal:', error);
      return NextResponse.json(
        { error: 'Failed to create proposal', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      proposal,
      message: 'Proposal created successfully'
    });
    
  } catch (error) {
    console.error('Error in proposals POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

