const fs = require('fs');
const path = require('path');

// Course import script for Hoodie Academy Admin Dashboard
// This script reads all course JSON files and creates SQL INSERT statements

const COURSES_DIR = './public/courses';
const OUTPUT_FILE = './import-courses.sql';

// Course mapping configuration
const COURSE_MAPPINGS = {
  // Squad mappings
  'Creators': 'creators',
  'Decoders': 'decoders', 
  'Raiders': 'raiders',
  'Rangers': 'rangers',
  
  // Level mappings
  'beginner': 'beginner',
  'intermediate': 'intermediate',
  'advanced': 'advanced',
  
  // Access mappings
  'free': 'free',
  'hoodie': 'hoodie',
  'dao': 'dao'
};

// Default values for missing fields
const DEFAULT_VALUES = {
  level: 'beginner',
  access: 'free',
  is_visible: true,
  is_published: false,
  sort_order: 0
};

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function mapCourseData(courseFile, courseData) {
  const slug = courseData.slug || generateSlug(courseData.title);
  
  return {
    id: courseData.id || slug,
    slug: slug,
    title: courseData.title,
    description: courseData.description || '',
    emoji: courseData.emoji || '📚',
    badge: courseData.badge || '',
    squad: COURSE_MAPPINGS[courseData.squad] || courseData.squad || null,
    level: COURSE_MAPPINGS[courseData.level] || courseData.level || DEFAULT_VALUES.level,
    access: COURSE_MAPPINGS[courseData.access] || courseData.access || DEFAULT_VALUES.access,
    category: courseData.category || courseData.pathType || 'general',
    totalLessons: courseData.totalLessons || 0,
    is_visible: DEFAULT_VALUES.is_visible,
    is_published: DEFAULT_VALUES.is_published,
    sort_order: DEFAULT_VALUES.sort_order,
    cover_url: courseData.cover_url || null
  };
}

function generateSQLInsert(courseData) {
  const fields = Object.keys(courseData).filter(key => courseData[key] !== null);
  const values = fields.map(key => {
    const value = courseData[key];
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`;
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    return value;
  });

  return `INSERT INTO courses (${fields.join(', ')}) VALUES (${values.join(', ')})
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  badge = EXCLUDED.badge,
  squad = EXCLUDED.squad,
  level = EXCLUDED.level,
  access = EXCLUDED.access,
  category = EXCLUDED.category,
  totalLessons = EXCLUDED.totalLessons,
  is_visible = EXCLUDED.is_visible,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  cover_url = EXCLUDED.cover_url,
  updated_at = NOW();`;
}

function main() {
  console.log('🚀 Starting course import for Hoodie Academy Admin Dashboard...\n');
  
  // Check if courses directory exists
  if (!fs.existsSync(COURSES_DIR)) {
    console.error(`❌ Courses directory not found: ${COURSES_DIR}`);
    process.exit(1);
  }
  
  // Read all course files
  const courseFiles = fs.readdirSync(COURSES_DIR)
    .filter(file => file.endsWith('.json'))
    .filter(file => file !== 'sample-course.json'); // Skip sample course
  
  console.log(`📚 Found ${courseFiles.length} course files to import\n`);
  
  if (courseFiles.length === 0) {
    console.log('No course files found to import.');
    return;
  }
  
  // Generate SQL header
  let sqlContent = `-- =====================================================
-- COURSE IMPORT SCRIPT FOR HOODIE ACADEMY ADMIN DASHBOARD
-- Generated on: ${new Date().toISOString()}
-- Total courses: ${courseFiles.length}
-- =====================================================

-- First, ensure the courses table has all necessary columns
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create unique index on slug if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS courses_slug_idx ON courses(slug);

-- =====================================================
-- COURSE DATA INSERTS
-- =====================================================

`;
  
  // Process each course file
  const processedCourses = [];
  const errors = [];
  
  courseFiles.forEach((filename, index) => {
    try {
      const filePath = path.join(COURSES_DIR, filename);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const courseData = JSON.parse(fileContent);
      
      // Map the course data
      const mappedCourse = mapCourseData(filename, courseData);
      processedCourses.push(mappedCourse);
      
      // Generate SQL insert
      const sqlInsert = generateSQLInsert(mappedCourse);
      sqlContent += `-- ${index + 1}. ${mappedCourse.title} (${filename})
${sqlInsert}

`;
      
      console.log(`✅ Processed: ${mappedCourse.title} (${mappedCourse.squad || 'No Squad'})`);
      
    } catch (error) {
      console.error(`❌ Error processing ${filename}:`, error.message);
      errors.push({ filename, error: error.message });
    }
  });
  
  // Add summary and verification queries
  sqlContent += `-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check total courses imported
SELECT COUNT(*) as total_courses FROM courses;

-- Check courses by squad
SELECT squad, COUNT(*) as course_count 
FROM courses 
GROUP BY squad 
ORDER BY course_count DESC;

-- Check courses by level
SELECT level, COUNT(*) as course_count 
FROM courses 
GROUP BY level 
ORDER BY course_count DESC;

-- Check courses by access
SELECT access, COUNT(*) as course_count 
FROM courses 
GROUP BY access 
ORDER BY course_count DESC;

-- Check visibility status
SELECT 
  is_visible,
  is_published,
  COUNT(*) as course_count 
FROM courses 
GROUP BY is_visible, is_published 
ORDER BY is_visible, is_published;

-- List all imported courses
SELECT 
  id,
  slug,
  title,
  squad,
  level,
  access,
  is_visible,
  is_published,
  sort_order
FROM courses 
ORDER BY sort_order, title;
`;
  
  // Write SQL file
  fs.writeFileSync(OUTPUT_FILE, sqlContent);
  
  // Print summary
  console.log(`\n📊 IMPORT SUMMARY:`);
  console.log(`   Total courses processed: ${processedCourses.length}`);
  console.log(`   Errors: ${errors.length}`);
  console.log(`   SQL file generated: ${OUTPUT_FILE}`);
  
  if (errors.length > 0) {
    console.log(`\n❌ ERRORS ENCOUNTERED:`);
    errors.forEach(({ filename, error }) => {
      console.log(`   ${filename}: ${error}`);
    });
  }
  
  // Print course statistics
  const squadStats = {};
  const levelStats = {};
  const accessStats = {};
  
  processedCourses.forEach(course => {
    squadStats[course.squad || 'No Squad'] = (squadStats[course.squad || 'No Squad'] || 0) + 1;
    levelStats[course.level] = (levelStats[course.level] || 0) + 1;
    accessStats[course.access] = (accessStats[course.access] || 0) + 1;
  });
  
  console.log(`\n📈 COURSE STATISTICS:`);
  console.log(`   Squads:`, squadStats);
  console.log(`   Levels:`, levelStats);
  console.log(`   Access:`, accessStats);
  
  console.log(`\n🎯 NEXT STEPS:`);
  console.log(`   1. Review the generated SQL file: ${OUTPUT_FILE}`);
  console.log(`   2. Run the SQL in your Supabase SQL editor`);
  console.log(`   3. Verify courses appear in your admin dashboard`);
  console.log(`   4. Adjust visibility and publish status as needed`);
  
  console.log(`\n✨ Course import completed successfully!`);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, mapCourseData, generateSQLInsert };
