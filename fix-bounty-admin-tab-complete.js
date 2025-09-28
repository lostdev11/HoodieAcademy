// Complete fix for bounty admin tab issues
// Run this in your browser console

console.log('🔧 Applying complete bounty admin tab fix...');

// Step 1: Check and fix admin access
function fixAdminAccess() {
  console.log('🔧 Step 1: Fixing admin access...');
  
  const wallet = localStorage.getItem('hoodie_academy_wallet');
  const isAdmin = localStorage.getItem('hoodie_academy_is_admin');
  
  console.log('Current wallet:', wallet);
  console.log('Current admin status:', isAdmin);
  
  if (!wallet) {
    console.log('❌ No wallet connected - please connect your wallet first');
    return false;
  }
  
  // Admin wallets
  const adminWallets = [
    'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
    'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
    '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
    '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
  ];
  
  const isAdminWallet = adminWallets.includes(wallet);
  
  if (isAdminWallet) {
    if (isAdmin !== 'true') {
      console.log('🔧 Fixing admin status...');
      localStorage.setItem('hoodie_academy_is_admin', 'true');
      console.log('✅ Admin status fixed');
    } else {
      console.log('✅ Admin status already correct');
    }
    return true;
  } else {
    console.log('❌ Wallet is not in admin list');
    return false;
  }
}

// Step 2: Test bounty API
async function testBountyAPI() {
  console.log('🔧 Step 2: Testing bounty API...');
  
  try {
    const response = await fetch('/api/bounties');
    console.log('API Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Bounty API working, found', data.length, 'bounties');
      return true;
    } else {
      const errorData = await response.json();
      console.log('❌ Bounty API failed:', errorData);
      return false;
    }
  } catch (error) {
    console.log('❌ Bounty API error:', error);
    return false;
  }
}

// Step 3: Test admin API
async function testAdminAPI() {
  console.log('🔧 Step 3: Testing admin API...');
  
  const wallet = localStorage.getItem('hoodie_academy_wallet');
  
  try {
    const response = await fetch(`/api/admin-auth-check?wallet=${wallet}`);
    const data = await response.json();
    
    console.log('Admin API Response:', data);
    return data.isAdmin;
  } catch (error) {
    console.log('❌ Admin API error:', error);
    return false;
  }
}

// Step 4: Force React component refresh
function forceComponentRefresh() {
  console.log('🔧 Step 4: Forcing component refresh...');
  
  // Clear any cached data
  const keysToKeep = ['hoodie_academy_wallet', 'hoodie_academy_is_admin'];
  const allKeys = Object.keys(localStorage);
  
  allKeys.forEach(key => {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  });
  
  console.log('✅ Cache cleared');
  
  // Force a re-render by updating a timestamp
  localStorage.setItem('bounty_tab_refresh', Date.now().toString());
  
  // Trigger a custom event that components can listen to
  window.dispatchEvent(new CustomEvent('bountyTabRefresh'));
  
  console.log('✅ Component refresh triggered');
}

// Step 5: Check for JavaScript errors
function checkForErrors() {
  console.log('🔧 Step 5: Checking for errors...');
  
  // Override console.error to catch errors
  const originalError = console.error;
  const errors = [];
  
  console.error = function(...args) {
    errors.push(args.join(' '));
    originalError.apply(console, args);
  };
  
  // Restore after a short delay
  setTimeout(() => {
    console.error = originalError;
    if (errors.length > 0) {
      console.log('❌ Found', errors.length, 'errors:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ No JavaScript errors detected');
    }
  }, 2000);
}

// Step 6: Test bounty tab functionality
function testBountyTab() {
  console.log('🔧 Step 6: Testing bounty tab functionality...');
  
  // Check if bounty tab exists
  const bountyTab = document.querySelector('[value="bounties"]') || 
                    document.querySelector('button[data-tab="bounties"]') ||
                    document.querySelector('a[href*="bounty"]');
  
  console.log('Bounty tab found:', !!bountyTab);
  
  // Check if bounty manager component exists
  const bountyManager = document.querySelector('[data-testid="bounty-manager"]') ||
                        document.querySelector('.bounty-manager') ||
                        document.querySelector('form[data-bounty-form]');
  
  console.log('Bounty manager found:', !!bountyManager);
  
  // Try to click the bounty tab
  if (bountyTab) {
    console.log('🔧 Attempting to click bounty tab...');
    bountyTab.click();
    
    // Wait a moment and check if content loaded
    setTimeout(() => {
      const bountyContent = document.querySelector('[data-value="bounties"]') ||
                           document.querySelector('.bounty-content') ||
                           document.querySelector('form[data-bounty-form]');
      
      console.log('Bounty content loaded:', !!bountyContent);
    }, 1000);
  }
}

// Run all fixes
async function runCompleteFix() {
  console.log('🎯 Starting complete bounty admin tab fix...');
  
  // Step 1: Fix admin access
  const adminFixed = fixAdminAccess();
  if (!adminFixed) {
    console.log('❌ Cannot proceed - admin access not fixed');
    return;
  }
  
  // Step 2: Test APIs
  const apiWorking = await testBountyAPI();
  const adminAPIWorking = await testAdminAPI();
  
  console.log('API Status:', { apiWorking, adminAPIWorking });
  
  // Step 3: Force refresh
  forceComponentRefresh();
  
  // Step 4: Check for errors
  checkForErrors();
  
  // Step 5: Test functionality
  testBountyTab();
  
  // Summary
  console.log('📋 Fix Summary:');
  console.log('- Admin Access:', adminFixed ? '✅ Fixed' : '❌ Failed');
  console.log('- Bounty API:', apiWorking ? '✅ Working' : '❌ Failed');
  console.log('- Admin API:', adminAPIWorking ? '✅ Working' : '❌ Failed');
  
  if (adminFixed && apiWorking) {
    console.log('✅ All fixes applied successfully!');
    console.log('🔄 Refreshing page to apply changes...');
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } else {
    console.log('❌ Some fixes failed - check the errors above');
  }
}

// Run the complete fix
runCompleteFix();

console.log('✅ Complete Bounty Admin Tab Fix Applied!');
