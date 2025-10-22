# Daily Login 24-Hour Cooldown System

## Overview
The daily login bonus system has been upgraded from a "once per calendar day" system to a true 24-hour cooldown system. This ensures users must wait exactly 24 hours between claims, regardless of calendar dates.

## System Changes

### Previous System (Calendar Day Based)
- Used `reference_id` with format `login_${YYYY-MM-DD}`
- Allowed claiming once per calendar day
- Could claim at 11:59 PM and again at 12:01 AM (just 2 minutes apart)

### New System (24-Hour Cooldown)
- Checks `created_at` timestamp from `xp_rewards` table
- Enforces exactly 24 hours between claims
- If you claim at 3:00 PM, next claim available at 3:00 PM the next day

## API Endpoints

### POST `/api/xp/daily-login`
Awards the daily login bonus (5 XP) if 24 hours have passed since last claim.

**Request:**
```json
{
  "walletAddress": "0x..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "xpAwarded": 5,
  "newTotalXP": 105,
  "previousXP": 100,
  "levelUp": false,
  "previousLevel": 1,
  "newLevel": 1,
  "message": "Daily login bonus: +5 XP!",
  "lastClaimed": "2025-10-22T15:30:00.000Z",
  "nextAvailable": "2025-10-23T15:30:00.000Z",
  "refreshLeaderboard": true,
  "targetWallet": "0x...",
  "reason": "Daily login bonus"
}
```

**Response (Already Claimed):**
```json
{
  "success": false,
  "message": "Daily login bonus available in 23h 45m",
  "alreadyClaimed": true,
  "lastClaimed": "2025-10-22T15:30:00.000Z",
  "nextAvailable": "2025-10-23T15:30:00.000Z"
}
```

### GET `/api/xp/daily-login?wallet=0x...`
Checks the current status of daily login eligibility.

**Response:**
```json
{
  "walletAddress": "0x...",
  "today": "2025-10-22",
  "alreadyClaimed": true,
  "lastClaimed": "2025-10-22T15:30:00.000Z",
  "nextAvailable": "2025-10-23T15:30:00.000Z",
  "dailyBonusXP": 5
}
```

## How It Works

### Claim Process
1. **Check Recent Claims**: Query `xp_rewards` table for claims in the last 24 hours
   ```sql
   SELECT * FROM xp_rewards 
   WHERE wallet_address = ? 
   AND action = 'DAILY_LOGIN'
   AND created_at >= (NOW() - INTERVAL '24 hours')
   ORDER BY created_at DESC
   LIMIT 1
   ```

2. **Calculate Cooldown**: If recent claim found:
   - Calculate `nextAvailable = lastClaimTime + 24 hours`
   - Compare with current time
   - If current time < nextAvailable, deny claim

3. **Award XP**: If cooldown passed:
   - Update `user_xp` table
   - Insert new record in `xp_rewards` with `action = 'DAILY_LOGIN'`
   - Return success with new timestamps

### Status Check
1. **Query Recent Claims**: Same query as claim process
2. **Determine Status**:
   - If no recent claim found → Available now
   - If recent claim found:
     - Calculate `nextAvailable = lastClaimTime + 24 hours`
     - If 24 hours passed → Available now
     - If still in cooldown → Show countdown

## Database Schema

### `xp_rewards` Table
```sql
- id: UUID
- wallet_address: TEXT
- action: TEXT ('DAILY_LOGIN')
- xp_amount: INTEGER (5)
- reference_id: TEXT (null for 24-hour system)
- metadata: JSONB {
    claim_timestamp: ISO timestamp,
    next_available: ISO timestamp
  }
- created_at: TIMESTAMP (critical for 24-hour calculation)
```

## Frontend Integration

### DailyLoginBonus Component
The component automatically:
1. **Loads status on mount**: Calls GET endpoint
2. **Shows appropriate UI**:
   - "Claim Daily Bonus" button if available
   - Countdown timer if in cooldown
3. **Updates after claim**: Sets local state with exact 24-hour nextAvailable time
4. **Maintains countdown**: Updates every second
5. **Auto-refreshes**: Checks status every minute (only if not in active countdown)

### Key Features
- ✅ Countdown persists across page refreshes
- ✅ Shows exact hours:minutes:seconds until next claim
- ✅ Button automatically appears when 24 hours pass
- ✅ Local state updates immediately after claim
- ✅ Server-side validation prevents cheating

## Benefits

1. **Fair System**: Everyone waits exactly 24 hours
2. **No Calendar Exploits**: Can't claim twice in short time by crossing midnight
3. **Precise Countdown**: Users know exactly when they can claim again
4. **Server-Validated**: All checks happen server-side
5. **Persistent State**: Refreshing page doesn't reset countdown

## Testing

### Test Scenarios
1. **First Time User**: Should see "Claim Daily Bonus" button immediately
2. **After Claiming**: Should see countdown timer starting at 23:59:59
3. **Page Refresh**: Countdown should persist and continue
4. **After 24 Hours**: Button should reappear automatically
5. **Multiple Claims**: Should be rejected with proper error message

### Test API Directly
```bash
# Check status
curl "http://localhost:3000/api/xp/daily-login?wallet=YOUR_WALLET"

# Claim bonus
curl -X POST http://localhost:3000/api/xp/daily-login \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"YOUR_WALLET"}'
```

## Migration Notes

### For Existing Users
- Old claims with `reference_id = login_YYYY-MM-DD` will be ignored
- System only checks `action = 'DAILY_LOGIN'` and `created_at` timestamp
- No data migration needed
- Users can claim immediately after deployment (if more than 24 hours since last claim)

## Troubleshooting

### Issue: Button reappears after refresh
- **Cause**: Browser cached old JavaScript
- **Fix**: Hard refresh (Ctrl+Shift+R)

### Issue: Can claim multiple times in 24 hours
- **Cause**: Database records not being created properly
- **Check**: Verify `xp_rewards` table has the claim record with correct timestamp

### Issue: Countdown shows wrong time
- **Cause**: Server time vs client time mismatch
- **Fix**: System uses server timestamps for all calculations

## Future Enhancements

Possible improvements:
1. Streak tracking (consecutive days)
2. Increased rewards for longer streaks
3. Bonus multipliers for certain days
4. Push notifications when 24 hours are up
5. Analytics dashboard for claim patterns

