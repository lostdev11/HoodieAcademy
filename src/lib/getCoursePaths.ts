import fs from 'fs';
import path from 'path';

/**
 * Auto-generates all dynamic routes from /public/courses/*.json files
 * Use this in getStaticPaths for dynamic course routing
 */
export function getCoursePaths(): string[] {
  const coursesDir = path.join(process.cwd(), 'public', 'courses');
  
  try {
    // Check if courses directory exists
    if (!fs.existsSync(coursesDir)) {
      console.warn('Courses directory not found:', coursesDir);
      return [];
    }

    // Read all JSON files in the courses directory
    const files = fs.readdirSync(coursesDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    // Extract course slugs from filenames (remove .json extension)
    const slugs = jsonFiles.map(file => file.replace('.json', ''));
    
    return slugs;
  } catch (error) {
    console.error('Error reading course paths:', error);
    return [];
  }
}

/**
 * Get course data by slug
 * @param slug - The course slug (filename without .json)
 * @returns Course data object or null if not found
 */
export function getCourseData(slug: string): any {
  const coursesDir = path.join(process.cwd(), 'public', 'courses');
  const filePath = path.join(coursesDir, `${slug}.json`);
  
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading course data for ${slug}:`, error);
    return null;
  }
}

/**
 * Get all course data
 * @returns Array of all course data objects
 */
export function getAllCourseData(): any[] {
  const slugs = getCoursePaths();
  const courses = slugs.map(slug => {
    const data = getCourseData(slug);
    return {
      slug,
      ...data
    };
  }).filter(course => course !== null);
  
  return courses;
}

/**
 * Filter courses by squad
 * @param courses - Array of course data
 * @param squad - Squad name to filter by
 * @returns Filtered array of courses
 */
export function filterCoursesBySquad(courses: any[], squad: string): any[] {
  if (squad === 'All') {
    return courses;
  }
  
  return courses.filter(course => course.squad === squad);
}

/**
 * Get unique squads from course data
 * @param courses - Array of course data
 * @returns Array of unique squad names
 */
export function getUniqueSquads(courses: any[]): string[] {
  const squads = courses
    .map(course => course.squad)
    .filter(squad => squad) // Remove undefined/null values
    .filter((squad, index, arr) => arr.indexOf(squad) === index); // Remove duplicates
  
  return squads;
} 