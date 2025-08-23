"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import { getUserRank, getUserScore, isCurrentUserAdmin, getConnectedWallet } from '@/lib/utils'
import { getSquadName } from '@/utils/squad-storage'
import Image from 'next/image'
// import { getSNSResolver, formatWalletAddress } from '@/services/sns-resolver';
import { Connection } from '@solana/web3.js';

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

const studentsOfTheWeek = [
  {
    name: "@ChainWitch",
    squad: "Speakers",
    achievement: "Submitted 3 trait designs + led a meme challenge",
    avatar: "/images/hoodie-academy-pixel-art-logo.png",
    badge: "🏅"
  },
  {
    name: "@CryptoVoyager",
    squad: "Raiders",
    achievement: "Top 3 leaderboard + completed advanced course",
    avatar: "/images/hoodie-academy-pixel-art-logo.png",
    badge: "⚔️"
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
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [snsDomain, setSnsDomain] = useState<string | null>(null);
  const [isLoadingSns, setIsLoadingSns] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);

  useEffect(() => {
    // Get wallet address from localStorage
    const storedWallet = typeof window !== 'undefined' ? localStorage.getItem('walletAddress') : null;
    if (storedWallet) {
      setWalletAddress(storedWallet);
      
      // Resolve SNS domain for the wallet
      const resolveSnsDomain = async () => {
        try {
          setIsLoadingSns(true);
          // const { getDisplayNameWithSNS } = await import('@/services/sns-resolver');
          // const resolvedName = await getDisplayNameWithSNS(storedWallet);
          const resolvedName = storedWallet;
          console.log('Main page: Resolved SNS name:', resolvedName);
          setSnsDomain(resolvedName);
          
          // Also set user display name if not already set
          const customDisplayName = localStorage.getItem('userDisplayName');
          if (!customDisplayName && resolvedName) {
            setUserDisplayName(resolvedName);
          }
        } catch (error) {
          console.error('Main page: Error resolving SNS domain:', error);
          setSnsDomain(null);
        } finally {
          setIsLoadingSns(false);
        }
      };
      
      resolveSnsDomain();
    }

    // Check if user is admin
    const checkAdminStatus = async () => {
      try {
        console.log('🔍 Main page: Checking admin status...');
        
        // Get wallet address first
        const walletAddress = localStorage.getItem('walletAddress') || localStorage.getItem('connectedWallet');
        if (!walletAddress) {
          setIsAdmin(false);
          return;
        }
        
        // Use direct admin check to bypass RLS policy issues
        const { checkAdminStatusDirect } = await import('@/lib/admin-check');
        const adminStatus = await checkAdminStatusDirect(walletAddress);
        
        console.log('🔍 Main page: Direct admin check result:', adminStatus);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };
    checkAdminStatus();

    // Get squad placement result using utility function
    const userSquadName = getSquadName();
    if (userSquadName) {
      setUserSquad(userSquadName);
      
      // Check if squad lock has expired
      const squadLockTime = localStorage.getItem('squadLockTime');
      if (squadLockTime) {
        const lockTime = parseInt(squadLockTime);
        const now = Date.now();
        const lockExpired = now - lockTime > 24 * 60 * 60 * 1000; // 24 hours
        setSquadLockExpired(lockExpired);
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

  // Rotate spotlight and student of the week
  useEffect(() => {
    const spotlightInterval = setInterval(() => {
      setCurrentSpotlightIndex((prev) => (prev + 1) % academySpotlights.length);
    }, 8000);

    const studentInterval = setInterval(() => {
      setCurrentStudentIndex((prev) => (prev + 1) % studentsOfTheWeek.length);
    }, 12000);

    return () => {
      clearInterval(spotlightInterval);
      clearInterval(studentInterval);
    };
  }, []);

  const handleDisconnect = () => {
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('connectedWallet');
    sessionStorage.removeItem('wifhoodie_verification_session');
    
    if (window.solana?.disconnect) {
      window.solana.disconnect();
    }
    
    setWalletAddress("");
    setSnsDomain(null);
    window.location.href = '/';
  };

  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const normalizeSquadNameForUrl = (name: string): string => {
    return name.replace(/^[🎨🧠🎤⚔️🦅]+\s*/, '').toLowerCase().trim().replace(/\s+/g, '-');
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
            "url": "https://hoodieacademy.xyz",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://hoodieacademy.xyz/courses?search={search_term_string}",
              "query-input": "required name=search_term_string"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Hoodie Academy",
              "url": "https://hoodieacademy.xyz"
            }
          })
        }}
      />
      
      <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Sidebar */}
        <DashboardSidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-slate-800/50 border-b border-cyan-500/30 px-4 py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4 sm:space-x-6">
                {/* Mobile Navigation */}
                <MobileNavigation userSquad={userSquad} isAdmin={isAdmin} />
                
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-cyan-400">🏛️ Hoodie Academy</h1>
                  <p className="text-sm sm:text-base text-gray-300">Home of elite Web3 scholars and the future of decentralized learning</p>
                </div>
                
                {/* Squad Badge */}
                {userSquad && (
                  <div className="hidden md:block">
                    <SquadBadge squad={typeof userSquad === 'string' ? userSquad.replace(/^[🎨🧠🎤⚔️🦅]+\s*/, '') : 'Unknown Squad'} />
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                {/* Wallet Info */}
                {walletAddress && (
                  <div className="flex items-center space-x-2 bg-slate-700/50 px-3 py-2 rounded-lg border border-cyan-500/30 w-full sm:w-auto">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-cyan-400 font-mono">
                      {isLoadingSns ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>Resolving...</span>
                        </div>
                      ) : snsDomain ? (
                        <div className="flex items-center gap-2">
                          <span 
                            className="font-semibold cursor-help" 
                            title={`Wallet: ${walletAddress}`}
                          >
                            {snsDomain}
                          </span>

                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span title={`Full wallet: ${walletAddress}`} className="font-mono">
                            {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                          </span>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSnsDomain(null);
                              setIsLoadingSns(true);
                              // const snsResolver = getSNSResolver();
                              // const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com');
                              // snsResolver.reverseResolve(connection, walletAddress).then(domain => {
                              //   setSnsDomain(domain);
                              //   setIsLoadingSns(false);
                              // }).catch(() => {
                              //   setIsLoadingSns(false);
                              // });
                              setSnsDomain(null);
                              setIsLoadingSns(false);
                            }}
                            className="h-4 w-4 p-0 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10"
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
                
                {/* Admin Button - Always show, but access restricted */}
                <Link href={isAdmin ? "/admin" : "#"}>
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
                  className="text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300 w-full sm:w-auto min-h-[44px]"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
                
                {/* Time */}
                <div className="text-right w-full sm:w-auto">
                  <div className="text-sm text-gray-400">Current Time</div>
                  <div className="text-lg text-cyan-400 font-mono">{currentTime}</div>
                </div>
              </div>
            </div>
          </header>

          {/* Home Page Content */}
          <main className="flex-1 px-4 py-6 space-y-6">
            {/* Welcome Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-cyan-400 mb-2">🏛️ Welcome to Hoodie Academy</h1>
              <p className="text-muted-foreground text-lg">Your entry into the elite Web3 scholars campus</p>
            </div>

            {/* Squad Assignment CTA - Only show if user hasn't been assigned a squad */}
            {!userSquad && (
              <Card className={`bg-gradient-to-r from-purple-800/50 to-pink-800/50 border-purple-500/30 ${squadLockExpired ? '' : 'animate-pulse'}`}>
                <CardContent className="p-8 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <Trophy className="w-12 h-12 text-purple-400 mr-4" />
                    <div>
                      <h2 className="text-2xl font-bold text-purple-400 mb-2">
                        {squadLockExpired ? 'Choose a New Squad' : 'Choose Your Squad'}
                      </h2>
                      <p className="text-gray-300">
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

            {/* Top Council Notice */}
            <Card className="border-l-4 border-amber-400 bg-slate-800/50">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <Shield className="w-6 h-6 text-amber-400 mt-1" />
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-amber-400 mb-2">🛡️ Council Notice</h2>
                    <p className="text-sm leading-relaxed text-gray-300">
                      <strong>Hoodie Scholar Council Directive (January 28, 2025):</strong><br />
                      Phase 3 rollout is live. Squad leaders must submit their launch assignment by Friday. 
                      Students, complete your weekly missions to earn badge upgrades. New lore entries are being 
                      added to the Hall of Records daily.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academy Spotlight */}
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-purple-500/20 rounded-full">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-purple-400 mb-3">🧿 Academy Spotlight</h2>
                    <blockquote className="italic text-lg text-gray-300 mb-3 leading-relaxed">
                      "{academySpotlights[currentSpotlightIndex].quote}"
                    </blockquote>
                    <div className="flex items-center space-x-3">
                      <Image
                        src={academySpotlights[currentSpotlightIndex].avatar}
                        alt="Spotlight Avatar"
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <div>
                        <p className="text-sm font-medium text-purple-400">
                          – {academySpotlights[currentSpotlightIndex].author}
                        </p>
                        <p className="text-xs text-gray-400">
                          {academySpotlights[currentSpotlightIndex].role}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Student of the Week */}
            <Card className="bg-slate-800/50 border-yellow-500/30">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Image
                      src={studentsOfTheWeek[currentStudentIndex].avatar}
                      alt="Student PFP"
                      width={64}
                      height={64}
                      className="rounded-full border-2 border-yellow-500/50"
                    />
                    <div className="absolute -top-2 -right-2 text-2xl">
                      {studentsOfTheWeek[currentStudentIndex].badge}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-yellow-400 mb-1">
                      🏅 Student of the Week: {studentsOfTheWeek[currentStudentIndex].name}
                    </h3>
                    <p className="text-sm text-gray-300 mb-2">
                      {studentsOfTheWeek[currentStudentIndex].achievement}
                    </p>
                    <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
                      {studentsOfTheWeek[currentStudentIndex].squad} Squad
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
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
          </main>
        </div>
      </div>
    </TokenGate>
  )
}