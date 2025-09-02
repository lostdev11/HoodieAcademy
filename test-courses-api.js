const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCoursesAPI() {
  console.log('Testing courses API...');
  
  try {
    // Test 1: Direct database query
    console.log('\n1. Testing direct database query...');
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Database query error:', error);
    } else {
      console.log(`Found ${courses?.length || 0} courses in database`);
      if (courses && courses.length > 0) {
        console.log('Sample course:', courses[0]);
      }
    }

    // Test 2: Check if courses table exists
    console.log('\n2. Checking table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'courses');
    
    if (tableError) {
      console.error('Table check error:', tableError);
    } else {
      console.log('Courses table exists:', tableInfo?.length > 0);
    }

    // Test 3: Check RLS policies
    console.log('\n3. Checking RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .from('information_schema.policies')
      .select('*')
      .eq('table_name', 'courses');
    
    if (policyError) {
      console.error('Policy check error:', policyError);
    } else {
      console.log(`Found ${policies?.length || 0} RLS policies for courses table`);
      policies?.forEach(policy => {
        console.log(`- ${policy.policy_name}: ${policy.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'} ${policy.cmd}`);
      });
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testCoursesAPI();
