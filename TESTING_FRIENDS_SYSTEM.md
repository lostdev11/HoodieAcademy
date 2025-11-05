# Testing Friends System

## ✅ Database Setup Complete!

Your friends system is now ready to test. Here's what was created:

- ✅ `friends` table with proper structure
- ✅ Indexes for fast queries
- ✅ RLS policies for security
- ✅ Helper functions
- ✅ Triggers

## Test Checklist

### Test 1: Verify Table Exists
- [ ] Go to Supabase → Table Editor
- [ ] Confirm you see `friends` table
- [ ] Check it has 4 columns: `id`, `follower_wallet`, `following_wallet`, `created_at`

### Test 2: View Your Profile
- [ ] Navigate to `/profile` on your app
- [ ] You should see a new **"Top Friends"** card
- [ ] It should show "0 Followers" and "0 Following"

### Test 3: Follow Another User
- [ ] With Wallet A: Navigate to `/profile`
- [ ] Copy the wallet address from the URL bar
- [ ] With Wallet B: Navigate to `/profile/[WalletA]`
- [ ] Click the **"Follow"** button
- [ ] Verify it changes to **"Unfollow"**

### Test 4: View Friends List
- [ ] Go back to Wallet A's profile
- [ ] The "Top Friends" card should now show Wallet B
- [ ] Click on Wallet B's card
- [ ] You should navigate to Wallet B's public profile

### Test 5: Check Database
- [ ] Go to Supabase → Table Editor → `friends`
- [ ] Verify there's a record showing Wallet B follows Wallet A

### Test 6: Public Profile
- [ ] Visit `/profile/[any_wallet]` where [any_wallet] is a valid address
- [ ] You should see their public profile
- [ ] View their XP, level, squad, etc.
- [ ] See their top 6 followers

## Expected Behavior

### On Your Own Profile (`/profile`)
- Shows your top 6 followers in a grid
- Displays follower and following counts
- Click any friend to view their profile
- No "Follow" button (it's your own profile)

### On Someone Else's Profile (`/profile/[wallet]`)
- Shows their public information
- **"Follow"** button if not following
- **"Unfollow"** button if already following
- Click to toggle follow status
- See their top 6 followers

## API Endpoints to Test

You can test these in your browser or with curl:

### Check Stats
```
GET /api/friends/stats?wallet=YOUR_WALLET
```

Expected: `{"success": true, "stats": {"followers": 0, "following": 0}}`

### List Friends
```
GET /api/friends?wallet=YOUR_WALLET&type=followers
```

Expected: `{"success": true, "friends": [], "count": 0}`

### Follow a User
```
POST /api/friends
Content-Type: application/json

{
  "followerWallet": "YOUR_WALLET",
  "followingWallet": "THEIR_WALLET"
}
```

Expected: `{"success": true, "friendship": {...}}`

### Check Follow Status
```
GET /api/friends/check?follower=YOUR_WALLET&following=THEIR_WALLET
```

Expected: `{"success": true, "isFollowing": true}`

## Troubleshooting

### Profile not showing
- Check browser console for errors
- Verify wallet is connected
- Ensure user exists in `users` table

### Follow button not working
- Check network tab for API errors
- Verify both wallets exist in database
- Try refreshing the page

### Friends not appearing
- Check `friends` table has data
- Verify you're on the correct profile
- Look for console errors

### Database errors
- Verify RLS policies are enabled
- Check foreign key constraints
- Ensure `users` table exists

## Success Criteria

You've successfully tested the system when:
- ✅ Can view your own profile with friends card
- ✅ Can view any public profile
- ✅ Can follow/unfollow other users
- ✅ Friends appear in the list
- ✅ Clicking friends navigates to their profile
- ✅ Stats update correctly

## Next Steps

Once testing is complete:
1. Share with your community
2. Encourage users to follow each other
3. Monitor for any issues
4. Consider adding features:
   - Friend recommendations
   - Activity feed
   - Mutual friends
   - Most popular users

## Need Help?

If you encounter any issues:
1. Check browser console for errors
2. Look at Network tab for failed API calls
3. Verify database structure matches expected schema
4. Test with different wallets

Happy testing! 🎉

