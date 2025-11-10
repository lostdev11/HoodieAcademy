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
    const {
      email,
      wallet_address,
      first_name,
      last_name,
    } = body;

    const trimmedFirstName = typeof first_name === 'string' ? first_name.trim() : '';
    const trimmedLastName = typeof last_name === 'string' ? last_name.trim() : '';
    const trimmedEmail = typeof email === 'string' ? email.trim() : '';
    const trimmedWallet = typeof wallet_address === 'string' ? wallet_address.trim() : '';

    if (!trimmedFirstName || !trimmedLastName) {
      return NextResponse.json(
        { error: 'First and last name are required' },
        { status: 400 }
      );
    }

    // Validate that at least one field is provided
    if (!trimmedEmail && !trimmedWallet) {
      return NextResponse.json(
        { error: 'Either email or wallet address must be provided' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check for duplicate submission (same email or wallet within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    let duplicateCheck = null;
    if (trimmedEmail) {
      const { data } = await supabase
        .from('preview_submissions')
        .select('id')
        .eq('email', trimmedEmail)
        .gte('submitted_at', oneDayAgo)
        .single();
      duplicateCheck = data;
    } else if (trimmedWallet) {
      const { data } = await supabase
        .from('preview_submissions')
        .select('id')
        .eq('wallet_address', trimmedWallet)
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
        first_name: trimmedFirstName,
        last_name: trimmedLastName,
        email: trimmedEmail || null,
        wallet_address: trimmedWallet || null,
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

