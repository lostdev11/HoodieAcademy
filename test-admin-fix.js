// Test script to verify admin access fix
// Run this in your browser console after applying the SQL fix

async function testAdminFix() {
  console.log('🧪 Testing admin access fix...');
  
  try {
    // Test 1: Check if is_admin column exists
    console.log('📊 Testing is_admin column...');
    const { data: columnCheck, error: columnError } = await supabase
      .from('users')
      .select('wallet_address, is_admin')
      .limit(1);
    
    if (columnError) {
      console.error('❌ is_admin column error:', columnError);
    } else {
      console.log('✅ is_admin column accessible:', columnCheck);
    }
    
    // Test 2: Check admin status for the specific wallet
    const targetWallet = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU';
    console.log('🔑 Testing admin status for wallet:', targetWallet);
    
    const { data: adminCheck, error: adminError } = await supabase
      .from('users')
      .select('wallet_address, display_name, squad, is_admin, created_at')
      .eq('wallet_address', targetWallet)
      .single();
    
    if (adminError) {
      console.error('❌ Admin check error:', adminError);
    } else {
      console.log('✅ Admin status check:', adminCheck);
      if (adminCheck?.is_admin) {
        console.log('🎉 SUCCESS: Wallet is now admin!');
      } else {
        console.log('❌ FAILED: Wallet is still not admin');
      }
    }
    
    // Test 3: Check all admin users
    console.log('👑 Checking all admin users...');
    const { data: allAdmins, error: adminsError } = await supabase
      .from('users')
      .select('wallet_address, display_name, squad, is_admin')
      .eq('is_admin', true);
    
    if (adminsError) {
      console.error('❌ All admins check error:', adminsError);
    } else {
      console.log('✅ All admin users:', allAdmins);
      console.log(`📊 Total admin users: ${allAdmins?.length || 0}`);
    }
    
    console.log('🎉 Admin fix test completed!');
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testAdminFix();
