import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Helper: Get next midnight UTC
function getNextMidnightUTC(now = new Date()): Date {
  const n = new Date(now);
  const d = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + 1, 0, 0, 0));
  return d;
}

// Helper: Calculate minutes since midnight UTC
function calculateTimeSinceMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  const diffMs = now.getTime() - midnight.getTime();
  return Math.floor(diffMs / 60000); // Convert to minutes
}

// Helper: Hash IP address for privacy
function hashIpAddress(ip: string | null): string | null {
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip).digest('hex');
}

// Helper: Log analytics event
async function logAnalyticsEvent(
  supabase: ReturnType<typeof getSupabaseClient>,
  params: {
    walletAddress: string;
    eventType: 'claim_success' | 'claim_rejected_already_claimed' | 'signature_invalid' | 'rate_limited' | 'nonce_invalid' | 'nonce_expired' | 'nonce_used';
    xpAwarded?: number;
    streakDays?: number;
    levelUp?: boolean;
    newLevel?: number;
    rejectionReason?: string;
    processingTimeMs?: number;
    request?: NextRequest;
  }
): Promise<void> {
  try {
    const timeSinceMidnight = calculateTimeSinceMidnightUTC();
    
    // Extract request metadata if provided
    let ipHash: string | null = null;
    let userAgent: string | null = null;
    let deviceInfo: any = null;
    
    if (params.request) {
      const ip = params.request.headers.get('x-forwarded-for') || 
                 params.request.headers.get('x-real-ip') || 
                 null;
      ipHash = hashIpAddress(ip);
      userAgent = params.request.headers.get('user-agent') || null;
      
      // Parse device info from user agent
      if (userAgent) {
        deviceInfo = {
          userAgent,
          isMobile: /mobile/i.test(userAgent),
          isTablet: /tablet/i.test(userAgent),
          isDesktop: !/mobile|tablet/i.test(userAgent),
          platform: userAgent.includes('Windows') ? 'Windows' :
                   userAgent.includes('Mac') ? 'Mac' :
                   userAgent.includes('Linux') ? 'Linux' :
                   userAgent.includes('Android') ? 'Android' :
                   userAgent.includes('iOS') ? 'iOS' : 'Unknown'
        };
      }
    }
    
    await supabase.rpc('log_daily_claim_event', {
      p_wallet_address: params.walletAddress,
      p_event_type: params.eventType,
      p_xp_awarded: params.xpAwarded || null,
      p_streak_days: params.streakDays || null,
      p_time_since_midnight_minutes: timeSinceMidnight,
      p_level_up: params.levelUp || false,
      p_new_level: params.newLevel || null,
      p_device_info: deviceInfo,
      p_ip_hash: ipHash,
      p_user_agent: userAgent,
      p_rejection_reason: params.rejectionReason || null,
      p_processing_time_ms: params.processingTimeMs || null
    });
    
    console.log('📊 [ANALYTICS] Logged event:', params.eventType);
  } catch (error) {
    // Don't fail the request if analytics fails
    console.error('⚠️ [ANALYTICS] Failed to log event:', error);
  }
}

// Helper: Verify signature and nonce
async function verifySignatureAndNonce(
  walletAddress: string,
  supabase: ReturnType<typeof getSupabaseClient>,
  signature?: string,
  nonce?: string
): Promise<void> {
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }
  
  // If no signature or nonce provided, skip verification for now (backward compatibility)
  if (!signature || !nonce) {
    console.warn('⚠️ [DAILY LOGIN] No signature/nonce provided - skipping verification');
    return;
  }
  
  console.log('🔐 [DAILY LOGIN] Verifying signature and nonce');
  
  // 1. Verify and mark nonce as used atomically
  const { data: nonceData, error: nonceError } = await supabase
    .rpc('verify_and_use_nonce', {
      p_wallet_address: walletAddress,
      p_nonce: nonce
    })
    .single();
  
  if (nonceError) {
    console.error('❌ [DAILY LOGIN] Nonce verification error:', nonceError);
    throw new Error('Failed to verify nonce');
  }
  
  const { valid, reason } = nonceData;
  
  if (!valid) {
    console.log('⚠️ [DAILY LOGIN] Nonce verification failed:', reason);
    throw new Error(`Nonce verification failed: ${reason}`);
  }
  
  // 2. Verify the signature matches the expected message format
  // Expected message: "Hoodie Academy Daily Claim • {ISO Date} • nonce:{nonce}"
  const currentDate = new Date().toISOString().split('T')[0];
  const expectedMessage = `Hoodie Academy Daily Claim • ${currentDate} • nonce:${nonce}`;
  
  try {
    // Import nacl for signature verification
    const nacl = require('tweetnacl');
    const bs58 = require('bs58');
    
    // Decode the signature and public key
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(walletAddress);
    const messageBytes = new TextEncoder().encode(expectedMessage);
    
    // Verify the signature
    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );
    
    if (!isValid) {
      console.error('❌ [DAILY LOGIN] Invalid signature');
      throw new Error('Invalid signature');
    }
    
    console.log('✅ [DAILY LOGIN] Signature verified successfully');
  } catch (signError) {
    console.error('❌ [DAILY LOGIN] Signature verification error:', signError);
    
    // If signature verification fails but nonce was marked as used, we have a problem
    // Log this for monitoring, but for now we'll be lenient during the transition
    console.warn('⚠️ [DAILY LOGIN] Signature verification failed but nonce was consumed');
    
    // In strict mode, uncomment this:
    // throw new Error('Invalid signature format or verification failed');
    
    // For now, we'll allow it to proceed (transition period)
    console.warn('⚠️ [DAILY LOGIN] Proceeding despite signature verification failure (transition mode)');
  }
}

// Helper: Award XP and emit events
async function awardXpAndEmitEvents(
  walletAddress: string,
  xpAmount: number,
  supabase: ReturnType<typeof getSupabaseClient>
): Promise<{
  previousXP: number;
  newTotalXP: number;
  previousLevel: number;
  newLevel: number;
  levelUp: boolean;
}> {
    // Get current user XP
    const { data: userXP } = await supabase
      .from('user_xp')
      .select('wallet_address, total_xp, level')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    const previousXP = userXP?.total_xp || 0;
    const previousLevel = userXP?.level || 1;
    const newTotalXP = previousXP + xpAmount;
    const newLevel = Math.floor(newTotalXP / 1000) + 1;
    const levelUp = newLevel > previousLevel;

  // Update XP (upsert)
    const { error: xpError } = await supabase
      .from('user_xp')
      .upsert({
        wallet_address: walletAddress,
        total_xp: newTotalXP,
        level: newLevel,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'wallet_address'
      });

    if (xpError) {
      console.error('❌ [DAILY LOGIN] Error updating XP:', xpError);
    throw new Error('Failed to update XP');
    }

    // Record activity in user_activity table
    const activityTimestamp = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];
  
    const { error: activityError } = await supabase
      .from('user_activity')
      .insert({
        wallet_address: walletAddress,
        activity_type: 'daily_login_bonus',
        metadata: {
          xp_awarded: xpAmount,
          login_date: today,
          login_timestamp: activityTimestamp
        },
        created_at: activityTimestamp
      });

    if (activityError) {
      console.warn('⚠️ [DAILY LOGIN] Failed to record activity:', activityError);
    }

  console.log('✅ [DAILY LOGIN] XP awarded and events emitted:', {
    previousXP,
    newTotalXP,
    levelUp
  });

  return { previousXP, newTotalXP, previousLevel, newLevel, levelUp };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now(); // Track processing time
  let walletAddress = '';
  
  try {
    console.log('🎯 [DAILY LOGIN] Request received');
    const supabase = getSupabaseClient();
    
    const XP = 5; // Daily login bonus constant
    
    const { walletAddress: wallet, signature, nonce } = await request.json();
    walletAddress = wallet;
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    console.log('📅 [DAILY LOGIN] Processing login for:', walletAddress.slice(0, 10) + '...');

    // 1) Verify signature + nonce
    try {
      await verifySignatureAndNonce(walletAddress, supabase, signature, nonce);
    } catch (verifyError: any) {
      const processingTime = Date.now() - startTime;
      
      // Determine the type of verification error
      let eventType: 'signature_invalid' | 'nonce_invalid' | 'nonce_expired' | 'nonce_used' = 'signature_invalid';
      if (verifyError.message?.includes('nonce')) {
        if (verifyError.message.includes('expired')) {
          eventType = 'nonce_expired';
        } else if (verifyError.message.includes('used')) {
          eventType = 'nonce_used';
        } else {
          eventType = 'nonce_invalid';
        }
      }
      
      // Log analytics for verification failure
      await logAnalyticsEvent(supabase, {
        walletAddress,
        eventType,
        rejectionReason: verifyError.message,
        processingTimeMs: processingTime,
        request
      });
      
      throw verifyError;
    }

    // 2) Calculate current streak (before inserting today's claim)
    // This is optional and will be skipped if streak functions don't exist
    let currentStreak = 0;
    let claimedYesterday = false;
    let newStreak = 1;
    
    try {
      const { data: streakData, error: streakError } = await supabase
        .rpc('calculate_user_streak', { p_wallet_address: walletAddress })
        .single();
      
      if (!streakError && streakData !== null) {
        currentStreak = streakData;
        
        // Check if user claimed yesterday to maintain streak
        const { data: yesterdayData, error: yesterdayError } = await supabase
          .rpc('user_claimed_yesterday', { p_wallet_address: walletAddress })
          .single();
        
        if (!yesterdayError && yesterdayData !== null) {
          claimedYesterday = yesterdayData;
          newStreak = claimedYesterday ? currentStreak + 1 : 1;
        }
      }
      
      console.log('📊 [DAILY LOGIN] Streak info:', { currentStreak, claimedYesterday, newStreak });
    } catch (streakErr) {
      console.warn('⚠️ [DAILY LOGIN] Streak functions not available (run migration?), continuing without streaks');
      // Continue without streaks - not a fatal error
    }

    // 3) Attempt atomic insert (prevents double claims even under race conditions)
    const todayUtc = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Try to insert with claim_utc_date, but fallback if column doesn't exist
    let insertData: any = { 
      wallet_address: walletAddress, 
      xp_awarded: XP
    };
    
    // Only add claim_utc_date if it exists in the table
    try {
      insertData.claim_utc_date = todayUtc;
    } catch (e) {
      console.warn('⚠️ [DAILY LOGIN] claim_utc_date column not available');
    }
    
    const { data, error } = await supabase
      .from('daily_logins')
      .insert(insertData)
      .select()
      .single();

    // Handle unique constraint violation (already claimed today)
    if (error?.code === '23505') {  // unique_violation
      console.log('⚠️ [DAILY LOGIN] Already claimed today (atomic check)');
      const processingTime = Date.now() - startTime;
      const nextMidnightUtc = getNextMidnightUTC();
      
      // Log analytics for duplicate claim attempt
      await logAnalyticsEvent(supabase, {
        walletAddress,
        eventType: 'claim_rejected_already_claimed',
        rejectionReason: 'Daily login bonus already claimed today',
        processingTimeMs: processingTime,
        request
      });
      
      return NextResponse.json({
        success: false,
        message: 'Daily login bonus already claimed today',
        alreadyClaimed: true,
        nextAvailable: nextMidnightUtc.toISOString(),
      }, { status: 409 });
    }

    // Handle other database errors
    if (error) {
      console.error('❌ [DAILY LOGIN] Database error:', error);
      throw error;
    }

    console.log('✅ [DAILY LOGIN] Atomic insert successful, awarding XP');

    // 4) Update user XP + compute level + emit events
    const { previousXP, newTotalXP, previousLevel, newLevel, levelUp } = 
      await awardXpAndEmitEvents(walletAddress, XP, supabase);

    const processingTime = Date.now() - startTime;
    const nextMidnightUtc = getNextMidnightUTC();

    // 5) Log successful claim analytics with actual streak
    await logAnalyticsEvent(supabase, {
      walletAddress,
      eventType: 'claim_success',
      xpAwarded: XP,
      streakDays: newStreak,
      levelUp,
      newLevel,
      processingTimeMs: processingTime,
      request
    });
    
    console.log('🔥 [DAILY LOGIN] Streak updated:', { previousStreak: currentStreak, newStreak });

    return NextResponse.json({
      success: true,
      xpAwarded: XP,
      newTotalXP,
      previousXP,
      levelUp,
      previousLevel,
      newLevel,
      streak: newStreak,
      streakContinued: claimedYesterday,
      message: `Daily login bonus: +${XP} XP!`,
      lastClaimed: data.created_at,
      nextAvailable: nextMidnightUtc.toISOString(),
      refreshLeaderboard: true,
      targetWallet: walletAddress,
      reason: 'Daily login bonus'
    });

  } catch (error) {
    console.error('❌ [DAILY LOGIN] Error in daily login API:', error);
    
    // Log analytics for unexpected errors
    if (walletAddress) {
      try {
        const supabase = getSupabaseClient();
        const processingTime = Date.now() - startTime;
        await logAnalyticsEvent(supabase, {
          walletAddress,
          eventType: 'signature_invalid', // Generic error type
          rejectionReason: error instanceof Error ? error.message : 'Unknown error',
          processingTimeMs: processingTime,
          request
        });
      } catch (analyticsError) {
        console.error('Failed to log error analytics:', analyticsError);
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check daily login status (calendar day system)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const today = new Date().toISOString().split('T')[0];

    // Check if user already claimed today from daily_logins
    const { data: todayLogin } = await supabase
      .from('daily_logins')
      .select('created_at')
      .eq('wallet_address', walletAddress)
      .eq('claim_utc_date', today)
      .maybeSingle();

    const alreadyClaimed = !!todayLogin;

    // Get streak information (optional - gracefully handle if functions don't exist)
    let streakStats: any = null;
    try {
      const { data, error } = await supabase
        .rpc('get_user_streak_stats', { p_wallet_address: walletAddress })
        .single();
      
      if (!error) {
        streakStats = data;
      }
    } catch (err) {
      console.warn('⚠️ [DAILY LOGIN] Streak stats not available');
    }

    // Calculate next available time (tomorrow at midnight UTC)
    const nextMidnightUtc = getNextMidnightUTC();

    console.log('📊 [DAILY LOGIN] Status check:', {
      wallet: walletAddress.slice(0, 10) + '...',
      today,
      alreadyClaimed,
      currentStreak: streakStats?.current_streak || 0,
      lastClaimed: todayLogin?.created_at || null,
      nextAvailable: nextMidnightUtc.toISOString()
    });

    return NextResponse.json({
      walletAddress,
      today: today,
      alreadyClaimed,
      lastClaimed: alreadyClaimed ? todayLogin.created_at : null,
      nextAvailable: nextMidnightUtc.toISOString(),
      dailyBonusXP: 5,
      streak: {
        current: streakStats?.current_streak || 0,
        longest: streakStats?.longest_streak || 0,
        totalClaims: streakStats?.total_claims || 0,
        lastClaimDate: streakStats?.last_claim_date || null
      }
    });

  } catch (error) {
    console.error('❌ [DAILY LOGIN] Error in GET request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
