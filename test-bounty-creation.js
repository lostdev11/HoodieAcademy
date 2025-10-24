// =====================================================
// BOUNTY CREATION DEBUG SCRIPT
// =====================================================
// This script tests bounty creation and identifies issues

async function testBountyCreation() {
  console.log('🧪 Testing Bounty Creation...');
  
  const testWallet = 'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA';
  
  try {
    // Test 1: Check admin status
    console.log('📡 Test 1: Checking admin status...');
    const adminResponse = await fetch(`/api/admin-auth-check?wallet=${testWallet}`);
    const adminData = await adminResponse.json();
    console.log('✅ Admin status:', adminData);
    
    if (!adminData.isAdmin) {
      console.log('❌ User is not admin, cannot create bounties');
      return;
    }
    
    // Test 2: Create a simple bounty
    console.log('📡 Test 2: Creating simple bounty...');
    const simpleBounty = {
      title: 'Test Bounty - ' + new Date().toISOString(),
      short_desc: 'This is a simple test bounty to verify creation works.',
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
      body: JSON.stringify(simpleBounty)
    });
    
    console.log('📊 Create response status:', createResponse.status);
    console.log('📊 Create response headers:', Object.fromEntries(createResponse.headers.entries()));
    
    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('✅ Simple bounty created:', createData);
      
      // Test 3: Create a complex bounty with markdown
      console.log('📡 Test 3: Creating complex bounty with markdown...');
      const complexBounty = {
        title: 'Complex Bounty - ' + new Date().toISOString(),
        short_desc: `# Complex Bounty Description

This is a **complex bounty** with markdown formatting.

## Requirements

- Use TypeScript
- Include proper error handling
- Add unit tests

## Submission Guidelines

1. Fork the repository
2. Create your component
3. Add tests
4. Submit a pull request

> **Note**: Make sure to follow the coding standards.`,
        reward: '500',
        reward_type: 'XP',
        status: 'active',
        hidden: false,
        squad_tag: 'Creators',
        walletAddress: testWallet
      };
      
      const complexResponse = await fetch('/api/bounties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complexBounty)
      });
      
      if (complexResponse.ok) {
        const complexData = await complexResponse.json();
        console.log('✅ Complex bounty created:', complexData);
      } else {
        const complexError = await complexResponse.json();
        console.log('❌ Complex bounty failed:', complexError);
      }
      
    } else {
      const createError = await createResponse.json();
      console.log('❌ Simple bounty creation failed:', createError);
    }
    
    // Test 4: Check bounties page
    console.log('📡 Test 4: Checking bounties page...');
    const bountiesResponse = await fetch('/api/bounties');
    const bounties = await bountiesResponse.json();
    console.log('✅ Bounties fetched:', bounties.length, 'bounties found');
    
    return {
      adminStatus: adminData.isAdmin,
      simpleBountyCreated: createResponse.ok,
      bountiesCount: bounties.length
    };
    
  } catch (error) {
    console.error('❌ Bounty creation test failed:', error);
    return {
      error: error.message
    };
  }
}

// Test function for browser console
window.testBountyCreation = testBountyCreation;

// Auto-run test if in browser
if (typeof window !== 'undefined') {
  console.log('🚀 Running bounty creation test...');
  testBountyCreation().then(result => {
    console.log('📊 Test Results:', result);
  });
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testBountyCreation };
}
