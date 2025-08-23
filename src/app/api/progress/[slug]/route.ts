import { NextResponse } from "next/server";
import { getUserOr401, handleError } from "../../../../lib/route-handlers";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { supabase, user } = await getUserOr401();
    const { data, error } = await supabase
      .from("course_progress")
      .select("completed_lessons, updated_at")
      .eq("user_id", user.id)
      .eq("course_slug", params.slug)
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ data: data ?? { completed_lessons: [], updated_at: null } });
  } catch (e) { return handleError(e); }
}

export async function PUT(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { supabase, user } = await getUserOr401();
    const { completed_lessons } = await req.json() as { completed_lessons: string[] };
    const { data, error } = await supabase
      .from("course_progress")
      .upsert({
        user_id: user.id,
        course_slug: params.slug,
        completed_lessons: Array.isArray(completed_lessons) ? completed_lessons : [],
        updated_at: new Date().toISOString(),
      })
      .select("completed_lessons, updated_at")
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (e) { return handleError(e); }
}
