'use client';

import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useSwipeable } from 'react-swipeable';
import { motion } from 'framer-motion';
import { PixelHoodieIcon } from "@/components/icons/PixelHoodieIcon";
import { ArrowLeft, CheckCircle, XCircle, Award, AlertTriangle, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
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
}

const lessonsData: Lesson[] = [
  {
    id: 'l1',
    title: 'Lesson 1: NFT Creation - The Digital Canvas',
    content: (
      <>
        <p className="mb-2">NFTs (Non-Fungible Tokens) begin with a digital asset—art, music, collectibles, or even a tweet! This asset needs to be unique or part of a limited collection. Metadata is crucial; it's the information embedded in the NFT, describing its properties, history, and links to the actual asset (often stored on IPFS or Arweave to ensure decentralization).</p>
        <p>Minting is the process of publishing your unique token on a blockchain (like Solana for Hoodie-Verse). This makes it ownable, traceable, and tradable. Smart contracts govern NFTs, defining their rules and functionalities, like royalty payments on secondary sales.</p>
      </>
    ),
    quiz: [
      { id: 'q1l1', text: 'What does "minting" an NFT primarily involve?', options: [{id: 'o1', text: 'Designing the artwork'}, {id: 'o2', text: 'Publishing the token on a blockchain'}, {id: 'o3', text: 'Marketing the NFT'}, {id: 'o4', text: 'Setting the price'}], correctAnswerId: 'o2', explanation: "Minting is the act of creating and registering the NFT on a blockchain, making it a verifiable digital asset."},
      { id: 'q2l1', text: 'Which of these is NOT typically stored directly ON the blockchain for an NFT due to size/cost?', options: [{id: 'o1', text: 'Token ID'}, {id: 'o2', text: 'Ownership record'}, {id: 'o3', text: 'The high-resolution image/video file'}, {id: 'o4', text: 'Smart contract address'}], correctAnswerId: 'o3', explanation: "Large media files are usually stored off-chain (e.g., IPFS) with a link in the metadata, due to blockchain storage costs and limitations."},
      { id: 'q3l1', text: 'What is NFT metadata?', options: [{id: 'o1', text: 'The current market price of the NFT'}, {id: 'o2', text: 'A list of all previous owners'}, {id: 'o3', text: 'Descriptive information about the NFT, like its name, properties, and asset link'}, {id: 'o4', text: 'The software used to create the NFT art'}], correctAnswerId: 'o3', explanation: "Metadata provides essential details about the NFT, defining its characteristics and linking to its associated digital asset."},
    ],
  },
  {
    id: 'l2',
    title: 'Lesson 2: Marketplace Dynamics - Trading Arenas',
    content: (
      <>
        <p className="mb-2">NFT marketplaces like Magic Eden are platforms where users can buy, sell, and auction NFTs, especially on Solana for Hoodie-Verse. Listing an NFT involves setting a price (fixed or auction-style) and paying a small fee. Buyers browse collections, place bids, or purchase directly.</p>
        <p>Understanding floor price (lowest price for an NFT in a collection), trading volume, and holder distribution can provide insights into a project's health and demand. Royalties, typically 5-10%, are automatically paid to the original creator on secondary sales, a key feature enabled by smart contracts.</p>
      </>
    ),
    quiz: [
      { id: 'q1l2', text: 'What is the "floor price" of an NFT collection?', options: [{id: 'o1', text: 'The average price of all sales'}, {id: 'o2', text: 'The highest price an NFT in the collection has sold for'}, {id: 'o3', text: 'The lowest current asking price for an NFT in that collection'}, {id: 'o4', text: 'The original mint price'}], correctAnswerId: 'o3', explanation: "The floor price represents the minimum amount you'd need to pay to acquire an NFT from that specific collection at a given time."},
      { id: 'q2l2', text: 'What are NFT royalties?', options: [{id: 'o1', text: 'Fees paid to the marketplace for listing an NFT'}, {id: 'o2', text: 'A percentage of secondary sales paid to the original creator'}, {id: 'o3', text: 'Taxes imposed by governments on NFT transactions'}, {id: 'o4', text: 'Discounts offered to early buyers'}], correctAnswerId: 'o2', explanation: "Royalties are a powerful feature of NFTs, allowing creators to earn a percentage from subsequent sales of their work."},
      { id: 'q3l2', text: 'Magic Eden is an example of:', options: [{id: 'o1', text: 'Cryptocurrency exchange'}, {id: 'o2', text: 'NFT marketplace'}, {id: 'o3', text: 'Blockchain explorer'}, {id: 'o4', text: 'Hardware wallet'}], correctAnswerId: 'o2', explanation: "Magic Eden is a leading platform for buying, selling, and discovering Solana NFTs like Hoodie-Verse."},
    ],
  },
  {
    id: 'l3',
    title: 'Lesson 3: Solana Fees - Low-Cost NFT Transactions',
    content: (
      <>
        <p className="mb-2">Solana, the blockchain for Hoodie-Verse, offers low transaction fees compared to Ethereum, making it ideal for NFT minting and trading. Fees are paid in SOL and are typically a fraction of a cent, even during network congestion.</p>
        <p>To optimize fees, batch transactions when possible (e.g., multiple NFT transfers in one transaction) and monitor network activity to avoid rare peak times. Solana's high throughput ensures fast confirmations, enhancing the NFT experience.</p>
      </>
    ),
    quiz: [
      { id: 'q1l3', text: 'Why is Solana preferred for NFTs like Hoodie-Verse?', options: [{id: 'o1', text: 'High transaction fees'}, {id: 'o2', text: 'Low fees and fast transactions'}, {id: 'o3', text: 'Proof-of-Work consensus'}, {id: 'o4', text: 'Centralized governance'}], correctAnswerId: 'o2', explanation: "Solana's low fees and high throughput make it ideal for NFT projects."},
      { id: 'q2l3', text: 'How can you optimize Solana transaction fees?', options: [{id: 'o1', text: 'Use a new wallet for each transaction'}, {id: 'o2', text: 'Batch multiple transactions together'}, {id: 'o3', text: 'Pay with stablecoins'}, {id: 'o4', text: 'Avoid marketplaces'}], correctAnswerId: 'o2', explanation: "Batching transactions reduces the number of individual fees."},
      { id: 'q3l3', text: 'Solana transaction fees are paid in:', options: [{id: 'o1', text: 'ETH'}, {id: 'o2', text: 'SOL'}, {id: 'o3', text: 'USDC'}, {id: 'o4', text: 'BTC'}], correctAnswerId: 'o2', explanation: "SOL is the native currency for Solana transaction fees."},
    ],
  },
  {
    id: 'l4',
    title: 'Lesson 4: The "Fake Drop" Scam - Spotting Deception',
    content: (
      <>
        <p className="mb-2">Scammers often create fake NFT projects or "surprise drops" that mimic legitimate ones like Hoodie-Verse. They use similar artwork, altered project names, or fake social media profiles to trick you into connecting your wallet to a malicious site, which can drain your assets.</p>
        <p>Red flags include: unsolicited DMs with "secret" mint links, unrealistic promises (e.g., guaranteed profits), pressure to act quickly (FOMO), and poorly designed websites. Always verify links through Hoodie-Verse's official X or Discord channels.</p>
      </>
    ),
    pitfallWarning: (
      <div className="mt-6 p-4 border border-red-500/50 bg-red-900/30 rounded-lg">
        <h4 className="text-lg font-semibold text-red-400 flex items-center mb-2"><AlertTriangle size={20} className="mr-2"/>Fake Drop Scam Alert!</h4>
        <p className="text-sm text-red-300">
          Be vigilant! Scammers create fake NFT drops mimicking Hoodie-Verse. Verify links through official Discord or X accounts. Never click suspicious DM links. Protect your wallet!
        </p>
      </div>
    ),
    quiz: [
      { id: 'q1l4', text: 'A common tactic in fake NFT drop scams is:', options: [{id: 'o1', text: 'Publicly audited smart contracts'}, {id: 'o2', text: 'Sending DMs with "exclusive" mint links'}, {id: 'o3', text: 'Detailed whitepapers'}, {id: 'o4', text: 'Transparent team identities'}], correctAnswerId: 'o2', explanation: "Scammers use DMs to create urgency, bypassing public scrutiny."},
      { id: 'q2l4', text: 'What is a red flag for a new NFT project mint?', options: [{id: 'o1', text: 'Strong community on Discord'}, {id: 'o2', text: 'High-pressure tactics demanding immediate action'}, {id: 'o3', text: 'Clear team communication'}, {id: 'o4', text: 'Unique artwork'}], correctAnswerId: 'o2', explanation: "Legitimate projects allow research time; pressure is a scam indicator."},
      { id: 'q3l4', text: 'What is the safest first step before minting an NFT?', options: [{id: 'o1', text: 'Click email links'}, {id: 'o2', text: 'Ask in unofficial chat groups'}, {id: 'o3', text: 'Connect your main wallet'}, {id: 'o4', text: 'Verify official website and social media'}], correctAnswerId: 'o4', explanation: "Cross-reference official sources to ensure legitimacy."},
    ],
  },
];

const PASSING_PERCENTAGE = 0.75;
const LOCAL_STORAGE_KEY = 'nftMasteryProgress';

export default function NftMasteryPage() {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [lessonStatus, setLessonStatus] = useState<Array<'locked' | 'unlocked' | 'completed'>>(
    lessonsData.map((_, index) => (index === 0 ? 'unlocked' : 'locked'))
  );
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackModalContent, setFeedbackModalContent] = useState({ title: "", description: "" });
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [mockNftStatus, setMockNftStatus] = useState<string | null>(null);
  const [showWalletAlert, setShowWalletAlert] = useState(false);
  const [walletAlertConfig, setWalletAlertConfig] = useState({ title: "", description: "" });
  const [connectedWalletProvider, setConnectedWalletProvider] = useState<WalletProviderOption | null>(null);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");

  const solanaNetwork = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
  const solanaConnection = new Connection(solanaNetwork, "confirmed");

  const currentLesson = lessonsData[currentLessonIndex];
  const allLessonsCompleted = lessonStatus.every(status => status === 'completed');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStatus = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedStatus) {
        const parsedStatus: Array<'locked' | 'unlocked' | 'completed'> = JSON.parse(savedStatus);
        setLessonStatus(parsedStatus);
        const lastCompletedIndex = parsedStatus.lastIndexOf('completed');
        const newCurrentIndex = parsedStatus.findIndex(status => status === 'unlocked');
        setCurrentLessonIndex(newCurrentIndex !== -1 ? newCurrentIndex : (lastCompletedIndex + 1 < lessonsData.length ? lastCompletedIndex + 1 : lastCompletedIndex));
      }
    }
  }, []);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const saveProgress = (newStatus: Array<'locked' | 'unlocked' | 'completed'>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newStatus));
    }
  };

  const progressPercentage = (lessonStatus.filter(s => s === 'completed').length / lessonsData.length) * 100;

  const resetWalletState = () => {
    setAccount(null);
    setBalance(null);
    setMockNftStatus(null);
    setConnectedWalletProvider(null);
  };

  const handleWalletConnection = async (providerName: WalletProviderOption) => {
    resetWalletState();
    setConnectedWalletProvider(providerName);

    try {
      let solProvider: ProviderLike | null = null;
      let walletName = providerName;

      const sol: SolanaWallet | undefined = 
        typeof window !== 'undefined' ? window.solana : undefined;
      
      if (providerName === 'phantom') {
        if (!(sol?.isPhantom)) {
          setWalletAlertConfig({
            title: "Phantom Not Detected",
            description: "Please install Phantom wallet to view your NFT status. Download it from https://phantom.app.",
          });
          setShowWalletAlert(true);
          return;
        }
        solProvider = sol ?? null;
      }

      if (!solProvider) {
        setWalletAlertConfig({
          title: "Wallet Not Detected",
          description: `Please install a compatible Solana wallet (e.g., Phantom).`,
        });
        setShowWalletAlert(true);
        return;
      }

      if (!solProvider.isConnected) {
        // ignore return (fine)
        await solProvider.connect();
      }

      if (!solProvider.publicKey) {
        console.error('Solana wallet public key is null after connection');
        return;
      }

      const solAccount = solProvider.publicKey.toString();
      setAccount(solAccount);

      try {
        const solBalanceLamports = await solanaConnection.getBalance(new PublicKey(solAccount));
        setBalance(`${(solBalanceLamports / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
      } catch (error: unknown) {
        console.error("Failed to fetch Solana balance:", error);
        setBalance("Error fetching balance");
        setWalletAlertConfig({
          title: "Balance Fetch Error",
          description: "Failed to retrieve your SOL balance. The Solana network may be congested. Please try again later.",
        });
        setShowWalletAlert(true);
      }

      // Deterministic mock NFT status
      const hash = (str: string) => str.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0);
      const hasMockNFT = hash(solAccount) % 2 === 0;
      setMockNftStatus(hasMockNFT ? 'Hoodie-Verse NFT: Owned!' : 'Hoodie-Verse NFT: None found.');

      setWalletAlertConfig({
        title: `${walletName.charAt(0).toUpperCase() + walletName.slice(1)} Connected`,
        description: `Successfully connected: ${solAccount.slice(0, 4)}...${solAccount.slice(-4)}`,
      });
    } catch (error: unknown) {
      console.error(`${providerName} connection error:`, error);
      let description = `Failed to connect ${providerName}. Please try again.`;
      if (error instanceof Error) {
        if (error.message?.includes('rejected') || (error as any).code === 4001) {
          description = 'Connection request rejected. Please approve in your wallet.';
        } else if (error.message?.includes('locked')) {
          description = 'Your wallet is locked. Please unlock it and try again.';
        } else {
          description = `Failed to connect ${providerName}: ${error.message}`;
        }
      }
      setWalletAlertConfig({ title: "Connection Error", description });
      setShowWalletAlert(true);
    }
    setShowWalletSelector(false);
  };

  const handleOptionChange = (questionId: string, optionId: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
    if (quizSubmitted) {
      setQuizSubmitted(false);
    }
  };

  const handleSubmitQuiz = useCallback(() => {
    if (!currentLesson) return;
    let score = 0;
    currentLesson.quiz.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswerId) {
        score++;
      }
    });
    const totalQuestions = currentLesson.quiz.length;
    const percentage = totalQuestions > 0 ? score / totalQuestions : 0;
    const passed = percentage >= PASSING_PERCENTAGE;

    setCurrentScore(score);
    setQuizPassed(passed);
    setQuizSubmitted(true);

    if (passed) {
      // Update leaderboard score
      const walletAddress = localStorage.getItem('walletAddress') || 'demo-wallet';
      const percentageScore = Math.round(percentage * 100);
      updateScoreForQuizCompletion(walletAddress, 'nft-mastery', percentageScore, totalQuestions, currentLessonIndex + 1, lessonsData.length);
      
      setFeedbackModalContent({ title: "Quiz Passed!", description: `You scored ${score}/${totalQuestions}. Excellent! You can proceed.` });
      const newLessonStatus = [...lessonStatus];
      newLessonStatus[currentLessonIndex] = 'completed';
      if (currentLessonIndex < lessonsData.length - 1) {
        newLessonStatus[currentLessonIndex + 1] = 'unlocked';
        setTimeout(() => {
          setCurrentLessonIndex(prev => prev + 1);
          setSelectedAnswers({});
          setQuizSubmitted(false);
          setQuizPassed(false);
          setCurrentScore(0);
          setShowFeedbackModal(false);
        }, 1500);
      } else {
        setTimeout(() => setShowFeedbackModal(false), 3000);
      }
      setLessonStatus(newLessonStatus);
      saveProgress(newLessonStatus);
    } else {
      setFeedbackModalContent({ title: "Quiz Failed", description: `You scored ${score}/${totalQuestions}. Please review the material and try again. You need at least ${Math.ceil(PASSING_PERCENTAGE * totalQuestions)} correct answers.` });
      setTimeout(() => setShowFeedbackModal(false), 3000);
    }
    setShowFeedbackModal(true);
  }, [selectedAnswers, currentLesson, currentLessonIndex, lessonStatus]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (allQuestionsAnswered && currentLesson && lessonStatus[currentLessonIndex] !== 'completed') {
        handleSubmitQuiz();
      }
    },
    onSwipedRight: () => {
      setSelectedAnswers({});
      setQuizSubmitted(false);
      setQuizPassed(false);
      setCurrentScore(0);
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  const allQuestionsAnswered = currentLesson?.quiz.every(q => selectedAnswers[q.id]);

  const walletProviders: { name: WalletProviderOption; label: string; icon?: JSX.Element }[] = [
    { name: 'phantom', label: 'Phantom', icon: <Wallet size={20} className="mr-2 text-purple-500" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900 to-slate-900"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="relative z-10 p-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            asChild
            variant="outline"
            className="bg-slate-800/50 hover:bg-slate-700/50 text-cyan-400 hover:text-cyan-300 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300"
          >
            <Link href="/courses">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent glow-text">
            NFT Mastery
          </h1>
          <p className="text-xl text-gray-300 mb-2">Learn NFT creation, trading, and scam awareness.</p>
          <p className="text-cyan-300 text-lg">
            Current Time: <span className="text-green-400 font-mono">{currentTime}</span>
          </p>
        </div>
        {/* Main content: lessons, quizzes, wallet, etc. */}
        <div className="max-w-3xl mx-auto">
          <Progress value={progressPercentage} className="w-full max-w-3xl mb-8 bg-purple-900/50 [&>div]:bg-purple-500" />

          {!allLessonsCompleted && currentLesson && lessonStatus[currentLessonIndex] !== 'locked' ? (
            <motion.section
              key={currentLessonIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-card p-6 md:p-8 rounded-xl shadow-lg border border-purple-600 w-full neon-border-purple hover:shadow-[0_0_25px_rgba(168,85,247,1)] transition-all duration-300"
              {...swipeHandlers}
            >
              <h2 className="text-2xl md:text-3xl font-semibold text-primary mb-4">{currentLesson.title}</h2>
              <div className="text-md md:text-lg text-foreground leading-relaxed mb-6 prose prose-invert max-w-none">
                {currentLesson.content}
              </div>

              {currentLesson.pitfallWarning && lessonStatus[currentLessonIndex] !== 'completed' && (
                <div className="my-4">{currentLesson.pitfallWarning}</div>
              )}

              {lessonStatus[currentLessonIndex] !== 'completed' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="mt-8"
                >
                  <h3 className="text-xl md:text-2xl font-semibold text-secondary mt-8 mb-4">Knowledge Check! (Swipe Left to Submit / Right to Reset)</h3>
                  <RadioGroup className="space-y-6">
                    {currentLesson.quiz.map((q, qIndex) => (
                      <div key={q.id} className={`p-4 rounded-md border-2 ${quizSubmitted ? (selectedAnswers[q.id] === q.correctAnswerId ? 'border-green-500 bg-green-500/10 neon-border-green' : 'border-red-500 bg-red-500/10 neon-border-red') : 'border-green-900 hover:border-green-600'}`}>
                        <p className="font-medium mb-2">{qIndex + 1}. {q.text}</p>
                        {q.options.map(opt => (
                          <motion.div
                            key={opt.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex items-center space-x-3 p-3 bg-muted/30 rounded-lg border-2 hover:border-green-600 cursor-pointer transition-all duration-150 ${selectedAnswers[q.id] === opt.id ? 'border-green-500 ring-2 ring-green-500 neon-border-green' : 'border-green-900'}`}
                            onClick={() => handleOptionChange(q.id, opt.id)}
                          >
                            <RadioGroupItem
                              value={opt.id}
                              id={`${q.id}-${opt.id}`}
                              checked={selectedAnswers[q.id] === opt.id}
                              disabled={quizSubmitted && quizPassed}
                              className="border-green-600 text-green-600 focus:ring-green-500 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-500"
                            />
                            <Label htmlFor={`${q.id}-${opt.id}`} className="cursor-pointer flex-1">{opt.text}</Label>
                            {quizSubmitted && selectedAnswers[q.id] === opt.id && selectedAnswers[q.id] !== q.correctAnswerId && (
                              <XCircle className="h-5 w-5 text-red-500 ml-2" />
                            )}
                            {quizSubmitted && selectedAnswers[q.id] === opt.id && selectedAnswers[q.id] === q.correctAnswerId && (
                              <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                            )}
                            {quizSubmitted && opt.id === q.correctAnswerId && selectedAnswers[q.id] !== q.correctAnswerId && (
                              <span className="text-xs text-green-400 ml-2">(Correct Answer)</span>
                            )}
                          </motion.div>
                        ))}
                        {quizSubmitted && selectedAnswers[q.id] !== q.correctAnswerId && q.explanation && (
                          <p className="text-sm text-muted-foreground mt-1">💡 {q.explanation}</p>
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                  <Button
                    onClick={handleSubmitQuiz}
                    className="mt-8 w-full bg-purple-600 hover:bg-green-700 text-white shadow-[0_0_10px_theme(colors.purple.600)] hover:shadow-[0_0_15px_theme(colors.green.500)] transition-all duration-300"
                    disabled={!allQuestionsAnswered || (quizSubmitted && quizPassed)}
                  >
                    Submit Quiz (or Swipe Left)
                  </Button>
                </motion.div>
              )}
            </motion.section>
          ) : (
            <motion.section
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-card p-6 md:p-8 rounded-xl shadow-lg border-2 border-green-500 neon-border-green hover:shadow-[0_0_30px_rgba(34,197,94,1)] w-full text-center"
            >
              <Award className="w-20 h-20 text-green-400 mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-green-300 mb-3">Course Complete! NFT Ninja!</h2>
              <p className="text-xl text-foreground mb-4">You've mastered the Hoodie-Verse NFT collection!</p>
              <div className="flex items-center justify-center space-x-3 my-6">
                <PixelHoodieIcon className="w-12 h-12 text-purple-400" data-ai-hint="pixel hoodie" />
                <div>
                  <p className="text-lg md:text-xl font-semibold text-primary">REWARD: Hoodie-Verse Ninja NFT</p>
                  <p className="text-md text-muted-foreground">Your prowess in the Hoodie-Verse is undeniable.</p>
                </div>
              </div>
              {lessonsData.find(l => l.pitfallWarning && lessonStatus[lessonsData.indexOf(l)] === 'completed')?.pitfallWarning}
              <Button asChild className="mt-6 w-full md:w-auto bg-yellow-500 hover:bg-yellow-600 text-background shadow-[0_0_10px_theme(colors.yellow.500)] hover:shadow-[0_0_15px_theme(colors.yellow.400)] transition-all duration-300">
                <Link href="/community-strategy">Advance to Community Strategy</Link>
              </Button>
            </motion.section>
          )}

          <section className="my-8 text-center p-6 bg-card rounded-xl shadow-lg border border-purple-600 neon-border-purple w-full">
            <h2 className="text-2xl font-bold text-primary mb-2">Hoodie-Verse Collection</h2>
            <p className="text-sm text-muted-foreground mb-4">Explore our exclusive Solana NFT collection!</p>
            <div className="space-y-2">
              <p><strong>Collection Size:</strong> 5,000 NFTs</p>
              <p><strong>Mint Date:</strong> July 2025</p>
              <p><strong>Utility:</strong> Exclusive community access, virtual events, and merchandise discounts.</p>
            </div>
          </section>

          <section className="my-8 text-center p-6 bg-card rounded-xl shadow-lg border border-purple-600 neon-border-purple w-full">
            <h2 className="text-2xl font-bold text-primary mb-2">Connect Your Wallet</h2>
            <p className="text-sm text-muted-foreground mb-4">Connect a Solana wallet to view your address, balance, and Hoodie-Verse NFT status.</p>
            <div className="flex justify-center items-center">
              <Button
                onClick={() => setShowWalletSelector(!showWalletSelector)}
                className="px-6 py-3 mb-4 rounded-lg shadow-lg bg-gradient-to-r from-green-500 to-purple-600 hover:from-green-600 hover:to-purple-700 text-white min-w-[240px] transition-all duration-300 flex items-center justify-center"
                aria-expanded={showWalletSelector}
                aria-label={showWalletSelector ? "Close wallet selector" : "Open wallet selector"}
              >
                <Wallet size={18} className="mr-2"/>
                {connectedWalletProvider ? `Connected: ${connectedWalletProvider}` : "Select Wallet"}
                {showWalletSelector ? <ChevronUp size={18} className="ml-2" /> : <ChevronDown size={18} className="ml-2" />}
              </Button>
            </div>
            {showWalletSelector && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex justify-center mt-4 overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-md">
                  {walletProviders.map(wallet => (
                    <Button
                      key={wallet.name}
                      onClick={() => handleWalletConnection(wallet.name)}
                      className="w-full px-6 py-3 rounded-lg shadow-lg bg-gradient-to-r from-green-600 to-purple-600 hover:from-green-700 hover:to-purple-700 text-white transition-all duration-300 flex items-center justify-center"
                    >
                      {wallet.icon} {wallet.label}
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}
            {account && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-foreground space-y-1"
              >
                <p><strong>Address:</strong> {account}</p>
                <p><strong>Balance:</strong> {balance || 'Fetching balance...'}</p>
                <p><strong>NFT Status:</strong> {mockNftStatus || 'Checking NFT status...'}</p>
              </motion.div>
            )}
          </section>

          <AlertDialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{feedbackModalContent.title}</AlertDialogTitle>
                <AlertDialogDescription>
                  {feedbackModalContent.description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                {quizPassed && currentLessonIndex < lessonsData.length - 1 ? (
                  null
                ) : quizPassed && currentLessonIndex === lessonsData.length - 1 ? (
                  <AlertDialogAction onClick={() => setShowFeedbackModal(false)} className="bg-green-600 hover:bg-green-700">Mastered!</AlertDialogAction>
                ) : (
                  <>
                    <AlertDialogCancel onClick={() => setShowFeedbackModal(false)}>Review Lesson</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {setSelectedAnswers({}); setQuizSubmitted(false); setQuizPassed(false); setCurrentScore(0); setShowFeedbackModal(false);}} className="bg-purple-600 hover:bg-purple-700">Retry Quiz</AlertDialogAction>
                  </>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={showWalletAlert} onOpenChange={setShowWalletAlert}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{walletAlertConfig.title}</AlertDialogTitle>
                <AlertDialogDescription>
                  {walletAlertConfig.description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                {walletAlertConfig.title !== "Phantom Connected" && <AlertDialogCancel>Cancel</AlertDialogCancel> }
                <AlertDialogAction onClick={() => setShowWalletAlert(false)} className="bg-purple-600 hover:bg-purple-700">OK</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
  );
}
