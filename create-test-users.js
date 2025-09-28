// Script to create test users in the database
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUsers() {
  try {
    console.log('🔧 Creating test users...');
    
    // First, let's check if the users table exists and what columns it has
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'users')
      .order('ordinal_position');
    
    if (columnsError) {
      console.error('❌ Error checking table structure:', columnsError);
      return;
    }
    
    console.log('📋 Current users table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Create test users with only the columns that exist
    const testUsers = [
      {
        wallet_address: 'test-wallet-1',
        display_name: 'Test User 1',
        squad: 'Alpha',
        is_admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        wallet_address: 'test-wallet-2',
        display_name: 'Test User 2', 
        squad: 'Beta',
        is_admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        wallet_address: 'admin-wallet',
        display_name: 'Admin User',
        squad: 'Gamma',
        is_admin: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    // Add additional columns if they exist
    const hasLastActive = columns.some(col => col.column_name === 'last_active');
    const hasProfileCompleted = columns.some(col => col.column_name === 'profile_completed');
    const hasTotalXp = columns.some(col => col.column_name === 'total_xp');
    
    if (hasLastActive) {
      testUsers.forEach(user => user.last_active = new Date().toISOString());
    }
    if (hasProfileCompleted) {
      testUsers.forEach(user => user.profile_completed = true);
    }
    if (hasTotalXp) {
      testUsers.forEach(user => user.total_xp = Math.floor(Math.random() * 2000) + 500);
    }
    
    console.log('👥 Test users to create:');
    testUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.wallet_address} - ${user.display_name} (${user.squad})`);
    });
    
    // Insert users
    const { data: insertedUsers, error: insertError } = await supabase
      .from('users')
      .upsert(testUsers, { onConflict: 'wallet_address' })
      .select();
    
    if (insertError) {
      console.error('❌ Error inserting test users:', insertError);
      return;
    }
    
    console.log('✅ Successfully created/updated test users:');
    insertedUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.wallet_address} - ${user.display_name} (${user.squad})`);
    });
    
    // Verify the users were created
    console.log('\n🔍 Verifying users in database...');
    const { data: allUsers, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError);
    } else {
      console.log(`📊 Total users in database: ${allUsers.length}`);
      allUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.wallet_address} - ${user.display_name || 'No name'} (${user.squad || 'No squad'}) - Admin: ${user.is_admin ? 'Yes' : 'No'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createTestUsers();
