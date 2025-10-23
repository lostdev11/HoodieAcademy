import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('🔍 [XP HISTORY] Fetching XP history for user:', userId);

    // Fetch XP transactions for the user
    const { data: xpTransactions, error } = await supabase
      .from('xp_transactions')
      .select(`
        id,
        xp_amount,
        reason,
        created_at,
        awarded_by,
        transaction_type
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50); // Limit to last 50 transactions

    if (error) {
      console.error('❌ [XP HISTORY] Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch XP history' }, { status: 500 });
    }

    console.log('✅ [XP HISTORY] Fetched XP history:', xpTransactions?.length || 0, 'transactions');

    return NextResponse.json(xpTransactions || []);

  } catch (error) {
    console.error('❌ [XP HISTORY] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
