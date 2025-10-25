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
    
    // Also test the exact query that the SettingsProvider uses
    const { data: providerData, error: providerError } = await supabase
      .from('global_settings')
      .select('*')
      .maybeSingle();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      adminAccess: {
        success: !adminError,
        data: adminData,
        error: adminError?.message || adminError,
        code: adminError?.code
      },
      clientAccess: {
        success: !clientError,
        data: clientData,
        error: clientError?.message || clientError,
        code: clientError?.code
      },
      providerQuery: {
        success: !providerError,
        data: providerData,
        error: providerError?.message || providerError,
        code: providerError?.code
      },
      environment: {
        supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
        supabaseAnonKey: supabaseAnonKey ? 'Set' : 'Missing'
      }
    });
    
  } catch (error) {
    console.error('Error testing global settings:', error);
    return NextResponse.json({ 
      error: 'Failed to test global settings',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
