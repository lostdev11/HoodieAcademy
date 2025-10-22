/**
 * Course Management API Tests
 * Run in browser console or Node.js to test the new API endpoints
 */

const BASE_URL = 'https://hoodieacademy.com'; // Change to localhost for local testing
const ADMIN_WALLET = 'YOUR_ADMIN_WALLET_ADDRESS_HERE'; // Replace with your admin wallet

// Test configurations
const testConfig = {
  baseUrl: BASE_URL,
  adminWallet: ADMIN_WALLET,
  // You'll need to replace these with actual IDs from your database
  testCourseId: 'COURSE_ID_HERE',
  testSubmissionId: 'SUBMISSION_ID_HERE'
};

// Color-coded console logging
const log = {
  test: (msg) => console.log(`\n🧪 ${msg}`),
  pass: (msg) => console.log(`✅ ${msg}`),
  fail: (msg) => console.error(`❌ ${msg}`),
  info: (msg) => console.log(`ℹ️  ${msg}`),
  data: (label, data) => console.log(`📊 ${label}:`, data)
};

/**
 * Test 1: Get Course Visibility Status
 */
async function test1_getCourseVisibility() {
  log.test('Test 1: Get Course Visibility Status');
  
  try {
    const response = await fetch(
      `${testConfig.baseUrl}/api/courses/${testConfig.testCourseId}/visibility`
    );
    
    const data = await response.json();
    log.data('Response', data);
    
    if (response.ok && data.success) {
      log.pass('Successfully retrieved course visibility status');
      log.info(`Course is ${data.course.is_hidden ? 'HIDDEN' : 'VISIBLE'}`);
      log.info(`Course is ${data.course.is_published ? 'PUBLISHED' : 'UNPUBLISHED'}`);
      return true;
    } else {
      log.fail('Failed to get course visibility');
      return false;
    }
  } catch (error) {
    log.fail(`Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Hide a Course
 */
async function test2_hideCourse() {
  log.test('Test 2: Hide a Course');
  
  try {
    const response = await fetch(
      `${testConfig.baseUrl}/api/courses/${testConfig.testCourseId}/visibility`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_wallet: testConfig.adminWallet,
          is_hidden: true
        })
      }
    );
    
    const data = await response.json();
    log.data('Response', data);
    
    if (response.ok && data.success) {
      log.pass('Successfully hid the course');
      log.info(data.message);
      return true;
    } else {
      log.fail(`Failed to hide course: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    log.fail(`Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Show a Course
 */
async function test3_showCourse() {
  log.test('Test 3: Show a Course');
  
  try {
    const response = await fetch(
      `${testConfig.baseUrl}/api/courses/${testConfig.testCourseId}/visibility`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_wallet: testConfig.adminWallet,
          is_hidden: false
        })
      }
    );
    
    const data = await response.json();
    log.data('Response', data);
    
    if (response.ok && data.success) {
      log.pass('Successfully showed the course');
      log.info(data.message);
      return true;
    } else {
      log.fail(`Failed to show course: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    log.fail(`Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Update Course Properties (PATCH)
 */
async function test4_updateCourseProperties() {
  log.test('Test 4: Update Multiple Course Properties');
  
  try {
    const response = await fetch(
      `${testConfig.baseUrl}/api/courses`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: testConfig.testCourseId,
          admin_wallet: testConfig.adminWallet,
          is_hidden: false,
          is_published: true,
          order_index: 10
        })
      }
    );
    
    const data = await response.json();
    log.data('Response', data);
    
    if (response.ok && data.success) {
      log.pass('Successfully updated course properties');
      log.info(data.message);
      return true;
    } else {
      log.fail(`Failed to update course: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    log.fail(`Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 5: Approve Exam Submission
 */
async function test5_approveExam() {
  log.test('Test 5: Approve Exam Submission');
  
  if (!testConfig.testSubmissionId || testConfig.testSubmissionId === 'SUBMISSION_ID_HERE') {
    log.info('⚠️  Skipping - No test submission ID configured');
    log.info('To test exam approval, set testSubmissionId in testConfig');
    return null;
  }
  
  try {
    const response = await fetch(
      `${testConfig.baseUrl}/api/admin/exams/approve`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: testConfig.testSubmissionId,
          admin_wallet: testConfig.adminWallet,
          action: 'approve',
          admin_notes: 'Test approval from automated test'
        })
      }
    );
    
    const data = await response.json();
    log.data('Response', data);
    
    if (response.ok && data.success) {
      log.pass('Successfully approved exam');
      log.info(`XP Awarded: ${data.xp_awarded}`);
      return true;
    } else {
      log.fail(`Failed to approve exam: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    log.fail(`Error: ${error.message}`);
    return false;
  }
}

/**
 * Test 6: Reject Exam Submission
 */
async function test6_rejectExam() {
  log.test('Test 6: Reject Exam Submission');
  
  if (!testConfig.testSubmissionId || testConfig.testSubmissionId === 'SUBMISSION_ID_HERE') {
    log.info('⚠️  Skipping - No test submission ID configured');
    return null;
  }
  
  try {
    const response = await fetch(
      `${testConfig.baseUrl}/api/admin/exams/approve`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: testConfig.testSubmissionId,
          admin_wallet: testConfig.adminWallet,
          action: 'reject',
          admin_notes: 'Test rejection - please review and resubmit'
        })
      }
    );
    
    const data = await response.json();
    log.data('Response', data);
    
    if (response.ok && data.success) {
      log.pass('Successfully rejected exam');
      log.info(data.message);
      return true;
    } else {
      log.fail(`Failed to reject exam: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    log.fail(`Error: ${error.message}`);
    return false;
  }
}

/**
 * Run All Tests
 */
async function runAllTests() {
  console.clear();
  console.log('═══════════════════════════════════════════════════════');
  console.log('     COURSE MANAGEMENT API TEST SUITE');
  console.log('═══════════════════════════════════════════════════════');
  
  // Validate configuration
  if (testConfig.adminWallet === 'YOUR_ADMIN_WALLET_ADDRESS_HERE') {
    log.fail('⚠️  Please configure your admin wallet address in testConfig');
    return;
  }
  
  if (testConfig.testCourseId === 'COURSE_ID_HERE') {
    log.fail('⚠️  Please configure a test course ID in testConfig');
    return;
  }
  
  log.info('Configuration:');
  log.data('Base URL', testConfig.baseUrl);
  log.data('Admin Wallet', testConfig.adminWallet.slice(0, 10) + '...');
  log.data('Test Course ID', testConfig.testCourseId);
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };
  
  // Run tests sequentially
  const tests = [
    { name: 'Get Visibility', fn: test1_getCourseVisibility },
    { name: 'Hide Course', fn: test2_hideCourse },
    { name: 'Show Course', fn: test3_showCourse },
    { name: 'Update Properties', fn: test4_updateCourseProperties },
    { name: 'Approve Exam', fn: test5_approveExam },
    { name: 'Reject Exam', fn: test6_rejectExam }
  ];
  
  for (const test of tests) {
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
    const result = await test.fn();
    
    if (result === true) results.passed++;
    else if (result === false) results.failed++;
    else results.skipped++;
  }
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('     TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  log.pass(`Passed: ${results.passed}`);
  if (results.failed > 0) log.fail(`Failed: ${results.failed}`);
  if (results.skipped > 0) log.info(`Skipped: ${results.skipped}`);
  console.log('═══════════════════════════════════════════════════════\n');
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    test1_getCourseVisibility,
    test2_hideCourse,
    test3_showCourse,
    test4_updateCourseProperties,
    test5_approveExam,
    test6_rejectExam,
    testConfig
  };
}

// If running in browser, expose globally
if (typeof window !== 'undefined') {
  window.courseApiTests = {
    runAllTests,
    test1_getCourseVisibility,
    test2_hideCourse,
    test3_showCourse,
    test4_updateCourseProperties,
    test5_approveExam,
    test6_rejectExam,
    testConfig
  };
  
  console.log('\n✅ Course Management API tests loaded!');
  console.log('📝 Update testConfig with your admin wallet and course ID');
  console.log('🚀 Run tests with: courseApiTests.runAllTests()');
}

