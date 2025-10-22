// Test Enhanced Course API for Admins
// Run this in browser console or Node.js environment

const ADMIN_WALLET = 'YOUR_ADMIN_WALLET_ADDRESS'; // Replace with your admin wallet
const BASE_URL = 'http://localhost:3001'; // Adjust if different

// Test 1: Fetch all courses as admin
async function testAdminCourseFetch() {
  console.log('🧪 Testing Admin Course Fetch...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/courses?wallet_address=${ADMIN_WALLET}&is_admin=true&include_hidden=true`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Admin course fetch successful');
      console.log('📊 Course Statistics:', data.stats);
      console.log('📚 Total courses:', data.courses.length);
      console.log('👁️ Visible courses:', data.courses.filter(c => !c.is_hidden).length);
      console.log('🙈 Hidden courses:', data.courses.filter(c => c.is_hidden).length);
      console.log('📢 Published courses:', data.courses.filter(c => c.is_published).length);
    } else {
      console.error('❌ Admin course fetch failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Test 2: Toggle course visibility
async function testToggleVisibility(courseId, isHidden) {
  console.log(`🧪 Testing Toggle Visibility for course ${courseId}...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/courses`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course_id: courseId,
        admin_wallet: ADMIN_WALLET,
        is_hidden: !isHidden
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Visibility toggle successful');
      console.log('📝 Message:', data.message);
      console.log('🔄 New status:', data.course.is_hidden ? 'Hidden' : 'Visible');
    } else {
      console.error('❌ Visibility toggle failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Test 3: Toggle course publish status
async function testTogglePublish(courseId, isPublished) {
  console.log(`🧪 Testing Toggle Publish for course ${courseId}...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/courses`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course_id: courseId,
        admin_wallet: ADMIN_WALLET,
        is_published: !isPublished
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Publish toggle successful');
      console.log('📝 Message:', data.message);
      console.log('🔄 New status:', data.course.is_published ? 'Published' : 'Unpublished');
    } else {
      console.error('❌ Publish toggle failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Test 4: Update course order
async function testUpdateOrder(courseId, newOrder) {
  console.log(`🧪 Testing Update Order for course ${courseId}...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/courses`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course_id: courseId,
        admin_wallet: ADMIN_WALLET,
        order_index: newOrder
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Order update successful');
      console.log('📝 Message:', data.message);
      console.log('🔄 New order:', data.course.order_index);
    } else {
      console.error('❌ Order update failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Test 5: Delete course (DANGEROUS - only use with test courses)
async function testDeleteCourse(courseId) {
  console.log(`🧪 Testing Delete Course for course ${courseId}...`);
  console.log('⚠️ WARNING: This will permanently delete the course!');
  
  // Uncomment the lines below to actually test deletion
  // Only use with test courses!
  
  /*
  try {
    const response = await fetch(`${BASE_URL}/api/courses`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course_id: courseId,
        admin_wallet: ADMIN_WALLET
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Course deletion successful');
      console.log('📝 Message:', data.message);
      console.log('🗑️ Deleted course:', data.deleted_course);
    } else {
      console.error('❌ Course deletion failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
  */
  
  console.log('🔒 Delete test skipped for safety. Uncomment code to test deletion.');
}

// Test 6: Verify admin access
async function testAdminAccess() {
  console.log('🧪 Testing Admin Access...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/courses?wallet_address=${ADMIN_WALLET}&is_admin=true&include_hidden=true`);
    const data = await response.json();
    
    if (response.ok && data.isAdmin) {
      console.log('✅ Admin access verified');
      console.log('👑 User is admin:', data.isAdmin);
    } else {
      console.error('❌ Admin access denied or user not admin');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Test 7: Compare admin vs regular user view
async function testUserViewComparison() {
  console.log('🧪 Testing Admin vs Regular User View...');
  
  try {
    // Admin view
    const adminResponse = await fetch(`${BASE_URL}/api/courses?wallet_address=${ADMIN_WALLET}&is_admin=true&include_hidden=true`);
    const adminData = await adminResponse.json();
    
    // Regular user view (simulate)
    const userResponse = await fetch(`${BASE_URL}/api/courses?wallet_address=${ADMIN_WALLET}&is_admin=false`);
    const userData = await userResponse.json();
    
    console.log('📊 Admin view courses:', adminData.courses.length);
    console.log('👤 Regular user view courses:', userData.courses.length);
    console.log('📈 Difference:', adminData.courses.length - userData.courses.length, 'courses hidden from regular users');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Enhanced Course API Tests...\n');
  
  // Test 1: Admin access
  await testAdminAccess();
  console.log('');
  
  // Test 2: Fetch all courses
  await testAdminCourseFetch();
  console.log('');
  
  // Test 3: User view comparison
  await testUserViewComparison();
  console.log('');
  
  console.log('✅ All tests completed!');
  console.log('💡 To test individual functions, call them manually:');
  console.log('   - testToggleVisibility(courseId, isHidden)');
  console.log('   - testTogglePublish(courseId, isPublished)');
  console.log('   - testUpdateOrder(courseId, newOrder)');
  console.log('   - testDeleteCourse(courseId) // DANGEROUS!');
}

// Export functions for manual testing
window.testEnhancedCourseAPI = {
  runAllTests,
  testAdminCourseFetch,
  testToggleVisibility,
  testTogglePublish,
  testUpdateOrder,
  testDeleteCourse,
  testAdminAccess,
  testUserViewComparison
};

// Auto-run tests if in browser
if (typeof window !== 'undefined') {
  console.log('🎯 Enhanced Course API Test Suite Loaded');
  console.log('📝 Usage:');
  console.log('   1. Update ADMIN_WALLET variable with your admin wallet');
  console.log('   2. Run: testEnhancedCourseAPI.runAllTests()');
  console.log('   3. Or test individual functions manually');
}
