import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminForUser } from '@/lib/admin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = 'edge';

export async function GET(
  _: NextRequest, 
  { params }: { params: { userId: string } }
) {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is requesting their own data or is admin
    const isAdmin = await isAdminForUser(supabase);
    if (user.id !== params.userId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get XP ledger and balance in parallel
    const [ledgerResult, balanceResult] = await Promise.all([
      supabase
        .from('xp_events')
        .select('*')
        .eq('user_id', params.userId)
        .order('created_at', { ascending: false }),
      
      supabase
        .from('xp_balances')
        .select('total_xp')
        .eq('user_id', params.userId)
        .maybeSingle()
    ]);
    
    if (ledgerResult.error) {
      return NextResponse.json({ error: ledgerResult.error.message }, { status: 400 });
    }
    
    return NextResponse.json({
      total_xp: balanceResult.data?.total_xp ?? 0,
      ledger: ledgerResult.data ?? []
    });
  } catch (error) {
    console.error('Error fetching XP data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
