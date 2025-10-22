# Development Server Port Information

## Current Setup

Your dev server is running on **PORT 3001** because port 3000 was already in use.

### Access your admin dashboard at:
```
http://localhost:3001/admin-dashboard
```

### Access your main app at:
```
http://localhost:3001
```

---

## Why Port 3001?

When you start the dev server, Next.js tries port 3000 first. If it's busy, it automatically tries 3001.

From your terminal:
```
⚠ Port 3000 is in use, trying 3001 instead.
- Local:        http://localhost:3001
```

---

## To Use Port 3000 Instead

### Step 1: Find what's using port 3000
```powershell
netstat -ano | findstr :3000
```

### Step 2: Kill that process
```powershell
taskkill /PID 19096 /F
```
(Replace 19096 with the PID from step 1)

### Step 3: Restart your dev server
```bash
npm run dev
```

Now it will use port 3000!

---

## Remember

Always check your terminal output to see which port Next.js is using:
```
- Local:        http://localhost:3001  ← Use this URL!
```

Your app is working perfectly, just make sure to use the correct port! ✅

