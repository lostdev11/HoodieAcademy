// Check what users exist in the database
const fetch = require('node-fetch');

async function checkUsers() {
  console.log('🔍 Checking users in database...');
  
  try {
    // First, let's check what users exist
    const adminWallet = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU';
    const response = await fetch(`http://localhost:3000/api/admin/users?wallet=${adminWallet}`);
    console.log('📊 Users API status:', response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      const users = data.users || [];
      console.log('👥 Found users:', users.length);
      
      if (users.length > 0) {
        console.log('📋 User details:');
        users.forEach((user, index) => {
          console.log(`  ${index + 1}. Wallet: ${user.wallet_address}`);
          console.log(`     Display Name: ${user.display_name || 'N/A'}`);
          console.log(`     Is Admin: ${user.is_admin || false}`);
          console.log(`     Total XP: ${user.total_xp || 0}`);
          console.log('');
        });
        
        // Test XP award with the first user
        const testUser = users[0];
        console.log('🎯 Testing XP award with first user:', testUser.wallet_address);
        
        const xpResponse = await fetch('http://localhost:3000/api/admin/xp/award', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            targetWallet: testUser.wallet_address,
            xpAmount: 50,
            reason: 'Test XP award',
            awardedBy: testUser.wallet_address // Use same user as admin
          })
        });
        
        console.log('📊 XP Award response status:', xpResponse.status);
        const xpData = await xpResponse.text();
        console.log('📦 XP Award response:', xpData);
        
      } else {
        console.log('❌ No users found in database');
      }
    } else {
      console.log('❌ Failed to fetch users:', response.status);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

checkUsers();
