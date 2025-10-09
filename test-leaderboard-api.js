// Test the leaderboard API specifically
const fetch = require('node-fetch');

async function testLeaderboardAPI() {
  console.log('🧪 Testing Leaderboard API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/leaderboard');
    console.log('📊 Response status:', response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('📦 Response data:');
      console.log('  Number of users:', data.length);
      
      if (data.length > 0) {
        const firstUser = data[0];
        console.log('  First user:');
        console.log('    Wallet:', firstUser.walletAddress);
        console.log('    Display Name:', firstUser.displayName);
        console.log('    Total Score (XP):', firstUser.totalScore);
        console.log('    Level:', firstUser.level);
        console.log('    Squad:', firstUser.squad);
      }
      
      // Check if our test user is in the leaderboard
      const testUser = data.find(u => u.walletAddress === 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU');
      if (testUser) {
        console.log('  ✅ Test user found in leaderboard:');
        console.log('    XP:', testUser.totalScore);
        console.log('    Level:', testUser.level);
      } else {
        console.log('  ❌ Test user not found in leaderboard');
      }
      
    } else {
      console.log('❌ Leaderboard API failed');
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('💥 Error testing leaderboard API:', error.message);
  }
}

testLeaderboardAPI();
