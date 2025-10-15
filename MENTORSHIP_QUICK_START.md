# 🚀 Live Mentorship Sessions - Quick Start Guide

## Get Started in 3 Minutes!

### Step 1: Run Database Migration (1 minute)

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `setup-mentorship-sessions.sql`
3. Click **Run** ▶️
4. Wait for "Success" ✅

**Verify it worked**:
```sql
SELECT * FROM mentorship_sessions;
-- Should show 3 sample sessions!
```

---

### Step 2: View Your Sessions Page (30 seconds)

1. Navigate to `/mentorship` in your app
2. You'll see:
   - ✅ 3 upcoming sample sessions
   - ✅ Beautiful card layout with badges
   - ✅ Date, time, attendee counts
   - ✅ Topic tags

**Sample sessions included:**
- 📅 "NFT Trading Strategies - Weekly Q&A" (in 3 days)
- 📅 "DeFi Security Workshop" (in 7 days)
- 📅 "Community Strategy AMA" (in 10 days)

---

### Step 3: Create Your First Real Session (1 minute)

**Option A: Using API**
```bash
POST /api/mentorship/sessions
Content-Type: application/json

{
  "title": "Welcome to Hoodie Academy - Live Q&A",
  "description": "Join me for our first live mentorship session! Ask anything about Web3, NFTs, and trading.",
  "mentor_name": "Your Name Here",
  "scheduled_date": "2025-10-21T18:00:00Z",
  "duration_minutes": 90,
  "session_type": "live_qa",
  "topic_tags": ["welcome", "q&a", "web3"],
  "stream_platform": "zoom",
  "stream_url": "https://zoom.us/j/YOUR-MEETING-ID",
  "max_attendees": 100,
  "created_by": "your_admin_wallet"
}
```

**Option B: Using SQL**
```sql
INSERT INTO mentorship_sessions (
  title,
  description,
  mentor_name,
  scheduled_date,
  duration_minutes,
  session_type,
  topic_tags,
  stream_platform,
  stream_url,
  status
) VALUES (
  'Your Session Title',
  'Your description',
  'Your Name',
  '2025-10-21 18:00:00+00',
  90,
  'live_qa',
  ARRAY['tag1', 'tag2'],
  'zoom',
  'https://zoom.us/j/your-meeting-id',
  'scheduled'
);
```

---

## ✅ You're Live!

Your mentorship system is now ready to use!

### What Students Can Do:
- ✅ Browse upcoming sessions at `/mentorship`
- ✅ See session details (mentor, time, topic)
- ✅ RSVP to sessions (API ready)
- ✅ Submit questions (API ready)
- ✅ Upvote questions (API ready)
- ✅ Watch past recordings

### What You Can Do:
- ✅ Create sessions (via API)
- ✅ Update sessions (via API)
- ✅ See RSVPs in database
- ✅ View submitted questions
- ✅ Add recording links after session

---

## 🎯 Common Tasks

### Mark Session as LIVE
```sql
UPDATE mentorship_sessions 
SET status = 'live' 
WHERE id = 'your-session-id';
```

### Add Recording After Session
```sql
UPDATE mentorship_sessions 
SET 
  recording_url = 'https://youtube.com/watch?v=YOUR-VIDEO',
  recording_available = true,
  status = 'completed'
WHERE id = 'your-session-id';
```

### See Who RSVP'd
```sql
SELECT 
  wallet_address,
  rsvp_at,
  questions_submitted
FROM session_rsvps
WHERE session_id = 'your-session-id'
  AND status = 'confirmed'
ORDER BY rsvp_at DESC;
```

### View Submitted Questions
```sql
SELECT 
  question,
  upvotes,
  wallet_address,
  submitted_at
FROM session_questions
WHERE session_id = 'your-session-id'
  AND is_approved = true
ORDER BY upvotes DESC, submitted_at ASC;
```

---

## 📱 Student Experience Flow

### Before Session:
1. Student visits `/mentorship`
2. Sees upcoming session
3. Clicks "View Details & RSVP"
4. RSVPs to session
5. Submits questions ahead of time
6. Upvotes questions they want answered

### During Session:
1. Session status changes to "live"
2. Student clicks "Join Live Stream"
3. Opens Zoom/YouTube/etc.
4. Participates in live Q&A
5. Can submit more questions

### After Session:
1. Recording is added by admin
2. Student visits "Past Sessions" tab
3. Watches recording anytime
4. Shares with friends

---

## 🎨 Customize Your Sessions

### Session Types Available:
- `live_qa` - Live Q&A (blue badge)
- `workshop` - Hands-on workshop (purple badge)
- `office_hours` - Open office hours (green badge)
- `ama` - Ask me anything (orange badge)

### Platforms Supported:
- `zoom` - Zoom meetings
- `youtube` - YouTube Live
- `twitch` - Twitch streams
- `discord` - Discord voice/stage

### Topic Tags:
Use any tags you want:
- `nfts`, `trading`, `defi`
- `beginners`, `advanced`
- `technical`, `strategy`
- Custom tags for your courses

---

## 📊 Quick Analytics

### Total RSVPs
```sql
SELECT COUNT(*) FROM session_rsvps 
WHERE status = 'confirmed';
```

### Most Popular Session
```sql
SELECT 
  title,
  current_rsvps,
  scheduled_date
FROM mentorship_sessions
WHERE status = 'scheduled'
ORDER BY current_rsvps DESC
LIMIT 1;
```

### Total Questions Submitted
```sql
SELECT COUNT(*) FROM session_questions;
```

### Most Upvoted Question
```sql
SELECT 
  question,
  upvotes
FROM session_questions
ORDER BY upvotes DESC
LIMIT 1;
```

---

## 🔧 Troubleshooting

### Sessions Not Showing Up?
```sql
-- Make sure they're published and in future
SELECT id, title, scheduled_date, is_published, status
FROM mentorship_sessions;

-- If not published:
UPDATE mentorship_sessions SET is_published = true;
```

### RSVP Not Working?
```bash
# Test the API:
curl -X POST http://localhost:3000/api/mentorship/rsvp \
  -H "Content-Type: application/json" \
  -d '{"session_id":"your-id","wallet_address":"test123"}'
```

### Questions Not Submitting?
```sql
-- Check if questions exist:
SELECT * FROM session_questions;

-- Check RLS policies:
SELECT * FROM pg_policies WHERE tablename = 'session_questions';
```

---

## 🎓 Best Practices

### 1. Schedule Consistently
- Same day/time each week
- Students build it into their routine
- Better attendance

### 2. Promote Early
- Announce sessions 1 week ahead
- Share on Discord, Twitter
- Build anticipation

### 3. Encourage Questions
- Ask students to submit questions early
- Upvote system shows what's most wanted
- Prepare better answers

### 4. Upload Recordings Fast
- Within 24 hours of session
- Students who missed can catch up
- Builds your content library

### 5. Mix Session Types
- Not just Q&A
- Workshops for hands-on learning
- Office hours for personal help
- AMAs for community building

---

## 📈 Growth Strategy

### Week 1-2: Launch
- 1-2 sessions per week
- Promote heavily
- Focus on quality

### Week 3-4: Establish Routine
- Same schedule each week
- Students know when to expect
- Build momentum

### Month 2+: Scale
- Add more mentors
- Specialized sessions by squad
- Guest speakers

---

## 🎁 Bonus Features to Add

Already implemented and ready to use:
- ✅ RSVP system
- ✅ Q&A submissions
- ✅ Upvoting
- ✅ Recordings library
- ✅ Capacity management
- ✅ Squad filtering

Future enhancements (optional):
- Automated email reminders
- Calendar sync (.ics export)
- Discord notifications
- Admin dashboard UI
- Live chat during sessions
- Attendance tracking

---

## 🚀 You're Ready!

**Files you have:**
- `setup-mentorship-sessions.sql` - Database setup
- `src/app/api/mentorship/*` - All API endpoints
- `src/app/mentorship/page.tsx` - Public sessions page
- `MENTORSHIP_SESSIONS_COMPLETE.md` - Full documentation

**Next steps:**
1. ✅ Run database migration
2. ✅ Visit `/mentorship` to see sample sessions
3. ✅ Create your first real session
4. ✅ Promote to your students
5. ✅ Host your first live session!

**Need help?** Check `MENTORSHIP_SESSIONS_COMPLETE.md` for full details.

---

**🎉 Happy mentoring! Let's add that human touch to Hoodie Academy! 🎓**

