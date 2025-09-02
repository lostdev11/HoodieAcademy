import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Check if user is authenticated and admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Call the database function to get course statistics
    const { data: stats, error } = await supabase
      .rpc('get_course_stats');

    if (error) {
      console.error('Error fetching course stats:', error);
      return NextResponse.json({ error: 'Failed to fetch course stats' }, { status: 500 });
    }

    return NextResponse.json(stats || []);
  } catch (error) {
    console.error('Error in course-stats GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
