// Test script to check squad_chat table connection
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSquadChatConnection() {
  console.log('🧪 Testing squad_chat table connection...');
  
  try {
    // Test if table exists by trying to select from it
    const { data, error } = await supabase
      .from('squad_chat')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Error connecting to squad_chat table:', error.message);
      console.log('\n📋 To fix this, run the SQL script in your Supabase dashboard:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the contents of setup-squad-chat.sql');
      console.log('4. Run the script');
      return false;
    }

    console.log('✅ Successfully connected to squad_chat table!');
    
    // Try to get message count
    const { count, error: countError } = await supabase
      .from('squad_chat')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('⚠️  Could not get message count:', countError.message);
    } else {
      console.log(`📊 Found ${count} messages in squad_chat table`);
    }

    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

testSquadChatConnection().then(success => {
  if (success) {
    console.log('\n🎉 Squad chat is ready to use!');
  } else {
    console.log('\n🔧 Please run the database setup script first.');
  }
  process.exit(success ? 0 : 1);
});
