'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home, ArrowDown, ArrowRight, LockKeyhole, CheckCircle, LineChart, Clock, Filter } from "lucide-react";
import { MilestoneBadge } from "@/components/course-roadmap/MilestoneBadge";
import { RiskArt } from "@/components/course-roadmap/RiskArt";
import { HoodieIcon } from "@/components/icons/HoodieIcon";
import type { CourseCardProps } from "@/components/course-roadmap/CourseCard";
import { CourseCard } from "@/components/course-roadmap/CourseCard";
import { PixelHoodieIcon } from "@/components/icons/PixelHoodieIcon";
import { SaberHoodieIcon } from "@/components/icons/SaberHoodieIcon";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { GlowingCoinIcon } from "@/components/icons/GlowingCoinIcon";
import TokenGate from "@/components/TokenGate";
import { Card, CardContent } from "@/components/ui/card";
import { squadTracks, getSquadForCourse, getCoursesForSquad } from "@/lib/squadData";

// Simple course data
const allCourses: Array<{
  id: string;
  title: string;
  description: string;
  badge: string;
  emoji: string;
  pathType: "tech" | "social" | "converged";
  href: string;
  localStorageKey?: string;
  totalLessons?: number;
}> = [
  {
    id: 'wallet-wizardry',
    title: "Wallet Wizardry",
    description: "Master wallet setup with interactive quizzes and MetaMask integration.",
    badge: "Vault Keeper",
    emoji: "🔒",
    pathType: "tech",
    href: "/wallet-wizardry",
    localStorageKey: "walletWizardryProgress",
    totalLessons: 4,
  },
  {
    id: 'nft-mastery',
    title: "NFT Mastery",
    description: "Learn the ins and outs of NFTs, from creation to trading and community building, with interactive quizzes and mock minting.",
    badge: "NFT Ninja",
    emoji: "👾",
    pathType: "tech",
    href: "/nft-mastery",
    localStorageKey: "nftMasteryProgress",
    totalLessons: 4,
  },
  {
    id: 'meme-coin-mania',
    title: "Meme Coin Mania",
    description: "Analyze meme coin trends via X data, build a mock portfolio, and learn to navigate hype with live price tracking and interactive quizzes.",
    badge: "Moon Merchant",
    emoji: "💰",
    pathType: "social",
    href: "/meme-coin-mania",
    localStorageKey: "memeCoinManiaProgress",
    totalLessons: 4,
  },
  {
    id: 'community-strategy',
    title: "Community Strategy", 
    description: "Master the art of social dynamics to foster loyal and active Web3 communities through interactive lessons and mock DAO voting.",
    badge: "Hoodie Strategist",
    emoji: "🗣️",
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
  },
  {
    id: 'technical-analysis',
    title: "Technical Analysis Tactics",
    description: "Master chart patterns, indicators, and leverage trading to navigate market trends.",
    badge: "Chart Commander",
    emoji: "📈", 
    pathType: "tech",
    href: "/technical-analysis",
    localStorageKey: "technicalAnalysisProgress",
    totalLessons: 4,
  }
];

const ADMIN_PASSWORD = "darkhoodie";

type FilterType = 'all' | 'squads' | 'completed';

export default function CoursesPage() {
  const [courseCompletionStatus, setCourseCompletionStatus] = useState<Record<string, { completed: boolean, progress: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isAdminBypass, setIsAdminBypass] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedSquad, setSelectedSquad] = useState<string | null>(null);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    const getCompletionInfo = (key: string): { completed: boolean, progress: number } => {
      if (typeof window !== 'undefined') {
        const savedStatus = localStorage.getItem(key);
        if (savedStatus) {
          try {
            const parsedStatus: Array<'locked' | 'unlocked' | 'completed'> = JSON.parse(savedStatus);
            const courseData = allCourses.find(c => c.localStorageKey === key);
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
    allCourses.forEach(course => {
      if (course.localStorageKey) {
        status[course.localStorageKey] = getCompletionInfo(course.localStorageKey);
      }
    });
    
    console.log('Courses page loaded:', {
      totalCourses: allCourses.length,
      courseStatus: status,
      isLoading: false,
      allCourses: allCourses.map(c => ({ id: c.id, title: c.title }))
    });
    
    setCourseCompletionStatus(status);
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

  // Filter courses based on active filter and selected squad
  const getFilteredCourses = () => {
    switch (activeFilter) {
      case 'completed':
        return allCourses.filter(course => 
          course.localStorageKey && courseCompletionStatus[course.localStorageKey]?.completed
        );
      case 'squads':
        if (selectedSquad) {
          const squadCourseIds = getCoursesForSquad(selectedSquad);
          return allCourses.filter(course => squadCourseIds.includes(course.id));
        }
        return allCourses;
      default:
        return allCourses;
    }
  };

  const completedCoursesCount = allCourses.filter(course => 
    course.localStorageKey && courseCompletionStatus[course.localStorageKey]?.completed
  ).length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <span className="text-cyan-400 text-2xl animate-pulse">Loading courses...</span>
      </div>
    );
  }

  return (
    <TokenGate>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900 to-slate-900"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="relative z-10 p-8">
          {/* Header */}
          <div className="text-center mb-12">
            {/* Home Navigation Button */}
            <div className="flex justify-start mb-6">
              <Button
                asChild
                variant="outline"
                className="bg-slate-800/50 hover:bg-slate-700/50 text-cyan-400 hover:text-cyan-300 border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300"
              >
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent glow-text">
              The Hoodie Path
            </h1>
            <p className="text-xl text-gray-300 mb-2">Your Quest to Hoodie Scholar.</p>
            <p className="text-cyan-300 text-lg">
              Current Time: <span className="text-green-400 font-mono">{currentTime}</span>
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-2 bg-slate-800/50 p-2 rounded-lg border border-cyan-500/30">
              <Button
                variant={activeFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setActiveFilter('all');
                  setSelectedSquad(null);
                }}
                className={activeFilter === 'all' 
                  ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
                  : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                }
              >
                All Courses
              </Button>
              <Button
                variant={activeFilter === 'squads' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveFilter('squads')}
                className={activeFilter === 'squads' 
                  ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
                  : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                }
              >
                Squad Tracks
              </Button>
              <Button
                variant={activeFilter === 'completed' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveFilter('completed')}
                className={activeFilter === 'completed' 
                  ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
                  : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                }
              >
                Completed ({completedCoursesCount})
              </Button>
            </div>
          </div>

          {/* Squad Selection (when squads filter is active) */}
          {activeFilter === 'squads' && (
            <div className="flex justify-center mb-8">
              <div className="flex flex-wrap gap-3 max-w-4xl">
                {squadTracks.map((squad) => (
                  <Button
                    key={squad.id}
                    variant={selectedSquad === squad.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSquad(selectedSquad === squad.id ? null : squad.id)}
                    className={`${selectedSquad === squad.id 
                      ? `${squad.bgColor} ${squad.borderColor} border` 
                      : 'bg-slate-800/50 border-slate-600/50 text-gray-300 hover:bg-slate-700/50'
                    } transition-all duration-300`}
                  >
                    <span className="mr-2">{squad.icon}</span>
                    {squad.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Admin bypass section */}
          {!isAdminBypass && (
            <div className="text-center mb-8">
              <Button
                onClick={() => setShowPasswordInput(true)}
                variant="outline"
                className="bg-slate-800/50 hover:bg-slate-700/50 text-cyan-400 hover:text-cyan-300 border-cyan-500/30"
              >
                Admin Bypass
              </Button>
            </div>
          )}

          {/* Revoke bypass section */}
          {isAdminBypass && (
            <div className="text-center mb-8">
              <Card className="max-w-md mx-auto bg-slate-800/50 border-2 border-green-500/30 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center space-x-3">
                    <span className="text-green-400 text-lg">🔓</span>
                    <span className="text-green-400 font-semibold">Admin Bypass Active</span>
                    <Button
                      onClick={() => setIsAdminBypass(false)}
                      variant="outline"
                      size="sm"
                      className="bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border-red-500/50 hover:border-red-400/50"
                    >
                      Revoke Bypass
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {showPasswordInput && (
            <Card className="max-w-md mx-auto mb-8 bg-slate-800/50 border-2 border-cyan-500/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-cyan-400 mb-4">Admin Access</h3>
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={passwordAttempt}
                  onChange={(e) => setPasswordAttempt(e.target.value)}
                  className="mb-4 bg-slate-700/50 border-cyan-500/30 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                />
                {passwordError && <p className="text-red-400 text-sm mb-4">{passwordError}</p>}
                <div className="flex space-x-2">
                  <Button onClick={handlePasswordSubmit} className="bg-cyan-600 hover:bg-cyan-700">
                    Submit
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowPasswordInput(false);
                      setPasswordAttempt("");
                      setPasswordError("");
                    }}
                    variant="outline"
                    className="border-cyan-500/30 text-cyan-400 hover:text-cyan-300"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Courses Display */}
          {activeFilter === 'squads' && selectedSquad ? (
            // Show courses for selected squad
            <div className="space-y-8">
              {squadTracks.filter(s => s.id === selectedSquad).map((squad) => (
                <div key={squad.id} className="space-y-6">
                  <div className="text-center">
                    <h2 className={`text-3xl font-bold mb-2 ${squad.color} glow-text flex items-center justify-center gap-3`}>
                      <span>{squad.icon}</span>
                      {squad.name}
                    </h2>
                    <p className="text-gray-300 max-w-2xl mx-auto">{squad.description}</p>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {getFilteredCourses().map((course) => (
                      <CourseCard
                        key={course.id}
                        id={course.id}
                        title={course.title}
                        description={course.description}
                        badge={course.badge}
                        emoji={course.emoji}
                        pathType={course.pathType}
                        href={course.href}
                        isCompleted={course.localStorageKey ? courseCompletionStatus[course.localStorageKey]?.completed : false}
                        progress={course.localStorageKey ? courseCompletionStatus[course.localStorageKey]?.progress : 0}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Show all courses or completed courses
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {getFilteredCourses().map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description}
                  badge={course.badge}
                  emoji={course.emoji}
                  pathType={course.pathType}
                  href={course.href}
                  isCompleted={course.localStorageKey ? courseCompletionStatus[course.localStorageKey]?.completed : false}
                  progress={course.localStorageKey ? courseCompletionStatus[course.localStorageKey]?.progress : 0}
                />
              ))}
            </div>
          )}

          {/* Great Hoodie Hall */}
          <div className="text-center mt-12">
            <Card className="max-w-2xl mx-auto bg-slate-800/80 border-2 border-yellow-500/40 backdrop-blur-sm shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:shadow-[0_0_40px_rgba(234,179,8,0.5)] transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center justify-center mb-4">
                  <span className="text-4xl mr-3">🏆</span>
                  <h2 className="text-3xl font-bold text-yellow-400 glow-text">Great Hoodie Hall</h2>
                </div>
                <p className="text-gray-300 mb-6">
                  Access exclusive resources, advanced strategies, and the Hoodie community hub.
                </p>
                <Button
                  asChild
                  className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)] transition-all duration-300 transform hover:scale-105"
                >
                  <Link href="/great-hoodie-hall">
                    Enter the Hall
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Footer hashtags */}
          <div className="mt-12 text-cyan-400/70 text-sm text-center">#StayBuilding #StayHODLing</div>
        </div>
        <style jsx global>{`
          .glow-text {
            text-shadow: 0 0 10px currentColor;
          }
        `}</style>
      </div>
    </TokenGate>
  );
}
