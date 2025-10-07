import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { isAdminForUser } from '@/lib/admin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const Adjust = z.object({
  user_id: z.string().uuid(),
  delta: z.number().int(),
  reason: z.string().min(3)
});

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    // Check admin permissions
    const admin = await isAdminForUser(supabase);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Parse request body
    const body = await req.json();
    const parsed = Adjust.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: parsed.error.flatten() 
      }, { status: 400 });
    }
    
    // Create XP adjustment event
    const { data, error } = await supabase
      .from('xp_events')
      .insert({
        user_id: parsed.data.user_id,
        delta: parsed.data.delta,
        source: 'admin_adjustment',
        reason: parsed.data.reason
      })
      .select('*')
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error adjusting XP:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
