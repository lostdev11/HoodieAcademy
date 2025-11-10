'use client';

import { useState, useEffect } from 'react';
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, CheckCircle2, XCircle, Loader2, Gift, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CLAIM_PRICE_SOL = 0.05;
const TREASURY_WALLET = process.env.NEXT_PUBLIC_STARTER_PACK_TREASURY_WALLET || '';

// Use Helius RPC if available, otherwise fallback to public RPC
const getSolanaRpcUrl = () => {
  // Try Helius first if available
  if (process.env.NEXT_PUBLIC_HELIUS_RPC_URL) {
    return process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
  }
  // Try custom RPC
  if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
    return process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  }
  // Fallback to public RPC (may have rate limits)
  return 'https://api.mainnet-beta.solana.com';
};

const SOLANA_RPC_URL = getSolanaRpcUrl();

const SUCCESS_VIDEO_PATH =
  process.env.NEXT_PUBLIC_STARTER_PACK_SUCCESS_VIDEO_PATH || '/animations/pack-claim-success.mp4';
const SUCCESS_GIF_PATH =
  process.env.NEXT_PUBLIC_STARTER_PACK_SUCCESS_GIF_PATH || '/animations/pack-claim-success.gif';

const USE_SUCCESS_VIDEO =
  process.env.NEXT_PUBLIC_STARTER_PACK_SUCCESS_VIDEO !== 'false' && !!SUCCESS_VIDEO_PATH;
const USE_SUCCESS_GIF =
  process.env.NEXT_PUBLIC_STARTER_PACK_SUCCESS_GIF !== 'false' && !!SUCCESS_GIF_PATH;

interface ClaimStatus {
  id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'delivered' | 'failed';
  payment_tx_signature?: string;
  payment_verified?: boolean;
  domain_name?: string;
  sol_amount_sent?: number;
  nft_mint_address?: string;
  rejection_reason?: string;
  created_at?: string;
}

const getClaimErrorMessage = (error: unknown): string => {
  const fallback = 'Something went wrong while processing your claim. Please try again.';

  const message =
    typeof error === 'string'
      ? error
      : error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string'
        ? (error as any).message
        : '';

  const normalized = message.toLowerCase();

  if (normalized.includes('insufficient funds')) {
    return 'It looks like your wallet does not have enough SOL to cover the 0.05 SOL claim and fees.';
  }

  if (normalized.includes('wallet already has a claim')) {
    return 'This wallet already has an existing starter pack claim. You can track it in the status section.';
  }

  if (normalized.includes('treasury wallet not configured')) {
    return 'The claim treasury wallet is not configured. Please contact support.';
  }

  if (normalized.includes('failed to get blockhash') || normalized.includes('failed to get recent blockhash')) {
    return 'Unable to reach the Solana network. Please try again in a moment or refresh the page.';
  }

  if (normalized.includes('transaction was not confirmed')) {
    return 'We could not confirm the payment on-chain. Please check your wallet and try again.';
  }

  if (normalized.includes('forbidden') || normalized.includes('403')) {
    return 'The RPC endpoint blocked the request. Please ensure you have a valid Solana RPC URL configured.';
  }

  if (message) {
    return message;
  }

  return fallback;
};

export default function StarterPackPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showRipReveal, setShowRipReveal] = useState(false);
  const [showPackHover, setShowPackHover] = useState(true);
  const [ripVideoError, setRipVideoError] = useState(!USE_SUCCESS_VIDEO);
  const [ripGifError, setRipGifError] = useState(!USE_SUCCESS_GIF);
  const [claimStatus, setClaimStatus] = useState<ClaimStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const { toast } = useToast();

  // Check for existing wallet connection
  useEffect(() => {
    const storedWallet = localStorage.getItem('hoodie_academy_wallet') || 
                        localStorage.getItem('walletAddress') ||
                        localStorage.getItem('connectedWallet');
    if (storedWallet) {
      setWalletAddress(storedWallet);
      checkClaimStatus(storedWallet);
    }
  }, []);

  useEffect(() => {
    if (!showRipReveal) return;

    // If video is available, let onEnded handle hiding.
    if (USE_SUCCESS_VIDEO && !ripVideoError) return;

    // If using GIF fallback, hide after a short delay.
    if (USE_SUCCESS_GIF && !ripGifError) {
      const timer = setTimeout(() => setShowRipReveal(false), 3500);
      return () => clearTimeout(timer);
    }

    // If both assets failed, hide quickly.
    const timer = setTimeout(() => setShowRipReveal(false), 2000);
    return () => clearTimeout(timer);
  }, [showRipReveal, ripVideoError, ripGifError]);

  // Check claim status
  const checkClaimStatus = async (wallet: string) => {
    setIsLoadingStatus(true);
    try {
      const response = await fetch(`/api/starter-pack/claim?walletAddress=${wallet}`);
      const data = await response.json();
      if (data.claim) {
        setClaimStatus(data.claim);
      }
    } catch (error) {
      console.error('Error checking claim status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const provider = typeof window !== 'undefined' ? window.solana : undefined;
      
      if (!provider) {
        toast({
          title: 'Wallet Not Found',
          description: 'Please install Phantom wallet to continue.',
          variant: 'destructive',
        });
        setIsConnecting(false);
        return;
      }

      // Check if already connected
      if (provider.publicKey) {
        const address = provider.publicKey.toString();
        setWalletAddress(address);
        localStorage.setItem('hoodie_academy_wallet', address);
        checkClaimStatus(address);
        setIsConnecting(false);
        return;
      }

      // Connect wallet
      try {
        await provider.connect({ onlyIfTrusted: true } as any);
      } catch {
        await provider.connect();
      }

      if (!provider.publicKey) {
        throw new Error('Failed to get wallet address');
      }

      // Type assertion for wallet publicKey
      const publicKey = provider.publicKey as any;
      const address = publicKey?.toString ? publicKey.toString() : String(publicKey);
      setWalletAddress(address);
      localStorage.setItem('hoodie_academy_wallet', address);
      checkClaimStatus(address);

      toast({
        title: 'Wallet Connected',
        description: `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to connect wallet',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Create payment transaction
  const createPaymentTransaction = async (): Promise<string> => {
    if (!walletAddress || !TREASURY_WALLET) {
      throw new Error('Wallet or treasury not configured');
    }

    const provider = typeof window !== 'undefined' ? window.solana : undefined;
    if (!provider || !provider.publicKey) {
      throw new Error('Wallet not connected');
    }

    if (!provider.publicKey) {
      throw new Error('Wallet public key not available');
    }

    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    const fromPubkey = new PublicKey(provider.publicKey.toString());
    const toPubkey = new PublicKey(TREASURY_WALLET);
    const amount = CLAIM_PRICE_SOL * LAMPORTS_PER_SOL;

    // Get recent blockhash with error handling
    let blockhash: string;
    try {
      const blockhashResult = await connection.getLatestBlockhash('confirmed');
      blockhash = blockhashResult.blockhash;
    } catch (error: any) {
      // If RPC fails, try alternative endpoints
      console.error('RPC error, trying fallback:', error);
      
      // Try Helius if available
      if (process.env.NEXT_PUBLIC_HELIUS_RPC_URL) {
        const heliusConnection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC_URL, 'confirmed');
        const heliusResult = await heliusConnection.getLatestBlockhash('confirmed');
        blockhash = heliusResult.blockhash;
      } else {
        throw new Error(`Failed to get blockhash: ${error.message || 'RPC endpoint unavailable. Please check your RPC configuration.'}`);
      }
    }

    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: amount,
      })
    );

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    // Sign transaction
    if (!provider.signTransaction) {
      throw new Error('Wallet does not support signing transactions');
    }
    const signedTransaction = await provider.signTransaction(transaction);

    // Send transaction
    const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });

    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');

    return signature;
  };

  // Handle claim
  const handleClaim = async () => {
    if (!walletAddress) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    setIsClaiming(true);
    try {
      // Show rip reveal animation
      setRipVideoError(false);
      setRipGifError(false);
      setShowRipReveal(true);

      // Create payment transaction
      const paymentTxSignature = await createPaymentTransaction();

      // Create claim via API
      const response = await fetch('/api/starter-pack/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          paymentTxSignature,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create claim');
      }

      setClaimStatus(data.claim);
      toast({
        title: 'Claim Created!',
        description: 'Your claim is pending admin approval. You will receive your rewards once approved.',
      });

      // Hide pack hover and show rip reveal
      setShowPackHover(false);
    } catch (error) {
      console.error('Error claiming starter pack:', error);
      setShowRipReveal(false);
      setShowPackHover(true); // Show pack hover again on error
      const description = getClaimErrorMessage(error);
      toast({
        title: 'Claim Failed',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const handleRipAnimationEnd = () => {
    setShowRipReveal(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center gap-2 text-amber-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Pending Approval</span>
          </div>
        );
      case 'approved':
        return (
          <div className="flex items-center gap-2 text-blue-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Approved - Processing Delivery</span>
          </div>
        );
      case 'delivered':
        return (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Delivered</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-2 text-red-400">
            <XCircle className="w-4 h-4" />
            <span>Rejected</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2 text-red-400">
            <XCircle className="w-4 h-4" />
            <span>Delivery Failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Background matching pack colors - only show when pack is visible */}
      {showPackHover && !showRipReveal && walletAddress && !claimStatus ? (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-pink-800 to-purple-900 z-0">
          <motion.div
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            className="absolute inset-0 bg-gradient-to-br from-purple-600/30 via-pink-500/30 to-purple-600/30"
          />
        </div>
      ) : (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-0" />
      )}
      {/* Pack Floating in Center */}
      <AnimatePresence>
        {showPackHover && !showRipReveal && walletAddress && !claimStatus && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-30 flex items-center justify-center"
          >
            <motion.div
              animate={{
                y: [0, -30, 0],
                rotate: [0, 8, -8, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative"
            >
              {/* Pack Hover GIF - Larger size */}
              <motion.img
                src="/animations/pack-hovering.gif"
                alt="Starter Pack Hovering"
                className="w-96 h-96 md:w-[500px] md:h-[500px] object-contain drop-shadow-2xl select-none pointer-events-none"
                animate={{ rotate: [0, 2, -2, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Glow effect around pack */}
              <motion.div
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 blur-3xl -z-10"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay with Claim Button */}
      <AnimatePresence>
        {showPackHover && !showRipReveal && walletAddress && !claimStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-end justify-center pb-16 md:pb-24"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              {/* Overlay background with blur */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-md rounded-2xl -inset-x-8 -inset-y-4" />
              
              {/* Claim Button */}
              <div className="relative px-8 py-6">
                <Button
                  onClick={handleClaim}
                  disabled={isClaiming}
                  size="lg"
                  className="w-full md:w-auto min-w-[200px] text-lg px-8 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-2xl hover:shadow-purple-500/50 transition-all"
                >
                  {isClaiming ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Gift className="w-5 h-5 mr-2" />
                      Claim for {CLAIM_PRICE_SOL} SOL
                    </>
                  )}
                </Button>
                
                {/* Price info */}
                <p className="text-center text-sm text-white/80 mt-3">
                  Get .sol domain, $3 SOL, and mystery NFT
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pack Ripping Animation */}
      <AnimatePresence>
        {showRipReveal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-6"
          >
            {!ripVideoError && USE_SUCCESS_VIDEO ? (
              <div className="relative flex flex-col items-center text-center">
                <video
                  key={showRipReveal ? 'rip-video-playing' : 'rip-video'}
                  autoPlay
                  muted
                  playsInline
                  className="w-[360px] h-[360px] md:w-[480px] md:h-[480px] object-contain drop-shadow-[0_0_40px_rgba(236,72,153,0.6)]"
                  onEnded={handleRipAnimationEnd}
                  onError={() => setRipVideoError(true)}
                >
                  <source src={SUCCESS_VIDEO_PATH} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-8 space-y-2"
                >
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                    Claim Submitted!
                  </h2>
                  <p className="text-white/80 text-sm md:text-base">
                    Your Web3 Starter Pack claim is being processed.
                  </p>
                  <p className="text-white/60 text-xs md:text-sm">
                    Admins will verify payment and deliver rewards shortly.
                  </p>
                </motion.div>
              </div>
            ) : !ripGifError && USE_SUCCESS_GIF ? (
              <div className="relative flex flex-col items-center text-center">
                <motion.img
                  src={SUCCESS_GIF_PATH}
                  alt="Pack Claim Success"
                  className="w-[360px] h-[360px] md:w-[480px] md:h-[480px] object-contain drop-shadow-[0_0_40px_rgba(236,72,153,0.6)] select-none"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  onError={() => setRipGifError(true)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 space-y-2"
                >
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                    Claim Submitted!
                  </h2>
                  <p className="text-white/80 text-sm md:text-base">
                    Your Web3 Starter Pack claim is being processed.
                  </p>
                  <p className="text-white/60 text-xs md:text-sm">
                    Admins will verify payment and deliver rewards shortly.
                  </p>
                </motion.div>
              </div>
            ) : (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative bg-slate-900/95 border-2 border-purple-500/50 p-8 max-w-md text-center shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 blur-3xl opacity-40" />
                <div className="relative space-y-4">
                  <Gift className="w-16 h-16 mx-auto text-purple-400" />
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                    Claim Submitted!
                  </h2>
                  <p className="text-white/80">
                    Your Web3 Starter Pack claim is being processed.
                  </p>
                  <p className="text-sm text-white/60">
                    Waiting for admin approval...
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - Only show when pack is not visible */}
      {(!showPackHover || showRipReveal || !walletAddress || claimStatus) && (
        <div className="container mx-auto px-4 py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="inline-block mb-4"
              >
                <Sparkles className="w-16 h-16 text-purple-400" />
              </motion.div>
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                Web3 Starter Pack
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Get started in Web3 with a .sol domain, $3 worth of SOL, and a mystery NFT!
              </p>
            </div>

            {/* Wallet Connection */}
            {!walletAddress ? (
            <Card className="bg-slate-800/50 border-slate-700 mb-8">
              <CardHeader>
                <CardTitle>Connect Your Wallet</CardTitle>
                <CardDescription>
                  Connect your Solana wallet to claim your starter pack
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="w-full"
                  size="lg"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect Wallet
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Wallet Info */}
              <Card className="bg-slate-800/50 border-slate-700 mb-8">
                <CardHeader>
                  <CardTitle>Wallet Connected</CardTitle>
                  <CardDescription>
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Claim Status */}
              {isLoadingStatus ? (
                <Card className="bg-slate-800/50 border-slate-700 mb-8">
                  <CardContent className="py-8 text-center">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-purple-400" />
                  </CardContent>
                </Card>
              ) : claimStatus ? (
                <Card className="bg-slate-800/50 border-slate-700 mb-8">
                  <CardHeader>
                    <CardTitle>Your Claim Status</CardTitle>
                    {getStatusBadge(claimStatus.status)}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {claimStatus.payment_tx_signature && (
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Payment Transaction</p>
                        <a
                          href={`https://solscan.io/tx/${claimStatus.payment_tx_signature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 text-sm break-all"
                        >
                          {claimStatus.payment_tx_signature.slice(0, 20)}...
                        </a>
                      </div>
                    )}
                    {claimStatus.status === 'delivered' && (
                      <div className="space-y-2">
                        {claimStatus.domain_name && (
                          <div>
                            <p className="text-sm text-gray-400">Domain</p>
                            <p className="text-green-400">{claimStatus.domain_name}</p>
                          </div>
                        )}
                        {claimStatus.sol_amount_sent && (
                          <div>
                            <p className="text-sm text-gray-400">SOL Sent</p>
                            <p className="text-green-400">{claimStatus.sol_amount_sent.toFixed(6)} SOL (~$3 USD)</p>
                          </div>
                        )}
                        {claimStatus.nft_mint_address && (
                          <div>
                            <p className="text-sm text-gray-400">NFT Mint</p>
                            <a
                              href={`https://solscan.io/token/${claimStatus.nft_mint_address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-400 hover:text-purple-300 text-sm break-all"
                            >
                              {claimStatus.nft_mint_address.slice(0, 20)}...
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    {claimStatus.status === 'rejected' && claimStatus.rejection_reason && (
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Rejection Reason</p>
                        <p className="text-red-400">{claimStatus.rejection_reason}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                /* Claim Form */
                <Card className="bg-slate-800/50 border-slate-700 mb-8">
                  <CardHeader>
                    <CardTitle>Claim Your Starter Pack</CardTitle>
                    <CardDescription>
                      Pay {CLAIM_PRICE_SOL} SOL to claim your Web3 Starter Pack
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Rewards List */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold mb-4">What You'll Get:</h3>
                      <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <span className="text-purple-400">.sol</span>
                        </div>
                        <div>
                          <p className="font-medium">.sol Domain</p>
                          <p className="text-sm text-gray-400">Your own Solana domain name</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <span className="text-green-400">$3</span>
                        </div>
                        <div>
                          <p className="font-medium">$3 worth of SOL</p>
                          <p className="text-sm text-gray-400">$3 USD worth of SOL sent to your wallet</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                          <Gift className="w-5 h-5 text-pink-400" />
                        </div>
                        <div>
                          <p className="font-medium">Mystery NFT</p>
                          <p className="text-sm text-gray-400">Exclusive mystery NFT airdrop</p>
                        </div>
                      </div>
                    </div>

                    {/* Claim Button */}
                    <Button
                      onClick={handleClaim}
                      disabled={isClaiming}
                      className="w-full"
                      size="lg"
                    >
                      {isClaiming ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Gift className="w-4 h-4 mr-2" />
                          Claim for {CLAIM_PRICE_SOL} SOL
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-gray-400">
                      One claim per wallet. After payment, your claim will be reviewed by an admin.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </motion.div>
        </div>
      )}
    </div>
  );
}

