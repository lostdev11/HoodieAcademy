// Test script to check if the XP award API is working
const fetch = require('node-fetch');

async function testXPAwardAPI() {
  console.log('🧪 Testing XP Award API...');
  
  try {
    // Test the API endpoint
    const response = await fetch('http://localhost:3000/api/admin/xp/award', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetWallet: 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
        xpAmount: 100,
        reason: 'Test XP award',
        awardedBy: 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU'
      })
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.text();
    console.log('📦 Response body:', data);
    
    if (response.status === 404) {
      console.log('❌ API endpoint not found - dev server may need restart');
    } else if (response.status === 200) {
      console.log('✅ API is working!');
    } else {
      console.log('⚠️ API responded with status:', response.status);
    }
    
  } catch (error) {
    console.error('💥 Error testing API:', error.message);
  }
}

// Also test if the server is running
async function testServerHealth() {
  try {
    const response = await fetch('http://localhost:3000/api/bounties');
    console.log('🏥 Server health check - Bounties API status:', response.status);
  } catch (error) {
    console.error('💥 Server health check failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting API tests...\n');
  
  await testServerHealth();
  console.log('');
  await testXPAwardAPI();
  
  console.log('\n📋 Summary:');
  console.log('If you see 404 for XP award API, restart your dev server:');
  console.log('1. Press Ctrl+C in your terminal');
  console.log('2. Run: npm run dev');
  console.log('3. Test again');
}

runTests();
