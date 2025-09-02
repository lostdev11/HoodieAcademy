import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('global_settings')
      .select('*')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError);
      return NextResponse.json({ 
        status: 'error', 
        message: 'Database connection failed',
        error: connectionError.message 
      }, { status: 500 });
    }
    
    console.log('✅ Database connection successful');
    
    // Check what tables exist by trying to query them
    const tables = ['courses', 'bounties', 'announcements', 'events', 'submissions', 'users', 'global_settings'];
    const tableStatus: { [key: string]: any } = {};
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          tableStatus[table] = { exists: false, error: error.message };
        } else {
          tableStatus[table] = { 
            exists: true, 
            count: count || 0,
            sample: data?.slice(0, 2) || []
          };
        }
      } catch (err) {
        tableStatus[table] = { exists: false, error: err instanceof Error ? err.message : 'Unknown error' };
      }
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      tables: tableStatus
    });
    
  } catch (error) {
    console.error('❌ Error testing database:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Failed to test database',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

