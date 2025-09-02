"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

// Create Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function assertAdminWallet(walletAddress: string) {
  if (!walletAddress) throw new Error("Wallet address required");
  
  // Check if wallet is admin
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("is_admin")
    .eq("wallet_address", walletAddress)
    .maybeSingle();
    
  if (error) throw error;
  if (!user?.is_admin) throw new Error("Not an admin");
  
  return { supabase: supabaseAdmin, walletAddress };
}

/* ------------------------ BOUNTIES ------------------------ */

export async function createOrUpdateBounty(input: {
  id?: string;
  title: string;
  short_desc: string;
  reward: string;
  deadline?: string | null;
  link_to?: string | null;
  image?: string | null;
  squad_tag?: string | null;
  status?: "active" | "completed" | "expired";
  hidden?: boolean;
  submissions?: number;
}, walletAddress: string) {
  const { supabase } = await assertAdminWallet(walletAddress);
  
  const row = {
    ...input,
    id: input.id,
    updated_at: new Date().toISOString(),
    updated_by: walletAddress,
  };

  const { error } = await supabase
    .from("bounties")
    .upsert(row, { onConflict: "id" });

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/bounties");
}

export async function toggleBountyHidden(id: string, hidden: boolean, walletAddress: string) {
  const { supabase } = await assertAdminWallet(walletAddress);
  
  const { error } = await supabase
    .from("bounties")
    .update({ hidden, updated_by: walletAddress, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/bounties");
}

export async function deleteBounty(id: string, walletAddress: string) {
  const { supabase } = await assertAdminWallet(walletAddress);
  
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
  starts_at?: string | null;
  ends_at?: string | null;
  is_published?: boolean;
}, walletAddress: string) {
  const { supabase } = await assertAdminWallet(walletAddress);
  
  const row = {
    ...input,
    updated_at: new Date().toISOString(),
    updated_by: walletAddress,
  };

  const { error } = await supabase
    .from("announcements")
    .upsert(row, { onConflict: "id" });

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function publishAnnouncement(id: string, is_published: boolean, walletAddress: string) {
  const { supabase } = await assertAdminWallet(walletAddress);
  
  const { error } = await supabase
    .from("announcements")
    .update({ is_published, updated_by: walletAddress, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteAnnouncement(id: string, walletAddress: string) {
  const { supabase } = await assertAdminWallet(walletAddress);
  
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
  type: string;
  date?: string | null;
  time?: string | null;
}, walletAddress: string) {
  const { supabase } = await assertAdminWallet(walletAddress);
  
  const row = {
    ...input,
    updated_at: new Date().toISOString(),
    updated_by: walletAddress,
  };

  const { error } = await supabase
    .from("events")
    .upsert(row, { onConflict: "id" });

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/events");
}

export async function deleteEvent(id: string, walletAddress: string) {
  const { supabase } = await assertAdminWallet(walletAddress);
  
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/events");
}

/* ------------------------ COURSES ------------------------ */

export async function createOrUpdateCourse(input: {
  id?: string;
  title: string;
  emoji: string;
  squad?: string | null;
  level?: string | null;
  access?: string | null;
  description?: string | null;
  total_lessons?: number | null;
  category?: string | null;
  is_visible?: boolean;
  is_published?: boolean;
  slug?: string | null;
  sort_order?: number | null;
}, walletAddress: string) {
  const { supabase } = await assertAdminWallet(walletAddress);
  
  const row = {
    ...input,
    updated_at: new Date().toISOString(),
    updated_by: walletAddress,
  };

  const { error } = await supabase
    .from("courses")
    .upsert(row, { onConflict: "id" });

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/courses");
}

export async function deleteCourse(id: string, walletAddress: string) {
  const { supabase } = await assertAdminWallet(walletAddress);
  
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/courses");
}

/* --------------------- SUBMISSIONS ---------------------- */

export async function updateSubmissionStatus(id: string, status: string, walletAddress: string) {
  const { supabase } = await assertAdminWallet(walletAddress);
  
  const { error } = await supabase
    .from("submissions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/submissions");
}

export async function deleteSubmission(id: string, walletAddress: string) {
  const { supabase } = await assertAdminWallet(walletAddress);
  
  const { error } = await supabase.from("submissions").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/submissions");
}
