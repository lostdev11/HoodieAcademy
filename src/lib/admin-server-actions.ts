"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";

async function assertAdminClient() {
  try {
    const supabase = createServerActionClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error:', authError);
      throw new Error(`Authentication error: ${authError.message}`);
    }
    
    if (!user) {
      console.error('No user found');
      throw new Error("Not signed in");
    }
    
    console.log('User authenticated:', user.id);
    
    const { data: me, error: adminError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
      
    if (adminError) {
      console.error('Admin check error:', adminError);
      throw adminError;
    }
    
    if (!me?.is_admin) {
      console.error('User is not admin:', user.id);
      throw new Error("Not an admin");
    }
    
    console.log('Admin access confirmed for user:', user.id);
    return { supabase, user };
  } catch (error) {
    console.error('assertAdminClient error:', error);
    throw error;
  }
}

/* ------------------------ BOUNTIES ------------------------ */

export async function createOrUpdateBounty(input: {
  id?: string;
  title: string;
  short_desc: string;
  reward: string;
  reward_type?: 'XP' | 'SOL' | 'NFT';
  start_date?: string | null;   // 'YYYY-MM-DDTHH:MM'
  deadline?: string | null;     // 'YYYY-MM-DDTHH:MM'
  link_to?: string | null;
  image?: string | null;
  squad_tag?: string | null;
  status?: "active" | "completed" | "expired";
  hidden?: boolean;
  submissions?: number;
}) {
  try {
    console.log('createOrUpdateBounty called with input:', input);
    
    const { supabase, user } = await assertAdminClient();
    console.log('Admin client obtained for user:', user.id);
    
    const row = {
      ...input,
      id: input.id, // upsert supports insert if id absent
      created_at: input.id ? undefined : new Date().toISOString(), // Only set created_at for new records
      updated_at: new Date().toISOString(),
    };
    
    console.log('Prepared row data:', row);

    const { data, error } = await supabase
      .from("bounties")
      .upsert(row, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.error('Supabase upsert error:', error);
      throw error;
    }
    
    console.log('Bounty upsert successful, data:', data);
    
    revalidatePath("/admin");
    revalidatePath("/bounties");
    
    return data;
  } catch (error) {
    console.error('createOrUpdateBounty error:', error);
    throw error;
  }
}

export async function toggleBountyHidden(id: string, hidden: boolean) {
  const { supabase, user } = await assertAdminClient();
  const { error } = await supabase
    .from("bounties")
    .update({ hidden, updated_at: new Date().toISOString() })
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
