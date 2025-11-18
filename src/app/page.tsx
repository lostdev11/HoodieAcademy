'use client';

import { useState, useEffect, useCallback, lazy, Suspense } from "react"
import { useDisplayNameReadOnly } from '@/hooks/use-display-name'
import { useLevel } from "@/hooks/useLevel"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Trophy, 
  Users, 
  Target, 
  TrendingUp, 
  Award, 
  Star, 
  CheckCircle, 
  ArrowRight,
  ChevronRight,
  RefreshCw,
  Plus,
  X,
  Edit,
  Trash2,
  Bell,
  Megaphone,
  User, 
  LogOut,
  AlertCircle,
  Video,
  Shield,
  Clock,
  BookOpen,
  ScrollText,
  Camera,
  Calendar,
  Crown,
  Sparkles
} from 'lucide-react';
import Link from "next/link"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"
import { MobileNavigation } from "@/components/dashboard/MobileNavigation"
import TokenGate from "@/components/TokenGate"
import SquadBadge from "@/components/SquadBadge"
import CryptoPriceTicker from "@/components/CryptoPriceTicker"
import { getSquadNameFromCache, isSquadLockedFromCache } from '@/utils/squad-api'
import Image from 'next/image'

// Lazy load heavy components
const AcademyInfo = lazy(() => import("@/components/home/AcademyInfo"));
const FeedbackTrackerWidget = lazy(() => import("@/components/feedback/FeedbackTrackerWidget"));
const StudentOfTheWeekWidget = lazy(() => import("@/components/home/StudentOfTheWeekWidget"));

// Mock data for the new home page sections
const academySpotlights = [
  {
    quote: "The strongest minds don't grind—they decode.",
    author: "CipherMaster Sage",
    role: "Decoders Lead",
    avatar: "/images/hoodie-academy-pixel-art-logo.png"
  },
  {
    quote: "Every meme is a message, every trait a story waiting to be told.",
    author: "PixelProphet",
    role: "Creators Lead",
    avatar: "/images/hoodie-academy-pixel-art-logo.png"
  },
  {
    quote: "In the chaos of the market, find your rhythm.",
    author: "RangerPrime",
    role: "Rangers Lead",
    avatar: "/images/hoodie-academy-pixel-art-logo.png"
  }
];


const loreEntries = [
  {
    title: "Entry 0042: The Glitchfire Relic",
    content: "The first sighting of the glitchfire relic occurred during the Codec Storm of Cycle 7. Rangers reported flickering trait signatures along the WifHoodie borderlands...",
    date: "2025-01-28"
  },
  {
    title: "Entry 0041: The Great Meme Convergence",
    content: "When the Creator squads aligned their pixel art with the Speaker's viral strategies, the entire academy witnessed a phenomenon never seen before...",
    date: "2025-01-25"
  }
];

const milestones = [
  {
    title: "Phase 3 Rollout",
    progress: 72,
    description: "Advanced trading courses and squad challenges",
    target: "2025-02-15"
  },
  {
    title: "Merch Drop",
    progress: 45,
    description: "Limited edition Hoodie Academy gear",
    target: "2025-02-28"
  }
];

type BountyHighlight = {
  id: string | number;
  title: string;
  short_desc?: string | null;
  reward?: string | null;
  reward_type?: string | null;
  deadline?: string | null;
  squad_tag?: string | null;
  status?: string | null;
  submissions?: number | null;
};

const mediaWall = [
  {
    type: "meme",
    title: "Trading Psychology Meme",
    author: "@MemeLord",
    image: "/images/video-placeholder.jpg"
  },
  {
    type: "promo",
    title: "Course Promo Flyer",
    author: "@DesignWizard",
    image: "/images/video-placeholder.jpg"
  },
  {
    type: "submission",
    title: "Student Trait Design",
    author: "@PixelArtist",
    image: "/images/video-placeholder.jpg"
  },
  {
    type: "meme",
    title: "NFT Market Analysis",
    author: "@CryptoAnalyst",
    image: "/images/video-placeholder.jpg"
  }
];

export default function HoodieAcademy() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [userSquad, setUserSquad] = useState<string | null>(null);
  const [squadLockExpired, setSquadLockExpired] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDemoWallet, setIsDemoWallet] = useState(false);
  const [currentSpotlightIndex, setCurrentSpotlightIndex] = useState(0);
  const [snsDomain, setSnsDomain] = useState<string | null>(null);
  const [isLoadingSns, setIsLoadingSns] = useState(false);
  const [userXP, setUserXP] = useState<number>(0);
  const [isLoadingXP, setIsLoadingXP] = useState(true);
  const [bountyHighlights, setBountyHighlights] = useState<BountyHighlight[]>([]);
  const [isLoadingBounties, setIsLoadingBounties] = useState(true);
  const [bountiesError, setBountiesError] = useState<string | null>(null);
  // Use the global display name hook
  const { displayName: userDisplayName } = useDisplayNameReadOnly();
  const levelData = useLevel(userXP);

  const syncWalletStorage = useCallback((wallet: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("walletAddress", wallet);
    localStorage.setItem("connectedWallet", wallet);
    localStorage.setItem("hoodie_academy_wallet", wallet);
  }, []);

  const getStoredWalletAddress = useCallback(() => {
    if (typeof window === "undefined") return null;

    const wallet =
      localStorage.getItem("walletAddress") ||
      localStorage.getItem("hoodie_academy_wallet") ||
      localStorage.getItem("connectedWallet");

    if (wallet) {
      syncWalletStorage(wallet);
    }

    return wallet;
  }, [syncWalletStorage]);

  const initializeWalletState = useCallback(() => {
    const wallet = getStoredWalletAddress();

    if (!wallet) {
      setIsLoadingXP(false);
      return null;
    }

    setWalletAddress(wallet);
    setSnsDomain(wallet);
    setIsLoadingSns(false);

    const cachedSquadName = getSquadNameFromCache();
    if (cachedSquadName) {
      setUserSquad(cachedSquadName);
      setSquadLockExpired(!isSquadLockedFromCache());
    }

    return wallet;
  }, [getStoredWalletAddress]);

  const fetchUserXPOnly = useCallback(async (wallet: string) => {
    try {
      const response = await fetch(`/api/xp?wallet=${wallet}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch XP: ${response.status}`);
      }

      const data = await response.json();
      if (data) {
        const totalXP = data.totalXP ?? data.xp ?? 0;
        setUserXP(typeof totalXP === "number" ? totalXP : parseInt(totalXP, 10) || 0);
      }
    } catch (error) {
      console.error("❌ Home: Error fetching user XP fallback:", error);
    } finally {
      setIsLoadingXP(false);
    }
  }, []);

  const fetchSquadData = useCallback(async (wallet: string) => {
    if (!wallet) return;

    try {
      const profileResponse = await fetch(`/api/user-profile?wallet=${wallet}`);
      const profileData = await profileResponse.json();

      if (profileData.success && profileData.profile) {
        const squadName = profileData.profile.squad?.name || "Unassigned";
        setUserSquad(squadName);

        const profileXP = profileData.profile.totalXP ?? profileData.profile.total_xp ?? 0;
        setUserXP(typeof profileXP === "number" ? profileXP : parseInt(profileXP, 10) || 0);

        setIsDemoWallet(Boolean(profileData.profile.is_demo_wallet || profileData.profile.isDemoWallet));
        setIsLoadingXP(false);

        if (profileData.profile.squad?.isLocked) {
          setSquadLockExpired(false);
        } else if (profileData.profile.squad) {
          setSquadLockExpired(true);
        } else {
          setSquadLockExpired(false);
        }
      } else {
        setUserSquad(null);
        setSquadLockExpired(false);
        setIsDemoWallet(false);
        await fetchUserXPOnly(wallet);
      }
    } catch (error) {
      console.error("❌ Home: Error fetching squad data:", error);
      setUserSquad(null);
      setSquadLockExpired(false);
      setIsDemoWallet(false);
      await fetchUserXPOnly(wallet);
    }
  }, [fetchUserXPOnly]);

  const refreshSquadData = useCallback(async () => {
    const wallet = getStoredWalletAddress();
    if (!wallet) return;
    await fetchSquadData(wallet);
  }, [fetchSquadData, getStoredWalletAddress]);

  useEffect(() => {
    const wallet = initializeWalletState();
    if (wallet) {
      fetchSquadData(wallet);
    }

    const cachedAdminStatus =
      typeof window !== "undefined" ? localStorage.getItem("hoodie_academy_is_admin") : null;
    if (cachedAdminStatus === "true") {
      setIsAdmin(true);
    }

    const checkAdminStatus = async () => {
      try {
        const walletAddress = getStoredWalletAddress();
        if (!walletAddress) {
          setIsAdmin(false);
          return;
        }

        const cacheKey = `admin_check_${walletAddress}`;
        const cacheTimestampKey = `${cacheKey}_timestamp`;
        const cachedResult = localStorage.getItem(cacheKey);
        const cacheTimestamp = localStorage.getItem(cacheTimestampKey);

        if (cachedResult && cacheTimestamp) {
          const age = Date.now() - parseInt(cacheTimestamp);
          if (age < 5 * 60 * 1000) {
            setIsAdmin(cachedResult === "true");
            return;
          }
        }

        const { checkAdminStatusDirect } = await import("@/lib/admin-check");
        const adminStatus = await checkAdminStatusDirect(walletAddress);

        localStorage.setItem(cacheKey, adminStatus ? "true" : "false");
        localStorage.setItem(cacheTimestampKey, Date.now().toString());
        localStorage.setItem("hoodie_academy_is_admin", adminStatus ? "true" : "false");

        setIsAdmin(adminStatus);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      }
    };

    setTimeout(() => checkAdminStatus(), 0);

    const handleStorageChange = (event: StorageEvent) => {
      if (!event.key || ["walletAddress", "hoodie_academy_wallet", "connectedWallet"].includes(event.key)) {
        const nextWallet = initializeWalletState();
        if (nextWallet) {
          fetchSquadData(nextWallet);
        }
        return;
      }

      if (event.key === "userSquad") {
        refreshSquadData();
      }
    };

    const handleSquadUpdate = () => {
      refreshSquadData();
    };

    const handleWalletConnected = (event: Event) => {
      const detail = (event as CustomEvent<{ wallet?: string } | string>).detail;
      const walletFromEvent = typeof detail === "string" ? detail : detail?.wallet;

      if (walletFromEvent) {
        syncWalletStorage(walletFromEvent);
      }

      const nextWallet = initializeWalletState();
      if (nextWallet) {
        fetchSquadData(nextWallet);
      }
    };

    const handleWalletDisconnected = () => {
      setWalletAddress("");
      setSnsDomain(null);
      setIsLoadingSns(false);
      setUserSquad(null);
      setSquadLockExpired(false);
      setIsDemoWallet(false);
      setIsLoadingXP(false);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("squadUpdated", handleSquadUpdate);
    window.addEventListener("walletConnected", handleWalletConnected);
    window.addEventListener("walletDisconnected", handleWalletDisconnected);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("squadUpdated", handleSquadUpdate);
      window.removeEventListener("walletConnected", handleWalletConnected);
      window.removeEventListener("walletDisconnected", handleWalletDisconnected);
    };
  }, [
    fetchSquadData,
    getStoredWalletAddress,
    initializeWalletState,
    refreshSquadData,
    syncWalletStorage
  ]);

  useEffect(() => {
    const fetchBounties = async () => {
      try {
        setIsLoadingBounties(true);
        setBountiesError(null);

        const response = await fetch('/api/bounties?status=active');
        if (!response.ok) {
          throw new Error(`Failed to load bounties: ${response.status}`);
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          const highlights = data
            .filter((bounty) => !bounty.hidden)
            .slice(0, 8)
            .map((bounty) => {
              const normalizedId = bounty.slug || bounty.id || bounty.uuid;
              const rawSummary = bounty.short_desc || bounty.shortDescription || '';
              const summary = typeof rawSummary === 'string' ? rawSummary.replace(/<[^>]+>/g, '') : '';
              const rawSubmissions = bounty.submissions ?? bounty.submission_count ?? null;
              const submissionCount = typeof rawSubmissions === 'number'
                ? rawSubmissions
                : rawSubmissions !== null
                ? parseInt(rawSubmissions, 10)
                : null;
              return {
                id: typeof normalizedId === 'string' ? normalizedId : String(normalizedId ?? ''),
                title: bounty.title || 'Untitled Bounty',
                short_desc: summary,
                reward: bounty.reward ?? null,
                reward_type: bounty.reward_type || bounty.rewardType || null,
                deadline: bounty.deadline || bounty.due_date || null,
                squad_tag: bounty.squad_tag || bounty.squadTag || null,
                status: bounty.status || null,
                submissions: Number.isFinite(submissionCount) ? submissionCount : null
              } as BountyHighlight;
            })
            .filter((bounty) => bounty.id !== '');

          setBountyHighlights(highlights);
        } else {
          setBountyHighlights([]);
        }
      } catch (error) {
        console.error('❌ Home: Error loading bounties:', error);
        setBountiesError('Unable to load bounties right now. Please try again later.');
        setBountyHighlights([]);
      } finally {
        setIsLoadingBounties(false);
      }
    };

    fetchBounties();
  }, []);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  // Rotate spotlight and student of the week
  useEffect(() => {
    const spotlightInterval = setInterval(() => {
      setCurrentSpotlightIndex((prev) => (prev + 1) % academySpotlights.length);
    }, 8000);

    return () => {
      clearInterval(spotlightInterval);
    };
  }, []);

  const handleDisconnect = () => {
    // Clear all wallet-related storage
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('connectedWallet');
    localStorage.removeItem('hoodie_academy_wallet');
    localStorage.removeItem('hoodie_academy_is_admin');
    sessionStorage.removeItem('wifhoodie_verification_session');
    sessionStorage.removeItem('wifhoodie_verification');
    
    // Disconnect from wallet provider
    if (window.solana?.disconnect) {
      window.solana.disconnect();
    }
    
    // Reset all state
    setWalletAddress("");
    setSnsDomain(null);
    setIsAdmin(false);
    setUserSquad(null);
    
    // Force a page reload to show the wallet connection screen
    window.location.reload();
  };

  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const normalizeSquadNameForUrl = (name: string): string => {
    return name.replace(/^[🎨🧠🎤⚔️🦅]+\s*/, '').toLowerCase().trim().replace(/\s+/g, '-');
  };

  const formatBountyDeadline = (deadline?: string | null) => {
    if (!deadline) return 'Open now';
    const parsed = new Date(deadline);
    if (Number.isNaN(parsed.getTime())) return 'Open now';
    return parsed.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  };

  const getBountyStatusBadgeColor = (status?: string | null) => {
    switch ((status || 'active').toLowerCase()) {
      case 'completed':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'expired':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      default:
        return 'bg-green-500/20 text-green-300 border-green-500/40';
    }
  };

  const getBountySquadBadgeStyle = (squad?: string | null) => {
    switch ((squad || '').toLowerCase()) {
      case 'creators':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'decoders':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/40';
      case 'speakers':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'raiders':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    }
  };

  const formatBountyReward = (reward?: string | null, rewardType?: string | null) => {
    if (reward && reward.trim().length > 0) {
      return reward;
    }

    if (!rewardType) {
      return 'Reward TBD';
    }

    const normalizedType = rewardType.toUpperCase();
    if (normalizedType === 'XP') {
      return 'XP Reward';
    }

    return `${normalizedType} reward`;
  };

  return (
    <TokenGate>
      {/* Structured Data for Homepage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Hoodie Academy",
            "description": "Master Web3, NFTs, and crypto trading with gamified learning. Join the Hoodie Academy community and become a Web3 expert.",
            "url": "https://hoodieacademy.com",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://hoodieacademy.com/courses?search={search_term_string}",
              "query-input": "required name=search_term_string"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Hoodie Academy",
              "url": "https://hoodieacademy.com"
            }
          })
        }}
      />
      
      <div className="relative flex min-h-screen">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(/images/library-background.png)',
            backgroundSize: 'contain',
            backgroundPosition: 'center center',
            backgroundRepeat: 'repeat'
          }}
        >

          {/* Warm overlays to match library aesthetic */}
          <div className="absolute inset-0 bg-[#3a2619]/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#2a1a10]/30 via-[#3a2619]/40 to-[#4a2f1f]/50" />
        </div>

        {/* Content Wrapper */}
        <div className="relative z-10 flex w-full">
          {/* Sidebar */}
          <DashboardSidebar 
            isCollapsed={sidebarCollapsed} 
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
          />

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
          {/* Crypto Price Ticker */}
          <CryptoPriceTicker />
          
          {/* Header */}
          <header className="bg-slate-800/50 backdrop-blur-sm border-b border-cyan-500/30 px-4 py-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center space-x-4 sm:space-x-6">
                {/* Mobile Navigation */}
                <MobileNavigation userSquad={userSquad} isAdmin={isAdmin} />
                
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-cyan-400">🏛️ Hoodie Academy</h1>
                  <p className="text-sm sm:text-base text-gray-300">Home of elite Web3 scholars and the future of decentralized learning</p>
                </div>
                
                {/* Squad Badge */}
                <div className="hidden md:block">
                  <SquadBadge squad={userSquad || 'Unassigned'} walletAddress={walletAddress} />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 w-full">
                {/* Wallet Info */}
                {walletAddress && (
                  <div className="flex items-center space-x-2 bg-slate-700/50 px-3 py-2 rounded-lg border border-cyan-500/30 w-full sm:w-auto flex-shrink-0">
                    <User className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <div className="flex items-center flex-wrap gap-2 min-w-0">
                      <span className="text-sm text-cyan-400 font-mono break-all">
                        {isLoadingSns ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                            <span>Resolving...</span>
                          </div>
                        ) : snsDomain ? (
                          <span 
                            className="font-semibold cursor-help" 
                            title={`Wallet: ${walletAddress}`}
                          >
                            {snsDomain}
                          </span>
                        ) : (
                          <span title={`Full wallet: ${walletAddress}`} className="font-mono">
                            {walletAddress.slice(0, 6)}...{walletAddress.slice(-6)}
                          </span>
                        )}
                      </span>
                      {!snsDomain && !isLoadingSns && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSnsDomain(null);
                            setIsLoadingSns(true);
                            setTimeout(() => setIsLoadingSns(false), 1000);
                          }}
                          className="h-4 w-4 p-0 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 flex-shrink-0"
                          title="Refresh SNS resolution"
                          aria-label="Refresh SNS resolution"
                        >
                          🔄
                        </Button>
                      )}
                      {isDemoWallet && (
                        <Badge variant="outline" className="text-yellow-400 border-yellow-500/30 text-xs">
                          DEMO
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Admin Button - Always show, but access restricted */}
                <Link href={isAdmin ? "/admin-dashboard" : "#"} className="flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-full sm:w-auto min-h-[44px] ${
                      isAdmin 
                        ? 'text-blue-400 border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-300' 
                        : 'text-slate-500 border-slate-500/30 cursor-not-allowed opacity-50'
                    }`}
                    onClick={(e) => {
                      if (!isAdmin) {
                        e.preventDefault();
                        alert('Admin access required. Please contact an administrator.');
                      }
                    }}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                    {!isAdmin && <span className="ml-1 text-xs">(Restricted)</span>}
                  </Button>
                </Link>
                
                {/* Disconnect Button */}
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  size="sm"
                  className="text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300 w-full sm:w-auto min-h-[44px] flex-shrink-0"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
                
                {/* Time - Hidden on mobile to prevent overlap */}
                <div className="hidden lg:flex flex-col text-right flex-shrink-0">
                  <div className="text-xs text-gray-400">Current Time</div>
                  <div className="text-sm text-cyan-400 font-mono">{currentTime}</div>
                </div>
              </div>
              <div className="w-full">
                {isLoadingXP ? (
                  <Skeleton className="h-16 w-full bg-slate-700/50 border border-purple-500/20" />
                ) : walletAddress ? (
                  <div className="bg-slate-900/60 border border-purple-500/30 rounded-xl px-4 py-3 flex flex-col gap-3 shadow-inner">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-purple-200">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="font-semibold text-sm sm:text-base">
                          Level {levelData.level} {levelData.title ? `• ${levelData.title}` : ''}
                        </span>
                      </div>
                      <Badge variant="outline" className="border-purple-500/40 text-purple-300 text-xs sm:text-sm">
                        {levelData.isMaxLevel
                          ? `${levelData.currentXP.toLocaleString()} XP`
                          : `${levelData.currentXP.toLocaleString()} / ${levelData.nextXP.toLocaleString()} XP`}
                      </Badge>
                    </div>
                    <Progress value={levelData.progress} className="h-2 bg-slate-800" />
                    <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm text-gray-300 gap-2">
                      <span>
                        {userDisplayName ? `${userDisplayName}'s journey` : 'Keep the streak going'}
                      </span>
                      <span className="text-purple-200">
                        {levelData.isMaxLevel
                          ? 'Max level reached!'
                          : `${levelData.xpNeeded.toLocaleString()} XP until Level ${levelData.level + 1}`}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/60 border border-purple-500/30 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-gray-200">
                    <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>Connect your wallet to start earning XP and level up your Hoodie Academy profile.</span>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Home Page Content */}
          <main className="flex-1 px-4 py-6 space-y-6 max-w-full overflow-x-hidden">
            <h1 className="sr-only">Hoodie Academy — Web3, NFT & Crypto Education</h1>
            {/* Welcome Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-cyan-400 mb-2">🏛️ Welcome to Hoodie Academy</h2>
              <p className="text-muted-foreground text-lg">Your entry into the elite Web3 scholars campus</p>
            </div>

            {/* Featured Bounties */}
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-cyan-300">
                  <Target className="w-5 h-5" />
                  <h3 className="text-xl font-semibold text-cyan-300">Quick Bounties</h3>
                </div>
                <Link href="/bounties" className="text-sm text-cyan-200 hover:text-cyan-100 flex items-center gap-1">
                  Explore all bounties
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <p className="text-sm text-gray-300">
                Short, mobile-friendly quests to earn rewards and XP. Tap a bounty to dive in.
              </p>
              <ScrollArea className="w-full">
                <div className="flex gap-4 pb-4">
                  {isLoadingBounties ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <div key={`bounty-skeleton-${idx}`} className="min-w-[260px] max-w-[280px] flex-shrink-0">
                        <Skeleton className="h-48 w-full bg-slate-800/60 border border-cyan-500/10 rounded-2xl" />
                      </div>
                    ))
                  ) : bountyHighlights.length > 0 ? (
                    bountyHighlights.map((bounty) => (
                      <Link
                        key={bounty.id}
                        href={`/bounties?highlight=${bounty.id}`}
                        className="min-w-[260px] max-w-[320px] flex-shrink-0 group"
                      >
                        <Card className="h-full bg-slate-900/70 border border-cyan-500/20 group-hover:border-cyan-400/50 transition-colors duration-200 rounded-2xl">
                          <CardContent className="p-5 space-y-4">
                            <div className="flex items-center justify-between gap-2">
                              <Badge className={`${getBountyStatusBadgeColor(bounty.status)} text-[11px]`}>
                                {(bounty.status || 'active').toUpperCase()}
                              </Badge>
                              {bounty.squad_tag && (
                                <Badge className={`${getBountySquadBadgeStyle(bounty.squad_tag)} text-[11px]`}>
                                  {bounty.squad_tag}
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <h4 className="text-base font-semibold text-white leading-tight line-clamp-2">
                                {bounty.title}
                              </h4>
                              {bounty.short_desc && (
                                <p className="text-xs text-white line-clamp-3">
                                  {bounty.short_desc}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs text-white">
                              <span className="flex items-center gap-1 text-cyan-200">
                                <Award className="w-4 h-4" />
                                {formatBountyReward(bounty.reward, bounty.reward_type)}
                              </span>
                              <span className="flex items-center gap-1 text-cyan-200">
                                <Calendar className="w-4 h-4" />
                                {formatBountyDeadline(bounty.deadline)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-gray-200">
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {typeof bounty.submissions === 'number' ? `${bounty.submissions} submissions` : 'New bounty'}
                              </span>
                              <span className="flex items-center gap-1 text-cyan-200 group-hover:text-cyan-100">
                                View details
                                <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))
                  ) : (
                    <Card className="min-w-[260px] max-w-[320px] flex-shrink-0 bg-slate-900/60 border border-cyan-500/20">
                      <CardContent className="p-6 flex flex-col gap-3 text-center text-sm text-gray-300">
                        <Megaphone className="w-6 h-6 text-cyan-300 mx-auto" />
                        <span>No active bounties right now. Check back soon or submit one!</span>
                        <Link href="/bounties/create">
                          <Button size="sm" variant="outline" className="border-cyan-500/40 text-cyan-200">
                            Propose a bounty
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
              {bountiesError && (
                <p className="text-xs text-red-300">{bountiesError}</p>
              )}
            </section>

            {/* Squad Assignment CTA - Only show if user hasn't been assigned a squad */}
            {!userSquad && (
              <Card className={`bg-gradient-to-r from-purple-800/50 to-pink-800/50 border-purple-500/30 ${squadLockExpired ? '' : 'animate-pulse'}`}>
                <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
                  <div className="flex flex-col sm:flex-row items-center justify-center mb-4 gap-4">
                    <Trophy className="w-12 h-12 text-purple-400 flex-shrink-0" />
                    <div className="text-center sm:text-left">
                      <h2 className="text-xl sm:text-2xl font-bold text-purple-400 mb-2">
                        {squadLockExpired ? 'Choose a New Squad' : 'Choose Your Squad'}
                      </h2>
                      <p className="text-gray-300 text-sm sm:text-base">
                        {squadLockExpired ? 'Your 30-day lock period has expired. Time to explore new paths!' : 'Discover your path in the Hoodie Academy'}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                    {squadLockExpired 
                      ? "Your previous squad assignment has expired. You can now choose a new squad and start a fresh 30-day learning journey with different courses and challenges."
                      : "Before you can access courses and join the community, you need to choose your squad. Each squad has unique specialties and learning paths. Take your time to explore and find your perfect match."
                    }
                  </p>
                  <Button
                    size="lg"
                    onClick={() => window.location.href = '/choose-your-squad'}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3"
                  >
                    <Target className="w-5 h-5 mr-2" />
                    {squadLockExpired ? 'Choose New Squad' : 'Explore Squads & Choose Your Path'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Academy Information - Council Notice, Announcements, and Spotlight */}
            <Suspense fallback={
              <Card className="bg-slate-800/50 border-cyan-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center space-x-2 text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Loading academy info...</span>
                  </div>
                </CardContent>
              </Card>
            }>
              <AcademyInfo />
            </Suspense>

            {/* Feedback Tracker - You Asked, We Fixed */}
            <Suspense fallback={
              <Card className="bg-slate-800/50 border-green-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center space-x-2 text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Loading feedback updates...</span>
                  </div>
                </CardContent>
              </Card>
            }>
              <FeedbackTrackerWidget limit={5} showTitle={true} />
            </Suspense>

            {/* Student of the Month */}
            <Suspense fallback={
              <Card className="bg-slate-800/50 border-yellow-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                    <span className="ml-3 text-gray-400">Loading Student of the Month...</span>
                  </div>
                </CardContent>
              </Card>
            }>
              <StudentOfTheWeekWidget />
            </Suspense>

            {/* Lore Log Preview */}
            <Card className="bg-slate-800/50 border-green-500/30">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-green-500/20 rounded-full">
                    <ScrollText className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-green-400 mb-3">📜 Lore Log</h2>
                    <div className="mb-4">
                      <h4 className="font-semibold text-white mb-2">
                        {loreEntries[0].title}
                      </h4>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {loreEntries[0].content}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Entry date: {new Date(loreEntries[0].date).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300 hover:bg-green-500/10">
                      Read Full Lore →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Milestone Tracker */}
            <Card className="bg-slate-800/50 border-blue-500/30">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-500/20 rounded-full">
                    <Target className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-blue-400 mb-3">🎯 Academy Milestones</h2>
                    <div className="space-y-4">
                      {milestones.map((milestone, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-white">{milestone.title}</h4>
                            <span className="text-sm text-blue-400">{milestone.progress}%</span>
                          </div>
                          <p className="text-sm text-gray-400">{milestone.description}</p>
                          <div className="w-full bg-slate-700 rounded-lg overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 transition-all duration-500" 
                              style={{ width: `${milestone.progress}%` }} 
                            />
                          </div>
                          <p className="text-xs text-gray-400">
                            Target: {new Date(milestone.target).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Media Wall */}
            <Card className="bg-slate-800/50 border-pink-500/30">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-pink-500/20 rounded-full">
                    <Camera className="w-6 h-6 text-pink-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-pink-400 mb-3">📸 Media Wall</h2>
                    <p className="text-sm text-gray-300 mb-4">
                      Latest memes, promo flyers, and course visuals submitted by the community.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {mediaWall.map((item, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square bg-slate-700 rounded-lg overflow-hidden border border-slate-600/30 group-hover:border-pink-500/50 transition-colors">
                            <Image
                              src={item.image}
                              alt={item.title}
                              width={200}
                              height={200}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                            <p className="text-xs font-medium text-white truncate">{item.title}</p>
                            <p className="text-xs text-gray-300">by {item.author}</p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className="absolute top-2 right-2 text-xs border-pink-500/30 text-pink-400"
                          >
                            {item.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call-to-Action Footer */}
            <Card className="bg-gradient-to-r from-slate-800/50 to-purple-800/50 border-purple-500/30">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-purple-400 mb-4">🔥 Want to appear on the Home Page?</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">Complete 2 assignments this week</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">Submit a meme or trait concept</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">Score top 3 on leaderboard</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">Be helpful in your squad chat</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SEO Content Block - Hidden Accordion */}
            <div className="mt-12 border-t border-gray-800 pt-6">
              <details className="group cursor-pointer">
                <summary className="text-lg font-semibold text-white hover:opacity-80">
                  Learn More About Hoodie Academy
                </summary>
                <div className="text-gray-300 mt-4 space-y-4 leading-relaxed">
                  <p>
                    Hoodie Academy is the first Web3 education hub designed to make crypto, NFTs, and on-chain
                    trading feel simple, safe, and beginner-friendly. No hype, no confusing jargon, and no
                    financial "guru" energy — just clear lessons created by people who learned this ecosystem
                    the hard way and now want to pass down what actually works.
                  </p>
                  <p>
                    Everything inside Hoodie Academy is built around one idea: learning Web3 becomes easier when
                    you experience it, not just read about it. Instead of long, boring courses, you'll find
                    short missions, squad challenges, quizzes, bounties, and real examples from active
                    Solana-based communities. Whether you're trying to understand wallets, avoid scams, learn
                    technical analysis, or finally grasp what NFTs do beyond "expensive pictures," this is where
                    you start.
                  </p>
                  <p>
                    New Web3 users often get overwhelmed because tutorials skip critical steps, assume too much
                    knowledge, or give advice that doesn't reflect how crypto actually works today. That's why
                    Hoodie Academy focuses on fundamentals first — setting up a wallet safely, understanding how
                    to read a transaction, identifying red flags, and learning how to stay secure on-chain
                    before you ever start clicking buttons or moving funds.
                  </p>
                  <p>
                    As you progress through the Academy, you unlock squad-based paths where you can specialize:
                    creators, traders, analysts, builders, storytellers, and more. These squads give you missions
                    that build real skills while earning XP that tracks your progress. The more you contribute,
                    the more the Academy evolves — it's a living ecosystem shaped by the community.
                  </p>
                  <p>
                    Hoodie Academy is also connected to active NFT communities and Web3 projects, giving you a
                    front-row seat to what's actually happening in the space. Instead of outdated courses or
                    recycled advice, you get education that grows alongside the crypto market.
                  </p>
                  <p>
                    If you've ever wanted to understand Web3 without feeling stupid, lost, or intimidated —
                    Hoodie Academy was built for you. Simple lessons. Real examples. A supportive community. And
                    the tools to learn crypto the right way.
                  </p>
                </div>
              </details>
            </div>

            {/* Footer with Social Links */}
            <footer className="mt-12 border-t border-gray-800 pt-6">
              <div className="flex flex-col gap-2 mt-6">
                <h4 className="font-semibold text-lg mb-1 text-white">Follow Hoodie Academy</h4>
                <ul className="flex flex-col gap-1 text-sm text-gray-300">
                  <li>
                    <a href="https://x.com/HoodieAcademy"
                       target="_blank"
                       rel="noopener noreferrer"
                       className="hover:text-white transition">
                      X (Twitter)
                    </a>
                  </li>
                  <li>
                    <a href="https://www.youtube.com/@LopezWorkflows"
                       target="_blank"
                       rel="noopener noreferrer"
                       className="hover:text-white transition">
                      YouTube
                    </a>
                  </li>
                  <li>
                    <a href="https://www.instagram.com/lopezproductions_"
                       target="_blank"
                       rel="noopener noreferrer"
                       className="hover:text-white transition">
                      Instagram
                    </a>
                  </li>
                  <li>
                    <a href="https://www.linkedin.com/company/lopez-productions"
                       target="_blank"
                       rel="noopener noreferrer"
                       className="hover:text-white transition">
                      LinkedIn
                    </a>
                  </li>
                  <li>
                    <a href="https://facebook.com/"
                       target="_blank"
                       rel="noopener noreferrer"
                       className="hover:text-white transition">
                      Facebook
                    </a>
                  </li>
                </ul>
              </div>
            </footer>
          </main>
        </div>
      </div>
      </div>
    </TokenGate>
  )
}
