"use client";
import { useState, useEffect } from "react";
import TokenGate from "@/components/TokenGate";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import axios from "axios";

export default function Lesson2() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const { solana } = window;
    if (solana && solana.isPhantom) {
      solana.connect({ onlyIfTrusted: true }).then(response => {
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
      setCompleted(response.data.courses?.["nft-mastery"]?.lesson2 || false);
    } catch (error) {
      console.error("Progress fetch failed:", error);
    }
  };

  const markAsCompleted = async () => {
    if (!walletAddress) return;
    try {
      await axios.post(`/api/progress/${walletAddress}`, {
        course: "nft-mastery",
        lesson: "lesson2",
        completed: true,
      });
      setCompleted(true);
    } catch (error) {
      console.error("Progress update failed:", error);
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
              <Link href="/nft-mastery" className="flex items-center space-x-1">
                <ArrowLeft size={16} />
                <span>Back to NFT Mastery</span>
              </Link>
            </Button>
          </div>
          <header className="text-center pt-16">
            <h1 className="text-4xl font-bold text-cyan-400 mb-2">Trading NFTs on Magic Eden</h1>
            <p className="text-md text-gray-400">Master buying and selling NFTs on marketplaces.</p>
          </header>
        </div>
        <main className="w-full max-w-2xl text-center">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Lesson Content</h2>
            <p className="text-gray-300 mb-4">
              This lesson covers the basics of trading NFTs on Magic Eden, including listing, buying, and managing your NFT collection.
            </p>
            <Button
              onClick={markAsCompleted}
              className="bg-gradient-to-r from-green-600 to-purple-600 text-white mt-2 hover:from-green-500 hover:to-purple-500"
            >
              Mark as Completed
            </Button>
            {completed && (
              <p className="text-green-400 mt-2">Lesson Completed!</p>
            )}
          </div>
        </main>
        <footer className="mt-12 text-center">
          <p className="text-sm text-gray-400">#StayBuilding #StayHODLing</p>
        </footer>
      </div>
    </TokenGate>
  );
} 