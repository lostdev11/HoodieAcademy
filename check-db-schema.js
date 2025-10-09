// Check if the XP columns exist in the users table
const fetch = require('node-fetch');

async function checkDBSchema() {
  console.log('🔍 Checking database schema...');
  
  try {
    // Try to get a user with XP data
    const adminWallet = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU';
    const response = await fetch(`http://localhost:3000/api/admin/users?wallet=${adminWallet}`);
    
    if (response.status === 200) {
      const data = await response.json();
      const users = data.users || [];
      
      if (users.length > 0) {
        const user = users[0];
        console.log('📋 Sample user data structure:');
        console.log(JSON.stringify(user, null, 2));
        
        // Check if XP-related fields exist
        const hasTotalXP = 'total_xp' in user;
        const hasLevel = 'level' in user;
        const hasIsAdmin = 'is_admin' in user;
        
        console.log('\n🔍 Field existence check:');
        console.log(`  total_xp: ${hasTotalXP} (value: ${user.total_xp})`);
        console.log(`  level: ${hasLevel} (value: ${user.level})`);
        console.log(`  is_admin: ${hasIsAdmin} (value: ${user.is_admin})`);
        
        if (!hasTotalXP || !hasLevel) {
          console.log('\n⚠️ Missing XP columns in users table!');
          console.log('The users table may need to be updated with XP columns.');
        } else {
          console.log('\n✅ XP columns exist in users table');
        }
        
        if (!hasIsAdmin) {
          console.log('\n⚠️ Missing is_admin column in users table!');
        }
        
      } else {
        console.log('❌ No users found to check schema');
      }
    } else {
      console.log('❌ Failed to fetch users:', response.status);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

checkDBSchema();
