import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { courseId, newSlug, walletAddress } = await request.json();

    if (!courseId || !newSlug || !walletAddress) {
      return NextResponse.json({ 
        error: 'Missing required fields: courseId, newSlug, walletAddress' 
      }, { status: 400 });
    }

    // Check if user is admin using service role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError || !userData?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Update the course slug
    const { data: updatedCourse, error: updateError } = await supabase
      .from('courses')
      .update({ slug: newSlug })
      .eq('id', courseId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating course slug:', updateError);
      return NextResponse.json({ error: 'Failed to update course slug' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      course: updatedCourse
    });

  } catch (error) {
    console.error('[ADMIN FIX COURSE SLUG ERROR]', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
