'use client'

import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useSwipeable } from 'react-swipeable';
import { motion } from 'framer-motion';
import { PixelHoodieIcon } from "@/components/icons/PixelHoodieIcon";
import { ArrowLeft, CheckCircle, XCircle, Award, AlertTriangle, Wallet, ChevronDown, ChevronUp, Lock, Unlock } from 'lucide-react';
import { fetchCourseProgress, updateCourseProgress, getCachedLessonStatus, LessonStatus } from '@/utils/course-progress-api';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import { updateScoreForQuizCompletion } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import type { SolanaWallet } from '@/types/wallet';

// Unify provider type across the app
type ProviderLike = SolanaWallet;

type WalletProviderOption = 'phantom';

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
  correctAnswerId: string;
  explanation?: string;
}

interface Lesson {
  id: string;
  title: string;
  content: React.ReactNode;
  quiz: QuizQuestion[];
  pitfallWarning?: React.ReactNode;
  requiresHoodie?: boolean;
  level: 'free' | 'hoodie' | 'elite';
}

const lessonsData: Lesson[] = [
  {
    id: 'n100',
    title: 'N100: NFT Marketplaces 101 - Where the Magic Happens',
    level: 'free',
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-green-500">🎨 Free Course - No Hoodie Required</h3>
          <p className="mb-4">Learn how NFT marketplaces actually work. Understand the features, tools, and flow of transactions.</p>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>Marketplace Navigation:</strong> Magic Eden, Tensor, Exchange.art breakdowns</li>
              <li>• <strong>How to List/Bid:</strong> Hands-on interface basics</li>
              <li>• <strong>Reading the Feed:</strong> Listings, bids, and recent activity explained</li>
              <li>• <strong>Assignment:</strong> Successfully list and bid on a WifHoodie or mock NFT in demo environment</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"Welcome to the Market: Exploring Tensor & Magic Eden"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1n100', 
        text: 'What is the primary function of an NFT marketplace?', 
        options: [
          {id: 'o1', text: 'To create new cryptocurrencies'},
          {id: 'o2', text: 'To buy, sell, and trade NFTs'},
          {id: 'o3', text: 'To mine new blocks on the blockchain'},
          {id: 'o4', text: 'To store digital art files'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "NFT marketplaces are platforms where users can buy, sell, and trade NFTs. They provide the interface and infrastructure for NFT transactions."
      },
      { 
        id: 'q2n100', 
        text: 'Which of these is NOT a popular Solana NFT marketplace?', 
        options: [
          {id: 'o1', text: 'Magic Eden'},
          {id: 'o2', text: 'Tensor'},
          {id: 'o3', text: 'OpenSea'},
          {id: 'o4', text: 'Exchange.art'}
        ], 
        correctAnswerId: 'o3', 
        explanation: "OpenSea is primarily an Ethereum marketplace. Magic Eden, Tensor, and Exchange.art are popular Solana NFT marketplaces."
      },
      { 
        id: 'q3n100', 
        text: 'What does "floor price" refer to in NFT trading?', 
        options: [
          {id: 'o1', text: 'The highest price an NFT has ever sold for'},
          {id: 'o2', text: 'The lowest current asking price for an NFT in a collection'},
          {id: 'o3', text: 'The original mint price of the NFT'},
          {id: 'o4', text: 'The average price of all sales in a collection'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "Floor price is the lowest current asking price for an NFT in a collection, representing the minimum cost to acquire one."
      },
    ],
  },
  {
    id: 'n120',
    title: 'N120: NFT Lingo Decoded',
    level: 'free',
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-green-500">🧠 Free Course - No Hoodie Required</h3>
          <p className="mb-4">Crack the slang and jargon of degen trading. Language = awareness.</p>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>Common Phrases:</strong> Undercut, sweep, thin floor, grail, rank</li>
              <li>• <strong>Contextual Meaning:</strong> When each term matters</li>
              <li>• <strong>Red Flags:</strong> 10 terms that signal sketchy behavior or exit risk</li>
              <li>• <strong>Mini Game:</strong> Matching exercise quiz for Discord</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"Talk Like a Degen: Mastering the Jargon"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1n120', 
        text: 'What does "undercut" mean in NFT trading?', 
        options: [
          {id: 'o1', text: 'To buy an NFT at a higher price than others'},
          {id: 'o2', text: 'To list an NFT at a lower price than the current floor'},
          {id: 'o3', text: 'To cancel a listing'},
          {id: 'o4', text: 'To bid on multiple NFTs at once'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "Undercutting means listing an NFT at a price lower than the current floor price, often to sell quickly."
      },
      { 
        id: 'q2n120', 
        text: 'What is a "sweep" in NFT trading?', 
        options: [
          {id: 'o1', text: 'Buying multiple NFTs from a collection at once'},
          {id: 'o2', text: 'Selling all your NFTs'},
          {id: 'o3', text: 'Reporting a scam to moderators'},
          {id: 'o4', text: 'Joining a Discord server'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "A sweep is when someone buys multiple NFTs from a collection in a short period, often to accumulate or manipulate the market."
      },
      { 
        id: 'q3n120', 
        text: 'What does "thin floor" refer to?', 
        options: [
          {id: 'o1', text: 'A collection with very few listings'},
          {id: 'o2', text: 'A marketplace with low trading volume'},
          {id: 'o3', text: 'An NFT with poor image quality'},
          {id: 'o4', text: 'A wallet with insufficient funds'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "A thin floor means there are very few NFTs listed for sale in a collection, making the market more volatile."
      },
    ],
  },
  {
    id: 'n150',
    title: 'N150: Bids, Listings, and Floor Games',
    level: 'free',
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-green-500">💸 Free Course - No Hoodie Required</h3>
          <p className="mb-4">Master the mechanics of getting in and out of trades with precision.</p>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>Bids vs Listings:</strong> What they do, who sees them</li>
              <li>• <strong>Laddering Strategy:</strong> Build visibility across a pricing curve</li>
              <li>• <strong>Sniping Tactics:</strong> How to catch panic undercuts during meta shifts</li>
              <li>• <strong>Exercise:</strong> Create a 3-step floor ladder plan for a live collection</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"Floor Games: Outsmarting the Average Trader"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1n150', 
        text: 'What is the main difference between a bid and a listing?', 
        options: [
          {id: 'o1', text: 'Bids are always higher than listings'},
          {id: 'o2', text: 'Listings are offers to sell, bids are offers to buy'},
          {id: 'o3', text: 'Bids cost more in fees'},
          {id: 'o4', text: 'Listings are only visible to the owner'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "Listings are offers to sell NFTs at a specific price, while bids are offers to buy NFTs at a specific price."
      },
      { 
        id: 'q2n150', 
        text: 'What is "laddering" in NFT trading?', 
        options: [
          {id: 'o1', text: 'Climbing the leaderboard rankings'},
          {id: 'o2', text: 'Placing multiple bids at different price levels'},
          {id: 'o3', text: 'Joining multiple Discord servers'},
          {id: 'o4', text: 'Creating multiple wallet addresses'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "Laddering involves placing multiple bids at different price levels to increase the chances of acquiring an NFT."
      },
      { 
        id: 'q3n150', 
        text: 'What is "sniping" in NFT trading?', 
        options: [
          {id: 'o1', text: 'Reporting scams to moderators'},
          {id: 'o2', text: 'Quickly buying undervalued NFTs before others notice'},
          {id: 'o3', text: 'Selling all your NFTs at once'},
          {id: 'o4', text: 'Joining a collection\'s Discord server'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "Sniping is the practice of quickly buying undervalued NFTs before other traders can react to the opportunity."
      },
    ],
  },
  {
    id: 'n200',
    title: 'N200: Trait Meta & Rarity Mindset',
    level: 'hoodie',
    requiresHoodie: true,
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-blue-500">🧩 Hoodie-Gated Course - Requires WifHoodie</h3>
          <p className="mb-4">Not all rarity is created equal. Learn when it matters—and when it's a distraction.</p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>Perceived vs True Rarity:</strong> How market narrative distorts value</li>
              <li>• <strong>Liquidity Meta vs Trait Meta:</strong> Different environments, different winners</li>
              <li>• <strong>Case Studies:</strong> WifHoodie (velvet vest), Popkins (Goana skins), SMB Gen3 (horns/meta)</li>
              <li>• <strong>Assignment:</strong> Identify 3 collections where trait value shifts over time</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"Trait Bait: When Rarity Lies"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1n200', 
        text: 'What is "perceived rarity" in NFT trading?', 
        options: [
          {id: 'o1', text: 'The actual statistical rarity of a trait'},
          {id: 'o2', text: 'How rare the market thinks a trait is'},
          {id: 'o3', text: 'The number of NFTs with a specific trait'},
          {id: 'o4', text: 'The original mint price of rare NFTs'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "Perceived rarity is how rare the market believes a trait to be, which can differ from actual statistical rarity."
      },
      { 
        id: 'q2n200', 
        text: 'What is "liquidity meta" in NFT trading?', 
        options: [
          {id: 'o1', text: 'Trading only the most liquid NFTs'},
          {id: 'o2', text: 'A market environment where liquidity is more important than traits'},
          {id: 'o3', text: 'Using liquid staking protocols'},
          {id: 'o4', text: 'Selling NFTs for stablecoins'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "Liquidity meta refers to market conditions where having liquid assets is more valuable than having rare traits."
      },
      { 
        id: 'q3n200', 
        text: 'Why might trait value shift over time in a collection?', 
        options: [
          {id: 'o1', text: 'The blockchain changes the rarity'},
          {id: 'o2', text: 'Market narrative and community preferences evolve'},
          {id: 'o3', text: 'The NFT images get corrupted'},
          {id: 'o4', text: 'The marketplace updates its interface'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "Trait values shift as market narratives change and community preferences evolve over time."
      },
    ],
  },
  {
    id: 'n220',
    title: 'N220: Pricing Psychology & Anchor Points',
    level: 'hoodie',
    requiresHoodie: true,
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-blue-500">🧠 Hoodie-Gated Course - Requires WifHoodie</h3>
          <p className="mb-4">Understand how emotional anchors influence pricing decisions.</p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>Anchor Theory:</strong> First impressions set future expectations</li>
              <li>• <strong>Why Grails Rot:</strong> When pricing too high loses attention</li>
              <li>• <strong>Emotional Listings:</strong> FOMO, regret, and sunk cost effects</li>
              <li>• <strong>Exercise:</strong> Set 3 prices for the same NFT — realistic, aggressive, greedy — and justify each</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"Priced to Sit, Priced to Sell: Understanding Buyer Psychology"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1n220', 
        text: 'What is "anchor theory" in pricing psychology?', 
        options: [
          {id: 'o1', text: 'The theory that prices always go up'},
          {id: 'o2', text: 'The idea that first impressions set future price expectations'},
          {id: 'o3', text: 'The belief that NFTs should be priced in SOL'},
          {id: 'o4', text: 'The practice of anchoring NFTs to physical objects'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "Anchor theory suggests that the first price someone sees for an NFT influences their future price expectations."
      },
      { 
        id: 'q2n220', 
        text: 'Why might "grails" (rare NFTs) sometimes "rot" (not sell)?', 
        options: [
          {id: 'o1', text: 'They are too rare to find buyers'},
          {id: 'o2', text: 'They are priced too high and lose market attention'},
          {id: 'o3', text: 'The blockchain rejects the transaction'},
          {id: 'o4', text: 'The marketplace is down for maintenance'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "Grails can 'rot' when priced too high, causing them to lose market attention and become illiquid."
      },
      { 
        id: 'q3n220', 
        text: 'What is "FOMO" in NFT trading?', 
        options: [
          {id: 'o1', text: 'Fear of Missing Out - buying due to fear of missing an opportunity'},
          {id: 'o2', text: 'Friends of Market Operators'},
          {id: 'o3', text: 'Fast Order Market Operations'},
          {id: 'o4', text: 'Floor Order Market Opportunities'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "FOMO (Fear of Missing Out) is the anxiety that leads to buying NFTs due to fear of missing a potential opportunity."
      },
    ],
  },
  {
    id: 'n250',
    title: 'N250: Spotting & Surfing Trend Waves',
    level: 'hoodie',
    requiresHoodie: true,
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-blue-500">📈 Hoodie-Gated Course - Requires WifHoodie</h3>
          <p className="mb-4">Learn to identify meta shifts and ride them early.</p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>What Is a Meta?:</strong> Timing and patterns of narrative waves</li>
              <li>• <strong>Tools:</strong> Txs.cool, floorbot Twitter bots, Tensor analytics</li>
              <li>• <strong>How Trends Form:</strong> Volume spikes, influencer volume, auction bait</li>
              <li>• <strong>Assignment:</strong> Track 3 meta shifts over 1 week and report your entries/exits</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"Meta Surfing: Catching the Next Wave Before It Peaks"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1n250', 
        text: 'What is a "meta" in NFT trading?', 
        options: [
          {id: 'o1', text: 'The most expensive NFT in a collection'},
          {id: 'o2', text: 'A dominant strategy or trend in the current market'},
          {id: 'o3', text: 'The metadata of an NFT'},
          {id: 'o4', text: 'The marketplace interface'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "A meta refers to the dominant strategy or trend that's currently working in the NFT market."
      },
      { 
        id: 'q2n250', 
        text: 'What tool is commonly used to track NFT trading activity?', 
        options: [
          {id: 'o1', text: 'Txs.cool'},
          {id: 'o2', text: 'Google Analytics'},
          {id: 'o3', text: 'MetaMask'},
          {id: 'o4', text: 'Discord'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Txs.cool is a popular tool for tracking NFT trading activity and market movements."
      },
      { 
        id: 'q3n250', 
        text: 'What typically indicates a meta shift is happening?', 
        options: [
          {id: 'o1', text: 'Volume spikes in certain collections'},
          {id: 'o2', text: 'All NFTs going to zero'},
          {id: 'o3', text: 'Marketplaces shutting down'},
          {id: 'o4', text: 'Blockchain congestion'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Volume spikes in certain collections often indicate that a meta shift is occurring as traders move capital."
      },
    ],
  },
  {
    id: 'n300',
    title: 'N300: Identity Trading & Collector Archetypes',
    level: 'elite',
    requiresHoodie: true,
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-purple-500">🧠 Elite Course - Completion Badge or Invite Only</h3>
          <p className="mb-4">Study buyer psychology across personas and use it to predict behavior.</p>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>Trader Types:</strong> Flipper, grail hunter, lore-maxi, whitelist grinder, sniper</li>
              <li>• <strong>Behavioral Patterns:</strong> Listings, bid placement, and Discord tells</li>
              <li>• <strong>Counter-Trading:</strong> How to act against predictable behavior for edge</li>
              <li>• <strong>Assignment:</strong> Match 5 recent listings to archetypes and explain your reads</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"Inside the Mind of a Degen: Trader Archetypes Decoded"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1n300', 
        text: 'What is a "flipper" in NFT trading?', 
        options: [
          {id: 'o1', text: 'Someone who buys and sells NFTs quickly for profit'},
          {id: 'o2', text: 'A tool used to flip NFT images'},
          {id: 'o3', text: 'A type of NFT marketplace'},
          {id: 'o4', text: 'A Discord bot for trading'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "A flipper is someone who buys and sells NFTs quickly, often within hours or days, to capture short-term profits."
      },
      { 
        id: 'q2n300', 
        text: 'What is a "grail hunter" in NFT trading?', 
        options: [
          {id: 'o1', text: 'Someone who searches for the rarest, most valuable NFTs'},
          {id: 'o2', text: 'A tool for finding lost NFTs'},
          {id: 'o3', text: 'A type of trading bot'},
          {id: 'o4', text: 'Someone who hunts for whitelist spots'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "A grail hunter is someone who specifically searches for the rarest and most valuable NFTs in collections."
      },
      { 
        id: 'q3n300', 
        text: 'What is "counter-trading" in NFT psychology?', 
        options: [
          {id: 'o1', text: 'Trading against predictable behavior patterns for advantage'},
          {id: 'o2', text: 'Counting the number of trades made'},
          {id: 'o3', text: 'Trading only during certain hours'},
          {id: 'o4', text: 'Using multiple wallets to trade'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Counter-trading involves acting against predictable behavior patterns to gain an advantage in the market."
      },
    ],
  },
];

export default function NftTradingPsychologyPage() {
  const { wallet: userWallet } = useWalletSupabase();
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [lessonStatus, setLessonStatus] = useState<LessonStatus[]>(
    new Array(lessonsData.length).fill('locked')
  );
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizResults, setQuizResults] = useState<Record<string, boolean>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [hasHoodie, setHasHoodie] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [progress, setProgress] = useState(0);

  const COURSE_SLUG = 'nft-trading-psychology';

  const saveProgress = async (newStatus: LessonStatus[]) => {
    setLessonStatus(newStatus);
    if (userWallet) await updateCourseProgress(userWallet, COURSE_SLUG, newStatus);
  };

  const resetWalletState = () => {
    setWalletConnected(false);
    setWalletAddress('');
    setHasHoodie(false);
  };

  const handleWalletConnection = async (providerName: WalletProviderOption) => {
    try {
      const provider = typeof window !== 'undefined' ? window.solana : undefined;
      if (!provider) {
        console.error('Solana wallet not found');
        return;
      }
      
      // Connect only if not already connected
      if (!provider.publicKey) {
        try {
          await provider.connect({ onlyIfTrusted: true } as any);
        } catch {
          await provider.connect();
        }
      }
      
      if (!provider.publicKey) {
        console.error('Solana wallet public key is null after connection');
        return;
      }
      
      setWalletConnected(true);
      setWalletAddress(provider.publicKey.toString());
        
        // Check if user has a WifHoodie
        const connection = new Connection('https://api.mainnet-beta.solana.com');
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          new PublicKey(provider.publicKey.toString()),
          { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
        );
        
        // Check for WifHoodie token (you'll need to replace with actual token mint address)
        const hoodieTokenMint = 'YOUR_WIFHOODIE_TOKEN_MINT_ADDRESS';
        const hasHoodieToken = tokenAccounts.value.some(account => 
          account.account.data.parsed.info.mint === hoodieTokenMint
        );
        
        setHasHoodie(hasHoodieToken);
        
        // Check admin status
        const hash = (str: string) => str.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0);
        const adminWallets = ['YOUR_ADMIN_WALLET_ADDRESS'];
        const isAdminWallet = adminWallets.includes(provider.publicKey.toString());
        setIsAdmin(isAdminWallet);
        
        // Unlock first lesson for all users
        const newStatus = [...lessonStatus];
        newStatus[0] = 'unlocked';
        saveProgress(newStatus);
        
      } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const handleOptionChange = (questionId: string, optionId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleQuizSubmit = () => {
    const currentLesson = lessonsData[currentLessonIndex];
    const results: Record<string, boolean> = {};
    let correctCount = 0;
    
    currentLesson.quiz.forEach(question => {
      const userAnswer = selectedAnswers[question.id];
      const isCorrect = userAnswer === question.correctAnswerId;
      results[question.id] = isCorrect;
      if (isCorrect) correctCount++;
    });
    
    setQuizResults(results);
    setShowQuizResults(true);
    
    const passRate = (correctCount / currentLesson.quiz.length) * 100;
    
    if (passRate >= 75) {
      const newStatus = [...lessonStatus];
      newStatus[currentLessonIndex] = 'completed';
      
      if (currentLessonIndex < lessonsData.length - 1) {
        newStatus[currentLessonIndex + 1] = 'unlocked';
      }
      
      saveProgress(newStatus);
      updateScoreForQuizCompletion(walletAddress, 'nft-trading-psychology', passRate, currentLesson.quiz.length, currentLessonIndex + 1, lessonsData.length);
    }
  };

  const handleNextLesson = () => {
    if (currentLessonIndex < lessonsData.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
      setSelectedAnswers({});
      setQuizResults({});
      setShowQuizResults(false);
    }
  };

  const handlePreviousLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
      setSelectedAnswers({});
      setQuizResults({});
      setShowQuizResults(false);
    }
  };

  const handleAdminPasswordSubmit = () => {
    if (adminPassword === 'hoodieadmin2024') {
      setIsAdmin(true);
      const newStatus: Array<'locked' | 'unlocked' | 'completed'> = lessonStatus.map(() => 'unlocked');
      saveProgress(newStatus);
      setShowAdminDialog(false);
      setAdminPassword('');
    }
  };

  const resetAllProgress = () => {
    const newStatus = new Array(lessonsData.length).fill('locked');
    newStatus[0] = 'unlocked';
    saveProgress(newStatus);
    setCurrentLessonIndex(0);
    setSelectedAnswers({});
    setQuizResults({});
    setShowQuizResults(false);
  };

  useEffect(() => {
    const savedProgress = localStorage.getItem(localStorageKey);
    if (savedProgress) {
      const parsedProgress = JSON.parse(savedProgress);
      setLessonStatus(parsedProgress);
    } else {
      const initialStatus = new Array(lessonsData.length).fill('locked');
      initialStatus[0] = 'unlocked';
      saveProgress(initialStatus);
    }
  }, []);

  useEffect(() => {
    const completedCount = lessonStatus.filter(status => status === 'completed').length;
    const totalLessons = lessonsData.length;
    setProgress((completedCount / totalLessons) * 100);
  }, [lessonStatus]);

  const currentLesson = lessonsData[currentLessonIndex];
  const canAccessLesson = currentLesson.level === 'free' || 
                         (currentLesson.level === 'hoodie' && hasHoodie) ||
                         (currentLesson.level === 'elite' && hasHoodie);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/courses">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Courses
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <PixelHoodieIcon className="w-8 h-8" />
              <h1 className="text-3xl font-bold">NFT Trading Psychology</h1>
            </div>
          </div>
          
          {isAdmin && (
            <Button onClick={resetAllProgress} variant="outline" className="text-white border-white hover:bg-white/10">
              Reset Progress
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Course Progress</span>
            <span className="text-sm text-gray-300">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Wallet Connection */}
        {!walletConnected && (
          <Card className="mb-8 bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="text-center">
                <Wallet className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
                <p className="text-gray-300 mb-4">Connect your Solana wallet to access the course and track your progress.</p>
                <Button onClick={() => handleWalletConnection('phantom')} className="bg-blue-600 hover:bg-blue-700">
                  Connect Phantom Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Course Content */}
        {walletConnected && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Lesson Navigation */}
            <div className="lg:col-span-1">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Course Modules</h3>
                  <div className="space-y-2">
                    {lessonsData.map((lesson, index) => {
                      const isLocked = lessonStatus[index] === 'locked';
                      const isCompleted = lessonStatus[index] === 'completed';
                      const isCurrent = index === currentLessonIndex;
                      const canAccess = lesson.level === 'free' || 
                                      (lesson.level === 'hoodie' && hasHoodie) ||
                                      (lesson.level === 'elite' && hasHoodie);

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            if (!isLocked) {
                              setCurrentLessonIndex(index);
                              setSelectedAnswers({});
                              setQuizResults({});
                              setShowQuizResults(false);
                            }
                          }}
                          className={`w-full text-left p-3 rounded-lg transition-all ${
                            isCurrent 
                              ? 'bg-blue-600 text-white' 
                              : isCompleted 
                                ? 'bg-green-600/20 text-green-300' 
                                : isLocked 
                                  ? 'bg-gray-600/20 text-gray-400 cursor-not-allowed' 
                                  : 'bg-white/5 hover:bg-white/10 text-white'
                          }`}
                          disabled={isLocked}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {isCompleted ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : isLocked ? (
                                <Lock className="w-4 h-4" />
                              ) : (
                                <Unlock className="w-4 h-4" />
                              )}
                              <span className="text-sm font-medium">{lesson.title}</span>
                            </div>
                            <div className={`text-xs px-2 py-1 rounded ${
                              lesson.level === 'free' ? 'bg-green-600/20 text-green-300' :
                              lesson.level === 'hoodie' ? 'bg-blue-600/20 text-blue-300' :
                              'bg-purple-600/20 text-purple-300'
                            }`}>
                              {lesson.level.toUpperCase()}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6">
                  {!canAccessLesson ? (
                    <div className="text-center py-12">
                      <Lock className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                      <h3 className="text-xl font-semibold mb-2">Course Locked</h3>
                      <p className="text-gray-300 mb-4">
                        This course requires a WifHoodie NFT to access. Connect a wallet with a WifHoodie to continue.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Lesson Content */}
                      <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">{currentLesson.title}</h2>
                        <div className="prose prose-invert max-w-none">
                          {currentLesson.content}
                        </div>
                      </div>

                      {/* Quiz */}
                      {!showQuizResults && (
                        <div className="space-y-6">
                          <h3 className="text-xl font-semibold">Quiz</h3>
                          {currentLesson.quiz.map((question) => (
                            <div key={question.id} className="space-y-3">
                              <p className="font-medium">{question.text}</p>
                              <RadioGroup
                                value={selectedAnswers[question.id] || ''}
                                onValueChange={(value) => handleOptionChange(question.id, value)}
                              >
                                {question.options.map((option) => (
                                  <div key={option.id} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option.id} id={option.id} />
                                    <Label htmlFor={option.id} className="cursor-pointer">
                                      {option.text}
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </div>
                          ))}
                          <Button 
                            onClick={handleQuizSubmit}
                            disabled={Object.keys(selectedAnswers).length < currentLesson.quiz.length}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Submit Quiz
                          </Button>
                        </div>
                      )}

                      {/* Quiz Results */}
                      {showQuizResults && (
                        <div className="space-y-6">
                          <h3 className="text-xl font-semibold">Quiz Results</h3>
                          {currentLesson.quiz.map((question) => {
                            const userAnswer = selectedAnswers[question.id];
                            const isCorrect = userAnswer === question.correctAnswerId;
                            
                            return (
                              <div key={question.id} className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  {isCorrect ? (
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-red-400" />
                                  )}
                                  <p className="font-medium">{question.text}</p>
                                </div>
                                {question.explanation && (
                                  <p className="text-sm text-gray-300 ml-7">
                                    {question.explanation}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                          
                          <div className="flex space-x-4">
                            {currentLessonIndex > 0 && (
                              <Button onClick={handlePreviousLesson} variant="outline">
                                Previous Lesson
                              </Button>
                            )}
                            {currentLessonIndex < lessonsData.length - 1 && (
                              <Button onClick={handleNextLesson} className="bg-blue-600 hover:bg-blue-700">
                                Next Lesson
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Admin Dialog */}
        <AlertDialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Admin Access</AlertDialogTitle>
              <AlertDialogDescription>
                Enter admin password to unlock all lessons.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full p-2 border rounded text-black"
                placeholder="Enter password"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleAdminPasswordSubmit}>
                Submit
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
} 