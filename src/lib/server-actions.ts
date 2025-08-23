"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

async function assertAdmin(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data: me, error } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!me?.is_admin) throw new Error("Not an admin");
  return user.id;
}

export async function setCourseVisibility(courseId: string, visible: boolean) {
  const supabase = createServerActionClient({ cookies });
  const uid = await assertAdmin(supabase);

  const { error } = await supabase
    .from("courses")
    .update({ is_visible: visible, updated_by: uid, updated_at: new Date().toISOString() })
    .eq("id", courseId);
  if (error) throw error;

  // Revalidate public routes that show courses
  revalidatePath("/courses");
  revalidatePath("/"); // if homepage shows courses/catalog
}

export async function setCoursePublished(courseId: string, published: boolean) {
  const supabase = createServerActionClient({ cookies });
  const uid = await assertAdmin(supabase);

  const { error } = await supabase
    .from("courses")
    .update({ is_published: published, updated_by: uid, updated_at: new Date().toISOString() })
    .eq("id", courseId);
  if (error) throw error;

  revalidatePath("/courses");
  revalidatePath("/");
}

// Additional course management functions that integrate with your existing setup
export async function updateCourse(courseId: string, updates: Record<string, any>) {
  const supabase = createServerActionClient({ cookies });
  const uid = await assertAdmin(supabase);

  const { error } = await supabase
    .from("courses")
    .update({ 
      ...updates, 
      updated_by: uid, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", courseId);
  if (error) throw error;

  revalidatePath("/courses");
  revalidatePath("/");
}

export async function deleteCourse(courseId: string) {
  const supabase = createServerActionClient({ cookies });
  const uid = await assertAdmin(supabase);

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId);
  if (error) throw error;

  revalidatePath("/courses");
  revalidatePath("/");
}

export async function createCourse(courseData: Record<string, any>) {
  const supabase = createServerActionClient({ cookies });
  const uid = await assertAdmin(supabase);

  const { error } = await supabase
    .from("courses")
    .insert({
      ...courseData,
      created_by: uid,
      created_at: new Date().toISOString(),
      updated_by: uid,
      updated_at: new Date().toISOString()
    });
  if (error) throw error;

  revalidatePath("/courses");
  revalidatePath("/");
}
