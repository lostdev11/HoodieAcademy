'use client'

import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Web3 from 'web3'; 
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { motion } from 'framer-motion';
import { LockKeyhole, AlertTriangle, ArrowLeft, CheckCircle, Award, Wallet, BookOpen } from 'lucide-react';
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
import { Progress } from "@/components/ui/progress";
import TokenGate from "@/components/TokenGate"; 
import { Card, CardContent } from "@/components/ui/card";
import { Syllabus } from "@/components/Syllabus";
import { syllabusData } from "@/lib/syllabusData";
import type { SolanaWallet } from "@/types/wallet"; // used below for local vars

type WalletProviderOption = 'metamask' | 'phantom' | 'jup' | 'magic-eden'; 



const tiers = [
  {
    id: 'tier-1',
    title: 'Tier 1: Introduction to Crypto Wallets',
    description: 'Learn the basics of crypto wallets and their importance',
    path: '/wallet-wizardry/tier-1',
    status: 'unlocked' as 'locked' | 'unlocked' | 'completed'
  },
  {
    id: 'tier-2',
    title: 'Tier 2: Custodial vs Non-Custodial Wallets',
    description: 'Understand the difference between custodial and non-custodial wallets',
    path: '/wallet-wizardry/tier-2',
    status: 'locked' as 'locked' | 'unlocked' | 'completed'
  },
  {
    id: 'tier-3',
    title: 'Tier 3: Understanding Keys & Phantom Interface',
    description: 'Master private keys, recovery phrases, and Phantom wallet interface',
    path: '/wallet-wizardry/tier-3',
    status: 'locked' as 'locked' | 'unlocked' | 'completed'
  },
  {
    id: 'tier-4',
    title: 'Tier 4: NFTs, dApps, DeFi, and Bridges',
    description: 'Explore NFTs, decentralized apps, DeFi, and cross-chain functionality',
    path: '/wallet-wizardry/tier-4',
    status: 'locked' as 'locked' | 'unlocked' | 'completed'
  }
];


const LOCAL_STORAGE_KEY = 'walletWizardryProgress';
const WIFHOODIE_COLLECTION_ADDRESS = "6bRhotj6T2ducLXdMneXCXUYW1ye4bRZCTHatxZKutS5";


export default function WalletWizardryPage() {
  const [tierStatus, setTierStatus] = useState<Array<'locked' | 'unlocked' | 'completed'>>(
    tiers.map((_, index) => (index === 0 ? 'unlocked' : 'locked'))
  );
  const [showSyllabus, setShowSyllabus] = useState(false);

  const [courseAccount, setCourseAccount] = useState<string | null>(null);
  const [courseBalance, setCourseBalance] = useState<string | null>(null);
  const [courseMockNftStatus, setCourseMockNftStatus] = useState<string | null>(null);
  const [showCourseWalletAlert, setShowCourseWalletAlert] = useState(false);
  const [courseWalletAlertConfig, setCourseWalletAlertConfig] = useState({ title: "", description: "" });
  const [courseConnectedWalletProvider, setCourseConnectedWalletProvider] = useState<WalletProviderOption | null>(null);
  const [showCourseWalletSelector, setShowCourseWalletSelector] = useState(false);

  const solanaNetwork = "https://api.mainnet-beta.solana.com";
  const solanaConnection = new Connection(solanaNetwork);

  const allTiersCompleted = tierStatus.every(status => status === 'completed');
  
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStatus = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedStatus) {
        const parsedStatus: Array<'locked' | 'unlocked' | 'completed'> = JSON.parse(savedStatus);
        setTierStatus(parsedStatus);
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

  const progressPercentage = (tierStatus.filter(s => s === 'completed').length / tiers.length) * 100;

  const resetCourseWalletState = () => {
    setCourseAccount(null);
    setCourseBalance(null);
    setCourseMockNftStatus(null);
    setCourseConnectedWalletProvider(null);
  };

  const handleCourseWalletConnection = async (providerName: WalletProviderOption) => {
    resetCourseWalletState();
    setCourseConnectedWalletProvider(providerName);

    try {
      switch (providerName) {
        case 'metamask':
          if (typeof window.ethereum === 'undefined') {
            setCourseWalletAlertConfig({ title: "MetaMask Not Detected", description: "Please install MetaMask to continue." });
            setShowCourseWalletAlert(true);
            return;
          }
          let ethProvider = window.ethereum;
          if (window.ethereum.providers?.length) {
            const metaMaskProvider = window.ethereum.providers.find((p: any) => p.isMetaMask);
            if (!metaMaskProvider) {
                 setCourseWalletAlertConfig({ title: "MetaMask Required", description: "Please select MetaMask. If installed, ensure it's your active wallet or try refreshing." });
                 setShowCourseWalletAlert(true);
                 return;
            }
            ethProvider = metaMaskProvider;
          } else if (!window.ethereum.isMetaMask) {
             setCourseWalletAlertConfig({ title: "MetaMask Required", description: "Please use MetaMask. Other Ethereum wallets are not supported for this action." });
             setShowCourseWalletAlert(true);
             return;
          }
          
          const web3 = new Web3(ethProvider);
          const accounts = await ethProvider.request({ method: 'eth_requestAccounts' });
          const userAccount = accounts[0];
          setCourseAccount(userAccount);
          const balanceWei = await web3.eth.getBalance(userAccount);
          const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
          setCourseBalance(`${parseFloat(balanceEth).toFixed(4)} ETH`);
          setCourseMockNftStatus(Math.random() > 0.5 ? 'Mock Hoodie-Verse NFT: Owned!' : 'Mock Hoodie-Verse NFT: None found.');
          setCourseWalletAlertConfig({ title: "MetaMask Connected", description: `Successfully connected: ${userAccount.slice(0, 6)}...${userAccount.slice(-4)}` });
          break;

        case 'phantom':
        case 'jup':
        case 'magic-eden':
          let solProvider: SolanaWallet | undefined;
          const sol: SolanaWallet | undefined = 
            typeof window !== 'undefined' ? window.solana : undefined;
          
          if (providerName === 'phantom') {
            if (!(sol?.isPhantom)) {
              setCourseWalletAlertConfig({ title: "Phantom Not Detected", description: "Please install Phantom wallet to continue." });
              setShowCourseWalletAlert(true);
              return;
            }
            solProvider = sol;
          } else {
             if (sol?.isPhantom) solProvider = sol;
             else if (sol) solProvider = sol;
             else {
                setCourseWalletAlertConfig({ title: "Solana Wallet Not Detected", description: `Please install a compatible Solana wallet (e.g., Phantom) for ${providerName}.` });
                setShowCourseWalletAlert(true);
                return;
             }
          }

          await solProvider.connect();
          
          if (!solProvider.publicKey) {
            console.error('Solana wallet public key is null after connection');
            return;
          }
          
          const solAccount = solProvider.publicKey.toString();
          setCourseAccount(solAccount);
          const solBalanceLamports = await solanaConnection.getBalance(new PublicKey(solAccount));
          setCourseBalance(`${(solBalanceLamports / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
          setCourseMockNftStatus(Math.random() > 0.5 ? 'Mock Solana NFT: Owned!' : 'Mock Solana NFT: None found.');
          
          let successTitle = `${providerName.charAt(0).toUpperCase() + providerName.slice(1)} Connected`;
          if (providerName === 'jup') successTitle = `Connected via ${solProvider.isPhantom ? 'Phantom' : 'Solana Wallet'} for JUP`;
          if (providerName === 'magic-eden') successTitle = `Connected via ${solProvider.isPhantom ? 'Phantom' : 'Solana Wallet'} for Magic Eden`;
          
          setCourseWalletAlertConfig({ title: successTitle, description: `Successfully connected: ${solAccount.slice(0, 4)}...${solAccount.slice(-4)}` });

          if (providerName === 'jup') {
            setTimeout(() => alert("Simulating Jupiter Swap interaction: You can now trade tokens! (Mock)"), 500);
          }
          if (providerName === 'magic-eden') {
            setTimeout(() => alert("Simulating Magic Eden interaction: You can now browse NFTs! (Mock)"), 500);
          }
          break;
        default:
          setCourseWalletAlertConfig({ title: "Unsupported Wallet", description: "This wallet provider is not yet supported." });
      }
    } catch (error: any) {
      console.error("Course wallet connection error:", error);
      let description = `Failed to connect ${providerName}. Please try again.`;
      if (error.code === 4001 || error.message?.includes('User rejected the request')) {
          description = 'Connection request rejected. Please approve in your wallet.';
      } else if (error.message?.includes('missing provider')) {
          description = `${providerName.charAt(0).toUpperCase() + providerName.slice(1)} not found. Please ensure it's installed and enabled.`;
      }
      setCourseWalletAlertConfig({ title: "Connection Error", description });
    }
    setShowCourseWalletAlert(true);
    setShowCourseWalletSelector(false);
  };



  const courseWalletProviders: { name: WalletProviderOption; label: string; icon?: JSX.Element }[] = [
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
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent glow-text">
            Wallet Wizardry
          </h1>
          <p className="text-xl text-gray-300 mb-2">Master wallet setup, security, and scam awareness.</p>
          <p className="text-cyan-300 text-lg">
            Current Time: <span className="text-green-400 font-mono">{currentTime}</span>
          </p>
        </div>
        {/* Main content: lessons, quizzes, wallet, etc. */}
        <div className="max-w-3xl mx-auto">
          <TokenGate>
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
                        Master wallet setup and security protocols to protect your Web3 assets, earning the 'Vault Keeper' NFT badge.
                    </p>
                    {/* Syllabus Button */}
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSyllabus(!showSyllabus)}
                        className="text-cyan-400 hover:text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/10"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        📘 Syllabus
                      </Button>
                    </div>
                </header>
              </div>

              {/* Syllabus Display */}
              {showSyllabus && syllabusData['wallet-wizardry'] && (
                <div className="w-full max-w-4xl mb-8">
                  <Syllabus data={syllabusData['wallet-wizardry']} courseTitle="Wallet Wizardry" />
                </div>
              )}

              <main className="w-full max-w-3xl flex flex-col items-center py-8 space-y-10">
                  <section className="my-8 w-full max-w-2xl text-center mx-auto">
                      <h2 className="text-xl font-semibold text-accent mb-2">Hoodie-Verse Lore</h2>
                      <p className="text-md text-foreground">
                          The Wallet Wall's neon locks, powered by the 'First Thread,' secure the Hoodie-Verse's future.
                      </p>
                  </section>

                  <Progress
                      value={progressPercentage}
                      className="w-full max-w-3xl mb-8 bg-purple-900/50 [&>div]:bg-purple-500"
                  />

                  {/* Tiers Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                    {tiers.map((tier, index) => (
                      <motion.div
                        key={tier.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        className={`relative p-6 rounded-xl shadow-lg border-2 transition-all duration-300 ${
                          tierStatus[index] === 'completed'
                            ? 'bg-green-900/30 border-green-500 neon-border-green'
                            : tierStatus[index] === 'unlocked'
                            ? 'bg-card border-purple-600 neon-border-purple hover:shadow-[0_0_25px_rgba(168,85,247,1)]'
                            : 'bg-slate-800/50 border-slate-600 opacity-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-primary mb-2">{tier.title}</h3>
                            <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>
                          </div>
                          <div className="ml-4">
                            {tierStatus[index] === 'completed' ? (
                              <CheckCircle className="w-8 h-8 text-green-400" />
                            ) : tierStatus[index] === 'unlocked' ? (
                              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-bold">{index + 1}</span>
                              </div>
                            ) : (
                              <LockKeyhole className="w-8 h-8 text-slate-400" />
                            )}
                          </div>
                        </div>
                        
                        {tierStatus[index] === 'completed' ? (
                          <div className="text-center">
                            <p className="text-green-400 font-semibold mb-3">✓ Completed</p>
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="border-green-500 text-green-400 hover:bg-green-500/10"
                            >
                              <Link href={tier.path}>Review</Link>
                            </Button>
                          </div>
                        ) : tierStatus[index] === 'unlocked' ? (
                          <Button
                            asChild
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <Link href={tier.path}>Start Tier</Link>
                          </Button>
                        ) : (
                          <div className="text-center">
                            <p className="text-slate-400 text-sm">Complete previous tiers to unlock</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Final Exam Section */}
                  {allTiersCompleted && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-8 rounded-xl shadow-lg border-2 border-purple-500 neon-border-purple w-full max-w-4xl text-center"
                    >
                      <Award className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                      <h2 className="text-3xl font-bold text-purple-300 mb-4">Ready for the Final Exam?</h2>
                      <p className="text-lg text-foreground mb-6">
                        You've completed all tiers! Test your knowledge with the comprehensive final exam.
                      </p>
                      <Button
                        asChild
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold"
                      >
                        <Link href="/wallet-wizardry/final-exam">Take Final Exam</Link>
                      </Button>
                    </motion.div>
                  )}

                  {!allTiersCompleted && (
                                              <motion.section
                            className="bg-card p-6 md:p-8 rounded-xl shadow-lg border-2 border-green-500 neon-border-green hover:shadow-[0_0_30px_rgba(34,197,94,1)] w-full text-center"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Award className="w-20 h-20 text-green-400 mx-auto mb-4" />
                            <h2 className="text-3xl md:text-4xl font-bold text-green-300 mb-3">Welcome to Wallet Wizardry!</h2>
                            <p className="text-xl text-foreground mb-4">Complete all tiers to unlock the final exam and earn your{' '} <span className="text-purple-400 font-semibold">'Vault Keeper' NFT badge!</span></p>
                            <div className="flex items-center justify-center space-x-3 my-6">
                                <LockKeyhole className="w-12 h-12 text-purple-400" data-ai-hint="lock vault" />
                                <div>
                                    <p className="text-lg md:text-xl font-semibold text-primary">REWARD: Vault Keeper NFT</p>
                                    <p className="text-md text-muted-foreground">Master wallet security to earn your certification!</p>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 mt-6">
                                <Button asChild className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_10px_theme(colors.blue.600)] hover:shadow-[0_0_15px_theme(colors.blue.500)] transition-all duration-300">
                                    <Link href="/nft-mastery">Advance to NFT Mastery</Link>
                                </Button>
                            </div>
                        </motion.section>
                  )}



                  <AlertDialog open={showCourseWalletAlert} onOpenChange={setShowCourseWalletAlert}>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                          <AlertDialogTitle>{courseWalletAlertConfig.title}</AlertDialogTitle>
                          <AlertDialogDescription>
                              {courseWalletAlertConfig.description}
                          </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                          {courseWalletAlertConfig.title !== "MetaMask Connected" && courseWalletAlertConfig.title !== "Phantom Connected" && !courseWalletAlertConfig.title.includes("Connected via") && <AlertDialogCancel>Cancel</AlertDialogCancel> }
                          <AlertDialogAction onClick={() => setShowCourseWalletAlert(false)} className="bg-purple-600 hover:bg-purple-700">OK</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>

                  <section className="my-8 text-center p-6 bg-card rounded-xl shadow-lg border border-purple-600 neon-border-purple w-full">
                      <div className="flex justify-center items-center">
                      <Button
                          onClick={() => setShowCourseWalletSelector(!showCourseWalletSelector)}
                          className="px-6 py-3 mb-4 rounded-lg shadow-lg bg-gradient-to-r from-green-500 to-purple-600 hover:from-green-600 hover:to-purple-700 text-white min-w-[240px] transition-all duration-300 flex items-center justify-center"
                          aria-expanded={showCourseWalletSelector}
                      >
                          <Wallet size={18} className="mr-2"/>
                          {courseConnectedWalletProvider ? `Connected: ${courseConnectedWalletProvider}` : "Select Wallet"}
                      </Button>
                      </div>

                      {showCourseWalletSelector && (
                          <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex justify-center mt-4 overflow-hidden"
                          >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-md">
                                  {courseWalletProviders.map(wallet => (
                                      <Button
                                          key={wallet.name}
                                          onClick={() => handleCourseWalletConnection(wallet.name)}
                                          className="w-full px-6 py-3 rounded-lg shadow-lg bg-gradient-to-r from-green-600 to-purple-600 hover:from-green-700 hover:to-purple-700 text-white transition-all duration-300 flex items-center justify-center"
                                      >
                                      {wallet.icon} {wallet.label}
                                      </Button>
                                  ))}
                              </div>
                          </motion.div>
                      )}

                      {courseAccount && (
                      <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-4 text-foreground space-y-1"
                      >
                          <p><strong>Address:</strong> {courseAccount}</p>
                          <p><strong>Balance:</strong> {courseBalance || 'Loading...'}</p>
                          <p>{courseMockNftStatus || 'Checking NFT status...'}</p>
                      </motion.div>
                      )}
                  </section>
              </main>

              <footer className="mt-12 text-center">
                <p className="text-sm text-muted-foreground">#StayBuilding #StayHODLing</p>
              </footer>
            </div>
          </TokenGate>
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

    