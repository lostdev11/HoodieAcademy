import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { sql } = await request.json();
    
    if (!sql) {
      return NextResponse.json({ 
        error: 'SQL query is required' 
      }, { status: 400 });
    }
    
    const supabaseAdmin = getSupabaseAdmin();
    
    // Execute the SQL using the admin client
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('SQL execution error:', error);
      return NextResponse.json({ 
        error: 'SQL execution failed',
        details: error
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data,
      message: 'SQL executed successfully'
    });
    
  } catch (error) {
    console.error('Error executing SQL:', error);
    return NextResponse.json({ 
      error: 'Failed to execute SQL',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
