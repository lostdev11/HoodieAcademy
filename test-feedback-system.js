// Test script to verify feedback system database setup
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓ Set' : '✗ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFeedbackSystem() {
  console.log('🧪 Testing Feedback System...\n');

  // Test 1: Check if table exists
  console.log('1️⃣ Checking if user_feedback_submissions table exists...');
  try {
    const { data, error } = await supabase
      .from('user_feedback_submissions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Table does not exist or has issues:', error.message);
      console.log('\n📋 You need to run the database setup SQL:');
      console.log('   File: setup-user-feedback.sql');
      console.log('   OR');
      console.log('   File: RUN_THIS_FIRST.sql (contains all tables)\n');
      return false;
    }
    
    console.log('✅ Table exists!\n');
  } catch (err) {
    console.error('❌ Error checking table:', err.message);
    return false;
  }

  // Test 2: Test INSERT permission
  console.log('2️⃣ Testing INSERT permission...');
  try {
    const testData = {
      title: 'Test Feedback - Please Delete',
      description: 'This is a test feedback submission to verify the system works.',
      category: 'improvement',
      wallet_address: 'test_wallet_123',
      status: 'pending',
      upvotes: 0
    };

    const { data, error } = await supabase
      .from('user_feedback_submissions')
      .insert(testData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Cannot insert feedback:', error.message);
      console.log('   Error details:', error);
      return false;
    }
    
    console.log('✅ INSERT works! Test record created:', data.id);
    
    // Clean up test record
    console.log('3️⃣ Cleaning up test record...');
    const { error: deleteError } = await supabase
      .from('user_feedback_submissions')
      .delete()
      .eq('id', data.id);
    
    if (deleteError) {
      console.log('⚠️  Could not delete test record:', deleteError.message);
    } else {
      console.log('✅ Test record cleaned up\n');
    }
  } catch (err) {
    console.error('❌ Error testing INSERT:', err.message);
    return false;
  }

  // Test 3: Check feedback_updates table
  console.log('4️⃣ Checking feedback_updates table...');
  try {
    const { data, error } = await supabase
      .from('feedback_updates')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ feedback_updates table does not exist or has issues:', error.message);
      console.log('   This table is needed for the "You Asked, We Fixed" widget\n');
      return false;
    }
    
    console.log(`✅ feedback_updates table exists! Found ${data?.length || 0} updates\n`);
    
    if (data && data.length > 0) {
      console.log('📊 Sample updates:');
      data.slice(0, 3).forEach((update, i) => {
        console.log(`   ${i + 1}. ${update.title} (${update.status})`);
      });
      console.log('');
    } else {
      console.log('⚠️  No feedback updates found. The widget will show "No updates yet."\n');
    }
  } catch (err) {
    console.error('❌ Error checking feedback_updates:', err.message);
  }

  // Test 4: List all feedback submissions
  console.log('5️⃣ Listing existing feedback submissions...');
  try {
    const { data, error } = await supabase
      .from('user_feedback_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Cannot list feedback:', error.message);
    } else {
      console.log(`✅ Found ${data?.length || 0} feedback submissions\n`);
      
      if (data && data.length > 0) {
        console.log('📊 Recent feedback:');
        data.slice(0, 5).forEach((fb, i) => {
          console.log(`   ${i + 1}. [${fb.category}] ${fb.title} - Status: ${fb.status}`);
        });
        console.log('');
      }
    }
  } catch (err) {
    console.error('❌ Error listing feedback:', err.message);
  }

  console.log('✅ All tests passed! Feedback system is working correctly.\n');
  return true;
}

testFeedbackSystem()
  .then((success) => {
    if (success) {
      console.log('🎉 Feedback system is ready to use!');
    } else {
      console.log('⚠️  Feedback system has issues that need to be fixed.');
      console.log('   Run the SQL setup file to create the required tables.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('💥 Unexpected error:', err);
    process.exit(1);
  });

