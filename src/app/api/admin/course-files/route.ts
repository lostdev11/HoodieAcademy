import { NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const coursesDir = join(process.cwd(), 'public', 'courses');
    
    // Read all JSON files in the courses directory
    const files = await readdir(coursesDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const courseFiles = [];
    
    for (const file of jsonFiles) {
      try {
        const filePath = join(coursesDir, file);
        const fileContent = await readFile(filePath, 'utf-8');
        const courseData = JSON.parse(fileContent);
        
        // Ensure the course has an ID (use filename if not present)
        if (!courseData.id) {
          courseData.id = file.replace('.json', '');
        }
        
        // Add file metadata
        courseData.fileName = file;
        courseData.filePath = `/courses/${file}`;
        
        courseFiles.push(courseData);
      } catch (fileError) {
        console.error(`Error reading course file ${file}:`, fileError);
        // Continue with other files even if one fails
      }
    }
    
    // Sort by filename for consistent ordering
    courseFiles.sort((a, b) => a.fileName.localeCompare(b.fileName));
    
    return NextResponse.json(courseFiles);
  } catch (error) {
    console.error('Error reading course files:', error);
    return NextResponse.json({ error: 'Failed to read course files' }, { status: 500 });
  }
}
