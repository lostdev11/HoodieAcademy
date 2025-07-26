"use client";
import { useState, useEffect } from "react";
import TokenGate from "@/components/TokenGate";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Lock, Unlock, Crown, Star, BookOpen, Video, FileText, Users } from "lucide-react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Course {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  access: 'free' | 'hoodie' | 'elite';
  modules: Module[];
  estimatedTime: string;
  icon: React.ReactNode;
}

interface Module {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'exercise' | 'assignment' | 'case-study';
  duration: string;
}

export default function SNSCourse() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const { solana } = window;
    if (solana && solana.isPhantom) {
      solana.connect({ onlyIfTrusted: true }).then((response: { publicKey: { toString: () => string } }) => {
        setWalletAddress(response.publicKey.toString());
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (walletAddress) {
      fetchProgress();
    }
  }, [walletAddress]);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const fetchProgress = async () => {
    if (!walletAddress) return;
    try {
      const response = await axios.get(`/api/progress/${walletAddress}`);
      setCompletedLessons(response.data.courses?.["sns"] || {});
    } catch (error) {
      console.error("Progress fetch failed:", error);
    }
  };

  const courses: Course[] = [
    {
      id: "h100",
      title: "H100 🧠 Domain Psychology 101: Why Names Matter",
      description: "Understanding the psychology behind successful domain names and why they matter in Web3.",
      level: 'beginner',
      access: 'free',
      estimatedTime: "2-3 hours",
      icon: <BookOpen className="w-6 h-6" />,
      modules: [
        {
          id: "h100-m1",
          title: "The Psychology of Naming",
          description: "Learn why certain names resonate and others don't",
          type: 'video',
          duration: "30 min"
        },
        {
          id: "h100-m2",
          title: "Memorability Factors",
          description: "What makes a domain name memorable and valuable",
          type: 'exercise',
          duration: "45 min"
        }
      ]
    },
    {
      id: "h120",
      title: "H120 🗾️ Domain Archetypes & Use Cases",
      description: "Learn to recognize the core use cases behind successful domains. Is it a meme? A brand? A bot handle?",
      level: 'beginner',
      access: 'free',
      estimatedTime: "3-4 hours",
      icon: <Star className="w-6 h-6" />,
      modules: [
        {
          id: "h120-m1",
          title: "The 6 Archetypes",
          description: "Grail Names, Meme Domains, Bot Handles, Brand Anchors, Alpha Drops, Lore Domains",
          type: 'video',
          duration: "45 min"
        },
        {
          id: "h120-m2",
          title: "Trait Dissection",
          description: "Length, word type, cultural reference, rhythm analysis",
          type: 'exercise',
          duration: "60 min"
        },
        {
          id: "h120-m3",
          title: "Flip Mechanics",
          description: "Signs a domain is flip-ready, holding vs flipping logic",
          type: 'case-study',
          duration: "90 min"
        },
        {
          id: "h120-m4",
          title: "Hold / Flip / Forget Matrix",
          description: "Sort domains into H/F/F buckets with rationale",
          type: 'assignment',
          duration: "120 min"
        }
      ]
    },
    {
      id: "h150",
      title: "H150 🔀 LoreCrafting with Subdomains",
      description: "Turn any name into a living world. Learn how to create internal lore and networks using subdomains.",
      level: 'beginner',
      access: 'free',
      estimatedTime: "2-3 hours",
      icon: <Users className="w-6 h-6" />,
      modules: [
        {
          id: "h150-m1",
          title: "Subdomain Theory",
          description: "Technical overview and narrative function",
          type: 'video',
          duration: "30 min"
        },
        {
          id: "h150-m2",
          title: "Network Structures",
          description: "Example frameworks and naming schemas",
          type: 'case-study',
          duration: "45 min"
        },
        {
          id: "h150-m3",
          title: "Squad & Worldbuilding",
          description: "Design prompts for shared naming schemas",
          type: 'exercise',
          duration: "60 min"
        },
        {
          id: "h150-m4",
          title: "Fictional Expansion",
          description: "Write lore pieces for subdomains",
          type: 'assignment',
          duration: "90 min"
        }
      ]
    },
    {
      id: "h200",
      title: "H200 🛠️ SNS Strategy: Domains as Digital Real Estate",
      description: "Domains aren't just words. They're assets. Understand utility, delegation, and the future of digital real estate.",
      level: 'intermediate',
      access: 'hoodie',
      estimatedTime: "3-4 hours",
      icon: <Lock className="w-6 h-6" />,
      modules: [
        {
          id: "h200-m1",
          title: "The Real Estate Mindset",
          description: "Valuing domains as land: location, uniqueness, scalability",
          type: 'video',
          duration: "45 min"
        },
        {
          id: "h200-m2",
          title: "Utility Walkthrough",
          description: "Delegation, redirect, subleasing with SNS tools",
          type: 'video',
          duration: "60 min"
        },
        {
          id: "h200-m3",
          title: "Retailstar Case Study",
          description: "Analysis of successful domain strategies",
          type: 'case-study',
          duration: "90 min"
        },
        {
          id: "h200-m4",
          title: "Strategic Vaulting",
          description: "Design vault strategies for domain portfolios",
          type: 'assignment',
          duration: "120 min"
        }
      ]
    },
    {
      id: "h220",
      title: "H220 💰 Budget Bidding & Sniping 101",
      description: "You don't need a big bankroll to win. Learn our sniper tactics for spotting undervalued listings.",
      level: 'intermediate',
      access: 'hoodie',
      estimatedTime: "2-3 hours",
      icon: <Lock className="w-6 h-6" />,
      modules: [
        {
          id: "h220-m1",
          title: "The Undervalued Framework",
          description: "What makes a listing undervalued and contextual pricing",
          type: 'video',
          duration: "30 min"
        },
        {
          id: "h220-m2",
          title: "Sniper Toolkit",
          description: "SNS filters, Birdeye, FlipStats, price ladder reading",
          type: 'video',
          duration: "45 min"
        },
        {
          id: "h220-m3",
          title: "Meta Tracking",
          description: "Watching trait trends and social activity cycles",
          type: 'exercise',
          duration: "60 min"
        },
        {
          id: "h220-m4",
          title: "Bid Laddering Exercise",
          description: "Build 3-tier bid ladders for live listings",
          type: 'assignment',
          duration: "90 min"
        }
      ]
    },
    {
      id: "h250",
      title: "H250 🔗 Multi-Use Domains & Team Operations",
      description: "Your domain can serve multiple functions: bot layer, brand anchor, squad dashboard. Learn to structure your stack for scale.",
      level: 'intermediate',
      access: 'hoodie',
      estimatedTime: "3-4 hours",
      icon: <Lock className="w-6 h-6" />,
      modules: [
        {
          id: "h250-m1",
          title: "Multi-Use Case Theory",
          description: "Categories: Content, Access, Automation, Subdomains",
          type: 'video',
          duration: "45 min"
        },
        {
          id: "h250-m2",
          title: "Structural Planning",
          description: "Top-down vs modular stack design with examples",
          type: 'case-study',
          duration: "60 min"
        },
        {
          id: "h250-m3",
          title: "DAO & Squad Stacks",
          description: "Build naming plans for DAOs with multiple functions",
          type: 'assignment',
          duration: "120 min"
        }
      ]
    },
    {
      id: "h300",
      title: "H300 🧠 Narrative Economics: Naming as a Meme Asset",
      description: "The value of a name isn't just in function—it's in the feeling it evokes. Learn to quantify narrative.",
      level: 'expert',
      access: 'elite',
      estimatedTime: "2-3 hours",
      icon: <Crown className="w-6 h-6" />,
      modules: [
        {
          id: "h300-m1",
          title: "The Narrative Premium",
          description: "Vibes = Value, names as story fragments",
          type: 'video',
          duration: "30 min"
        },
        {
          id: "h300-m2",
          title: "Comparative Analysis",
          description: "Breakdown of mythic vs functional domains",
          type: 'case-study',
          duration: "45 min"
        },
        {
          id: "h300-m3",
          title: "RetailStar Strategy",
          description: "Pricing on emotion and positioning as collectibles",
          type: 'video',
          duration: "60 min"
        },
        {
          id: "h300-m4",
          title: "Meme Domain Scoring",
          description: "Score domains 1-5 based on emotional gravity",
          type: 'assignment',
          duration: "90 min"
        }
      ]
    },
    {
      id: "h400",
      title: "H400 🎯 Advanced Domain Psychology: Positioning & Power",
      description: "Understand how names carry energy, power, and alignment. Choose names that feel inevitable.",
      level: 'expert',
      access: 'elite',
      estimatedTime: "2-3 hours",
      icon: <Crown className="w-6 h-6" />,
      modules: [
        {
          id: "h400-m1",
          title: "Archetypal Alignment",
          description: "The 4 Forces: Hero, Villain, Oracle, Outlaw",
          type: 'video',
          duration: "45 min"
        },
        {
          id: "h400-m2",
          title: "Power Mapping",
          description: "Positioning names for dominance, secrecy, or status",
          type: 'exercise',
          duration: "60 min"
        },
        {
          id: "h400-m3",
          title: "Vibe Alignment Exercise",
          description: "Build 5-domain lineup using only vibe alignment",
          type: 'assignment',
          duration: "120 min"
        }
      ]
    },
    {
      id: "h500",
      title: "H500 ⚔️ Domain Warfare & Ecosystem Domination",
      description: "Master the long game. Build multi-domain empires that stretch across chains, brands, and narratives.",
      level: 'expert',
      access: 'elite',
      estimatedTime: "3-4 hours",
      icon: <Crown className="w-6 h-6" />,
      modules: [
        {
          id: "h500-m1",
          title: "The Naming War",
          description: "Defensive names, offensive buys, narrative traps",
          type: 'video',
          duration: "45 min"
        },
        {
          id: "h500-m2",
          title: "Multi-Eco Expansion",
          description: ".sol, .sui, .eth differences and overlap strategies",
          type: 'case-study',
          duration: "60 min"
        },
        {
          id: "h500-m3",
          title: "DAO Planning Frameworks",
          description: "Assigning ops, lore, and utility roles to names",
          type: 'exercise',
          duration: "90 min"
        },
        {
          id: "h500-m4",
          title: "Ecosystem Expansion Plan",
          description: "Design 3-ecosystem expansion with 5 domains",
          type: 'assignment',
          duration: "120 min"
        }
      ]
    }
  ];

  const getAccessIcon = (access: string) => {
    switch (access) {
      case 'free':
        return <Unlock className="w-4 h-4 text-green-400" />;
      case 'hoodie':
        return <Lock className="w-4 h-4 text-yellow-400" />;
      case 'elite':
        return <Crown className="w-4 h-4 text-purple-400" />;
      default:
        return <Lock className="w-4 h-4" />;
    }
  };

  const getLevelBadge = (level: string) => {
    const colors = {
      beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
      intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      advanced: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      expert: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };
    return colors[level as keyof typeof colors] || colors.beginner;
  };

  return (
    <TokenGate>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900 to-slate-900"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="relative z-10 p-8">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              asChild
              variant="outline"
              className="bg-slate-800/50 hover:bg-slate-700/50 text-cyan-400 hover:text-cyan-300 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300"
            >
              <Link href="/courses">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Courses
              </Link>
            </Button>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent glow-text">
              SNS Curriculum v1
            </h1>
            <p className="text-xl text-gray-300 mb-2">Your Journey From Domain Noob to Naming Savant</p>
            <p className="text-cyan-300 text-lg">
              Current Time: <span className="text-green-400 font-mono">{currentTime}</span>
            </p>
          </div>

          {/* Course Grid */}
          <div className="max-w-7xl mx-auto">
            {/* Free Courses Section */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Unlock className="w-6 h-6 text-green-400" />
                <h2 className="text-2xl font-bold text-green-400">🟢 Free Courses — Open to All</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.filter(course => course.access === 'free').map((course) => (
                  <Card key={course.id} className="bg-slate-800/80 border-2 border-green-500/40 backdrop-blur-sm shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_40px_rgba(34,197,94,0.5)] transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {course.icon}
                          <CardTitle className="text-green-400">{course.title}</CardTitle>
                        </div>
                        {getAccessIcon(course.access)}
                      </div>
                      <Badge className={getLevelBadge(course.level)}>
                        {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 mb-4">{course.description}</p>
                      <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                        <span>⏱️ {course.estimatedTime}</span>
                        <span>📚 {course.modules.length} modules</span>
                      </div>
                      <Button
                        asChild
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500"
                      >
                        <Link href={`/sns/${course.id}`}>
                          Start Course
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Hoodie-Gated Courses Section */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-6 h-6 text-yellow-400" />
                <h2 className="text-2xl font-bold text-yellow-400">🔹 Hoodie-Gated Courses — Unlock the Alpha</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.filter(course => course.access === 'hoodie').map((course) => (
                  <Card key={course.id} className="bg-slate-800/80 border-2 border-yellow-500/40 backdrop-blur-sm shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:shadow-[0_0_40px_rgba(234,179,8,0.5)] transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {course.icon}
                          <CardTitle className="text-yellow-400">{course.title}</CardTitle>
                        </div>
                        {getAccessIcon(course.access)}
                      </div>
                      <Badge className={getLevelBadge(course.level)}>
                        {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 mb-4">{course.description}</p>
                      <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                        <span>⏱️ {course.estimatedTime}</span>
                        <span>📚 {course.modules.length} modules</span>
                      </div>
                      <Button
                        asChild
                        className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white hover:from-yellow-500 hover:to-orange-500"
                      >
                        <Link href={`/sns/${course.id}`}>
                          Unlock with Hoodie
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Elite Courses Section */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Crown className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-bold text-purple-400">🌹 Elite Courses — Squad Leader Track</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.filter(course => course.access === 'elite').map((course) => (
                  <Card key={course.id} className="bg-slate-800/80 border-2 border-purple-500/40 backdrop-blur-sm shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {course.icon}
                          <CardTitle className="text-purple-400">{course.title}</CardTitle>
                        </div>
                        {getAccessIcon(course.access)}
                      </div>
                      <Badge className={getLevelBadge(course.level)}>
                        {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 mb-4">{course.description}</p>
                      <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                        <span>⏱️ {course.estimatedTime}</span>
                        <span>📚 {course.modules.length} modules</span>
                      </div>
                      <Button
                        asChild
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500"
                      >
                        <Link href={`/sns/${course.id}`}>
                          Elite Access Required
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Footer hashtags */}
          <div className="mt-12 text-cyan-400/70 text-sm text-center">#StayBuilding #StayHODLing #DomainMastery</div>
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