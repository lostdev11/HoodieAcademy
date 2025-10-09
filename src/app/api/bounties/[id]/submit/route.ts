import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for admin operations
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { 
      submission, 
      walletAddress, 
      submissionType = 'text',
      title,
      description,
      imageUrl,
      squad,
      courseRef
    } = body;
    
    if (!submission || !walletAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if bounty exists and is active
    const { data: bounty, error: bountyError } = await supabase
      .from('bounties')
      .select('*')
      .eq('id', params.id)
      .eq('status', 'active')
      .single();

    if (bountyError || !bounty) {
      return NextResponse.json({ error: 'Bounty not found or not active' }, { status: 404 });
    }

    // Check if user already submitted for this bounty
    const { data: existingSubmission, error: checkError } = await supabase
      .from('bounty_submissions')
      .select('id')
      .eq('bounty_id', params.id)
      .eq('wallet_address', walletAddress)
      .single();

    if (existingSubmission) {
      return NextResponse.json({ error: 'You have already submitted for this bounty' }, { status: 400 });
    }

    // Create submission
    const { data: newSubmission, error: submitError } = await supabase
      .from('bounty_submissions')
      .insert([{
        bounty_id: params.id,
        wallet_address: walletAddress,
        submission_content: submission,
        submission_type: submissionType,
        title: title || null,
        description: description || null,
        image_url: imageUrl || null,
        squad: squad || null,
        course_ref: courseRef || null,
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (submitError) {
      console.error('Error creating bounty submission:', submitError);
      return NextResponse.json({ error: 'Failed to submit bounty' }, { status: 500 });
    }

    // Update bounty submission count
    const { error: updateError } = await supabase
      .from('bounties')
      .update({ 
        submissions: bounty.submissions + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Error updating bounty submissions count:', updateError);
    }

    return NextResponse.json({ 
      success: true, 
      submission: newSubmission,
      message: 'Bounty submitted successfully!' 
    }, { status: 201 });

  } catch (error) {
    console.error('Error in bounty submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    // Get user's submission for this bounty
    const { data: submission, error } = await supabase
      .from('bounty_submissions')
      .select('*')
      .eq('bounty_id', params.id)
      .eq('wallet_address', walletAddress)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching bounty submission:', error);
      return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 });
    }

    return NextResponse.json({ submission: submission || null });

  } catch (error) {
    console.error('Error in bounty submission GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
