import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { isAdminForUser } from '@/lib/admin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BountyUpdate = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  slug: z.string().optional(),
  reward_xp: z.number().int().min(1).optional(),
  status: z.enum(['draft','open','closed']).optional(),
  open_at: z.string().datetime().optional(),
  close_at: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  max_submissions: z.number().int().positive().optional(),
  allow_multiple_submissions: z.boolean().optional(),
  image_required: z.boolean().optional(),
  submission_type: z.enum(['text', 'image', 'both']).optional(),
  hidden: z.boolean().optional()  // ← Added hidden field
});

export const runtime = 'edge';

export async function GET(
  _: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    
    const { data, error } = await supabase
      .from('bounties')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (error) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching bounty:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    // Check admin permissions
    const admin = await isAdminForUser(supabase);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Parse request body
    const body = await req.json();
    const parsed = BountyUpdate.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: parsed.error.flatten() 
      }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('bounties')
      .update(parsed.data)
      .eq('id', params.id)
      .select('*')
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating bounty:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Add PUT method to handle legacy calls
export async function PUT(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  // Just forward to PATCH
  return PATCH(req, { params });
}

export async function DELETE(
  _: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    // Check admin permissions
    const admin = await isAdminForUser(supabase);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { error } = await supabase
      .from('bounties')
      .delete()
      .eq('id', params.id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bounty:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}