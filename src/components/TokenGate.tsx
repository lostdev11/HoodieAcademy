"use client";
import React from 'react';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TokenGateProps {
  children: React.ReactNode;
}

declare global {
  interface Window {
    solana?: any;
  }
}

type WalletProvider = 'phantom';

const VERIFICATION_SESSION_KEY = 'wifhoodie_verification';

export default function TokenGate({ children }: TokenGateProps) {
  const router = useRouter()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isHolder, setIsHolder] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(false);
  const isPhantomInstalled = typeof window !== 'undefined' && window.solana?.isPhantom;

  // Add the helper function inside the component so it can access state setters
  const checkWifHoodieOwnership = async (wallet: string, showSuccessMessage: boolean = true) => {
    try {
      const res = await fetch('/api/verify-holder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: wallet }),
      });

      const data = await res.json();
      console.log("🎯 Debug: Response from /api/verify-holder:", data);

      if (data?.isHolder) {
        setIsHolder(true);
        localStorage.setItem('walletAddress', wallet);
        sessionStorage.setItem(VERIFICATION_SESSION_KEY, JSON.stringify({
          walletAddress: wallet,
          isHolder: true,
          timestamp: Date.now()
        }));
        setIsAuthenticated(true);
        // setHasBeenConnected(true); // This state is no longer needed
        if (showSuccessMessage) {
          // setShowSuccess(true); // This state is no longer needed
          setTimeout(() => {
            // setShowSuccess(false); // This state is no longer needed
            router.push('/onboarding'); // Redirect to onboarding if it's a new user
          }, 2000);
        }
      } else {
        setIsHolder(false);
      }
    } catch (err) {
      console.error("💥 Error verifying NFT ownership:", err);
      setError("Something went wrong verifying your NFT.");
    }
  };

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // On mount, check for existing session or wallet
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sessionData = sessionStorage.getItem(VERIFICATION_SESSION_KEY);
      if (sessionData) {
        try {
          const { walletAddress: sessionWallet, isHolder: sessionIsHolder, timestamp } = JSON.parse(sessionData);
          const now = Date.now();
          const sessionAge = now - timestamp;
          const sessionValid = sessionAge < 30 * 60 * 1000; // 30 minutes
          if (sessionValid && sessionIsHolder) {
            setWalletAddress(sessionWallet);
            setIsHolder(true);
            // setHasBeenConnected(true); // This state is no longer needed
            // setShowSuccess(false); // This state is no longer needed
            return;
          } else {
            sessionStorage.removeItem(VERIFICATION_SESSION_KEY);
            localStorage.removeItem('walletAddress');
            localStorage.removeItem('connectedWallet');
          }
        } catch (error) {
          sessionStorage.removeItem(VERIFICATION_SESSION_KEY);
          localStorage.removeItem('walletAddress');
          localStorage.removeItem('connectedWallet');
        }
      }
      // If no valid session, clear any stale wallet data
      const storedWallet = localStorage.getItem('walletAddress');
      if (storedWallet && !sessionStorage.getItem(VERIFICATION_SESSION_KEY)) {
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('connectedWallet');
      }
    }
  }, []);

  // Wallet connect logic
  const connectWallet = async (providerName: WalletProvider) => {
    setError(null);
    let provider;
    if (providerName === 'phantom') {
      if (window.solana?.isPhantom) {
        provider = window.solana;
      } else {
        setError("Phantom wallet is not installed.");
        return;
      }
    }
    if (!provider) {
      setError("Could not find a compatible Solana wallet.");
      return;
    }
    try {
      if (provider.isConnecting) return;
      const response = await provider.connect();
      setWalletAddress(response.publicKey.toString());
      // Trigger verification with success message
      await checkWifHoodieOwnership(response.publicKey.toString(), true);
    } catch (error: any) {
      setError(`Wallet connection failed: ${error.message || 'User rejected the request.'}`);
    } finally {
      // setShowWalletSelector(false); // This state is no longer needed
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setIsHolder(false);
    setError(null);
    // setShowSuccess(false); // This state is no longer needed
    // setHasBeenConnected(false); // This state is no longer needed
    
    // Clear all wallet-related storage
    sessionStorage.removeItem(VERIFICATION_SESSION_KEY);
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('connectedWallet');
    
    // Disconnect from wallet providers
    if (window.solana?.disconnect) {
      window.solana.disconnect();
    }
  };

  // When walletAddress changes, verify ownership (but only show success if not from session)
  useEffect(() => {
    if (walletAddress) {
      const isFreshVerification = !sessionStorage.getItem(VERIFICATION_SESSION_KEY);
      checkWifHoodieOwnership(walletAddress, isFreshVerification);
    }
  }, [walletAddress]);

  // Check if user is an admin
  // useEffect(() => {
  //   const checkAdminStatus = async () => {
  //     if (walletAddress) {
  //       const user = await fetchUserByWallet(walletAddress);
  //       setIsAdmin(user?.is_admin || false);
  //     }
  //   };
  //   checkAdminStatus();
  // }, [walletAddress]);

  const connectPhantom = async () => {
    if (!isPhantomInstalled) {
      setError("Phantom wallet is not installed. Please install it from https://phantom.app/")
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const response = await window.solana.connect()
      const address = response.publicKey.toString()

      console.log("✅ Connected wallet:", address)

      // Save address and update UI
      localStorage.setItem('walletAddress', address)
      setWalletAddress(address)
      setIsConnected(true)

      // Trigger NFT verification
      await checkWifHoodieOwnership(address, true);
    } catch (error: any) {
      console.error("Wallet connection failed:", error)
      setError(`Connection failed: ${error.message || 'User rejected the request.'}`)
    } finally {
      setIsConnecting(false)
    }
  }

  // Remove the verifyNFT function and any fetches to /api/nft-verification in this file.

  if (walletAddress && loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-900 text-center">
        <p className="text-gray-300">Verifying your WifHoodie NFT...</p>
        {error && <p className="text-red-400 mt-4">{error}</p>}
      </div>
    );
  }

  if (walletAddress && !loading && isHolder) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        {children}
      </motion.div>
    );
  }

  if (walletAddress && !loading && !isHolder) {
      return (
        <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-900">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center p-8 bg-gray-800 rounded-xl shadow-lg"
            >
              <h2 className="text-2xl font-bold text-white mb-4">WifHoodie NFT Required</h2>
              <p className="text-gray-300 mb-6">
                No WifHoodie NFT found in wallet: <br/> <span className="font-mono text-xs text-amber-300">{walletAddress}</span>
              </p>
              {error && <p className="text-red-400 mb-4">{error}</p>}
              <Button
                asChild
                className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-400 hover:to-purple-400 px-8 py-3"
              >
                <a href="https://magiceden.us/marketplace/wifhoodies" target="_blank" rel="noopener noreferrer">
                  Get WifHoodie NFT
                </a>
              </Button>
               <Button variant="link" onClick={disconnectWallet} className="text-gray-400 mt-2">
                Try a different wallet
              </Button>
            </motion.div>
        </div>
      )
  }

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-900">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-8 bg-gray-800 rounded-xl shadow-lg"
      >
        <h2 className="text-2xl font-bold text-white mb-4">
          {/* {hasBeenConnected ? 'Welcome Back!' : 'Course Access Required'} */}
          Course Access Required
        </h2>
        <p className="text-gray-300 mb-6">
          {/* {hasBeenConnected 
            ? 'Please reconnect your wallet to continue your learning journey.'
            : 'Connect your wallet to verify your WifHoodie NFT and access this course.'
          } */}
          Connect your wallet to verify your WifHoodie NFT and access this course.
        </p>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        
        {/* {!showWalletSelector ? ( // This state is no longer needed
          <div className="flex justify-center">
            <Button
              onClick={() => setShowWalletSelector(true)}
              className="bg-gradient-to-r from-green-600 to-purple-600 text-white hover:from-green-500 hover:to-purple-500 px-8 py-3 w-64"
            >
              <Wallet className="mr-2" size={20} />
              Connect Wallet
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
             <Button
                onClick={() => connectWallet('phantom')}
                className="bg-purple-600 hover:bg-purple-700 text-white w-64"
             >
                Connect Phantom
             </Button>
             <Button variant="ghost" onClick={() => setShowWalletSelector(false)} className="text-gray-400">
                Cancel
             </Button>
          </div>
        )} */}
        <div className="flex justify-center">
            <Button
              onClick={() => setLoading(true)}
              className="bg-gradient-to-r from-green-600 to-purple-600 text-white hover:from-green-500 hover:to-purple-500 px-8 py-3 w-64"
            >
              <Wallet className="mr-2" size={20} />
              Connect Wallet
            </Button>
          </div>
        {loading && (
          <div className="flex flex-col items-center space-y-3 mt-4">
             <Button
                onClick={() => connectWallet('phantom')}
                className="bg-purple-600 hover:bg-purple-700 text-white w-64"
             >
                Connect Phantom
             </Button>
             <Button variant="ghost" onClick={() => setLoading(false)} className="text-gray-400">
                Cancel
             </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};