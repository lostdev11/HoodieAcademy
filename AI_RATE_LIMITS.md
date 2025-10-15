# 🛡️ AI Assistant Rate Limits

To prevent abuse and control costs, the AI assistant has built-in rate limiting.

## 📊 Current Limits

### Client-Side (Per Browser Session)
- **50 messages per session**
- Resets when user refreshes the page
- Counter shown when 70% used (35+ messages)
- Clear warning when limit reached

### Server-Side (Per Hour)
- **100 messages per hour per IP address**
- Prevents API abuse
- Returns 429 error when exceeded
- Automatically resets after 1 hour

## 🎯 Why Rate Limits?

1. **Cost Control** - Even with free Groq, prevents excessive usage
2. **Fair Access** - Ensures all students get help
3. **Abuse Prevention** - Stops spam and automated requests
4. **Server Protection** - Prevents overload

## 📈 Limit Breakdown

### Client-Side: 50 Messages/Session
```
Messages 1-35:   Normal usage ✅
Messages 36-49:  Warning shown ⚠️
Message 50:      Limit reached 🛑
```

**How it works:**
- Tracks user messages in browser memory
- Shows remaining count when getting close
- Disables input when limit reached
- User must refresh page to reset

### Server-Side: 100 Messages/Hour
```
Rate Limit Window: 1 hour (60 minutes)
Max Messages: 100 per IP address
Reset: Automatic after 1 hour
```

**How it works:**
- Tracks requests by IP address
- Stored in server memory (resets on restart)
- Returns 429 status code when exceeded
- Error message tells user to wait

## 🔧 Adjusting Limits

### To Change Client-Side Limit:

Edit `src/components/ai/AIChatWidget.tsx`:

```typescript
const MESSAGE_LIMIT = 50; // Change this number
```

**Recommended values:**
- Light usage: 20-30 messages
- Normal usage: 50 messages (current)
- Heavy usage: 100 messages
- Unlimited: Remove the check entirely

### To Change Server-Side Limit:

Edit `src/app/api/ai-chat/route.ts`:

```typescript
const RATE_LIMIT = 100; // Messages per window
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // Time window in ms
```

**Example configurations:**

```typescript
// Conservative (lower costs)
const RATE_LIMIT = 50;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

// Generous (better UX)
const RATE_LIMIT = 200;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

// Per day instead of per hour
const RATE_LIMIT = 500;
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours
```

## 💡 User Experience

### When User Hits Client Limit:
```
⚠️ Message limit reached (50 messages per session).
Refresh the page to reset.
```

### When User Hits Server Limit:
```
⚠️ Error: Rate limit exceeded
You have reached the maximum number of messages per hour.
Please try again later.
```

## 🎓 Best Practices

### For Students:
- Use clear, specific questions
- One topic per message
- Refresh page when limit reached
- Don't spam the AI

### For Admins:
- Monitor usage patterns
- Adjust limits based on feedback
- Check Groq dashboard for usage
- Consider per-user limits for heavy users

## 📊 Monitoring Usage

### Check Groq Dashboard:
1. Go to https://console.groq.com/
2. Click "Usage" tab
3. See total requests per day
4. Monitor for unusual patterns

### Track in Your App:
The rate limiting system logs to console:
```
AI Chat Error: Rate limit exceeded
```

## 🚀 Advanced Options

### Want More Control?

You could implement:

1. **Wallet-Based Limits**
   - Track by Solana wallet address
   - Different limits for different user tiers
   - Premium users get higher limits

2. **Database Tracking**
   - Store usage in Supabase
   - Persistent across server restarts
   - Analytics and reporting

3. **Dynamic Limits**
   - Adjust based on time of day
   - Increase limits for verified users
   - Decrease during peak hours

4. **Purchase More Messages**
   - Let users buy extra messages with tokens
   - Gamification: earn messages by completing courses

## 🔐 Security Notes

**Current Implementation:**
- ✅ IP-based tracking (simple, effective)
- ✅ In-memory storage (fast, resets on restart)
- ✅ No personal data stored
- ✅ Graceful error messages

**Limitations:**
- Resets on server restart
- Shared IPs (offices, schools) share limits
- Can be bypassed with VPN

**For Production:**
Consider adding:
- Redis for persistent rate limiting
- Wallet authentication for per-user limits
- CAPTCHA for suspicious patterns

## 📋 Summary

| Limit Type | Amount | Reset | Bypass |
|------------|--------|-------|--------|
| Client | 50 msgs/session | Page refresh | Easy |
| Server | 100 msgs/hour | 60 minutes | Hard |

**Both limits work together** to provide a good balance between:
- User experience (generous limits)
- Cost control (prevents abuse)
- Fair access (everyone gets help)

---

**Your AI assistant is now protected against abuse while remaining helpful for students!** 🛡️✨

