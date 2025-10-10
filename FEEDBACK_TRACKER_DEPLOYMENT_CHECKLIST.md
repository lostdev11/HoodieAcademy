# Feedback Tracker Widget - Deployment Checklist

## Pre-Deployment Checklist

### ✅ 1. Database Setup
- [ ] Open Supabase Dashboard
- [ ] Navigate to SQL Editor
- [ ] Execute `setup-feedback-tracker.sql`
- [ ] Verify table creation: `SELECT COUNT(*) FROM feedback_updates;`
- [ ] Confirm 5 sample records exist
- [ ] Verify RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'feedback_updates';`

### ✅ 2. Environment Variables
- [ ] Confirm `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] Confirm `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is set
- [ ] Test connection with a quick query

### ✅ 3. Code Files
- [ ] Verify all files created (9 files total)
- [ ] No linting errors: Run `npm run lint` or check editor
- [ ] All imports resolve correctly
- [ ] TypeScript compilation successful

### ✅ 4. Component Integration
- [ ] FeedbackTrackerWidget imported in UserDashboard
- [ ] Widget displays in correct position
- [ ] Responsive layout on mobile
- [ ] No console errors in browser

### ✅ 5. API Endpoints
- [ ] Test GET: `curl http://localhost:3000/api/feedback-updates?limit=5`
- [ ] Verify JSON response with data
- [ ] Test cache-busting: Multiple requests return fresh data
- [ ] Test POST (admin only): Create a test update

### ✅ 6. Admin Setup
- [ ] At least one admin user exists
- [ ] Admin has `is_admin = true` in database
- [ ] Admin can access FeedbackManager component
- [ ] Admin can create new updates
- [ ] New updates appear in widget immediately

## Deployment Steps

### Step 1: Deploy to Production

#### For Vercel
```bash
# Ensure environment variables are set in Vercel dashboard
# Then deploy
git add .
git commit -m "feat: add feedback tracker widget"
git push origin main
```

#### For Other Platforms
```bash
# Build production bundle
npm run build

# Test production build locally
npm start

# Deploy according to your platform's process
```

### Step 2: Run Database Migration

1. Log into production Supabase dashboard
2. Navigate to SQL Editor
3. Copy contents of `setup-feedback-tracker.sql`
4. Execute the SQL
5. Verify table creation and sample data

### Step 3: Verify Production Deployment

- [ ] Visit production URL
- [ ] Navigate to user dashboard
- [ ] Confirm widget displays
- [ ] Test refresh functionality
- [ ] Check mobile responsive design
- [ ] Test admin interface (if applicable)
- [ ] Create a test update in production
- [ ] Verify update appears in widget

## Post-Deployment Checklist

### ✅ Testing in Production

#### User-Facing Tests
- [ ] Widget loads without errors
- [ ] Sample updates display correctly
- [ ] Time display is accurate
- [ ] Category icons and colors correct
- [ ] Status badges show properly
- [ ] Refresh button works
- [ ] No console errors
- [ ] Mobile layout responsive
- [ ] Load time acceptable (< 1s)

#### Admin Tests
- [ ] Can access admin interface
- [ ] Form validates inputs
- [ ] Can create new updates
- [ ] Updates appear in widget
- [ ] Updates list refreshes
- [ ] Success messages display
- [ ] Error handling works

#### Performance Tests
- [ ] Initial load time < 1 second
- [ ] API response time < 500ms
- [ ] Auto-refresh works (wait 5 min)
- [ ] No memory leaks (check browser dev tools)
- [ ] Database queries optimized

### ✅ Documentation

- [ ] Update main README with new feature
- [ ] Add link to feedback page in navigation
- [ ] Document admin procedures for team
- [ ] Create internal guide for adding updates
- [ ] Share quick start guide with team

### ✅ Monitoring

- [ ] Set up error tracking (if applicable)
- [ ] Monitor API endpoint performance
- [ ] Track user engagement with widget
- [ ] Monitor database query performance
- [ ] Set up alerts for API failures

## Common Issues & Solutions

### Issue: Widget Not Displaying

**Symptoms**: Widget doesn't show on dashboard

**Solutions**:
1. Check browser console for errors
2. Verify database has active updates: `SELECT * FROM feedback_updates WHERE is_active = true;`
3. Test API directly: `curl https://your-domain.com/api/feedback-updates`
4. Check RLS policies are enabled
5. Verify component is imported and rendered

### Issue: API Returns Empty Array

**Symptoms**: Widget shows "No updates yet"

**Solutions**:
1. Check database for records: `SELECT COUNT(*) FROM feedback_updates;`
2. Verify `is_active = true` on some records
3. Check RLS policy allows public read access
4. Run sample data insert from setup script

### Issue: Admin Can't Create Updates

**Symptoms**: "Unauthorized" error when submitting form

**Solutions**:
1. Verify admin user in database: `SELECT is_admin FROM users WHERE wallet_address = 'ADMIN_WALLET';`
2. Update admin status: `UPDATE users SET is_admin = true WHERE wallet_address = 'ADMIN_WALLET';`
3. Check environment variables are set
4. Verify adminWallet is being passed to component

### Issue: Updates Not Refreshing

**Symptoms**: Old data persists after creating new update

**Solutions**:
1. Check cache-busting timestamp is added to URL
2. Verify `cache: 'no-store'` in fetch calls
3. Test manual refresh button
4. Check browser isn't caching aggressively
5. Clear browser cache and test again

### Issue: Mobile Layout Broken

**Symptoms**: Widget doesn't display correctly on mobile

**Solutions**:
1. Check responsive classes are applied
2. Test on actual mobile device (not just browser emulation)
3. Verify Tailwind CSS is loading
4. Check for conflicting CSS
5. Test on different screen sizes

## Rollback Plan

If something goes wrong, here's how to rollback:

### Quick Rollback (Hide Widget)
```tsx
// In UserDashboard.tsx, comment out the widget
{/* <FeedbackTrackerWidget limit={5} showTitle={true} className="mb-6" /> */}
```

### Full Rollback (Remove Feature)
1. Revert the commit:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. Optionally remove database table:
   ```sql
   DROP TABLE IF EXISTS feedback_updates;
   ```

## Success Criteria

The deployment is successful when:

- [ ] ✅ Widget displays on user dashboard without errors
- [ ] ✅ Sample updates are visible to all users
- [ ] ✅ Admins can create new updates
- [ ] ✅ New updates appear immediately in widget
- [ ] ✅ Auto-refresh works after 5 minutes
- [ ] ✅ Mobile layout is responsive
- [ ] ✅ No console errors or warnings
- [ ] ✅ Page load time is acceptable
- [ ] ✅ User feedback is positive

## Next Steps After Deployment

1. **Announce the Feature**
   - Post in Discord about the new transparency feature
   - Share example of recent fixes
   - Encourage users to check it out

2. **Create First Real Update**
   - Add a fresh update about the new feature itself
   - Title: "New Transparency Feature: You Asked, We Fixed"
   - Description: "We've added a new widget to show you all the improvements we're making based on your feedback!"

3. **Establish Update Routine**
   - Schedule weekly update reviews
   - Assign someone to add new updates
   - Set goal of 2-3 updates per week

4. **Monitor Usage**
   - Track page views to feedback page
   - Monitor API request volume
   - Collect user feedback on the feature

5. **Iterate and Improve**
   - Gather feedback on the widget itself
   - Consider future enhancements (upvotes, comments)
   - Optimize based on usage patterns

## Maintenance Schedule

### Daily
- [ ] Monitor for errors in logs
- [ ] Check API response times

### Weekly
- [ ] Add 2-3 new updates
- [ ] Review and archive old updates (30+ days)
- [ ] Check user engagement metrics

### Monthly
- [ ] Review most viewed updates
- [ ] Analyze which categories are most common
- [ ] Update priority of evergreen features
- [ ] Clean up inactive updates

## Contact

For issues with deployment:
1. Check troubleshooting section above
2. Review full documentation in `FEEDBACK_TRACKER_WIDGET.md`
3. Check quick start guide in `FEEDBACK_TRACKER_QUICK_START.md`
4. Review implementation summary in `FEEDBACK_TRACKER_IMPLEMENTATION_COMPLETE.md`

---

## Final Verification

Before marking deployment complete, verify:

✅ **Database**: Table created, sample data loaded, RLS enabled  
✅ **API**: Both endpoints working, admin auth enforced  
✅ **Widget**: Displays correctly, auto-refreshes, mobile responsive  
✅ **Admin**: Can create updates, updates appear immediately  
✅ **Performance**: Load times acceptable, no errors  
✅ **Documentation**: Team trained on usage

---

**Deployment Date**: _____________  
**Deployed By**: _____________  
**Production URL**: _____________  
**Status**: ⬜ In Progress | ⬜ Complete | ⬜ Rollback Required

---

**Version**: 1.0.0  
**Last Updated**: October 9, 2025

