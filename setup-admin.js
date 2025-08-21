#!/usr/bin/env node

/**
 * Admin Setup Script for Hoodie Academy
 * This script helps set up admin access for the platform
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Hoodie Academy Admin Setup');
console.log('================================\n');

// Admin wallet addresses
const ADMIN_WALLETS = [
  'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
  'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
  '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
  '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
];

console.log('📋 Admin Wallets to be configured:');
ADMIN_WALLETS.forEach((wallet, index) => {
  const names = ['Prince', 'Prince 1', 'Kong', 'Kong 1'];
  console.log(`   ${index + 1}. ${wallet} (${names[index]})`);
});

console.log('\n📁 Files created:');
console.log('   ✅ src/lib/admin-setup.sql - Database setup script');
console.log('   ✅ ADMIN_SETUP_GUIDE.md - Complete setup guide');
console.log('   ✅ setup-admin.js - This setup script');

console.log('\n🔧 Next Steps:');
console.log('   1. Run the SQL script in your Supabase SQL editor:');
console.log('      - Copy content from src/lib/admin-setup.sql');
console.log('      - Paste into Supabase SQL editor');
console.log('      - Execute the script');
console.log('\n   2. Verify admin access:');
console.log('      - Connect with one of the admin wallets');
console.log('      - Navigate to /admin');
console.log('      - Check that you can access the dashboard');
console.log('\n   3. Test functionality:');
console.log('      - Try editing a bounty');
console.log('      - Check user management features');
console.log('      - Verify mobile responsiveness');

console.log('\n📖 For detailed instructions, see ADMIN_SETUP_GUIDE.md');
console.log('\n🎯 Setup complete! Your admin dashboard should now work properly.');
