import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { allCourses } from "@/lib/coursesData"; // wherever your file lives

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? // server builds only
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(url, key);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("courses")
      .select(`
        id,title,description,badge,emoji,href,category,level,access,squad,
        path_type,          -- 'tech' | 'social' | 'converged'
        total_lessons,
        is_visible,is_published,is_gated,
        created_at,updated_at,created_by
      `)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const mapped = (data ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      badge: r.badge,
      emoji: r.emoji,
      pathType: r.path_type,            // 'tech' | 'social' | 'converged'
      href: r.href,
      totalLessons: r.total_lessons ?? undefined,
      category: r.category ?? undefined,
      level: r.level ?? undefined,
      access: r.access ?? undefined,
      squad: r.squad ?? undefined,
      isVisible: r.is_visible,
      isPublished: r.is_published,
      isGated: r.is_gated ?? undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      createdBy: r.created_by ?? undefined,
    }));

    return NextResponse.json(mapped, { headers: { "x-source": "supabase" } });
  } catch (e) {
    // Fallback to local data so the page still loads
    const fallback = allCourses.filter(c => c.isVisible && c.isPublished);
    return NextResponse.json(fallback, {
      headers: { "x-source": "fallback" },
    });
  }
}

/** Seed / bulk upsert */
export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  const body = await req.json(); // array of courses
  // map your TS fields to DB columns
  const rows = (body ?? []).map((c: any) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    badge: c.badge,
    emoji: c.emoji,
    path_type: c.pathType,
    href: c.href,
    total_lessons: c.totalLessons ?? null,
    category: c.category ?? null,
    level: c.level ?? null,
    access: c.access ?? null,
    squad: c.squad ?? null,
    is_visible: c.isVisible,
    is_published: c.isPublished,
    is_gated: c.isGated ?? null,
    created_at: c.createdAt ?? new Date().toISOString(),
    updated_at: c.updatedAt ?? new Date().toISOString(),
    created_by: c.createdBy ?? null,
  }));

  const { data, error } = await supabase
    .from("courses")
    .upsert(rows, { onConflict: "id" })
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ count: data?.length ?? 0 });
}
