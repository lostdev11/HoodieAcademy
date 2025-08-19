import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Only create client if environment variables are available
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Use service role key for server-side operations that need write access
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration is missing');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    let supabase;
    try {
      supabase = createSupabaseClient();
    } catch (error) {
      console.error('Error creating Supabase client:', error);
      return NextResponse.json(
        { error: 'Database connection failed', details: error },
        { status: 500 }
      );
    }

    // Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['retailstar_rewards', 'user_retailstar_rewards']);

    if (tablesError) {
      console.error('Error checking tables:', tablesError);
    }

    // Get available rewards
    const { data: rewards, error: rewardsError } = await supabase
      .from('retailstar_rewards')
      .select('*');

    if (rewardsError) {
      console.error('Error getting rewards:', rewardsError);
    }

    // Check if functions exist
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .in('routine_name', ['award_retailstar_reward', 'get_user_available_rewards']);

    if (functionsError) {
      console.error('Error checking functions:', functionsError);
    }

    return NextResponse.json({
      success: true,
      debug: {
        tables: tables || [],
        rewards: rewards || [],
        functions: functions || [],
        errors: {
          tables: tablesError?.message,
          rewards: rewardsError?.message,
          functions: functionsError?.message
        }
      }
    });

  } catch (error) {
    console.error('Error in debug API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
