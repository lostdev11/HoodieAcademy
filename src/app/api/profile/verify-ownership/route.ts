import { NextRequest, NextResponse } from 'next/server';
import { getAssetsByOwner } from '@/lib/solana/das';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: NextRequest) {
  const { userId, owner } = await req.json();
  if (!userId || !owner) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const { data: profile } = await supabase.from('profiles').select('pfp_asset_id').eq('id', userId).single();
  if (!profile?.pfp_asset_id) return NextResponse.json({ ok: true });

  const items = await getAssetsByOwner(owner, 200);
  const stillOwned = items.some(i => i.id === profile.pfp_asset_id);
  if (!stillOwned) {
    await supabase.from('profiles').update({ pfp_url: null, pfp_asset_id: null }).eq('id', userId);
  }
  return NextResponse.json({ ok: true, stillOwned });
}
