// Test script to check if the bounty API is working
// Run with: node test-bounty-api.js

const BOUNTY_ID = 'b6c9029a-c455-4e76-b176-1f41c167045f';
const API_URL = 'http://localhost:3000';

async function testBountyAPI() {
  console.log('🧪 Testing Bounty API...\n');
  
  try {
    console.log(`📡 Fetching bounty: ${BOUNTY_ID}`);
    const response = await fetch(`${API_URL}/api/bounties/${BOUNTY_ID}`);
    
    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log(`📄 Response body:`, text);
    
    try {
      const json = JSON.parse(text);
      console.log(`✅ Parsed JSON:`, JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(`❌ Could not parse as JSON`);
    }
    
    if (response.ok) {
      console.log('\n✅ API test PASSED');
    } else {
      console.log('\n❌ API test FAILED');
      console.log('\nPossible issues:');
      console.log('1. RLS policies blocking access');
      console.log('2. Bounty ID does not exist');
      console.log('3. Server environment variables not set');
      console.log('4. Service role key not working');
    }
  } catch (error) {
    console.error('\n💥 Error:', error.message);
    console.log('\nMake sure:');
    console.log('1. Dev server is running (npm run dev)');
    console.log('2. Check the server console for errors');
  }
}

// Also test fetching all bounties
async function testAllBounties() {
  console.log('\n\n🧪 Testing All Bounties API...\n');
  
  try {
    console.log(`📡 Fetching all bounties`);
    const response = await fetch(`${API_URL}/api/bounties`);
    
    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const bounties = await response.json();
      console.log(`✅ Found ${bounties.length} bounties`);
      
      if (bounties.length > 0) {
        console.log(`\nFirst bounty:`, JSON.stringify(bounties[0], null, 2));
        
        // Check if our problem bounty is in the list
        const problematicBounty = bounties.find(b => b.id === BOUNTY_ID);
        if (problematicBounty) {
          console.log(`\n✅ Found the problematic bounty in the list!`);
          console.log(JSON.stringify(problematicBounty, null, 2));
        } else {
          console.log(`\n⚠️ The problematic bounty (${BOUNTY_ID}) was NOT found in the list`);
          console.log(`This might mean it doesn't exist in the database.`);
        }
      }
    } else {
      console.log(`❌ Failed to fetch bounties`);
    }
  } catch (error) {
    console.error('\n💥 Error:', error.message);
  }
}

// Run tests
testBountyAPI().then(() => testAllBounties());

