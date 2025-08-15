import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    has_SUPABASE_URL: !!process.env.SUPABASE_URL,
    has_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    has_NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_url_length: process.env.SUPABASE_URL?.length || 0,
    service_role_key_length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    next_public_url_length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
    node_env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}
