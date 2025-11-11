"use client";
// NFT verification enabled with proper API configuration
import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Wallet, ChevronDown, BookOpen, Twitter, Newspaper } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

type SolanaProvider = NonNullable<Window['solana']>;

const getPhantomProvider = (): SolanaProvider | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const provider = window.phantom?.solana ?? window.solana ?? null;

  if (provider?.isPhantom && !window.solana) {
    (window as any).solana = provider;
  }

  return provider;
};

interface Founder {
  name: string;
  xHandle: string;
  pfp: string;
  role?: string;
  shape?: 'circle' | 'square';
}

// Founder Card Component with error handling
function FounderCard({ founder }: { founder: Founder }) {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(founder.pfp);
  const [shouldUnoptimize, setShouldUnoptimize] = useState(() =>
    founder.pfp.toLowerCase().endsWith('.svg')
  );
  const isSquare = founder.shape === 'square';

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      setImageSrc(`https://ui-avatars.com/api/?name=${encodeURIComponent(founder.name)}&background=amber&color=000&size=64`);
      setShouldUnoptimize(false);
    }
  };

  return (
    <a
      href={`https://x.com/${founder.xHandle.replace('@', '')}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/30 transition-all duration-200 group backdrop-blur-sm"
    >
      <div
        className={`relative flex-shrink-0 overflow-hidden ring-2 ring-amber-500/20 group-hover:ring-amber-500/40 transition-all ${
          isSquare ? 'w-14 h-14 rounded-xl bg-white/10' : 'w-12 h-12 rounded-full'
        }`}
      >
        <Image
          src={imageSrc}
          alt={founder.name}
          fill
          className="object-cover"
          unoptimized={shouldUnoptimize}
          onError={handleImageError}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate group-hover:text-amber-300 transition-colors">
          {founder.name}
        </p>
        {founder.role && (
          <p className="text-xs text-gray-300 mt-0.5">{founder.role}</p>
        )}
        <div className="flex items-center gap-1.5 mt-1">
          <Twitter className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-400 transition-colors" />
          <p className="text-xs text-gray-400 truncate group-hover:text-amber-400/80 transition-colors">
            @{founder.xHandle.replace('@', '')}
          </p>
        </div>
      </div>
    </a>
  );
}

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

  // Check for Phantom wallet availability with retries and event fallback
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let cancelled = false;
    let listenerRegistered = false;

    const logProviderDetails = (provider: SolanaProvider) => ({
      keys: Object.keys(provider ?? {}),
      isPhantom: provider?.isPhantom ?? false,
      isConnected: provider?.isConnected ?? false
    });

    const markProviderFound = (provider: SolanaProvider | null) => {
      if (cancelled || !provider) {
        return false;
      }

      if (provider.isPhantom) {
        console.log('✅ Phantom wallet detected', logProviderDetails(provider));
      } else {
        console.log('⚠️ Solana wallet detected but not Phantom', logProviderDetails(provider));
      }

      setIsPhantomInstalled(true);
      return true;
    };

    const detectProvider = () => {
      const provider = getPhantomProvider();
      return markProviderFound(provider);
    };

    const onInitialized: EventListener = () => {
      console.log('🔔 Received solana#initialized event');
      if (detectProvider() && listenerRegistered) {
        window.removeEventListener('solana#initialized', onInitialized as EventListener);
        listenerRegistered = false;
      }
    };

    if (!detectProvider()) {
      window.addEventListener('solana#initialized', onInitialized);
      listenerRegistered = true;

      (async () => {
        let retries = 0;
        const maxRetries = 5;

        while (!cancelled && retries < maxRetries) {
          console.log(`⏳ Checking for Phantom wallet, attempt ${retries + 1}/${maxRetries}`);
          if (detectProvider()) {
            if (listenerRegistered) {
              window.removeEventListener('solana#initialized', onInitialized);
              listenerRegistered = false;
            }
            return;
          }
          retries++;

          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (!cancelled) {
          console.log('❌ Phantom wallet not found after all retries');
          const fallbackProvider = getPhantomProvider();
          if (!markProviderFound(fallbackProvider)) {
            setIsPhantomInstalled(false);
          }
        }
      })();
    }

    return () => {
      cancelled = true;
      if (listenerRegistered) {
        window.removeEventListener('solana#initialized', onInitialized);
      }
    };
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('TokenGate: Component mounted');
    console.log('TokenGate: HELIUS_API_KEY available:', !!HELIUS_API_KEY);
    console.log('TokenGate: WIFHOODIE_COLLECTION_ID:', WIFHOODIE_COLLECTION_ID);
    console.log('TokenGate: isPhantomInstalled:', isPhantomInstalled);
    console.log('TokenGate: Current state:', {
      isConnecting,
      isConnected,
      walletAddress,
      isHolder,
      error,
      isVerifying,
      isRedirecting,
      isAuthenticated,
      isClient,
      loading,
      hasBeenConnected,
      showSuccess
    });
  }, [isPhantomInstalled, isConnecting, isConnected, walletAddress, isHolder, error, isVerifying, isRedirecting, isAuthenticated, isClient, loading, hasBeenConnected, showSuccess]);

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
        
        // Sync with other wallet storage systems
        localStorage.setItem('hoodie_academy_wallet', wallet);
        localStorage.setItem('walletAddress', wallet);
        localStorage.setItem('connectedWallet', wallet);
        console.log('Wallet verified and synced to all storage systems:', wallet);
        
        setHasBeenConnected(true);
        
        // Only show success message for fresh verifications
        if (showSuccessMessage) {
          console.log("🎉 Debug: Showing success message for fresh verification");
          
          // Check if user needs to complete onboarding from database
          // TODO: Implement database check here
          console.log("🆕 Debug: Checking onboarding status from database...");
          
          // For now, always show success message
          setShowSuccess(true);
          // Hide success message after 2 seconds
          setTimeout(() => setShowSuccess(false), 2000);
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

  // Restore session on component mount - check all storage locations
  useEffect(() => {
    const sessionData = sessionStorage.getItem(VERIFICATION_SESSION_KEY);
    const storedWallet = localStorage.getItem('hoodie_academy_wallet') 
      || localStorage.getItem('walletAddress') 
      || localStorage.getItem('connectedWallet');
    
    // Add timeout to prevent infinite loading - only log warning if needed
    const timeoutId = setTimeout(() => {
      if (!isAuthenticated && !walletAddress) {
        console.warn('TokenGate: Session restoration timeout - no wallet found after 15 seconds');
        // Don't set error - this is normal if user hasn't connected wallet yet
      }
    }, 15000); // 15 second timeout
    
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        const now = Date.now();
        const sessionAge = now - session.timestamp;
        const sessionValid = sessionAge < 24 * 60 * 60 * 1000; // 24 hours
        
        if (sessionValid) {
          console.log("🔄 Debug: Restoring session for wallet:", session.walletAddress);
          setWalletAddress(session.walletAddress);
          setIsHolder(true);
          setIsAuthenticated(true);
          setHasBeenConnected(true);
          clearTimeout(timeoutId); // Clear timeout on successful restoration
        } else {
          console.log("⏰ Debug: Session expired, clearing storage");
          sessionStorage.removeItem(VERIFICATION_SESSION_KEY);
        }
      } catch (error) {
        console.error("❌ Debug: Error parsing session data:", error);
        sessionStorage.removeItem(VERIFICATION_SESSION_KEY);
      }
    } else if (storedWallet) {
      // Try to restore from localStorage if sessionStorage is empty
      console.log("🔄 Debug: Restoring wallet from localStorage:", storedWallet);
      setWalletAddress(storedWallet);
      clearTimeout(timeoutId); // Clear timeout when wallet is found
      // Will trigger verification via the walletAddress useEffect
    }
    
    return () => clearTimeout(timeoutId);
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
      
      // Log to API (hybrid approach)
      fetch('/api/wallet/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          wallet: walletAddress,
          reason: 'user_initiated'
        })
      })
        .then(res => res.json())
        .then(data => {
          console.log('📊 API disconnection logged from TokenGate:', data);
        })
        .catch(err => {
          console.warn('⚠️ API disconnection logging failed:', err);
        });
    }
    
    setWalletAddress(null);
    setIsHolder(false);
    setIsAuthenticated(false);
    setHasBeenConnected(false);
    setShowSuccess(false);
    setError(null);
    
    // Clear ALL wallet storage systems
    sessionStorage.removeItem(VERIFICATION_SESSION_KEY);
    localStorage.removeItem('hoodie_academy_wallet');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('connectedWallet');
    localStorage.removeItem('hoodie_academy_is_admin');
    
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
    
    // Handle mobile: redirect to Phantom if not already in Phantom's in-app browser
    if (providerName === 'phantom' && isMobile && !isPhantomInApp) {
      const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
      const phantomUrl = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}`;
      console.log('📱 Mobile detected, redirecting to Phantom app...');
      window.location.href = phantomUrl;
      return;
    }
    
    setIsConnecting(true);
    
    console.log("🔌 Debug: Starting wallet connection for provider:", providerName);
    
    let provider: SolanaProvider | null = null;
    if (providerName === 'phantom') {
      // Wait for Phantom to be available with retry mechanism
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        const phantomProvider = getPhantomProvider();
        if (phantomProvider?.isPhantom) {
          provider = phantomProvider;
          console.log("✅ Debug: Phantom wallet found and available");
          break;
        }
        
        console.log(`⏳ Debug: Phantom not found, retry ${retries + 1}/${maxRetries}`);
        retries++;
        
        if (retries < maxRetries) {
          // Wait 500ms before retry
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (!provider) {
        // Check if any Solana wallet is available as fallback
        const fallbackProvider = getPhantomProvider();
        if (fallbackProvider) {
          console.log("⚠️ Using fallback Solana wallet:", {
            keys: Object.keys(fallbackProvider ?? {}),
            isPhantom: fallbackProvider?.isPhantom ?? false
          });
          provider = fallbackProvider;
        } else {
          const errorMsg = isMobile 
            ? "Please open this page in the Phantom app browser"
            : "No Solana wallet detected. Please install Phantom wallet extension first.";
          console.error("❌ Debug:", errorMsg);
          setError(errorMsg);
          setIsConnecting(false);
          return;
        }
      }
    } else if (providerName === 'solflare') {
      const solflareProvider = getSolflareProvider();
      if (solflareProvider) {
        provider = solflareProvider;
        console.log("✅ Debug: Solflare wallet found and available");
      } else {
        const errorMsg = isMobile 
          ? "Solflare is not available on mobile. Please use Phantom instead."
          : "Solflare wallet is not installed. Please install Solflare wallet extension first.";
        console.warn("⚠️ Solflare not found");
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
          console.log('📊 API connection logged from TokenGate:', data);
          if (data.banned) {
            // Wallet is banned
            console.error('⛔ Wallet is banned!');
            disconnectWallet();
          }
        })
        .catch(err => {
          console.warn('⚠️ API connection logging failed:', err);
        });
      
      setWalletAddress(walletAddress);
      
      // Check if this is first time connecting (for tutorial)
      const hasSeenOnboarding = localStorage.getItem('hoodie_academy_onboarding_seen');
      if (!hasSeenOnboarding) {
        setShowWelcomeTutorial(true);
      }
      
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
        <p className="text-gray-300 mb-2">Verifying your WifHoodie NFT...</p>
        <p className="text-gray-400 text-sm mb-4">This may take a few moments</p>
        {error && <p className="text-red-400 mt-4">{error}</p>}
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          size="sm"
          className="mt-4 text-gray-400 hover:text-gray-300"
        >
          Refresh Page
        </Button>
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
        <div className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-900 p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center p-6 sm:p-8 bg-gray-800 rounded-xl shadow-lg w-full max-w-md mx-auto"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">WifHoodie NFT Required</h2>
              <p className="text-sm sm:text-base text-gray-300 mb-6">
                No WifHoodie NFT found in wallet: <br/> 
                <span className="font-mono text-xs sm:text-sm text-amber-300 break-all">
                  {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                </span>
              </p>
              {error && <p className="text-red-400 mb-4 text-xs sm:text-sm">{error}</p>}
              <Button
                asChild
                className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-400 hover:to-purple-400 px-6 sm:px-8 py-3 w-full sm:w-auto min-h-[48px] touch-manipulation text-sm sm:text-base"
              >
                <a href="https://magiceden.us/marketplace/wifhoodies" target="_blank" rel="noopener noreferrer">
                  Get WifHoodie NFT
                </a>
              </Button>
               <Button 
                 variant="link" 
                 onClick={disconnectWallet} 
                 className="text-gray-400 mt-2 w-full sm:w-auto min-h-[44px] touch-manipulation text-sm sm:text-base"
               >
                Try a different wallet
               </Button>
            </motion.div>
        </div>
      )
  }

  return (
    <div 
      className="flex flex-col items-center justify-center w-full min-h-screen bg-gray-900 relative overflow-hidden p-4 sm:p-6"
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
        className="relative overflow-hidden text-center p-4 sm:p-8 bg-white/5 backdrop-blur-lg backdrop-saturate-150 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/10 z-10 w-full max-w-md mx-auto"
      >
        {/* liquid glass highlights */}
        <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-white/25 via-white/5 to-transparent opacity-40" />
        <div className="pointer-events-none absolute -top-24 -left-24 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.3),rgba(255,255,255,0)_60%)]" />
        <div className="pointer-events-none absolute -bottom-28 -right-28 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,150,80,0.2),rgba(255,150,80,0)_60%)]" />
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
          Course Access Required
        </h2>
        <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 px-2">
          Connect your wallet to verify your WifHoodie NFT and access this course.
        </p>
        {error && <p className="text-red-400 mb-4 px-4 text-sm sm:text-base">{error}</p>}
        
        {/* Debug info for troubleshooting */}
        {!isPhantomInstalled && (
          <div className="mb-4 px-4 text-xs text-gray-400">
            <p>Debug: Phantom wallet detection failed</p>
            <p>If you have Phantom installed, try:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Refresh the page</li>
              <li>Check if Phantom extension is enabled</li>
              <li>Try connecting manually below</li>
            </ul>
            <Button
              onClick={() => connectWallet('phantom')}
              disabled={isConnecting}
              className="mt-2 w-full text-xs py-1 bg-gray-700 hover:bg-gray-600"
            >
              {isConnecting ? 'Connecting...' : 'Force Connect Phantom'}
            </Button>
          </div>
        )}
        
        {/* Mobile: Show buttons directly */}
        <div className="sm:hidden w-full px-4 space-y-3">
          <Button
            onClick={() => connectWallet('phantom')}
            disabled={isConnecting || (!isPhantomInstalled && !isMobile)}
            className="group relative overflow-hidden w-full min-h-[56px] font-semibold text-white rounded-xl shadow-lg ring-1 ring-white/20 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-base"
          >
            <span className="pointer-events-none absolute -inset-1 bg-gradient-to-r from-white/30 to-transparent opacity-70 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative z-10 flex items-center justify-center gap-3">
              <Wallet size={20} />
              <span>
                {isConnecting ? 'Connecting...' : 
                 !isPhantomInstalled && !isMobile ? 'Checking Phantom...' : 
                 'Connect with Phantom'}
              </span>
            </span>
          </Button>
          
          <Button
            onClick={() => connectWallet('solflare')}
            disabled={isConnecting}
            className="group relative overflow-hidden w-full min-h-[56px] font-semibold text-white rounded-xl shadow-lg ring-1 ring-white/20 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-base"
          >
            <span className="pointer-events-none absolute -inset-1 bg-gradient-to-r from-white/30 to-transparent opacity-70 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative z-10 flex items-center justify-center gap-3">
              <Wallet size={20} />
              <span>{isConnecting ? 'Connecting...' : 'Connect with Solflare'}</span>
            </span>
          </Button>
        </div>
        
        {/* Desktop: Show dropdown */}
        <div className="hidden sm:flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={isConnecting || !isPhantomInstalled}
                className="group relative overflow-hidden px-8 py-3 w-64 min-h-[44px] font-semibold text-white rounded-xl shadow-lg ring-1 ring-white/20 bg-gradient-to-r from-amber-500 via-rose-500 to-violet-600 hover:from-amber-400 hover:via-rose-400 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="pointer-events-none absolute -inset-1 bg-gradient-to-r from-white/30 to-transparent opacity-70 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Wallet className="mr-2 relative z-10" size={20} />
                <span className="relative z-10">
                  {isConnecting ? 'Connecting...' : 
                   !isPhantomInstalled ? 'Checking Wallet...' : 
                   'Connect Wallet'}
                </span>
                <ChevronDown className="ml-2 relative z-10" size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-gray-700 min-w-[220px]">
              <DropdownMenuItem
                onClick={() => connectWallet('phantom')}
                className="text-gray-200 hover:bg-gradient-to-r hover:from-amber-500/20 hover:via-rose-500/20 hover:to-violet-600/20 cursor-pointer py-3 transition-all duration-200"
              >
                <Wallet className="mr-2" size={18} />
                <span>Phantom</span>
                {!isPhantomInstalled && (
                  <span className="ml-2 text-xs text-gray-400">(Not installed)</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => connectWallet('solflare')}
                className="text-gray-200 hover:bg-gradient-to-r hover:from-amber-500/20 hover:via-rose-500/20 hover:to-violet-600/20 cursor-pointer py-3 transition-all duration-200"
              >
                <Wallet className="mr-2" size={18} />
                <span>Solflare</span>
                {typeof window !== 'undefined'
                  && !((window as any).solflare || (window as any).solana?.isSolflare) && (
                  <span className="ml-2 text-xs text-gray-400">(Not installed)</span>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Show error if connection failed */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg mx-4 sm:mx-0">
            <p className="text-red-400 text-xs sm:text-sm">{error}</p>
            {error.includes('Phantom wallet is not installed') && (
              <div className="mt-2">
                <a 
                  href="https://phantom.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm underline"
                >
                  Install Phantom Wallet →
                </a>
              </div>
            )}
          </div>
        )}
        
        {/* Alternative connection options */}
        <div className="mt-4 text-center px-4">
          <p className="text-gray-400 text-xs sm:text-sm mb-2">Don't have a wallet?</p>
          <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-2">
            <a 
              href="https://phantom.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm underline"
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
        
        {/* Founders Section */}
        <div className="mt-6 pt-6 border-t border-white/10 px-4">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-amber-400">✨</span>
            Founders & Official X
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                name: 'Hoodie Academy',
                xHandle: 'HoodieAcademy',
                pfp: '/images/founders/Hoodie%20Academy%20Logo.png',
                role: 'Official X',
                shape: 'square'
              },
              {
                name: 'Kong',
                xHandle: 'kongnificent_',
                pfp: '/images/founders/Kong.jpg',
                role: 'Founder'
              },
              {
                name: 'JupDad',
                xHandle: 'jupdad',
                pfp: '/images/founders/JupDad.jpg',
                role: 'Co-Founder'
              }
            ].map((founder, index) => (
              <FounderCard key={index} founder={founder} />
            ))}
          </div>
        </div>

        {/* Visit The Academy Blog Button */}
        <div className="mt-6 px-4">
          <Link href="/blog">
            <Button
              className="group relative overflow-hidden w-full min-h-[48px] font-semibold text-white rounded-xl shadow-lg ring-1 ring-white/20 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all duration-200"
            >
              <span className="pointer-events-none absolute -inset-1 bg-gradient-to-r from-white/30 to-transparent opacity-70 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative z-10 flex items-center justify-center gap-3">
                <Newspaper size={20} />
                <span>Visit The Academy Blog</span>
              </span>
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Welcome Tutorial Overlay */}
      {showWelcomeTutorial && (
        <WelcomeTutorial 
          walletAddress={walletAddress || undefined}
          onClose={() => setShowWelcomeTutorial(false)}
        />
      )}
    </div>
  );
};