import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { isAdminForUser } from '@/lib/admin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const Moderate = z.object({
  status: z.enum(['approved','rejected','needs_revision']),
  score: z.number().min(0).max(100).optional(),
  feedback: z.string().optional()
});

export const runtime = 'edge';

export async function POST(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    // Check admin permissions
    const admin = await isAdminForUser(supabase);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get authenticated user (admin)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json();
    const parsed = Moderate.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: parsed.error.flatten() 
      }, { status: 400 });
    }
    
    // Update submission
    const { data, error } = await supabase
      .from('bounty_submissions')
      .update({
        status: parsed.data.status,
        score: parsed.data.score ?? null,
        feedback: parsed.data.feedback ?? null,
        reviewer_id: user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select('*')
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    // XP is awarded via database trigger when status flips to approved
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error moderating submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
