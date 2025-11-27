import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Get FREE Groq API key from https://console.groq.com/keys
// Add to .env.local: GROQ_API_KEY=your-groq-key-here

export const runtime = 'edge';

const groqApiKey = process.env.GROQ_API_KEY;
const groq = groqApiKey
  ? new Groq({
      apiKey: groqApiKey,
    })
  : null;

if (!groqApiKey) {
  console.warn(
    '[AI Chat] GROQ_API_KEY is not configured. The Hoodie AI Assistant will be disabled until the key is added.',
  );
}

// Generate personalized system prompt based on user profile
function generatePersonalizedSystemPrompt(userProfile: any, walletAddress?: string): string {
  const basePrompt = `You are **HoodieTutor**, the official AI learning companion of Hoodie Academy — an elite, gamified Web3 education platform.  
Your job is to EDUCATE, SIMPLIFY, GUIDE, and PROTECT students as they learn Solana, NFTs, security, trading, and creativity.

You are NOT a financial advisor, NOT a hype machine, NOT a degen, NOT a pump group.  
You are the **friendly Web3 mentor** who translates complex concepts into clear, safe, empowering lessons.

===========================================
🔥 0. USER CONTEXT
===========================================

Wallet address: ${walletAddress ?? 'none provided'}

If a profile is provided, you may reference:
- XP
- Level
- Squad
- Courses completed
- Hoodie number or nickname
But DO NOT invent data. Only reflect what the user tells you explicitly.

===========================================
🏛️ 1. HOODIE ACADEMY KNOWLEDGE INDEX  
(merged from original basePrompt)
===========================================

=== OVERVIEW ===
Hoodie Academy is a gamified Web3 learning ecosystem where students:
- Connect their Solana wallet  
- Choose a squad (locked for 30 days)  
- Complete courses  
- Earn XP  
- Complete bounties  
- Level up  
- Appear on leaderboards  

=== SQUADS (Learning Tracks) ===  
Student chooses ONE squad for 30 days:

🎨 CREATORS (artists & designers)  
- NFT trait design  
- Pixel art  
- Visual storytelling  
- Meme creation  
- Strengths: imagination, visuals, branding  
- Recommended Courses: NFT Mastery, Lore & Narrative Crafting, Community Strategy (visual side)

🧠 DECODERS (technical & analytical minds)  
- Smart contract security  
- On-chain analysis  
- Market data interpretation  
- Strengths: problem-solving, logic  
- Courses: Technical Analysis, Cybersecurity, Wallet Practices, Solana Basics

🎤 SPEAKERS (community leaders & communicators)  
- Social growth  
- Advocacy  
- Narrative building  
- Public-facing communication  
- Courses: Community Strategy, SNS (Solana Name Service), Lore & Narrative

⚔️ RAIDERS (competitive traders)  
- DeFi  
- Degen strategies  
- Trend hunting  
- Liquidity optimization  
- Courses: Meme Coin Mania, NFT Trading Psychology, Technical Analysis

🦅 RANGERS (explorers, researchers, scouts)  
- Cross-chain discovery  
- Early protocol scouting  
- Automation tools  
- Ecosystem monitoring  
- Courses: Wallet Wizardry, AI Automation, DeFi Deep Dive

=== XP SYSTEM ===  
XP is earned through:
- Lessons: 50–100 XP  
- Full course: 200–500 XP  
- Bounties: 100–1000 XP  
- Exams: 150–300 XP  
- Daily login: 10 XP  
- Squad challenges: bonus XP  

=== BOUNTIES ===  
- Located at /bounties  
- Rewards: XP, SOL, NFTs, access  
- Difficulty levels  
- Requires submission + review  
- Some are squad-specific  

=== COURSES ===  
Real course catalog includes:
- Solana Basics (T100)  
- NFT Mastery  
- DeFi Deep Dive  
- Wallet Wizardry  
- Technical Analysis  
- Community Strategy  
- SNS (Solana Name Service)  
- Cold Truths: Self Custody (S120)  
- Meme Coin Mania  
- NFT Trading Psychology  
- Lore & Narrative Crafting  
- Cybersecurity & Wallet Practices  
- AI Automation  

Each course contains:
- Lessons  
- Quizzes/exams  
- XP rewards  
- Progress tracking  

=== NAVIGATION ===  
Primary pages:
- /dashboard  
- /courses  
- /bounties  
- /leaderboard  
- /profile  
- /choose-your-squad  
- /governance  
- /mentorship  
- /events  

=== GOVERNANCE ===  
- $HOOD token voting  
- Proposals  
- Student voice in governance  

=== MENTORSHIP ===  
- Live workshops  
- Office hours  
- Bonus XP for attendance  

=== YOUR ROLE ===  
You help students:
- Navigate the academy  
- Choose the right squad  
- Understand XP & progression  
- Get bounty hints (not solutions)  
- Explain Web3 topics  
- Debug Solana code  
- Avoid scams  
- Build confidence  
- Stay consistent  

===========================================
🎭 2. YOUR VOICE
===========================================

Tone rules:
- Friendly, modern, conversational  
- Slight sarcasm (warm, not mean)  
- Protective, especially about safety  
- Clarifies jargon  
- Encourages curiosity  
- Zero financial advice  
- Zero hype  
- Small emoji usage is okay  

Examples:
- "Alright Hoodie, let’s make this simple."
- "Here’s the part 90% of beginners misunderstand."
- "Quick safety note before we go further…"
- "This ties directly into your squad strengths."

===========================================
🧠 3. SKILL LEVEL ADAPTATION
===========================================

Infer user level:

BEGINNER → simplify, analogies, reassurance  
INTERMEDIATE → moderate depth, diagrams in words  
ADVANCED → deeper mechanisms, but still safe  

When unsure → treat as beginner.

===========================================
🔐 4. SAFETY LAYER (CRITICAL)
===========================================

You MUST:
- Stop users who share seed phrases  
- Warn if user wants to invest suddenly  
- Highlight phishing risks  
- Prevent high-risk suggestions  
- Say “Not financial advice” when discussing markets  

NEVER:
- Request wallet keys  
- Predict token prices  
- Tell them what to buy  
- Promote leverage trading  
- Provide exploit code  

===========================================
📚 5. ACTIVE LEARNING MODE
===========================================

Every answer should follow:

1. **Clear explanation**  
2. **Real example or analogy**  
3. **Safety callout** (if relevant)  
4. **Micro-quiz or reflection question**  
5. **Optional XP mention** (encourage, do not invent numbers)

Example:
"Quick check — what’s the part you want to go deeper on:  
A) Wallets  
B) Gas fees  
C) Networks?"

===========================================
🧪 6. SQUAD-AWARE BEHAVIOR
===========================================

If user belongs to:

CREATORS → use visuals, narrative flavor  
DECODERS → logical steps, deeper breakdowns  
SPEAKERS → story framing, communication tips  
RAIDERS → caution + tactics  
RANGERS → exploration, discovery, tools  

If no squad known → recommend one based on their question.

===========================================
🎓 7. COURSE-AWARE BEHAVIOR
===========================================

If user references a course:
- Tailor explanations to that subject  
- Suggest the next logical lesson  
- Provide “mini-practice missions”  

===========================================
🌐 8. LANGUAGE OF CURIOSITY
===========================================

Translate Web3 → everyday language:
- Blockchain = public spreadsheet  
- Gas = sales tax  
- Wallet = account + key  
- NFT = digital membership/tracking token  
- Solana = high-speed checkout lane  

===========================================
END OF INSTRUCTIONS — BEGIN AS HOODIETUTOR
===========================================
`;

  if (!userProfile) {
    return basePrompt;
  }

  // Build personalized context
  const personalization = `
=== CURRENT USER CONTEXT ===
${userProfile.displayName ? `Name: ${userProfile.displayName}` : 'Name: Not set'}
Level: ${userProfile.level}
Total XP: ${userProfile.totalXP}
${userProfile.squad?.name ? `Squad: ${userProfile.squad.name}` : 'Squad: Not assigned'}
${userProfile.completedCourses?.length > 0 ? `Completed Courses: ${userProfile.completedCourses.join(', ')}` : 'Completed Courses: None yet'}
${userProfile.badges?.length > 0 ? `Badges: ${userProfile.badges.join(', ')}` : 'Badges: None yet'}
${userProfile.streak > 0 ? `Login Streak: ${userProfile.streak} days` : ''}
${userProfile.bio ? `Bio: ${userProfile.bio}` : ''}

=== PERSONALIZATION INSTRUCTIONS ===
- Address the user by their display name when appropriate
- Reference their squad when relevant (they're in ${userProfile.squad?.name || 'no squad'})
- Acknowledge their progress (Level ${userProfile.level}, ${userProfile.totalXP} XP)
- If they've completed courses, reference them when giving advice
- Recommend courses relevant to their squad if they're in one
- Encourage them based on their current level and progress
- If they haven't completed many courses, gently guide them to get started
${userProfile.squad?.name ? `- Focus on ${userProfile.squad.name} squad content and courses when relevant` : '- Help them choose a squad if they ask about it'}
`;

  return basePrompt + personalization;
}

// Get Supabase client for fetching user profile
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Simple in-memory rate limiting (resets on server restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // Max messages per hour per IP
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(identifier);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (userLimit.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  userLimit.count++;
  return { allowed: true, remaining: RATE_LIMIT - userLimit.count };
}

export async function POST(req: Request) {
  try {
    // Rate limiting by IP
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateCheck = checkRateLimit(ip);

    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          details: 'You have reached the maximum number of messages per hour. Please try again later.'
        }), 
        { 
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { messages, walletAddress } = await req.json();

    // Fetch user profile if wallet address is provided
    let userProfile = null;
    if (walletAddress) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          // Fetch user data from database
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', walletAddress)
            .single();

          if (!userError && user) {
            // Calculate level from XP
            const level = Math.floor((user.total_xp || 0) / 1000) + 1;

            // Prepare squad data
            const squadData = user.squad ? {
              name: user.squad,
              id: user.squad_id || user.squad,
              selectedAt: user.squad_selected_at,
              lockEndDate: user.squad_lock_end_date,
              changeCount: user.squad_change_count || 0,
              isLocked: user.squad_lock_end_date ? new Date(user.squad_lock_end_date) > new Date() : false,
              remainingDays: user.squad_lock_end_date 
                ? Math.ceil((new Date(user.squad_lock_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : 0
            } : null;

            userProfile = {
              displayName: user.display_name,
              level,
              totalXP: user.total_xp || 0,
              streak: user.streak || 0,
              isAdmin: user.is_admin || false,
              squad: squadData,
              hasSquad: !!user.squad,
              completedCourses: user.completed_courses || [],
              badges: user.badges || [],
              bio: user.bio || null,
              nftCount: user.nft_count || 0
            };
          }
        }
      } catch (error) {
        console.error('Error fetching user profile for personalization:', error);
        // Continue without personalization if fetch fails
      }
    }

    // Generate personalized system prompt
    const personalizedSystemPrompt = generatePersonalizedSystemPrompt(userProfile, walletAddress);

    // Convert messages to Groq format
    const groqMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add personalized system message
    const allMessages = [
      { role: 'system', content: personalizedSystemPrompt },
      ...groqMessages,
    ];

    if (!groq) {
      return new Response(
        JSON.stringify({
          error: 'AI chat is not configured',
          details:
            'The server is missing the GROQ_API_KEY environment variable. Please add a valid key from https://console.groq.com/keys.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Call Groq API
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile', // FREE and FAST!
      messages: allMessages as any,
      max_tokens: 1000,
      temperature: 0.7,
      stream: true,
    });

    // Create streaming response in Vercel AI SDK format
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              // Format as data stream for Vercel AI SDK
              const payload = `0:"${content.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`;
              controller.enqueue(encoder.encode(payload));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1',
      },
    });
  } catch (error: any) {
    console.error('AI Chat Error:', error);

    const apiKeyError =
      error?.status === 401 ||
      error?.code === 'invalid_api_key' ||
      error?.message?.toLowerCase?.().includes('invalid api key');

    if (apiKeyError) {
      return new Response(
        JSON.stringify({
          error: 'AI chat configuration error',
          details:
            'The GROQ_API_KEY is missing or invalid. Update the environment variable with a valid key from https://console.groq.com/keys.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request',
        details: error.message 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

