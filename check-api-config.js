// Check if API configuration is correct
// Run this with: node check-api-config.js

console.log('🔍 Checking API Configuration...\n');

// Check environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

let allPresent = true;

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Show first few characters only for security
    const preview = value.substring(0, 20) + '...';
    console.log(`✅ ${varName}: ${preview}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allPresent = false;
  }
});

if (!allPresent) {
  console.log('\n⚠️  Missing environment variables!');
  console.log('Make sure you have a .env.local file with:');
  console.log('  NEXT_PUBLIC_SUPABASE_URL=<your-url>');
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>');
} else {
  console.log('\n✅ All environment variables are set!');
}

console.log('\n📝 Next steps:');
console.log('1. Run the fix-bounties-rls-403.sql script in your Supabase SQL Editor');
console.log('2. Restart your Next.js dev server');
console.log('3. Clear your browser cache and reload');

