// Test bounty connection and data
require('dotenv').config({ path: '.env.local' });

console.log('=== Environment Check ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('\n❌ Environment variables not set. Please check your .env.local file.');
  console.log('Required variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testBountyConnection() {
  console.log('\n=== Testing Bounty Connection ===');
  
  try {
    // Test bounties table
    console.log('Fetching bounties...');
    const { data: bounties, error: bountyError } = await supabase
      .from('bounties')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (bountyError) {
      console.error('❌ Error fetching bounties:', bountyError);
    } else {
      console.log('✅ Bounties fetched successfully');
      console.log('Bounties count:', bounties?.length || 0);
      if (bounties && bounties.length > 0) {
        console.log('Sample bounty:', {
          id: bounties[0].id,
          title: bounties[0].title,
          status: bounties[0].status,
          submissions: bounties[0].submissions
        });
      }
    }

    // Test bounty_submissions table
    console.log('\nFetching bounty submissions...');
    const { data: submissions, error: subError } = await supabase
      .from('bounty_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (subError) {
      console.error('❌ Error fetching bounty submissions:', subError);
    } else {
      console.log('✅ Bounty submissions fetched successfully');
      console.log('Submissions count:', submissions?.length || 0);
    }

    // Test submissions table
    console.log('\nFetching all submissions...');
    const { data: allSubmissions, error: allSubError } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (allSubError) {
      console.error('❌ Error fetching all submissions:', allSubError);
    } else {
      console.log('✅ All submissions fetched successfully');
      console.log('All submissions count:', allSubmissions?.length || 0);
    }

  } catch (error) {
    console.error('❌ Connection error:', error);
  }
}

testBountyConnection();

