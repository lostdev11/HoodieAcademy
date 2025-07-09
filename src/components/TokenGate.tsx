"use client";
import React from 'react';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Wallet } from 'lucide-react';

interface TokenGateProps {
  children: React.ReactNode;
}

declare global {
  interface Window {
    solana?: any;
  }
}

type WalletProvider = 'phantom';

const TokenGate: React.FC<TokenGateProps> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isHolder, setIsHolder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasBeenConnected, setHasBeenConnected] = useState(false);

  const WIFHOODIE_COLLECTION_ID = "H3mnaqNFFNwqRfEiWFsRTgprCvG4tYFfmNezGEVnaMuQ";
  const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
  const VERIFICATION_SESSION_KEY = 'wifhoodie_verification_session';

  // Check for existing verification session on component mount
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
            setHasBeenConnected(true);
            setShowSuccess(false); // Ensure success message is not shown for existing sessions
            console.log('Using existing verification session');
            return; // Exit early if we have a valid session
          } else {
            // Clear expired session
            sessionStorage.removeItem(VERIFICATION_SESSION_KEY);
            localStorage.removeItem('walletAddress');
            localStorage.removeItem('connectedWallet');
          }
        } catch (error) {
          console.error('Failed to parse verification session:', error);
          sessionStorage.removeItem(VERIFICATION_SESSION_KEY);
          localStorage.removeItem('walletAddress');
          localStorage.removeItem('connectedWallet');
        }
      }
      
      // If no valid session, check if there's a wallet address in localStorage
      // but no session (indicating a disconnect scenario)
      const storedWallet = localStorage.getItem('walletAddress');
      if (storedWallet && !sessionStorage.getItem(VERIFICATION_SESSION_KEY)) {
        // Clear any stale wallet data
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('connectedWallet');
      }
    }
  }, []);

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
    } catch (error: any) {
      console.error("Wallet connection failed:", error);
      setError(`Wallet connection failed: ${error.message || 'User rejected the request.'}`);
    } finally {
      setShowWalletSelector(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setIsHolder(false);
    setError(null);
    setShowSuccess(false);
    setHasBeenConnected(false);
    
    // Clear all wallet-related storage
    sessionStorage.removeItem(VERIFICATION_SESSION_KEY);
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('connectedWallet');
    
    // Disconnect from wallet providers
    if (window.solana?.disconnect) {
      window.solana.disconnect();
    }
  };

  const checkWifHoodieOwnership = async (showSuccessMessage: boolean = true) => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);
    try {
      const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'my-id',
          method: 'getAssetsByOwner',
          params: {
            ownerAddress: walletAddress,
            page: 1,
            limit: 1000,
          },
        }),
      });

      const { result } = await response.json();
      
      if (!result || !result.items) {
          console.error("Helius API did not return items:", result);
          throw new Error("Failed to fetch assets from wallet. The API response was malformed.");
      }

      console.log("Assets returned by Helius:", result.items);

      const hasWifHoodie = result.items.some(
        (nft: any) => {
          if (!nft.grouping || !Array.isArray(nft.grouping)) {
            return false;
          }
          
          return nft.grouping.some((group: any) => {
            const isCollection = group.group_key === "collection";
            const isCorrectCollection = group.group_value === WIFHOODIE_COLLECTION_ID;
            if (isCollection) {
              console.log(`Found NFT from a collection: ${group.group_value}. Is it the WifHoodie collection? ${isCorrectCollection}`);
            }
            return isCollection && isCorrectCollection;
          });
        }
      );

      console.log("Does the wallet hold a WifHoodie NFT?", hasWifHoodie);

      setIsHolder(hasWifHoodie);
      if (hasWifHoodie) {
        // Store verification session
        const sessionData = {
          walletAddress,
          isHolder: true,
          timestamp: Date.now()
        };
        sessionStorage.setItem(VERIFICATION_SESSION_KEY, JSON.stringify(sessionData));
        
        // Store wallet address in localStorage for profile access
        localStorage.setItem('walletAddress', walletAddress);
        localStorage.setItem('connectedWallet', walletAddress);
        
        setHasBeenConnected(true);
        // Only show success message for fresh verifications
        if (showSuccessMessage) {
          // Check if user needs to complete onboarding
          const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
          const hasDisplayName = localStorage.getItem('userDisplayName');
          
          if (!hasCompletedOnboarding || !hasDisplayName) {
            // Redirect to onboarding for new users
            setTimeout(() => {
              window.location.href = '/onboarding';
            }, 2000);
          } else {
            // Existing user - show success message
            setShowSuccess(true);
            // Hide success message after 2 seconds
            setTimeout(() => setShowSuccess(false), 2000);
          }
        }
      }
    } catch (error: any) {
      console.error("NFT check failed:", error);
      setError(`NFT verification failed: ${error.message}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (walletAddress) {
      // Only show success message if this is a fresh verification (not from existing session)
      const isFreshVerification = !sessionStorage.getItem(VERIFICATION_SESSION_KEY);
      checkWifHoodieOwnership(isFreshVerification);
    }
  }, [walletAddress]);

  if (walletAddress && loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-900 text-center">
        <p className="text-gray-300">Verifying your WifHoodie NFT...</p>
        {error && <p className="text-red-400 mt-4">{error}</p>}
      </div>
    );
  }

  if (walletAddress && !loading && isHolder && showSuccess) {
    // Check if this is a new user
    const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
    const hasDisplayName = localStorage.getItem('userDisplayName');
    const isNewUser = !hasCompletedOnboarding || !hasDisplayName;
    
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center p-8 bg-gray-800 rounded-xl shadow-lg"
        >
          <h2 className="text-2xl font-bold text-green-400 mb-4">✅ Verification Successful!</h2>
          <p className="text-gray-300 mb-4">
            WifHoodie NFT verified in wallet: <br/>
            <span className="font-mono text-xs text-amber-300">{walletAddress}</span>
          </p>
          {isNewUser ? (
            <p className="text-cyan-300">Redirecting to complete your profile setup...</p>
          ) : (
            <p className="text-green-300">Access granted to Hoodie Academy courses!</p>
          )}
        </motion.div>
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
          {hasBeenConnected ? 'Welcome Back!' : 'Course Access Required'}
        </h2>
        <p className="text-gray-300 mb-6">
          {hasBeenConnected 
            ? 'Please reconnect your wallet to continue your learning journey.'
            : 'Connect your wallet to verify your WifHoodie NFT and access this course.'
          }
        </p>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        
        {!showWalletSelector ? (
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
        )}
      </motion.div>
    </div>
  );
};

export default TokenGate;