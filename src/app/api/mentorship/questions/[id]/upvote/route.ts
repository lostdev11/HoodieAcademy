import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/mentorship/questions/[id]/upvote
 * 
 * Upvote a question
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log('👍 Upvoting question:', id);

    // Call database function
    const { data, error } = await supabase
      .rpc('upvote_question', {
        p_question_id: id
      });

    if (error) {
      console.error('❌ Error upvoting question:', error);
      return NextResponse.json(
        { error: 'Failed to upvote question' },
        { status: 500 }
      );
    }

    console.log('✅ Question upvoted, new count:', data);
    return NextResponse.json({
      success: true,
      upvotes: data
    });

  } catch (error) {
    console.error('💥 Error upvoting question:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

