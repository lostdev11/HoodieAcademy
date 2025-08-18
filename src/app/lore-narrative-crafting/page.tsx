'use client'

import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { ArrowLeft, CheckCircle, XCircle, Lock, Unlock, BookOpen, AlertTriangle, Wallet, PenTool, Users, Target, Trophy, ArrowRight } from 'lucide-react';
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
import type { SolanaWallet } from "@/types/wallet";

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
  level: 'free' | 'hoodie' | 'dao';
  requiresHoodie?: boolean;
  requiresDao?: boolean;
}

const lessonsData: Lesson[] = [
  {
    id: 'l100',
    title: 'L100: What is Lore? Why Storytelling Matters in Web3',
    level: 'free',
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-green-500">✍️ Free Course - No Hoodie Required</h3>
          <p className="mb-4">Understand the value of narrative in decentralized communities.</p>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>Lore = Cultural Glue:</strong> Connection, memory, identity</li>
              <li>• <strong>Examples:</strong> Pudgy Penguins, SMB lore maps, Milady threads</li>
              <li>• <strong>Mini Exercise:</strong> Write a myth about your hoodie's origin in 2–3 sentences</li>
              <li>• <strong>Bonus Discussion:</strong> Why memes with lore outperform those without</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"Lore is Liquidity: Why Stories Matter in NFTs"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1l100', 
        text: 'What is lore in the context of Web3 communities?', 
        options: [
          {id: 'o1', text: 'A type of cryptocurrency'},
          {id: 'o2', text: 'Stories and narratives that create cultural connection'},
          {id: 'o3', text: 'A blockchain protocol'},
          {id: 'o4', text: 'A trading strategy'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "Lore refers to stories and narratives that create cultural connection, memory, and identity within Web3 communities."
      },
      { 
        id: 'q2l100', 
        text: 'Why do memes with lore outperform those without?', 
        options: [
          {id: 'o1', text: 'They have better graphics'},
          {id: 'o2', text: 'They create deeper emotional connections and community bonds'},
          {id: 'o3', text: 'They are more expensive'},
          {id: 'o4', text: 'They are easier to trade'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "Memes with lore create deeper emotional connections and community bonds, making them more valuable and memorable."
      },
      { 
        id: 'q3l100', 
        text: 'What is the primary function of lore in NFT communities?', 
        options: [
          {id: 'o1', text: 'To increase token prices'},
          {id: 'o2', text: 'To create cultural glue and community identity'},
          {id: 'o3', text: 'To attract investors'},
          {id: 'o4', text: 'To improve blockchain performance'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "Lore serves as cultural glue, creating community identity and fostering deeper connections between members."
      },
    ],
  },
  {
    id: 'l120',
    title: 'L120: Archetypes & Identity in NFT Projects',
    level: 'free',
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-green-500">🧠 Free Course - No Hoodie Required</h3>
          <p className="mb-4">Every character has a core — find yours.</p>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>Jungian Archetypes in Web3:</strong> Explorer, Degen, Oracle, Gatekeeper</li>
              <li>• <strong>Hoodie Squad Archetypes:</strong> Who are you within the dojo?</li>
              <li>• <strong>Quiz:</strong> Answer 12 prompts to discover your Hoodie archetype</li>
              <li>• <strong>Bonus Chart:</strong> Archetypes vs Posting Style</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"From Carl Jung to Hoodie Lore: Know Thy Degen"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1l120', 
        text: 'What are Jungian archetypes in Web3?', 
        options: [
          {id: 'o1', text: 'Universal character patterns that appear across cultures'},
          {id: 'o2', text: 'Different types of cryptocurrencies'},
          {id: 'o3', text: 'Trading strategies'},
          {id: 'o4', text: 'Blockchain protocols'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Jungian archetypes are universal character patterns that appear across cultures, including in Web3 communities."
      },
      { 
        id: 'q2l120', 
        text: 'What is the purpose of identifying your Hoodie archetype?', 
        options: [
          {id: 'o1', text: 'To understand your role and identity within the community'},
          {id: 'o2', text: 'To choose the right NFT to buy'},
          {id: 'o3', text: 'To improve trading skills'},
          {id: 'o4', text: 'To earn more money'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Identifying your Hoodie archetype helps you understand your role and identity within the community."
      },
      { 
        id: 'q3l120', 
        text: 'What is the "Degen" archetype?', 
        options: [
          {id: 'o1', text: 'Someone who takes high risks in trading and investing'},
          {id: 'o2', text: 'A type of cryptocurrency'},
          {id: 'o3', text: 'A blockchain protocol'},
          {id: 'o4', text: 'A trading strategy'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "The Degen archetype refers to someone who takes high risks in trading and investing, often with a YOLO mentality."
      },
    ],
  },
  {
    id: 'l150',
    title: 'L150: Personal Lore & Hoodie Identity',
    level: 'free',
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-green-500">🧩 Free Course - No Hoodie Required</h3>
          <p className="mb-4">Create your on-chain alter ego.</p>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>Character Sheet:</strong> Name, traits, background, squad affiliation</li>
              <li>• <strong>Core Philosophy:</strong> What does your hoodie stand for?</li>
              <li>• <strong>LoreMate Template:</strong> Markdown or Notion template for bio posts</li>
              <li>• <strong>Activity:</strong> Post your character intro in the Discord lore channel</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"Write Your Hoodie's Soul Into Existence"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1l150', 
        text: 'What is a character sheet in the context of Hoodie lore?', 
        options: [
          {id: 'o1', text: 'A template for defining your hoodie\'s identity and background'},
          {id: 'o2', text: 'A trading spreadsheet'},
          {id: 'o3', text: 'A blockchain transaction'},
          {id: 'o4', text: 'A type of NFT'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "A character sheet is a template for defining your hoodie's identity, traits, background, and squad affiliation."
      },
      { 
        id: 'q2l150', 
        text: 'What is the purpose of defining your hoodie\'s core philosophy?', 
        options: [
          {id: 'o1', text: 'To understand what your hoodie stands for and represents'},
          {id: 'o2', text: 'To increase its market value'},
          {id: 'o3', text: 'To choose the right trading strategy'},
          {id: 'o4', text: 'To improve blockchain performance'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Defining your hoodie's core philosophy helps you understand what it stands for and represents in the community."
      },
      { 
        id: 'q3l150', 
        text: 'What is a LoreMate template?', 
        options: [
          {id: 'o1', text: 'A template for creating bio posts and lore content'},
          {id: 'o2', text: 'A trading tool'},
          {id: 'o3', text: 'A blockchain protocol'},
          {id: 'o4', text: 'A type of cryptocurrency'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "A LoreMate template is a template for creating bio posts and lore content, often in Markdown or Notion format."
      },
    ],
  },
  {
    id: 'l200',
    title: 'L200: Building Hoodie Academy as a Living World',
    level: 'hoodie',
    requiresHoodie: true,
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-blue-500">🏙️ Hoodie-Gated Course - Requires WifHoodie</h3>
          <p className="mb-4">Design your surroundings. Expand the dojo and its layers.</p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>Map Design:</strong> Dojo, Archives, Radio Tower, Creator's Workshop</li>
              <li>• <strong>World Lore:</strong> Who lives here? What's the culture?</li>
              <li>• <strong>Assignment:</strong> Submit a location, how it looks, who uses it</li>
              <li>• <strong>Squad Task:</strong> Expand your squad's home base</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"Worldbuilding 101: From Dojo to Digital Realm"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1l200', 
        text: 'What is worldbuilding in the context of Hoodie Academy?', 
        options: [
          {id: 'o1', text: 'Creating the physical and cultural environment of the community'},
          {id: 'o2', text: 'Building blockchain infrastructure'},
          {id: 'o3', text: 'Creating trading strategies'},
          {id: 'o4', text: 'Developing new cryptocurrencies'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Worldbuilding involves creating the physical and cultural environment of the Hoodie Academy community."
      },
      { 
        id: 'q2l200', 
        text: 'What are the key locations in Hoodie Academy lore?', 
        options: [
          {id: 'o1', text: 'Dojo, Archives, Radio Tower, Creator\'s Workshop'},
          {id: 'o2', text: 'Trading floor, bank, office'},
          {id: 'o3', text: 'School, library, gym'},
          {id: 'o4', text: 'Home, work, store'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "The key locations include the Dojo, Archives, Radio Tower, and Creator's Workshop."
      },
      { 
        id: 'q3l200', 
        text: 'What is the purpose of squad tasks in worldbuilding?', 
        options: [
          {id: 'o1', text: 'To expand each squad\'s unique space and identity'},
          {id: 'o2', text: 'To increase trading volume'},
          {id: 'o3', text: 'To improve blockchain performance'},
          {id: 'o4', text: 'To attract new members'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Squad tasks help expand each squad's unique space and identity within the broader world."
      },
    ],
  },
  {
    id: 'l220',
    title: 'L220: Factions, Portals & Narrative Conflict',
    level: 'hoodie',
    requiresHoodie: true,
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-blue-500">🌀 Hoodie-Gated Course - Requires WifHoodie</h3>
          <p className="mb-4">Conflict powers narrative — even in harmony.</p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>Healthy "Vs" Energy:</strong> Degen vs Monk, Decoder vs Whisperer</li>
              <li>• <strong>Portal Design:</strong> Link different realms or DAOs</li>
              <li>• <strong>Story Prompt:</strong> First Squad Challenge or Raid Narrative</li>
              <li>• <strong>Activity:</strong> Post your squad's origin rival</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"Friction = Lore. Writing Conflict Without Drama"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1l220', 
        text: 'What is "healthy vs energy" in narrative crafting?', 
        options: [
          {id: 'o1', text: 'Creating constructive conflict that drives story without toxicity'},
          {id: 'o2', text: 'Making people fight each other'},
          {id: 'o3', text: 'Creating trading competitions'},
          {id: 'o4', text: 'Building rivalries between communities'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Healthy vs energy creates constructive conflict that drives story without creating toxic environments."
      },
      { 
        id: 'q2l220', 
        text: 'What is portal design in lore crafting?', 
        options: [
          {id: 'o1', text: 'Creating connections between different realms or DAOs'},
          {id: 'o2', text: 'Building physical portals'},
          {id: 'o3', text: 'Creating trading bridges'},
          {id: 'o4', text: 'Designing websites'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Portal design involves creating connections between different realms or DAOs in the narrative universe."
      },
      { 
        id: 'q3l220', 
        text: 'What is the purpose of squad challenges in lore?', 
        options: [
          {id: 'o1', text: 'To create narrative tension and community engagement'},
          {id: 'o2', text: 'To make people fight'},
          {id: 'o3', text: 'To increase trading volume'},
          {id: 'o4', text: 'To attract new members'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Squad challenges create narrative tension and community engagement without creating real conflict."
      },
    ],
  },
  {
    id: 'l250',
    title: 'L250: Threadweaving: Translating Lore into X Posts',
    level: 'hoodie',
    requiresHoodie: true,
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-blue-500">🧵 Hoodie-Gated Course - Requires WifHoodie</h3>
          <p className="mb-4">Turn your myth into shareable moments.</p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>Narrative Formats:</strong> Immersive vs punchy</li>
              <li>• <strong>Fusion Tactics:</strong> Lore + Meme = Timeline Gold</li>
              <li>• <strong>Writing Challenge:</strong> Convert your lore into a 4-tweet teaser</li>
              <li>• <strong>Bonus:</strong> Lore Hook Swipe File</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"Threadweaving: Building Lore for the Timeline"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1l250', 
        text: 'What is threadweaving?', 
        options: [
          {id: 'o1', text: 'Converting lore into shareable social media content'},
          {id: 'o2', text: 'Creating blockchain threads'},
          {id: 'o3', text: 'Building trading threads'},
          {id: 'o4', text: 'Making physical threads'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Threadweaving is the art of converting lore into shareable social media content, especially for platforms like X (Twitter)."
      },
      { 
        id: 'q2l250', 
        text: 'What are the two main narrative formats for social media?', 
        options: [
          {id: 'o1', text: 'Immersive and punchy'},
          {id: 'o2', text: 'Long and short'},
          {id: 'o3', text: 'Professional and casual'},
          {id: 'o4', text: 'Formal and informal'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "The two main narrative formats are immersive (detailed storytelling) and punchy (quick, impactful content)."
      },
      { 
        id: 'q3l250', 
        text: 'What is "Lore + Meme = Timeline Gold"?', 
        options: [
          {id: 'o1', text: 'Combining storytelling with humor for viral content'},
          {id: 'o2', text: 'Creating expensive NFTs'},
          {id: 'o3', text: 'Building trading strategies'},
          {id: 'o4', text: 'Making blockchain protocols'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "This refers to combining storytelling with humor to create viral content that performs well on social media timelines."
      },
    ],
  },
  {
    id: 'l300',
    title: 'L300: Masterclass in Symbolism & Recurring Themes',
    level: 'dao',
    requiresDao: true,
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-purple-500">🧙‍♂️ DAO-Gated Course - Advanced Level</h3>
          <p className="mb-4">The deeper the symbol, the longer the lore lasts.</p>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>Core Themes:</strong> Growth, Rebirth, Masking, Legacy</li>
              <li>• <strong>Symbol Examples:</strong> Lotus = calm under pressure, Bandana = hidden potential</li>
              <li>• <strong>Exercise:</strong> Trace a recurring theme across 2+ existing lore posts</li>
              <li>• <strong>Bonus:</strong> Symbol Generator Prompt Pack</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"Lore That Lasts: Symbols as Emotional Anchors"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1l300', 
        text: 'What is symbolism in lore crafting?', 
        options: [
          {id: 'o1', text: 'Using objects or concepts to represent deeper meanings'},
          {id: 'o2', text: 'Creating expensive NFTs'},
          {id: 'o3', text: 'Building trading strategies'},
          {id: 'o4', text: 'Making blockchain protocols'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Symbolism involves using objects or concepts to represent deeper meanings and emotional connections."
      },
      { 
        id: 'q2l300', 
        text: 'What does the lotus symbol represent in Hoodie lore?', 
        options: [
          {id: 'o1', text: 'Calm under pressure'},
          {id: 'o2', text: 'Wealth and prosperity'},
          {id: 'o3', text: 'Speed and agility'},
          {id: 'o4', text: 'Strength and power'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "The lotus symbol represents calm under pressure, growing beautiful even in difficult circumstances."
      },
      { 
        id: 'q3l300', 
        text: 'What does the bandana symbol represent?', 
        options: [
          {id: 'o1', text: 'Hidden potential'},
          {id: 'o2', text: 'Wealth and prosperity'},
          {id: 'o3', text: 'Speed and agility'},
          {id: 'o4', text: 'Strength and power'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "The bandana symbol represents hidden potential, covering but not concealing one's true capabilities."
      },
    ],
  },
];

export default function LoreNarrativeCraftingPage() {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [lessonStatus, setLessonStatus] = useState<Array<'locked' | 'unlocked' | 'completed'>>(
    new Array(lessonsData.length).fill('locked')
  );
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizResults, setQuizResults] = useState<Record<string, boolean>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [hasHoodie, setHasHoodie] = useState(false);
  const [hasDao, setHasDao] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [progress, setProgress] = useState(0);

  const localStorageKey = 'loreNarrativeCraftingProgress';

  const saveProgress = (newStatus: Array<'locked' | 'unlocked' | 'completed'>) => {
    localStorage.setItem(localStorageKey, JSON.stringify(newStatus));
    setLessonStatus(newStatus);
  };

  const handleWalletConnection = async () => {
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
        
        // Check for WifHoodie and DAO tokens
        const connection = new Connection('https://api.mainnet-beta.solana.com');
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          new PublicKey(provider.publicKey.toString()),
          { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
        );
        
        // Check for tokens (replace with actual token mint addresses)
        const hoodieTokenMint = 'YOUR_WIFHOODIE_TOKEN_MINT_ADDRESS';
        const daoTokenMint = 'YOUR_DAO_TOKEN_MINT_ADDRESS';
        
        const hasHoodieToken = tokenAccounts.value.some(account => 
          account.account.data.parsed.info.mint === hoodieTokenMint
        );
        const hasDaoToken = tokenAccounts.value.some(account => 
          account.account.data.parsed.info.mint === daoTokenMint
        );
        
        setHasHoodie(hasHoodieToken);
        setHasDao(hasDaoToken);
        
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
      updateScoreForQuizCompletion(walletAddress, 'lore-narrative-crafting', passRate, currentLesson.quiz.length, currentLessonIndex + 1, lessonsData.length);
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
                         (currentLesson.level === 'dao' && hasDao);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 text-white">
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
              <BookOpen className="w-8 h-8 text-green-400" />
              <h1 className="text-3xl font-bold">Lore & Narrative Crafting</h1>
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
                <Wallet className="w-12 h-12 mx-auto mb-4 text-green-400" />
                <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
                <p className="text-gray-300 mb-4">Connect your Solana wallet to access hoodie-gated and DAO-gated content.</p>
                <Button onClick={handleWalletConnection} className="bg-green-600 hover:bg-green-700">
                  Connect Phantom Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Course Content */}
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
                                    (lesson.level === 'dao' && hasDao);

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
                            ? 'bg-green-600 text-white' 
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
                      {currentLesson.level === 'hoodie' 
                        ? 'This course requires a WifHoodie NFT to access.'
                        : 'This course requires DAO membership to access.'
                      }
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
                          className="bg-green-600 hover:bg-green-700"
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
                            <Button onClick={handleNextLesson} className="bg-green-600 hover:bg-green-700">
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

        {/* Squad Placement Section */}
        <div className="mt-12">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <Trophy className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-purple-400 mb-2">Find Your Squad</h2>
                <p className="text-gray-300 text-lg">
                  Explore different squad tracks and discover where you belong in the Hoodie Academy.
                </p>
              </div>

              {/* Squad Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🎨</span>
                    <h3 className="text-lg font-semibold text-yellow-400">Hoodie Creators</h3>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">
                    Content creators, artists, and storytellers who build the cultural foundation.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded">Content</span>
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded">Art</span>
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded">Storytelling</span>
                  </div>
                </div>

                <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🧠</span>
                    <h3 className="text-lg font-semibold text-gray-300">Hoodie Decoders</h3>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">
                    Technical analysts, researchers, and data-driven decision makers.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded">Analysis</span>
                    <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded">Research</span>
                    <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded">Data</span>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🎤</span>
                    <h3 className="text-lg font-semibold text-red-400">Hoodie Speakers</h3>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">
                    Community leaders, moderators, and communication specialists.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded">Leadership</span>
                    <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded">Communication</span>
                    <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded">Community</span>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">⚔️</span>
                    <h3 className="text-lg font-semibold text-blue-400">Hoodie Raiders</h3>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">
                    Traders, strategists, and risk-takers who navigate market dynamics.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">Trading</span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">Strategy</span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">Risk</span>
                  </div>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6 md:col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🦅</span>
                    <h3 className="text-lg font-semibold text-purple-400">Hoodie Rangers</h3>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">
                    Explorers, scouts, and pioneers who discover new opportunities and territories.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">Exploration</span>
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">Discovery</span>
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">Innovation</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  asChild
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Link href="/placement/squad-test">
                    <Target className="w-4 h-4 mr-2" />
                    Take Squad Placement Test
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                
                <Button
                  asChild
                  variant="outline"
                  className="border-cyan-500/30 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                >
                  <Link href="/courses">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Explore Course Tracks
                  </Link>
                </Button>
              </div>

              <div className="text-center mt-6">
                <p className="text-sm text-gray-400">
                  Take the personality test to get matched with your ideal squad, or explore courses to discover your path naturally.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 