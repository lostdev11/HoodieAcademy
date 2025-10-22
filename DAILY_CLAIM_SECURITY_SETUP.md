# 🔐 Daily Claim Security & Analytics System

Complete implementation guide for the secure daily login bonus system with replay protection, analytics, and admin dashboard.

## 📋 Table of Contents

- [Overview](#overview)
- [Database Setup](#database-setup)
- [Authentication & Security](#authentication--security)
- [Analytics System](#analytics-system)
- [Admin Dashboard](#admin-dashboard)
- [Client Integration](#client-integration)
- [JWT Wallet Claims Setup](#jwt-wallet-claims-setup)
- [Testing & Verification](#testing--verification)

---

## 🎯 Overview

This system provides:

1. **Atomic Daily Claim Protection** - Prevents double claims using database constraints
2. **Replay Attack Prevention** - One-time nonces with signature verification
3. **Comprehensive Analytics** - Track all claim attempts for economy tuning
4. **Admin Dashboard** - Real-time analytics and monitoring
5. **Performance Tracking** - Processing time and system health metrics

### Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Client    │─────▶│  Nonce API   │      │   Database  │
│  (Phantom)  │      │ /auth/nonce  │      │   Tables    │
└─────────────┘      └──────────────┘      └─────────────┘
       │                                           │
       │ Sign message                              │
       ▼                                           │
┌─────────────┐      ┌──────────────┐            │
│  Signature  │─────▶│ Daily Login  │────────────┤
│             │      │   API Route  │            │
└─────────────┘      └──────────────┘            │
                            │                     │
                            ▼                     │
                     ┌──────────────┐            │
                     │  Analytics   │────────────┘
                     │   Logging    │
                     └──────────────┘
```

---

## 🗄️ Database Setup

### 1. Run Database Migrations

Execute these SQL files in order:

```bash
# 1. Create auth_nonces table for replay protection
psql -d your_database -f setup-auth-nonces-table.sql

# 2. Create analytics tables and functions
psql -d your_database -f setup-daily-claim-analytics.sql
```

### 2. Required Tables

#### `auth_nonces`
```sql
- id (BIGSERIAL)
- wallet_address (TEXT)
- nonce (TEXT, UNIQUE)
- expires_at (TIMESTAMPTZ)
- used_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
```

#### `daily_logins`
```sql
- id (BIGSERIAL)
- wallet_address (TEXT)
- created_at (TIMESTAMPTZ)
- xp_awarded (INTEGER)
UNIQUE(wallet_address, DATE(created_at))
```

#### `daily_claim_analytics`
```sql
- id (BIGSERIAL)
- wallet_address (TEXT)
- event_type (TEXT)
- timestamp (TIMESTAMPTZ)
- xp_awarded (INTEGER)
- streak_days (INTEGER)
- time_since_midnight_minutes (INTEGER)
- level_up (BOOLEAN)
- new_level (INTEGER)
- device_info (JSONB)
- ip_hash (TEXT)
- user_agent (TEXT)
- rejection_reason (TEXT)
- processing_time_ms (INTEGER)
```

### 3. Database Functions

The SQL migrations create these functions:

**Auth Nonces:**
- `generate_auth_nonce(p_wallet_address)` - Create new nonce
- `verify_and_use_nonce(p_wallet_address, p_nonce)` - Atomic nonce verification
- `cleanup_expired_nonces()` - Remove old nonces

**Analytics:**
- `log_daily_claim_event(...)` - Log claim events
- `get_daily_claim_stats_today()` - Today's overview
- `get_claim_event_breakdown_today()` - Event type breakdown
- `get_top_squads_by_claims_today(p_limit)` - Top performing squads
- `get_time_to_claim_distribution_today()` - Hourly distribution
- `get_streak_distribution_today()` - Streak histogram
- `get_daily_claim_trend(p_days)` - Historical trend

---

## 🔐 Authentication & Security

### Signature Verification Flow

1. **Client requests nonce:**
```typescript
const response = await fetch(`/api/auth/nonce?wallet=${walletAddress}`);
const { nonce, signatureMessage } = await response.json();
// signatureMessage: "Hoodie Academy Daily Claim • 2025-10-22 • nonce:abc123"
```

2. **User signs the message:**
```typescript
const encodedMessage = new TextEncoder().encode(signatureMessage);
const signature = await window.solana.signMessage(encodedMessage, 'utf8');
```

3. **Submit claim with signature:**
```typescript
const response = await fetch('/api/xp/daily-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress,
    signature: bs58.encode(signature.signature),
    nonce
  })
});
```

### Security Features

#### 1. Atomic Insert Protection
```typescript
// This prevents race conditions even if multiple requests arrive simultaneously
const { data, error } = await supabase
  .from('daily_logins')
  .insert({ wallet_address: walletAddress, xp_awarded: XP })
  .select()
  .single();

if (error?.code === '23505') {  // unique_violation
  // Already claimed today
}
```

#### 2. One-Time Nonce
- Nonces expire after 5 minutes
- Each nonce can only be used once
- Database-level UNIQUE constraint
- Row-level locking prevents race conditions

#### 3. Signature Verification
```typescript
// Server verifies the signature matches the wallet
const isValid = nacl.sign.detached.verify(
  messageBytes,
  signatureBytes,
  publicKeyBytes
);
```

#### 4. IP Hashing
```typescript
// Privacy-preserving analytics
const ipHash = crypto.createHash('sha256')
  .update(ipAddress)
  .digest('hex');
```

### Required Dependencies

```bash
npm install tweetnacl bs58
# or
yarn add tweetnacl bs58
```

---

## 📊 Analytics System

### Events Tracked

1. **claim_success** - Successful claim
2. **claim_rejected_already_claimed** - Duplicate attempt
3. **signature_invalid** - Invalid signature
4. **nonce_invalid** - Invalid nonce
5. **nonce_expired** - Expired nonce
6. **nonce_used** - Nonce already used
7. **rate_limited** - Rate limit exceeded (future)

### Metrics Collected

- **User Behavior:**
  - Time since midnight UTC (when users claim)
  - Streak days
  - Device type (mobile/tablet/desktop)
  - Platform (Windows/Mac/Linux/Android/iOS)

- **Performance:**
  - Processing time (milliseconds)
  - Success/failure rates
  - Error types and frequencies

- **Economy:**
  - XP awarded per claim
  - Level-up frequency
  - Squad participation

### Analytics API Endpoints

#### 1. Overview Statistics
```bash
GET /api/admin/daily-claim-analytics?type=overview
```

Returns:
```json
{
  "totalClaims": 150,
  "uniqueClaimers": 142,
  "successfulClaims": 145,
  "rejectedClaims": 5,
  "avgTimeToClaimMinutes": 247,
  "medianTimeToClaimMinutes": 180,
  "totalXpAwarded": 725,
  "avgProcessingTimeMs": 145
}
```

#### 2. Event Breakdown
```bash
GET /api/admin/daily-claim-analytics?type=breakdown
```

#### 3. Top Squads
```bash
GET /api/admin/daily-claim-analytics?type=squads&limit=10
```

#### 4. Time Distribution
```bash
GET /api/admin/daily-claim-analytics?type=time-distribution
```

#### 5. Streak Distribution
```bash
GET /api/admin/daily-claim-analytics?type=streak-distribution
```

#### 6. Historical Trend
```bash
GET /api/admin/daily-claim-analytics?type=trend&days=7
```

---

## 🎛️ Admin Dashboard

### Integration

Add the analytics card to your admin dashboard:

```tsx
import DailyClaimAnalyticsCard from '@/components/admin/DailyClaimAnalyticsCard';

export default function AdminDashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DailyClaimAnalyticsCard />
      {/* Other admin components */}
    </div>
  );
}
```

### Features

- **Real-time Updates** - Auto-refreshes every 30 seconds
- **Three Tabs:**
  - Overview: Key metrics and statistics
  - Breakdown: Event types and percentages
  - Top Squads: Best performing squads
- **Responsive Design** - Works on all screen sizes
- **Error Handling** - Graceful fallbacks and retry

---

## 💻 Client Integration

### Example: Daily Login Button Component

```tsx
'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';

export default function DailyLoginButton() {
  const { publicKey, signMessage } = useWallet();
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState('');

  const handleClaim = async () => {
    if (!publicKey || !signMessage) return;
    
    setClaiming(true);
    setMessage('');

    try {
      // 1. Get nonce
      const nonceRes = await fetch(`/api/auth/nonce?wallet=${publicKey.toBase58()}`);
      const { nonce, signatureMessage } = await nonceRes.json();

      // 2. Sign message
      const encodedMessage = new TextEncoder().encode(signatureMessage);
      const signatureResult = await signMessage(encodedMessage);
      const signature = bs58.encode(signatureResult);

      // 3. Submit claim
      const claimRes = await fetch('/api/xp/daily-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          signature,
          nonce
        })
      });

      const result = await claimRes.json();

      if (result.success) {
        setMessage(`✅ Claimed ${result.xpAwarded} XP!`);
        if (result.levelUp) {
          setMessage(`🎉 Level up! You're now level ${result.newLevel}!`);
        }
      } else {
        setMessage(`⚠️ ${result.message}`);
      }

    } catch (error) {
      console.error('Claim error:', error);
      setMessage('❌ Failed to claim. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClaim}
        disabled={!publicKey || claiming}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-bold"
      >
        {claiming ? 'Claiming...' : 'Claim Daily Bonus'}
      </button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
}
```

---

## 🔑 JWT Wallet Claims Setup

### Overview

To ensure proper authentication in production, you should set up JWT tokens with wallet claims. This allows Supabase Row Level Security (RLS) to enforce policies based on the authenticated wallet.

### 1. Custom Auth Edge Function

Create a Supabase Edge Function for wallet authentication:

```typescript
// supabase/functions/auth-wallet/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nacl from 'https://esm.sh/tweetnacl@1.0.3'
import { decode as decodeBase58 } from 'https://deno.land/x/base58@v0.2.0/mod.ts'

serve(async (req) => {
  try {
    const { walletAddress, signature, message } = await req.json()
    
    // Verify signature
    const messageBytes = new TextEncoder().encode(message)
    const signatureBytes = decodeBase58(signature)
    const publicKeyBytes = decodeBase58(walletAddress)
    
    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    )
    
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401 }
      )
    }
    
    // Create JWT with wallet claim
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('wallet_address, is_admin')
      .eq('wallet_address', walletAddress)
      .single()
    
    // Generate JWT
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `${walletAddress}@wallet.local`,
      options: {
        data: {
          wallet_address: walletAddress,
          is_admin: user?.is_admin || false
        }
      }
    })
    
    if (error) throw error
    
    return new Response(
      JSON.stringify({ 
        access_token: data.properties.access_token,
        wallet_address: walletAddress
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})
```

### 2. Client-Side JWT Management

```typescript
// lib/wallet-auth.ts

export async function authenticateWallet(
  walletAddress: string,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
) {
  // 1. Generate authentication message
  const authMessage = `Sign in to Hoodie Academy\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`
  const messageBytes = new TextEncoder().encode(authMessage)
  
  // 2. Sign message
  const signature = await signMessage(messageBytes)
  const signatureBase58 = bs58.encode(signature)
  
  // 3. Exchange for JWT
  const response = await fetch('/api/auth/wallet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress,
      signature: signatureBase58,
      message: authMessage
    })
  })
  
  const { access_token } = await response.json()
  
  // 4. Store JWT
  localStorage.setItem('supabase_token', access_token)
  
  return access_token
}
```

### 3. Supabase Client with JWT

```typescript
// lib/supabase-client.ts

import { createClient } from '@supabase/supabase-js'

export function getAuthenticatedSupabaseClient() {
  const token = localStorage.getItem('supabase_token')
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  )
}
```

### 4. Row Level Security Policies

```sql
-- Enable RLS on daily_logins table
ALTER TABLE daily_logins ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only insert their own claims
CREATE POLICY "Users can claim their own daily bonus"
  ON daily_logins
  FOR INSERT
  WITH CHECK (
    wallet_address = auth.jwt()->>'wallet_address'
  );

-- Policy: Users can only view their own claims
CREATE POLICY "Users can view their own claims"
  ON daily_logins
  FOR SELECT
  USING (
    wallet_address = auth.jwt()->>'wallet_address'
  );

-- Admin bypass
CREATE POLICY "Admins can view all claims"
  ON daily_logins
  FOR SELECT
  USING (
    (auth.jwt()->>'is_admin')::boolean = true
  );
```

### 5. API Route with JWT Verification

```typescript
// app/api/xp/daily-login/route.ts (with JWT)

import { createServerSupabaseClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient() // Uses JWT from request
  
  // Verify JWT and extract wallet claim
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  const walletAddress = user.user_metadata.wallet_address
  
  // Rest of the claim logic...
}
```

---

## ✅ Testing & Verification

### 1. Test Nonce Generation

```bash
curl "http://localhost:3000/api/auth/nonce?wallet=YourWalletAddressHere"
```

Expected response:
```json
{
  "nonce": "uuid-here",
  "expiresAt": "2025-10-22T12:05:00Z",
  "signatureMessage": "Hoodie Academy Daily Claim • 2025-10-22 • nonce:uuid-here",
  "walletAddress": "YourWalletAddressHere"
}
```

### 2. Test Analytics

```bash
# Overview
curl "http://localhost:3000/api/admin/daily-claim-analytics?type=overview"

# Breakdown
curl "http://localhost:3000/api/admin/daily-claim-analytics?type=breakdown"

# Top Squads
curl "http://localhost:3000/api/admin/daily-claim-analytics?type=squads&limit=5"
```

### 3. Database Queries

```sql
-- Check nonces
SELECT * FROM auth_nonces ORDER BY created_at DESC LIMIT 10;

-- Check daily logins
SELECT * FROM daily_logins ORDER BY created_at DESC LIMIT 10;

-- Check analytics
SELECT * FROM daily_claim_analytics ORDER BY timestamp DESC LIMIT 10;

-- Get today's stats
SELECT * FROM get_daily_claim_stats_today();
```

### 4. Common Issues

#### Issue: "Nonce not found"
- Nonce may have expired (5 min TTL)
- Request a new nonce and try again

#### Issue: "Nonce already used"
- Each nonce is single-use
- Request a new nonce for each claim attempt

#### Issue: "Already claimed today"
- This is expected behavior
- User can claim again after midnight UTC

#### Issue: "Invalid signature"
- Ensure message format matches exactly
- Check that signature encoding is correct (base58)
- Verify wallet is unlocked and signing correctly

---

## 🚀 Deployment Checklist

- [ ] Run database migrations
- [ ] Verify all tables and indexes created
- [ ] Test nonce generation and verification
- [ ] Test daily claim flow
- [ ] Configure JWT authentication (optional but recommended)
- [ ] Set up RLS policies
- [ ] Add analytics card to admin dashboard
- [ ] Configure environment variables
- [ ] Test on staging environment
- [ ] Monitor analytics for first 24 hours
- [ ] Set up automated nonce cleanup (cron job)

---

## 📚 Additional Resources

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
- [TweetNaCl.js](https://github.com/dchest/tweetnacl-js)
- [Base58 Encoding](https://en.bitcoin.it/wiki/Base58Check_encoding)

---

## 🔄 Maintenance

### Regular Tasks

- **Daily**: Monitor analytics dashboard for anomalies
- **Weekly**: Review streak distribution and adjust rewards
- **Monthly**: Analyze time-to-claim patterns and optimize UX
- **Quarterly**: Clean up old analytics data (auto-cleanup after 90 days)

### Monitoring Queries

```sql
-- Check for suspicious patterns
SELECT 
  wallet_address,
  COUNT(*) as attempt_count,
  COUNT(DISTINCT ip_hash) as unique_ips
FROM daily_claim_analytics
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND event_type = 'claim_rejected_already_claimed'
GROUP BY wallet_address
HAVING COUNT(*) > 5
ORDER BY attempt_count DESC;

-- Performance monitoring
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  AVG(processing_time_ms) as avg_processing_time,
  MAX(processing_time_ms) as max_processing_time
FROM daily_claim_analytics
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

---

## 🎉 Congratulations!

You now have a production-ready daily claim system with:
- ✅ Replay attack protection
- ✅ Race condition prevention
- ✅ Comprehensive analytics
- ✅ Real-time admin monitoring
- ✅ Economy tuning capabilities

For questions or issues, refer to the inline code comments or create an issue in the project repository.

