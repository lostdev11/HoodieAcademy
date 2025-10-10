'use client'

import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { ArrowLeft, CheckCircle, XCircle, Lock, Unlock, Shield, AlertTriangle, Wallet, Eye, EyeOff } from 'lucide-react';
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
  level: 'free' | 'hoodie' | 'kimono';
  requiresHoodie?: boolean;
  requiresKimono?: boolean;
}

const lessonsData: Lesson[] = [
  {
    id: 'c100',
    title: 'C100: What Is a Wallet & Why You Need to Care',
    level: 'free',
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-green-500">🔐 Free Course - No Hoodie Required</h3>
          <p className="mb-4">Understand the basics of crypto wallets, seed phrases, and where most people get rekt.</p>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>Hot vs Cold Wallets:</strong> Risk spectrum and real use cases</li>
              <li>• <strong>Seed Phrase 101:</strong> Never share, never store wrong</li>
              <li>• <strong>Wallet Types:</strong> Phantom, Backpack, Ledger, mobile apps</li>
              <li>• <strong>Activity:</strong> Create a burner wallet and practice signing on testnet</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"Welcome to Web3: Your Wallet Is Your Identity"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1c100', 
        text: 'What is the most important rule about seed phrases?', 
        options: [
          {id: 'o1', text: 'Share them with trusted friends'},
          {id: 'o2', text: 'Never share them with anyone'},
          {id: 'o3', text: 'Store them in your email'},
          {id: 'o4', text: 'Write them on social media'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "Seed phrases should NEVER be shared with anyone. They are the keys to your wallet and should be kept completely private."
      },
      { 
        id: 'q2c100', 
        text: 'What is the main difference between hot and cold wallets?', 
        options: [
          {id: 'o1', text: 'Hot wallets are always red'},
          {id: 'o2', text: 'Cold wallets are connected to the internet, hot wallets are not'},
          {id: 'o3', text: 'Hot wallets are connected to the internet, cold wallets are not'},
          {id: 'o4', text: 'There is no difference'}
        ], 
        correctAnswerId: 'o3', 
        explanation: "Hot wallets are connected to the internet and are more convenient but less secure. Cold wallets are offline and more secure."
      },
      { 
        id: 'q3c100', 
        text: 'Which of these is NOT a good place to store your seed phrase?', 
        options: [
          {id: 'o1', text: 'A fireproof safe'},
          {id: 'o2', text: 'Your phone\'s notes app'},
          {id: 'o3', text: 'A piece of paper in a secure location'},
          {id: 'o4', text: 'A hardware wallet'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "Never store your seed phrase digitally on your phone or computer. Use physical storage in a secure location."
      },
    ],
  },
  {
    id: 'c120',
    title: 'C120: Browser Hygiene & Setup',
    level: 'free',
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-green-500">🧭 Free Course - No Hoodie Required</h3>
          <p className="mb-4">Your browser is your first line of defense — let's clean it up.</p>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>Browser Segmentation:</strong> Trading browser vs real-life browser</li>
              <li>• <strong>Trusted Extensions:</strong> Which ones are safe and which aren't</li>
              <li>• <strong>Permissions:</strong> Limit data leaks and background behaviors</li>
              <li>• <strong>Assignment:</strong> Build your own secure browser profile from scratch</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"Lock Down the Browser, Lock Down the Bag"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1c120', 
        text: 'Why should you use separate browsers for trading and regular browsing?', 
        options: [
          {id: 'o1', text: 'To save money on browser costs'},
          {id: 'o2', text: 'To isolate crypto activities from potential malware'},
          {id: 'o3', text: 'To make your computer faster'},
          {id: 'o4', text: 'To avoid browser updates'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "Separate browsers help isolate your crypto activities from potential malware and tracking that could compromise your wallet."
      },
      { 
        id: 'q2c120', 
        text: 'What should you do with browser extensions you don\'t recognize?', 
        options: [
          {id: 'o1', text: 'Keep them all'},
          {id: 'o2', text: 'Disable or remove them'},
          {id: 'o3', text: 'Update them all'},
          {id: 'o4', text: 'Share them with friends'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "Disable or remove browser extensions you don't recognize, as they can access your browsing data and potentially compromise your security."
      },
      { 
        id: 'q3c120', 
        text: 'What is browser segmentation?', 
        options: [
          {id: 'o1', text: 'Using different browsers for different activities'},
          {id: 'o2', text: 'Changing browser colors'},
          {id: 'o3', text: 'Using multiple tabs'},
          {id: 'o4', text: 'Clearing browser cache'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Browser segmentation means using different browsers for different activities to isolate potential security risks."
      },
    ],
  },
  {
    id: 'c150',
    title: 'C150: Spot the Scam: Phishing, Drainers & Impersonators',
    level: 'free',
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-green-500">🛑 Free Course - No Hoodie Required</h3>
          <p className="mb-4">The biggest threat isn't code — it's psychology. Learn to spot deception.</p>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>Fake Airdrops & DM Traps:</strong> Real examples + red flags</li>
              <li>• <strong>Urgency & Formatting:</strong> Classic scam tactics</li>
              <li>• <strong>Domain Tricks:</strong> Lookalike links and homoglyphs</li>
              <li>• <strong>Activity:</strong> "Scam or Legit?" interactive quiz challenge</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"Scam School: How Not to Get Got"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1c150', 
        text: 'What is a common red flag in crypto scams?', 
        options: [
          {id: 'o1', text: 'Creating urgency and pressure'},
          {id: 'o2', text: 'Asking for your seed phrase'},
          {id: 'o3', text: 'Promising unrealistic returns'},
          {id: 'o4', text: 'All of the above'}
        ], 
        correctAnswerId: 'o4', 
        explanation: "All of these are common red flags in crypto scams. Legitimate projects don't pressure you, ask for seed phrases, or promise unrealistic returns."
      },
      { 
        id: 'q2c150', 
        text: 'What should you do if someone DMs you about a "free airdrop"?', 
        options: [
          {id: 'o1', text: 'Click the link immediately'},
          {id: 'o2', text: 'Ignore it completely'},
          {id: 'o3', text: 'Share your wallet address'},
          {id: 'o4', text: 'Send them your seed phrase'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "Ignore unsolicited DMs about free airdrops. Legitimate airdrops are announced publicly, not through random DMs."
      },
      { 
        id: 'q3c150', 
        text: 'What are homoglyphs in the context of scams?', 
        options: [
          {id: 'o1', text: 'Characters that look similar but are different'},
          {id: 'o2', text: 'Cryptographic signatures'},
          {id: 'o3', text: 'Blockchain transactions'},
          {id: 'o4', text: 'Wallet addresses'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Homoglyphs are characters that look similar but are different (like 0 vs O), used to create fake websites that look legitimate."
      },
    ],
  },
  {
    id: 'c200',
    title: 'C200: Wallet Segmentation: Hot, Warm & Cold Theory',
    level: 'hoodie',
    requiresHoodie: true,
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-blue-500">🧱 Hoodie-Gated Course - Requires WifHoodie</h3>
          <p className="mb-4">One wallet isn't enough. Learn to segment risk like a pro.</p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>Risk Tiering:</strong> Assign wallets based on threat level</li>
              <li>• <strong>Flow Design:</strong> How to fund and route between wallets safely</li>
              <li>• <strong>Suggested Stack:</strong> Real use example: mint → hold → vault</li>
              <li>• <strong>Assignment:</strong> Draw your current vs ideal wallet structure</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"Wallet Segmentation for Survival"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1c200', 
        text: 'What is wallet segmentation?', 
        options: [
          {id: 'o1', text: 'Using multiple wallets for different purposes'},
          {id: 'o2', text: 'Splitting your seed phrase'},
          {id: 'o3', text: 'Using different browsers'},
          {id: 'o4', text: 'Changing wallet colors'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Wallet segmentation means using multiple wallets for different purposes to limit risk exposure."
      },
      { 
        id: 'q2c200', 
        text: 'What is a "hot wallet" typically used for?', 
        options: [
          {id: 'o1', text: 'Long-term storage of large amounts'},
          {id: 'o2', text: 'Daily trading and small transactions'},
          {id: 'o3', text: 'Never using it'},
          {id: 'o4', text: 'Storing seed phrases'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "Hot wallets are used for daily trading and small transactions, while keeping larger amounts in cold storage."
      },
      { 
        id: 'q3c200', 
        text: 'What is the purpose of a "warm wallet"?', 
        options: [
          {id: 'o1', text: 'To keep your wallet warm'},
          {id: 'o2', text: 'Medium-term storage with some connectivity'},
          {id: 'o3', text: 'To heat your computer'},
          {id: 'o4', text: 'To store hot wallets'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "A warm wallet provides a middle ground between hot and cold wallets for medium-term storage with some connectivity."
      },
    ],
  },
  {
    id: 'c220',
    title: 'C220: Transaction Simulators & Revokers',
    level: 'hoodie',
    requiresHoodie: true,
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-blue-500">🔄 Hoodie-Gated Course - Requires WifHoodie</h3>
          <p className="mb-4">What you sign is what you get — unless you simulate first.</p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>Simulators:</strong> Blowfish, SolanaFM walkthroughs</li>
              <li>• <strong>Revokers:</strong> Revoke.cash, token approval UI</li>
              <li>• <strong>Connected Sites Management:</strong> Clean up your old approvals</li>
              <li>• <strong>Activity:</strong> Simulate a malicious transaction and revoke it</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"Trust, But Simulate"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1c220', 
        text: 'Why should you simulate transactions before signing?', 
        options: [
          {id: 'o1', text: 'To see what the transaction will actually do'},
          {id: 'o2', text: 'To make transactions faster'},
          {id: 'o3', text: 'To avoid gas fees'},
          {id: 'o4', text: 'To impress other traders'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Simulating transactions helps you understand exactly what the transaction will do before you sign it, preventing malicious actions."
      },
      { 
        id: 'q2c220', 
        text: 'What is a token approval?', 
        options: [
          {id: 'o1', text: 'A permission for a contract to spend your tokens'},
          {id: 'o2', text: 'A type of cryptocurrency'},
          {id: 'o3', text: 'A wallet address'},
          {id: 'o4', text: 'A seed phrase'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "A token approval is a permission you give to a smart contract to spend your tokens on your behalf."
      },
      { 
        id: 'q3c220', 
        text: 'What should you do with old token approvals?', 
        options: [
          {id: 'o1', text: 'Keep them all'},
          {id: 'o2', text: 'Revoke unused ones'},
          {id: 'o3', text: 'Share them publicly'},
          {id: 'o4', text: 'Ignore them completely'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "You should revoke unused token approvals to reduce your attack surface and prevent potential exploits."
      },
    ],
  },
  {
    id: 'c250',
    title: 'C250: Ghost Mode: OpSec for Traders & Leaders',
    level: 'hoodie',
    requiresHoodie: true,
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-blue-500">👻 Hoodie-Gated Course - Requires WifHoodie</h3>
          <p className="mb-4">You're not paranoid if they really are watching. Become invisible.</p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>VPNs, Aliases, 2FA Apps:</strong> Practical privacy layers</li>
              <li>• <strong>Doxxing Vectors:</strong> How people get exposed (and how to avoid it)</li>
              <li>• <strong>Degen Identity Kit:</strong> Build your own burner setup</li>
              <li>• <strong>Assignment:</strong> Set up a ghost wallet with full OpSec pipeline</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"How to Trade Like a Ghost"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1c250', 
        text: 'What is OpSec in crypto trading?', 
        options: [
          {id: 'o1', text: 'Operational Security - protecting your identity and activities'},
          {id: 'o2', text: 'A type of cryptocurrency'},
          {id: 'o3', text: 'A trading strategy'},
          {id: 'o4', text: 'A wallet type'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "OpSec (Operational Security) involves protecting your identity and activities from being exposed or compromised."
      },
      { 
        id: 'q2c250', 
        text: 'What is a "burner wallet"?', 
        options: [
          {id: 'o1', text: 'A wallet you plan to discard after use'},
          {id: 'o2', text: 'A wallet that catches fire'},
          {id: 'o3', text: 'A hardware wallet'},
          {id: 'o4', text: 'A wallet with no funds'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "A burner wallet is a temporary wallet you plan to discard after use to maintain anonymity."
      },
      { 
        id: 'q3c250', 
        text: 'What is a common doxxing vector?', 
        options: [
          {id: 'o1', text: 'Using the same username across platforms'},
          {id: 'o2', text: 'Sharing your wallet address'},
          {id: 'o3', text: 'Using a VPN'},
          {id: 'o4', text: 'Using 2FA'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Using the same username across platforms can link your identities and lead to doxxing."
      },
    ],
  },
  {
    id: 'c300',
    title: 'C300: Real-World Doxxing & Defense Scenarios',
    level: 'kimono',
    requiresKimono: true,
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-purple-500">⚔️ Kimono DAO-Gated Course - Advanced Level</h3>
          <p className="mb-4">What happens when things go wrong? Prepare now, not after.</p>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>Doxx Case Studies:</strong> How people got exposed (and the aftermath)</li>
              <li>• <strong>Compromised Wallet Protocol:</strong> Checklist for incident response</li>
              <li>• <strong>Threat Matrix:</strong> Personal vs on-chain exposure tiers</li>
              <li>• <strong>Assignment:</strong> Write your own OpSec incident response plan</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"How to Respond to a Breach (Before It Happens)"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1c300', 
        text: 'What should you do immediately if your wallet is compromised?', 
        options: [
          {id: 'o1', text: 'Move remaining assets to a new wallet'},
          {id: 'o2', text: 'Post about it on social media'},
          {id: 'o3', text: 'Ignore it and hope for the best'},
          {id: 'o4', text: 'Share your seed phrase'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "If your wallet is compromised, immediately move any remaining assets to a new, secure wallet."
      },
      { 
        id: 'q2c300', 
        text: 'What is a threat matrix?', 
        options: [
          {id: 'o1', text: 'A framework for assessing different types of threats'},
          {id: 'o2', text: 'A type of cryptocurrency'},
          {id: 'o3', text: 'A trading strategy'},
          {id: 'o4', text: 'A wallet address'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "A threat matrix is a framework for assessing and categorizing different types of security threats."
      },
      { 
        id: 'q3c300', 
        text: 'What is the first step in incident response?', 
        options: [
          {id: 'o1', text: 'Assess the situation and contain the threat'},
          {id: 'o2', text: 'Post on social media'},
          {id: 'o3', text: 'Ignore the problem'},
          {id: 'o4', text: 'Delete all accounts'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "The first step in incident response is to assess the situation and contain the threat to prevent further damage."
      },
    ],
  },
];

export default function CybersecurityWalletPracticesPage() {
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
  const [hasKimono, setHasKimono] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [progress, setProgress] = useState(0);

  const COURSE_SLUG = 'cybersecurity-wallet-practices';

  const saveProgress = async (newStatus: LessonStatus[]) => {
    setLessonStatus(newStatus);
    if (userWallet) await updateCourseProgress(userWallet, COURSE_SLUG, newStatus);
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
        
        // Check for WifHoodie and Kimono DAO tokens
        const connection = new Connection('https://api.mainnet-beta.solana.com');
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          new PublicKey(provider.publicKey.toString()),
          { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
        );
        
        // Check for tokens (replace with actual token mint addresses)
        const hoodieTokenMint = 'YOUR_WIFHOODIE_TOKEN_MINT_ADDRESS';
        const kimonoTokenMint = 'YOUR_KIMONO_DAO_TOKEN_MINT_ADDRESS';
        
        const hasHoodieToken = tokenAccounts.value.some(account => 
          account.account.data.parsed.info.mint === hoodieTokenMint
        );
        const hasKimonoToken = tokenAccounts.value.some(account => 
          account.account.data.parsed.info.mint === kimonoTokenMint
        );
        
        setHasHoodie(hasHoodieToken);
        setHasKimono(hasKimonoToken);
        
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
      updateScoreForQuizCompletion(walletAddress, 'cybersecurity-wallet-practices', passRate, currentLesson.quiz.length, currentLessonIndex + 1, lessonsData.length);
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
                         (currentLesson.level === 'kimono' && hasKimono);

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
              <Shield className="w-8 h-8 text-green-400" />
              <h1 className="text-3xl font-bold">Cybersecurity & Wallet Best Practices</h1>
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
                <p className="text-gray-300 mb-4">Connect your Solana wallet to access hoodie-gated and kimono-gated content.</p>
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
                                    (lesson.level === 'kimono' && hasKimono);

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
                        : 'This course requires Kimono DAO membership to access.'
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
      </div>
    </div>
  );
} 