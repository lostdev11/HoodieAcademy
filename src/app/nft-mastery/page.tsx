
'use client'

import { Button } from "@/components/ui/button";
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useSwipeable } from 'react-swipeable';
import { motion } from 'framer-motion';
import { PixelHoodieIcon } from "@/components/icons/PixelHoodieIcon";
import { ArrowLeft, CheckCircle, XCircle, Award, AlertTriangle, Wallet, ChevronDown, ChevronUp } from 'lucide-react'; 
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
    title: 'Lesson 1: NFT Creation - The Digital Canvas',
    content: (
      <>
        <p className="mb-2">NFTs (Non-Fungible Tokens) begin with a digital asset—art, music, collectibles, or even a tweet! This asset needs to be unique or part of a limited collection. Metadata is crucial; it's the information embedded in the NFT, describing its properties, history, and links to the actual asset (often stored on IPFS or Arweave to ensure decentralization).</p>
        <p>Minting is the process of publishing your unique token on a blockchain (like Ethereum or Solana). This makes it ownable, traceable, and tradable. Smart contracts govern NFTs, defining their rules and functionalities, like royalty payments on secondary sales.</p>
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
        <p className="mb-2">NFT marketplaces like OpenSea, Rarible, and Magic Eden are platforms where users can buy, sell, and auction NFTs. Listing an NFT involves setting a price (fixed or auction-style) and paying a gas fee. Buyers browse collections, place bids, or purchase directly.</p>
        <p>Understanding floor price (lowest price for an NFT in a collection), trading volume, and holder distribution can provide insights into a project's health and demand. Royalties, typically 5-10%, are automatically paid to the original creator on secondary sales, a key feature enabled by smart contracts.</p>
      </>
    ),
    quiz: [
      { id: 'q1l2', text: 'What is the "floor price" of an NFT collection?', options: [{id: 'o1', text: 'The average price of all sales'}, {id: 'o2', text: 'The highest price an NFT in the collection has sold for'}, {id: 'o3', text: 'The lowest current asking price for an NFT in that collection'}, {id: 'o4', text: 'The original mint price'}], correctAnswerId: 'o3', explanation: "The floor price represents the minimum amount you'd need to pay to acquire an NFT from that specific collection at a given time."},
      { id: 'q2l2', text: 'What are NFT royalties?', options: [{id: 'o1', text: 'Fees paid to the marketplace for listing an NFT'}, {id: 'o2', text: 'A percentage of secondary sales paid to the original creator'}, {id: 'o3', text: 'Taxes imposed by governments on NFT transactions'}, {id: 'o4', text: 'Discounts offered to early buyers'}], correctAnswerId: 'o2', explanation: "Royalties are a powerful feature of NFTs, allowing creators to earn a percentage from subsequent sales of their work."},
      { id: 'q3l2', text: 'OpenSea and Rarible are examples of:', options: [{id: 'o1', text: 'Cryptocurrency exchanges'}, {id: 'o2', text: 'NFT marketplaces'}, {id: 'o3', text: 'Blockchain explorers'}, {id: 'o4', text: 'Hardware wallets'}], correctAnswerId: 'o2', explanation: "OpenSea and Rarible are leading platforms dedicated to the buying, selling, and discovery of NFTs."},
    ],
  },
  {
    id: 'l3',
    title: 'Lesson 3: Gas Fee Optimization - Navigating Network Costs',
    content: (
      <>
        <p className="mb-2">Gas fees are transaction costs on blockchains like Ethereum, paid to miners/validators for processing your transaction (e.g., minting or trading an NFT). These fees can fluctuate wildly based on network congestion—more users mean higher fees.</p>
        <p>To optimize gas, you can transact during off-peak hours (often late nights or weekends in Western Hemisphere time zones), set a gas limit (maximum you're willing to pay, though too low might fail), or use Layer 2 scaling solutions (e.g., Polygon, Arbitrum) which offer significantly lower fees and faster transactions by processing them off the main Ethereum chain.</p>
      </>
    ),
    quiz: [
      { id: 'q1l3', text: 'What primarily causes high gas fees on Ethereum?', options: [{id: 'o1', text: 'The complexity of the NFT artwork'}, {id: 'o2', text: 'The number of NFTs in your wallet'}, {id: 'o3', text: 'Network congestion (high demand for block space)'}, {id: 'o4', text: 'The price of Ether (ETH)'}], correctAnswerId: 'o3', explanation: "High demand for limited block space during peak times leads to a bidding war for transactions, driving up gas fees."},
      { id: 'q2l3', text: 'Which of the following is a common strategy to try and reduce gas fees?', options: [{id: 'o1', text: 'Minting multiple NFTs in one transaction'}, {id: 'o2', text: 'Using a brand new wallet'}, {id: 'o3', text: 'Transacting during network off-peak hours'}, {id: 'o4', text: 'Paying with a stablecoin'}], correctAnswerId: 'o3', explanation: "When fewer people are using the network, gas fees tend to be lower."},
      { id: 'q3l3', text: 'Layer 2 solutions like Polygon or Arbitrum primarily aim to:', options: [{id: 'o1', text: 'Increase the security of individual NFTs'}, {id: 'o2', text: 'Reduce transaction fees and improve scalability'}, {id: 'o3', text: 'Make NFT artwork more visually appealing'}, {id: 'o4', text: 'Provide insurance for NFT investments'}], correctAnswerId: 'o2', explanation: "Layer 2s process transactions off the main chain, offering a faster and cheaper experience for users."},
    ],
  },
  {
    id: 'l4',
    title: 'Lesson 4: The "Fake Drop" Scam - Spotting Deception',
    content: (
      <>
        <p className="mb-2">Scammers often create fake NFT projects or "surprise drops" that mimic legitimate ones. They might use similar artwork, a slightly altered project name, or create fake social media profiles and websites. Their goal is to trick you into connecting your wallet to a malicious site and signing a transaction that drains your assets or minting a worthless NFT.</p>
        <p>Red flags include: unsolicited DMs with "secret" mint links, unrealistic promises (guaranteed profits, extremely low mint price for a hyped project), pressure to act quickly (FOMO), and websites with poor grammar or design. Always verify links through official project channels (their verified X/Twitter, Discord announcements from official mods/team members).</p>
      </>
    ),
    pitfallWarning:(
        <div className="mt-6 p-4 border border-red-500/50 bg-red-900/30 rounded-lg">
            <h4 className="text-lg font-semibold text-red-400 flex items-center mb-2"><AlertTriangle size={20} className="mr-2"/>Fake Drop Scam Alert!</h4>
            <p className="text-sm text-red-300">
            Be extremely vigilant! Scammers create convincing fake NFT drops. Always verify links through official project Discords or X accounts. Never click suspicious links from DMs. If it seems too good to be true, it probably is. Protect your assets!
            </p>
        </div>
    ),
    quiz: [
      { id: 'q1l4', text: 'A common tactic used in fake NFT drop scams is:', options: [{id: 'o1', text: 'Publicly audited smart contracts'}, {id: 'o2', text: 'Sending DMs with "exclusive" or "secret" mint links'}, {id: 'o3', text: 'Detailed whitepapers and roadmaps'}, {id: 'o4', text: 'Transparent team identities'}], correctAnswerId: 'o2', explanation: "Scammers often use direct messages to create a sense of urgency and exclusivity, bypassing public scrutiny."},
      { id: 'q2l4', text: 'What is a major red flag when assessing a new NFT project mint?', options: [{id: 'o1', text: 'A strong community on Discord and X'}, {id: 'o2', text: 'High-pressure tactics demanding immediate action or connection of your wallet'}, {id: 'o3', text: 'Clear communication from the development team'}, {id: 'o4', text: 'Artwork that is unique and visually appealing'}], correctAnswerId: 'o2', explanation: "Legitimate projects usually allow time for research; high-pressure sales tactics are a common scam indicator."},
      { id: 'q3l4', text: 'Before minting an NFT from a new project, what is the SAFEST first step?', options: [{id: 'o1', text: 'Immediately click the link provided in an email'}, {id: 'o2', text: 'Ask for advice in a public, unofficial crypto chat group'}, {id: 'o3', text: 'Connect your main wallet with all your assets'}, {id: 'o4', text: 'Independently find and verify the project\'s official website and social media channels'}], correctAnswerId: 'o4', explanation: "Always cross-reference information from multiple official sources to ensure you are interacting with the legitimate project."},
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
  const [showMintAlert, setShowMintAlert] = useState(false);

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

  const handleMockMint = () => {
    setShowMintAlert(true);
  };

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
          <h1 className="text-4xl md:text-5xl font-bold text-purple-400 mb-2">
            NFT Mastery: From Mint to Moon
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Create and trade NFTs using AI tools; simulate marketplace strategies to earn the ‘NFT Ninja’ NFT badge.
          </p>
        </header>
      </div>
      
      <Progress value={progressPercentage} className="w-full max-w-3xl mb-8 bg-purple-900/50 [&>div]:bg-purple-500" />

      <main className="w-full max-w-3xl flex flex-col items-center py-8 space-y-10">
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
                            className={`flex items-center space-x-3 p-3 bg-muted/30 rounded-lg border-2  hover:border-green-600 cursor-pointer transition-all duration-150 ${selectedAnswers[q.id] === opt.id ? 'border-green-500 ring-2 ring-green-500 neon-border-green' : 'border-green-900'}`}
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
            <p className="text-xl text-foreground mb-4">You've conquered the intricacies of NFTs!</p>
            <div className="flex items-center justify-center space-x-3 my-6">
              <PixelHoodieIcon className="w-12 h-12 text-purple-400" data-ai-hint="pixel hoodie" />
              <div>
                <p className="text-lg md:text-xl font-semibold text-primary">REWARD: NFT Ninja NFT</p>
                <p className="text-md text-muted-foreground">Your prowess in the NFT realm is undeniable.</p>
              </div>
            </div>

             <Button
                onClick={handleMockMint}
                className="bg-purple-600 hover:bg-purple-700 text-white min-w-[200px] transition-all mt-4 shadow-[0_0_10px_theme(colors.purple.600)] hover:shadow-[0_0_15px_theme(colors.purple.500)]"
              >
                <Wallet size={18} className="mr-2"/> Simulate NFT Mint
            </Button>
            
            {lessonsData.find(l => l.id === lessonStatus.findLast(s => s === 'completed'))?.pitfallWarning && ( 
                 <div className="my-6">{lessonsData.find(l => l.id === lessonStatus.findLast(s => s === 'completed'))?.pitfallWarning}</div>
            )}
            <Button asChild className="mt-6 w-full md:w-auto bg-yellow-500 hover:bg-yellow-600 text-background shadow-[0_0_10px_theme(colors.yellow.500)] hover:shadow-[0_0_15px_theme(colors.yellow.400)] transition-all duration-300">
                <Link href="/community-strategy">Advance to Community Strategy</Link>
            </Button>
          </motion.section>
        )}

       <section className="my-8 text-center p-6 bg-card rounded-xl shadow-lg border border-purple-600 neon-border-purple w-full">
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
                {walletAlertConfig.title !== "MetaMask Connected" && walletAlertConfig.title !== "Phantom Connected" && walletAlertConfig.title !== "Solflare Connected" && !walletAlertConfig.title.includes("Connected via") && <AlertDialogCancel>Cancel</AlertDialogCancel> }
                <AlertDialogAction onClick={() => setShowWalletAlert(false)} className="bg-purple-600 hover:bg-purple-700">OK</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showMintAlert} onOpenChange={setShowMintAlert}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Mock NFT Minted!</AlertDialogTitle>
                <AlertDialogDescription>
                    Your simulated 'Hoodie Pixel Pal' NFT has been 'minted' to your connected wallet. In a real scenario, this would be a transaction on the blockchain.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogAction onClick={() => setShowMintAlert(false)} className="bg-purple-600 hover:bg-purple-700">Awesome!</AlertDialogAction>
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
