// Test script to verify bounty creation fix
// Run this in your browser console on any admin page

console.log('🧪 Testing Bounty Creation Fix...');

// Test data for bounty creation
const testBountyData = {
  title: 'Test Bounty - ' + new Date().toISOString(),
  short_desc: 'This is a test bounty to verify the fix',
  reward: '100',
  reward_type: 'XP',
  squad_tag: 'Creators',
  status: 'active',
  hidden: false,
  walletAddress: 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU' // Admin wallet
};

console.log('📊 Test Bounty Data:', testBountyData);

// Test the bounty creation API
async function testBountyCreation() {
  try {
    console.log('🚀 Testing bounty creation API...');
    
    const response = await fetch('/api/bounties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBountyData)
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const bounty = await response.json();
      console.log('✅ Bounty created successfully!', bounty);
      return bounty;
    } else {
      const errorData = await response.json();
      console.error('❌ Bounty creation failed:', errorData);
      return null;
    }
  } catch (error) {
    console.error('💥 Error testing bounty creation:', error);
    return null;
  }
}

// Test admin access check
async function testAdminAccess() {
  try {
    console.log('🔍 Testing admin access...');
    
    const response = await fetch('/api/admin-auth-check?wallet=JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU');
    const data = await response.json();
    
    console.log('👑 Admin access result:', data);
    return data.isAdmin;
  } catch (error) {
    console.error('💥 Error testing admin access:', error);
    return false;
  }
}

// Run the tests
async function runTests() {
  console.log('🎯 Starting comprehensive bounty creation tests...');
  
  // Test 1: Admin access
  const isAdmin = await testAdminAccess();
  console.log('✅ Admin access test:', isAdmin ? 'PASSED' : 'FAILED');
  
  if (!isAdmin) {
    console.error('❌ Cannot proceed with bounty creation test - admin access failed');
    return;
  }
  
  // Test 2: Bounty creation
  const bounty = await testBountyCreation();
  console.log('✅ Bounty creation test:', bounty ? 'PASSED' : 'FAILED');
  
  if (bounty) {
    console.log('🎉 All tests passed! Bounty creation is working correctly.');
    
    // Test 3: Verify bounty was created
    try {
      const getResponse = await fetch('/api/bounties');
      const bounties = await getResponse.json();
      const createdBounty = bounties.find(b => b.id === bounty.id);
      console.log('✅ Bounty verification:', createdBounty ? 'PASSED' : 'FAILED');
    } catch (error) {
      console.warn('⚠️ Could not verify bounty creation:', error);
    }
  } else {
    console.error('❌ Bounty creation test failed. Check the error messages above.');
  }
}

// Run the tests
runTests();

console.log('✅ Bounty Creation Fix Test Complete!');
console.log('If you see "All tests passed!" above, the fix is working!');
