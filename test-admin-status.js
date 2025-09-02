// Test script to verify admin status directly
// Run this in your browser console

async function testAdminStatus() {
  console.log('🧪 Testing admin status directly...');
  
  try {
    // Get the wallet address from localStorage
    const walletAddress = localStorage.getItem('hoodie_academy_wallet');
    console.log('🔑 Wallet from localStorage:', walletAddress);
    
    if (!walletAddress) {
      console.error('❌ No wallet found in localStorage');
      return;
    }
    
    // Import supabase client
    const { supabase } = await import('@/lib/supabase');
    
    // Check admin status directly
    console.log('🔍 Checking admin status for wallet:', walletAddress);
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', walletAddress)
      .single();
    
    if (error) {
      console.error('❌ Admin check error:', error);
    } else {
      console.log('✅ Admin check result:', data);
      console.log('👑 Is admin:', !!data?.is_admin);
      
      if (data?.is_admin) {
        console.log('🎯 This wallet IS an admin!');
        console.log('🚀 You should be redirected to /admin');
      } else {
        console.log('❌ This wallet is NOT an admin');
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testAdminStatus();
