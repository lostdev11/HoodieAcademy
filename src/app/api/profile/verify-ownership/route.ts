import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowser } from '@/lib/supabaseClient';

const supabase = getSupabaseBrowser();

export async function POST(req: NextRequest) {
  const { userId, owner } = await req.json();
  if (!userId || !owner) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const { data: profile } = await supabase.from('profiles').select('pfp_asset_id').eq('id', userId).single();
  if (!profile?.pfp_asset_id) return NextResponse.json({ ok: true });

  const items = await supabase.from('assets').select('id').eq('owner', owner).eq('id', profile.pfp_asset_id);
  const stillOwned = items.length > 0;
  if (!stillOwned) {
    await supabase.from('profiles').update({ pfp_url: null, pfp_asset_id: null }).eq('id', userId);
  }
  return NextResponse.json({ ok: true, stillOwned });
}
