// Test script to verify admin access fix
// Run this in your browser console on any admin page

console.log('🧪 Testing Admin Access Fix...');

// Test the hardcoded admin wallets
const adminWallets = [
  'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
  'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
  '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
  '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
];

// Get current wallet from localStorage
const currentWallet = localStorage.getItem('hoodie_academy_wallet');
const isAdminStored = localStorage.getItem('hoodie_academy_is_admin');

console.log('📊 Current State:');
console.log('- Wallet:', currentWallet);
console.log('- Admin Status (stored):', isAdminStored);
console.log('- Is in admin list:', adminWallets.includes(currentWallet || ''));

// Test the admin check function
function testAdminCheck(walletAddress) {
  return adminWallets.includes(walletAddress);
}

console.log('🔍 Admin Check Test:');
console.log('- Test wallet 1 (should be admin):', testAdminCheck('JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU'));
console.log('- Test wallet 2 (should be admin):', testAdminCheck('qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA'));
console.log('- Test wallet 3 (should NOT be admin):', testAdminCheck('random-wallet-address'));

// Test API endpoint
async function testAdminAPI() {
  try {
    const response = await fetch('/api/admin-auth-check?wallet=JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU');
    const data = await response.json();
    console.log('🌐 API Test Result:', data);
  } catch (error) {
    console.error('❌ API Test Failed:', error);
  }
}

console.log('🚀 Running API test...');
testAdminAPI();

console.log('✅ Admin Access Fix Test Complete!');
console.log('If you see "isAdmin: true" in the API test result, the fix is working!');
