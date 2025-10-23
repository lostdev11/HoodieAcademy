// Test script to debug feedback submission issues
// Run this in your browser console on the feedback page

async function testFeedbackSubmission() {
  console.log('🧪 Testing feedback submission...');
  
  const testData = {
    title: 'Test Feedback Debug',
    description: 'This is a test feedback submission to debug the issue',
    category: 'bug_report',
    wallet_address: 'test_wallet_debug'
  };
  
  try {
    const response = await fetch('/api/user-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    console.log('📤 Response status:', response.status);
    const result = await response.json();
    console.log('📥 Response data:', result);
    
    if (response.ok) {
      console.log('✅ Test feedback submitted successfully!');
      
      // Now check if it appears in the admin dashboard
      const adminResponse = await fetch('/api/user-feedback?limit=10');
      const adminData = await adminResponse.json();
      console.log('📊 Admin dashboard data:', adminData);
      
      // Check notification counts
      const notificationResponse = await fetch('/api/notifications/counts?wallet=test_admin&is_admin=true');
      const notificationData = await notificationResponse.json();
      console.log('🔔 Notification counts:', notificationData);
      
    } else {
      console.error('❌ Test feedback failed:', result);
    }
  } catch (error) {
    console.error('💥 Test error:', error);
  }
}

// Run the test
testFeedbackSubmission();
