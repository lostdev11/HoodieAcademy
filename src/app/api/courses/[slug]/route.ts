import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin } from "@/lib/supabaseClient";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    console.log('API: Loading course:', slug);
    
    // Read course file from public directory
    const coursePath = path.join(process.cwd(), 'public', 'courses', `${slug}.json`);
    console.log('API: Course path:', coursePath);
    
    // Check if file exists
    if (!fs.existsSync(coursePath)) {
      console.error('API: Course file does not exist:', coursePath);
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    // Read and parse course data
    const courseData = fs.readFileSync(coursePath, 'utf8');
    console.log('API: Course file read successfully, size:', courseData.length);
    
    if (!courseData || courseData.trim() === '') {
      console.error('API: Course file is empty');
      return NextResponse.json({ error: 'Course file is empty' }, { status: 500 });
    }
    
    const course = JSON.parse(courseData);
    console.log('API: Course loaded successfully:', course.title);
    console.log('API: Course has modules:', course.modules?.length || 0);
    
    // Validate course structure
    if (!course.modules || !Array.isArray(course.modules) || course.modules.length === 0) {
      console.error('API: Course has no valid modules');
      return NextResponse.json({ error: 'Course has no valid modules' }, { status: 500 });
    }
    
    return NextResponse.json(course);
  } catch (error) {
    console.error('API: Error loading course:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const supabase = getSupabaseAdmin();
  const body = await req.json(); // { isVisible?, isPublished?, ... }

  const patch: any = {};
  if (body.title !== undefined) patch.title = body.title;
  if (body.description !== undefined) patch.description = body.description;
  if (body.badge !== undefined) patch.badge = body.badge;
  if (body.emoji !== undefined) patch.emoji = body.emoji;
  if (body.pathType !== undefined) patch.path_type = body.pathType;
  if (body.href !== undefined) patch.href = body.href;
  if (body.totalLessons !== undefined) patch.total_lessons = body.totalLessons;
  if (body.category !== undefined) patch.category = body.category;
  if (body.level !== undefined) patch.level = body.level;
  if (body.access !== undefined) patch.access = body.access;
  if (body.squad !== undefined) patch.squad = body.squad;
  if (body.isVisible !== undefined) patch.is_visible = body.isVisible;
  if (body.isPublished !== undefined) patch.is_published = body.isPublished;
  if (body.isGated !== undefined) patch.is_gated = body.isGated;

  patch.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("courses")
    .update(patch)
    .eq("slug", params.slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
