'use client'

import { Button } from "@/components/ui/button";
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useSwipeable } from 'react-swipeable';
import { motion } from 'framer-motion';
import { ScrollText, ArrowLeft, CheckCircle, XCircle, Award, AlertTriangle, Send, Wallet, ChevronDown, ChevronUp, Home, ArrowRight, LockKeyhole } from 'lucide-react';
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

declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
    solflare?: any;
  }
}

type WalletProviderOption = 'metamask' | 'phantom' | 'solflare' | 'jup' | 'magic-eden';

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
    title: 'Understanding X\'s Role in Crypto',
    content: 'Learn why X (formerly Twitter) is a crucial platform for crypto news and trends.',
    quiz: [
      { id: 'q1l1', text: 'Why is X particularly influential in the crypto world?', options: [{id: 'o1', text: 'It\'s the official communication channel for all blockchains'}, {id: 'o2', text: 'Its real-time nature and direct access to influencers and projects'}, {id: 'o3', text: 'It hosts the only decentralized crypto exchanges'}, {id: 'o4', text: 'All major crypto transactions are announced there first'}], correctAnswerId: 'o2', explanation: "X is a crucial platform for crypto news and trends due to its real-time nature and direct access to influencers and projects."},
    ],
  },
  {
    id: 'l2',
    title: 'Curating Your Crypto X Feed',
    content: 'Tips and tricks for building a valuable X feed to stay informed and spot opportunities.',
    quiz: [
      { id: 'q1l2', text: 'What is a good strategy for curating your crypto X feed?', options: [{id: 'o1', text: 'Follow every single crypto account you find'}, {id: 'o2', text: 'Focus on established projects and reputable analysts'}, {id: 'o3', text: 'Only follow accounts with anonymous profiles'}, {id: 'o4', text: 'Completely ignore all news and rely on charts only'}], correctAnswerId: 'o2', explanation: "Focusing on established projects and reputable analysts is a good strategy for curating a valuable X feed."},
    ],
  },
  {
    id: 'l3',
    title: 'Crafting Engaging Crypto Posts',
    content: 'Learn how to create compelling content for X to build your own influence and community.',
    quiz: [
      { id: 'q1l3', text: 'What makes a crypto post on X engaging?', options: [{id: 'o1', text: 'Using lots of technical jargon'}, {id: 'o2', text: 'Posting irrelevant content frequently'}, {id: 'o3', text: 'Providing valuable insights and interacting with followers'}, {id: 'o4', text: 'Copy-pasting news from other sources'}], correctAnswerId: 'o3', explanation: "Providing valuable insights and interacting with followers is a key factor in creating engaging crypto posts on X."},
    ],
  },
  {
    id: 'l4',
    title: 'Measuring X Influence and Sentiment',
    content: 'Explore tools and techniques to gauge market sentiment and the influence of key X accounts.',
    quiz: [
      { id: 'q1l4', text: 'What does sentiment analysis on X help you understand?', options: [{id: 'o1', text: 'The exact price prediction of a coin'}, {id: 'o2', text: 'The general feeling or mood of the market towards an asset'}, {id: 'o3', text: 'Which exchange has the lowest fees'}, {id: 'o4', text: 'The technical specifications of a blockchain'}], correctAnswerId: 'o2', explanation: "Sentiment analysis on X helps you understand the general feeling or mood of the market towards an asset."},
    ],
  },
];

const PASSING_PERCENTAGE = 0.75;
const LOCAL_STORAGE_KEY = 'cryptoXInfluenceProgress';

export default function CryptoXInfluencePage() {
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
  const [showPostAlert, setShowPostAlert] = useState(false);

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
        case 'solflare':
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
          } else if (providerName === 'solflare') {
             if (!(window.solflare && window.solflare.isSolflare) && !(window.solana && window.solana.isSolflare)) {
                setWalletAlertConfig({ title: "Solflare Not Detected", description: "Please install Solflare wallet to continue." });
                setShowWalletAlert(true);
                return;
            }
            solProvider = window.solflare || window.solana;
          } else { 
             if (window.solana && window.solana.isPhantom) solProvider = window.solana;
             else if (window.solflare && window.solflare.isSolflare) solProvider = window.solflare;
             else if (window.solana) solProvider = window.solana;
             else {
                setWalletAlertConfig({ title: "Solana Wallet Not Detected", description: `Please install a compatible Solana wallet (e.g., Phantom, Solflare) for ${providerName}.` });
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
          if (providerName === 'jup') successTitle = `Connected via ${solProvider.isPhantom ? 'Phantom' : solProvider.isSolflare ? 'Solflare' : 'Solana Wallet'} for JUP`;
          if (providerName === 'magic-eden') successTitle = `Connected via ${solProvider.isPhantom ? 'Phantom' : solProvider.isSolflare ? 'Solflare' : 'Solana Wallet'} for Magic Eden`;

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
      setFeedbackModalContent({ title: "Quiz Passed!", description: `You scored ${score}/${totalQuestions}. Thread successfully posted! You can proceed.` });
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
      setFeedbackModalContent({ title: "Quiz Failed", description: `You scored ${score}/${totalQuestions}. Review the influence tactics and try again. You need at least ${Math.ceil(PASSING_PERCENTAGE * totalQuestions)} correct answers.` });
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

  const handleMockPostGeneration = () => {
    setShowPostAlert(true);
  };

  const allQuestionsAnswered = currentLesson?.quiz.every(q => selectedAnswers[q.id]);

  const walletProviders: { name: WalletProviderOption; label: string; icon?: JSX.Element }[] = [
    { name: 'metamask', label: 'MetaMask', icon: <Wallet size={20} className="mr-2 text-orange-500" /> },
    { name: 'phantom', label: 'Phantom', icon: <Wallet size={20} className="mr-2 text-purple-500" /> },
    { name: 'solflare', label: 'Solflare', icon: <Wallet size={20} className="mr-2 text-yellow-500" /> },
    { name: 'jup', label: 'JUP Wallet', icon: <Wallet size={20} className="mr-2 text-green-500" /> },
    { name: 'magic-eden', label: 'Magic Eden Wallet', icon: <Wallet size={20} className="mr-2 text-blue-500" /> },
  ];


  return (
    <div className="flex flex-col items-center min-h-screen py-8 px-4 bg-background text-foreground">
      <div className="w-full max-w-4xl mb-8 relative">
        <div className="absolute top-0 left-0 z-10 pt-4 pl-4 md:pt-0 md:pl-0">
          <Button variant="outline" size="sm" asChild className="bg-card hover:bg-muted text-accent hover:text-accent-foreground border-accent">
            <Link href="/" className="flex items-center space-x-1">
              <Home size={16} />
              <span>Back to Home</span>
            </Link>
          </Button>
        </div>
        <header className="text-center pt-16 md:pt-8">
           <h1 className="text-4xl md:text-5xl font-bold text-purple-400 mb-2">
            Crypto X Influence
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Master social media to navigate and influence crypto trends
          </p>
        </header>
      </div>

      <Progress value={progressPercentage} className="w-full max-w-3xl mb-8 bg-purple-200 [&>div]:bg-purple-500" />

      <main className="w-full max-w-3xl flex flex-col items-center py-8 space-y-10">
        {!allLessonsCompleted && currentLesson && lessonStatus[currentLessonIndex] !== 'locked' ? (
          <motion.section 
            key={currentLessonIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-card p-6 md:p-8 rounded-xl shadow-lg border border-purple-600 w-full neon-border-purple hover:shadow-[0_0_25px_rgba(190,72,255,1)] transition-all duration-300"
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
                    <div key={q.id} className={`p-4 rounded-md border-2 ${quizSubmitted ? (selectedAnswers[q.id] === q.correctAnswerId ? 'border-green-500 bg-green-500/10 neon-border-green' : 'border-red-500 bg-red-500/10 neon-border-red') : 'border-purple-900 hover:border-purple-600'}`}>
                      <p className="font-medium mb-2">{qIndex + 1}. {q.text}</p>
                      {q.options.map(opt => (
                        <motion.div 
                            key={opt.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex items-center space-x-3 p-3 bg-muted/30 rounded-lg border-2 hover:border-purple-600 cursor-pointer transition-all duration-150 ${selectedAnswers[q.id] === opt.id ? 'border-purple-500 ring-2 ring-purple-500 neon-border-purple' : 'border-purple-900'}`}
                            onClick={() => handleOptionChange(q.id, opt.id)}
                        >
                          <RadioGroupItem
                            value={opt.id}
                            id={`${q.id}-${opt.id}`}
                            checked={selectedAnswers[q.id] === opt.id}
                            disabled={quizSubmitted && quizPassed}
                            className="border-purple-600 text-purple-600 focus:ring-purple-500 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-500"
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
                  className="mt-8 w-full bg-purple-600 hover:bg-purple-700 text-white shadow-[0_0_10px_theme(colors.purple.600)] hover:shadow-[0_0_15px_theme(colors.purple.500)] transition-all duration-300"
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
            className="bg-card p-6 md:p-8 rounded-xl shadow-lg border-2 border-purple-500 neon-border-purple hover:shadow-[0_0_30px_rgba(190,72,255,1)] w-full text-center"
          >
            <Award className="w-20 h-20 text-purple-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-purple-300 mb-3">Course Complete! Thread Tycoon!</h2>
            <p className="text-xl text-foreground mb-4">You've mastered the art of crypto X influence!</p>
            <div className="flex items-center justify-center space-x-3 my-6">
              <ScrollText className="w-12 h-12 text-purple-400" data-ai-hint="scroll document" />
              <div>
                <p className="text-lg md:text-xl font-semibold text-primary">REWARD: Thread Tycoon NFT</p>
                <p className="text-md text-muted-foreground">Your ability to craft viral crypto narratives is recognized.</p>
              </div>
            </div>
             <Button
                onClick={handleMockPostGeneration}
                className="bg-purple-600 hover:bg-purple-700 text-white min-w-[200px] transition-all mt-4 shadow-[0_0_10px_theme(colors.purple.600)] hover:shadow-[0_0_15px_theme(colors.purple.500)]"
              >
                <Send size={18} className="mr-2"/> Simulate X Post
            </Button>
            {lessonsData.find(l => l.pitfallWarning && lessonStatus[lessonsData.indexOf(l)] === 'completed')?.pitfallWarning}
            <Button asChild className="mt-6 w-full md:w-auto bg-purple-500 hover:bg-purple-600 text-background shadow-[0_0_10px_theme(colors.purple.500)] hover:shadow-[0_0_15px_theme(colors.purple.400)] transition-all duration-300">
                <Link href="/courses">Advance to Community Strategy</Link>
            </Button>
          </motion.section>
        )}

        <section className="my-8 text-center p-6 bg-card rounded-xl shadow-lg border border-purple-600 neon-border-purple w-full">
            <h2 className="text-2xl font-bold text-primary mb-2">Connect Your Wallet</h2>
            <p className="text-sm text-muted-foreground mb-4">Safely connect your preferred wallet to view your balance and NFTs.</p>
            
            <div className="flex justify-center items-center">
             <Button 
                onClick={() => setShowWalletSelector(!showWalletSelector)}
                className="px-6 py-3 mb-4 rounded-lg shadow-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white min-w-[240px] transition-all duration-300 flex items-center justify-center"
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
                    className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 overflow-hidden"
                >
                    {walletProviders.map(wallet => (
                        <Button
                            key={wallet.name}
                            onClick={() => handleWalletConnection(wallet.name)}
                            className="w-full px-6 py-3 rounded-lg shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300 flex items-center justify-center"
                        >
                           {wallet.icon} {wallet.label}
                        </Button>
                    ))}
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
                 <AlertDialogAction onClick={() => setShowFeedbackModal(false)} className="bg-purple-600 hover:bg-purple-700">Engage!</AlertDialogAction>
              ) : (
                <>
                  <AlertDialogCancel onClick={() => setShowFeedbackModal(false)}>Review Lesson</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {setSelectedAnswers({}); setQuizSubmitted(false); setQuizPassed(false); setCurrentScore(0); setShowFeedbackModal(false);}} className="bg-purple-600 hover:bg-purple-700">Retry Quiz</AlertDialogAction>
                </>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showPostAlert} onOpenChange={setShowPostAlert}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Mock X Post Generated!</AlertDialogTitle>
                <AlertDialogDescription>
                    Your simulated X post: "Just learned about finding alpha on X at #HoodieAcademy! Feeling bullish on $HOODIE 😉 #StayBuilding #Crypto" has been 'posted'. In reality, this would share to your connected X account.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogAction onClick={() => setShowPostAlert(false)} className="bg-purple-600 hover:bg-purple-700">Got it!</AlertDialogAction>
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
                {walletAlertConfig.title !== "MetaMask Connected" && walletAlertConfig.title !== "Phantom Connected" && walletAlertConfig.title !== "Solflare Connected" && !walletAlertConfig.title.includes("Connected via") && <AlertDialogCancel>Cancel</AlertDialogCancel> }
                <AlertDialogAction onClick={() => setShowWalletAlert(false)} className="bg-purple-600 hover:bg-purple-700">OK</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      </main>

      <footer className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          #StayBuilding #StayHODLing
        </p>
      </footer>
    </div>
  );
}
