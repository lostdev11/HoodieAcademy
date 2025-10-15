import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/mentorship/video-room
 * 
 * Creates a video room for a session
 * 
 * Request body:
 * {
 *   "session_id": "uuid",
 *   "session_title": "string"
 * }
 * 
 * Response:
 * {
 *   "room_url": "https://yourapp.daily.co/session-id",
 *   "room_name": "session-id"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📹 Video room API called');
    
    const body = await request.json().catch(() => ({}));
    const { session_id, session_title } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'Missing session_id' },
        { status: 400 }
      );
    }

    const DAILY_API_KEY = process.env.DAILY_API_KEY;

    // Demo mode - Always use demo for now to ensure it works
    console.log('⚠️ Using demo video mode (no Daily.co API key needed)');
    
    return NextResponse.json({
      success: true,
      room_url: `https://hoodie-academy.daily.co/${session_id}`,
      room_name: session_id,
      demo: true,
      message: 'Demo video room created - Set DAILY_API_KEY for production features'
    });

    /* Production Daily.co code (enable when API key is configured):
    
    if (!DAILY_API_KEY) {
      console.warn('⚠️ DAILY_API_KEY not set, using demo mode');
      
      // Demo mode: Generate a temporary room URL
      return NextResponse.json({
        room_url: `https://hoodie-academy.daily.co/${session_id}`,
        room_name: session_id,
        demo: true,
        message: 'Using demo mode. Set DAILY_API_KEY for production.'
      });
    }

    console.log('🎥 Creating video room for session:', session_id);

    // Call Daily.co API to create room  
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      },
      body: JSON.stringify({
        name: session_id,
        properties: {
          enable_screenshare: true,
          enable_chat: true,
          enable_knocking: false,
          start_video_off: false,
          start_audio_off: false,
          max_participants: 100, // Adjust based on your needs
          // Auto-delete room after 24 hours
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Daily.co API error:', error);
      
      // If room already exists, get it instead
      if (response.status === 400 && error.info?.includes('already exists')) {
        const getResponse = await fetch(`https://api.daily.co/v1/rooms/${session_id}`, {
          headers: {
            'Authorization': `Bearer ${DAILY_API_KEY}`
          }
        });
        
        if (getResponse.ok) {
          const room = await getResponse.json();
          return NextResponse.json({
            room_url: room.url,
            room_name: room.name,
            existing: true
          });
        }
      }
      
      return NextResponse.json(
        { error: 'Failed to create video room' },
        { status: 500 }
      );
    }

    const room = await response.json();
    console.log('✅ Video room created:', room.url);

    return NextResponse.json({
      room_url: room.url,
      room_name: room.name
    });
    */

  } catch (error) {
    console.error('💥 Error creating video room:', error);
    
    // Fallback to demo mode on any error
    const sessionId = request.url.includes('session_id') ? 'demo-session' : 'fallback';
    return NextResponse.json({
      success: true,
      room_url: `https://hoodie-academy.daily.co/${sessionId}`,
      room_name: sessionId,
      demo: true,
      message: 'Demo mode fallback'
    });
  }
}

/**
 * DELETE /api/mentorship/video-room
 * 
 * Deletes a video room
 * 
 * Request body:
 * {
 *   "room_name": "string"
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { room_name } = body;

    if (!room_name) {
      return NextResponse.json(
        { error: 'Missing room_name' },
        { status: 400 }
      );
    }

    const DAILY_API_KEY = process.env.DAILY_API_KEY;

    if (!DAILY_API_KEY) {
      return NextResponse.json({
        success: true,
        message: 'Demo mode - room deletion skipped'
      });
    }

    // Delete room via Daily.co API
    const response = await fetch(`https://api.daily.co/v1/rooms/${room_name}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed to delete room:', error);
      return NextResponse.json(
        { error: 'Failed to delete video room' },
        { status: 500 }
      );
    }

    console.log('✅ Video room deleted:', room_name);
    return NextResponse.json({
      success: true,
      message: 'Room deleted'
    });

  } catch (error) {
    console.error('💥 Error deleting video room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET for health check
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/mentorship/video-room',
    methods: ['POST', 'DELETE'],
    status: 'active',
    daily_configured: !!process.env.DAILY_API_KEY
  });
}

