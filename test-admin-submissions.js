#!/usr/bin/env node

/**
 * Test script for admin submissions functionality
 * This script tests the admin submissions API and components
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
const ADMIN_WALLET = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU';

async function testMainSubmissionsAPI() {
  console.log('🧪 Testing Main Submissions API...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/submissions`);
    
    if (!response.ok) {
      console.log('❌ Main Submissions API failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Main Submissions API working');
    console.log(`📊 Found ${Array.isArray(data) ? data.length : 0} submissions`);
    
    if (Array.isArray(data) && data.length > 0) {
      const sample = data[0];
      console.log('📝 Sample submission structure:', {
        id: sample.id,
        title: sample.title,
        status: sample.status,
        walletAddress: sample.walletAddress,
        squad: sample.squad,
        hasUpvotes: !!sample.upvotes,
        totalUpvotes: sample.totalUpvotes,
        timestamp: sample.timestamp
      });
    }
  } catch (error) {
    console.log('❌ Main Submissions API error:', error.message);
  }
}

async function testAdminSubmissionsAPI() {
  console.log('\n🧪 Testing Admin Submissions API...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/submissions?wallet=${ADMIN_WALLET}`);
    
    if (!response.ok) {
      console.log('❌ Admin Submissions API failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Admin Submissions API working');
    console.log(`📊 Found ${data.submissions?.length || 0} admin submissions`);
    
    if (data.submissions && data.submissions.length > 0) {
      const sample = data.submissions[0];
      console.log('📝 Sample admin submission structure:', {
        id: sample.id,
        wallet_address: sample.wallet_address,
        bounty_id: sample.bounty_id,
        submission: sample.submission?.title,
        status: sample.status
      });
    }
  } catch (error) {
    console.log('❌ Admin Submissions API error:', error.message);
  }
}

async function testAdminBountySubmissionsAPI() {
  console.log('\n🧪 Testing Admin Bounty Submissions API...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/bounty-submissions?wallet=${ADMIN_WALLET}`);
    
    if (!response.ok) {
      console.log('❌ Admin Bounty Submissions API failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Admin Bounty Submissions API working');
    console.log(`📊 Found ${data.submissions?.length || 0} bounty submissions`);
    
    if (data.submissions && data.submissions.length > 0) {
      const sample = data.submissions[0];
      console.log('📝 Sample bounty submission structure:', {
        id: sample.id,
        wallet_address: sample.wallet_address,
        bounty_id: sample.bounty_id,
        xp_awarded: sample.xp_awarded,
        placement: sample.placement
      });
    }
  } catch (error) {
    console.log('❌ Admin Bounty Submissions API error:', error.message);
  }
}

async function testDatabaseTables() {
  console.log('\n🧪 Testing Database Tables...');
  
  try {
    // Test if we can fetch from the main submissions API (which uses database)
    const response = await fetch(`${BASE_URL}/api/submissions`);
    
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        console.log('✅ Database submissions table is working');
        console.log(`📊 Found ${data.length} submissions in database`);
      } else {
        console.log('⚠️ Database submissions table is empty');
      }
    } else {
      console.log('❌ Database submissions table not accessible');
    }
  } catch (error) {
    console.log('❌ Database test error:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Admin Submissions Tests\n');
  console.log(`🌐 Testing against: ${BASE_URL}`);
  console.log(`👤 Admin wallet: ${ADMIN_WALLET}\n`);
  
  await testMainSubmissionsAPI();
  await testAdminSubmissionsAPI();
  await testAdminBountySubmissionsAPI();
  await testDatabaseTables();
  
  console.log('\n✨ All admin submissions tests completed!');
  console.log('\n📋 Summary:');
  console.log('- Main submissions API should show all submissions');
  console.log('- Admin submissions API should show bounty submissions for admin review');
  console.log('- Admin bounty submissions API should show detailed bounty data');
  console.log('- Database should contain submission data');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testMainSubmissionsAPI,
  testAdminSubmissionsAPI,
  testAdminBountySubmissionsAPI,
  testDatabaseTables,
  runAllTests
};
