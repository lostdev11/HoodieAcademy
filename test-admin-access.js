// =====================================================
// ADMIN ACCESS TEST SCRIPT
// =====================================================
// This script tests admin access from the frontend

async function testAdminAccess() {
  console.log('🧪 Testing Admin Access...');
  
  const testWallet = 'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA';
  
  try {
    // Test 1: Check admin status via RPC
    console.log('📡 Test 1: Checking admin status via RPC...');
    const response = await fetch(`/api/admin-auth-check?wallet=${testWallet}`);
    const data = await response.json();
    console.log('✅ Admin check result:', data);
    
    if (data.isAdmin) {
      console.log('✅ Admin access confirmed!');
    } else {
      console.log('❌ Admin access denied');
    }
    
    // Test 2: Try to access admin dashboard
    console.log('📡 Test 2: Testing admin dashboard access...');
    const dashboardResponse = await fetch(`/api/admin/users?wallet=${testWallet}`);
    const dashboardData = await dashboardResponse.json();
    console.log('✅ Dashboard access result:', dashboardData);
    
    // Test 3: Check notification counts
    console.log('📡 Test 3: Testing notification counts...');
    const notificationResponse = await fetch(`/api/notifications/counts?wallet=${testWallet}`);
    const notificationData = await notificationResponse.json();
    console.log('✅ Notification counts:', notificationData);
    
    return {
      adminCheck: data.isAdmin,
      dashboardAccess: dashboardResponse.ok,
      notificationAccess: notificationResponse.ok
    };
    
  } catch (error) {
    console.error('❌ Admin access test failed:', error);
    return {
      error: error.message
    };
  }
}

// Test function for browser console
window.testAdminAccess = testAdminAccess;

// Auto-run test if in browser
if (typeof window !== 'undefined') {
  console.log('🚀 Running admin access test...');
  testAdminAccess().then(result => {
    console.log('📊 Test Results:', result);
  });
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testAdminAccess };
}
