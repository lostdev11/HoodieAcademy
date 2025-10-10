'use client';
export const dynamic = "force-static";

import { Button } from "@/components/ui/button";
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useSwipeable } from 'react-swipeable';
import { motion } from 'framer-motion';
import { SaberHoodieIcon } from "@/components/icons/SaberHoodieIcon";
import { ArrowLeft, CheckCircle, XCircle, Award, AlertTriangle, Vote, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchCourseProgress, updateCourseProgress, getCachedLessonStatus, LessonStatus } from '@/utils/course-progress-api';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
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

interface PhantomResponse {
  publicKey: {
    toString: () => string;
  };
}

// Global interface declarations removed to avoid conflicts with centralized types

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
    title: 'Lesson 1: DAO Governance - Power to the People',
    content: (
      <>
        <p className="mb-2">Decentralized Autonomous Organizations (DAOs) shift power from central authorities to the community. Governance involves members voting on proposals that dictate the project's direction, treasury spending, or protocol changes.</p>
        <p>Proposals are typically submitted by members meeting certain criteria (e.g., holding a minimum amount of governance tokens). Voting mechanisms vary: simple token-weighted voting (1 token = 1 vote), quadratic voting (reducing the power of large holders), or conviction voting (longer staked tokens get more weight). Smart contracts execute the outcome automatically if a proposal passes quorum and threshold requirements.</p>
      </>
    ),
    quiz: [
      { id: 'q1l1', text: 'What is the primary function of governance in a DAO?', options: [{id: 'o1', text: 'Marketing the project'}, {id: 'o2', text: 'Allowing members to vote on proposals'}, {id: 'o3', text: 'Providing customer support'}, {id: 'o4', text: 'Writing the code'}], correctAnswerId: 'o2', explanation: "DAO governance empowers token holders or members to collectively make decisions about the organization's future."},
      { id: 'q2l1', text: 'In token-weighted voting, who typically has the most influence?', options: [{id: 'o1', text: 'The founding team'}, {id: 'o2', text: 'Members who hold the most tokens'}, {id: 'o3', text: 'Members who joined earliest'}, {id: 'o4', text: 'Everyone has equal influence'}], correctAnswerId: 'o2', explanation: "In a simple 1 token = 1 vote system, those with larger token holdings have a greater say in the outcome."},
      { id: 'q3l1', text: 'What automatically executes the outcome of a successful DAO proposal?', options: [{id: 'o1', text: 'The community manager'}, {id: 'o2', text: 'A third-party auditor'}, {id: 'o3', text: 'The smart contract'}, {id: 'o4', text: 'A manual vote count'}], correctAnswerId: 'o3', explanation: "Smart contracts are programmed to enforce the rules and automatically implement the results of passed proposals."},
    ],
  },
  {
    id: 'l2',
    title: 'Lesson 2: Community Events - Fostering Engagement',
    content: (
       <>
        <p className="mb-2">Vibrant communities thrive on interaction. Organizing events is key to engagement. Ask Me Anything (AMA) sessions with the team build transparency and trust. NFT drops can reward loyal members or attract new ones, often tied to participation or holding specific assets.</p>
        <p>Contests (art, meme, writing) encourage creativity and user-generated content. Virtual meetups or game nights in metaverses create social bonds. Effective events offer value, fun, or exclusivity, strengthening the community's connection to the project.</p>
      </>
    ),
    quiz: [
      { id: 'q1l2', text: 'What is a common purpose of an AMA session in a Web3 community?', options: [{id: 'o1', text: 'To sell NFTs directly'}, {id: 'o2', text: 'To allow the community to ask questions to the team'}, {id: 'o3', text: 'To vote on governance proposals'}, {id: 'o4', text: 'To deploy new smart contracts'}], correctAnswerId: 'o2', explanation: "AMAs ('Ask Me Anything') are primarily for fostering transparency and communication between the project team and its community."},
      { id: 'q2l2', text: 'NFT drops are often used in communities to:', options: [{id: 'o1', text: 'Increase transaction fees'}, {id: 'o2', text: 'Reward loyal members or attract new ones'}, {id: 'o3', text: 'Test the blockchain network'}, {id: 'o4', text: 'Secure the DAO treasury'}], correctAnswerId: 'o2', explanation: "NFT drops serve as incentives, rewards, or ways to bring new participants into the community ecosystem."},
      { id: 'q3l2', text: 'Which type of event primarily encourages user-generated content?', options: [{id: 'o1', text: 'An AMA session'}, {id: 'o2', text: 'A technical workshop'}, {id: 'o3', text: 'An art or meme contest'}, {id: 'o4', text: 'A treasury report presentation'}], correctAnswerId: 'o3', explanation: "Contests directly solicit creative contributions from community members, generating content related to the project."},
    ],
  },
  {
    id: 'l3',
    title: 'Lesson 3: Social Campaigns - Mastering X (Twitter)',
    content: (
      <>
        <p className="mb-2">X (formerly Twitter) is the lifeblood of Web3 communication. Effective campaigns require understanding the platform's culture. Threads (multi-tweet stories) are great for deep dives or announcements. Engaging with relevant conversations, using trending hashtags (#NFT, #DeFi, #memecoin), and collaborating with influencers amplify reach.</p>
        <p>Consistency is key. Share updates, insights, and community highlights regularly. Run polls for feedback, host X Spaces (live audio) for discussions, and use compelling visuals (memes, infographics). Track analytics (engagement rate, reach) to refine your strategy. Authenticity and providing value beat constant shilling.</p>
      </>
    ),
    quiz: [
      { id: 'q1l3', text: 'What X feature is best suited for detailed explanations or announcements?', options: [{id: 'o1', text: 'A single tweet with an image'}, {id: 'o2', text: 'A poll'}, {id: 'o3', text: 'A Thread (multiple connected tweets)'}, {id: 'o4', text: 'A direct message'}], correctAnswerId: 'o3', explanation: "Threads allow for breaking down complex information or narratives into digestible, linked tweets."},
      { id: 'q2l3', text: 'What is a key element for growing reach on X in Web3?', options: [{id: 'o1', text: 'Only tweeting promotional content'}, {id: 'o2', text: 'Ignoring messages from the community'}, {id: 'o3', text: 'Engaging in relevant conversations and using appropriate hashtags'}, {id: 'o4', text: 'Posting only once a month'}], correctAnswerId: 'o3', explanation: "Active participation in the broader conversation and discoverability through hashtags are crucial for visibility."},
      { id: 'q3l3', text: 'X Spaces are primarily used for:', options: [{id: 'o1', text: 'Sharing pre-recorded videos'}, {id: 'o2', text: 'Hosting live audio conversations'}, {id: 'o3', text: 'Running automated trading bots'}, {id: 'o4', text: 'Publishing whitepapers'}], correctAnswerId: 'o2', explanation: "X Spaces provide a platform for real-time audio discussions, interviews, and community chats."},
    ],
  },
  {
    id: 'l4',
    title: 'Lesson 4: Toxic Communities - Navigating FUD & Conflict',
    content: (
      <>
        <p className="mb-2">Not all communities are constructive. Toxicity can arise from FUD (Fear, Uncertainty, Doubt), internal conflicts, or external attacks. Establishing clear community guidelines and moderation policies from the start is crucial.</p>
        <p>Moderators should act fairly and consistently, removing spam, hate speech, and bad actors. Address FUD transparently with facts, but avoid feeding trolls. Foster a positive culture by highlighting constructive members and contributions. Sometimes, difficult decisions like banning persistent toxic individuals are necessary to protect the health of the community.</p>
      </>
    ),
    pitfallWarning:(
        <div className="mt-6 p-4 border border-red-500/50 bg-red-900/30 rounded-lg">
            <h4 className="text-lg font-semibold text-red-400 flex items-center mb-2"><AlertTriangle size={20} className="mr-2"/>Toxic Community Trap!</h4>
            <p className="text-sm text-red-300">
            Unchecked negativity, FUD, and personal attacks can destroy a community. Enforce clear guidelines, moderate fairly, promote positivity, and don't hesitate to remove genuinely disruptive elements. A healthy community is a valuable asset.
            </p>
        </div>
    ),
    quiz: [
      { id: 'q1l4', text: 'What does "FUD" stand for in the context of crypto communities?', options: [{id: 'o1', text: 'Fast Utility Deposits'}, {id: 'o2', text: 'Fear, Uncertainty, Doubt'}, {id: 'o3', text: 'Frequent User Donations'}, {id: 'o4', text: 'Fully Unbiased Decisions'}], correctAnswerId: 'o2', explanation: "FUD refers to the spread of negative sentiment, often baseless, intended to harm a project's reputation or price."},
      { id: 'q2l4', text: 'What is a crucial first step in managing community toxicity?', options: [{id: 'o1', text: 'Ignoring all negative comments'}, {id: 'o2', text: 'Establishing clear community guidelines and moderation policies'}, {id: 'o3', text: 'Promising unrealistic returns to silence critics'}, {id: 'o4', text: 'Banning anyone who disagrees with the team'}], correctAnswerId: 'o2', explanation: "Clear rules set expectations for behavior and provide a basis for moderation actions."},
      { id: 'q3l4', text: 'How should legitimate concerns or criticisms (not FUD) be handled?', options: [{id: 'o1', text: 'Delete them immediately'}, {id: 'o2', text: 'Address them transparently and respectfully'}, {id: 'o3', text: 'Attack the person raising the concern'}, {id: 'o4', text: 'Ignore them until they go away'}], correctAnswerId: 'o2', explanation: "Acknowledging and addressing valid concerns builds trust, while dismissing them can breed resentment."},
    ],
  },
];

const PASSING_PERCENTAGE = 0.75;
const COURSE_SLUG = 'community-strategy';

export default function CommunityStrategyPage() {
  const { wallet: walletAddress } = useWalletSupabase();
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
  const [showDaoVoteAlert, setShowDaoVoteAlert] = useState(false);

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
    const loadProgress = async () => {
      if (!walletAddress) return;
      const cached = getCachedLessonStatus(COURSE_SLUG, lessonsData.length);
      if (cached.length > 0) setLessonStatus(cached);
      try {
        const progress = await fetchCourseProgress(walletAddress, COURSE_SLUG);
        if (progress && progress.lesson_data) {
          const statusArray: LessonStatus[] = Array(lessonsData.length).fill('locked');
          statusArray[0] = 'unlocked';
          progress.lesson_data.forEach((lesson: any) => {
            if (lesson.index < lessonsData.length) statusArray[lesson.index] = lesson.status;
          });
          setLessonStatus(statusArray);
          const newCurrentIndex = statusArray.findIndex(status => status === 'unlocked');
          if (newCurrentIndex !== -1) setCurrentLessonIndex(newCurrentIndex);
        }
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    };
    loadProgress();
  }, [walletAddress]);

  const saveProgress = async (newStatus: LessonStatus[]) => {
    setLessonStatus(newStatus);
    if (walletAddress) await updateCourseProgress(walletAddress, COURSE_SLUG, newStatus);
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
          const sol = typeof window !== 'undefined' ? window.solana : undefined;
          
          if (providerName === 'phantom') {
            if (!(sol?.isPhantom)) {
              setWalletAlertConfig({ title: "Phantom Not Detected", description: "Please install Phantom wallet to continue." });
              setShowWalletAlert(true);
              return;
            }
            solProvider = sol;
          } else { 
             if (sol?.isPhantom) solProvider = sol;
             else if (sol) solProvider = sol;
             else {
                setWalletAlertConfig({ title: "Solana Wallet Not Detected", description: `Please install a compatible Solana wallet (e.g., Phantom) for ${providerName}.` });
                setShowWalletAlert(true);
                return;
             }
          }
          
          // Connect only if not already connected
          if (!solProvider.publicKey) {
            try {
              await solProvider.connect({ onlyIfTrusted: true } as any);
            } catch {
              await solProvider.connect();
            }
          }
          
          if (!solProvider.publicKey) {
            console.error('Solana wallet public key is null after connection');
            setWalletAlertConfig({ title: "Connection Error", description: "Failed to get wallet public key. Please try again." });
            setShowWalletAlert(true);
            setShowWalletSelector(false);
            return;
          }
          
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
      setFeedbackModalContent({ title: "Quiz Passed!", description: `You scored ${score}/${totalQuestions}. Great strategy! You can proceed.` });
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
      setFeedbackModalContent({ title: "Quiz Failed", description: `You scored ${score}/${totalQuestions}. Review the strategies and try again. You need at least ${Math.ceil(PASSING_PERCENTAGE * totalQuestions)} correct answers.` });
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

  const handleMockDaoVote = () => {
    setShowDaoVoteAlert(true);
  };

  const allQuestionsAnswered = currentLesson?.quiz.every(q => selectedAnswers[q.id]);
  
  const walletProviders: { name: WalletProviderOption; label: string; icon?: JSX.Element }[] = [
    { name: 'metamask', label: 'MetaMask', icon: <Wallet size={20} className="mr-2 text-orange-500" /> },
    { name: 'phantom', label: 'Phantom', icon: <Wallet size={20} className="mr-2 text-purple-500" /> },
    { name: 'jup', label: 'Jupiter', icon: <Wallet size={20} className="mr-2 text-blue-500" /> },
    { name: 'magic-eden', label: 'Magic Eden', icon: <Wallet size={20} className="mr-2 text-green-500" /> },
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
           <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 mb-2">
            Community Strategy: Lead the Hoodie-Verse
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Learn to lead and grow Web3 communities with strategic insight, earning the 'Hoodie Strategist' NFT badge.
          </p>
        </header>
      </div>

      <Progress value={progressPercentage} className="w-full max-w-3xl mb-8 bg-yellow-900/50 [&>div]:bg-yellow-500" />

      <main className="w-full max-w-3xl flex flex-col items-center py-8 space-y-10">
        {!allLessonsCompleted && currentLesson && lessonStatus[currentLessonIndex] !== 'locked' ? (
          <motion.section 
            key={currentLessonIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-card p-6 md:p-8 rounded-xl shadow-lg border border-yellow-600 w-full neon-border-yellow hover:shadow-[0_0_25px_rgba(250,204,21,1)] transition-all duration-300"
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
                  className="mt-8 w-full bg-yellow-500 hover:bg-green-600 text-background shadow-[0_0_10px_theme(colors.yellow.500)] hover:shadow-[0_0_15px_theme(colors.green.400)] transition-all duration-300"
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
            <h2 className="text-3xl md:text-4xl font-bold text-green-300 mb-3">Course Complete! Community Leader!</h2>
            <p className="text-xl text-foreground mb-4">You've mastered the art of Web3 community strategy!</p>
            <div className="flex items-center justify-center space-x-3 my-6">
              <SaberHoodieIcon className="w-12 h-12 text-yellow-400" data-ai-hint="saber hoodie" />
              <div>
                <p className="text-lg md:text-xl font-semibold text-primary">REWARD: Hoodie Strategist NFT</p>
                <p className="text-md text-muted-foreground">Your leadership in the Hoodie-Verse is recognized.</p>
              </div>
            </div>
             <Button
                onClick={handleMockDaoVote}
                className="bg-yellow-500 hover:bg-yellow-600 text-background min-w-[200px] transition-all mt-4 shadow-[0_0_10px_theme(colors.yellow.500)] hover:shadow-[0_0_15px_theme(colors.yellow.400)]"
              >
                <Vote size={18} className="mr-2"/> Simulate DAO Vote
            </Button>
            {lessonsData.find(l => l.pitfallWarning && lessonStatus[lessonsData.indexOf(l)] === 'completed')?.pitfallWarning}
            <Button asChild className="mt-6 w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_10px_theme(colors.blue.600)] hover:shadow-[0_0_15px_theme(colors.blue.500)] transition-all duration-300">
                <Link href="/meme-coin-mania">Advance to Meme Coin Mania (Social Path)</Link>
            </Button>
          </motion.section>
        )}

        <section className="my-8 text-center p-6 bg-card rounded-xl shadow-lg border border-yellow-600 neon-border-yellow w-full">
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
                 <AlertDialogAction onClick={() => setShowFeedbackModal(false)} className="bg-green-600 hover:bg-green-700">Strategize!</AlertDialogAction>
              ) : (
                <>
                  <AlertDialogCancel onClick={() => setShowFeedbackModal(false)}>Review Lesson</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {setSelectedAnswers({}); setQuizSubmitted(false); setQuizPassed(false); setCurrentScore(0); setShowFeedbackModal(false);}} className="bg-yellow-500 hover:bg-yellow-600 text-background">Retry Quiz</AlertDialogAction>
                </>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showDaoVoteAlert} onOpenChange={setShowDaoVoteAlert}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Mock DAO Vote Cast!</AlertDialogTitle>
                <AlertDialogDescription>
                    Your vote on the 'Hoodie Protocol Upgrade Proposal #42' has been simulated. In a real DAO, this would be recorded on-chain. Your participation matters!
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogAction onClick={() => setShowDaoVoteAlert(false)} className="bg-yellow-500 hover:bg-yellow-600 text-background">Got it!</AlertDialogAction>
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
                <AlertDialogAction onClick={() => setShowWalletAlert(false)} className="bg-yellow-500 hover:bg-yellow-600 text-background">OK</AlertDialogAction>
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
