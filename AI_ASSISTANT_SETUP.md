# 🤖 Hoodie Academy AI Assistant - Setup Guide

## Overview
Your academy now has an AI-powered coding assistant using GPT-4! Students can ask questions about Web3, Solana, NFTs, and get coding help 24/7.

## 🔑 Required: OpenAI API Key

### 1. Get Your API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to API Keys section
4. Create a new secret key
5. **Copy it immediately** (you won't see it again!)

### 2. Add to Your Environment

Add this to your `.env.local` file:

```bash
# OpenAI API Key for AI Assistant
OPENAI_API_KEY=sk-your-api-key-here
```

**IMPORTANT:** Never commit this file to GitHub!

## 💰 Costs

### Model Options:

**GPT-3.5-Turbo** (Recommended for starting):
- Cost: ~$0.001 per conversation
- Speed: Very fast
- Quality: Great for most questions
- Monthly estimate: $10-30 for moderate usage

**GPT-4-Turbo** (Current default):
- Cost: ~$0.01 per conversation
- Speed: Fast
- Quality: Excellent, better for complex code
- Monthly estimate: $30-100 for moderate usage

### To Switch to GPT-3.5 (Lower Cost):

Edit `src/app/api/ai-chat/route.ts`:

```typescript
// Change this line:
model: openai('gpt-4-turbo-preview'),

// To this:
model: openai('gpt-3.5-turbo'),
```

## 🎨 Adding the AI Assistant to Your App

### Option 1: Global Widget (Recommended)

Add to `src/app/layout.tsx`:

```typescript
import AIChatWidget from '@/components/ai/AIChatWidget';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AppProvider>
          {children}
          <AIChatWidget /> {/* Add this line */}
        </AppProvider>
      </body>
    </html>
  );
}
```

### Option 2: Specific Pages Only

Add to any page:

```typescript
import AIChatWidget from '@/components/ai/AIChatWidget';

export default function CoursePage() {
  return (
    <div>
      {/* Your page content */}
      <AIChatWidget initialOpen={false} />
    </div>
  );
}
```

## ✨ Features

### What the AI Can Do:
- ✅ Answer Web3 and Solana questions
- ✅ Explain code and debug issues
- ✅ Help with Solana Program Library (SPL)
- ✅ Provide hints for bounties
- ✅ Explain NFT concepts
- ✅ Guide students through courses
- ✅ Warning about security issues

### What It Won't Do:
- ❌ Give complete bounty solutions (provides hints instead)
- ❌ Access private user data
- ❌ Make transactions or handle wallets
- ❌ Store conversation history (yet)

## 🔧 Customization

### Change the System Prompt

Edit `src/app/api/ai-chat/route.ts` to customize how the AI behaves:

```typescript
const systemPrompt = `
You are [your custom instructions]
`;
```

### Add Course Context

You can enhance the AI with your specific course content:

```typescript
const systemPrompt = `...
CURRENT COURSES:
- Solana Basics: Accounts, transactions, programs
- NFT Mastery: Metaplex, collections, royalties
- DeFi Deep Dive: AMMs, liquidity pools, yield farming
...`;
```

## 📊 Monitoring Usage

Check your OpenAI dashboard at https://platform.openai.com/usage to:
- See total costs
- Monitor request volume
- Set spending limits
- View usage by day

### Set Spending Limits:
1. Go to Settings → Billing
2. Set monthly budget cap
3. Get alerts when you approach limit

## 🎯 Example Interactions

**Student asks:**
> "How do I create an NFT on Solana?"

**AI responds:**
> "Great question! On Solana, we use the Metaplex Token Metadata program. Here's a basic example:
> 
> ```typescript
> import { Metaplex } from '@metaplex-foundation/js';
> ...
> ```
>
> This creates an NFT with..."

## 🔒 Security

✅ **What's Secure:**
- API key stored in environment variables
- Edge runtime for fast responses
- No user data sent to OpenAI
- Rate limiting ready

⚠️ **Best Practices:**
- Never expose your API key
- Monitor usage regularly
- Set spending limits
- Don't send sensitive user data to AI

## 🚀 Next Steps

After basic setup, you can:
1. **Add conversation memory** - Store chat history per user
2. **Integrate with XP system** - Award XP for asking good questions
3. **Course-specific AI** - Different AI personalities per track
4. **Code execution** - Let AI run and test code
5. **Voice chat** - Add speech-to-text/text-to-speech

## 🐛 Troubleshooting

### "API key not found"
- Check `.env.local` has `OPENAI_API_KEY=...`
- Restart dev server after adding env var
- Make sure no spaces around `=`

### "Rate limit exceeded"
- You've hit OpenAI's rate limit
- Wait a few minutes
- Upgrade your OpenAI plan

### "Model not found"
- Check your OpenAI account has access to the model
- Try switching to `gpt-3.5-turbo`

### Widget not showing
- Make sure you imported the component
- Check console for errors
- Verify React is rendering the component

## 💡 Pro Tips

1. **Start with GPT-3.5** - Cheaper, upgrade to GPT-4 if needed
2. **Set spending alerts** - Avoid surprise bills
3. **Customize the prompt** - Make it specific to your academy
4. **Monitor feedback** - See what students ask most
5. **Add rate limiting** - Prevent abuse

## 📞 Need Help?

- [OpenAI Documentation](https://platform.openai.com/docs)
- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- Check the code comments for guidance

---

**Your AI assistant is ready! Students will love having 24/7 coding help.** 🎉

