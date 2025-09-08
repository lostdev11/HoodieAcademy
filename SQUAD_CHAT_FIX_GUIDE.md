# 🚀 Squad Chat Fix Guide

## ❌ Current Issue
You're getting "Unable to connect to chat service" because the `squad_chat` table doesn't exist in your Supabase database.

## ✅ Quick Fix Steps

### 1. Create Environment File
Create a `.env.local` file in your project root with your Supabase credentials:

```bash
# Copy ENV_TEMPLATE.txt to .env.local
cp ENV_TEMPLATE.txt .env.local
```

Then edit `.env.local` and add your actual Supabase values:
```env
NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
```

### 2. Create Database Table
Go to your Supabase dashboard and run this SQL script:

1. **Open Supabase Dashboard** → Your Project
2. **Go to SQL Editor**
3. **Copy and paste the contents of `setup-squad-chat.sql`**
4. **Click "Run"**

### 3. Test the Fix
After creating the table, test the connection:

```bash
node test-squad-chat-connection.js
```

You should see: `✅ Successfully connected to squad_chat table!`

### 4. Restart Development Server
```bash
npm run dev
```

## 🎯 Expected Result
- ✅ No more "Unable to connect to chat service" error
- ✅ Squad chat messages will be saved to database
- ✅ Real-time messaging will work
- ✅ Messages visible to other squad members

## 📁 Files Created
- `setup-squad-chat.sql` - Database table creation script
- `test-squad-chat-connection.js` - Connection test script
- `SQUAD_CHAT_FIX_GUIDE.md` - This guide

## 🔧 Alternative: Use the HTML Setup Guide
You can also use the visual setup guide:
1. Open `squad-chat-setup.html` in your browser
2. Follow the step-by-step instructions
3. Copy the SQL script to Supabase

## ❓ Need Help?
If you're still having issues:
1. Check that your Supabase credentials are correct
2. Verify the table was created successfully
3. Make sure your development server is running
4. Check the browser console for any error messages
