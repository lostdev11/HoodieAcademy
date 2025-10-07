import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CreateSessionSchema = z.object({
  walletAddress: z.string().optional()
});

const EndSessionSchema = z.object({
  sessionId: z.string().uuid()
});

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const parsed = CreateSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: parsed.error.flatten() 
      }, { status: 400 });
    }

    const { walletAddress } = parsed.data;

    // Get user agent and IP
    const userAgent = req.headers.get('user-agent') ?? undefined;
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0]?.trim() || undefined;

    // Create new session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        wallet_address: walletAddress,
        user_agent: userAgent,
        ip: ip
      })
      .select('id')
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return NextResponse.json({ 
        error: 'Failed to create session' 
      }, { status: 500 });
    }

    // Update user's primary wallet if provided
    if (walletAddress) {
      const { error: walletError } = await supabase
        .from('users')
        .update({ 
          primary_wallet: walletAddress,
          last_active_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (walletError) {
        console.error('Error updating user wallet:', walletError);
      }

      // Also upsert wallet record
      const { error: upsertWalletError } = await supabase
        .from('wallets')
        .upsert({
          user_id: user.id,
          address: walletAddress,
          is_primary: true,
          connected_first_at: new Date().toISOString(),
          connected_last_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,address',
          ignoreDuplicates: false
        });

      if (upsertWalletError) {
        console.error('Error upserting wallet:', upsertWalletError);
      }
    }

    return NextResponse.json({ 
      sessionId: session.id 
    });
  } catch (error) {
    console.error('Error in session creation:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const parsed = EndSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: parsed.error.flatten() 
      }, { status: 400 });
    }

    const { sessionId } = parsed.data;

    // End the session
    const { error: sessionError } = await supabase
      .from('sessions')
      .update({ 
        ended_at: new Date().toISOString() 
      })
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (sessionError) {
      console.error('Error ending session:', sessionError);
      return NextResponse.json({ 
        error: 'Failed to end session' 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in session ending:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}