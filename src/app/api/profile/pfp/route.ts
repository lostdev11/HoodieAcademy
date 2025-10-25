import { NextRequest, NextResponse } from 'next/server';

// Simple auth helper
async function getUserFromAuth(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  return userId;
}

export async function POST(req: NextRequest) {
  try {
    console.log('API: Profile PFP update request received');
    
    const userId = await getUserFromAuth(req);
    if (!userId) {
      console.log('API: Unauthorized - no user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Log the raw request body for debugging
    const rawBody = await req.text();
    console.log('API: Raw request body:', rawBody);
    
    let body;
    try {
      body = JSON.parse(rawBody);
      console.log('API: Parsed JSON body:', body);
    } catch (parseError) {
      console.error('API: JSON parse error:', parseError);
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
      return NextResponse.json({ 
        error: 'Invalid JSON in request body',
        details: errorMessage,
        rawBody: rawBody.substring(0, 200) // First 200 chars for debugging
      }, { status: 400 });
    }

    const { owner, assetId, imageUrl } = body;
    console.log('API: Extracted data:', { owner, assetId, imageUrl });
    
    if (!owner || !assetId || !imageUrl) {
      console.log('API: Missing required fields');
      return NextResponse.json({ 
        error: 'Missing required fields',
        received: { owner: !!owner, assetId: !!assetId, imageUrl: !!imageUrl }
      }, { status: 400 });
    }

    // Save to Supabase database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('API: Supabase not configured, saving to localStorage only');
      return NextResponse.json({ 
        ok: true, 
        message: 'Profile picture saved locally (database not configured)',
        data: { userId, owner, assetId, imageUrl }
      });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Update user's profile picture in database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        profile_picture: imageUrl,
        pfp_asset_id: assetId,
        pfp_last_verified: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', owner);

    if (updateError) {
      console.error('API: Database update error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update profile picture in database',
        details: updateError.message
      }, { status: 500 });
    }

    console.log('API: Profile picture updated successfully in database');
    return NextResponse.json({ 
      ok: true, 
      message: 'Profile picture updated successfully',
      data: { userId, owner, assetId, imageUrl }
    });
    
  } catch (e: any) {
    console.error('API: Error in profile PFP update:', e);
    return NextResponse.json({ 
      error: e.message || 'Internal server error' 
    }, { status: 500 });
  }
}
