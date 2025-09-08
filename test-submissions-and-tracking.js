#!/usr/bin/env node

/**
 * Test script for submissions fetching and user tracking system
 * This script tests the complete flow of submissions and user tracking APIs
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const TEST_WALLET = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU';

async function testSubmissionsAPI() {
  console.log('🧪 Testing Submissions API...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/submissions`);
    
    if (!response.ok) {
      console.log('❌ Submissions API failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Submissions API working');
    console.log(`📊 Found ${Array.isArray(data) ? data.length : 0} submissions`);
    
    if (Array.isArray(data) && data.length > 0) {
      const sample = data[0];
      console.log('📝 Sample submission structure:', {
        id: sample.id,
        title: sample.title,
        status: sample.status,
        walletAddress: sample.walletAddress,
        hasUpvotes: !!sample.upvotes,
        totalUpvotes: sample.totalUpvotes
      });
    }
  } catch (error) {
    console.log('❌ Submissions API error:', error.message);
  }
}

async function testUserTrackingAPI() {
  console.log('\n🧪 Testing User Tracking API...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/users/track?wallet=${TEST_WALLET}`);
    
    if (!response.ok) {
      console.log('❌ User Tracking API failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ User Tracking API working');
    console.log('👤 User data:', {
      walletAddress: data.user?.wallet_address,
      displayName: data.user?.display_name,
      squad: data.user?.squad,
      isAdmin: data.user?.is_admin,
      profileCompleted: data.user?.profile_completed
    });
    console.log('📊 Stats:', {
      totalXP: data.stats?.totalXP,
      totalSubmissions: data.stats?.totalSubmissions,
      currentSquad: data.stats?.currentSquad,
      lastActive: data.stats?.lastActive
    });
  } catch (error) {
    console.log('❌ User Tracking API error:', error.message);
  }
}

async function testUserSyncAPI() {
  console.log('\n🧪 Testing User Sync API...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/user-sync?wallet=${TEST_WALLET}`);
    
    if (!response.ok) {
      console.log('❌ User Sync API failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ User Sync API working');
    console.log('👤 User profile:', {
      walletAddress: data.user?.wallet_address,
      displayName: data.user?.display_name,
      squad: data.user?.squad,
      isAdmin: data.user?.is_admin
    });
    console.log('📊 Bounty stats:', data.bountyStats);
    console.log('📚 Course stats:', data.courseStats);
    console.log('🎯 Tracking data:', data.tracking);
  } catch (error) {
    console.log('❌ User Sync API error:', error.message);
  }
}

async function testUserBountiesAPI() {
  console.log('\n🧪 Testing User Bounties API...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/user-bounties?wallet=${TEST_WALLET}`);
    
    if (!response.ok) {
      console.log('❌ User Bounties API failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ User Bounties API working');
    console.log('🎯 Bounty submissions:', data.submissions?.length || 0);
    console.log('📊 Bounty stats:', data.stats);
  } catch (error) {
    console.log('❌ User Bounties API error:', error.message);
  }
}

async function testCreateUserActivity() {
  console.log('\n🧪 Testing User Activity Creation...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/users/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: TEST_WALLET,
        displayName: 'Test User',
        squad: 'Creators',
        activityType: 'test_activity',
        metadata: {
          test: true,
          timestamp: new Date().toISOString()
        }
      })
    });
    
    if (!response.ok) {
      console.log('❌ User Activity Creation failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ User Activity Creation working');
    console.log('👤 Created user:', data.user?.wallet_address);
    console.log('📝 Message:', data.message);
  } catch (error) {
    console.log('❌ User Activity Creation error:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Submissions and User Tracking Tests\n');
  console.log(`🌐 Testing against: ${BASE_URL}`);
  console.log(`👤 Test wallet: ${TEST_WALLET}\n`);
  
  await testSubmissionsAPI();
  await testUserTrackingAPI();
  await testUserSyncAPI();
  await testUserBountiesAPI();
  await testCreateUserActivity();
  
  console.log('\n✨ All tests completed!');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testSubmissionsAPI,
  testUserTrackingAPI,
  testUserSyncAPI,
  testUserBountiesAPI,
  testCreateUserActivity,
  runAllTests
};
