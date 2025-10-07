import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { isAdminForUser } from '@/lib/admin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SubmissionCreate = z.object({
  title: z.string().min(3).optional(),
  content: z.string().optional(),
  url: z.string().url().optional(),
  evidence_links: z.array(z.string().url()).optional(),
  wallet_address: z.string().optional()
});

export const runtime = 'edge';

export async function GET(
  _: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    const admin = await isAdminForUser(supabase);
    const selectFields = admin ? '*' : 'id,bounty_id,status,created_at,title,url';
    
    const { data, error } = await supabase
      .from('bounty_submissions')
      .select(selectFields)
      .eq('bounty_id', params.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json();
    const parsed = SubmissionCreate.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: parsed.error.flatten() 
      }, { status: 400 });
    }
    
    // Check if bounty is open
    const { data: isOpen, error: bountyError } = await supabase
      .rpc('is_bounty_open', { bid: params.id });
    
    if (bountyError || !isOpen) {
      return NextResponse.json({ error: 'Bounty is not open.' }, { status: 400 });
    }
    
    // Create submission
    const { data, error } = await supabase
      .from('bounty_submissions')
      .insert({
        bounty_id: params.id,
        user_id: user.id,
        wallet_address: parsed.data.wallet_address ?? null,
        title: parsed.data.title ?? null,
        content: parsed.data.content ?? null,
        url: parsed.data.url ?? null,
        evidence_links: parsed.data.evidence_links ?? []
      })
      .select('*')
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
