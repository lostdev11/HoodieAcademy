import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Read course JSON files
    const coursesDir = path.join(process.cwd(), 'public', 'courses');
    const courseFiles = fs.readdirSync(coursesDir).filter(file => file.endsWith('.json'));
    
    const importedCourses = [];
    const errors = [];
    
    for (const file of courseFiles) {
      try {
        const filePath = path.join(coursesDir, file);
        const courseData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Map course data to database format - only use columns that exist
        const courseToInsert = {
          id: courseData.id || courseData.slug || path.basename(file, '.json'),
          title: courseData.title,
          description: courseData.description || '',
          emoji: courseData.emoji || '📚',
          squad: courseData.squad?.toLowerCase() || null,
          level: courseData.level || 'beginner',
          access: courseData.access || 'free',
          category: courseData.category || 'general',
          totalLessons: courseData.totalLessons || 0,
          is_visible: true,
          is_published: false
        };
        
        // Insert course
        const { data, error } = await supabase
          .from('courses')
          .upsert(courseToInsert, { onConflict: 'id' })
          .select()
          .single();
        
        if (error) {
          errors.push({ file, error: error.message });
        } else {
          importedCourses.push(data);
        }
        
      } catch (fileError) {
        errors.push({ file, error: `File read error: ${fileError}` });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Imported ${importedCourses.length} courses`,
      imported: importedCourses.length,
      errors: errors.length,
      details: {
        imported: importedCourses.map(c => ({ id: c.id, title: c.title })),
        errors: errors
      }
    });
    
  } catch (error) {
    console.error('Error importing courses:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
