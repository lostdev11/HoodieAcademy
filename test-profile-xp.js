// Test if the profile XP API returns updated data
const fetch = require('node-fetch');

async function testProfileXP() {
  console.log('🧪 Testing Profile XP API...');
  
  const testWallet = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU';
  
  try {
    const response = await fetch(`http://localhost:3000/api/users/track?wallet=${testWallet}`);
    console.log('📊 Response status:', response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('📦 Profile data:');
      console.log('  Wallet:', data.user?.wallet_address);
      console.log('  Display Name:', data.user?.display_name);
      console.log('  Is Admin:', data.user?.is_admin);
      console.log('  Total XP:', data.user?.total_xp);
      console.log('  Level:', data.user?.level);
      console.log('  Stats Total XP:', data.stats?.totalXP);
      
      if (data.stats?.totalXP > 0) {
        console.log('✅ Profile XP API is working correctly!');
        console.log('✅ User profile should now show updated XP');
      } else {
        console.log('❌ Profile XP API not showing updated XP');
      }
    } else {
      console.log('❌ Profile XP API failed:', response.status);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('💥 Error testing profile XP:', error.message);
  }
}

testProfileXP();
