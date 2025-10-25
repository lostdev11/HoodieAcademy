import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // First, ensure we have data in global_settings using admin client
    const { data: insertData, error: insertError } = await supabaseAdmin
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
        ignoreDuplicates: false 
      })
      .select();
    
    if (insertError) {
      console.error('Error inserting global settings:', insertError);
      return NextResponse.json({ 
        error: 'Failed to insert global settings',
        details: insertError
      }, { status: 500 });
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
    
    const { data: clientData, error: clientError } = await supabase
      .from('global_settings')
      .select('*')
      .limit(1);
    
    return NextResponse.json({
      success: true,
      message: 'Global settings fix attempted',
      insertResult: {
        success: !insertError,
        data: insertData,
        error: insertError
      },
      clientAccess: {
        success: !clientError,
        data: clientData,
        error: clientError
      }
    });
    
  } catch (error) {
    console.error('Error fixing global settings:', error);
    return NextResponse.json({ 
      error: 'Failed to fix global settings',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
