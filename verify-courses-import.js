const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Course import verification script for Hoodie Academy Admin Dashboard
// This script verifies that all courses were successfully imported

async function verifyCoursesImport() {
  console.log('🔍 Verifying course import for Hoodie Academy Admin Dashboard...\n');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
  }
  
  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Connected to Supabase\n');
    
    // Check if courses table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('courses')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Courses table not found or accessible');
      console.error('Error:', tableError.message);
      console.log('\n💡 Please run the admin dashboard schema setup first:');
      console.log('   src/lib/admin-dashboard-schema.sql');
      process.exit(1);
    }
    
    // Get total course count
    const { count: totalCourses, error: countError } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting courses:', countError.message);
      process.exit(1);
    }
    
    console.log(`📊 Total courses in database: ${totalCourses}\n`);
    
    if (totalCourses === 0) {
      console.log('⚠️  No courses found in database');
      console.log('💡 Please run the import script first: node import-courses-to-admin.js');
      process.exit(1);
    }
    
    // Get courses by squad
    const { data: squadStats, error: squadError } = await supabase
      .from('courses')
      .select('squad')
      .not('squad', 'is', null);
    
    if (squadError) {
      console.error('❌ Error getting squad stats:', squadError.message);
    } else {
      const squadCounts = {};
      squadStats.forEach(course => {
        squadCounts[course.squad] = (squadCounts[course.squad] || 0) + 1;
      });
      
      console.log('🏛️  Courses by Squad:');
      Object.entries(squadCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([squad, count]) => {
          console.log(`   ${squad}: ${count} courses`);
        });
      console.log();
    }
    
    // Get courses by level
    const { data: levelStats, error: levelError } = await supabase
      .from('courses')
      .select('level');
    
    if (levelError) {
      console.error('❌ Error getting level stats:', levelError.message);
    } else {
      const levelCounts = {};
      levelStats.forEach(course => {
        levelCounts[course.level] = (levelCounts[course.level] || 0) + 1;
      });
      
      console.log('📈 Courses by Level:');
      Object.entries(levelCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([level, count]) => {
          console.log(`   ${level}: ${count} courses`);
        });
      console.log();
    }
    
    // Get courses by access
    const { data: accessStats, error: accessError } = await supabase
      .from('courses')
      .select('access');
    
    if (accessError) {
      console.error('❌ Error getting access stats:', accessError.message);
    } else {
      const accessCounts = {};
      accessStats.forEach(course => {
        accessCounts[course.access] = (accessCounts[course.access] || 0) + 1;
      });
      
      console.log('🔓 Courses by Access:');
      Object.entries(accessCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([access, count]) => {
          console.log(`   ${access}: ${count} courses`);
        });
      console.log();
    }
    
    // Check publication status
    const { data: pubStats, error: pubError } = await supabase
      .from('courses')
      .select('is_visible, is_published');
    
    if (pubError) {
      console.error('❌ Error getting publication stats:', pubError.message);
    } else {
      const visibleCount = pubStats.filter(c => c.is_visible).length;
      const publishedCount = pubStats.filter(c => c.is_published).length;
      
      console.log('📢 Publication Status:');
      console.log(`   Visible: ${visibleCount} courses`);
      console.log(`   Published: ${publishedCount} courses`);
      console.log(`   Hidden: ${totalCourses - visibleCount} courses`);
      console.log(`   Unpublished: ${totalCourses - publishedCount} courses`);
      console.log();
    }
    
    // Sample course details
    const { data: sampleCourses, error: sampleError } = await supabase
      .from('courses')
      .select('id, title, squad, level, access, is_visible, is_published')
      .limit(5);
    
    if (sampleError) {
      console.error('❌ Error getting sample courses:', sampleError.message);
    } else {
      console.log('📝 Sample Courses:');
      sampleCourses.forEach((course, index) => {
        console.log(`   ${index + 1}. ${course.title}`);
        console.log(`      Squad: ${course.squad || 'None'}, Level: ${course.level}, Access: ${course.access}`);
        console.log(`      Status: ${course.is_visible ? 'Visible' : 'Hidden'}, ${course.is_published ? 'Published' : 'Unpublished'}`);
        console.log();
      });
    }
    
    // Expected vs actual
    const expectedCourses = 39;
    if (totalCourses >= expectedCourses) {
      console.log(`✅ SUCCESS: ${totalCourses} courses imported (expected: ${expectedCourses})`);
      console.log('\n🎯 Next Steps:');
      console.log('   1. Review courses in your admin dashboard');
      console.log('   2. Set publication status for courses you want to go live');
      console.log('   3. Adjust visibility and access levels as needed');
      console.log('   4. Test the user experience with published courses');
    } else {
      console.log(`⚠️  PARTIAL: ${totalCourses} courses imported (expected: ${expectedCourses})`);
      console.log('\n💡 Some courses may not have been imported. Check for errors in the import process.');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check your Supabase credentials in .env.local');
    console.error('   2. Ensure the courses table exists');
    console.error('   3. Verify your database connection');
    process.exit(1);
  }
}

// Run verification
if (require.main === module) {
  verifyCoursesImport();
}

module.exports = { verifyCoursesImport };
