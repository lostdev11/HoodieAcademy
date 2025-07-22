'use client'

import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useSwipeable } from 'react-swipeable';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, Award, AlertTriangle, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import TokenGate from "@/components/TokenGate";
import { Card, CardContent } from "@/components/ui/card";
import { recordCourseCompletion } from '@/lib/supabase';

declare global {
  interface Window {
    solana?: any;
  }
}

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

// TODO: Update lessonsData to reflect your NFT project's theme (e.g., Solana NFTs, your collection's details)
const lessonsData: Lesson[] = [
  {
    id: 'l1',
    title: 'Lesson 1: Meme Coin Tokenomics - Hype & Scarcity',
    content: (
      <>
        <p className="mb-2">Meme coin value is often driven more by community hype and viral marketing than traditional fundamentals. Tokenomics (token economics) still play a role. Key factors include: total supply (huge supplies like Shiba Inu's quadrillions aim for low unit prices), burn mechanisms (reducing supply to potentially increase value), and transaction taxes (fees redistributed to holders or liquidity pools).</p>
        <p>Understanding these can help gauge potential sustainability, but remember: meme coins are highly speculative. Demand is heavily influenced by social media trends, influencer endorsements, and narrative rather than utility.</p>
      </>
    ),
    quiz: [
      { id: 'q1l1', text: 'What is a common characteristic of meme coin tokenomics?', options: [{id: 'o1', text: 'Low total supply'}, {id: 'o2', text: 'Strong focus on real-world utility'}, {id: 'o3', text: 'Very large total supply and reliance on hype'}, {id: 'o4', text: 'Fixed interest rates for holders'}], correctAnswerId: 'o3', explanation: "Meme coins often start with massive supplies and depend heavily on community engagement and social media trends for value."},
      { id: 'q2l1', text: 'What is the purpose of a "token burn" mechanism?', options: [{id: 'o1', text: 'To create new tokens'}, {id: 'o2', text: 'To permanently remove tokens from circulation, potentially increasing scarcity'}, {id: 'o3', text: 'To pay developers'}, {id: 'o4', text: 'To fund marketing campaigns'}], correctAnswerId: 'o2', explanation: "Burning tokens reduces the total supply, which can theoretically increase the value of remaining tokens if demand stays constant or grows."},
      { id: 'q3l1', text: 'Transaction taxes in meme coins are often used for:', options: [{id: 'o1', text: 'Paying government taxes'}, {id: 'o2', text: 'Funding scientific research'}, {id: 'o3', text: 'Redistributing fees to holders or adding to liquidity pools'}, {id: 'o4', text: 'Buying back company stock'}], correctAnswerId: 'o3', explanation: "These taxes (often called 'reflections' or 'liquidity fees') are a common feature designed to incentivize holding and provide liquidity."},
    ],
  },
  {
    id: 'l2',
    title: 'Lesson 2: Sentiment Analysis - Riding the X Wave',
    content: (
       <>
        <p className="mb-2">X (Twitter) is the epicenter of meme coin discourse. Sentiment analysis involves gauging the overall mood and trending topics related to a specific coin. Tools and manual tracking can monitor mentions, engagement (likes, retweets), prominent accounts discussing the coin, and the general tone (positive, negative, neutral).</p>
        <p>Rapid shifts in sentiment, driven by influencer tweets, project announcements, or broader market news, can cause extreme volatility. Identifying trends early can be advantageous, but distinguishing genuine hype from coordinated manipulation is crucial and difficult.</p>
      </>
    ),
    quiz: [
      { id: 'q1l2', text: 'Why is X (Twitter) crucial for meme coin analysis?', options: [{id: 'o1', text: 'It hosts the official blockchain ledger'}, {id: 'o2', text: 'It\'s where most official financial reports are published'}, {id: 'o3', text: 'It\'s a primary platform for community discussion, hype, and news dissemination'}, {id: 'o4', text: 'It offers the best charting tools'}], correctAnswerId: 'o3', explanation: "The real-time, public nature of X makes it the main arena for meme coin narratives and sentiment shifts."},
      { id: 'q2l2', text: 'Sentiment analysis primarily aims to:', options: [{id: 'o1', text: 'Calculate the exact future price'}, {id: 'o2', text: 'Gauge the overall community mood and trending discussions'}, {id: 'o3', text: 'Audit the smart contract code'}, {id: 'o4', text: 'Determine the number of tokens burned'}], correctAnswerId: 'o2', explanation: "It's about understanding the collective feeling and conversation surrounding a coin, which heavily influences meme coin prices."},
      { id: 'q3l2', text: 'A sudden surge in positive mentions by many new/unknown X accounts could be a sign of:', options: [{id: 'o1', text: 'Genuine organic growth'}, {id: 'o2', text: 'A potential coordinated manipulation or bot activity'}, {id: 'o3', text: 'A partnership with a major corporation'}, {id: 'o4', text: 'A successful token burn'}], correctAnswerId: 'o2', explanation: "While it could be organic, a sudden, unnatural-looking surge warrants caution as it might indicate manipulation attempts."},
    ],
  },
  {
    id: 'l3',
    title: 'Lesson 3: Portfolio Simulation - Paper Trading',
    content: (
      <>
        <p className="mb-2">Given the extreme volatility, "paper trading" (simulating trades without real money) is wise for meme coins. Set a virtual budget and track hypothetical buys and sells based on your analysis (tokenomics, sentiment, charts). Tools like CoinMarketCap or CoinGecko offer portfolio trackers.</p>
        <p>This lets you test strategies, understand entry/exit points, and experience the emotional swings without financial risk. Key considerations: position sizing (don't allocate too much to one coin), setting stop-losses (predetermined exit points if the price drops), and taking profits.</p>
      </>
    ),
    quiz: [
      { id: 'q1l3', text: 'What is "paper trading" in the context of crypto?', options: [{id: 'o1', text: 'Trading physical paper certificates'}, {id: 'o2', text: 'Using leverage to increase position size'}, {id: 'o3', text: 'Simulating trades with virtual money to practice strategies'}, {id: 'o4', text: 'Only trading coins listed on major newspapers'}], correctAnswerId: 'o3', explanation: "Paper trading allows you to practice buying and selling without risking real capital, ideal for volatile assets like meme coins."},
      { id: 'q2l3', text: 'Why is position sizing important, especially with meme coins?', options: [{id: 'o1', text: 'Larger positions guarantee higher profits'}, {id: 'o2', text: 'It helps manage risk by limiting potential losses from any single volatile asset'}, {id: 'o3', text: 'It determines the transaction speed'}, {id: 'o4', text: 'It unlocks premium features on exchanges'}], correctAnswerId: 'o2', explanation: "Due to high volatility, allocating only a small percentage of your capital to a single meme coin limits potential damage if the price crashes."},
      { id: 'q3l3', text: 'CoinGecko and CoinMarketCap can be used for:', options: [{id: 'o1', text: 'Executing real trades'}, {id: 'o2', text: 'Storing your cryptocurrency securely'}, {id: 'o3', text: 'Tracking prices and managing virtual portfolios (paper trading)'}, {id: 'o4', text: 'Writing smart contracts'}], correctAnswerId: 'o3', explanation: "These platforms provide price data, charts, and portfolio tracking features useful for both real and simulated trading."},
    ],
  },
  {
    id: 'l4',
    title: 'Lesson 4: The FOMO Cliff - Avoiding the Dump',
    content: (
      <>
        <p className="mb-2">FOMO (Fear Of Missing Out) is a powerful emotion in meme coin trading. Seeing a coin rapidly increase in price can tempt investors to jump in late, often near the peak. This is the "FOMO Cliff." Often, early investors or manipulators will "dump" their holdings onto these late buyers, causing the price to crash dramatically.</p>
        <p>Red flags include: parabolic price charts (near-vertical increases), excessive hype with little substance, promises of unrealistic guaranteed returns, and pressure to buy immediately. Resist the urge to chase pumps. Stick to your strategy, research thoroughly (even for meme coins), and never invest more than you can afford to lose.</p>
      </>
    ),
    pitfallWarning: (
        <div className="mt-6 p-4 border border-red-500/50 bg-red-900/30 rounded-lg">
            <h4 className="text-lg font-semibold text-red-400 flex items-center mb-2"><AlertTriangle size={20} className="mr-2"/>FOMO Cliff Warning!</h4>
            <p className="text-sm text-red-300">
            Chasing rapid price pumps (parabolic moves) is extremely risky! You might be buying at the top, just before early investors dump. Control your FOMO, stick to your plan, and avoid investing solely based on hype. Never invest more than you can lose.
            </p>
        </div>
    ),
    quiz: [
      { id: 'q1l4', text: 'What is the "FOMO Cliff" in meme coin trading?', options: [{id: 'o1', text: 'A geographical location where traders meet'}, {id: 'o2', text: 'Buying a coin early before the hype starts'}, {id: 'o3', text: 'The risky situation of buying into a coin during a rapid price surge, often near the peak'}, {id: 'o4', text: 'A type of advanced charting pattern'}], correctAnswerId: 'o3', explanation: "It describes the danger of entering a position driven by FOMO when the price is already highly inflated and vulnerable to a dump."},
      { id: 'q2l4', text: 'A "pump and dump" scheme involves:', options: [{id: 'o1', text: 'Slowly accumulating a coin over time'}, {id: 'o2', text: 'Artificially inflating the price of a coin through hype, then selling large amounts to late buyers'}, {id: 'o3', text: 'Donating cryptocurrency to charity'}, {id: 'o4', text: 'Providing liquidity to an exchange'}], correctAnswerId: 'o2', explanation: "Manipulators hype a coin to attract buyers, then sell their holdings at the inflated price, causing it to crash."},
      { id: 'q3l4', text: 'What is the best defense against FOMO-driven decisions?', options: [{id: 'o1', text: 'Following random anonymous accounts on X'}, {id: 'o2', text: 'Investing your entire savings quickly'}, {id: 'o3', text: 'Having a pre-defined trading strategy and sticking to it, avoiding emotional decisions'}, {id: 'o4', text: 'Buying only coins that have already gone up 1000%'}], correctAnswerId: 'o3', explanation: "A rational plan, risk management (like stop-losses and position sizing), and emotional discipline are key to avoiding FOMO traps."},
    ],
  },
];

const PASSING_PERCENTAGE = 0.75;
const LOCAL_STORAGE_KEY = 'memeCoinManiaProgress';

const MemeCoinManiaPage = () => {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [lessonStatus, setLessonStatus] = useState<Array<'locked' | 'unlocked' | 'completed'>>(
    lessonsData.map(() => 'unlocked' as const) // Initialize all lessons as unlocked with proper type
  );
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackModalContent, setFeedbackModalContent] = useState({ title: "", description: "" });
  const [showPostAlert, setShowPostAlert] = useState(false);

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
        // Ensure all lessons are unlocked while preserving completion status
        const updatedStatus = parsedStatus.map(status => 
          status === 'completed' ? 'completed' as const : 'unlocked' as const
        );
        setLessonStatus(updatedStatus);
        const lastCompletedIndex = updatedStatus.lastIndexOf('completed');
        const newCurrentIndex = updatedStatus.findIndex(status => status === 'unlocked');
        setCurrentLessonIndex(newCurrentIndex !== -1 ? newCurrentIndex : (lastCompletedIndex + 1 < lessonsData.length ? lastCompletedIndex + 1 : lastCompletedIndex));
      } else {
        // Initialize all lessons as unlocked
        const initialStatus = lessonsData.map(() => 'unlocked' as const);
        setLessonStatus(initialStatus);
        saveProgress(initialStatus);
      }
    }
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
      let solProvider: any;
      let walletName = providerName;

       if (providerName === 'phantom') {
        if (!(window.solana && window.solana.isPhantom)) {
          setWalletAlertConfig({
            title: "Phantom Not Detected",
            description: "Please install Phantom wallet to view your NFT status. Download it from https://phantom.app.",
          });
          setShowWalletAlert(true);
          return;
        }
        solProvider = window.solana;
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
        await solProvider.connect();
      }

      const solAccount = solProvider.publicKey.toString();
      setAccount(solAccount);

      // Fetch balance
      try {
      const solBalanceLamports = await solanaConnection.getBalance(new PublicKey(solAccount));
      setBalance(`${(solBalanceLamports / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
      } catch (error: any) {
        console.error("Failed to fetch Solana balance:", error);
        setBalance("Error fetching balance");
        setWalletAlertConfig({
          title: "Balance Fetch Error",
          description: "Failed to retrieve your SOL balance. The Solana network may be congested. Please try again later.",
        });
        setShowWalletAlert(true);
      }

      // Mock NFT status (deterministic for consistency)
      const hash = (str: string) => str.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0);
      const hasMockNFT = hash(solAccount) % 2 === 0;
      setMockNftStatus(hasMockNFT ? 'Meme Coin Master NFT: Owned!' : 'Meme Coin Master NFT: None found.');

      setWalletAlertConfig({
        title: `${walletName.charAt(0).toUpperCase() + walletName.slice(1)} Connected`,
        description: `Successfully connected: ${solAccount.slice(0, 4)}...${solAccount.slice(-4)}`,
      });
    } catch (error: any) {
      console.error("Wallet connection error:", error);
      setWalletAlertConfig({
        title: "Connection Error",
        description: `Failed to connect ${providerName}: ${error.message || 'Unknown error'}`,
      });
    }
    setShowWalletAlert(true);
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
      setFeedbackModalContent({ title: "Quiz Passed!", description: `You scored ${score}/${totalQuestions}. Great job! You can proceed.` });
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

      if (newLessonStatus.every(status => status === 'completed')) {
        const walletAddress = localStorage.getItem('walletAddress');
        if (walletAddress) {
          recordCourseCompletion(walletAddress, 'meme-coin-mania').catch(console.error);
        }
      }
    } else {
      setFeedbackModalContent({ title: "Quiz Failed", description: `You scored ${score}/${totalQuestions}. Review the lesson and try again. You need at least ${Math.ceil(PASSING_PERCENTAGE * totalQuestions)} correct answers.` });
    }
    setShowFeedbackModal(true);
  }, [currentLesson, selectedAnswers, lessonStatus, currentLessonIndex, lessonsData.length]);

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

  const allQuestionsAnswered = currentLesson?.quiz.every(q => selectedAnswers[q.id]) ?? false;

  const walletProviders: { name: WalletProviderOption; label: string; icon?: JSX.Element }[] = [
    { name: 'phantom', label: 'Phantom', icon: <Wallet size={20} className="mr-2 text-purple-500" /> },
  ];

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

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
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent glow-text">
              Meme Coin Mania
            </h1>
            <p className="text-xl text-gray-300 mb-2">Analyze trends, build a mock portfolio, and learn to navigate hype.</p>
            <p className="text-cyan-300 text-lg">
              Current Time: <span className="text-green-400 font-mono">{currentTime}</span>
            </p>
          </div>
          
          {/* Main content */}
          <div className="max-w-3xl mx-auto">
            {/* Back button */}
            <div className="mb-8">
              <Button variant="outline" size="sm" asChild className="bg-slate-800/50 hover:bg-slate-700/50 text-cyan-400 hover:text-cyan-300 border-cyan-500/30">
                <Link href="/courses" className="flex items-center space-x-1">
                  <ArrowLeft size={16} />
                  <span>Back to Courses</span>
                </Link>
              </Button>
            </div>

            {/* Course status */}
            <Card className="mb-8 bg-slate-800/50 border-2 border-cyan-500/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-cyan-400 mb-2">Meme Coin Mania: The Art of the Pump</h2>
                <p className="text-gray-300 mb-4">Master the psychology and mechanics of meme coin trading. Complete lessons to unlock the next course!</p>
              </CardContent>
            </Card>

            {/* Progress bar */}
            <div className="mb-8">
              <Progress value={progressPercentage} className="w-full bg-slate-800/50 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-pink-500" />
              <p className="text-center text-gray-300 mt-2">Progress: {Math.round(progressPercentage)}%</p>
            </div>

            {/* Lessons and quizzes */}
            <main className="space-y-8">
              {!allLessonsCompleted && currentLesson && lessonStatus[currentLessonIndex] !== 'locked' ? (
                <motion.section 
                  key={currentLessonIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-slate-800/50 p-6 rounded-xl shadow-lg border-2 border-cyan-500/30 backdrop-blur-sm"
                >
                  <h2 className="text-2xl font-semibold text-cyan-400 mb-4">{currentLesson.title}</h2>
                  <div className="text-gray-300 leading-relaxed mb-6">
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
                      <h3 className="text-xl font-semibold text-pink-400 mt-8 mb-4">Knowledge Check!</h3>
                      <RadioGroup className="space-y-6">
                        {currentLesson.quiz.map((q, qIndex) => (
                          <div key={q.id} className={`p-4 rounded-md border-2 ${quizSubmitted ? (selectedAnswers[q.id] === q.correctAnswerId ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10') : 'border-cyan-500/50 hover:border-cyan-500'}`}>
                            <p className="font-medium mb-2 text-gray-300">{qIndex + 1}. {q.text}</p>
                            {q.options.map(opt => (
                              <motion.div 
                                key={opt.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg border-2 hover:border-cyan-500 cursor-pointer transition-all duration-150 ${selectedAnswers[q.id] === opt.id ? 'border-cyan-500 ring-2 ring-cyan-500' : 'border-cyan-500/50'}`}
                                onClick={() => handleOptionChange(q.id, opt.id)}
                              >
                                <RadioGroupItem
                                  value={opt.id}
                                  id={`${q.id}-${opt.id}`}
                                  checked={selectedAnswers[q.id] === opt.id}
                                  disabled={quizSubmitted && quizPassed}
                                  className="border-cyan-500 text-cyan-500 focus:ring-cyan-500 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                                />
                                <Label htmlFor={`${q.id}-${opt.id}`} className="cursor-pointer flex-1 text-gray-300">{opt.text}</Label>
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
                              <p className="text-sm text-gray-400 mt-1">{q.explanation}</p>
                            )}
                          </div>
                        ))}
                      </RadioGroup>
                      <Button
                        onClick={handleSubmitQuiz}
                        className="mt-8 w-full bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white"
                        disabled={!allQuestionsAnswered || (quizSubmitted && quizPassed)}
                      >
                        Submit Quiz
                      </Button>
                    </motion.div>
                  )}
                </motion.section>
              ) : (
                <motion.section 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="bg-slate-800/50 p-6 rounded-xl shadow-lg border-2 border-cyan-500/30 backdrop-blur-sm text-center"
                >
                  <Award className="w-20 h-20 text-cyan-400 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-cyan-400 mb-3">Course Complete!</h2>
                  <p className="text-xl text-gray-300 mb-4">You've mastered the art of meme coin trading!</p>
                  <div className="flex items-center justify-center space-x-3 my-6">
                    <Award className="w-12 h-12 text-cyan-400" />
                    <div>
                      <p className="text-lg font-semibold text-cyan-400">REWARD: Meme Coin Master NFT</p>
                      <p className="text-gray-400">Your ability to navigate meme coin markets is recognized.</p>
                    </div>
                  </div>
                  {lessonsData.find(l => l.pitfallWarning && lessonStatus[lessonsData.indexOf(l)] === 'completed')?.pitfallWarning}
                  <Button asChild className="mt-6 w-full md:w-auto bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white">
                    <Link href="/community-strategy">Advance to Next Course</Link>
                  </Button>
                </motion.section>
              )}

              {/* Wallet section */}
              <Card className="bg-slate-800/50 border-2 border-cyan-500/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-cyan-400 mb-4 text-center">Connect Your Wallet</h2>
                  <p className="text-gray-300 mb-4 text-center">Connect a Solana wallet to view your address, balance, and NFT status.</p>
                  
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
                            aria-label={`Connect ${wallet.label}`}
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
                      className="mt-4 text-gray-300 space-y-1"
                    >
                      <p><strong>Address:</strong> {account}</p>
                      <p><strong>Balance:</strong> {balance || 'Fetching balance...'}</p>
                      <p><strong>NFT Status:</strong> {mockNftStatus || 'Checking NFT status...'}</p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </main>

            {/* Footer */}
            <footer className="mt-12 text-center">
              <p className="text-sm text-gray-400">
                #StayBuilding #StayHODLing
              </p>
            </footer>
          </div>
        </div>

        {/* Alert dialogs */}
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
                <AlertDialogAction onClick={() => setShowFeedbackModal(false)} className="bg-green-600 hover:bg-green-700">To the Moon!</AlertDialogAction>
              ) : (
                <>
                  <AlertDialogCancel onClick={() => setShowFeedbackModal(false)}>Review Lesson</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {setSelectedAnswers({}); setQuizSubmitted(false); setQuizPassed(false); setCurrentScore(0); setShowFeedbackModal(false);}} className="bg-blue-600 hover:bg-blue-700">Retry Quiz</AlertDialogAction>
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
              <AlertDialogAction onClick={() => setShowWalletAlert(false)} className="bg-blue-600 hover:bg-blue-700">OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <style jsx global>{`
          .glow-text {
            text-shadow: 0 0 10px currentColor;
          }
        `}</style>
      </div>
    </TokenGate>
  );
};

export default MemeCoinManiaPage;