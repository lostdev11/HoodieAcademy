import { NextResponse } from "next/server";
import { supabaseRouteClient, assertAdminOr403, handleError } from "../../../lib/route-handlers";

export async function GET() {
  try {
    const supabase = supabaseRouteClient();
    const { data, error } = await supabase
      .from("bounties")
      .select("id,title,short_desc,reward,deadline,link_to,image,squad_tag,status,hidden,submissions,created_at,updated_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (e) { return handleError(e); }
}

export async function POST(req: Request) {
  try {
    const { supabase, user } = await assertAdminOr403();
    const body = await req.json() as {
      title: string; short_desc: string; reward: string; deadline?: string | null;
      link_to?: string | null; image?: string | null; squad_tag?: string | null;
      status?: "active" | "completed" | "expired"; hidden?: boolean; submissions?: number;
    };
    const { data, error } = await supabase
      .from("bounties")
      .insert({
        title: body.title,
        short_desc: body.short_desc,
        reward: body.reward,
        deadline: body.deadline ?? null,
        link_to: body.link_to ?? null,
        image: body.image ?? null,
        squad_tag: body.squad_tag ?? null,
        status: body.status ?? "active",
        hidden: !!body.hidden,
        submissions: body.submissions ?? 0,
        updated_by: user.id,
      })
      .select()
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) { return handleError(e); }
}
