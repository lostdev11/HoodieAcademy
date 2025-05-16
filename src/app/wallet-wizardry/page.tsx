
'use client'

import { Button } from "@/components/ui/button";
import Link from 'next/link';
// Removed Image import as it's no longer used for the badge icon here
import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useSwipeable } from 'react-swipeable';
import { motion } from 'framer-motion';
import { LockKeyhole, AlertTriangle, ArrowLeft, CheckCircle, XCircle, Award, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
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

const lessonContents = [
  {
    id: 'l1',
    title: '1. Wallet Types',
    content: (
      <>
        <p className="text-foreground mt-2">
          Wallets are essential for managing your Web3 assets. <strong>Hot wallets</strong> (e.g., MetaMask) are
          software-based, connected to the internet, and convenient for daily use. <strong>Cold wallets</strong>
          (e.g., Ledger) are hardware-based, offline, and offer maximum security for long-term storage.
        </p>
      </>
    ),
    quiz: {
      question: 'What is a hot wallet?',
      options: [
        { id: 'A', text: 'A hardware wallet like Ledger' },
        { id: 'B', text: 'A software wallet connected to the internet' },
        { id: 'C', text: 'A wallet for storing NFTs only' },
        { id: 'D', text: 'A wallet that requires no internet' },
      ],
      correctAnswer: 'B',
      explanation: 'Hot wallets are connected to the internet, making them convenient but potentially less secure than cold (offline) wallets.'
    },
  },
  {
    id: 'l2',
    title: '2. Setup Guide',
    content: (
      <>
        <p className="text-foreground mt-2">
          Setting up a wallet is your first step in Web3. For <strong>MetaMask</strong>, install the browser
          extension, create a new wallet, and securely save your seed phrase. For <strong>Phantom</strong> or
          <strong>Trust Wallet</strong>, download the app and follow similar steps.
        </p>
      </>
    ),
    quiz: {
      question: 'What is the first step in setting up MetaMask?',
      options: [
        { id: 'A', text: 'Share your seed phrase' },
        { id: 'B', text: 'Install the browser extension' },
        { id: 'C', text: 'Buy a hardware wallet' },
        { id: 'D', text: 'Connect to a DAO' },
      ],
      correctAnswer: 'B',
      explanation: 'You need to install the MetaMask browser extension or mobile app before you can create or import a wallet.'
    },
  },
  {
    id: 'l3',
    title: '3. Security Best Practices',
    content: (
      <>
        <p className="text-foreground mt-2">
        Protecting your Web3 assets requires vigilance. Your seed phrase is paramount – guard it. Never share it. Store it offline, ideally in multiple secure locations.
        When interacting with dApps, always double-check URLs and permissions. Understand transaction signatures.
        For enhanced security, consider multi-signature (multi-sig) wallets, requiring multiple approvals.
        </p>
      </>
    ),
    quiz: {
      question: 'What is the most secure way to store your seed phrase?',
      options: [
        { id: 'A', text: 'In a password manager' },
        { id: 'B', text: 'On a cloud storage service' },
        { id: 'C', text: 'Written down offline and stored securely' },
        { id: 'D', text: 'Shared with a trusted friend' },
      ],
      correctAnswer: 'C',
      explanation: 'Storing your seed phrase offline (e.g., on paper, in a safe) is the most secure method as it protects against online hacking attempts.'
    },
  },
  {
    id: 'l4',
    title: '4. Phishing & Scam Awareness',
    content: (
      <>
        <p className="text-foreground mt-2">
        The Web3 space is rife with phishing. Scammers create fake sites mimicking legitimate dApps or wallets to steal credentials or trick you into malicious transactions.
        Beware unsolicited DMs/emails promising free crypto or airdrops if you connect your wallet or send funds. Always verify via official channels.
        </p>
      </>
    ),
    pitfallWarning: (
        <div className="mt-6 p-4 border border-red-500/50 bg-red-900/30 rounded-lg">
            <h4 className="text-lg font-semibold text-red-400 flex items-center mb-2"><AlertTriangle size={20} className="mr-2"/>Phishing Trap Warning!</h4>
            <p className="text-sm text-red-300">
            Always be extremely cautious when connecting your wallet. Verify website URLs, never share your seed phrase, and be wary of unsolicited requests or offers. Scammers create fake sites that look identical to real ones. Double-check everything!
            </p>
        </div>
    ),
    quiz: {
      question: 'A common sign of a phishing website is:',
      options: [
        { id: 'A', text: 'A professional design and fast loading speed' },
        { id: 'B', text: 'A slightly misspelled URL of a legitimate service' },
        { id: 'C', text: 'Clear contact information and a support team' },
        { id: 'D', text: 'An SSL certificate (HTTPS)' },
      ],
      correctAnswer: 'B',
      explanation: 'Scammers often use URLs that are very similar to legitimate ones, hoping users won\'t notice the slight difference.'
    },
  },
];

const PASSING_PERCENTAGE = 0.75; 
const LOCAL_STORAGE_KEY = 'walletWizardryProgress';

export default function WalletWizardryPage() {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [lessonStatus, setLessonStatus] = useState<Array<'locked' | 'unlocked' | 'completed'>>(
    lessonContents.map((_, index) => (index === 0 ? 'unlocked' : 'locked'))
  );
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  // quizFeedback state seems unused, can be removed if not needed later.
  // const [quizFeedback, setQuizFeedback] = useState<string | null>(null); 
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackModalContent, setFeedbackModalContent] = useState({ title: "", description: "" });
  
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [mockNftStatus, setMockNftStatus] = useState<string | null>(null);
  const [showWalletAlert, setShowWalletAlert] = useState(false);
  const [walletAlertConfig, setWalletAlertConfig] = useState({ title: "", description: "" });
  const [connectedWalletProvider, setConnectedWalletProvider] = useState<WalletProviderOption | null>(null);
  const [showWalletSelector, setShowWalletSelector] = useState(false);

  const solanaNetwork = "https://api.mainnet-beta.solana.com"; 
  const solanaConnection = new Connection(solanaNetwork);

  const currentLessonData = lessonContents[currentLessonIndex];
  const allLessonsCompleted = lessonStatus.every(status => status === 'completed');
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStatus = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedStatus) {
        const parsedStatus: Array<'locked' | 'unlocked' | 'completed'> = JSON.parse(savedStatus);
        setLessonStatus(parsedStatus);
        const lastCompletedIndex = parsedStatus.lastIndexOf('completed');
        const newCurrentIndex = parsedStatus.findIndex(status => status === 'unlocked');
        setCurrentLessonIndex(newCurrentIndex !== -1 ? newCurrentIndex : (lastCompletedIndex + 1 < lessonContents.length ? lastCompletedIndex + 1 : lastCompletedIndex));
      }
    }
  }, []);

  const saveProgress = (newStatus: Array<'locked' | 'unlocked' | 'completed'>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newStatus));
    }
  };

  const progressPercentage = (lessonStatus.filter(s => s === 'completed').length / lessonContents.length) * 100;


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
          
          if (providerName === 'jup') {
            setTimeout(() => alert("Simulating Jupiter Swap interaction: You can now trade tokens! (Mock)"), 500);
          }
          if (providerName === 'magic-eden') {
            setTimeout(() => alert("Simulating Magic Eden interaction: You can now browse NFTs! (Mock)"), 500);
          }
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
  
  const handleOptionChange = (optionId: string) => {
    setSelectedAnswer(optionId);
    if (quizSubmitted) {
      setQuizSubmitted(false); 
      // setQuizFeedback(null); // If quizFeedback state is used, reset it here.
    }
  };

  const handleSubmitQuiz = useCallback(() => {
    if (!currentLessonData?.quiz || !selectedAnswer) return;

    const passedQuiz = selectedAnswer === currentLessonData.quiz.correctAnswer;
    setQuizPassed(passedQuiz);
    setQuizSubmitted(true);

    if (passedQuiz) {
      setFeedbackModalContent({ title: "Correct!", description: `Great job! ${currentLessonData.quiz.explanation || 'You can now proceed to the next lesson.'}` });
      const newLessonStatus = [...lessonStatus];
      newLessonStatus[currentLessonIndex] = 'completed';
      if (currentLessonIndex < lessonContents.length - 1) {
        newLessonStatus[currentLessonIndex + 1] = 'unlocked';
        setTimeout(() => {
            setCurrentLessonIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setQuizSubmitted(false);
            setQuizPassed(false);
            // setQuizFeedback(null); // If quizFeedback state is used
            setShowFeedbackModal(false);
        }, 1500); 
      } else {
         setTimeout(() => setShowFeedbackModal(false), 3000);
      }
      setLessonStatus(newLessonStatus);
      saveProgress(newLessonStatus);
    } else {
      setFeedbackModalContent({ title: "Incorrect", description: `Not quite! ${currentLessonData.quiz.explanation || 'Review the material and try again.'}` });
      setTimeout(() => setShowFeedbackModal(false), 3000); 
    }
    setShowFeedbackModal(true);
  }, [selectedAnswer, currentLessonData, currentLessonIndex, lessonStatus]);


  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => { // Changed from onSwipedUp
      if (selectedAnswer && currentLessonData?.quiz && lessonStatus[currentLessonIndex] !== 'completed') {
        handleSubmitQuiz();
      }
    },
    onSwipedRight: () => { // Changed from onSwipedDown
      setSelectedAnswer(null); 
      setQuizSubmitted(false);
      setQuizPassed(false);
      // setQuizFeedback(null); // If quizFeedback state is used
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  const allQuestionsAnswered = !!selectedAnswer; 

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
            Wallet Wizardry: Secure the Bag
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
                Master wallet setup and security protocols to protect your Web3 assets, earning the ‘Vault Keeper’ NFT badge.
            </p>
        </header>
      </div>
      
      <section className="my-8 w-full max-w-2xl text-center">
          <h2 className="text-xl font-semibold text-accent mb-2">Hoodie-Verse Lore</h2>
          <p className="text-md text-foreground">
            The Wallet Wall’s neon locks, powered by the ‘First Thread,’ secure the Hoodie-Verse’s future.
          </p>
      </section>

      <Progress 
        value={progressPercentage} 
        className="w-full max-w-3xl mb-8 bg-purple-900/50 [&>div]:bg-purple-500" 
      />

      <main className="w-full max-w-3xl flex flex-col items-center py-8 space-y-10">
        {!allLessonsCompleted ? (
            currentLessonData && lessonStatus[currentLessonIndex] !== 'locked' && (
              <motion.section
                key={currentLessonIndex}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`w-full bg-card p-6 md:p-8 rounded-xl shadow-lg border border-purple-600 neon-border-purple hover:shadow-[0_0_25px_rgba(168,85,247,1)] transition-all duration-300`}
                {...swipeHandlers} 
              >
                <h3 className="text-2xl md:text-3xl font-semibold text-primary mb-4">{currentLessonData.title}</h3>
                <div className="text-md md:text-lg text-foreground leading-relaxed mb-6 prose prose-invert max-w-none">
                    {currentLessonData.content}
                </div>

                {currentLessonData.pitfallWarning && lessonStatus[currentLessonIndex] !== 'completed' && (
                     <div className="my-4">{currentLessonData.pitfallWarning}</div>
                )}

                {currentLessonData.quiz && lessonStatus[currentLessonIndex] !== 'completed' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="mt-8"
                  >
                    <h4 className="text-xl md:text-2xl font-semibold text-secondary mb-4">Knowledge Check! (Swipe Left to Submit / Right to Reset)</h4>
                    <p className="text-md text-foreground mb-3">{currentLessonData.quiz.question}</p>
                    <RadioGroup 
                        value={selectedAnswer || ""} 
                        onValueChange={handleOptionChange} 
                        className="space-y-3"
                    >
                      {currentLessonData.quiz.options.map((opt) => (
                        <motion.div 
                            key={opt.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex items-center space-x-3 p-3 bg-muted/30 rounded-lg border-2 hover:border-green-600 cursor-pointer transition-all duration-150 ${selectedAnswer === opt.id ? 'border-green-500 ring-2 ring-green-500 neon-border-green' : 'border-green-900'}`}
                            onClick={() => handleOptionChange(opt.id)}
                        >
                          <RadioGroupItem 
                            value={opt.id} 
                            id={`${currentLessonData.id}-${opt.id}`} // Changed currentLessonIndex to currentLessonData.id for unique IDs
                            checked={selectedAnswer === opt.id}
                            disabled={quizSubmitted && quizPassed}
                            className="border-green-600 text-green-600 focus:ring-green-500 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-500"
                          />
                          <Label htmlFor={`${currentLessonData.id}-${opt.id}`} className="flex-1 cursor-pointer text-md">{opt.text}</Label>
                           {quizSubmitted && selectedAnswer === opt.id && !quizPassed && (
                                <XCircle className="h-5 w-5 text-red-500 ml-auto" />
                            )}
                            {quizSubmitted && selectedAnswer === opt.id && quizPassed && (
                                <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                            )}
                            {quizSubmitted && !quizPassed && opt.id === currentLessonData.quiz.correctAnswer && (
                               <span className="text-xs text-green-400 ml-2">(Correct Answer)</span>
                            )}
                        </motion.div>
                      ))}
                    </RadioGroup>
                    <Button
                      onClick={handleSubmitQuiz}
                      className="mt-6 w-full bg-purple-600 hover:bg-green-700 text-white shadow-[0_0_10px_theme(colors.purple.600)] hover:shadow-[0_0_15px_theme(colors.green.500)] transition-all duration-300"
                      disabled={!allQuestionsAnswered || (quizSubmitted && quizPassed)}
                    >
                      Submit Quiz (or Swipe Left)
                    </Button>
                  </motion.div>
                )}
              </motion.section>
            )
        ) : (
            <motion.section
                className="bg-card p-6 md:p-8 rounded-xl shadow-lg border-2 border-green-500 neon-border-green hover:shadow-[0_0_30px_rgba(34,197,94,1)] w-full text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Award className="w-20 h-20 text-green-400 mx-auto mb-4" />
                <h2 className="text-3xl md:text-4xl font-bold text-green-300 mb-3">Congratulations! Vault Keeper!</h2>
                <p className="text-xl text-foreground mb-4">You've completed Wallet Wizardry and earned the{' '} <span className="text-purple-400 font-semibold">‘Vault Keeper’ NFT badge!</span></p>
                <div className="flex items-center justify-center space-x-3 my-6">
                    <LockKeyhole className="w-12 h-12 text-purple-400" data-ai-hint="lock vault" />
                    <div>
                        <p className="text-lg md:text-xl font-semibold text-primary">REWARD: Vault Keeper NFT</p>
                        <p className="text-md text-muted-foreground">Your understanding of wallet security is certified!</p>
                    </div>
                </div>
                {lessonContents.find(l => l.pitfallWarning && lessonStatus[lessonContents.indexOf(l)] === 'completed')?.pitfallWarning}
                <Button asChild className="mt-6 w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_10px_theme(colors.blue.600)] hover:shadow-[0_0_15px_theme(colors.blue.500)] transition-all duration-300">
                    <Link href="/nft-mastery">Advance to NFT Mastery</Link>
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
              {quizPassed && currentLessonIndex < lessonContents.length - 1 ? (
                null 
              ) : quizPassed && allLessonsCompleted ? (
                 <AlertDialogAction onClick={() => setShowFeedbackModal(false)} className="bg-green-600 hover:bg-green-700">Wizardry Mastered!</AlertDialogAction>
              ) : (
                <>
                  <AlertDialogCancel onClick={() => setShowFeedbackModal(false)}>Review Lesson</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {setSelectedAnswer(null); setQuizSubmitted(false); setQuizPassed(false); /* setQuizFeedback(null); */ setShowFeedbackModal(false);}} className="bg-purple-600 hover:bg-purple-700">Retry Quiz</AlertDialogAction>
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

      </main>

      <footer className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          #StayBuilding #StayHODLing
        </p>
      </footer>
    </div>
  );
}
