import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    // Test with admin client
    const supabaseAdmin = getSupabaseAdmin();
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('global_settings')
      .select('*')
      .limit(1);
    
    // Test with regular client
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
      adminAccess: {
        success: !adminError,
        data: adminData,
        error: adminError?.message || adminError
      },
      clientAccess: {
        success: !clientError,
        data: clientData,
        error: clientError?.message || clientError
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
