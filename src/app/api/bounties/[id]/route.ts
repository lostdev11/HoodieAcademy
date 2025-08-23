import { NextResponse } from "next/server";
import { assertAdminOr403, handleError } from "../../../../lib/route-handlers";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user } = await assertAdminOr403();
    const body = await req.json() as Partial<{
      title: string; short_desc: string; reward: string; deadline: string | null;
      link_to: string | null; image: string | null; squad_tag: string | null;
      status: "active" | "completed" | "expired"; hidden: boolean; submissions: number;
    }>;
    const { data, error } = await supabase
      .from("bounties")
      .update({ ...body, updated_by: user.id, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (e) { return handleError(e); }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase } = await assertAdminOr403();
    const { error } = await supabase.from("bounties").delete().eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) { return handleError(e); }
}
