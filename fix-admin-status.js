const { createClient } = require('@supabase/supabase-js');

// Use the URL from the logs we saw earlier
const supabaseUrl = 'https://mchwxspjjgyboshzqrsd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jaHd4c3Bqamd5Ym9zaHpxcnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzNzQ4NzAsImV4cCI6MjA1MDAxMDg3MH0.q0lYu6hGJ9Qz8xQz8xQz8xQz8xQz8xQz8xQz8xQz8xQ';

const supabase = createClient(supabaseUrl, supabaseKey);

const adminWallets = [
  'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
  'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
  '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
  '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
];

async function fixAdminStatus() {
  try {
    console.log('🔄 Fixing admin status for existing users...');
    
    for (const walletAddress of adminWallets) {
      console.log(`🔄 Updating admin status for: ${walletAddress}`);
      
      const { data, error } = await supabase
        .from('users')
        .update({ is_admin: true })
        .eq('wallet_address', walletAddress);
      
      if (error) {
        console.error(`❌ Error updating ${walletAddress}:`, error);
      } else {
        console.log(`✅ Updated admin status for: ${walletAddress}`);
      }
    }
    
    console.log('✅ Admin status fix completed');
    
    // Verify the changes
    console.log('🔄 Verifying admin status...');
    const { data: users, error } = await supabase
      .from('users')
      .select('wallet_address, display_name, is_admin')
      .in('wallet_address', adminWallets);
    
    if (error) {
      console.error('❌ Error verifying:', error);
    } else {
      console.log('📊 Admin users verification:');
      users?.forEach(user => {
        console.log(`  ${user.wallet_address.slice(0, 8)}... - ${user.display_name} - Admin: ${user.is_admin}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixAdminStatus();
