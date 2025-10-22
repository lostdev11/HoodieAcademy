# Voice Chat - Quick Start Guide 🎤
**Get your voice chat working in 5 minutes!**

---

## Step 1: Setup Database (2 minutes)

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy and paste** the entire `setup-voice-chat-system.sql` file
3. **Click Run** (or press Ctrl+Enter)
4. **Wait for success message:** "Voice Chat System Setup Complete! ✅"

That's it! Your database is ready.

---

## Step 2: Test It Out (3 minutes)

### Option A: Use Your Social Feed

1. **Go to:** `http://localhost:3001/social` (or port 3000)
2. **Make sure you have 1000+ XP** (required for voice chat)
3. **Look for floating button** in bottom-right corner (purple/pink gradient)
4. **Click it** to open voice chat widget

### Option B: Test API First

Open browser console and run:

```javascript
// Create a test room
const response = await fetch('/api/voice/rooms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    room_name: 'Test Room',
    room_description: 'Testing voice chat',
    created_by: 'YOUR_WALLET_ADDRESS',
    room_type: 'casual',
    max_participants: 10,
    is_public: true
  })
});

const data = await response.json();
console.log(data); // Should show success and room details
```

---

## Step 3: Create Your First Room

1. **Click voice chat button** (bottom-right)
2. **Click "Create Voice Room"**
3. **Fill in:**
   - Room Name: "Community Hangout"
   - Description: "Let's chat!" (optional)
   - Type: Select from dropdown
4. **Click "Create Room"**
5. **You're in!** 🎉

---

## Step 4: Invite Friends

### Share Room ID
```javascript
// Get your current room ID
console.log(activeRoom.id);
```

### Have them join
```javascript
// They run this
const response = await fetch('/api/voice/join', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    room_id: 'ROOM_ID_HERE',
    wallet_address: 'THEIR_WALLET'
  })
});
```

---

## Understanding the Widget

### Minimized State
- **Purple/Pink button** in bottom-right
- **Green dot** = You're in a room
- **Click** to maximize

### Room List View
- **Create button** at top
- **Active rooms** listed below
- **Join buttons** on each room
- Shows participant count (e.g., "3/10")

### In-Room View
- **Room name** at top
- **Controls:**
  - 🎤 Mic (mute/unmute)
  - 🔊 Speaker (deafen/undeafen)
  - 💬 Chat (toggle text chat)
  - ☎️ Leave (exit room)
- **Chat panel** (if enabled)

---

## Room Types Explained

| Type | Best For | Icon |
|------|---------|------|
| **Casual** | General hangout, making friends | 📻 |
| **Study** | Study sessions, learning together | 📚 |
| **Gaming** | Playing games, streaming | 🎮 |
| **Meeting** | Team meetings, planning | 💼 |
| **Q&A** | Ask me anything, teaching | ❓ |

---

## Common Questions

### Who can see my room?
- If **public** → Everyone (all squads)
- If **squad-specific** → Only your squad members
- Rooms show participant count before joining

### How many people can join?
- Default: **10 participants**
- Can be increased when creating room
- Shows "Full" when at capacity

### Do I need special software?
- No! Works in any modern browser
- Chrome, Firefox, Safari, Edge all supported
- Mobile browsers work too

### Can I text chat while talking?
- Yes! Click the chat button (💬)
- Messages only visible to room participants
- Updates every 3 seconds

### What happens when I leave?
- You're marked as "left"
- Duration is tracked
- If room becomes empty, it auto-closes

---

## XP Requirements

Voice chat is available when:
- ✅ User has **1000+ XP**
- ✅ Wallet is connected
- ✅ On social feed page

To check your XP:
```javascript
// In console
console.log(userXP); // Should be 1000+
```

---

## Troubleshooting

### "No active voice rooms"
This is normal! Create the first one:
1. Click "Create Voice Room"
2. Fill in name
3. Click create

### Voice chat button not showing
**Check:**
1. Your XP: `console.log(userXP)` - needs 1000+
2. Wallet connected: `console.log(walletAddress)` - should show address
3. On social feed page: `/social`

### Can't hear anyone
Currently this is UI-only. To add real audio:
1. Integrate WebRTC (Daily.co, Agora, etc.)
2. Or use the provided structure with your own audio solution

### Room immediately closes when I leave
This is by design - empty rooms auto-close to save resources.

---

## Adding Real Voice (WebRTC)

### Quick Integration with Daily.co

```bash
npm install @daily-co/daily-js
```

```typescript
// In VoiceChatWidget.tsx
import Daily from '@daily-co/daily-js';

const callFrame = Daily.createFrame({
  showLeaveButton: true,
  iframeStyle: {
    height: '300px',
    width: '100%'
  }
});

// When joining room
callFrame.join({ url: 'https://your-domain.daily.co/room-name' });
```

See Daily.co docs: https://docs.daily.co/

---

## Next Steps

1. ✅ **Test the widget** - Create a room and explore
2. ✅ **Invite friends** - Get others to join
3. ✅ **Try text chat** - Send messages while in a room
4. ✅ **Add WebRTC** - Integrate real voice (optional)
5. ✅ **Customize** - Change colors, types, limits

---

## Quick Reference

**Where is it?**
- Social Feed page → Bottom-right floating button

**How to use?**
- Click button → Create or join room → Use controls

**APIs:**
- `POST /api/voice/rooms` - Create room
- `POST /api/voice/join` - Join room
- `POST /api/voice/leave` - Leave room
- `POST /api/voice/messages` - Send message

**Database:**
- Tables: `voice_rooms`, `voice_participants`, `voice_messages`
- Functions: `get_active_voice_rooms()`, `join_voice_room()`, `leave_voice_room()`

---

## Support

**Full Documentation:** `VOICE_CHAT_SYSTEM_COMPLETE.md`  
**Database Schema:** `setup-voice-chat-system.sql`

**Need Help?**
1. Check console for errors
2. Verify database setup
3. Test APIs in isolation
4. Review RLS policies

---

**Your voice chat is ready to use! Have fun! 🎉🎤**

