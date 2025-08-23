"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";

async function assertAdminClient() {
  const supabase = createServerActionClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data: me, error } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!me?.is_admin) throw new Error("Not an admin");
  return { supabase, user };
}

/* ------------------------ BOUNTIES ------------------------ */

export async function createOrUpdateBounty(input: {
  id?: string;
  title: string;
  short_desc: string;
  reward: string;
  deadline?: string | null;     // 'YYYY-MM-DD'
  link_to?: string | null;
  image?: string | null;
  squad_tag?: string | null;
  status?: "active" | "completed" | "expired";
  hidden?: boolean;
  submissions?: number;
}) {
  const { supabase, user } = await assertAdminClient();
  const row = {
    ...input,
    id: input.id, // upsert supports insert if id absent
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };

  const { error } = await supabase
    .from("bounties")
    .upsert(row, { onConflict: "id" });

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/bounties");
}

export async function toggleBountyHidden(id: string, hidden: boolean) {
  const { supabase, user } = await assertAdminClient();
  const { error } = await supabase
    .from("bounties")
    .update({ hidden, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/bounties");
}

export async function deleteBounty(id: string) {
  const { supabase } = await assertAdminClient();
  const { error } = await supabase.from("bounties").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/bounties");
}

/* --------------------- ANNOUNCEMENTS ---------------------- */

export async function createOrUpdateAnnouncement(input: {
  id?: string;
  title: string;
  content: string;
  starts_at?: string | null;   // ISO string
  ends_at?: string | null;     // ISO string
  is_published?: boolean;
}) {
  const { supabase, user } = await assertAdminClient();
  const row = {
    ...input,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };

  const { error } = await supabase
    .from("announcements")
    .upsert(row, { onConflict: "id" });

  if (error) throw error;
  revalidatePath("/admin");
  // any route where announcements are shown:
  revalidatePath("/");
}

export async function publishAnnouncement(id: string, is_published: boolean) {
  const { supabase, user } = await assertAdminClient();
  const { error } = await supabase
    .from("announcements")
    .update({ is_published, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteAnnouncement(id: string) {
  const { supabase } = await assertAdminClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/");
}

/* ------------------------- EVENTS ------------------------- */

export async function createOrUpdateEvent(input: {
  id?: string;
  title: string;
  description: string;
  type: string;        // space | class | workshop | etc.
  date?: string | null; // 'YYYY-MM-DD'
  time?: string | null; // free text
}) {
  const { supabase, user } = await assertAdminClient();
  const row = {
    ...input,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };

  const { error } = await supabase
    .from("events")
    .upsert(row, { onConflict: "id" });

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/events");
}

export async function deleteEvent(id: string) {
  const { supabase } = await assertAdminClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/events");
}
