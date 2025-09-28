// Test script for bounty completion tracking
// This script tests the bounty completion functionality

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testBountyCompletion() {
  console.log('🧪 Testing Bounty Completion System...\n');

  try {
    // Test 1: Check if user_bounty_completions table exists
    console.log('1. Checking if user_bounty_completions table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('user_bounty_completions')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Table does not exist or has issues:', tableError.message);
      console.log('Please run the create-user-bounty-completions-table.sql script first.');
      return;
    }
    console.log('✅ user_bounty_completions table exists');

    // Test 2: Check if mark_bounty_completed function exists
    console.log('\n2. Testing mark_bounty_completed function...');
    const testWallet = 'test-wallet-123';
    const testBountyId = 'test-bounty-123';
    const testSubmissionId = 'test-submission-123';

    try {
      const { data: functionTest, error: functionError } = await supabase.rpc('mark_bounty_completed', {
        p_wallet_address: testWallet,
        p_bounty_id: testBountyId,
        p_submission_id: testSubmissionId,
        p_xp_awarded: 10,
        p_sol_prize: 0
      });

      if (functionError) {
        console.error('❌ Function test failed:', functionError.message);
      } else {
        console.log('✅ mark_bounty_completed function works');
      }
    } catch (err) {
      console.log('⚠️  Function test failed (expected if bounty doesn\'t exist):', err.message);
    }

    // Test 3: Check API endpoints
    console.log('\n3. Testing API endpoints...');
    
    // Test bounty completions API
    try {
      const response = await fetch(`http://localhost:3000/api/users/bounty-completions?wallet=${testWallet}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Bounty completions API works');
        console.log('   Response:', data);
      } else {
        console.log('⚠️  Bounty completions API returned:', response.status);
      }
    } catch (err) {
      console.log('⚠️  Bounty completions API test failed (server may not be running):', err.message);
    }

    // Test 4: Check approval API
    console.log('\n4. Testing approval API...');
    try {
      const response = await fetch('http://localhost:3000/api/admin/submissions/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: 'test-submission',
          action: 'approve',
          walletAddress: 'test-wallet'
        })
      });
      
      if (response.ok) {
        console.log('✅ Approval API works');
      } else {
        const errorData = await response.json();
        console.log('⚠️  Approval API returned:', response.status, errorData);
      }
    } catch (err) {
      console.log('⚠️  Approval API test failed (server may not be running):', err.message);
    }

    console.log('\n🎉 Bounty completion system test completed!');
    console.log('\nNext steps:');
    console.log('1. Run the create-user-bounty-completions-table.sql script in Supabase');
    console.log('2. Start your development server');
    console.log('3. Test the approval flow with real data');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testBountyCompletion();
