// Test if the user dashboard XP APIs are working
const fetch = require('node-fetch');

async function testUserDashboardXP() {
  console.log('🧪 Testing User Dashboard XP APIs...');
  
  const testWallet = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU';
  
  try {
    // Test the main user tracking API (used by useUserXP hook)
    console.log('\n📊 Testing /api/users/track...');
    const trackResponse = await fetch(`http://localhost:3000/api/users/track?wallet=${testWallet}`);
    console.log('  Status:', trackResponse.status);
    
    if (trackResponse.status === 200) {
      const trackData = await trackResponse.json();
      console.log('  ✅ User Track API:');
      console.log('    Total XP:', trackData.stats?.totalXP);
      console.log('    User XP:', trackData.user?.total_xp);
      console.log('    Level:', trackData.user?.level);
    } else {
      console.log('  ❌ User Track API failed');
    }
    
    // Test the user XP API (used by BountyXPDisplay)
    console.log('\n📊 Testing /api/user-xp...');
    const xpResponse = await fetch(`http://localhost:3000/api/user-xp?wallet=${testWallet}`);
    console.log('  Status:', xpResponse.status);
    
    if (xpResponse.status === 200) {
      const xpData = await xpResponse.json();
      console.log('  ✅ User XP API:');
      console.log('    Total XP:', xpData.xp?.total_xp);
      console.log('    Level:', xpData.xp?.level);
      console.log('    Bounty Submissions:', xpData.bountySubmissions?.length || 0);
    } else {
      console.log('  ❌ User XP API failed');
      const errorText = await xpResponse.text();
      console.log('  Error:', errorText);
    }
    
    console.log('\n🎯 Summary:');
    console.log('Both APIs should show the same XP values that were awarded through the admin dashboard.');
    console.log('If both show the same XP, the user dashboard will display updated XP correctly.');
    
  } catch (error) {
    console.error('💥 Error testing user dashboard XP:', error.message);
  }
}

testUserDashboardXP();
