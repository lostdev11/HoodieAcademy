// =====================================================
// BOUNTY SYSTEM TEST SCRIPT
// =====================================================
// This script tests the bounty creation and display system

async function testBountySystem() {
  console.log('🧪 Testing Bounty System...');
  
  const testWallet = 'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA';
  
  try {
    // Test 1: Check if bounties API is working
    console.log('📡 Test 1: Fetching existing bounties...');
    const bountiesResponse = await fetch('/api/bounties');
    const bounties = await bountiesResponse.json();
    console.log('✅ Bounties fetched:', bounties.length, 'bounties found');
    
    if (bounties.length > 0) {
      console.log('📋 Sample bounty:', bounties[0]);
    }
    
    // Test 2: Create a test bounty
    console.log('📡 Test 2: Creating test bounty...');
    const testBounty = {
      title: 'Test Bounty - ' + new Date().toISOString(),
      short_desc: 'This is a test bounty to verify the system works',
      reward: '100',
      reward_type: 'XP',
      status: 'active',
      hidden: false,
      squad_tag: 'none',
      walletAddress: testWallet
    };
    
    const createResponse = await fetch('/api/bounties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBounty)
    });
    
    if (createResponse.ok) {
      const createdBounty = await createResponse.json();
      console.log('✅ Test bounty created:', createdBounty.bounty?.id || createdBounty.id);
      
      // Test 3: Update the bounty
      console.log('📡 Test 3: Updating test bounty...');
      const updateResponse = await fetch(`/api/bounties/${createdBounty.bounty?.id || createdBounty.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Wallet-Address': testWallet
        },
        body: JSON.stringify({ 
          hidden: true 
        })
      });
      
      if (updateResponse.ok) {
        console.log('✅ Test bounty updated successfully');
      } else {
        const errorData = await updateResponse.json();
        console.log('❌ Update failed:', errorData);
      }
      
      // Test 4: Delete the test bounty
      console.log('📡 Test 4: Deleting test bounty...');
      const deleteResponse = await fetch(`/api/bounties/${createdBounty.bounty?.id || createdBounty.id}?walletAddress=${testWallet}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.ok) {
        console.log('✅ Test bounty deleted successfully');
      } else {
        const errorData = await deleteResponse.json();
        console.log('❌ Delete failed:', errorData);
      }
      
    } else {
      const errorData = await createResponse.json();
      console.log('❌ Create failed:', errorData);
    }
    
    // Test 5: Check bounties page
    console.log('📡 Test 5: Checking bounties page...');
    const pageResponse = await fetch('/bounties');
    if (pageResponse.ok) {
      console.log('✅ Bounties page accessible');
    } else {
      console.log('❌ Bounties page error:', pageResponse.status);
    }
    
    return {
      bountiesCount: bounties.length,
      apiWorking: bountiesResponse.ok,
      pageWorking: pageResponse.ok
    };
    
  } catch (error) {
    console.error('❌ Bounty system test failed:', error);
    return {
      error: error.message
    };
  }
}

// Test function for browser console
window.testBountySystem = testBountySystem;

// Auto-run test if in browser
if (typeof window !== 'undefined') {
  console.log('🚀 Running bounty system test...');
  testBountySystem().then(result => {
    console.log('📊 Test Results:', result);
  });
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testBountySystem };
}
