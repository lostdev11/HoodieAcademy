import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST() {
  try {
    const supabase = getSupabaseAdmin();
    
    console.log('📚 Starting course import from directory...');
    
    // Path to the courses directory
    const coursesDir = path.join(process.cwd(), 'public', 'courses');
    
    try {
      // Check if courses directory exists
      await fs.access(coursesDir);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Courses directory not found',
        message: 'Please create a public/courses directory with course JSON files'
      }, { status: 404 });
    }
    
    // Read all files in the courses directory
    const files = await fs.readdir(coursesDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      return NextResponse.json({ 
        error: 'No course files found',
        message: 'Please add JSON course files to the public/courses directory'
      }, { status: 404 });
    }
    
    console.log(`📁 Found ${jsonFiles.length} course files`);
    
    const importedCourses = [];
    const errors = [];
    
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(coursesDir, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const courseData = JSON.parse(fileContent);
        
        // Generate a proper UUID for the course
        const courseId = crypto.randomUUID();
        
        // Prepare course data for database
        const course = {
          id: courseId,
          title: courseData.title || courseData.name || 'Untitled Course',
          emoji: courseData.emoji || courseData.icon || '📚',
          squad: courseData.squad || courseData.category || 'All',
          level: courseData.level || 'beginner',
          access: courseData.access || 'free',
          description: courseData.description || courseData.summary || '',
          total_lessons: courseData.totalLessons || courseData.lessons?.length || 0,
          category: courseData.category || courseData.type || 'general',
          is_visible: true,
          is_published: true, // Start as published
          slug: courseData.slug || courseId,
          sort_order: courseData.sortOrder || courseData.order || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Insert/update course in database
        const { error: insertError } = await supabase
          .from('courses')
          .upsert(course, { onConflict: 'id' });
        
        if (insertError) {
          console.error(`❌ Error importing course ${courseId}:`, insertError);
          errors.push({ courseId, error: insertError.message });
        } else {
          console.log(`✅ Course ${courseId} imported successfully`);
          importedCourses.push(course);
        }
        
      } catch (error) {
        console.error(`❌ Error processing file ${file}:`, error);
        errors.push({ file, error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    console.log(`🎉 Course import completed: ${importedCourses.length} courses imported, ${errors.length} errors`);
    
    return NextResponse.json({
      success: true,
      message: 'Course import completed',
      summary: {
        totalFiles: jsonFiles.length,
        importedCourses: importedCourses.length,
        errors: errors.length
      },
      importedCourses: importedCourses.map(c => ({ id: c.id, title: c.title, slug: c.slug })),
      errors: errors
    });
    
  } catch (error) {
    console.error('❌ Course import failed:', error);
    return NextResponse.json({ 
      error: 'Course import failed', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
