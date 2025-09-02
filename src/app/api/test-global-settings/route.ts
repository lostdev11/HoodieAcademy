import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

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
