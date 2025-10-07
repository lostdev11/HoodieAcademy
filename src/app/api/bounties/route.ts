import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { isAdminForUser } from '@/lib/admin';
import { BountyStatus } from '@/types/tracking';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BountyCreate = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  slug: z.string().optional(),
  reward_xp: z.number().int().min(1).default(50),
  status: z.enum(['draft','open','closed']).default('draft'),
  open_at: z.string().datetime().optional(),
  close_at: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  max_submissions: z.number().int().positive().optional(),
  allow_multiple_submissions: z.boolean().optional(),
  image_required: z.boolean().default(false),
  submission_type: z.enum(['text', 'image', 'both']).default('text')
});

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    
    let query = supabase
      .from('bounties')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching bounties:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check admin permissions
    const admin = await isAdminForUser(supabase);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json();
    const parsed = BountyCreate.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: parsed.error.flatten() 
      }, { status: 400 });
    }
    
    const input = parsed.data;
    
    // Create bounty
    const { data, error } = await supabase
      .from('bounties')
      .insert({
        ...input,
        tags: input.tags ?? [],
        created_by: user.id
      })
      .select('*')
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating bounty:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}