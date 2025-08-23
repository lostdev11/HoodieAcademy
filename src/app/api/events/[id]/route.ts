import { NextResponse } from "next/server";
import { assertAdminOr403, handleError } from "../../../../lib/route-handlers";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user } = await assertAdminOr403();
    const body = await req.json() as Partial<{
      title: string; description: string; type: string; date: string | null; time: string | null;
    }>;
    const { data, error } = await supabase
      .from("events")
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
    const { error } = await supabase.from("events").delete().eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) { return handleError(e); }
}
