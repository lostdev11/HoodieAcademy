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
    // Debug: Check if Helius API key is loaded
    console.log("🔑 Debug: Helius API key loaded:", HELIUS_API_KEY ? "YES" : "NO");
    if (!HELIUS_API_KEY) {
      console.error("❌ Debug: Helius API key is missing from environment variables!");
    }
    
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
    if (!walletAddress) {
      console.log("🔍 Debug: No wallet address provided, skipping verification");
      return;
    }
    
    // Check if Helius API key is defined
    if (!HELIUS_API_KEY) {
      console.error("❌ Debug: Helius API key is missing!");
      setError("Configuration error: Helius API key is not defined.");
      setLoading(false);
      return;
    }
    
    console.log("🔑 Debug: Helius API key is defined:", HELIUS_API_KEY ? "YES" : "NO");
    console.log("👛 Debug: Checking wallet:", walletAddress);
    
    setLoading(true);
    setError(null);
    
    try {
      const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
      console.log("🌐 Debug: Making API request to Helius...");
      
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

      // Check for HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Debug: HTTP error from Helius API:", response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("📦 Debug: Raw API response:", data);
      
      // Check for API errors
      if (data.error) {
        console.error("❌ Debug: Helius API returned error:", data.error);
        throw new Error(`API Error: ${data.error.message || 'Unknown API error'}`);
      }

      const { result } = data;
      
      if (!result || !result.items) {
          console.error("❌ Debug: Helius API did not return items:", result);
          throw new Error("Failed to fetch assets from wallet. The API response was malformed.");
      }

      console.log("🎯 Debug: Total assets returned by Helius:", result.items.length);
      console.log("📋 Debug: Raw assets data:", result.items);

      // Filter for WifHoodie collection NFTs
      const wifHoodieNfts = result.items.filter((nft: any) => {
        if (!nft.grouping || !Array.isArray(nft.grouping)) {
          console.log("⚠️ Debug: NFT has no grouping data:", nft.id);
          return false;
        }
        
        const isWifHoodie = nft.grouping.some((group: any) => {
          const isCollection = group.group_key === "collection";
          const isCorrectCollection = group.group_value === WIFHOODIE_COLLECTION_ID;
          
          if (isCollection) {
            console.log(`🔍 Debug: Found NFT collection: ${group.group_value}. Is WifHoodie? ${isCorrectCollection}`);
          }
          
          return isCollection && isCorrectCollection;
        });
        
        if (isWifHoodie) {
          console.log("✅ Debug: Found WifHoodie NFT:", nft.id);
        }
        
        return isWifHoodie;
      });

      console.log("🎉 Debug: WifHoodie NFTs found:", wifHoodieNfts.length);
      console.log("📊 Debug: Filtered WifHoodie NFTs:", wifHoodieNfts);

      const hasWifHoodie = wifHoodieNfts.length > 0;
      console.log("🎯 Debug: Final result - Does wallet hold WifHoodie NFT?", hasWifHoodie);

      setIsHolder(hasWifHoodie);
      
      if (hasWifHoodie) {
        console.log("✅ Debug: Verification successful - storing session data");
        
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
          console.log("🎉 Debug: Showing success message for fresh verification");
          
          // Check if user needs to complete onboarding
          const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
          const hasDisplayName = localStorage.getItem('userDisplayName');
          
          if (!hasCompletedOnboarding || !hasDisplayName) {
            console.log("🆕 Debug: New user detected - redirecting to onboarding");
            // Redirect to onboarding for new users
            setTimeout(() => {
              window.location.href = '/onboarding';
            }, 2000);
          } else {
            console.log("👤 Debug: Existing user - showing success message");
            // Existing user - show success message
            setShowSuccess(true);
            // Hide success message after 2 seconds
            setTimeout(() => setShowSuccess(false), 2000);
          }
        } else {
          console.log("🔄 Debug: Skipping success message for existing session");
        }
      } else {
        console.log("❌ Debug: No WifHoodie NFTs found - verification failed");
      }
    } catch (error: any) {
      console.error("💥 Debug: NFT check failed with error:", error);
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