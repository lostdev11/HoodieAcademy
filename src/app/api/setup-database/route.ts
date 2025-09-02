import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST() {
  try {
    const supabase = getSupabaseAdmin();
    
    // Check if global_settings table exists
    const { data: tableExists, error: checkError } = await supabase
      .from('global_settings')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === '42P01') {
      // Table doesn't exist, create it using direct SQL
      console.log('Creating global_settings table...');
      
      // Note: This requires the exec_sql function to be enabled in Supabase
      // If it's not available, you'll need to create the table manually
      return NextResponse.json({ 
        error: 'Table creation requires manual setup',
        message: 'Please create the global_settings table manually using the SQL from the setup scripts'
      }, { status: 400 });
    }
    
    if (tableExists && tableExists.length > 0) {
      // Table exists, check if it has data
      const { data: settings, error: fetchError } = await supabase
        .from('global_settings')
        .select('*')
        .limit(1);
      
      if (fetchError) {
        console.error('Error fetching settings:', fetchError);
        return NextResponse.json({ error: 'Failed to fetch settings', details: fetchError }, { status: 500 });
      }
      
      if (settings && settings.length > 0) {
        return NextResponse.json({
          success: true,
          message: 'Table already exists and has data',
          settings: settings[0]
        });
      }
    }
    
    // Insert default settings
    const { error: insertError } = await supabase
      .from('global_settings')
      .upsert({
        id: 1,
        site_maintenance: false,
        registration_enabled: true,
        course_submissions_enabled: true,
        bounty_submissions_enabled: true,
        chat_enabled: true,
        leaderboard_enabled: true
      }, { onConflict: 'id' });
    
    if (insertError) {
      console.error('Error inserting default settings:', insertError);
      return NextResponse.json({ error: 'Failed to insert settings', details: insertError }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully'
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
