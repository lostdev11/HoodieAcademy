"use client";
import { useState, useEffect } from "react";
import TokenGate from "@/components/TokenGate";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import axios from "axios";

interface PhantomResponse {
  publicKey: {
    toString: () => string;
  };
}

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: (options: { onlyIfTrusted: boolean }) => Promise<PhantomResponse>;
    };
  }
}

export default function Lesson1() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const { solana } = window;
    if (solana && solana.isPhantom) {
      solana.connect({ onlyIfTrusted: true }).then((response: PhantomResponse) => {
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
      setCompleted(response.data.courses?.["community-strategy"]?.lesson1 || false);
    } catch (error) {
      console.error("Progress fetch failed:", error);
    }
  };

  const markComplete = async () => {
    if (!walletAddress) return;
    try {
      await axios.post(`/api/progress/${walletAddress}/community-strategy`, { lessonId: "lesson1", completed: true });
      setCompleted(true);
    } catch (error) {
      console.error("Progress update failed:", error);
      alert("Failed to update progress.");
    }
  };

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
              <Link href="/community-strategy" className="flex items-center space-x-1">
                <ArrowLeft size={16} />
                <span>Back to Lessons</span>
              </Link>
            </Button>
          </div>
          <header className="text-center pt-16">
            <h1 className="text-4xl font-bold text-cyan-400 mb-2">Building a Discord Community</h1>
            <p className="text-md text-gray-400">Lesson 1: Community Strategy</p>
          </header>
        </div>
        <main className="w-full max-w-2xl text-left">
          <h2 className="text-2xl font-bold text-purple-400 mb-4">Introduction</h2>
          <p className="text-gray-300 mb-4">
            A thriving Discord community is key to Web3 projects. This lesson covers strategies to grow and engage your community.
          </p>
          <h3 className="text-xl font-bold text-cyan-400 mb-2">Step 1: Set Up Your Server</h3>
          <p className="text-gray-300 mb-4">
            - Create a Discord server at <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">discord.com</a>.<br />
            - Add channels for announcements, general chat, and support.<br />
            - Customize with a logo and welcome message.
          </p>
          <h3 className="text-xl font-bold text-cyan-400 mb-2">Step 2: Engage Members</h3>
          <p className="text-gray-300 mb-4">
            - Host AMAs, giveaways, and events.<br />
            - Use bots like MEE6 for moderation and roles.<br />
            - Encourage active participation with rewards (e.g., NFTs).
          </p>
          <h3 className="text-xl font-bold text-cyan-400 mb-2">Step 3: Promote Your Server</h3>
          <p className="text-gray-300 mb-4">
            - Share invite links on X and project websites.<br />
            - Partner with other communities for cross-promotion.<br />
            - Highlight unique features (e.g., token-gated channels).
          </p>
          <Button
            onClick={markComplete}
            className="bg-gradient-to-r from-green-600 to-purple-600 text-white mt-4 hover:from-green-500 hover:to-purple-500"
            disabled={completed}
          >
            {completed ? "Completed" : "Mark as Complete"}
          </Button>
        </main>
        <footer className="mt-12 text-center">
          <p className="text-sm text-gray-400">#StayBuilding #StayHODLing</p>
        </footer>
      </div>
    </TokenGate>
  );
} 