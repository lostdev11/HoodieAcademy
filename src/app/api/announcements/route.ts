import { NextResponse } from "next/server";
import { supabaseRouteClient, assertAdminOr403, handleError } from "../../../lib/route-handlers";

export async function GET() {
  try {
    const supabase = supabaseRouteClient();
    const { data, error } = await supabase
      .from("announcements")
      .select("id,title,content,starts_at,ends_at,is_published,created_at,updated_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (e) { return handleError(e); }
}

export async function POST(req: Request) {
  try {
    const { supabase, user } = await assertAdminOr403();
    const body = await req.json() as {
      title: string; content: string; starts_at?: string | null; ends_at?: string | null; is_published?: boolean;
    };
    const { data, error } = await supabase
      .from("announcements")
      .insert({
        title: body.title,
        content: body.content,
        starts_at: body.starts_at ?? null,
        ends_at: body.ends_at ?? null,
        is_published: !!body.is_published,
        updated_by: user.id,
      })
      .select()
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) { return handleError(e); }
}
