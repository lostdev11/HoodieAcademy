import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, starts_at, ends_at, is_published, walletAddress } = body;

    if (!title || !walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Title and wallet address are required' },
        { status: 400 }
      );
    }

    // Verify admin status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError || !userData?.is_admin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const announcementData = {
      title,
      content: content || '',
      starts_at: starts_at ? new Date(starts_at).toISOString() : null,
      ends_at: ends_at ? new Date(ends_at).toISOString() : null,
      is_published: is_published || false
      // created_by: walletAddress // Temporarily removed due to schema cache
    };

    const { data: announcement, error: announcementError } = await supabase
      .from('announcements')
      .insert([announcementData])
      .select()
      .single();

    if (announcementError) {
      console.error('Error creating announcement:', announcementError);
      return NextResponse.json(
        { success: false, error: 'Failed to create announcement' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, announcement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
