"use client";
// NFT verification enabled with proper API configuration
import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logUserActivity, logWalletConnection, logNftVerification } from '@/lib/activity-logger';

// Constants
const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const WIFHOODIE_COLLECTION_ID = 'H3mnaqNFFNwqRfEiWFsRTgprCvG4tYFfmNezGEVnaMuQ';

interface TokenGateProps {
  children: React.ReactNode;
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
  const [hasBeenConnected, setHasBeenConnected] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const isPhantomInstalled = typeof window !== 'undefined' && window.solana?.isPhantom;

  // Add the helper function inside the component so it can access state setters
  const checkWifHoodieOwnership = async (wallet: string, showSuccessMessage: boolean = true) => {
    if (!wallet) {
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
    console.log("👛 Debug: Checking wallet:", wallet);
    
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
            ownerAddress: wallet,
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
        
        // Log successful verification
        await logNftVerification(wallet, {
          success: true,
          nft_count: result.items.length,
          wifhoodie_count: wifHoodieNfts.length
        });
        
        // Store verification session
        const sessionData = {
          walletAddress: wallet,
          isHolder: true,
          timestamp: Date.now()
        };
        sessionStorage.setItem(VERIFICATION_SESSION_KEY, JSON.stringify(sessionData));
        
        // Store wallet address in localStorage for profile access
        localStorage.setItem('walletAddress', wallet);
        localStorage.setItem('connectedWallet', wallet);
        
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
        
        // Log failed verification
        await logNftVerification(wallet, {
          success: false,
          nft_count: result.items.length,
          wifhoodie_count: 0
        });
      }
    } catch (error: any) {
      console.error("💥 Debug: NFT check failed with error:", error);
      setError(`NFT verification failed: ${error.message}`);
    }
    setLoading(false);
  };

  // Restore session on component mount
  useEffect(() => {
    const savedWalletAddress = localStorage.getItem('walletAddress');
    const sessionData = sessionStorage.getItem(VERIFICATION_SESSION_KEY);
    
    if (savedWalletAddress && sessionData) {
      try {
        const session = JSON.parse(sessionData);
        const now = Date.now();
        const sessionAge = now - session.timestamp;
        const sessionValid = sessionAge < 24 * 60 * 60 * 1000; // 24 hours
        
        if (sessionValid && session.walletAddress === savedWalletAddress) {
          console.log("🔄 Debug: Restoring session for wallet:", savedWalletAddress);
          setWalletAddress(savedWalletAddress);
          setIsHolder(true);
          setIsAuthenticated(true);
          setHasBeenConnected(true);
        } else {
          console.log("⏰ Debug: Session expired or invalid, clearing storage");
          sessionStorage.removeItem(VERIFICATION_SESSION_KEY);
          localStorage.removeItem('walletAddress');
          localStorage.removeItem('connectedWallet');
        }
      } catch (error) {
        console.error("❌ Debug: Error parsing session data:", error);
        sessionStorage.removeItem(VERIFICATION_SESSION_KEY);
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('connectedWallet');
      }
    }
  }, []);

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

  const disconnectWallet = async () => {
    console.log("🔌 Debug: Disconnecting wallet:", walletAddress);
    
    // Log wallet disconnection
    if (walletAddress) {
      logWalletConnection(walletAddress, 'wallet_disconnect', { provider: 'phantom' });
    }
    
    setWalletAddress(null);
    setIsHolder(false);
    setIsAuthenticated(false);
    setHasBeenConnected(false);
    setShowSuccess(false);
    setError(null);
    
    // Clear session and local storage
    sessionStorage.removeItem(VERIFICATION_SESSION_KEY);
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('connectedWallet');
    
    // Disconnect from wallet providers safely
    const sol = typeof window !== 'undefined' ? window.solana : undefined;

    try {
      if (sol?.disconnect) {
        await sol.disconnect();
      }
    } catch (e) {
      console.error("disconnect error", e);
    }
  };

  const connectWallet = async (providerName: WalletProvider) => {
    setError(null);
    
    // Guard against multiple simultaneous connections
    if (isConnecting) {
      console.log("⏳ Debug: Wallet is already connecting, skipping...");
      return;
    }
    
    setIsConnecting(true);
    
    console.log("🔌 Debug: Starting wallet connection for provider:", providerName);
    
    let provider;
    if (providerName === 'phantom') {
      if (window.solana?.isPhantom) {
        provider = window.solana;
        console.log("✅ Debug: Phantom wallet found and available");
      } else {
        const errorMsg = "Phantom wallet is not installed. Please install Phantom wallet extension first.";
        console.error("❌ Debug:", errorMsg);
        setError(errorMsg);
        setIsConnecting(false);
        return;
      }
    }
    
    if (!provider) {
      const errorMsg = "Could not find a compatible Solana wallet.";
      console.error("❌ Debug:", errorMsg);
      setError(errorMsg);
      setIsConnecting(false);
      return;
    }
    
    try {
      console.log("🔗 Debug: Attempting to connect to wallet...");
      
      // Connect only if not already connected
      if (!provider.publicKey) {
        try {
          await provider.connect({ onlyIfTrusted: true } as any);
        } catch {
          await provider.connect();
        }
      }
      
      const walletAddress = provider.publicKey!.toString();
      console.log("✅ Debug: Wallet connected successfully:", walletAddress);
      
      // Log wallet connection
      await logWalletConnection(walletAddress, 'wallet_connect', { provider: providerName });
      
      setWalletAddress(walletAddress);
      // Trigger verification with success message
      await checkWifHoodieOwnership(walletAddress, true);
    } catch (error: any) {
      const errorMsg = `Wallet connection failed: ${error.message || 'User rejected the request.'}`;
      console.error("💥 Debug: Wallet connection error:", error);
      setError(errorMsg);
    } finally {
      setIsConnecting(false);
    }
  };

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
    <div 
      className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-900 relative overflow-hidden"
      style={{
        backgroundImage: 'url("/images/academy-castle-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/50"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden text-center p-8 bg-white/5 backdrop-blur-lg backdrop-saturate-150 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/10 z-10"
      >
        {/* liquid glass highlights */}
        <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-white/25 via-white/5 to-transparent opacity-40" />
        <div className="pointer-events-none absolute -top-24 -left-24 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.3),rgba(255,255,255,0)_60%)]" />
        <div className="pointer-events-none absolute -bottom-28 -right-28 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,150,80,0.2),rgba(255,150,80,0)_60%)]" />
        <h2 className="text-2xl font-bold text-white mb-4">
          Course Access Required
        </h2>
        <p className="text-gray-300 mb-6">
          Connect your wallet to verify your WifHoodie NFT and access this course.
        </p>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        
        <div className="flex justify-center">
          <Button
            onClick={() => connectWallet('phantom')}
            disabled={isConnecting}
            className="group relative overflow-hidden px-8 py-3 w-64 font-semibold text-white rounded-xl shadow-lg ring-1 ring-white/20 bg-gradient-to-r from-amber-500 via-rose-500 to-violet-600 hover:from-amber-400 hover:via-rose-400 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="pointer-events-none absolute -inset-1 bg-gradient-to-r from-white/30 to-transparent opacity-70 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Wallet className="mr-2 relative z-10" size={20} />
            <span className="relative z-10">
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </span>
          </Button>
        </div>
        
        {/* Show error if connection failed */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
            {error.includes('Phantom wallet is not installed') && (
              <div className="mt-2">
                <a 
                  href="https://phantom.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm underline"
                >
                  Install Phantom Wallet →
                </a>
              </div>
            )}
          </div>
        )}
        
        {/* Alternative connection options */}
        <div className="mt-4 text-center">
          <p className="text-gray-400 text-sm mb-2">Don't have Phantom wallet?</p>
          <div className="flex justify-center gap-2">
            <a 
              href="https://phantom.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              Install Phantom
            </a>
            <span className="text-gray-500">•</span>
            <a 
              href="https://magiceden.us/marketplace/wifhoodies" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 text-sm underline"
            >
              Get WifHoodie NFT
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};