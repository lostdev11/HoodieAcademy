import { NextResponse } from "next/server";
import { assertAdminOr403, handleError } from "../../../../../lib/route-handlers";

export async function PATCH(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { supabase, user } = await assertAdminOr403();
    const { visible } = await req.json() as { visible: boolean };
    const { data, error } = await supabase
      .from("courses")
      .update({ is_visible: !!visible, updated_by: user.id, updated_at: new Date().toISOString() })
      .eq("slug", params.slug)
      .select()
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (e) { return handleError(e); }
}
