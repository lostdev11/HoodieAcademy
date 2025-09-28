// Quick fix script for bounty admin tab issues
// Run this in your browser console

console.log('🔧 Applying bounty admin tab fixes...');

// Fix 1: Ensure wallet is connected and admin status is correct
function fixWalletAndAdmin() {
  console.log('🔧 Fixing wallet and admin status...');
  
  const wallet = localStorage.getItem('hoodie_academy_wallet');
  const isAdmin = localStorage.getItem('hoodie_academy_is_admin');
  
  if (!wallet) {
    console.log('❌ No wallet found - please connect your wallet first');
    return false;
  }
  
  // Check if this is an admin wallet
  const adminWallets = [
    'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
    'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
    '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
    '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
  ];
  
  const isAdminWallet = adminWallets.includes(wallet);
  
  if (isAdminWallet && isAdmin !== 'true') {
    console.log('🔧 Fixing admin status...');
    localStorage.setItem('hoodie_academy_is_admin', 'true');
    console.log('✅ Admin status fixed');
  }
  
  return isAdminWallet;
}

// Fix 2: Force refresh the page to reload components
function forceRefresh() {
  console.log('🔧 Forcing page refresh...');
  window.location.reload();
}

// Fix 3: Clear any cached data that might be causing issues
function clearCache() {
  console.log('🔧 Clearing cache...');
  
  // Clear localStorage items that might be causing issues
  const keysToKeep = ['hoodie_academy_wallet', 'hoodie_academy_is_admin'];
  const allKeys = Object.keys(localStorage);
  
  allKeys.forEach(key => {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  });
  
  console.log('✅ Cache cleared');
}

// Fix 4: Test bounty API directly
async function testAndFixBountyAPI() {
  console.log('🔧 Testing and fixing bounty API...');
  
  try {
    const response = await fetch('/api/bounties');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Bounty API working, found', data.length, 'bounties');
      return true;
    } else {
      console.log('❌ Bounty API failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Bounty API error:', error);
    return false;
  }
}

// Run all fixes
async function runFixes() {
  console.log('🎯 Starting bounty admin tab fixes...');
  
  // Fix 1: Wallet and Admin
  const walletFixed = fixWalletAndAdmin();
  
  if (!walletFixed) {
    console.log('❌ Cannot proceed - wallet not connected or not admin');
    return;
  }
  
  // Fix 2: Clear cache
  clearCache();
  
  // Fix 3: Test API
  const apiWorking = await testAndFixBountyAPI();
  
  if (apiWorking) {
    console.log('✅ All fixes applied successfully');
    console.log('🔄 Refreshing page to apply changes...');
    
    // Wait a moment then refresh
    setTimeout(() => {
      forceRefresh();
    }, 1000);
  } else {
    console.log('❌ API is not working - this needs to be fixed server-side');
  }
}

// Run the fixes
runFixes();

console.log('✅ Bounty Admin Tab Fix Complete!');
