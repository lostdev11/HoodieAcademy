'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home, ArrowDown, ArrowRight, LockKeyhole, CheckCircle, LineChart, Clock } from "lucide-react";
import { MilestoneBadge } from "@/components/course-roadmap/MilestoneBadge";
import { RiskArt } from "@/components/course-roadmap/RiskArt";
import { HoodieIcon } from "@/components/icons/HoodieIcon";
import type { CourseCardProps } from "@/components/course-roadmap/CourseCard";
import { CourseCard } from "@/components/course-roadmap/CourseCard";
import { PixelHoodieIcon } from "@/components/icons/PixelHoodieIcon";
import { SaberHoodieIcon } from "@/components/icons/SaberHoodieIcon";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { GlowingCoinIcon } from "@/components/icons/GlowingCoinIcon"; // Added for consistency
import TokenGate from "@/components/TokenGate"; // Import TokenGate
import { useCourseLockTimer } from "@/lib/courseLockTimer";

const socialPathCoursesData: CourseCardProps[] = [
  {
    id: 'meme-coin-mania',
    title: "Meme Coin Mania",
    description: "Analyze meme coin trends via X data, build a mock portfolio, and learn to navigate hype with live price tracking and interactive quizzes.",
    badge: "Moon Merchant",
    emoji: "💰", // Replaced icon with emoji
    pathType: "social",
    href: "/meme-coin-mania",
    riskType: "fomo",
    localStorageKey: "memeCoinManiaProgress",
    totalLessons: 4,
  },
  {
    id: 'community-strategy-social',
    title: "Community Strategy", 
    description: "Master the art of social dynamics to foster loyal and active Web3 communities through interactive lessons and mock DAO voting.",
    badge: "Hoodie Strategist",
    emoji: "🗣️", // Replaced icon with emoji
    pathType: "social", 
    href: "/community-strategy",
    localStorageKey: "communityStrategyProgress", 
    totalLessons: 4,
  },
  {
    id: 'sns',
    title: "SNS Simplified",
    description: "Learn to register and manage .sol domain names through interactive tutorials and simulations in the Solana Name Service ecosystem.",
    badge: "Domain Dominator",
    emoji: "🌐",
    pathType: "social",
    href: "/sns",
    localStorageKey: "snsProgress",
    totalLessons: 2,
  }
];

const techPathCoursesData: CourseCardProps[] = [
    {
        id: 'wallet-wizardry',
        title: "Wallet Wizardry",
        description: "Master wallet setup with interactive quizzes and MetaMask integration.",
        badge: "Vault Keeper",
        emoji: "🔒", // Replaced icon with emoji
        pathType: "tech",
        href: "/wallet-wizardry",
        riskType: "phishing" as "phishing" | "fomo" | undefined,
        localStorageKey: "walletWizardryProgress",
        totalLessons: 4,
    },
    {
        id: 'nft-mastery',
        title: "NFT Mastery",
        description: "Learn the ins and outs of NFTs, from creation to trading and community building, with interactive quizzes and mock minting.",
        badge: "NFT Ninja",
        emoji: "👾", // Replaced icon with emoji
        pathType: "tech",
        href: "/nft-mastery",
        localStorageKey: "nftMasteryProgress",
        totalLessons: 4,
    },
    {
        id: 'community-strategy-tech',
        title: "Community Strategy", 
        description: "Leverage technical skills to build and engage vibrant Web3 communities, mastering DAO governance and social dynamics through interactive lessons.",
        badge: "Hoodie Strategist",
        emoji: "⚔️", // Replaced icon with emoji
        pathType: "tech",
        href: "/community-strategy",
        localStorageKey: "communityStrategyProgress",
        totalLessons: 4,
    }
];

const tradingPathCoursesData: CourseCardProps[] = [
  {
    id: 'technical-analysis',
    title: "Technical Analysis Tactics",
    description: "Master chart patterns, indicators, and leverage trading to navigate market trends.",
    badge: "Chart Commander",
    emoji: "📈", 
    pathType: "tech", // Changed from "trading" to "tech"
    href: "/technical-analysis",
    localStorageKey: "technicalAnalysisProgress",
    totalLessons: 4,
    // riskType: "liquidation" // Optional: if we extend RiskArt
  }
];


const COURSE_LOCAL_STORAGE_KEYS = {
  WALLET_WIZARDRY: "walletWizardryProgress",
  NFT_MASTERY: "nftMasteryProgress",
  MEME_COIN_MANIA: "memeCoinManiaProgress",
  COMMUNITY_STRATEGY: "communityStrategyProgress",
  TECHNICAL_ANALYSIS: "technicalAnalysisProgress", // New key
  SNS: "snsProgress",
};

const ALL_COURSE_KEYS = [
    COURSE_LOCAL_STORAGE_KEYS.WALLET_WIZARDRY,
    COURSE_LOCAL_STORAGE_KEYS.NFT_MASTERY,
    COURSE_LOCAL_STORAGE_KEYS.MEME_COIN_MANIA,
    COURSE_LOCAL_STORAGE_KEYS.COMMUNITY_STRATEGY,
    COURSE_LOCAL_STORAGE_KEYS.TECHNICAL_ANALYSIS, // Added new course key
    COURSE_LOCAL_STORAGE_KEYS.SNS,
];

// Keys for Great Hoodie Hall access (Technical Analysis is not a prerequisite for now)
const ALL_COURSE_KEYS_FOR_HALL_ACCESS = [
    COURSE_LOCAL_STORAGE_KEYS.WALLET_WIZARDRY,
    COURSE_LOCAL_STORAGE_KEYS.NFT_MASTERY,
    COURSE_LOCAL_STORAGE_KEYS.MEME_COIN_MANIA,
    COURSE_LOCAL_STORAGE_KEYS.COMMUNITY_STRATEGY,
    COURSE_LOCAL_STORAGE_KEYS.SNS,
];


const ADMIN_PASSWORD = "darkhoodie";

export default function CoursesPage() {
  const [courseCompletionStatus, setCourseCompletionStatus] = useState<Record<string, { completed: boolean, progress: number }>>({});
  const [allRequiredCoursesCompleted, setAllRequiredCoursesCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Course lock timers
  const walletWizardryLock = useCourseLockTimer('wallet-wizardry');
  const memeCoinManiaLock = useCourseLockTimer('meme-coin-mania');
  const nftMasteryLock = useCourseLockTimer('nft-mastery');
  const communityStrategyLock = useCourseLockTimer('community-strategy');
  const technicalAnalysisLock = useCourseLockTimer('technical-analysis');
  const snsLock = useCourseLockTimer('sns');

  const [isAdminBypass, setIsAdminBypass] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const getCompletionInfo = (key: string): { completed: boolean, progress: number } => {
      if (typeof window !== 'undefined') {
        const savedStatus = localStorage.getItem(key);
        if (savedStatus) {
          try {
            const parsedStatus: Array<'locked' | 'unlocked' | 'completed'> = JSON.parse(savedStatus);
            const courseData = [...techPathCoursesData, ...socialPathCoursesData, ...tradingPathCoursesData].find(c => c.localStorageKey === key);
            const totalLessons = courseData?.totalLessons || 1;
            const completedLessons = parsedStatus.filter(s => s === 'completed').length;
            const progress = Math.round((completedLessons / totalLessons) * 100);
            const isCompleted = progress === 100;
            return { completed: isCompleted, progress };
          } catch (e) {
            console.error("Failed to parse course progress from localStorage for key:", key, e);
            return { completed: false, progress: 0 };
          }
        }
      }
      return { completed: false, progress: 0 };
    };

    const status: Record<string, { completed: boolean, progress: number }> = {};
    ALL_COURSE_KEYS.forEach(key => {
      status[key] = getCompletionInfo(key);
    });
    
    setCourseCompletionStatus(status);
    setAllRequiredCoursesCompleted(ALL_COURSE_KEYS_FOR_HALL_ACCESS.every(key => status[key]?.completed));
    setIsLoading(false);
  }, []);

  const handlePasswordSubmit = () => {
    if (passwordAttempt === ADMIN_PASSWORD) {
      setIsAdminBypass(true);
      setPasswordError("");
      setShowPasswordInput(false);
    } else {
      setPasswordError("Incorrect password. Please try again.");
    }
  };

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-8 px-4 bg-background text-foreground">
            <p>Loading course progress...</p>
        </div>
    );
  }

  const getCourseStatus = (key: string) => {
    return courseCompletionStatus[key] || { completed: false, progress: 0 };
  };

  const socialPathCourses = socialPathCoursesData.map(course => {
    let isLocked = false;
    const isMemeCoinManiaCompleted = getCourseStatus(COURSE_LOCAL_STORAGE_KEYS.MEME_COIN_MANIA).completed;

    if (course.id === 'meme-coin-mania') {
      isLocked = false;
    } else if (course.id === 'community-strategy-social' || course.id === 'sns') {
      isLocked = !isMemeCoinManiaCompleted;
    }
    
    const { completed, progress } = getCourseStatus(course.localStorageKey!);
    
    // Check course lock status
    let courseLockStatus;
    switch (course.id) {
      case 'meme-coin-mania':
        courseLockStatus = memeCoinManiaLock;
        break;
      case 'community-strategy-social':
        courseLockStatus = communityStrategyLock;
        break;
      case 'sns':
        courseLockStatus = snsLock;
        break;
      default:
        courseLockStatus = { isLocked: false, timeRemaining: null };
    }
    
    return { 
      ...course, 
      isLocked: !isAdminBypass && (isLocked || courseLockStatus.isLocked), 
      isCompleted: completed, 
      progress,
      lockStatus: courseLockStatus
    };
  });

  const techPathCourses = techPathCoursesData.map(course => {
    let isLocked = false;
    const isWalletWizardryCompleted = getCourseStatus(COURSE_LOCAL_STORAGE_KEYS.WALLET_WIZARDRY).completed;
    const isNftMasteryCompleted = getCourseStatus(COURSE_LOCAL_STORAGE_KEYS.NFT_MASTERY).completed;

    if (course.id === 'nft-mastery') {
        isLocked = !isWalletWizardryCompleted;
    } else if (course.id === 'community-strategy-tech') {
        isLocked = !isNftMasteryCompleted;
    }

    const { completed, progress } = getCourseStatus(course.localStorageKey!);
    
    // Check course lock status
    let courseLockStatus;
    switch (course.id) {
      case 'wallet-wizardry':
        courseLockStatus = walletWizardryLock;
        break;
      case 'nft-mastery':
        courseLockStatus = nftMasteryLock;
        break;
      case 'community-strategy-tech':
        courseLockStatus = communityStrategyLock;
        break;
      default:
        courseLockStatus = { isLocked: false, timeRemaining: null };
    }
    
    return { 
      ...course, 
      isLocked: !isAdminBypass && (isLocked || courseLockStatus.isLocked), 
      isCompleted: completed, 
      progress,
      lockStatus: courseLockStatus
    };
  });

  const tradingPathTechnicalAnalysis = {
    ...tradingPathCoursesData[0],
    isLocked: !isAdminBypass && technicalAnalysisLock.isLocked,
    isCompleted: getCourseStatus(COURSE_LOCAL_STORAGE_KEYS.TECHNICAL_ANALYSIS).completed,
    progress: getCourseStatus(COURSE_LOCAL_STORAGE_KEYS.TECHNICAL_ANALYSIS).progress,
    lockStatus: technicalAnalysisLock
  };

  const isGreatHoodieHallUnlocked = isAdminBypass || allRequiredCoursesCompleted;


  return (
    <TokenGate>
      <div className="flex flex-col items-center min-h-screen py-8 px-4 bg-background text-foreground">
        <div className="w-full max-w-7xl mb-8 relative">
          <div className="absolute top-0 left-0 z-10 pt-4 pl-4 md:pt-0 md:pl-0">
            <Button variant="outline" size="sm" asChild className="bg-card hover:bg-muted text-accent hover:text-accent-foreground border-accent">
              <Link href="/" className="flex items-center space-x-1">
                <Home size={16} />
                <span>Back to Home</span>
              </Link>
            </Button>
          </div>
          <header className="text-center pt-12 md:pt-8">
            <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 mb-2">
              The Hoodie Path
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Your Quest to Hoodie Scholar.
            </p>
          </header>
        </div>

        <main className="w-full max-w-4xl flex flex-col items-center py-8 space-y-10">

          {/* Stage 1: Initial Courses + Risks */}
          <div className="flex flex-col md:flex-row justify-around items-start w-full space-y-8 md:space-y-0 md:space-x-8">
            {/* Tech Path - Wallet Wizardry */}
            <div className="flex flex-col items-center space-y-4 w-full md:w-96">
               <CourseCard {...techPathCourses.find(c => c.id === 'wallet-wizardry')} pathType="tech" />
               {techPathCourses.find(c => c.id === 'wallet-wizardry')?.lockStatus?.timeRemaining && 
                techPathCourses.find(c => c.id === 'wallet-wizardry')?.lockStatus?.timeRemaining! > 0 && (
                 <div className="w-full p-2 bg-amber-900/30 border border-amber-500/50 rounded-lg text-center">
                   <div className="flex items-center justify-center space-x-2 text-amber-300 text-sm">
                     <Clock size={16} />
                     <span>Lock in: {Math.floor(techPathCourses.find(c => c.id === 'wallet-wizardry')?.lockStatus?.timeRemaining! / 60000)}:{(Math.floor(techPathCourses.find(c => c.id === 'wallet-wizardry')?.lockStatus?.timeRemaining! / 1000) % 60).toString().padStart(2, '0')}</span>
                   </div>
                 </div>
               )}
            </div>

            {/* Social Path - Meme Coin Mania */}
            <div className="flex flex-col items-center space-y-4 w-full md:w-96">
              <CourseCard {...socialPathCourses.find(c => c.id === 'meme-coin-mania')} pathType="social"/>
              {socialPathCourses.find(c => c.id === 'meme-coin-mania')?.lockStatus?.timeRemaining && 
               socialPathCourses.find(c => c.id === 'meme-coin-mania')?.lockStatus?.timeRemaining! > 0 && (
                <div className="w-full p-2 bg-amber-900/30 border border-amber-500/50 rounded-lg text-center">
                  <div className="flex items-center justify-center space-x-2 text-amber-300 text-sm">
                    <Clock size={16} />
                    <span>Lock in: {Math.floor(socialPathCourses.find(c => c.id === 'meme-coin-mania')?.lockStatus?.timeRemaining! / 60000)}:{(Math.floor(socialPathCourses.find(c => c.id === 'meme-coin-mania')?.lockStatus?.timeRemaining! / 1000) % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Trading Path - Technical Analysis (New Independent Path) */}
          <div className="flex flex-col md:flex-row justify-center items-start w-full mt-8">
              <div className="flex flex-col items-center space-y-4 w-full md:w-96">
                   <CourseCard {...tradingPathTechnicalAnalysis} pathType="tech" />
                   {tradingPathTechnicalAnalysis.lockStatus?.timeRemaining && 
                    tradingPathTechnicalAnalysis.lockStatus?.timeRemaining! > 0 && (
                     <div className="w-full p-2 bg-amber-900/30 border border-amber-500/50 rounded-lg text-center">
                       <div className="flex items-center justify-center space-x-2 text-amber-300 text-sm">
                         <Clock size={16} />
                         <span>Lock in: {Math.floor(tradingPathTechnicalAnalysis.lockStatus?.timeRemaining! / 60000)}:{(Math.floor(tradingPathTechnicalAnalysis.lockStatus?.timeRemaining! / 1000) % 60).toString().padStart(2, '0')}</span>
                       </div>
                     </div>
                   )}
              </div>
          </div>


          {/* Arrow Down */}
          <div className="flex justify-center text-3xl md:text-5xl text-cyan-400 opacity-70">
            <ArrowDown strokeWidth={1.5}/>
          </div>

          {/* Stage 2: Mid Courses + Milestones */}
          <div className="flex flex-col md:flex-row justify-around items-start w-full space-y-8 md:space-y-0 md:space-x-8">
            {/* Tech Path - NFT Mastery */}
             <div className="flex flex-col items-center space-y-4 w-full md:w-96">
                  <CourseCard {...techPathCourses.find(c => c.id === 'nft-mastery')} pathType="tech"/>
                  <MilestoneBadge text="Tech Novice" />
             </div>

             {/* Social Path - Community Strategy */}
             <div className="flex flex-col items-center space-y-4 w-full md:w-96">
               <CourseCard {...socialPathCourses.find(c => c.id === 'community-strategy-social')} pathType="social"/>
               <MilestoneBadge text="Social Savvy" />
             </div>
          </div>

          {/* Arrow Down */}
          <div className="flex justify-center text-3xl md:text-5xl text-cyan-400 opacity-70">
            <ArrowDown strokeWidth={1.5}/>
          </div>

          {/* Stage 3: Converging Courses */}
           <div className="flex flex-col md:flex-row justify-around items-start w-full space-y-8 md:space-y-0 md:space-x-8">
             {/* Tech Path - Community Strategy (Tech Focus) */}
             <div className="w-full md:w-96">
                <CourseCard {...techPathCourses.find(c => c.id === 'community-strategy-tech')} pathType="tech" title="Community Strategy (Tech Focus)" />
             </div>

             {/* Social Path - SNS Course */}
             <div className="flex flex-col items-center space-y-4 w-full md:w-96">
                <CourseCard {...socialPathCourses.find(c => c.id === 'sns')} pathType="social" />
             </div>
           </div>

          {/* Arrow Down */}
          <div className="flex justify-center text-3xl md:text-5xl text-cyan-400 opacity-70">
            <ArrowDown strokeWidth={1.5}/>
          </div>

          {/* Stage 4: Great Hoodie Hall */}
          <div className="flex flex-col items-center justify-center w-full max-w-sm md:max-w-md">
             <div className={`bg-card p-6 md:p-8 rounded-xl shadow-2xl border-2 w-full transition-all duration-300
               ${isGreatHoodieHallUnlocked
                  ? "neon-border-green hover:shadow-[0_0_30px_rgba(34,197,94,1)]" 
                  : "border-muted neon-border-gray"}`}>
               <HoodieIcon className={`w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 md:mb-4 ${isGreatHoodieHallUnlocked ? 'text-green-400' : 'text-muted-foreground'}`} />
               <h4 className={`text-xl md:text-2xl font-bold ${isGreatHoodieHallUnlocked ? 'text-green-300' : 'text-muted-foreground'}`}>Great Hoodie Hall</h4>
               <p className={`text-md md:text-lg font-semibold ${isGreatHoodieHallUnlocked ? 'text-foreground' : 'text-muted-foreground/70'} mt-2`}>Hoodie Scholar NFT</p>
               <p className={`text-sm ${isGreatHoodieHallUnlocked ? 'text-muted-foreground' : 'text-muted-foreground/50'} mt-1`}>
                  {isGreatHoodieHallUnlocked ? "The pinnacle of your journey." : "Complete all courses to unlock."}
               </p>
              {isGreatHoodieHallUnlocked ? (
                  <Button asChild size="lg" className="mt-6 w-full bg-green-500 hover:bg-green-600 text-background shadow-lg hover:shadow-xl">
                      <Link href="/great-hoodie-hall">Enter the Hall</Link>
                  </Button>
              ) : (
                  <Button size="lg" disabled className="mt-6 w-full bg-muted text-muted-foreground opacity-50 cursor-not-allowed flex items-center">
                      <LockKeyhole size={18} className="mr-2"/>
                      Locked
                  </Button>
              )}
             </div>
          </div>

          {/* Admin Access Section */}
          {!isAdminBypass && (
              <div className="mt-12 w-full max-w-md p-6 bg-card rounded-xl shadow-lg border border-border">
              {!showPasswordInput && (
                  <Button variant="outline" onClick={() => setShowPasswordInput(true)} className="w-full">
                  Admin Access (Unlock All)
                  </Button>
              )}

              {showPasswordInput && (
                  <div className="flex flex-col items-center space-y-3">
                  <Input 
                      type="password"
                      placeholder="Enter admin password"
                      value={passwordAttempt}
                      onChange={(e) => setPasswordAttempt(e.target.value)}
                      className="text-center"
                  />
                  <Button onClick={handlePasswordSubmit} className="w-full bg-primary hover:bg-primary/90">Submit Password</Button>
                  {passwordError && <p className="text-sm text-red-500 mt-2">{passwordError}</p>}
                  <Button variant="ghost" onClick={() => { setShowPasswordInput(false); setPasswordError(""); setPasswordAttempt("");}} className="text-xs text-muted-foreground">Cancel</Button>
                  </div>
              )}
              </div>
          )}
          {isAdminBypass && (
              <p className="mt-4 text-sm text-green-400">Admin bypass active. All courses unlocked.</p>
          )}
        </main>

        <footer className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            #StayBuilding #StayHODLing
          </p>
        </footer>
      </div>
    </TokenGate>
  );
}
