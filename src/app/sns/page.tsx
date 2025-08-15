'use client';
export const dynamic = "force-static";

import { useState, useEffect } from "react";
      import TokenGate from "@/components/TokenGate";
      import { Button } from "@/components/ui/button";
      import Link from "next/link";
      import { ArrowLeft } from "lucide-react";
      import axios from "axios";
      import { Card, CardContent } from "@/components/ui/card";

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

        const lessons = [
          { id: "lesson1", title: "Registering .sol Domains", description: "Learn how to register and manage .sol domains with SNS." },
          { id: "lesson2", title: "Mastering the $SNS Token", description: "Understand the $SNS token and its LFG campaign rewards." },
        ];

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
                    Solana Name Service (SNS)
                  </h1>
                  <p className="text-xl text-gray-300 mb-2">Own Your Web3 Identity</p>
                  <p className="text-cyan-300 text-lg">
                    Current Time: <span className="text-green-400 font-mono">{currentTime}</span>
                  </p>
                </div>
                {/* Main content: lessons, quizzes, wallet, etc. */}
                <div className="max-w-2xl mx-auto">
                  {/* Existing lessons logic and UI goes here, wrapped in Card if needed */}
                  {/* ...existing lesson navigation, quiz, wallet connect, etc... */}
                  <h2 className="text-2xl font-bold text-purple-400 mb-4">Lessons</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {lessons.map((lesson) => (
                      <Card key={lesson.id} className="bg-slate-800/80 border-2 border-cyan-500/40 backdrop-blur-sm shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                        <CardContent className="p-4">
                          <h3 className="text-lg font-bold text-cyan-400">{lesson.title}</h3>
                          <p className="text-gray-300">{lesson.description}</p>
                          <Button
                            asChild
                            className="bg-gradient-to-r from-green-600 to-purple-600 text-white mt-2 hover:from-green-500 hover:to-purple-500"
                          >
                            <a href={`/sns/${lesson.id}`}>
                              {completedLessons[lesson.id] ? "Review Lesson" : "Start Lesson"}
                            </a>
                          </Button>
                          {completedLessons[lesson.id] && (
                            <p className="text-green-400 mt-2">Completed</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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