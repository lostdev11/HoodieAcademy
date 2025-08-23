import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowser } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseBrowser();
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
