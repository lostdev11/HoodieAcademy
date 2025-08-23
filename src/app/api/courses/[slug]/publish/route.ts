import { NextResponse } from "next/server";
import { assertAdminOr403, handleError } from "../../../../../lib/route-handlers";

export async function PATCH(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { supabase, user } = await assertAdminOr403();
    const { published } = await req.json() as { published: boolean };
    const { data, error } = await supabase
      .from("courses")
      .update({ is_published: !!published, updated_by: user.id, updated_at: new Date().toISOString() })
      .eq("slug", params.slug)
      .select()
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (e) { return handleError(e); }
}
