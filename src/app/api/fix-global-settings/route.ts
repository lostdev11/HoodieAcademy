import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // First, let's check if we can access global_settings with admin client
    const { data: adminTest, error: adminError } = await supabaseAdmin
      .from('global_settings')
      .select('*')
      .limit(1);
    
    if (adminError) {
      console.error('Admin client error:', adminError);
      return NextResponse.json({ 
        error: 'Admin client cannot access global_settings',
        details: adminError
      }, { status: 500 });
    }
    
    // Insert default settings if missing
    const { error: insertError } = await supabaseAdmin
      .from('global_settings')
      .upsert({
        site_maintenance: false,
        registration_enabled: true,
        course_submissions_enabled: true,
        bounty_submissions_enabled: true,
        chat_enabled: true,
        leaderboard_enabled: true
      }, { 
        onConflict: 'id',
        ignoreDuplicates: true 
      });
    
    if (insertError) {
      console.error('Error inserting default settings:', insertError);
    }
    
    // Test with regular client to see if RLS is blocking access
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ 
        error: 'Missing environment variables'
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: clientTest, error: clientError } = await supabase
      .from('global_settings')
      .select('*')
      .limit(1);
    
    return NextResponse.json({
      success: true,
      message: 'Global settings test completed',
      adminAccess: {
        success: !adminError,
        data: adminTest,
        error: adminError
      },
      clientAccess: {
        success: !clientError,
        data: clientTest,
        error: clientError
      },
      insertResult: {
        success: !insertError,
        error: insertError
      }
    });
    
  } catch (error) {
    console.error('Error testing global settings:', error);
    return NextResponse.json({ 
      error: 'Failed to test global settings',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
