import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const body = await request.json();
    const { email, wallet_address } = body;

    // Validate that at least one field is provided
    if (!email && !wallet_address) {
      return NextResponse.json(
        { error: 'Either email or wallet address must be provided' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check for duplicate submission (same email or wallet within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    let duplicateCheck = null;
    if (email) {
      const { data } = await supabase
        .from('preview_submissions')
        .select('id')
        .eq('email', email)
        .gte('submitted_at', oneDayAgo)
        .single();
      duplicateCheck = data;
    } else if (wallet_address) {
      const { data } = await supabase
        .from('preview_submissions')
        .select('id')
        .eq('wallet_address', wallet_address)
        .gte('submitted_at', oneDayAgo)
        .single();
      duplicateCheck = data;
    }

    if (duplicateCheck) {
      return NextResponse.json(
        { error: 'You have already submitted recently. Please try again later.' },
        { status: 400 }
      );
    }

    // Insert submission
    const { data, error } = await supabase
      .from('preview_submissions')
      .insert({
        email: email || null,
        wallet_address: wallet_address || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating preview submission:', error);
      return NextResponse.json(
        { error: 'Failed to submit. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your interest!',
      submission: data
    });

  } catch (error) {
    console.error('Error in preview submit API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

