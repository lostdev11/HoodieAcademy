import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('wallet');
  const dataType = searchParams.get('type') || 'all';

  if (!walletAddress) {
    return new Response('Missing wallet address', { status: 400 });
  }

  // Verify admin access
  const { data: adminUser, error: adminError } = await supabase
    .from('users')
    .select('is_admin')
    .eq('wallet_address', walletAddress)
    .single();

  if (adminError || !adminUser?.is_admin) {
    return new Response('Unauthorized', { status: 403 });
  }

  // Set up Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendData = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      const sendHeartbeat = () => {
        sendData({ type: 'heartbeat', timestamp: new Date().toISOString() });
      };

      // Send initial data
      const sendInitialData = async () => {
        try {
          let data: any = { type: 'initial' };

          if (dataType === 'all' || dataType === 'users') {
            const { data: users } = await supabase
              .from('users')
              .select('*')
              .order('total_xp', { ascending: false });

            data.users = users || [];
          }

          if (dataType === 'all' || dataType === 'submissions') {
            const { data: submissions } = await supabase
              .from('bounty_submissions')
              .select('*')
              .order('created_at', { ascending: false });

            data.submissions = submissions || [];
          }

          if (dataType === 'all' || dataType === 'bounties') {
            const { data: bounties } = await supabase
              .from('bounties')
              .select('*')
              .order('created_at', { ascending: false });

            data.bounties = bounties || [];
          }

          sendData(data);
        } catch (error) {
          console.error('Error sending initial data:', error);
          sendData({ type: 'error', message: 'Failed to fetch initial data' });
        }
      };

      // Send heartbeat every 30 seconds
      const heartbeatInterval = setInterval(sendHeartbeat, 30000);

      // Send initial data
      sendInitialData();

      // Set up database change listeners
      const setupListeners = () => {
        if (dataType === 'all' || dataType === 'users') {
          supabase
            .channel('users_changes')
            .on('postgres_changes', 
              { event: '*', schema: 'public', table: 'users' },
              (payload) => {
                sendData({ type: 'user_change', payload });
              }
            )
            .subscribe();
        }

        if (dataType === 'all' || dataType === 'submissions') {
          supabase
            .channel('submissions_changes')
            .on('postgres_changes',
              { event: '*', schema: 'public', table: 'bounty_submissions' },
              (payload) => {
                sendData({ type: 'submission_change', payload });
              }
            )
            .subscribe();
        }

        if (dataType === 'all' || dataType === 'bounties') {
          supabase
            .channel('bounties_changes')
            .on('postgres_changes',
              { event: '*', schema: 'public', table: 'bounties' },
              (payload) => {
                sendData({ type: 'bounty_change', payload });
              }
            )
            .subscribe();
        }
      };

      setupListeners();

      // Cleanup function
      const cleanup = () => {
        clearInterval(heartbeatInterval);
        supabase.removeAllChannels();
        controller.close();
      };

      // Handle client disconnect
      request.signal.addEventListener('abort', cleanup);

      // Keep connection alive
      const keepAlive = setInterval(() => {
        if (request.signal.aborted) {
          cleanup();
        }
      }, 1000);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
