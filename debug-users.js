// Debug script to check users in database
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Environment Check:');
console.log('Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('Service Key:', supabaseServiceKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugUsers() {
  try {
    console.log('\n🔍 Checking database connection...');
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Check if users table exists
    console.log('\n🔍 Checking users table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'users')
      .order('ordinal_position');
    
    if (columnsError) {
      console.error('❌ Error checking table structure:', columnsError);
    } else {
      console.log('📋 Users table columns:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }
    
    // Check user count
    console.log('\n🔍 Checking user count...');
    const { count: userCount, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting users:', countError);
    } else {
      console.log(`📊 Total users in database: ${userCount}`);
    }
    
    // Get sample users
    console.log('\n🔍 Fetching sample users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    } else {
      console.log(`👥 Sample users (${users.length}):`);
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.wallet_address} - ${user.display_name || 'No name'} (${user.squad || 'No squad'})`);
      });
    }
    
    // Test the admin API
    console.log('\n🔍 Testing admin API...');
    try {
      const response = await fetch('http://localhost:3000/api/admin/users');
      const apiData = await response.json();
      
      console.log('📡 Admin API Response:');
      console.log('  Status:', response.status);
      console.log('  Success:', !apiData.error);
      console.log('  Users count:', apiData.users?.length || 0);
      console.log('  Total:', apiData.total || 0);
      
      if (apiData.error) {
        console.log('  Error:', apiData.error);
        if (apiData.details) {
          console.log('  Details:', apiData.details);
        }
      }
    } catch (apiError) {
      console.error('❌ Error testing admin API:', apiError.message);
    }
    
    // Test the test API
    console.log('\n🔍 Testing test API...');
    try {
      const response = await fetch('http://localhost:3000/api/test-users');
      const testData = await response.json();
      
      console.log('📡 Test API Response:');
      console.log('  Success:', testData.success);
      console.log('  Users count:', testData.usersCount);
      console.log('  Table exists:', testData.tableExists);
      console.log('  Message:', testData.message);
    } catch (apiError) {
      console.error('❌ Error testing test API:', apiError.message);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugUsers();
