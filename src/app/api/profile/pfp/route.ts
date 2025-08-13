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
      return NextResponse.json({ 
        error: 'Invalid JSON in request body',
        details: parseError.message,
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

    // For now, just log the data and return success
    // We'll add Supabase integration later
    console.log('API: Would update profile for user:', userId, {
      pfp_url: imageUrl,
      pfp_asset_id: assetId,
      pfp_last_verified: new Date().toISOString()
    });

    console.log('API: Profile update logged successfully (Supabase not configured yet)');
    return NextResponse.json({ 
      ok: true, 
      message: 'Profile picture update logged successfully (database not configured yet)',
      data: { userId, owner, assetId, imageUrl }
    });
    
  } catch (e: any) {
    console.error('API: Error in profile PFP update:', e);
    return NextResponse.json({ 
      error: e.message || 'Internal server error' 
    }, { status: 500 });
  }
}
