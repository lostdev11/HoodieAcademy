import { NextResponse } from "next/server";
import { assertAdminOr403, handleError } from "../../../../lib/route-handlers";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user } = await assertAdminOr403();
    const body = await req.json() as Partial<{
      title: string; content: string; starts_at: string | null; ends_at: string | null; is_published: boolean;
    }>;
    const { data, error } = await supabase
      .from("announcements")
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
    const { error } = await supabase.from("announcements").delete().eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) { return handleError(e); }
}
