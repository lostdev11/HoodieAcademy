"use client";
// NFT verification enabled with proper API configuration
import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Wallet, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logUserActivity, logWalletConnection, logNftVerification } from '@/lib/activity-logger';
import { hasSolflare, getSolflareProvider } from '@/lib/walletChecks';
import { useDevice } from '@/hooks/use-device';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import WelcomeTutorial from '@/components/onboarding/WelcomeTutorial';

// Constants
const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const WIFHOODIE_COLLECTION_ID = 'H3mnaqNFFNwqRfEiWFsRTgprCvG4tYFfmNezGEVnaMuQ';

interface TokenGateProps {
  children: React.ReactNode;
}

type WalletProvider = 'phantom' | 'solflare';

const VERIFICATION_SESSION_KEY = 'wifhoodie_verification';

export default function TokenGate({ children }: TokenGateProps) {
  const router = useRouter()
  const { isMobile, isPhantomInApp } = useDevice();
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
  const [isPhantomInstalled, setIsPhantomInstalled] = useState(false);
  const [showWelcomeTutorial, setShowWelcomeTutorial] = useState(false);

  // Check for Phantom wallet availability with retries
  useEffect(() => {
    const checkPhantomAvailability = async () => {
      let retries = 0;
      const maxRetries = 5;
      
      while (retries < maxRetries) {
        if (typeof window !== 'undefined' && window.solana?.isPhantom) {
          setIsPhantomInstalled(true);
          return;
        }
        
        retries++;
        
        if (retries < maxRetries) {
          // Wait 1 second before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Check if any Solana wallet is available as fallback
      if (typeof window !== 'undefined' && window.solana && !window.solana.isPhantom) {
        setIsPhantomInstalled(true); // Allow connection attempt
      } else {
        setIsPhantomInstalled(false);
      }
    };

    checkPhantomAvailability();
  }, []);

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
  }, []);

  // NFT verification function
  const verifyNftOwnership = async (wallet: string, showSuccessMessage = false) => {
    if (!wallet) {
      return;
    }

    if (!HELIUS_API_KEY) {
      setError("Configuration error: Helius API key is not defined.");
      return;
    }
    
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
            ownerAddress: wallet,
            page: 1,
            limit: 1000
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`API Error: ${data.error.message || 'Unknown API error'}`);
      }

      const result = data.result;

      if (!result || !result.items) {
          throw new Error("Failed to fetch assets from wallet. The API response was malformed.");
      }

      const wifHoodieNfts = result.items.filter((nft: any) => {
        if (!nft.grouping || !Array.isArray(nft.grouping)) {
          return false;
        }

        const isWifHoodie = nft.grouping.some((group: any) => {
          const isCollection = group.group_key === 'collection';
          const isCorrectCollection = group.group_value === WIFHOODIE_COLLECTION_ID;
          
          return isCollection && isCorrectCollection;
        });

        return isWifHoodie;
      });

      const hasWifHoodie = wifHoodieNfts.length > 0;

      if (hasWifHoodie) {
        // Store verification session
        const sessionData = {
          walletAddress: wallet,
          verified: true,
          timestamp: Date.now(),
          expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
        
        sessionStorage.setItem(VERIFICATION_SESSION_KEY, JSON.stringify(sessionData));
        localStorage.setItem('hoodie_academy_wallet', wallet);
        localStorage.setItem('connectedWallet', wallet);
        
        setIsHolder(true);
        setIsAuthenticated(true);
        setWalletAddress(wallet);
        setError(null);
        
        if (showSuccessMessage) {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }
      } else {
        setError("You need to own a WifHoodie NFT to access Hoodie Academy. Please acquire one and try again.");
        setIsHolder(false);
        setIsAuthenticated(false);
      }
    } catch (error: any) {
      setError(`NFT verification failed: ${error.message}`);
      setIsHolder(false);
      setIsAuthenticated(false);
    }
  };

  // Session restoration
  useEffect(() => {
    if (!isClient) return;

    const restoreSession = () => {
      try {
        const sessionData = sessionStorage.getItem(VERIFICATION_SESSION_KEY);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          const sessionValid = session.expiresAt > Date.now();
          
          if (sessionValid) {
            setWalletAddress(session.walletAddress);
            setIsHolder(true);
            setIsAuthenticated(true);
          } else {
            sessionStorage.removeItem(VERIFICATION_SESSION_KEY);
          }
        }
      } catch (error) {
        sessionStorage.removeItem(VERIFICATION_SESSION_KEY);
      }

      // Try to restore from localStorage if sessionStorage is empty
      const storedWallet = localStorage.getItem('hoodie_academy_wallet');
      if (storedWallet && !walletAddress) {
        setWalletAddress(storedWallet);
      }
    };

    // Initial session restoration
    restoreSession();

    // Set up periodic session restoration
    const sessionInterval = setInterval(() => {
      if (!isAuthenticated && !walletAddress) {
        restoreSession();
      }
    }, 5000);

    return () => clearInterval(sessionInterval);
  }, [isClient, isAuthenticated, walletAddress]);

  const disconnectWallet = async () => {
    // Clear all wallet-related storage
    localStorage.removeItem('hoodie_academy_wallet');
    localStorage.removeItem('connectedWallet');
    localStorage.removeItem('walletAddress');
    sessionStorage.removeItem(VERIFICATION_SESSION_KEY);
    
    // Reset state
    setWalletAddress(null);
    setIsHolder(false);
    setIsAuthenticated(false);
    setIsConnected(false);
    setError(null);
    setShowSuccess(false);
    
    // Log disconnection to API
    if (walletAddress) {
      fetch('/api/wallet/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletAddress })
      })
        .then(res => res.json())
        .then(data => {
          // Silent success
        })
        .catch(err => {
          // Silent failure
        });
    }
    
    try {
      if (typeof window !== 'undefined' && window.solana?.disconnect) {
        await window.solana.disconnect();
      }
    } catch (e) {
      // Silent error handling
    }
  };

  const connectWallet = async (providerName: WalletProvider) => {
    setError(null);
    
    // Guard against multiple simultaneous connections
    if (isConnecting) {
      return;
    }

    setIsConnecting(true);

    // Handle mobile redirect
    if (isMobile && !isPhantomInApp) {
      const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
      const phantomUrl = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}`;
      window.location.href = phantomUrl;
      setIsConnecting(false);
      return;
    }
    
    let provider: any = null;
    let retries = 0;
    const maxRetries = 3;

    // Try to get Phantom wallet
    if (providerName === 'phantom') {
      while (retries < maxRetries && !provider) {
        if (typeof window !== 'undefined' && window.solana?.isPhantom) {
          provider = window.solana;
          break;
        }
        
        retries++;
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (!provider) {
        // Fallback to any Solana wallet
        if (typeof window !== 'undefined' && window.solana) {
          provider = window.solana;
        } else {
          const errorMsg = isMobile 
            ? "Please open this page in the Phantom app browser" 
            : "No Solana wallet detected. Please install Phantom wallet extension first.";
          setError(errorMsg);
          setIsConnecting(false);
          return;
        }
      }
    } else if (providerName === 'solflare') {
      if (hasSolflare()) {
        provider = getSolflareProvider();
      } else {
        const errorMsg = isMobile 
          ? "Please open this page in the Solflare app browser" 
          : "Solflare wallet is not installed. Please install Solflare wallet extension first.";
        setError(errorMsg);
        setIsConnecting(false);
        return;
      }
    }
    
    if (!provider) {
      const errorMsg = "Could not find a compatible Solana wallet.";
      setError(errorMsg);
      setIsConnecting(false);
      return;
    }
    
    try {
      // Connect only if not already connected
      if (!provider.publicKey) {
        try {
          await provider.connect({ onlyIfTrusted: true } as any);
        } catch {
          await provider.connect();
        }
      }
      
      const walletAddress = provider.publicKey!.toString();
      
      // Log wallet connection
      await logWalletConnection(walletAddress, 'wallet_connect', { provider: providerName });
      
      // Sync wallet across all storage systems immediately
      localStorage.setItem('hoodie_academy_wallet', walletAddress);
      localStorage.setItem('walletAddress', walletAddress);
      localStorage.setItem('connectedWallet', walletAddress);
      
      // Log to API (hybrid approach - fire and don't wait)
      fetch('/api/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          wallet: walletAddress,
          provider: providerName
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.banned) {
            // Wallet is banned
            disconnectWallet();
          }
        })
        .catch(err => {
          // Silent error handling
        });
      
      setWalletAddress(walletAddress);
      
      // Check if this is first time connecting (for tutorial)
      const hasSeenOnboarding = localStorage.getItem('hoodie_academy_onboarding_seen');
      if (!hasSeenOnboarding) {
        setShowWelcomeTutorial(true);
      }
      
      // Start NFT verification
      setIsVerifying(true);
      await verifyNftOwnership(walletAddress, true);
      setIsVerifying(false);
      
    } catch (error: any) {
      const errorMsg = `Wallet connection failed: ${error.message || 'User rejected the request.'}`;
      setError(errorMsg);
    } finally {
      setIsConnecting(false);
    }
  };

  // Auto-connect on page load if wallet is already connected
  useEffect(() => {
    if (!isClient || isAuthenticated) return;

    const autoConnect = async () => {
      if (typeof window !== 'undefined' && window.solana?.publicKey) {
        const walletAddress = window.solana.publicKey.toString();
        setWalletAddress(walletAddress);
        await verifyNftOwnership(walletAddress);
      }
    };

    autoConnect();
  }, [isClient, isAuthenticated]);

  // Redirect to dashboard when authenticated
  useEffect(() => {
    if (isAuthenticated && isHolder && walletAddress) {
      setIsRedirecting(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    }
  }, [isAuthenticated, isHolder, walletAddress, router]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && isHolder) {
    return (
      <>
        {children}
        {showWelcomeTutorial && (
          <WelcomeTutorial 
            onClose={() => {
              setShowWelcomeTutorial(false);
              localStorage.setItem('hoodie_academy_onboarding_seen', 'true');
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-600/30 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Hoodie Academy</h1>
            <p className="text-slate-300">Connect your wallet to access the academy</p>
          </div>

          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6"
            >
              <p className="text-green-300 text-center">✅ Wallet verified! Redirecting...</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6"
            >
              <p className="text-red-300 text-center">{error}</p>
            </motion.div>
          )}

          <div className="space-y-4">
            {!isPhantomInstalled ? (
              <div className="text-center">
                <p className="text-slate-300 mb-4">Please install a Solana wallet to continue</p>
                <Button
                  onClick={() => window.open('https://phantom.app/', '_blank')}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Install Phantom Wallet
                </Button>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    disabled={isConnecting || isVerifying}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3"
                  >
                    <Wallet className="w-5 h-5 mr-2" />
                    {isConnecting ? 'Connecting...' : isVerifying ? 'Verifying NFT...' : 'Connect Wallet'}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full bg-slate-700 border-slate-600">
                  <DropdownMenuItem
                    onClick={() => connectWallet('phantom')}
                    className="text-white hover:bg-slate-600"
                  >
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-purple-500 rounded mr-3"></div>
                      Phantom Wallet
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => connectWallet('solflare')}
                    className="text-white hover:bg-slate-600"
                  >
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-orange-500 rounded mr-3"></div>
                      Solflare Wallet
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="mt-6 text-center text-sm text-slate-400">
            <p>You need to own a WifHoodie NFT to access the academy</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
