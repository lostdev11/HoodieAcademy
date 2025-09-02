# 🚀 Quick Admin Dashboard Setup

## ❌ Current Issue
You're seeing an "Admin Dashboard Error" because the Supabase environment variables are not configured.

## 🔧 Quick Fix (5 minutes)

### 1. Create Environment File
Create a `.env.local` file in your project root:

```bash
# Copy the template
cp ENV_TEMPLATE.txt .env.local
```

### 2. Get Supabase Credentials
1. Go to [supabase.com](https://supabase.com)
2. Create a new project or use existing one
3. Go to Settings → API
4. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Update .env.local
Replace the placeholder values in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Restart Server
```bash
# Stop your dev server (Ctrl+C)
# Then restart
npm run dev
```

### 5. Run Setup Script (if needed)
```bash
node setup-admin-dashboard.js
```

## ✅ Success Indicators
- Admin dashboard loads without errors
- You see user data and course information
- No more "[object Object]" error messages

## 🆘 Still Having Issues?

### Check Environment Variables
The error page now shows which variables are missing:
- ✅ Set = Variable is configured
- ❌ Missing = Variable needs to be added

### Common Problems
1. **File Location**: `.env.local` must be in project root (same folder as `package.json`)
2. **File Name**: Must be exactly `.env.local` (not `.env` or `.env.local.txt`)
3. **Server Restart**: Environment changes require server restart
4. **Permissions**: Service role key needs database access

### Debug Steps
1. Check browser console for detailed errors
2. Verify Supabase project is running
3. Test database connection with setup script
4. Check file permissions on `.env.local`

## 🔗 Useful Resources
- [ENV_TEMPLATE.txt](./ENV_TEMPLATE.txt) - Environment variable template
- [setup-admin-dashboard.js](./setup-admin-dashboard.js) - Database setup script
- [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md) - Detailed Supabase setup
- [ADMIN_SETUP_GUIDE.md](./ADMIN_SETUP_GUIDE.md) - Complete admin setup guide

## 📞 Need Help?
1. Check the error page for specific missing variables
2. Run the setup script to test database connection
3. Review the detailed setup guides above
4. Check browser console for error details
