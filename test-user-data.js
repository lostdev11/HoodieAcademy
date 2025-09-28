// Test script to check if user data is being fetched correctly
// This script tests the user tracking API endpoints

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testUserData() {
  console.log('🧪 Testing User Data Fetching...\n');

  try {
    // Test 1: Check if users table exists and has data
    console.log('1. Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    if (usersError) {
      console.error('❌ Users table error:', usersError.message);
    } else {
      console.log('✅ Users table accessible');
      console.log('   Sample users:', users?.length || 0);
      if (users && users.length > 0) {
        console.log('   First user:', {
          wallet_address: users[0].wallet_address,
          display_name: users[0].display_name,
          squad: users[0].squad
        });
      }
    }

    // Test 2: Check user_xp table
    console.log('\n2. Checking user_xp table...');
    const { data: userXP, error: xpError } = await supabase
      .from('user_xp')
      .select('*')
      .limit(5);

    if (xpError) {
      console.error('❌ User XP table error:', xpError.message);
    } else {
      console.log('✅ User XP table accessible');
      console.log('   XP records:', userXP?.length || 0);
    }

    // Test 3: Check bounty_submissions table
    console.log('\n3. Checking bounty_submissions table...');
    const { data: bountySubmissions, error: bountyError } = await supabase
      .from('bounty_submissions')
      .select('*')
      .limit(5);

    if (bountyError) {
      console.error('❌ Bounty submissions table error:', bountyError.message);
    } else {
      console.log('✅ Bounty submissions table accessible');
      console.log('   Submissions:', bountySubmissions?.length || 0);
    }

    // Test 4: Check course_completions table
    console.log('\n4. Checking course_completions table...');
    const { data: courseCompletions, error: courseError } = await supabase
      .from('course_completions')
      .select('*')
      .limit(5);

    if (courseError) {
      console.error('❌ Course completions table error:', courseError.message);
    } else {
      console.log('✅ Course completions table accessible');
      console.log('   Completions:', courseCompletions?.length || 0);
    }

    // Test 5: Test user tracking API
    console.log('\n5. Testing user tracking API...');
    const testWallet = users && users.length > 0 ? users[0].wallet_address : 'test-wallet-123';
    
    try {
      const response = await fetch(`http://localhost:3000/api/users/track?wallet=${testWallet}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ User tracking API works');
        console.log('   Response structure:', {
          hasUser: !!data.user,
          hasStats: !!data.stats,
          hasSubmissions: !!data.submissions,
          hasCourseCompletions: !!data.courseCompletions,
          hasBountyCompletions: !!data.bountyCompletions
        });
        console.log('   Stats:', data.stats);
      } else {
        const errorData = await response.json();
        console.log('⚠️  User tracking API returned:', response.status, errorData);
      }
    } catch (err) {
      console.log('⚠️  User tracking API test failed (server may not be running):', err.message);
    }

    // Test 6: Test bounty completions API
    console.log('\n6. Testing bounty completions API...');
    try {
      const response = await fetch(`http://localhost:3000/api/users/bounty-completions?wallet=${testWallet}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Bounty completions API works');
        console.log('   Completions:', data.completions?.length || 0);
      } else {
        const errorData = await response.json();
        console.log('⚠️  Bounty completions API returned:', response.status, errorData);
      }
    } catch (err) {
      console.log('⚠️  Bounty completions API test failed (server may not be running):', err.message);
    }

    console.log('\n🎉 User data testing completed!');
    console.log('\nIf data is not showing in the UI:');
    console.log('1. Make sure the development server is running');
    console.log('2. Check browser console for errors');
    console.log('3. Verify wallet connection is working');
    console.log('4. Check if the user has data in the database');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUserData();
