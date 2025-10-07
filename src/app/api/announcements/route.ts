import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const published = searchParams.get('published');
    const search = searchParams.get('search');

    let query = supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by published status if specified
    if (published !== null) {
      query = query.eq('is_published', published === 'true');
    }

    // Filter by search term if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data: announcements, error } = await query;

    if (error) {
      console.error('Error fetching announcements:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch announcements' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, announcements: announcements || [] });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
