import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// Log a wallet connection event
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      wallet_address, 
      connection_type, 
      user_agent, 
      ip_address, 
      verification_result, 
      session_data, 
      notes 
    } = body;

    if (!wallet_address || !connection_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: wallet_address and connection_type' 
      }, { status: 400 });
    }

    // Insert the connection log
    const { data, error } = await supabase
      .from('wallet_connections')
      .insert({
        wallet_address,
        connection_type,
        user_agent: user_agent || req.headers.get('user-agent'),
        ip_address: ip_address || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        verification_result,
        session_data,
        notes
      })
      .select();

    if (error) {
      console.error('Error logging wallet connection:', error);
      return NextResponse.json({ 
        error: 'Failed to log connection',
        details: error.message 
      }, { status: 500 });
    }

    console.log('Wallet connection logged:', {
      wallet_address,
      connection_type,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Wallet connection logged successfully',
      data 
    });

  } catch (error: any) {
    console.error('Error in wallet connection logging:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// Get wallet connections for admin dashboard
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const wallet_address = searchParams.get('wallet_address');
    const connection_type = searchParams.get('connection_type');

    let query = supabase
      .from('wallet_connections')
      .select('*')
      .order('connection_timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add filters if provided
    if (wallet_address) {
      query = query.eq('wallet_address', wallet_address);
    }
    if (connection_type) {
      query = query.eq('connection_type', connection_type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching wallet connections:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch connections',
        details: error.message 
      }, { status: 500 });
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('wallet_connections')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({ 
      success: true,
      data,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0)
      }
    });

  } catch (error: any) {
    console.error('Error fetching wallet connections:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
