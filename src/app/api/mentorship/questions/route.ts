import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/mentorship/questions
 * 
 * Submit a question for a session
 * 
 * Request body:
 * {
 *   "session_id": "uuid",
 *   "wallet_address": "string",
 *   "question": "string",
 *   "category": "string" (optional),
 *   "is_anonymous": boolean (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      session_id,
      wallet_address,
      question,
      category,
      is_anonymous = false
    } = body;

    if (!session_id || !wallet_address || !question) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id, wallet_address, question' },
        { status: 400 }
      );
    }

    console.log('❓ Submitting question for session:', session_id);

    // Call database function
    const { data, error } = await supabase
      .rpc('submit_session_question', {
        p_session_id: session_id,
        p_wallet_address: wallet_address,
        p_question: question,
        p_category: category,
        p_is_anonymous: is_anonymous
      });

    if (error) {
      console.error('❌ Error submitting question:', error);
      return NextResponse.json(
        { error: 'Failed to submit question' },
        { status: 500 }
      );
    }

    console.log('✅ Question submitted:', data);
    return NextResponse.json({
      success: true,
      question_id: data
    }, { status: 201 });

  } catch (error) {
    console.error('💥 Error in questions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mentorship/questions
 * 
 * Get questions for a session
 * 
 * Query params:
 * - session_id: uuid (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');

    if (!session_id) {
      return NextResponse.json(
        { error: 'Missing session_id parameter' },
        { status: 400 }
      );
    }

    console.log('📋 Fetching questions for session:', session_id);

    const { data, error } = await supabase
      .from('session_questions')
      .select('*')
      .eq('session_id', session_id)
      .eq('is_approved', true)
      .order('upvotes', { ascending: false })
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching questions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }

    console.log('✅ Found questions:', data?.length || 0);
    return NextResponse.json({ questions: data || [] });

  } catch (error) {
    console.error('💥 Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

