// Test script to check bounty API
const fetch = require('node-fetch');

async function testBountyAPI() {
  console.log('🧪 Testing Bounty API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/bounties', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Response Status:', response.status);
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', data);
      console.log('📊 Number of bounties:', Array.isArray(data) ? data.length : 'Not an array');
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('📋 Bounty details:');
        data.forEach((bounty, index) => {
          console.log(`${index + 1}. ${bounty.title} (ID: ${bounty.id}) - Status: ${bounty.status}`);
        });
      } else {
        console.log('❌ No bounties returned or data is not an array');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', response.status, errorText);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

testBountyAPI();
