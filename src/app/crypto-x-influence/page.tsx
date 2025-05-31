'use client'

import { Button } from "@/components/ui/button";
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useSwipeable } from 'react-swipeable';
import { motion } from 'framer-motion';
import { ScrollText, ArrowLeft, CheckCircle, XCircle, Award, AlertTriangle, Send, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
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
    title: 'Lesson 1: Finding Alpha - Who to Follow?',
    content: (
      <>
        <p className="mb-2">"Alpha" in crypto refers to valuable, often early, information or insights. On X, finding reliable alpha sources amidst the noise is key. Look for accounts with a proven track record, clear reasoning (not just price predictions), engagement with reputable figures, and transparency about their positions.</p>
        <p>Be wary of anonymous accounts with huge followings gained quickly or those constantly shilling low-cap coins. Analyze the quality of their posts, not just follower count. Tools like TweetDeck or custom lists can help filter and organize your feed.</p>
      </>
    ),
    quiz: [
      { id: 'q1l1', text: 'What does "alpha" generally mean in the crypto X space?', options: [{id: 'o1', text: 'The first letter of the Greek alphabet'}, {id: 'o2', text: 'Valuable or early information and insights'}, {id: 'o3', text: 'A specific type of cryptocurrency'}, {id: 'o4', text: 'A complex trading algorithm'}], correctAnswerId: 'o2', explanation: "Alpha refers to information edge that can potentially lead to profitable decisions."},
      { id: 'q2l1', text: 'Which is a potential RED flag when evaluating an X account for alpha?', options: [{id: 'o1', text: 'Detailed explanations for their investment thesis'}, {id: 'o2', text: 'Engagement with known developers or researchers'}, {id: 'o3', text: 'Constantly shilling obscure coins with unrealistic promises'}, {id: 'o4', text: 'Transparency about their own holdings'}], correctAnswerId: 'o3', explanation: "Excessive shilling, especially without solid reasoning, is often a sign of promotion rather than genuine alpha."},
      { id: 'q3l1', text: 'What is a good practice for managing your X feed for crypto info?', options: [{id: 'o1', text: 'Following thousands of accounts randomly'}, {id: 'o2', text: 'Only following accounts with blue checkmarks'}, {id: 'o3', text: 'Creating curated lists or using tools like TweetDeck to filter noise'}, {id: 'o4', text: 'Believing everything posted by accounts with large followings'}], correctAnswerId: 'o3', explanation: "Curating your feed helps focus on quality sources and reduces exposure to noise and potential misinformation."},
    ],
  },
  {
    id: 'l2',
    title: 'Lesson 2: Timing is Everything - Engagement Windows',
    content: (
       <>
        <p className="mb-2">Maximizing the reach of your X posts often depends on timing. While the "best" time varies, consider when your target audience (e.g., specific time zones, communities) is most active. Weekday mornings and evenings (local times) are often high-engagement periods.</p>
        <p>Analyze your own follower activity using X Analytics (if available) or third-party tools. Experiment with different posting times and track engagement (likes, retweets, replies). Posting during major crypto events or news can also increase visibility, but be mindful of adding value, not just noise.</p>
      </>
    ),
    quiz: [
      { id: 'q1l2', text: 'Why is post timing potentially important on X?', options: [{id: 'o1', text: 'It affects the gas fees for posting'}, {id: 'o2', text: 'It can influence visibility and engagement based on audience activity'}, {id: 'o3', text: 'It determines the length limit of your tweet'}, {id: 'o4', text: 'It changes the color scheme of your profile'}], correctAnswerId: 'o2', explanation: "Posting when your target audience is online increases the likelihood they will see and interact with your content."},
      { id: 'q2l2', text: 'A common high-engagement period on X is often:', options: [{id: 'o1', text: '3 AM on a Sunday'}, {id: 'o2', text: 'Mid-day during a major holiday'}, {id: 'o3', text: 'Weekday mornings or evenings in relevant time zones'}, {id: 'o4', text: 'Only during a full moon'}], correctAnswerId: 'o3', explanation: "These are times when many users are typically active on the platform before/after work or school."},
      { id: 'q3l2', text: 'What tool can help you understand your follower activity?', options: [{id: 'o1', text: 'Microsoft Excel'}, {id: 'o2', text: 'X Analytics (if available) or third-party social media tools'}, {id: 'o3', text: 'A calculator'}, {id: 'o4', text: 'Google Maps'}], correctAnswerId: 'o2', explanation: "X provides native analytics, and various external tools offer deeper insights into audience behavior and optimal posting times."},
    ],
  },
  {
    id: 'l3',
    title: 'Lesson 3: Hashtag Strategy - Joining the #HoodieVerse',
    content: (
      <>
        <p className="mb-2">Hashtags increase the discoverability of your posts. Use relevant and trending hashtags like #crypto, #NFT, #DeFi, or specific coin tickers ($BTC, $ETH). More importantly, engage with community-specific hashtags like #HoodieVerse to connect with the target audience of this academy.</p>
        <p>Don't overdo it; 2-3 well-chosen hashtags are often more effective than a long string of irrelevant ones. Research which hashtags are actively used by the community you want to reach. Participating in trending topics (if relevant) can also boost visibility.</p>
      </>
    ),
    quiz: [
      { id: 'q1l3', text: 'What is the primary purpose of using hashtags on X?', options: [{id: 'o1', text: 'To make your posts look longer'}, {id: 'o2', text: 'To increase the discoverability and categorize your content'}, {id: 'o3', text: 'To automatically translate your tweets'}, {id: 'o4', text: 'To earn advertising revenue'}], correctAnswerId: 'o2', explanation: "Hashtags help users find posts related to specific topics or communities."},
      { id: 'q2l3', text: 'Using #HoodieVerse is an example of what kind of hashtag strategy?', options: [{id: 'o1', text: 'Generic keyword stuffing'}, {id: 'o2', text: 'Using irrelevant trending tags'}, {id: 'o3', text: 'Targeting a specific community or project'}, {id: 'o4', text: 'A typo'}], correctAnswerId: 'o3', explanation: "Community-specific hashtags directly connect your content with users interested in that particular ecosystem."},
      { id: 'q3l3', text: 'What is generally a good practice regarding the number of hashtags?', options: [{id: 'o1', text: 'Use as many as possible, at least 10'}, {id: 'o2', text: 'Use only one hashtag per tweet'}, {id: 'o3', text: 'Use 2-3 relevant and well-chosen hashtags'}, {id: 'o4', text: 'Avoid hashtags entirely'}], correctAnswerId: 'o3', explanation: "Quality over quantity is key; too many hashtags can look spammy and dilute the focus."},
    ],
  },
  {
    id: 'l4',
    title: 'Lesson 4: The Impersonator Plague - Spotting Fake Influencers & Bots',
    content: (
      <>
        <p className="mb-2">The crypto space on X is unfortunately filled with impersonator accounts and scam bots. These accounts often mimic real influencers by using a similar profile picture and handle (perhaps with a slight misspelling or extra character). They reply to popular tweets with phishing links, fake giveaways, or "support" scams asking for your seed phrase.</p>
        <p>Red flags include: generic replies, recently created accounts with high follower counts (often fake), profiles promising guaranteed returns, and direct messages asking for personal information or funds. Always verify the handle (@username) carefully. Report and block suspicious accounts.</p>
      </>
    ),
    pitfallWarning:(
        <div className="mt-6 p-4 border border-red-500/50 bg-red-900/30 rounded-lg">
            <h4 className="text-lg font-semibold text-red-400 flex items-center mb-2"><AlertTriangle size={20} className="mr-2"/>Scam Bot Trap!</h4>
            <p className="text-sm text-red-300">
            Beware of fake influencer accounts and bots! They often reply to popular tweets with scams. Check handles carefully (@username), look for verification (though it can be bought), and be wary of DMs or replies promising free crypto or asking for info/funds. Report suspicious activity.
            </p>
        </div>
    ),
    quiz: [
      { id: 'q1l4', text: 'A common tactic used by impersonator accounts on X is:', options: [{id: 'o1', text: 'Using a unique, original profile picture'}, {id: 'o2', text: 'Having a long account history with consistent posts'}, {id: 'o3', text: 'Using a handle very similar to a real influencer, often with a typo'}, {id: 'o4', text: 'Posting only in-depth technical analysis'}], correctAnswerId: 'o3', explanation: "Slight variations in the username are a key way scammers trick users into thinking they are interacting with a legitimate account."},
      { id: 'q2l4', text: 'If an account replies to your tweet offering "support" and asks for your wallet seed phrase, it is:', options: [{id: 'o1', text: 'Likely a helpful official support representative'}, {id: 'o2', text: 'Almost certainly a scammer trying to steal your funds'}, {id: 'o3', text: 'A standard security verification procedure'}, {id: 'o4', text: 'Probably a new feature being tested by X'}], correctAnswerId: 'o2', explanation: "Legitimate support will NEVER ask for your seed phrase or private keys."},
      { id: 'q3l4', text: 'What is a major red flag for identifying a potential scam bot?', options: [{id: 'o1', text: 'The account has a verified checkmark'}, {id: 'o2', text: 'The account posts generic replies with suspicious links under many different tweets'}, {id: 'o3', text: 'The account has a small number of followers'}, {id: 'o4', text: 'The account only posts text-based tweets'}], correctAnswerId: 'o2', explanation: "Repetitive, generic replies, often containing links, are characteristic behavior of scam bots trying to lure victims."},
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
            <Link href="/courses" className="flex items-center space-x-1">
              <ArrowLeft size={16} />
              <span>Back to Courses</span>
            </Link>
          </Button>
        </div>
        <header className="text-center pt-16 md:pt-8">
           <h1 className="text-4xl md:text-5xl font-bold text-pink-400 mb-2">
            Crypto X Influence: Build Your Clout
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Curate X feeds and craft viral posts with AI optimization to earn the 'Thread Tycoon' NFT badge.
          </p>
        </header>
      </div>

      <Progress value={progressPercentage} className="w-full max-w-3xl mb-8 bg-pink-900/50 [&>div]:bg-pink-500" />

      <main className="w-full max-w-3xl flex flex-col items-center py-8 space-y-10">
        {!allLessonsCompleted && currentLesson && lessonStatus[currentLessonIndex] !== 'locked' ? (
          <motion.section 
            key={currentLessonIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-card p-6 md:p-8 rounded-xl shadow-lg border border-pink-600 w-full neon-border-pink hover:shadow-[0_0_25px_rgba(236,72,153,1)] transition-all duration-300"
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
                  className="mt-8 w-full bg-pink-600 hover:bg-green-700 text-white shadow-[0_0_10px_theme(colors.pink.600)] hover:shadow-[0_0_15px_theme(colors.green.500)] transition-all duration-300"
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
            <h2 className="text-3xl md:text-4xl font-bold text-green-300 mb-3">Course Complete! Thread Tycoon!</h2>
            <p className="text-xl text-foreground mb-4">You've mastered the art of crypto X influence!</p>
            <div className="flex items-center justify-center space-x-3 my-6">
              <ScrollText className="w-12 h-12 text-pink-400" data-ai-hint="scroll document" />
              <div>
                <p className="text-lg md:text-xl font-semibold text-primary">REWARD: Thread Tycoon NFT</p>
                <p className="text-md text-muted-foreground">Your ability to craft viral crypto narratives is recognized.</p>
              </div>
            </div>
             <Button
                onClick={handleMockPostGeneration}
                className="bg-pink-600 hover:bg-pink-700 text-white min-w-[200px] transition-all mt-4 shadow-[0_0_10px_theme(colors.pink.600)] hover:shadow-[0_0_15px_theme(colors.pink.500)]"
              >
                <Send size={18} className="mr-2"/> Simulate X Post
            </Button>
            {lessonsData.find(l => l.pitfallWarning && lessonStatus[lessonsData.indexOf(l)] === 'completed')?.pitfallWarning}
            <Button asChild className="mt-6 w-full md:w-auto bg-yellow-500 hover:bg-yellow-600 text-background shadow-[0_0_10px_theme(colors.yellow.500)] hover:shadow-[0_0_15px_theme(colors.yellow.400)] transition-all duration-300">
                <Link href="/community-strategy">Advance to Community Strategy</Link>
            </Button>
          </motion.section>
        )}

        <section className="my-8 text-center p-6 bg-card rounded-xl shadow-lg border border-pink-600 neon-border-pink w-full">
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
                    className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 overflow-hidden"
                >
                    {walletProviders.map(wallet => (
                        <Button
                            key={wallet.name}
                            onClick={() => handleWalletConnection(wallet.name)}
                            className="w-full px-6 py-3 rounded-lg shadow-lg bg-gradient-to-r from-green-600 to-purple-600 hover:from-green-700 hover:to-purple-700 text-white transition-all duration-300 flex items-center justify-center"
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
                 <AlertDialogAction onClick={() => setShowFeedbackModal(false)} className="bg-green-600 hover:bg-green-700">Engage!</AlertDialogAction>
              ) : (
                <>
                  <AlertDialogCancel onClick={() => setShowFeedbackModal(false)}>Review Lesson</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {setSelectedAnswers({}); setQuizSubmitted(false); setQuizPassed(false); setCurrentScore(0); setShowFeedbackModal(false);}} className="bg-pink-600 hover:bg-pink-700">Retry Quiz</AlertDialogAction>
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
                <AlertDialogAction onClick={() => setShowPostAlert(false)} className="bg-pink-600 hover:bg-pink-700">Got it!</AlertDialogAction>
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
                <AlertDialogAction onClick={() => setShowWalletAlert(false)} className="bg-pink-600 hover:bg-pink-700">OK</AlertDialogAction>
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
