export const dynamic = "force-static";

'use client'

import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useSwipeable } from 'react-swipeable';
import { motion } from 'framer-motion';
import { LineChart, ArrowLeft, CheckCircle, XCircle, Award, AlertTriangle, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
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

declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
  }
}

type WalletProviderOption = 'metamask' | 'phantom' | 'jup' | 'magic-eden';

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
    title: 'Lesson 1: Charting Basics - Reading the Patterns',
    content: (
      <>
        <p className="mb-2">Technical Analysis (TA) starts with understanding charts. Candlestick charts show price action over time, with each candle representing open, high, low, and close prices. Trendlines (up, down, sideways) help identify the market's direction. Support levels are price points where buying pressure tends to overcome selling pressure, while resistance levels are where selling pressure overcomes buying.</p>
        <p>Recognizing basic patterns like head and shoulders, double tops/bottoms, and triangles can provide clues about potential future price movements. Volume analysis also plays a key role in confirming pattern strength.</p>
      </>
    ),
    quiz: [
      { id: 'q1l1', text: 'What does a candlestick chart primarily show?', options: [{id: 'o1', text: 'Only the closing price'}, {id: 'o2', text: 'Open, high, low, and close prices for a period'}, {id: 'o3', text: 'The number of traders'}, {id: 'o4', text: 'News sentiment'}], correctAnswerId: 'o2', explanation: "Candlesticks provide a visual representation of price movement including open, high, low, and close for a specific time frame."},
      { id: 'q2l1', text: 'A price level where selling pressure historically overcomes buying pressure is known as:', options: [{id: 'o1', text: 'Support'}, {id: 'o2', text: 'Trendline'}, {id: 'o3', text: 'Resistance'}, {id: 'o4', text: 'Volume Spike'}], correctAnswerId: 'o3', explanation: "Resistance levels act as a 'ceiling' where price often struggles to break above."},
      { id: 'q3l1', text: 'Why is trading volume important in TA?', options: [{id: 'o1', text: 'It determines transaction fees'}, {id: 'o2', text: 'It can help confirm the strength or weakness of a price move or pattern'}, {id: 'o3', text: 'It dictates the speed of the blockchain'}, {id: 'o4', text: 'It is only relevant for Bitcoin'}], correctAnswerId: 'o2', explanation: "High volume accompanying a breakout, for instance, gives more conviction to the move."},
    ],
  },
  {
    id: 'l2',
    title: 'Lesson 2: Key Indicators - Tools for Analysis',
    content: (
       <>
        <p className="mb-2">Indicators are calculations based on price and/or volume, plotted on charts to provide insights. Moving Averages (MAs) smooth out price data to identify trend direction (e.g., 50-day MA, 200-day MA). The Relative Strength Index (RSI) measures the speed and change of price movements, indicating overbought or oversold conditions.</p>
        <p>MACD (Moving Average Convergence Divergence) shows the relationship between two MAs and can signal trend changes or momentum. Fibonacci retracement levels are horizontal lines that indicate where support and resistance are likely to occur. No single indicator is foolproof; they are best used in combination.</p>
      </>
    ),
    quiz: [
      { id: 'q1l2', text: 'What does the Relative Strength Index (RSI) primarily indicate?', options: [{id: 'o1', text: 'Future price targets'}, {id: 'o2', text: 'Market liquidity'}, {id: 'o3', text: 'Overbought or oversold conditions'}, {id: 'o4', text: 'The number of active wallets'}], correctAnswerId: 'o3', explanation: "RSI is a momentum oscillator; values typically above 70 suggest overbought conditions, and below 30 suggest oversold."},
      { id: 'q2l2', text: 'Moving Averages are commonly used to:', options: [{id: 'o1', text: 'Predict exact tops and bottoms'}, {id: 'o2', text: 'Identify trend direction and potential support/resistance levels'}, {id: 'o3', text: 'Calculate gas fees'}, {id: 'o4', text: 'Measure network security'}], correctAnswerId: 'o2', explanation: "MAs help filter out market 'noise' and highlight the underlying trend."},
      { id: 'q3l2', text: 'The MACD indicator is designed to reveal changes in what aspects of a trend?', options: [{id: 'o1', text: 'Only the trend direction'}, {id: 'o2', text: 'Strength, direction, momentum, and duration'}, {id: 'o3', text: 'The project\'s team members'}, {id: 'o4', text: 'The total supply of a coin'}], correctAnswerId: 'o2', explanation: "MACD is a versatile trend-following momentum indicator."},
    ],
  },
  {
    id: 'l3',
    title: 'Lesson 3: Leverage Trading Concepts - Amplifying Outcomes',
    content: (
      <>
        <p className="mb-2">Leverage trading allows you to control a larger position with a smaller amount of capital (margin). For example, 10x leverage means you can trade with 10 times your initial margin. "Going long" means betting the price will go up; "going short" means betting it will go down. Exchanges offer various order types like market orders (execute immediately at current price) and limit orders (execute at a specific price or better).</p>
        <p>While leverage can amplify profits, it equally amplifies losses. If the market moves against your leveraged position significantly, you risk liquidation – the exchange forcibly closes your position to cover losses, potentially wiping out your margin.</p>
      </>
    ),
    quiz: [
      { id: 'q1l3', text: 'What does "10x leverage" mean in trading?', options: [{id: 'o1', text: 'You earn 10% interest'}, {id: 'o2', text: 'You can trade with 10 times your deposited margin'}, {id: 'o3', text: 'The trade will last for 10 days'}, {id: 'o4', text: 'You pay 10 times the normal fees'}], correctAnswerId: 'o2', explanation: "Leverage allows traders to control a larger position size than their own capital would normally allow."},
      { id: 'q2l3', text: 'If a trader "goes short" on an asset, they are betting that:', options: [{id: 'o1', text: 'The price will increase'}, {id: 'o2', text: 'The price will stay the same'}, {id: 'o3', text: 'The price will decrease'}, {id: 'o4', text: 'The asset will be delisted'}], correctAnswerId: 'o3', explanation: "Short selling profits from a decline in the asset's price."},
      { id: 'q3l3', text: 'What is "liquidation" in leverage trading?', options: [{id: 'o1', text: 'Converting crypto to cash'}, {id: 'o2', text: 'When a trade is highly profitable'}, {id: 'o3', text: 'The forced closure of a position by the exchange due to insufficient margin, often resulting in loss of initial capital'}, {id: 'o4', text: 'A type of market order'}], correctAnswerId: 'o3', explanation: "Liquidation occurs when losses erode the margin to a point where the exchange closes the position to prevent further debt."},
    ],
  },
  {
    id: 'l4',
    title: 'Lesson 4: Risk Management - Protecting Your Capital',
    content: (
      <>
        <p className="mb-2">Effective risk management is paramount in leveraged trading. Position sizing involves determining how much capital to allocate to a single trade, usually a small percentage of your total trading capital. Stop-loss orders automatically close a losing trade once it reaches a predetermined price level, limiting potential losses.</p>
        <p>Understanding your risk-reward ratio before entering a trade is crucial. Never trade with money you cannot afford to lose, especially with leverage. Emotional discipline is key to avoiding impulsive decisions based on fear or greed.</p>
      </>
    ),
    pitfallWarning:(
        <div className="mt-6 p-4 border border-red-500/50 bg-red-900/30 rounded-lg">
            <h4 className="text-lg font-semibold text-red-400 flex items-center mb-2"><AlertTriangle size={20} className="mr-2"/>Leverage Liquidation Trap!</h4>
            <p className="text-sm text-red-300">
            Leverage magnifies both gains and losses. Without proper risk management (stop-losses, position sizing), you can be liquidated quickly, losing your entire margin. Trade responsibly and understand the risks before using leverage.
            </p>
        </div>
    ),
    quiz: [
      { id: 'q1l4', text: 'What is a primary purpose of a stop-loss order?', options: [{id: 'o1', text: 'To guarantee a profit'}, {id: 'o2', text: 'To limit potential losses on a trade'}, {id: 'o3', text: 'To increase leverage'}, {id: 'o4', text: 'To enter a trade at a better price'}], correctAnswerId: 'o2', explanation: "A stop-loss order automatically closes a position at a specified price to prevent further losses."},
      { id: 'q2l4', text: 'Proper position sizing helps traders to:', options: [{id: 'o1', text: 'Win every trade'}, {id: 'o2', text: 'Avoid all losses'}, {id: 'o3', text: 'Manage risk by not overexposing their capital to a single trade'}, {id: 'o4', text: 'Predict market direction with certainty'}], correctAnswerId: 'o3', explanation: "By risking only a small percentage of total capital per trade, traders can withstand losing streaks."},
      { id: 'q3l4', text: 'A key principle of risk management in trading is:', options: [{id: 'o1', text: 'Always using maximum leverage'}, {id: 'o2', text: 'Ignoring small losses'}, {id: 'o3', text: 'Never trading with money you cannot afford to lose'}, {id: 'o4', text: 'Following anonymous tips on social media'}], correctAnswerId: 'o3', explanation: "This fundamental rule helps protect traders from financial ruin, especially in volatile markets like crypto."},
    ],
  },
];

const PASSING_PERCENTAGE = 0.75;
const LOCAL_STORAGE_KEY = 'technicalAnalysisProgress';

export default function TechnicalAnalysisPage() {
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
  const [showSimulationAlert, setShowSimulationAlert] = useState(false);

  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [mockNftStatus, setMockNftStatus] = useState<string | null>(null);
  const [showWalletAlert, setShowWalletAlert] = useState(false);
  const [walletAlertConfig, setWalletAlertConfig] = useState({ title: "", description: "" });
  const [connectedWalletProvider, setConnectedWalletProvider] = useState<WalletProviderOption | null>(null);
  const [showWalletSelector, setShowWalletSelector] = useState(false);

  const solanaNetwork = "https://api.mainnet-beta.solana.com";
  const solanaConnection = new Connection(solanaNetwork);

  const currentLesson = lessonsData[currentLessonIndex];
  const allLessonsCompleted = lessonStatus.every(status => status === 'completed');
  
  const [currentTime, setCurrentTime] = useState<string>("");

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
      switch (providerName) {
        case 'metamask':
          if (typeof window.ethereum === 'undefined') {
            setWalletAlertConfig({ title: "MetaMask Not Detected", description: "Please install MetaMask to continue." });
            setShowWalletAlert(true);
            return;
          }
           let ethProvider = window.ethereum;
          if (window.ethereum.providers?.length) {
             const metaMaskProvider = window.ethereum.providers.find((p: any) => p.isMetaMask);
            if (!metaMaskProvider) {
                 setWalletAlertConfig({ title: "MetaMask Required", description: "Please select MetaMask. If installed, ensure it's your active wallet or try refreshing." });
                 setShowWalletAlert(true);
                 return;
            }
            ethProvider = metaMaskProvider;
          } else if (!window.ethereum.isMetaMask) {
             setWalletAlertConfig({ title: "MetaMask Required", description: "Please use MetaMask. Other Ethereum wallets are not supported for this action." });
             setShowWalletAlert(true);
             return;
          }
          
          const web3 = new Web3(ethProvider);
          const accounts = await ethProvider.request({ method: 'eth_requestAccounts' });
          const userAccount = accounts[0];
          setAccount(userAccount);
          const balanceWei = await web3.eth.getBalance(userAccount);
          const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
          setBalance(`${parseFloat(balanceEth).toFixed(4)} ETH`);
          setMockNftStatus(Math.random() > 0.5 ? 'Mock Hoodie-Verse NFT: Owned!' : 'Mock Hoodie-Verse NFT: None found.');
          setWalletAlertConfig({ title: "MetaMask Connected", description: `Successfully connected: ${userAccount.slice(0, 6)}...${userAccount.slice(-4)}` });
          break;

        case 'phantom':
        case 'jup': 
        case 'magic-eden':
          let solProvider;
           if (providerName === 'phantom') {
            if (!(window.solana && window.solana.isPhantom)) {
              setWalletAlertConfig({ title: "Phantom Not Detected", description: "Please install Phantom wallet to continue." });
              setShowWalletAlert(true);
              return;
            }
            solProvider = window.solana;
          } else { 
             if (window.solana && window.solana.isPhantom) solProvider = window.solana;
             else if (window.solana) solProvider = window.solana;
             else {
                setWalletAlertConfig({ title: "Solana Wallet Not Detected", description: `Please install a compatible Solana wallet (e.g., Phantom) for ${providerName}.` });
                setShowWalletAlert(true);
                return;
             }
          }
          await solProvider.connect();
          const solAccount = solProvider.publicKey.toString();
          setAccount(solAccount);
          const solBalanceLamports = await solanaConnection.getBalance(new PublicKey(solAccount));
          setBalance(`${(solBalanceLamports / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
          setMockNftStatus(Math.random() > 0.5 ? 'Mock Solana NFT: Owned!' : 'Mock Solana NFT: None found.');
          
          let successTitle = `${providerName.charAt(0).toUpperCase() + providerName.slice(1)} Connected`;
          if (providerName === 'jup') successTitle = `Connected via ${solProvider.isPhantom ? 'Phantom' : 'Solana Wallet'} for JUP`;
          if (providerName === 'magic-eden') successTitle = `Connected via ${solProvider.isPhantom ? 'Phantom' : 'Solana Wallet'} for Magic Eden`;

          setWalletAlertConfig({ title: successTitle, description: `Successfully connected: ${solAccount.slice(0, 4)}...${solAccount.slice(-4)}` });
          
          if (providerName === 'jup') setTimeout(() => alert("Simulating Jupiter Swap interaction: You can now trade tokens! (Mock)"), 500);
          if (providerName === 'magic-eden') setTimeout(() => alert("Simulating Magic Eden interaction: You can now browse NFTs! (Mock)"), 500);
          break;
        default:
          setWalletAlertConfig({ title: "Unsupported Wallet", description: "This wallet provider is not yet supported." });
      }
    } catch (error: any) {
      console.error("Wallet connection error:", error);
      let description = `Failed to connect ${providerName}. Please try again.`;
       if (error.code === 4001 || error.message?.includes('User rejected the request')) { 
          description = 'Connection request rejected. Please approve in your wallet.';
      } else if (error.message?.includes('missing provider')) {
          description = `${providerName.charAt(0).toUpperCase() + providerName.slice(1)} not found. Please ensure it's installed and enabled.`;
      }
      setWalletAlertConfig({ title: "Connection Error", description });
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
    if(!currentLesson) return;
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
      setFeedbackModalContent({ title: "Quiz Passed!", description: `You scored ${score}/${totalQuestions}. Sharp analysis! You can proceed.` });
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
      setFeedbackModalContent({ title: "Quiz Failed", description: `You scored ${score}/${totalQuestions}. Review the charts and indicators, then try again. You need at least ${Math.ceil(PASSING_PERCENTAGE * totalQuestions)} correct answers.` });
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

  const handleMockTradeSimulation = () => {
    setShowSimulationAlert(true);
  };

  const allQuestionsAnswered = currentLesson?.quiz.every(q => selectedAnswers[q.id]);
  
  const walletProviders: { name: WalletProviderOption; label: string; icon?: JSX.Element }[] = [
    { name: 'metamask', label: 'MetaMask', icon: <Wallet size={20} className="mr-2 text-orange-500" /> },
    { name: 'phantom', label: 'Phantom', icon: <Wallet size={20} className="mr-2 text-purple-500" /> },
    { name: 'jup', label: 'Jupiter', icon: <Wallet size={20} className="mr-2 text-blue-500" /> },
    { name: 'magic-eden', label: 'Magic Eden', icon: <Wallet size={20} className="mr-2 text-green-500" /> },
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
            Technical Analysis Tactics
          </h1>
          <p className="text-xl text-gray-300 mb-2">Master chart patterns, indicators, and leverage trading.</p>
          <p className="text-cyan-300 text-lg">
            Current Time: <span className="text-green-400 font-mono">{currentTime}</span>
          </p>
        </div>
        {/* Main content: lessons, quizzes, wallet, etc. */}
        <div className="max-w-3xl mx-auto">
          <Progress value={progressPercentage} className="w-full max-w-3xl mb-8 bg-orange-900/50 [&>div]:bg-orange-500" />

          {!allLessonsCompleted && currentLesson && lessonStatus[currentLessonIndex] !== 'locked' ? (
            <motion.section 
              key={currentLessonIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-card p-6 md:p-8 rounded-xl shadow-lg border border-orange-600 w-full neon-border-orange hover:shadow-[0_0_25px_rgba(251,146,60,1)] transition-all duration-300"
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
                    className="mt-8 w-full bg-orange-500 hover:bg-green-600 text-background shadow-[0_0_10px_theme(colors.orange.500)] hover:shadow-[0_0_15px_theme(colors.green.400)] transition-all duration-300"
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
              <h2 className="text-3xl md:text-4xl font-bold text-green-300 mb-3">Course Complete! Chart Commander!</h2>
              <p className="text-xl text-foreground mb-4">You've mastered the art of Technical Analysis!</p>
              <div className="flex items-center justify-center space-x-3 my-6">
                <LineChart className="w-12 h-12 text-orange-400" data-ai-hint="chart graph" />
                <div>
                  <p className="text-lg md:text-xl font-semibold text-primary">REWARD: Chart Commander NFT</p>
                  <p className="text-md text-muted-foreground">Your ability to read the markets is recognized.</p>
                </div>
              </div>
               <Button
                  onClick={handleMockTradeSimulation}
                  className="bg-orange-500 hover:bg-orange-600 text-background min-w-[200px] transition-all mt-4 shadow-[0_0_10px_theme(colors.orange.500)] hover:shadow-[0_0_15px_theme(colors.orange.400)]"
                >
                  <LineChart size={18} className="mr-2"/> Simulate Leveraged Trade
              </Button>
              {lessonsData.find(l => l.pitfallWarning && lessonStatus[lessonsData.indexOf(l)] === 'completed')?.pitfallWarning}
              <Button asChild className="mt-6 w-full md:w-auto bg-cyan-500 hover:bg-cyan-600 text-background shadow-[0_0_10px_theme(colors.cyan.500)] hover:shadow-[0_0_15px_theme(colors.cyan.400)] transition-all duration-300">
                  <Link href="/courses">Back to Courses</Link>
              </Button>
            </motion.section>
          )}

          <section className="my-8 text-center p-6 bg-card rounded-xl shadow-lg border border-orange-600 neon-border-orange w-full">
              <h2 className="text-2xl font-bold text-primary mb-2">Connect Your Wallet</h2>
              <p className="text-sm text-muted-foreground mb-4">Safely connect your preferred wallet to view your balance and NFTs.</p>
              
              <div className="flex justify-center items-center">
                <Button 
                    onClick={() => setShowWalletSelector(!showWalletSelector)}
                    className="px-6 py-3 mb-4 rounded-lg shadow-lg bg-gradient-to-r from-green-500 to-purple-600 hover:from-green-600 hover:to-purple-700 text-white min-w-[240px] transition-all duration-300 flex items-center justify-center"
                    aria-expanded={showWalletSelector}
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
                  <p><strong>Balance:</strong> {balance || 'Loading...'}</p>
                  <p>{mockNftStatus || 'Checking NFT status...'}</p>
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
                   <AlertDialogAction onClick={() => setShowFeedbackModal(false)} className="bg-green-600 hover:bg-green-700">Chart Mastered!</AlertDialogAction>
                ) : (
                  <>
                    <AlertDialogCancel onClick={() => setShowFeedbackModal(false)}>Review Lesson</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {setSelectedAnswers({}); setQuizSubmitted(false); setQuizPassed(false); setCurrentScore(0); setShowFeedbackModal(false);}} className="bg-orange-500 hover:bg-orange-600 text-background">Retry Quiz</AlertDialogAction>
                  </>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={showSimulationAlert} onOpenChange={setShowSimulationAlert}>
              <AlertDialogContent>
                  <AlertDialogHeader>
                  <AlertDialogTitle>Mock Leveraged Trade Simulated!</AlertDialogTitle>
                  <AlertDialogDescription>
                      Your simulated 10x leveraged LONG on $HOODIE has been 'executed'. Market moved in your favor by 5%! Your paper profit is 50% (minus fees). Remember, high leverage is high risk!
                  </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                  <AlertDialogAction onClick={() => setShowSimulationAlert(false)} className="bg-orange-500 hover:bg-orange-600 text-background">Understood!</AlertDialogAction>
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
                  {walletAlertConfig.title !== "MetaMask Connected" && walletAlertConfig.title !== "Phantom Connected" && !walletAlertConfig.title.includes("Connected via") && <AlertDialogCancel>Cancel</AlertDialogCancel> }
                  <AlertDialogAction onClick={() => setShowWalletAlert(false)} className="bg-orange-500 hover:bg-orange-600 text-background">OK</AlertDialogAction>
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
