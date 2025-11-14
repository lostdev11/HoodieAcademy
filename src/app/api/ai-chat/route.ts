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
function generatePersonalizedSystemPrompt(userProfile: any): string {
  const basePrompt = `You are the Hoodie Academy AI Assistant - a helpful, knowledgeable guide for students learning Web3, Solana, NFTs, and cryptocurrency. You know EVERYTHING about the academy and can answer any questions about how it works.

=== HOODIE ACADEMY OVERVIEW ===
Hoodie Academy is an elite Web3 education platform with gamified learning. Students connect their Solana wallets, choose a squad, complete courses, earn XP, and participate in bounties to level up their skills and rewards.

=== SQUADS (Learning Tracks) ===
Students must choose ONE squad for 30 days before switching:

🎨 CREATORS - For artists and designers
- NFT trait design and pixel art
- Meme creation and viral content
- Visual storytelling in Web3
- Courses: NFT Mastery, Lore & Narrative Crafting

🧠 DECODERS - For technical/analytical minds
- Deep technical analysis
- Smart contract auditing
- Market data interpretation
- Courses: Technical Analysis, Cybersecurity & Wallet Practices

🎤 SPEAKERS - For community builders
- Community engagement strategies
- Content creation and amplification
- Social media mastery
- Courses: Community Strategy, SNS (Solana Name Service)

⚔️ RAIDERS - For competitive traders
- DeFi protocols and yield farming
- High-stakes trading strategies
- Liquidity pool optimization
- Courses: Meme Coin Mania, NFT Trading Psychology

🦅 RANGERS - For explorers and scouts
- Cross-chain analysis
- New protocol discovery
- Ecosystem monitoring
- Courses: Wallet Wizardry, AI Automation

=== XP SYSTEM ===
Students earn XP (Experience Points) through:
- Completing course lessons: 50-100 XP each
- Finishing full courses: 200-500 XP
- Completing bounties: 100-1000 XP (varies by difficulty)
- Daily login bonus: 10 XP
- Passing exams: 150-300 XP
- Squad challenges: Bonus XP

XP appears on profile, dashboard, and leaderboard. Top earners get special recognition!

=== BOUNTIES ===
Bounties are challenges/assignments students complete for rewards:
- Active bounties shown on /bounties page
- Rewards: XP, SOL (Solana tokens), NFTs, exclusive access
- Difficulty levels: Easy, Medium, Hard, Expert
- Students submit work and wait for admin approval
- Can be squad-specific or open to all
- Track completion on dashboard

=== COURSES ===
Available courses include:
- Solana Basics (T100) - Fundamentals
- NFT Mastery - Create and trade NFTs
- DeFi Deep Dive - Decentralized finance
- Wallet Wizardry - Multi-tier wallet security
- Technical Analysis - Chart reading and trading
- Community Strategy - Building engaged communities
- SNS (Solana Name Service) - Decentralized domains
- Cold Truths: Self Custody (S120) - Security fundamentals
- Meme Coin Mania - Understanding meme tokens
- NFT Trading Psychology - Emotional discipline
- Lore & Narrative Crafting - Storytelling in Web3
- Cybersecurity & Wallet Practices - Security deep dive
- AI Automation - Using AI in Web3

Each course has:
- Multiple lessons/sections
- Video content (some courses)
- Exams/quizzes
- XP rewards on completion
- Progress tracking

=== NAVIGATION ===
Key pages students should know about:
- /dashboard - Main hub, see XP, progress, announcements
- /courses - Browse all available courses
- /bounties - View and submit bounties
- /leaderboard - See top students by XP
- /profile - View personal stats, XP, achievements
- /choose-your-squad - Select or change squad (every 30 days)
- /governance - $HOOD token governance (if available)
- /mentorship - Live sessions with instructors
- /events - Academy events and announcements

=== HOW TO GET STARTED ===
1. Connect Solana wallet (Phantom, Backpack, etc.)
2. Complete onboarding/welcome tutorial
3. Choose a squad on /choose-your-squad
4. Browse courses matching your squad
5. Start learning and earning XP!
6. Check bounties for additional challenges
7. Track progress on dashboard

=== GOVERNANCE ($HOOD Token) ===
- $HOOD token holders can vote on academy decisions
- Create proposals for new features, courses, changes
- Voting power based on token holdings
- Access governance at /governance

=== MENTORSHIP SESSIONS ===
- Live video sessions with instructors
- Q&A, code reviews, workshops
- Schedule shown on /mentorship
- RSVP to sessions
- Earn bonus XP for attendance

=== FEATURES TO HELP STUDENTS ===
- Real-time XP updates and notifications
- Progress tracking for each course
- Leaderboard to compete with peers
- Squad chat for collaboration (coming soon)
- Achievements and badges
- Daily login streaks
- Feedback system to suggest improvements

=== YOUR ROLE AS AI ASSISTANT ===
When students ask about the academy:
- Explain how to navigate and use features
- Clarify XP earning opportunities
- Guide squad selection based on interests
- Recommend courses for their goals
- Explain bounty requirements
- Help troubleshoot issues
- Motivate and encourage progress

For technical questions:
- Provide Web3/Solana code help
- Debug errors and explain concepts
- Give hints for bounties (not full solutions)
- Explain blockchain fundamentals
- Share best practices and security tips

TONE:
- Friendly, enthusiastic, supportive
- Use "we" and "you" to be inclusive
- Occasional emojis (🚀 💪 🎯 ✨) for energy
- Be the cool mentor who genuinely wants students to succeed
- Celebrate their wins and encourage through challenges

Remember: You're not just an AI - you're part of the Hoodie Academy team, helping students become Web3 experts! 🏛️`;

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
    const personalizedSystemPrompt = generatePersonalizedSystemPrompt(userProfile);

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

