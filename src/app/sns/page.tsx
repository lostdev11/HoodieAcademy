"use client";
      import { useState, useEffect } from "react";
      import TokenGate from "@/components/TokenGate";
      import { Button } from "@/components/ui/button";
      import Link from "next/link";
      import { ArrowLeft } from "lucide-react";
      import axios from "axios";

      export default function SNSCourse() {
        const [walletAddress, setWalletAddress] = useState<string | null>(null);
        const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});

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
            <div className="flex flex-col items-center min-h-screen py-8 px-4 bg-gray-900 text-gray-300">
              <div className="w-full max-w-5xl mb-8 relative">
                <div className="absolute top-0 left-0 z-10 pt-4 pl-4">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="bg-gray-800 hover:bg-gray-700 text-cyan-400 hover:text-cyan-300 border-cyan-400"
                  >
                    <Link href="/" className="flex items-center space-x-1">
                      <ArrowLeft size={16} />
                      <span>Back to Home</span>
                    </Link>
                  </Button>
                </div>
                <header className="text-center pt-16">
                  <h1 className="text-4xl font-bold text-cyan-400 mb-2">Solana Name Service (SNS)</h1>
                  <p className="text-md text-gray-400">Own Your Web3 Identity</p>
                </header>
              </div>
              <main className="w-full max-w-2xl text-center">
                <h2 className="text-2xl font-bold text-purple-400 mb-4">Lessons</h2>
                <div className="grid grid-cols-1 gap-4">
                  {lessons.map((lesson) => (
                    <div key={lesson.id} className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="text-lg font-bold text-cyan-400">{lesson.title}</h3>
                      <p className="text-gray-300">{lesson.description}</p>
                      <Button
                        asChild
                        className="bg-gradient-to-r from-green-600 to-purple-600 text-white mt-2 hover:from-green-500 hover:to-purple-500"
                      >
                        <Link href={`/sns/${lesson.id}`}>
                          {completedLessons[lesson.id] ? "Review Lesson" : "Start Lesson"}
                        </Link>
                      </Button>
                      {completedLessons[lesson.id] && (
                        <p className="text-green-400 mt-2">Completed</p>
                      )}
                    </div>
                  ))}
                </div>
              </main>
              <footer className="mt-12 text-center">
                <p className="text-sm text-gray-400">#StayBuilding #StayHODLing</p>
              </footer>
            </div>
          </TokenGate>
        );
      }