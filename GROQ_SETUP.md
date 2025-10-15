# 🚀 Groq Setup - FREE AI Assistant

Your Hoodie Academy AI now uses **Groq** with Meta's Llama 3.3 model - it's **100% FREE** and incredibly fast!

## ✨ Why Groq?

- ✅ **Completely FREE** - No credit card required!
- ✅ **Super Fast** - Often 2-10x faster than OpenAI
- ✅ **Generous Limits** - 30 requests/minute, plenty for your academy
- ✅ **High Quality** - Llama 3.3 70B rivals GPT-4 in many tasks
- ✅ **No Billing** - Never worry about surprise charges

## 🔑 Get Your FREE Groq API Key

### Step 1: Create Groq Account
1. Go to: https://console.groq.com/
2. Click **"Sign Up"** (or "Login with Google")
3. Verify your email
4. No credit card needed! ✨

### Step 2: Generate API Key
1. Once logged in, go to: https://console.groq.com/keys
2. Click **"Create API Key"**
3. Give it a name like "Hoodie Academy"
4. Click **"Submit"**
5. **COPY the key** (starts with `gsk_...`)

### Step 3: Add to Your Environment

Update your `.env.local` file:

```bash
# Replace or add this line
GROQ_API_KEY=gsk-your-groq-key-here
```

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Restart Dev Server

```bash
npm run dev
```

That's it! Your AI is now FREE forever! 🎉

---

## 🎯 What You Get

### Free Limits:
- **30 requests per minute** (plenty for your academy)
- **14,400 requests per day**
- **Unlimited total usage** (no monthly cap!)

### Model: Llama 3.3 70B Versatile
- 70 billion parameters (very smart!)
- Great at coding and explanations
- Fast responses (often < 1 second)
- Perfect for academy questions

---

## 🆚 Groq vs OpenAI Comparison

| Feature | Groq (Llama 3.3) | OpenAI (GPT-3.5) |
|---------|------------------|------------------|
| **Cost** | FREE ✨ | ~$1 per 1000 msgs |
| **Speed** | Very Fast ⚡ | Fast |
| **Quality** | Excellent | Excellent |
| **Limits** | 30/min | Pay per use |
| **Setup** | Free account | Credit card required |

---

## 🎨 Using Different Models

Groq offers several free models. To switch, edit `src/app/api/ai-chat/route.ts`:

### Available Models:

```typescript
// Llama 3.3 70B (RECOMMENDED - Best balance)
model: groq('llama-3.3-70b-versatile')

// Llama 3.1 70B (Also great)
model: groq('llama-3.1-70b-versatile')

// Llama 3.1 8B (Faster, lighter)
model: groq('llama-3.1-8b-instant')

// Mixtral 8x7B (Alternative)
model: groq('mixtral-8x7b-32768')
```

All are **100% FREE**! 🎉

---

## 🐛 Troubleshooting

### "API key is missing"
- Check `.env.local` has `GROQ_API_KEY=...`
- Make sure key starts with `gsk_`
- Restart dev server

### "Rate limit exceeded"
- Wait 1 minute (30 requests per minute limit)
- Very unlikely with normal academy usage
- If it happens often, Groq may increase limits

### "Model not found"
- Check spelling of model name
- Use one of the models listed above

---

## 📊 Monitor Your Usage

1. Go to https://console.groq.com/
2. Click **"Usage"** to see:
   - Requests per day
   - Response times
   - Error rates

No costs to worry about - it's all FREE! ✨

---

## 🎓 Benefits for Your Academy

### For Students:
- Get instant help 24/7
- No delays from API costs
- Unlimited questions
- Fast, helpful responses

### For You:
- No monthly bills
- No credit card needed
- No usage anxiety
- Professional AI quality

---

## 🚀 Future Enhancements

Want even more? You can:
1. **Run locally with Ollama** - 100% private, offline
2. **Try other Groq models** - Experiment with different options
3. **Add function calling** - Let AI interact with your database
4. **Enable streaming** - Already enabled for real-time responses!

---

## ✅ Summary

You now have:
- ✨ FREE AI assistant (no costs ever!)
- ⚡ Super fast responses
- 🧠 Smart Llama 3.3 70B model
- 🎯 Perfect for academy questions and coding help

**Your students get professional AI help without you paying a dime!** 🎉

---

**Questions? The AI assistant itself can help!** Just ask it:
- "How do you work?"
- "What model are you using?"
- "Can you help me with Solana code?"

