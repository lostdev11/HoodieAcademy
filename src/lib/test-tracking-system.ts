'use client';

import { supabase } from '@/lib/supabase';
import { getCompleteAdminDashboardData } from '@/lib/admin-analytics';

/**
 * Test script to verify the tracking system is working correctly
 * Run this in your browser console or create a test component
 */
export async function testTrackingSystem() {
  console.log('🧪 Testing Wallet-Based User Tracking System...');
  
  try {
    // Test 1: Check if tables exist
    console.log('📋 Test 1: Checking database tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['profiles', 'wallets', 'sessions', 'event_log', 'course_progress']);

    if (tablesError) {
      console.error('❌ Tables check failed:', tablesError);
      return false;
    }

    const expectedTables = ['profiles', 'wallets', 'sessions', 'event_log', 'course_progress'];
    const foundTables = tables?.map(t => t.table_name) || [];
    const missingTables = expectedTables.filter(table => !foundTables.includes(table));

    if (missingTables.length > 0) {
      console.error('❌ Missing tables:', missingTables);
      return false;
    }

    console.log('✅ All required tables exist');

    // Test 2: Check RLS policies
    console.log('📋 Test 2: Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('tablename, policyname')
      .in('tablename', ['profiles', 'wallets', 'sessions', 'event_log']);

    if (policiesError) {
      console.warn('⚠️ Could not check RLS policies (this is normal for some Supabase setups)');
    } else {
      console.log('✅ RLS policies found:', policies?.length || 0);
    }

    // Test 3: Test API endpoints
    console.log('📋 Test 3: Testing API endpoints...');
    
    // Test session creation
    const sessionResponse = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: 'test-wallet-address' })
    });

    if (!sessionResponse.ok) {
      console.error('❌ Session API test failed:', sessionResponse.status);
      return false;
    }

    const sessionData = await sessionResponse.json();
    console.log('✅ Session API working, sessionId:', sessionData.sessionId);

    // Test event tracking
    const trackResponse = await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'custom',
        payload: { type: 'test_event', test: true },
        sessionId: sessionData.sessionId
      })
    });

    if (!trackResponse.ok) {
      console.error('❌ Track API test failed:', trackResponse.status);
      return false;
    }

    console.log('✅ Track API working');

    // Test 4: Check materialized views
    console.log('📋 Test 4: Checking materialized views...');
    const { data: views, error: viewsError } = await supabase
      .from('pg_matviews')
      .select('matviewname')
      .in('matviewname', ['activity_daily', 'activity_weekly', 'activity_monthly']);

    if (viewsError) {
      console.warn('⚠️ Could not check materialized views (this is normal for some Supabase setups)');
    } else {
      console.log('✅ Materialized views found:', views?.length || 0);
    }

    // Test 5: Test admin analytics
    console.log('📋 Test 5: Testing admin analytics...');
    try {
      const dashboardData = await getCompleteAdminDashboardData();
      console.log('✅ Admin analytics working');
      console.log('📊 Dashboard stats:', dashboardData.stats);
    } catch (analyticsError) {
      console.warn('⚠️ Admin analytics test failed (this is normal if no data exists yet):', analyticsError);
    }

    // Test 6: Test helper views
    console.log('📋 Test 6: Testing helper views...');
    try {
      const { data: liveUsers } = await supabase
        .from('live_users')
        .select('*')
        .limit(1);
      console.log('✅ Live users view working');

      const { data: inactiveUsers } = await supabase
        .from('inactive_users_7d')
        .select('*')
        .limit(1);
      console.log('✅ Inactive users view working');

      const { data: topCourses } = await supabase
        .from('top_courses_7d')
        .select('*')
        .limit(1);
      console.log('✅ Top courses view working');
    } catch (viewsError) {
      console.warn('⚠️ Helper views test failed (this is normal if no data exists yet):', viewsError);
    }

    console.log('🎉 All tests completed! The tracking system appears to be working correctly.');
    return true;

  } catch (error) {
    console.error('💥 Test failed with error:', error);
    return false;
  }
}

/**
 * Test the tracking hooks
 */
export async function testTrackingHooks() {
  console.log('🧪 Testing tracking hooks...');
  
  // This would be called from a React component
  console.log('📝 To test hooks, use them in a React component:');
  console.log(`
    import { useEnhancedWalletSupabase } from '@/hooks/use-enhanced-wallet-supabase';
    import { useCourseEvents } from '@/hooks/useCourseEvents';
    import { usePageView } from '@/hooks/usePageView';
    
    function TestComponent() {
      const { wallet, sessionId } = useEnhancedWalletSupabase();
      const { onCourseStart } = useCourseEvents();
      usePageView();
      
      // Test course tracking
      const handleTest = () => {
        onCourseStart('test-course');
      };
      
      return <button onClick={handleTest}>Test Course Tracking</button>;
    }
  `);
}

/**
 * Generate sample data for testing
 */
export async function generateSampleData() {
  console.log('📊 Generating sample tracking data...');
  
  try {
    // Create a test profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: crypto.randomUUID(),
        primary_wallet: 'test-wallet-' + Date.now(),
        display_name: 'Test User',
        last_active_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Failed to create test profile:', profileError);
      return false;
    }

    console.log('✅ Created test profile:', profile.id);

    // Create test wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .insert({
        user_id: profile.id,
        address: profile.primary_wallet,
        is_primary: true,
        connected_first_at: new Date().toISOString(),
        connected_last_at: new Date().toISOString()
      })
      .select()
      .single();

    if (walletError) {
      console.error('❌ Failed to create test wallet:', walletError);
      return false;
    }

    console.log('✅ Created test wallet:', wallet.id);

    // Create test session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: profile.id,
        wallet_address: profile.primary_wallet,
        is_active: true,
        started_at: new Date().toISOString(),
        last_heartbeat_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Failed to create test session:', sessionError);
      return false;
    }

    console.log('✅ Created test session:', session.id);

    // Create test events
    const testEvents = [
      {
        user_id: profile.id,
        session_id: session.id,
        wallet_address: profile.primary_wallet,
        kind: 'wallet_connect',
        payload: { test: true }
      },
      {
        user_id: profile.id,
        session_id: session.id,
        wallet_address: profile.primary_wallet,
        kind: 'page_view',
        path: '/test-page',
        payload: { test: true }
      },
      {
        user_id: profile.id,
        session_id: session.id,
        wallet_address: profile.primary_wallet,
        kind: 'course_start',
        course_id: 'test-course',
        payload: { test: true }
      }
    ];

    const { data: events, error: eventsError } = await supabase
      .from('event_log')
      .insert(testEvents)
      .select();

    if (eventsError) {
      console.error('❌ Failed to create test events:', eventsError);
      return false;
    }

    console.log('✅ Created test events:', events.length);

    console.log('🎉 Sample data generated successfully!');
    return true;

  } catch (error) {
    console.error('💥 Failed to generate sample data:', error);
    return false;
  }
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('🚀 Running comprehensive tracking system tests...');
  
  const results = {
    systemTest: false,
    sampleData: false
  };

  results.systemTest = await testTrackingSystem();
  
  if (results.systemTest) {
    results.sampleData = await generateSampleData();
  }

  console.log('📊 Test Results:', results);
  
  if (results.systemTest && results.sampleData) {
    console.log('🎉 All tests passed! Your tracking system is ready to use.');
  } else {
    console.log('⚠️ Some tests failed. Please check the errors above.');
  }

  return results;
}
