// Test script to verify database fixes
// Run this in your browser console after applying the SQL fixes

async function testDatabaseFix() {
  console.log('🧪 Testing database fixes...');
  
  try {
    // Test 1: Check if global_settings table is accessible
    console.log('📊 Testing global_settings access...');
    const { data: settings, error: settingsError } = await supabase
      .from('global_settings')
      .select('*')
      .limit(1);
    
    if (settingsError) {
      console.error('❌ global_settings error:', settingsError);
    } else {
      console.log('✅ global_settings accessible:', settings);
    }
    
    // Test 2: Check if users table is accessible
    console.log('👥 Testing users table access...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('wallet_address, is_admin')
      .limit(5);
    
    if (usersError) {
      console.error('❌ users table error:', usersError);
    } else {
      console.log('✅ users table accessible:', users);
    }
    
    // Test 3: Check admin status for current wallet
    if (window.solana?.publicKey) {
      const walletAddress = window.solana.publicKey.toString();
      console.log('🔑 Testing admin status for wallet:', walletAddress);
      
      const { data: adminCheck, error: adminError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('wallet_address', walletAddress)
        .single();
      
      if (adminError) {
        console.error('❌ Admin check error:', adminError);
      } else {
        console.log('✅ Admin status:', adminCheck);
      }
    }
    
    console.log('🎉 Database fix test completed!');
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testDatabaseFix();
