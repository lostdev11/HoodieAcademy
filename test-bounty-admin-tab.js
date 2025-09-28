// Test script to diagnose bounty admin tab issues
// Run this in your browser console on any admin page

console.log('🧪 Testing Bounty Admin Tab...');

// Test 1: Check wallet connection and admin status
function testWalletAndAdmin() {
  console.log('🔍 Testing wallet connection and admin status...');
  
  const wallet = localStorage.getItem('hoodie_academy_wallet');
  const isAdmin = localStorage.getItem('hoodie_academy_is_admin');
  
  console.log('📊 Wallet Status:');
  console.log('- Wallet:', wallet);
  console.log('- Is Admin:', isAdmin);
  console.log('- Wallet Connected:', !!wallet);
  console.log('- Admin Status:', isAdmin === 'true');
  
  return { wallet, isAdmin: isAdmin === 'true' };
}

// Test 2: Check if bounty API is working
async function testBountyAPI() {
  console.log('🌐 Testing bounty API...');
  
  try {
    const response = await fetch('/api/bounties');
    console.log('📡 API Response Status:', response.status);
    console.log('📡 API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Bounty API working, found', data.length, 'bounties');
      return data;
    } else {
      const errorData = await response.json();
      console.error('❌ Bounty API failed:', errorData);
      return null;
    }
  } catch (error) {
    console.error('💥 Bounty API error:', error);
    return null;
  }
}

// Test 3: Check admin access API
async function testAdminAPI() {
  console.log('👑 Testing admin access API...');
  
  const wallet = localStorage.getItem('hoodie_academy_wallet');
  if (!wallet) {
    console.error('❌ No wallet connected');
    return false;
  }
  
  try {
    const response = await fetch(`/api/admin-auth-check?wallet=${wallet}`);
    const data = await response.json();
    
    console.log('📊 Admin API Response:', data);
    return data.isAdmin;
  } catch (error) {
    console.error('💥 Admin API error:', error);
    return false;
  }
}

// Test 4: Check for JavaScript errors
function checkForErrors() {
  console.log('🔍 Checking for JavaScript errors...');
  
  // Check if there are any uncaught errors
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
  }, 1000);
}

// Test 5: Check DOM elements
function checkDOMElements() {
  console.log('🔍 Checking DOM elements...');
  
  // Check if admin dashboard elements exist
  const adminDashboard = document.querySelector('[data-testid="admin-dashboard"]') || 
                        document.querySelector('.admin-dashboard') ||
                        document.querySelector('main');
  
  console.log('📊 DOM Elements:');
  console.log('- Admin Dashboard:', !!adminDashboard);
  
  // Check for bounty-related elements
  const bountyTab = document.querySelector('[value="bounties"]') || 
                    document.querySelector('button[data-tab="bounties"]') ||
                    document.querySelector('a[href*="bounty"]');
  
  console.log('- Bounty Tab:', !!bountyTab);
  
  // Check for bounty manager component
  const bountyManager = document.querySelector('[data-testid="bounty-manager"]') ||
                        document.querySelector('.bounty-manager') ||
                        document.querySelector('form[data-bounty-form]');
  
  console.log('- Bounty Manager:', !!bountyManager);
  
  return { adminDashboard: !!adminDashboard, bountyTab: !!bountyTab, bountyManager: !!bountyManager };
}

// Test 6: Check React component state
function checkReactState() {
  console.log('🔍 Checking React component state...');
  
  // Try to access React DevTools if available
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools detected');
    
    // Try to find React components
    const reactRoot = document.querySelector('#__next') || document.querySelector('#root');
    if (reactRoot && reactRoot._reactInternalFiber) {
      console.log('✅ React root found');
    } else {
      console.log('⚠️ React root not found or not accessible');
    }
  } else {
    console.log('⚠️ React DevTools not available');
  }
}

// Run all tests
async function runAllTests() {
  console.log('🎯 Starting comprehensive bounty admin tab diagnosis...');
  
  // Test 1: Wallet and Admin
  const { wallet, isAdmin } = testWalletAndAdmin();
  
  if (!wallet) {
    console.error('❌ Cannot proceed - no wallet connected');
    return;
  }
  
  if (!isAdmin) {
    console.error('❌ Cannot proceed - not an admin');
    return;
  }
  
  // Test 2: Bounty API
  const bounties = await testBountyAPI();
  
  // Test 3: Admin API
  const adminAccess = await testAdminAPI();
  
  // Test 4: JavaScript Errors
  checkForErrors();
  
  // Test 5: DOM Elements
  const domElements = checkDOMElements();
  
  // Test 6: React State
  checkReactState();
  
  // Summary
  console.log('📋 Test Summary:');
  console.log('- Wallet Connected:', !!wallet);
  console.log('- Admin Status:', isAdmin);
  console.log('- Bounty API Working:', !!bounties);
  console.log('- Admin API Working:', adminAccess);
  console.log('- Admin Dashboard Found:', domElements.adminDashboard);
  console.log('- Bounty Tab Found:', domElements.bountyTab);
  console.log('- Bounty Manager Found:', domElements.bountyManager);
  
  if (isAdmin && bounties && adminAccess) {
    console.log('✅ All basic tests passed - bounty admin tab should be working');
  } else {
    console.log('❌ Some tests failed - this explains why the bounty admin tab is not working');
  }
}

// Run the tests
runAllTests();

console.log('✅ Bounty Admin Tab Diagnosis Complete!');
console.log('Check the results above to identify the issue.');
