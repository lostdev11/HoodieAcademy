import { NextResponse } from "next/server";
import { supabaseRouteClient, assertAdminOr403, handleError } from "../../../lib/route-handlers";

export async function GET() {
  try {
    const supabase = supabaseRouteClient();
    const { data, error } = await supabase
      .from("events")
      .select("id,title,description,type,date,time,created_at,updated_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (e) { return handleError(e); }
}

export async function POST(req: Request) {
  try {
    const { supabase, user } = await assertAdminOr403();
    const body = await req.json() as {
      title: string; description: string; type: string; date?: string | null; time?: string | null;
    };
    const { data, error } = await supabase
      .from("events")
      .insert({
        title: body.title,
        description: body.description,
        type: body.type,
        date: body.date ?? null,
        time: body.time ?? null,
        updated_by: user.id,
      })
      .select()
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) { return handleError(e); }
}
