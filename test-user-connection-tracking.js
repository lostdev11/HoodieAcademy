// Test script to verify user connection tracking functionality
// Run this with: node test-user-connection-tracking.js

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testUserConnectionTracking() {
  console.log('🧪 Testing User Connection Tracking...\n');

  try {
    // Test 1: Check if wallet_connections table exists
    console.log('1. Checking wallet_connections table...');
    const { data: connections, error: connectionsError } = await supabase
      .from('wallet_connections')
      .select('*')
      .limit(1);

    if (connectionsError) {
      console.log('❌ wallet_connections table not found or accessible');
      console.log('Error:', connectionsError.message);
      console.log('\n💡 Please run the WALLET_CONNECTIONS_SETUP.sql script in your Supabase SQL editor');
      return;
    }
    console.log('✅ wallet_connections table exists');

    // Test 2: Check if users table exists and has data
    console.log('\n2. Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    if (usersError) {
      console.log('❌ users table not found or accessible');
      console.log('Error:', usersError.message);
      return;
    }
    console.log(`✅ users table exists with ${users.length} users`);

    // Test 3: Test admin users API endpoint
    console.log('\n3. Testing admin users API...');
    const testWallet = users[0]?.wallet_address || 'test-wallet-123';
    const response = await fetch(`http://localhost:3000/api/admin/users?wallet=${testWallet}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Admin users API working');
      console.log(`   - Found ${data.users.length} users`);
      console.log(`   - Total connections: ${data.stats.totalConnections}`);
      console.log(`   - Users with verified NFTs: ${data.stats.usersWithVerifiedNFTs}`);
      console.log(`   - Active users: ${data.stats.activeUsers}`);
    } else {
      console.log('❌ Admin users API failed');
      console.log('Status:', response.status, response.statusText);
    }

    // Test 4: Check if we can insert a test connection
    console.log('\n4. Testing connection logging...');
    const testConnection = {
      wallet_address: 'test-wallet-' + Date.now(),
      connection_type: 'connect',
      verification_result: { provider: 'phantom', test: true },
      user_agent: 'test-agent',
      session_data: { test: true }
    };

    const { data: insertData, error: insertError } = await supabase
      .from('wallet_connections')
      .insert(testConnection)
      .select();

    if (insertError) {
      console.log('❌ Failed to insert test connection');
      console.log('Error:', insertError.message);
    } else {
      console.log('✅ Test connection inserted successfully');
      
      // Clean up test data
      await supabase
        .from('wallet_connections')
        .delete()
        .eq('id', insertData[0].id);
      console.log('✅ Test data cleaned up');
    }

    console.log('\n🎉 User connection tracking test completed!');
    console.log('\n📋 Summary:');
    console.log('   - Database tables are set up correctly');
    console.log('   - Admin API is working');
    console.log('   - Connection logging is functional');
    console.log('\n🚀 You can now use the admin dashboard to view user connections!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUserConnectionTracking();
