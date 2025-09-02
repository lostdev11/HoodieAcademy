import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Test basic connection
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
    }
    
    // Test courses table structure
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(1);
    
    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
    }
    
    // Get table structure
    let tableStructure = null;
    try {
      const { data: structure, error: structureError } = await supabase
        .rpc('get_table_structure', { table_name: 'courses' });
      
      if (!structureError) {
        tableStructure = structure;
      }
    } catch (e) {
      // RPC might not exist, that's okay
    }
    
    // Test global_settings table
    const { data: settings, error: settingsError } = await supabase
      .from('global_settings')
      .select('count')
      .limit(1);
    
    if (settingsError) {
      console.error('Error fetching global_settings:', settingsError);
    }
    
    return NextResponse.json({
      success: true,
      tables: tables?.map(t => t.table_name) || [],
      coursesCount: courses?.length || 0,
      settingsCount: settings?.length || 0,
      errors: {
        tables: tablesError?.message,
        courses: coursesError?.message,
        settings: settingsError?.message
      }
    });
    
  } catch (error) {
    console.error('Error in test-db:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
