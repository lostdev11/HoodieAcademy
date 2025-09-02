const { createClient } = require('@supabase/supabase-js');

// This is a simple test to check database connection
// You'll need to set your environment variables first

async function testConnection() {
  console.log('Testing database connection...');
  
  // Check if environment variables are set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Environment variables not set');
    console.log('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.log('You can create a .env.local file with these variables');
    return;
  }
  
  console.log('✅ Environment variables found');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey.substring(0, 20) + '...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection
    console.log('\n🔍 Testing basic connection...');
    const { data, error } = await supabase.from('courses').select('count').limit(1);
    
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      console.log('This might mean:');
      console.log('1. The courses table doesn\'t exist');
      console.log('2. RLS policies are blocking access');
      console.log('3. Environment variables are incorrect');
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Test courses table
    console.log('\n📚 Testing courses table...');
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(5);
    
    if (coursesError) {
      console.log('❌ Courses table error:', coursesError.message);
    } else {
      console.log(`✅ Found ${courses?.length || 0} courses in database`);
      if (courses && courses.length > 0) {
        console.log('Sample course:', {
          id: courses[0].id,
          title: courses[0].title,
          is_visible: courses[0].is_visible,
          is_published: courses[0].is_published
        });
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testConnection();
