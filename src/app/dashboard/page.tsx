"use client";

import { createContext, useContext, useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useDisplayNameReadOnly } from '@/hooks/use-display-name';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy, Users, Target, TrendingUp, Award, Star, CheckCircle, ArrowRight, ChevronRight,
  RefreshCw, Plus, X, Edit, Trash2, Bell, Megaphone, User, LogOut, AlertCircle,
  Video, Shield, Clock, BookOpen, ScrollText, Camera, Calendar, Crown, Sparkles, Wallet
} from "lucide-react";
import Link from "next/link";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileNavigation } from "@/components/dashboard/MobileNavigation";
import TokenGate from "@/components/TokenGate";
import SquadBadge from "@/components/SquadBadge";
import CryptoPriceTicker from "@/components/CryptoPriceTicker";
import { fetchUserSquad } from "@/utils/squad-api";
import Image from "next/image";
import { supabase } from "@/utils/supabase/client";

// Lazy load the heavy UserDashboard component
const UserDashboard = lazy(() => import("@/components/dashboard/UserDashboard"));

// Wallet Context
const WalletContext = createContext<{
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
}>({ walletAddress: null, setWalletAddress: () => {} });

// Complete mock data
const academySpotlights = [
  {
    quote: "The strongest minds don't grind—they decode.",
    author: "CipherMaster Sage",
    role: "Decoders Lead",
    avatar: "/images/hoodie-academy-pixel-art-logo.png",
  },
  {
    quote: "Creativity is the ultimate competitive advantage in Web3.",
    author: "PixelPunk Queen",
    role: "Creators Lead",
    avatar: "/images/hoodie-academy-pixel-art-logo.png",
  },
  {
    quote: "Every trade is a lesson, every loss is tuition.",
    author: "RaidBoss Alpha",
    role: "Raiders Lead",
    avatar: "/images/hoodie-academy-pixel-art-logo.png",
  },
  {
    quote: "The best speakers listen first, then amplify.",
    author: "Voice of the Void",
    role: "Speakers Lead",
    avatar: "/images/hoodie-academy-pixel-art-logo.png",
  }
];

const studentsOfTheWeek = [
  {
    name: "@ChainWitch",
    squad: "Speakers",
    achievement: "Submitted 3 trait designs + led a meme challenge",
    avatar: "/images/hoodie-academy-pixel-art-logo.png",
    badge: "🏅",
  },
  {
    name: "@CodeCrusher",
    squad: "Decoders",
    achievement: "Solved 5 advanced puzzles + mentored 3 new students",
    avatar: "/images/hoodie-academy-pixel-art-logo.png",
    badge: "🌟",
  },
  {
    name: "@PixelPirate",
    squad: "Creators",
    achievement: "Created viral meme + designed 2 new traits",
    avatar: "/images/hoodie-academy-pixel-art-logo.png",
    badge: "🎨",
  },
  {
    name: "@RaidMaster",
    squad: "Raiders",
    achievement: "Top trader this week + helped 5 students",
    avatar: "/images/hoodie-academy-pixel-art-logo.png",
    badge: "⚔️",
  }
];

const loreEntries = [
  {
    title: "Entry 0042: The Glitchfire Relic",
    content:
      "The first sighting of the glitchfire relic occurred during the Codec Storm of Cycle 7. Rangers reported flickering trait signatures along the WifHoodie borderlands...",
    date: "2025-01-28",
  },
  {
    title: "Entry 0041: The Great Meme Migration",
    content:
      "When the meme lords of old abandoned their thrones, a new generation rose from the digital ashes. The Creators Squad was born...",
    date: "2025-01-27",
  },
  {
    title: "Entry 0040: The Decoder's Dilemma",
    content:
      "In the depths of the blockchain, ancient algorithms whisper secrets only the purest minds can decipher. The Decoders Squad guards these sacred texts...",
    date: "2025-01-26",
  }
];

const milestones = [
  {
    title: "Phase 3 Rollout",
    progress: 72,
    description: "Advanced trading courses and squad challenges",
    target: "2025-02-15",
  },
  {
    title: "Squad Leader Elections",
    progress: 45,
    description: "Democratic leadership selection process",
    target: "2025-02-28",
  },
  {
    title: "NFT Marketplace Launch",
    progress: 88,
    description: "Student-created content marketplace",
    target: "2025-03-15",
  },
  {
    title: "Global Tournament",
    progress: 23,
    description: "Cross-squad competitive event",
    target: "2025-04-01",
  }
];

const mediaWall = [
  {
    type: "meme",
    title: "Trading Psychology Meme",
    author: "@MemeLord",
    image: "/images/video-placeholder.jpg",
  },
  {
    type: "trait",
    title: "Cyberpunk Hoodie Design",
    author: "@PixelPunk",
    image: "/images/video-placeholder.jpg",
  },
  {
    type: "promo",
    title: "Squad Recruitment Flyer",
    author: "@MarketingGuru",
    image: "/images/video-placeholder.jpg",
  },
  {
    type: "course",
    title: "DeFi Fundamentals Visual",
    author: "@EduCreator",
    image: "/images/video-placeholder.jpg",
  }
];

export default function HoodieAcademy() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [userSquad, setUserSquad] = useState<string | null>(null);
  const [squadLockExpired, setSquadLockExpired] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDemoWallet, setIsDemoWallet] = useState(false);
  const [currentSpotlightIndex, setCurrentSpotlightIndex] = useState(0);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [snsDomain, setSnsDomain] = useState<string | null>(null);
  const [isLoadingSns, setIsLoadingSns] = useState(false);
  // Use the global display name hook
  const { displayName: userDisplayName } = useDisplayNameReadOnly();
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    const initialize = () => {
      // Synchronous initialization for fast rendering
      const storedWallet =
        localStorage.getItem("walletAddress") || localStorage.getItem("connectedWallet");
      
      if (storedWallet) {
        setWalletAddress(storedWallet);
        setSnsDomain(storedWallet);
        setIsLoadingSns(false);

        // Check cached admin status first
        const cachedAdminStatus = localStorage.getItem('hoodie_academy_is_admin');
        if (cachedAdminStatus === 'true') {
          setIsAdmin(true);
        }

        // Background admin check with caching
        setTimeout(async () => {
          try {
            const cacheKey = `admin_check_${storedWallet}`;
            const cacheTimestampKey = `${cacheKey}_timestamp`;
            const cachedResult = localStorage.getItem(cacheKey);
            const cacheTimestamp = localStorage.getItem(cacheTimestampKey);
            
            // Use cache if less than 5 minutes old
            if (cachedResult && cacheTimestamp) {
              const age = Date.now() - parseInt(cacheTimestamp);
              if (age < 5 * 60 * 1000) {
                setIsAdmin(cachedResult === 'true');
                return;
              }
            }

            // Fetch fresh admin status
            const { data, error } = await supabase
              .from("users")
              .select("is_admin")
              .eq("wallet_address", storedWallet)
              .single();
            
            if (!error && data) {
              const isAdminStatus = !!data?.is_admin;
              setIsAdmin(isAdminStatus);
              localStorage.setItem(cacheKey, isAdminStatus ? 'true' : 'false');
              localStorage.setItem(cacheTimestampKey, Date.now().toString());
              localStorage.setItem('hoodie_academy_is_admin', isAdminStatus ? 'true' : 'false');
            } else {
              setIsAdmin(false);
            }
          } catch (err) {
            console.error("Admin check failed:", err);
            setIsAdmin(false);
          }
        }, 0);
      }

      // Fetch squad from database API (non-blocking)
      setTimeout(async () => {
        try {
          const profileResponse = await fetch(`/api/user-profile?wallet=${storedWallet}`);
          const profileData = await profileResponse.json();
          
          if (profileData.success && profileData.profile) {
            const squadName = profileData.profile.squad?.name || 'Unassigned';
            setUserSquad(squadName);
            
            // Check if squad lock has expired
            if (profileData.profile.squad?.isLocked) {
              setSquadLockExpired(false);
            } else if (profileData.profile.squad) {
              setSquadLockExpired(true);
            }
          }
        } catch (error) {
          console.error('Error fetching squad data:', error);
        }
      }, 0);
    };

    initialize();

    const spotlightInterval = setInterval(() => {
      setCurrentSpotlightIndex((prev) => (prev + 1) % academySpotlights.length);
    }, 8000);
    const studentInterval = setInterval(() => {
      setCurrentStudentIndex((prev) => (prev + 1) % studentsOfTheWeek.length);
    }, 12000);

    return () => {
      clearInterval(timerId);
      clearInterval(spotlightInterval);
      clearInterval(studentInterval);
    };
  }, []);

  const handleConnectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const provider = typeof window !== 'undefined' ? window.solana : undefined;
      if (!provider) {
        throw new Error('Phantom wallet not found. Please install Phantom wallet.');
      }

      // Connect only if not already connected
      if (!provider.publicKey) {
        try {
          await provider.connect({ onlyIfTrusted: true } as any);
        } catch (trustedError) {
          await provider.connect();
        }
      }

      const walletAddress = provider.publicKey!.toString();
      
      // Store wallet address in all storage locations for consistency
      localStorage.setItem("hoodie_academy_wallet", walletAddress);
      localStorage.setItem("walletAddress", walletAddress);
      localStorage.setItem("connectedWallet", walletAddress);
      
      // Log to API (hybrid approach)
      fetch('/api/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          wallet: walletAddress,
          provider: 'phantom'
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.banned) {
            handleDisconnect();
          } else if (data.isAdmin !== undefined) {
            setIsAdmin(data.isAdmin);
            localStorage.setItem("hoodie_academy_is_admin", data.isAdmin ? 'true' : 'false');
          }
        })
        .catch(err => {
          // Silent error handling
        });
      
      // Update state
      setWalletAddress(walletAddress);
      setSnsDomain(walletAddress);
      
      // Check admin status
      try {
        const { data, error } = await supabase
          .from("users")
          .select("is_admin")
          .eq("wallet_address", walletAddress)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error("Error checking admin status:", error);
        } else {
          setIsAdmin(!!data?.is_admin);
        }
      } catch (err) {
        console.error("Admin check failed:", err);
        setIsAdmin(false);
      }

      // Fetch squad from database API
      try {
        const profileResponse = await fetch(`/api/user-profile?wallet=${walletAddress}`);
        const profileData = await profileResponse.json();
        
        if (profileData.success && profileData.profile) {
          const squadName = profileData.profile.squad?.name || 'Unassigned';
          setUserSquad(squadName);
        }
      } catch (error) {
        console.error('Error fetching squad data:', error);
      }

    } catch (error) {
      console.error("Wallet connection failed:", error);
      setError(error instanceof Error ? error.message : "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    // Log to API before disconnecting
    if (walletAddress) {
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
          // Silent success
        })
        .catch(err => {
          // Silent error handling
        });
    }
    
    // Clear all wallet storage locations
    localStorage.removeItem("hoodie_academy_wallet");
    localStorage.removeItem("walletAddress");
    localStorage.removeItem("connectedWallet");
    localStorage.removeItem("hoodie_academy_is_admin");
    sessionStorage.removeItem("wifhoodie_verification");
    sessionStorage.removeItem("wifhoodie_verification_session");
    if (window.solana?.disconnect) {
      window.solana.disconnect();
    }
    setWalletAddress(null);
    setSnsDomain(null);
    setIsAdmin(false);
    setUserSquad(null);
  }, [walletAddress]);

  const formatWalletAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const normalizeSquadNameForUrl = (name: string): string => {
    return name.replace(/^[🎨🧠🎤⚔️🦅]+\s*/, "").toLowerCase().trim().replace(/\s+/g, "-");
  };

  return (
    <WalletContext.Provider value={{ walletAddress, setWalletAddress }}>
      <TokenGate>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Hoodie Academy",
          "description": "Master Web3, NFTs, and crypto trading with gamified learning. Join the Hoodie Academy community and become a Web3 expert.",
          "url": "https://hoodieacademy.com",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://hoodieacademy.com/courses?search={search_term_string}",
            "query-input": "required name=search_term_string",
          },
          "publisher": {
            "@type": "Organization",
            "name": "Hoodie Academy",
            "url": "https://hoodieacademy.com",
          },
        }) }} />
        <div className="flex min-h-screen relative">
          {/* Background Image */}
          <div className="fixed inset-0 -z-10" style={{ position: 'fixed' }}>
            <div className="relative w-full h-full">
              <Image
                src="/images/Hoodie Dashbaord.png"
                alt="Dashboard Background"
                fill
                priority
                className="object-cover"
              />
            </div>
          </div>
          {/* Overlay for readability - lighter overlay to show pixel art */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-purple-900/10 to-slate-900/20 pointer-events-none"></div>
          <div className="relative z-10 flex w-full">
            <DashboardSidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div className="flex-1 flex flex-col">
            <CryptoPriceTicker />
            <header className="bg-slate-800/50 border-b border-cyan-500/30 px-6 py-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center space-x-4 sm:space-x-6">
                  <MobileNavigation userSquad={userSquad} isAdmin={isAdmin} />
                  <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-cyan-400">🏛️ Hoodie Academy</h1>
                    <p className="text-sm sm:text-base text-gray-300 mt-1">
                      Home of elite Web3 scholars and the future of decentralized learning
                    </p>
                  </div>
                  {userSquad && (
                    <div className="hidden md:block">
                      <SquadBadge
                        squad={typeof userSquad === "string" ? userSquad.replace(/^[🎨🧠🎤⚔️🦅]+\s*/, "") : "Unknown Squad"}
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 w-full sm:w-auto">
                  {error && (
                    <div className="w-full sm:w-auto">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}
                  {walletAddress && (
                    <div className="flex items-center space-x-2 bg-slate-700/50 px-3 py-2 rounded-lg border border-cyan-500/30 w-full sm:w-auto min-w-0 flex-shrink-0">
                      <User className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <span className="text-sm text-cyan-400 font-mono truncate">
                        {isLoadingSns ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                            <span>Resolving...</span>
                          </div>
                        ) : snsDomain ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold cursor-help" title={`Wallet: ${walletAddress}`}>
                              {snsDomain}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span title={`Full wallet: ${walletAddress}`} className="font-mono">
                              {formatWalletAddress(walletAddress)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setIsLoadingSns(true);
                                setSnsDomain(null);
                                setIsLoadingSns(false);
                              }}
                              className="h-4 w-4 p-0 text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10"
                              title="Refresh SNS resolution"
                            >
                              🔄
                            </Button>
                          </div>
                        )}
                      </span>
                      {isDemoWallet && (
                        <Badge variant="outline" className="ml-2 text-yellow-400 border-yellow-500/30 text-xs">
                          DEMO
                        </Badge>
                      )}
                    </div>
                  )}
                  <Link href={isAdmin ? "/admin-dashboard" : "#"} className="flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`w-full sm:w-auto min-h-[44px] ${
                        isAdmin
                          ? "text-blue-400 border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-300"
                          : "text-slate-500 border-slate-500/30 cursor-not-allowed opacity-50"
                      }`}
                      onClick={(e) => {
                        if (!isAdmin) {
                          e.preventDefault();
                          alert("Admin access required. Please contact an administrator.");
                        }
                      }}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                      {!isAdmin && <span className="ml-1 text-xs">(Restricted)</span>}
                    </Button>
                  </Link>
                  <Button
                    onClick={handleDisconnect}
                    variant="outline"
                    size="sm"
                    className="text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300 w-full sm:w-auto min-h-[44px] flex-shrink-0"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                  <div className="hidden lg:flex flex-col text-right flex-shrink-0">
                    <div className="text-xs text-gray-400">Current Time</div>
                    <div className="text-sm text-cyan-400 font-mono">{currentTime}</div>
                  </div>
                </div>
              </div>
            </header>
            <main className="flex-1 px-6 py-8 space-y-8">
              {walletAddress ? (
                <Suspense fallback={
                  <div className="space-y-6">
                    <Card className="bg-slate-800/50 border-cyan-500/30">
                      <CardContent className="p-8">
                        <div className="flex flex-col items-center justify-center space-y-4 text-gray-400">
                          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                          <div className="text-center">
                            <h3 className="text-lg font-semibold text-cyan-400 mb-2">Loading Your Dashboard</h3>
                            <p className="text-sm">Fetching your progress, bounties, and squad info...</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                }>
                  <UserDashboard walletAddress={walletAddress} />
                </Suspense>
              ) : (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <Crown className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-400 mb-2">Connect Your Wallet</h1>
                    <p className="text-gray-500 mb-6">
                      Please connect your wallet to view your personalized dashboard with bounties, squad information, and XP progress.
                    </p>
                    {error && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-sm">{error}</p>
                      </div>
                    )}
                    <Button 
                      onClick={handleConnectWallet}
                      disabled={isConnecting}
                      className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50"
                    >
                      {isConnecting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-4 h-4 mr-2" />
                          Connect Wallet
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </main>
            </div>
          </div>
        </div>
      </TokenGate>
    </WalletContext.Provider>
  );
} 