'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home, ArrowDown, ArrowRight, LockKeyhole, CheckCircle, LineChart, Clock, Filter, Shield } from "lucide-react";
import { MilestoneBadge } from "@/components/course-roadmap/MilestoneBadge";
import { RiskArt } from "@/components/course-roadmap/RiskArt";
import { HoodieIcon } from "@/components/icons/HoodieIcon";
import type { CourseCardProps } from "@/components/course-roadmap/CourseCard";
import { CourseCard } from "@/components/course-roadmap/CourseCard";
import { PixelHoodieIcon } from "@/components/icons/PixelHoodieIcon";
import { SaberHoodieIcon } from "@/components/icons/SaberHoodieIcon";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { GlowingCoinIcon } from "@/components/icons/GlowingCoinIcon";
import TokenGate from "@/components/TokenGate";
import { Card, CardContent } from "@/components/ui/card";
import { squadTracks, getSquadForCourse, getCoursesForSquad } from "@/lib/squadData";
import { isCurrentUserAdmin, getConnectedWallet, getCompletedCoursesCount } from "@/lib/utils";
import { fetchUserByWallet } from "@/lib/supabase";

// Simple course data
const allCourses: Array<{
  id: string;
  title: string;
  description: string;
  badge: string;
  emoji: string;
  pathType: "tech" | "social" | "converged";
  href: string;
  localStorageKey?: string;
  totalLessons?: number;
  category?: string;
  level?: string;
  access?: string;
}> = [
  {
    id: 'wallet-wizardry',
    title: "Wallet Wizardry",
    description: "Master wallet setup with interactive quizzes and MetaMask integration.",
    badge: "Vault Keeper",
    emoji: "🔒",
    pathType: "tech",
    href: "/wallet-wizardry",
    localStorageKey: "walletWizardryProgress",
    totalLessons: 4,
  },
  {
    id: 'nft-mastery',
    title: "NFT Mastery",
    description: "Learn the ins and outs of NFTs, from creation to trading and community building, with interactive quizzes and mock minting.",
    badge: "NFT Ninja",
    emoji: "👾",
    pathType: "tech",
    href: "/nft-mastery",
    localStorageKey: "nftMasteryProgress",
    totalLessons: 4,
  },
  {
    id: 'meme-coin-mania',
    title: "Meme Coin Mania",
    description: "Analyze meme coin trends via X data, build a mock portfolio, and learn to navigate hype with live price tracking and interactive quizzes.",
    badge: "Moon Merchant",
    emoji: "💰",
    pathType: "social",
    href: "/meme-coin-mania",
    localStorageKey: "memeCoinManiaProgress",
    totalLessons: 4,
  },
  {
    id: 'community-strategy',
    title: "Community Strategy", 
    description: "Master the art of social dynamics to foster loyal and active Web3 communities through interactive lessons and mock DAO voting.",
    badge: "Hoodie Strategist",
    emoji: "🗣️",
    pathType: "social",
    href: "/community-strategy",
    localStorageKey: "communityStrategyProgress",
    totalLessons: 4,
  },
  {
    id: 'sns',
    title: "SNS Simplified",
    description: "Learn to register and manage .sol domain names through interactive tutorials and simulations in the Solana Name Service ecosystem.",
    badge: "Domain Dominator",
    emoji: "🌐",
    pathType: "social",
    href: "/sns",
    localStorageKey: "snsProgress",
    totalLessons: 2,
  },
  {
    id: 'technical-analysis',
    title: "Technical Analysis Tactics",
    description: "Master chart patterns, indicators, and leverage trading to navigate market trends.",
    badge: "Chart Commander",
    emoji: "📈", 
    pathType: "tech",
    href: "/technical-analysis",
    localStorageKey: "technicalAnalysisProgress",
    totalLessons: 4,
  },
  // Free Courses
  {
    id: 'domain-psychology-101',
    title: 'H100 🧠 Domain Psychology 101: Why Names Matter',
    description: 'Learn how names affect perception, memorability, and brand potential. Activities: Name dissection, psychological triggers, fake bio exercise.',
    badge: 'Free',
    emoji: '🟢',
    pathType: 'tech',
    href: '#',
    category: 'Free',
    level: 'Beginner',
    access: 'Open to All',
  },
  {
    id: 'domain-archetypes-usecases',
    title: 'H120 🧾 Domain Archetypes & Use Cases',
    description: 'Learn how to identify grails, meme domains, bot handles, brand names, and more. Tier-making assignment: sort domains into Hold, Flip, or Forget.',
    badge: 'Free',
    emoji: '🟢',
    pathType: 'tech',
    href: '#',
    category: 'Free',
    level: 'Beginner',
    access: 'Open to All',
  },
  {
    id: 'lorecrafting-subdomains',
    title: 'H150 🌀 LoreCrafting with Subdomains',
    description: 'Use subdomains to expand worlds, squads, or characters. Bonus: Write your own fictional lore for x.hoodieacademy.sol',
    badge: 'Free',
    emoji: '🟢',
    pathType: 'tech',
    href: '#',
    category: 'Free',
    level: 'Beginner',
    access: 'Open to All',
  },
  // Hoodie-Gated Courses
  {
    id: 'sns-strategy-domains',
    title: 'H200 🛠️ SNS Strategy: Domains as Digital Real Estate',
    description: 'Treat domains like virtual land. Learn about utility, delegation, vaulting, and marketing. Case studies: vaultdegen.sol, kimono.sol, xflow.sol',
    badge: 'Hoodie-Gated',
    emoji: '🔵',
    pathType: 'tech',
    href: '#',
    category: 'Hoodie-Gated',
    level: 'Intermediate–Advanced',
    access: 'Must Hold a WifHoodie',
  },
  {
    id: 'budget-bidding-sniping',
    title: 'H220 💰 Budget Bidding & Sniping 101',
    description: 'Master the art of sniping undervalued gems, watching trend cycles, and flipping smart. Tools: SNS filters, sale feeds, expiration radar.',
    badge: 'Hoodie-Gated',
    emoji: '🔵',
    pathType: 'tech',
    href: '#',
    category: 'Hoodie-Gated',
    level: 'Intermediate–Advanced',
    access: 'Must Hold a WifHoodie',
  },
  {
    id: 'multiuse-domains-teamops',
    title: 'H250 🔗 Multi-Use Domains & Team Operations',
    description: 'How to use 1 name across bots, brand, subdomains, and squad ops. Example: ops.kongx.sui as a naming system.',
    badge: 'Hoodie-Gated',
    emoji: '🔵',
    pathType: 'tech',
    href: '#',
    category: 'Hoodie-Gated',
    level: 'Intermediate–Advanced',
    access: 'Must Hold a WifHoodie',
  },
  // Elite Courses
  {
    id: 'narrative-economics',
    title: 'H300 🧠 Narrative Economics: Naming as a Meme Asset',
    description: 'Explore how names create emotional and economic value. Breakdown: “unrelenting.sol” vs “drainerhunter.sol” — which wins and why?',
    badge: 'Elite',
    emoji: '🟣',
    pathType: 'tech',
    href: '#',
    category: 'Elite',
    level: 'Expert',
    access: 'Special Hoodie or Completion Badge Required',
  },
  {
    id: 'advanced-domain-psychology',
    title: 'H400 🎯 Advanced Domain Psychology: Positioning & Power',
    description: 'Deep psychology of control, archetype alignment, domain energy. Assignment: Curate 5-domain lineup that tells a story through vibes alone.',
    badge: 'Elite',
    emoji: '🟣',
    pathType: 'tech',
    href: '#',
    category: 'Elite',
    level: 'Expert',
    access: 'Special Hoodie or Completion Badge Required',
  },
  {
    id: 'domain-warfare-ecosystem',
    title: 'H500 ⚔️ Domain Warfare & Ecosystem Domination',
    description: 'How to build a multi-domain empire across ecosystems. Planning long-term value with name cohesion, alt-chain deployment, and DAO strategies',
    badge: 'Elite',
    emoji: '🟣',
    pathType: 'tech',
    href: '#',
    category: 'Elite',
    level: 'Expert',
    access: 'Special Hoodie or Completion Badge Required',
  },
  // NFT Track - Free Courses
  {
    id: 'nft-marketplaces-101',
    title: 'N100 🎨 NFT Marketplaces 101: Where the Magic Happens',
    description: 'Learn the layout and core functions of platforms like Magic Eden, Tensor, and Exchange.art. Topics: Listing, bidding, collections, and activity tabs. Demo: Walkthrough on placing your first bid and listing a hoodie.',
    badge: 'Free',
    emoji: '🟢',
    pathType: 'tech',
    href: '#',
    category: 'Free',
    level: 'Beginner',
    access: 'Open to All',
  },
  {
    id: 'nft-lingo-decoded',
    title: 'N120 🧠 NFT Lingo Decoded',
    description: 'What do people mean by: “WAGMI,” “undercut,” “sweeping,” “thin floor,” “rank 4”? Glossary + matching game. Bonus: Learn 10 common red flags and exit signals in community hype cycles.',
    badge: 'Free',
    emoji: '🟢',
    pathType: 'tech',
    href: '#',
    category: 'Free',
    level: 'Beginner',
    access: 'Open to All',
  },
  {
    id: 'bids-listings-floor-games',
    title: 'N150 💸 Bids, Listings, and Floor Games',
    description: 'The difference between a bid and a listing. How to ladder your bids and listings for optimal exposure. Simple strategy: How to catch a panic undercut during a meta shift.',
    badge: 'Free',
    emoji: '🟢',
    pathType: 'tech',
    href: '#',
    category: 'Free',
    level: 'Beginner',
    access: 'Open to All',
  },
  // NFT Track - Hoodie-Gated Courses
  {
    id: 'trait-meta-rarity-mindset',
    title: 'N200 🧩 Trait Meta & Rarity Mindset',
    description: 'Understanding perceived rarity vs actual rarity. When rarity doesn\'t matter (liquidity meta) and when it wins (trait meta flips). Case Study: WifHoodie, Popkins, SMB Gen3',
    badge: 'Hoodie-Gated',
    emoji: '🔵',
    pathType: 'tech',
    href: '#',
    category: 'Hoodie-Gated',
    level: 'Intermediate',
    access: 'Requires WifHoodie',
  },
  {
    id: 'pricing-psychology-anchor-points',
    title: 'N220 🧠 Pricing Psychology & Anchor Points',
    description: 'How buyers make emotional pricing decisions. Anchor theory: Why people won\'t buy your rare if the floor is too low. Activity: Set realistic, aggressive, and greedy listings for the same NFT.',
    badge: 'Hoodie-Gated',
    emoji: '🔵',
    pathType: 'tech',
    href: '#',
    category: 'Hoodie-Gated',
    level: 'Intermediate',
    access: 'Requires WifHoodie',
  },
  {
    id: 'spotting-surfing-trend-waves',
    title: 'N250 📈 Spotting & Surfing Trend Waves',
    description: 'What is a "meta"? How to use volume, listings, and Twitter hype to identify shifts. Tools: txs.cool, floorbots, whale wallets.',
    badge: 'Hoodie-Gated',
    emoji: '🔵',
    pathType: 'tech',
    href: '#',
    category: 'Hoodie-Gated',
    level: 'Intermediate',
    access: 'Requires WifHoodie',
  },
  // NFT Track - Elite Courses
  {
    id: 'identity-trading-collector-archetypes',
    title: 'N300 🧠 Identity Trading & Collector Archetypes',
    description: 'Understand how different buyers think: The flipper, The grail hunter, The lore-maxi, The status buyer. How to price to them… or become one.',
    badge: 'Elite',
    emoji: '🟣',
    pathType: 'tech',
    href: '#',
    category: 'Elite',
    level: 'Advanced',
    access: 'Completion Badge or Invite Only',
  },
  {
    id: 'longterm-vs-shortterm-thesis',
    title: 'N400 🔮 Long-Term vs Short-Term Thesis',
    description: 'When to play rotations, when to bet on grails, and when to walk away. Timing exits based on macro + micro cycles. Activity: Build your own thesis sheet for 3 NFT projects and design a rotation strategy.',
    badge: 'Elite',
    emoji: '🟣',
    pathType: 'tech',
    href: '#',
    category: 'Elite',
    level: 'Advanced',
    access: 'Completion Badge or Invite Only',
  },
  {
    id: 'emotional-discipline-dopamine-economy',
    title: 'N500 🧠 Emotional Discipline & The Dopamine Economy',
    description: 'Why NFTs feel different from trading coins. How to spot overexposure, burnout, and cognitive dissonance. Methods: mindfulness tracking, setting exit rules, reflecting post-trade.',
    badge: 'Elite',
    emoji: '🟣',
    pathType: 'tech',
    href: '#',
    category: 'Elite',
    level: 'Advanced',
    access: 'Completion Badge or Invite Only',
  },
  // Trading & Indicators - Free Courses
  {
    id: 'lines-to-candles',
    title: 'T100 🕹️ From Lines to Candles: Chart Literacy 101',
    description: 'What’s a candle? What’s a wick? What’s a trend? Learn basic candlestick anatomy (open, close, high, low). Tools: TradingView, Coinhall, or DexScreener basics. Demo: How to switch to candle view and draw basic trend lines.',
    badge: 'Free',
    emoji: '🟢',
    pathType: 'tech',
    href: '#',
    category: 'Free',
    level: 'Beginner',
    access: 'Open to All',
  },
  {
    id: 'support-resistance-volume',
    title: 'T120 🔄 Support, Resistance & Volume Zones',
    description: 'Learn how to identify simple breakout points and accumulation areas. Horizontal levels vs psychological levels (e.g. $1, $3.33, $10). Bonus: Study charts of coins that ran in past cycles.',
    badge: 'Free',
    emoji: '🟢',
    pathType: 'tech',
    href: '#',
    category: 'Free',
    level: 'Beginner',
    access: 'Open to All',
  },
  {
    id: 'intro-to-indicators',
    title: 'T150 🎯 Intro to Indicators: RSI, BBands, Fib Levels',
    description: 'What RSI tells you about overbought/oversold. Bollinger Bands: contraction → expansion logic. Fibonacci retracement and how it\'s more emotional than precise.',
    badge: 'Free',
    emoji: '🟢',
    pathType: 'tech',
    href: '#',
    category: 'Free',
    level: 'Beginner',
    access: 'Open to All',
  },
  // Trading & Indicators - Hoodie-Gated Courses
  {
    id: 'confluence-indicators',
    title: 'T200 🧠 Confluence: When Indicators Agree',
    description: 'How to combine RSI + Fib + trendlines for better setups. Simple rule: Don’t enter until 2+ indicators align. Real chart breakdowns: SOL, JUP, MEMECOINS.',
    badge: 'Hoodie-Gated',
    emoji: '🔵',
    pathType: 'tech',
    href: '#',
    category: 'Hoodie-Gated',
    level: 'Intermediate',
    access: 'Requires WifHoodie',
  },
  {
    id: 'stoploss-targets-emotional-traps',
    title: 'T250 📉 Stop Losses, Targets, and Emotional Traps',
    description: 'How to place effective stop losses that don’t get wicked out. Avoiding FOMO entries and “revenge trades.” Tracking your own risk profile with a trade journal template.',
    badge: 'Hoodie-Gated',
    emoji: '🔵',
    pathType: 'tech',
    href: '#',
    category: 'Hoodie-Gated',
    level: 'Intermediate',
    access: 'Requires WifHoodie',
  },
  {
    id: 'pair-charts-relative-strength',
    title: 'T280 📊 Pair Charts & Relative Strength',
    description: 'Why looking at JUP/SOL or BONK/SOL reveals more than USD charts. Identifying when alts are gaining vs bleeding.',
    badge: 'Hoodie-Gated',
    emoji: '🔵',
    pathType: 'tech',
    href: '#',
    category: 'Hoodie-Gated',
    level: 'Intermediate',
    access: 'Requires WifHoodie',
  },
  // Trading & Indicators - Kimono DAO-Gated Courses
  {
    id: 'ichimoku-cloud-masterclass',
    title: 'T300 ☁️ Ichimoku Cloud Masterclass: Trading Through the Fog',
    description: 'Understand Kumo, Tenkan-sen, Kijun-sen, Chikou Span, and more. Learn how the cloud gives you a visual system for trend, entry, and exit. Live breakdowns of current charts with full indicator overlays.',
    badge: 'Kimono DAO-Gated',
    emoji: '🟣',
    pathType: 'tech',
    href: '#',
    category: 'Kimono DAO-Gated',
    level: 'Advanced',
    access: 'Must Hold Kimono DAO Role or Pass Exam',
  },
  {
    id: 'advanced-indicator-synergy',
    title: 'T350 🧬 Advanced Indicator Synergy',
    description: 'How to stack Ichimoku, MACD, BBWP, and trendlines without clutter. Building your own “entry checklist.” Recognizing fractal patterns across timeframes.',
    badge: 'Kimono DAO-Gated',
    emoji: '🟣',
    pathType: 'tech',
    href: '#',
    category: 'Kimono DAO-Gated',
    level: 'Advanced',
    access: 'Must Hold Kimono DAO Role or Pass Exam',
  },
  {
    id: 'staying-in-the-game',
    title: 'T400 🧠 Staying in the Game: Discipline > Alpha',
    description: 'The mental game of trading: avoid tilt, regret, and overconfidence. Guided reflection exercises. How to build an emotional stop loss, not just a chart stop.',
    badge: 'Kimono DAO-Gated',
    emoji: '🟣',
    pathType: 'tech',
    href: '#',
    category: 'Kimono DAO-Gated',
    level: 'Advanced',
    access: 'Must Hold Kimono DAO Role or Pass Exam',
  },
  // Trading & Indicators - Bonus Unlock
  {
    id: 'cinema-alpha-ep01',
    title: '🎬 Cinema Alpha: EP01 – Point Break & The Art of Risk',
    description: 'Complete this Track and unlock: What Bodhi and Johnny Utah can teach you about trading discipline and when to walk away.',
    badge: 'Bonus',
    emoji: '🎥',
    pathType: 'tech',
    href: '#',
    category: 'Bonus',
    level: 'Special',
    access: 'Track Completion Required',
  },
  // Cybersecurity & Wallet Best Practices - Free Courses
  {
    id: 'wallet-why-care',
    title: 'C100 🔐 What Is a Wallet & Why You Need to Care',
    description: 'Hot vs Cold Wallets. What is a seed phrase? Why you *never* share it. Wallet types: Phantom, Backpack, Ledger, mobile wallets. Activity: Create a burner wallet for experimentation.',
    badge: 'Free',
    emoji: '🟢',
    pathType: 'tech',
    href: '#',
    category: 'Free',
    level: 'Beginner',
    access: 'Open to All',
  },
  {
    id: 'browser-hygiene-setup',
    title: 'C120 🧭 Browser Hygiene & Setup',
    description: 'Use separate browsers or profiles (e.g. Brave for trading, Chrome for real life). Extensions to avoid vs trusted tools. How to lock down your browser permissions.',
    badge: 'Free',
    emoji: '🟢',
    pathType: 'tech',
    href: '#',
    category: 'Free',
    level: 'Beginner',
    access: 'Open to All',
  },
  {
    id: 'spot-the-scam',
    title: 'C150 🛑 Spot the Scam: Phishing, Drainers & Impersonators',
    description: 'Learn to identify fake X links, airdrops, and DM traps. Real examples from past phishing attacks. Red flag checklist: domains, formatting, urgency, etc. Activity: Scam or legit? Quiz walkthrough.',
    badge: 'Free',
    emoji: '🟢',
    pathType: 'tech',
    href: '#',
    category: 'Free',
    level: 'Beginner',
    access: 'Open to All',
  },
  // Cybersecurity & Wallet Best Practices - Hoodie-Gated Courses
  {
    id: 'wallet-segmentation',
    title: 'C200 🧱 Wallet Segmentation: Hot, Warm, and Cold Wallet Theory',
    description: 'One wallet is never enough. Suggested structure: Hot = minting & daily use, Warm = NFTs & mid-term assets, Cold = long-term vault. How to route between wallets safely.',
    badge: 'Hoodie-Gated',
    emoji: '🔵',
    pathType: 'tech',
    href: '#',
    category: 'Hoodie-Gated',
    level: 'Intermediate',
    access: 'Requires WifHoodie',
  },
  {
    id: 'transaction-simulators-revokers',
    title: 'C220 🔄 Transaction Simulators & Revokers',
    description: 'How to simulate transactions before signing (Blowfish, SolanaFM, etc). Token approval management. Revoke tool tutorial + how to check connected sites.',
    badge: 'Hoodie-Gated',
    emoji: '🔵',
    pathType: 'tech',
    href: '#',
    category: 'Hoodie-Gated',
    level: 'Intermediate',
    access: 'Requires WifHoodie',
  },
  {
    id: 'ghost-mode-opsec',
    title: 'C250 👻 Ghost Mode: OpSec for Traders & Community Leaders',
    description: 'How to avoid leaking your identity. Privacy-preserving tools (VPN, 2FA apps, secure notes). Using burner emails, aliases, and phone numbers. Activity: Build your own “Degen Identity Kit”.',
    badge: 'Hoodie-Gated',
    emoji: '🔵',
    pathType: 'tech',
    href: '#',
    category: 'Hoodie-Gated',
    level: 'Intermediate',
    access: 'Requires WifHoodie',
  },
  // Cybersecurity & Wallet Best Practices - Kimono DAO/Elite Courses
  {
    id: 'real-world-doxxing-defense',
    title: 'C300 ⚔️ Real World Doxxing & Defense Scenarios',
    description: 'Stories of people who got exposed (and how). What to do if your wallet is compromised. Risk matrix: Threat levels by exposure.',
    badge: 'Kimono DAO-Gated',
    emoji: '🟣',
    pathType: 'tech',
    href: '#',
    category: 'Kimono DAO-Gated',
    level: 'Advanced',
    access: 'Kimono DAO Only',
  },
  {
    id: 'asset-recovery-multisig',
    title: 'C350 🛡️ Asset Recovery, Insurance & Multi-Sig Basics',
    description: 'What to do *after* the damage. Emergency protocols and wallet freezes. Intro to multisigs (how DAOs & teams protect shared wallets).',
    badge: 'Kimono DAO-Gated',
    emoji: '🟣',
    pathType: 'tech',
    href: '#',
    category: 'Kimono DAO-Gated',
    level: 'Advanced',
    access: 'Kimono DAO Only',
  },
  {
    id: 'digital-mindfulness',
    title: 'C400 🧠 Digital Mindfulness: Staying Paranoid Without Burning Out',
    description: 'How to stay cautious without becoming jaded. Daily checklists, password cycles, and team trust dynamics. Meditation for OpSec? Yeah, we said it.',
    badge: 'Kimono DAO-Gated',
    emoji: '🟣',
    pathType: 'tech',
    href: '#',
    category: 'Kimono DAO-Gated',
    level: 'Advanced',
    access: 'Kimono DAO Only',
  },
  // AI + Automation Curriculum - Hoodie-Gated (AI Literacy Path)
  {
    id: 'llm-plain-english',
    title: 'A100 🤖 What is an LLM? Understanding AI in Plain English',
    description: 'Difference between ChatGPT, Claude, Gemini, and open-source LLMs. What LLMs actually do: tokens, context windows, hallucinations. Activity: Run the same prompt through 3 different LLMs and compare answers.',
    badge: 'Hoodie-Gated',
    emoji: '🤖',
    pathType: 'tech',
    href: '#',
    category: 'AI Literacy Path',
    level: 'Beginner–Intermediate',
    access: 'Requires WifHoodie',
  },
  {
    id: 'ai-key-vocab',
    title: 'A120 📚 Key Vocab: RAG, One-Shot, Two-Shot & Prompt Types',
    description: 'Definitions: RAG = Retrieval-Augmented Generation, One-shot vs few-shot prompting, Temperature, system prompts, context injection. Quiz: Match the term to the use case.',
    badge: 'Hoodie-Gated',
    emoji: '🤖',
    pathType: 'tech',
    href: '#',
    category: 'AI Literacy Path',
    level: 'Beginner–Intermediate',
    access: 'Requires WifHoodie',
  },
  {
    id: 'intro-prompt-engineering',
    title: 'A150 🧠 Intro to Prompt Engineering',
    description: 'Basic frameworks: Chain of Thought, Roleplay prompting, Format-locking. Assignment: Build your own reusable prompt template for your squad (Creator, Decoder, etc.)',
    badge: 'Hoodie-Gated',
    emoji: '🤖',
    pathType: 'tech',
    href: '#',
    category: 'AI Literacy Path',
    level: 'Beginner–Intermediate',
    access: 'Requires WifHoodie',
  },
  {
    id: 'ai-safety-ethics',
    title: 'A180 🛡️ AI Safety & Ethics in Web3',
    description: 'Why prompt injection matters. How to avoid accidentally leaking personal data or wallet info. OpenAI, Anthropic, and alignment goals. Bonus: When should you trust an agent?',
    badge: 'Hoodie-Gated',
    emoji: '🤖',
    pathType: 'tech',
    href: '#',
    category: 'AI Literacy Path',
    level: 'Beginner–Intermediate',
    access: 'Requires WifHoodie',
  },
  {
    id: 'intermediate-prompting-llm-custom',
    title: 'A200 🛠️ Intermediate Prompting & LLM Customization',
    description: 'Structured prompting for documents, bots, and storytelling. Intro to: System messages, Custom instructions, API playgrounds. Bonus: "Agent Personality Design" for Hoodies or bots.',
    badge: 'Hoodie-Gated',
    emoji: '🤖',
    pathType: 'tech',
    href: '#',
    category: 'AI Literacy Path',
    level: 'Beginner–Intermediate',
    access: 'Requires WifHoodie',
  },
  // AI + Automation Curriculum - Automation Path (Gated)
  {
    id: 'what-is-automation',
    title: 'AU100 🔗 What Is Automation? Understanding the Stack',
    description: 'What tools do what: Notion, Make.com, Zapier, Dify, Airtable. “If this, then that” logic for Web3 use cases. Use cases: tweet scheduling, Notion content flows, form data handling.',
    badge: 'Automation-Gated',
    emoji: '⚙️',
    pathType: 'tech',
    href: '#',
    category: 'Automation Path',
    level: 'Beginner',
    access: 'Requires Hoodie',
  },
  {
    id: 'airtable-notion-databases',
    title: 'AU150 📊 Beginner’s Guide to Airtable + Notion as Databases',
    description: 'How automations “talk” to each other. Create your first database with tags and filters. Activity: Build a Hoodie Content Tracker board.',
    badge: 'Automation-Gated',
    emoji: '⚙️',
    pathType: 'tech',
    href: '#',
    category: 'Automation Path',
    level: 'Beginner',
    access: 'Requires Hoodie',
  },
  {
    id: 'agent-demos-readonly',
    title: 'AU199 🧪 Agent Demos (Read-Only)',
    description: 'Example video of a live Dify agent performing a task. Anatomy of an automation: input → parse → trigger. Not editable. Pure observation. If you want to build — you join the DAO.',
    badge: 'Automation-Gated',
    emoji: '⚙️',
    pathType: 'tech',
    href: '#',
    category: 'Automation Path',
    level: 'Beginner',
    access: 'Requires Hoodie',
  },
  // AI + Automation Curriculum - Graduation Unlock
  {
    id: 'ai-graduation-unlock',
    title: '🎓 AI + Automation Graduation Unlock',
    description: 'Completion of this curriculum gives you: Badge: AI-Certified Hoodie, Access to the AI Squad Chat, Invitation to test the first Hoodie Agent workflow.',
    badge: 'Unlock',
    emoji: '🔓',
    pathType: 'tech',
    href: '#',
    category: 'Graduation',
    level: 'Special',
    access: 'Curriculum Completion',
  },
  // Lore & Narrative Crafting Curriculum - Free Courses
  {
    id: 'what-is-lore',
    title: 'L100 ✍️ What is Lore? Why Storytelling Matters in Web3',
    description: 'Lore as glue: how it builds community, brand identity, and cultural memory. Real-world examples: Pudgy Penguins, SMB lore, Milady threads. Activity: Write a 2–3 sentence myth about your hoodie.',
    badge: 'Free',
    emoji: '🟢',
    pathType: 'tech',
    href: '#',
    category: 'Free',
    level: 'Beginner',
    access: 'Open to All',
  },
  {
    id: 'archetypes-identity-nft',
    title: 'L120 🧠 Archetypes & Identity in NFT Projects',
    description: 'Carl Jung meets Web3: the Explorer, the Degen, the Gatekeeper, etc. Which archetypes are baked into Hoodie Academy? Quiz: Pick your archetype from 12 prompts.',
    badge: 'Free',
    emoji: '🟢',
    pathType: 'tech',
    href: '#',
    category: 'Free',
    level: 'Beginner',
    access: 'Open to All',
  },
  {
    id: 'personal-lore-hoodie-identity',
    title: 'L150 🧩 Personal Lore & Hoodie Identity',
    description: 'Who is your hoodie? Where are they from? What squad do they belong to? Create your character sheet: Name, Traits, Background, Core philosophy. Bonus: LoreMate Template for use in community posts.',
    badge: 'Free',
    emoji: '🟢',
    pathType: 'tech',
    href: '#',
    category: 'Free',
    level: 'Beginner',
    access: 'Open to All',
  },
  // Lore & Narrative Crafting Curriculum - Hoodie-Gated Courses
  {
    id: 'building-hoodie-world',
    title: 'L200 🏙️ Building Hoodie Academy as a Living World',
    description: 'Map the dojo, the squads, the relics, and rival factions. Design locations (Archives, Radio Tower, Creator’s Workshop, etc). Activity: Submit a location concept + describe what it looks like.',
    badge: 'Hoodie-Gated',
    emoji: '🔵',
    pathType: 'tech',
    href: '#',
    category: 'Hoodie-Gated',
    level: 'Intermediate',
    access: 'Requires WifHoodie',
  },
  {
    id: 'factions-portals-conflict',
    title: 'L220 🌀 Factions, Portals & Narrative Conflict',
    description: 'Every world needs tension. Learn to create healthy “vs” dynamics without community drama. Write your own squad’s first conflict or challenge.',
    badge: 'Hoodie-Gated',
    emoji: '🔵',
    pathType: 'tech',
    href: '#',
    category: 'Hoodie-Gated',
    level: 'Intermediate',
    access: 'Requires WifHoodie',
  },
  {
    id: 'threadweaving-x-posts',
    title: 'L250 🧵 Threadweaving: Translating Lore into X Posts',
    description: 'Take a piece of lore and reframe it as a community post, meme, or teaser. Teach the basics of writing for attention vs immersion. Bonus: Meme + Lore Fusion = the most shareable format.',
    badge: 'Hoodie-Gated',
    emoji: '🔵',
    pathType: 'tech',
    href: '#',
    category: 'Hoodie-Gated',
    level: 'Intermediate',
    access: 'Requires WifHoodie',
  },
  // Lore & Narrative Crafting Curriculum - Elite/DAO-Gated Courses
  {
    id: 'masterclass-symbolism-themes',
    title: 'L300 🧙‍♂️ Masterclass in Symbolism & Recurring Themes',
    description: 'Understand how to weave themes over time: Growth, Abandonment, Rebirth, Masking/unmasking. Activity: Trace one of these themes across Hoodie lore.',
    badge: 'Elite/DAO-Gated',
    emoji: '🟣',
    pathType: 'tech',
    href: '#',
    category: 'Elite/DAO-Gated',
    level: 'Advanced',
    access: 'Must Join Kimono DAO or Lead Squad',
  },
  {
    id: 'rituals-relics-world-consistency',
    title: 'L350 🧙‍♀️ Rituals, Relics, and World Lore Consistency',
    description: 'How to keep lore consistent across squad content. Design rituals, seasonal events, or relics with specific powers. Example: The Lost Scroll of Decoders.',
    badge: 'Elite/DAO-Gated',
    emoji: '🟣',
    pathType: 'tech',
    href: '#',
    category: 'Elite/DAO-Gated',
    level: 'Advanced',
    access: 'Must Join Kimono DAO or Lead Squad',
  },
  {
    id: 'collaborative-lore-building',
    title: 'L400 🧠 Collaborative Lore Building (DAO Format)',
    description: 'Factional writing, wiki structuring, and lore governance. Organizing canon vs headcanon. Building out a lore-based quest system or future expansion module.',
    badge: 'Elite/DAO-Gated',
    emoji: '🟣',
    pathType: 'tech',
    href: '#',
    category: 'Elite/DAO-Gated',
    level: 'Advanced',
    access: 'Must Join Kimono DAO or Lead Squad',
  },
  // Lore & Narrative Crafting Curriculum - Completion Unlock
  {
    id: 'lore-completion-unlock',
    title: '🎓 Lore & Narrative Completion Unlock',
    description: 'Unlocks concept preview for Cinema Alpha EP02: “White Men Can’t Jump” – Pride vs Pattern. Optional invite to join the Lorekeepers Guild — DAO\'s inner circle of writers.',
    badge: 'Unlock',
    emoji: '🎓',
    pathType: 'tech',
    href: '#',
    category: 'Completion',
    level: 'Special',
    access: 'Curriculum Completion',
  },
];

// Collab Courses Placeholder Data
const collabCourses: Array<Omit<CourseCardProps, 'isCompleted' | 'progress' | 'isAdmin' | 'onResetCourse'>> = [
  {
    id: 'gecko-floor-psychology',
    title: 'Gekko Floor Psychology',
    description: 'A 1-module drop hosted by Galactic Geckos. Placeholder content.\nInstructor: @GalacticTrader | Format: Written PDF / Thread / Short Video (1–2 min) | Track: Trading Psychology',
    badge: 'Collab',
    emoji: '🦎',
    pathType: 'tech',
    href: '#',
  },
  {
    id: 'sniping-galaxy-floors',
    title: 'Sniping Galaxy Floors: Gecko Risk Systems',
    description: 'Placeholder for future lesson content.\nInstructor: @GeckoSavage | Format: Short Video | Track: Trading Psychology',
    badge: 'Collab',
    emoji: '🦎',
    pathType: 'tech',
    href: '#',
  },
  {
    id: 'dao-missions-engagement',
    title: 'DAO Missions & Engagement: Gamifying Participation',
    description: 'Placeholder for future lesson content.\nInstructor: @LoreLizard | Format: Written | Track: Onboarding & Community',
    badge: 'Collab',
    emoji: '🦎',
    pathType: 'tech',
    href: '#',
  }
];

const ADMIN_PASSWORD = "darkhoodie";

type FilterType = 'all' | 'squads' | 'completed' | 'collab';

export default function CoursesPage() {
  const [courseCompletionStatus, setCourseCompletionStatus] = useState<Record<string, { completed: boolean, progress: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isAdminBypass, setIsAdminBypass] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedSquad, setSelectedSquad] = useState<string | null>(null);
  const [userSquad, setUserSquad] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    // Get wallet address from localStorage
    const storedWallet = localStorage.getItem('walletAddress') || localStorage.getItem('connectedWallet');
    
    // Check if user is admin using Supabase
    const checkAdminStatus = async () => {
      if (storedWallet) {
        try {
          const user = await fetchUserByWallet(storedWallet);
          setIsAdmin(user?.is_admin || false);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();

    // Get user's squad assignment
    const squadResult = localStorage.getItem('userSquad');
    if (squadResult) {
      try {
        const result = JSON.parse(squadResult);
        // Handle both object and string formats
        if (typeof result === 'object' && result.id) {
          setUserSquad(result.id);
        } else if (typeof result === 'object' && result.name) {
          setUserSquad(result.name);
        } else if (typeof result === 'string') {
          setUserSquad(result);
        }
      } catch (error) {
        setUserSquad(squadResult);
      }
    }

    const getCompletionInfo = (key: string): { completed: boolean, progress: number } => {
      if (typeof window !== 'undefined') {
        const savedStatus = localStorage.getItem(key);
        if (savedStatus) {
          try {
            const parsedStatus: Array<'locked' | 'unlocked' | 'completed'> = JSON.parse(savedStatus);
            const completedLessons = parsedStatus.filter(s => s === 'completed').length;
            const totalLessons = parsedStatus.length;
            const progress = Math.round((completedLessons / totalLessons) * 100);
            const isCompleted = progress === 100;
            return { completed: isCompleted, progress };
          } catch (e) {
            console.error("Failed to parse course progress from localStorage for key:", key, e);
            return { completed: false, progress: 0 };
          }
        }
      }
      return { completed: false, progress: 0 };
    };

    const status: Record<string, { completed: boolean, progress: number }> = {};
    allCourses.forEach(course => {
      if (course.localStorageKey) {
        status[course.localStorageKey] = getCompletionInfo(course.localStorageKey);
      }
    });
    
    console.log('Courses page loaded:', {
      totalCourses: allCourses.length,
      courseStatus: status,
      userSquad: userSquad,
      isAdmin: isAdmin,
      isAdminBypass: isAdminBypass,
      isLoading: false,
      allCourses: allCourses.map(c => ({ id: c.id, title: c.title })),
      completedCoursesCount: getCompletedCoursesCount(),
      localStorageData: allCourses.map(c => ({
        id: c.id,
        key: c.localStorageKey,
        data: c.localStorageKey ? localStorage.getItem(c.localStorageKey) : null
      }))
    });
    
    setCourseCompletionStatus(status);
    setIsLoading(false);
  }, [userSquad, isAdmin]);

  const handlePasswordSubmit = () => {
    if (passwordAttempt === ADMIN_PASSWORD) {
      setIsAdminBypass(true);
      setPasswordError("");
      setShowPasswordInput(false);
    } else {
      setPasswordError("Incorrect password. Please try again.");
    }
  };

  const resetAllCourses = () => {
    if (window.confirm('Are you sure you want to reset all course progress? This action cannot be undone.')) {
      // Clear all course progress from localStorage
      allCourses.forEach(course => {
        if (course.localStorageKey) {
          localStorage.removeItem(course.localStorageKey);
        }
      });
      
      // Clear final exam results
      localStorage.removeItem('walletWizardryFinalExamPassed');
      
      // Clear placement test results
      localStorage.removeItem('userSquad');
      
      // Clear onboarding completion
      localStorage.removeItem('onboardingCompleted');
      
      // Refresh the page to update the UI
      window.location.reload();
    }
  };

  const resetIndividualCourse = (courseId: string) => {
    const course = allCourses.find(c => c.id === courseId);
    if (!course || !course.localStorageKey) return;
    
    if (window.confirm(`Are you sure you want to reset progress for "${course.title}"? This action cannot be undone.`)) {
      localStorage.removeItem(course.localStorageKey);
      
      // If it's wallet wizardry, also clear the final exam
      if (courseId === 'wallet-wizardry') {
        localStorage.removeItem('walletWizardryFinalExamPassed');
      }
      
      // Refresh the page to update the UI
      window.location.reload();
    }
  };

  // Filter courses based on active filter, selected squad, and user's squad
  const getFilteredCourses = () => {
    let filteredCourses = allCourses;

    console.log('Filtering courses:', {
      activeFilter,
      selectedSquad,
      userSquad,
      isAdmin,
      isAdminBypass,
      totalCourses: allCourses.length
    });

    // Apply filters based on active filter
    switch (activeFilter) {
      case 'completed':
        const completedCourses = filteredCourses.filter(course => 
          course.localStorageKey && courseCompletionStatus[course.localStorageKey]?.completed
        );
        console.log('Completed courses filter:', {
          totalFiltered: filteredCourses.length,
          completedCount: completedCourses.length,
          completedCourses: completedCourses.map(c => ({ id: c.id, title: c.title })),
          courseStatus: courseCompletionStatus
        });
        return completedCourses;
      case 'squads':
        if (selectedSquad) {
          // Show courses for selected squad
          const squadCourseIds = getCoursesForSquad(selectedSquad);
          const squadCourses = filteredCourses.filter(course => squadCourseIds.includes(course.id));
          console.log('Selected squad courses:', squadCourses.length);
          return squadCourses;
        } else if (!isAdmin && !isAdminBypass && userSquad) {
          // Show courses for user's squad when no specific squad is selected
          const squadCourseIds = getCoursesForSquad(userSquad);
          const userSquadCourses = filteredCourses.filter(course => squadCourseIds.includes(course.id));
          console.log('User squad courses:', userSquadCourses.length);
          return userSquadCourses;
        }
        console.log('All courses (squads filter):', filteredCourses.length);
        return filteredCourses;
      default:
        // For 'all' filter, show all courses regardless of squad restrictions
        // The 'all' tab should show all courses, regardless of squad restrictions
        console.log('All courses (all filter):', filteredCourses.length);
        return filteredCourses;
    }
  };

  const completedCoursesCount = getCompletedCoursesCount();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <span className="text-cyan-400 text-2xl animate-pulse">Loading courses...</span>
      </div>
    );
  }

  return (
    <TokenGate>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900 to-slate-900"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="relative z-10 p-8">
          {/* Header */}
          <div className="text-center mb-12">
            {/* Home Navigation Button */}
            <div className="flex justify-start mb-6">
              <Button
                asChild
                variant="outline"
                className="bg-slate-800/50 hover:bg-slate-700/50 text-cyan-400 hover:text-cyan-300 border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300"
              >
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent glow-text">
              The Hoodie Path
            </h1>
            <p className="text-xl text-gray-300 mb-2">Your Quest to Hoodie Scholar.</p>
            <p className="text-cyan-300 text-lg">
              Current Time: <span className="text-green-400 font-mono">{currentTime}</span>
            </p>

            {/* Squad Information */}
            {userSquad && !isAdmin && (
              <div className="mt-6">
                <Card className="max-w-md mx-auto bg-slate-800/50 border-2 border-yellow-500/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-center space-x-3">
                      <span className="text-yellow-400 text-lg">🎯</span>
                      <div className="text-center">
                        <p className="text-yellow-400 font-semibold">Your Squad Track</p>
                        <p className="text-gray-300 text-sm">
                          {typeof userSquad === 'string' 
                            ? (squadTracks.find(s => s.id === userSquad)?.name || userSquad)
                            : 'Unknown Squad'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Admin Access Notice */}
            {isAdmin && (
              <div className="mt-6">
                <Card className="max-w-md mx-auto bg-slate-800/50 border-2 border-purple-500/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-center space-x-3">
                      <Shield className="w-5 h-5 text-purple-400" />
                      <div className="text-center">
                        <p className="text-purple-400 font-semibold">Admin Access</p>
                        <p className="text-gray-300 text-sm">Password authenticated - viewing all courses</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* No Squad Notice */}
            {!userSquad && !isAdmin && (
              <div className="mt-6">
                <Card className="max-w-md mx-auto bg-slate-800/50 border-2 border-orange-500/30 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-center space-x-3">
                      <span className="text-orange-400 text-lg">⚠️</span>
                      <div className="text-center">
                        <p className="text-orange-400 font-semibold">Squad Assignment Required</p>
                        <p className="text-gray-300 text-sm">Take the placement test to unlock your courses</p>
                        <Button
                          asChild
                          size="sm"
                          className="mt-2 bg-orange-600 hover:bg-orange-700"
                        >
                          <Link href="/placement/squad-test">
                            Take Placement Test
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-2 bg-slate-800/50 p-2 rounded-lg border border-cyan-500/30">
              <Button
                variant={activeFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setActiveFilter('all');
                  setSelectedSquad(null);
                }}
                className={activeFilter === 'all' 
                  ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
                  : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                }
              >
                All Courses
              </Button>
              <Button
                variant={activeFilter === 'squads' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveFilter('squads')}
                className={activeFilter === 'squads' 
                  ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
                  : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                }
              >
                Squad Tracks
              </Button>
              <Button
                variant={activeFilter === 'completed' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveFilter('completed')}
                className={activeFilter === 'completed' 
                  ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
                  : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                }
              >
                Completed ({completedCoursesCount})
              </Button>
              <Button
                variant={activeFilter === 'collab' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveFilter('collab')}
                className={activeFilter === 'collab' 
                  ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
                  : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                }
              >
                Collab Courses
              </Button>
            </div>
          </div>

          {/* Squad Selection (when squads filter is active) */}
          {activeFilter === 'squads' && (
            <div className="flex justify-center mb-8">
              <div className="flex flex-wrap gap-3 max-w-4xl">
                {squadTracks.map((squad) => (
                  <Button
                    key={squad.id}
                    variant={selectedSquad === squad.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSquad(selectedSquad === squad.id ? null : squad.id)}
                    className={`${selectedSquad === squad.id 
                      ? `${squad.bgColor} ${squad.borderColor} border` 
                      : 'bg-slate-800/50 border-slate-600/50 text-gray-300 hover:bg-slate-700/50'
                    } transition-all duration-300`}
                  >
                    <span className="mr-2">{squad.icon}</span>
                    {squad.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Admin bypass section */}
          {!isAdminBypass && (
            <div className="text-center mb-8">
              <Button
                onClick={() => setShowPasswordInput(true)}
                variant="outline"
                className="bg-slate-800/50 hover:bg-slate-700/50 text-cyan-400 hover:text-cyan-300 border-cyan-500/30"
              >
                Admin Bypass
              </Button>
            </div>
          )}

          {/* Revoke bypass section */}
          {isAdminBypass && (
            <div className="text-center mb-8 space-y-4">
              <Card className="max-w-md mx-auto bg-slate-800/50 border-2 border-green-500/30 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center space-x-3">
                    <span className="text-green-400 text-lg">🔓</span>
                    <span className="text-green-400 font-semibold">Admin Bypass Active</span>
                    <Button
                      onClick={() => setIsAdminBypass(false)}
                      variant="outline"
                      size="sm"
                      className="bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border-red-500/50 hover:border-red-400/50"
                    >
                      Revoke Bypass
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Reset Courses Button */}
              <Card className="max-w-md mx-auto bg-slate-800/50 border-2 border-orange-500/30 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center space-y-3">
                    <span className="text-orange-400 text-lg">⚠️</span>
                    <span className="text-orange-400 font-semibold text-center">Admin Actions</span>
                    <Button
                      onClick={resetAllCourses}
                      variant="outline"
                      size="sm"
                      className="bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 hover:text-orange-300 border-orange-500/50 hover:border-orange-400/50"
                    >
                      Reset All Course Progress
                    </Button>
                    <p className="text-xs text-gray-400 text-center">
                      This will clear all course progress, exam results, and squad placement
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {showPasswordInput && (
            <Card className="max-w-md mx-auto mb-8 bg-slate-800/50 border-2 border-cyan-500/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-cyan-400 mb-4">Admin Access</h3>
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={passwordAttempt}
                  onChange={(e) => setPasswordAttempt(e.target.value)}
                  className="mb-4 bg-slate-700/50 border-cyan-500/30 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                />
                {passwordError && <p className="text-red-400 text-sm mb-4">{passwordError}</p>}
                <div className="flex space-x-2">
                  <Button onClick={handlePasswordSubmit} className="bg-cyan-600 hover:bg-cyan-700">
                    Submit
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowPasswordInput(false);
                      setPasswordAttempt("");
                      setPasswordError("");
                    }}
                    variant="outline"
                    className="border-cyan-500/30 text-cyan-400 hover:text-cyan-300"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Courses Display */}
          {activeFilter === 'collab' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {collabCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description}
                  badge={course.badge}
                  emoji={course.emoji}
                  pathType={course.pathType}
                  href={course.href}
                  isCompleted={false}
                  progress={0}
                  isAdmin={false}
                  onResetCourse={undefined}
                />
              ))}
            </div>
          ) : activeFilter === 'squads' && selectedSquad ? (
            // Show courses for selected squad
            <div className="space-y-8">
              {squadTracks.filter(s => s.id === selectedSquad).map((squad) => (
                <div key={squad.id} className="space-y-6">
                  <div className="text-center">
                    <h2 className={`text-3xl font-bold mb-2 ${squad.color} glow-text flex items-center justify-center gap-3`}>
                      <span>{squad.icon}</span>
                      {squad.name}
                    </h2>
                    <p className="text-gray-300 max-w-2xl mx-auto">{squad.description}</p>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {getFilteredCourses().map((course) => (
                      <CourseCard
                        key={course.id}
                        id={course.id}
                        title={course.title}
                        description={course.description}
                        badge={course.badge}
                        emoji={course.emoji}
                        pathType={course.pathType}
                        href={course.href}
                        isCompleted={course.localStorageKey ? courseCompletionStatus[course.localStorageKey]?.completed : false}
                        progress={course.localStorageKey ? courseCompletionStatus[course.localStorageKey]?.progress : 0}
                        isAdmin={isAdminBypass}
                        onResetCourse={resetIndividualCourse}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Show all courses or completed courses
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {getFilteredCourses().map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description}
                  badge={course.badge}
                  emoji={course.emoji}
                  pathType={course.pathType}
                  href={course.href}
                  isCompleted={course.localStorageKey ? courseCompletionStatus[course.localStorageKey]?.completed : false}
                  progress={course.localStorageKey ? courseCompletionStatus[course.localStorageKey]?.progress : 0}
                  isAdmin={isAdminBypass}
                  onResetCourse={resetIndividualCourse}
                />
              ))}
            </div>
          )}

          {/* Great Hoodie Hall */}
          <div className="text-center mt-12">
            <Card className="max-w-2xl mx-auto bg-slate-800/80 border-2 border-yellow-500/40 backdrop-blur-sm shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:shadow-[0_0_40px_rgba(234,179,8,0.5)] transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center justify-center mb-4">
                  <span className="text-4xl mr-3">🏆</span>
                  <h2 className="text-3xl font-bold text-yellow-400 glow-text">Great Hoodie Hall</h2>
                </div>
                <p className="text-gray-300 mb-6">
                  Access exclusive resources, advanced strategies, and the Hoodie community hub.
                </p>
                <Button
                  asChild
                  className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)] transition-all duration-300 transform hover:scale-105"
                >
                  <Link href="/great-hoodie-hall">
                    Enter the Hall
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Footer hashtags */}
          <div className="mt-12 text-cyan-400/70 text-sm text-center">#StayBuilding #StayHODLing</div>
        </div>
        <style jsx global>{`
          .glow-text {
            text-shadow: 0 0 10px currentColor;
          }
        `}</style>
      </div>
    </TokenGate>
  );
}
