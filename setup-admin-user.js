#!/usr/bin/env node

/**
 * Setup Admin User Script
 * This script sets up an admin user in the database
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_WALLET = 'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU';

async function setupAdminUser() {
  console.log('🔧 Setting up admin user...');
  console.log(`👤 Admin wallet: ${ADMIN_WALLET}`);

  try {
    // First, check if the user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', ADMIN_WALLET)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing user:', checkError);
      return;
    }

    if (existingUser) {
      console.log('👤 User already exists, updating admin status...');
      
      // Update existing user to be admin
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({
          is_admin: true,
          last_active: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', ADMIN_WALLET)
        .select();

      if (updateError) {
        console.error('❌ Error updating user:', updateError);
        return;
      }

      console.log('✅ User updated to admin:', updateData);
    } else {
      console.log('👤 Creating new admin user...');
      
      // Create new admin user
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert({
          wallet_address: ADMIN_WALLET,
          display_name: 'Admin User',
          is_admin: true,
          profile_completed: true,
          squad_test_completed: true,
          placement_test_completed: true,
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        })
        .select();

      if (insertError) {
        console.error('❌ Error creating user:', insertError);
        return;
      }

      console.log('✅ Admin user created:', insertData);
    }

    // Verify the admin status
    const { data: verifyData, error: verifyError } = await supabase
      .from('users')
      .select('wallet_address, display_name, is_admin, created_at')
      .eq('wallet_address', ADMIN_WALLET)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying admin status:', verifyError);
      return;
    }

    console.log('✅ Admin user verified:', verifyData);

  } catch (error) {
    console.error('❌ Setup error:', error);
  }
}

async function createAdminFunction() {
  console.log('\n🔧 Creating admin check function...');
  
  const functionSQL = `
    CREATE OR REPLACE FUNCTION is_wallet_admin(wallet TEXT)
    RETURNS BOOLEAN AS $$
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE wallet_address = wallet 
        AND is_admin = true
      );
    END;
    $$ LANGUAGE plpgsql;
  `;

  try {
    const { data, error } = await supabase.rpc('exec', { sql: functionSQL });
    
    if (error) {
      console.error('❌ Error creating function:', error);
      return;
    }

    console.log('✅ Admin check function created successfully');
  } catch (error) {
    console.error('❌ Function creation error:', error);
  }
}

async function testAdminAccess() {
  console.log('\n🧪 Testing admin access...');
  
  try {
    const { data, error } = await supabase.rpc('is_wallet_admin', { 
      wallet: ADMIN_WALLET 
    });
    
    if (error) {
      console.error('❌ Admin access test failed:', error);
      return;
    }

    console.log('✅ Admin access test result:', data);
  } catch (error) {
    console.error('❌ Admin access test error:', error);
  }
}

async function runSetup() {
  console.log('🚀 Starting Admin User Setup\n');
  
  await setupAdminUser();
  await createAdminFunction();
  await testAdminAccess();
  
  console.log('\n✨ Admin setup completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Test the admin APIs with the configured wallet');
  console.log('2. Check the admin dashboard for submissions');
  console.log('3. Verify admin functionality is working');
}

// Run setup if this script is executed directly
if (require.main === module) {
  runSetup().catch(console.error);
}

module.exports = {
  setupAdminUser,
  createAdminFunction,
  testAdminAccess,
  runSetup
};
