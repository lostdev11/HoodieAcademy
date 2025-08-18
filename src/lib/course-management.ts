'use server';

import { createServerClient } from '@/lib/supabase/server'; // your helper

// Public list (respects RLS to show only visible)
export async function listPublicCourses() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Admin list (RLS allows admin to see all)
export async function listAllCoursesForAdmin() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Toggle visibility
export async function setCourseVisibility(courseId: string, isVisible: boolean) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('courses')
    .update({ is_visible: isVisible })
    .eq('id', courseId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
