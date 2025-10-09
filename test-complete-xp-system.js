// Comprehensive test of the entire XP system
const fetch = require('node-fetch');

async function testCompleteXPSystem() {
  console.log('🧪 Testing Complete XP System...\n');
  
  const testWallet = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU';
  let allTestsPassed = true;
  
  try {
    // Test 1: Admin Dashboard Users API
    console.log('📊 Test 1: Admin Dashboard Users API');
    const adminUsersResponse = await fetch(`http://localhost:3000/api/admin/users?wallet=${testWallet}`);
    if (adminUsersResponse.status === 200) {
      const adminUsersData = await adminUsersResponse.json();
      const userWithXP = adminUsersData.users?.find(u => u.wallet_address === testWallet);
      if (userWithXP && userWithXP.total_xp > 0) {
        console.log(`  ✅ Admin Dashboard: Shows ${userWithXP.total_xp} XP, Level ${userWithXP.level}`);
      } else {
        console.log('  ❌ Admin Dashboard: No XP data found');
        allTestsPassed = false;
      }
    } else {
      console.log('  ❌ Admin Dashboard: API failed');
      allTestsPassed = false;
    }
    
    // Test 2: User Profile API
    console.log('\n📊 Test 2: User Profile API');
    const profileResponse = await fetch(`http://localhost:3000/api/users/track?wallet=${testWallet}`);
    if (profileResponse.status === 200) {
      const profileData = await profileResponse.json();
      if (profileData.stats?.totalXP > 0) {
        console.log(`  ✅ User Profile: Shows ${profileData.stats.totalXP} XP`);
      } else {
        console.log('  ❌ User Profile: No XP data found');
        allTestsPassed = false;
      }
    } else {
      console.log('  ❌ User Profile: API failed');
      allTestsPassed = false;
    }
    
    // Test 3: User Dashboard XP API
    console.log('\n📊 Test 3: User Dashboard XP API');
    const dashboardXPResponse = await fetch(`http://localhost:3000/api/user-xp?wallet=${testWallet}`);
    if (dashboardXPResponse.status === 200) {
      const dashboardXPData = await dashboardXPResponse.json();
      if (dashboardXPData.xp?.total_xp > 0) {
        console.log(`  ✅ User Dashboard: Shows ${dashboardXPData.xp.total_xp} XP, Level ${dashboardXPData.xp.level}`);
      } else {
        console.log('  ❌ User Dashboard: No XP data found');
        allTestsPassed = false;
      }
    } else {
      console.log('  ❌ User Dashboard: API failed');
      allTestsPassed = false;
    }
    
    // Test 4: Leaderboard API
    console.log('\n📊 Test 4: Leaderboard API');
    const leaderboardResponse = await fetch(`http://localhost:3000/api/leaderboard`);
    if (leaderboardResponse.status === 200) {
      const leaderboardData = await leaderboardResponse.json();
      const userInLeaderboard = leaderboardData.find(u => u.walletAddress === testWallet);
      if (userInLeaderboard && userInLeaderboard.totalScore > 0) {
        console.log(`  ✅ Leaderboard: Shows ${userInLeaderboard.totalScore} XP, Level ${userInLeaderboard.level || 'N/A'}`);
      } else {
        console.log('  ❌ Leaderboard: User not found or no XP data');
        allTestsPassed = false;
      }
    } else {
      console.log('  ❌ Leaderboard: API failed');
      allTestsPassed = false;
    }
    
    // Test 5: XP Award API
    console.log('\n📊 Test 5: XP Award API (Testing with small amount)');
    const xpAwardResponse = await fetch('http://localhost:3000/api/admin/xp/award', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetWallet: testWallet,
        xpAmount: 1,
        reason: 'System test',
        awardedBy: testWallet
      })
    });
    
    if (xpAwardResponse.status === 200) {
      const xpAwardData = await xpAwardResponse.json();
      console.log(`  ✅ XP Award: Successfully awarded ${xpAwardData.xpAwarded} XP`);
      console.log(`     New total: ${xpAwardData.newTotalXP} XP`);
    } else {
      console.log('  ❌ XP Award: API failed');
      allTestsPassed = false;
    }
    
    // Summary
    console.log('\n🎯 Summary:');
    if (allTestsPassed) {
      console.log('✅ ALL XP SYSTEMS ARE WORKING CORRECTLY!');
      console.log('✅ XP will show in:');
      console.log('   - Admin Dashboard');
      console.log('   - User Profile Pages');
      console.log('   - User Dashboard');
      console.log('   - Leaderboard');
      console.log('   - XP Award System');
    } else {
      console.log('❌ Some XP systems are not working correctly.');
      console.log('❌ Please check the failed tests above.');
    }
    
  } catch (error) {
    console.error('💥 Error testing XP system:', error.message);
  }
}

testCompleteXPSystem();
