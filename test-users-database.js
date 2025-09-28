// Test script to check users in database and create test users if needed
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUsers() {
  try {
    console.log('🔍 Checking users table...');
    
    // Check if users table exists
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'users');
    
    if (tableError) {
      console.error('❌ Error checking tables:', tableError);
      return;
    }
    
    if (!tables || tables.length === 0) {
      console.log('❌ Users table does not exist');
      return;
    }
    
    console.log('✅ Users table exists');
    
    // Check current users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(10);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log(`📊 Found ${users?.length || 0} users in database`);
    
    if (users && users.length > 0) {
      console.log('👥 Current users:');
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.wallet_address} - ${user.display_name || 'No name'} (${user.squad || 'No squad'})`);
      });
    } else {
      console.log('📝 No users found. Creating test users...');
      
      // Create some test users
      const testUsers = [
        {
          wallet_address: 'test-wallet-1',
          display_name: 'Test User 1',
          squad: 'Alpha',
          profile_completed: true,
          squad_test_completed: true,
          placement_test_completed: true,
          is_admin: false,
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        },
        {
          wallet_address: 'test-wallet-2',
          display_name: 'Test User 2',
          squad: 'Beta',
          profile_completed: true,
          squad_test_completed: true,
          placement_test_completed: false,
          is_admin: false,
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        },
        {
          wallet_address: 'admin-wallet',
          display_name: 'Admin User',
          squad: 'Gamma',
          profile_completed: true,
          squad_test_completed: true,
          placement_test_completed: true,
          is_admin: true,
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        }
      ];
      
      const { data: insertedUsers, error: insertError } = await supabase
        .from('users')
        .insert(testUsers)
        .select();
      
      if (insertError) {
        console.error('❌ Error inserting test users:', insertError);
        return;
      }
      
      console.log('✅ Created test users:', insertedUsers?.length || 0);
    }
    
    // Test the admin API
    console.log('\n🔧 Testing admin API...');
    const response = await fetch('http://localhost:3000/api/test-users');
    const apiData = await response.json();
    console.log('API Response:', apiData);
    
  } catch (error) {
    console.error('❌ Error in test script:', error);
  }
}

testUsers();
