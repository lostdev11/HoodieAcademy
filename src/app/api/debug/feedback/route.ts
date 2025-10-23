import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Checking feedback database...');
    
    // Check if table exists and get basic info
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_feedback_submissions')
      .select('*', { count: 'exact', head: true });
    
    if (tableError) {
      console.error('❌ [DEBUG] Table error:', tableError);
      return NextResponse.json({
        success: false,
        error: 'Table access error',
        details: tableError.message
      }, { status: 500 });
    }
    
    // Get all feedback submissions
    const { data: allFeedback, error: fetchError } = await supabase
      .from('user_feedback_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ [DEBUG] Fetch error:', fetchError);
      return NextResponse.json({
        success: false,
        error: 'Fetch error',
        details: fetchError.message
      }, { status: 500 });
    }
    
    // Count by status
    const statusCounts = allFeedback?.reduce((acc, feedback) => {
      acc[feedback.status] = (acc[feedback.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    // Get recent submissions (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const recentFeedback = allFeedback?.filter(feedback => 
      new Date(feedback.created_at) > oneDayAgo
    ) || [];
    
    console.log('✅ [DEBUG] Database check complete:', {
      totalCount: allFeedback?.length || 0,
      statusCounts,
      recentCount: recentFeedback.length
    });
    
    return NextResponse.json({
      success: true,
      data: {
        totalCount: allFeedback?.length || 0,
        statusCounts,
        recentCount: recentFeedback.length,
        recentFeedback: recentFeedback.slice(0, 5), // Last 5 recent submissions
        allFeedback: allFeedback?.slice(0, 10) // Last 10 total submissions
      }
    });
    
  } catch (error) {
    console.error('💥 [DEBUG] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
