// Test current bounty admin tab state
// Run this in your browser console

console.log('🧪 Testing current bounty admin tab state...');

// Test 1: Check wallet and admin status
const wallet = localStorage.getItem('hoodie_academy_wallet');
const isAdmin = localStorage.getItem('hoodie_academy_is_admin');

console.log('📊 Current State:');
console.log('- Wallet:', wallet);
console.log('- Admin Status:', isAdmin);
console.log('- Wallet Connected:', !!wallet);
console.log('- Admin Recognized:', isAdmin === 'true');

// Test 2: Check if this is an admin wallet
const adminWallets = [
  'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
  'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
  '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
  '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
];

const isAdminWallet = adminWallets.includes(wallet || '');
console.log('- Is Admin Wallet:', isAdminWallet);

// Test 3: Check bounty API
fetch('/api/bounties')
  .then(res => {
    console.log('📡 Bounty API Status:', res.status);
    return res.json();
  })
  .then(data => {
    console.log('📊 Bounty API Response:', data);
    console.log('- Bounties Found:', data.length);
    console.log('- API Working:', Array.isArray(data));
  })
  .catch(err => {
    console.error('❌ Bounty API Error:', err);
  });

// Test 4: Check admin API
if (wallet) {
  fetch(`/api/admin-auth-check?wallet=${wallet}`)
    .then(res => res.json())
    .then(data => {
      console.log('👑 Admin API Response:', data);
      console.log('- Admin API Working:', data.isAdmin);
    })
    .catch(err => {
      console.error('❌ Admin API Error:', err);
    });
}

// Test 5: Check DOM elements
setTimeout(() => {
  console.log('🔍 DOM Elements Check:');
  
  // Check for admin dashboard
  const adminDashboard = document.querySelector('main') || document.querySelector('.admin-dashboard');
  console.log('- Admin Dashboard:', !!adminDashboard);
  
  // Check for bounty tab
  const bountyTab = document.querySelector('[value="bounties"]') || 
                    document.querySelector('button[data-tab="bounties"]');
  console.log('- Bounty Tab:', !!bountyTab);
  
  // Check for bounty content
  const bountyContent = document.querySelector('[data-value="bounties"]') ||
                        document.querySelector('.bounty-content');
  console.log('- Bounty Content:', !!bountyContent);
  
  // Check for bounty manager
  const bountyManager = document.querySelector('form[data-bounty-form]') ||
                        document.querySelector('.bounty-manager');
  console.log('- Bounty Manager:', !!bountyManager);
  
  // Check for any error messages
  const errorMessages = document.querySelectorAll('.error, .alert, [role="alert"]');
  console.log('- Error Messages Found:', errorMessages.length);
  
  if (errorMessages.length > 0) {
    console.log('Error messages:');
    errorMessages.forEach((error, index) => {
      console.log(`${index + 1}. ${error.textContent}`);
    });
  }
}, 1000);

// Test 6: Check React DevTools
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('✅ React DevTools detected');
} else {
  console.log('⚠️ React DevTools not available');
}

console.log('✅ Current state test complete!');
console.log('Check the results above to identify the issue.');
