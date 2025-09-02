import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export function supabaseRouteClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function getUserOr401() {
  const supabase = supabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return { supabase, user };
}

/** Admin gate using public.users.is_admin (adjust if your table differs). */
export async function assertAdminOr403() {
  const { supabase, user } = await getUserOr401();
  const { data, error } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.is_admin) throw NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return { supabase, user };
}

/** Tiny helper to catch/format errors in handlers. */
export function handleError(e: unknown) {
  if (e instanceof Response) return e; // thrown NextResponse
  if (typeof e === "object" && e && "status" in (e as any) && "body" in (e as any)) return e as Response;
  const msg = e instanceof Error ? e.message : "Unexpected error";
  return NextResponse.json({ error: msg }, { status: 500 });
}
