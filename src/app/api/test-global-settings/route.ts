import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Try to fix RLS policies using the RPC function
    const { data: rlsResult, error: rlsError } = await supabaseAdmin.rpc('fix_global_settings_rls');
    
    if (rlsError) {
      console.error('RLS fix error:', rlsError);
      // Continue anyway, maybe the policies are already correct
    }
    
    // Test the fix by trying to access global_settings with regular client
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
      message: 'Global settings RLS fix attempted',
      rlsFix: {
        success: !rlsError,
        result: rlsResult,
        error: rlsError
      },
      clientTest: {
        success: !clientError,
        data: clientTest,
        error: clientError
      }
    });
    
  } catch (error) {
    console.error('Error fixing global settings RLS:', error);
    return NextResponse.json({ 
      error: 'Failed to fix global settings RLS',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Test with admin client first
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('global_settings')
      .select('*')
      .limit(1);
    
    if (adminError) {
      console.error('Admin client error:', adminError);
      return NextResponse.json({ 
        error: 'Admin client error', 
        details: adminError,
        adminData: null 
      }, { status: 500 });
    }
    
    // Test with regular client
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ 
        error: 'Missing environment variables',
        supabaseUrl: !!supabaseUrl,
        supabaseAnonKey: !!supabaseAnonKey
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: clientData, error: clientError } = await supabase
      .from('global_settings')
      .select('*')
      .limit(1);
    
    if (clientError) {
      console.error('Client error:', clientError);
      return NextResponse.json({ 
        error: 'Client error', 
        details: clientError,
        adminData,
        clientData: null 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      adminData,
      clientData,
      message: 'Both admin and client access successful'
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
