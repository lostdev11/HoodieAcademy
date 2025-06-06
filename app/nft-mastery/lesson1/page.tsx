"use client";
import { useState, useEffect } from "react";
import TokenGate from "@/components/TokenGate";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import axios from "axios";

export default function Lesson1() {
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
      setCompleted(response.data.courses?.["nft-mastery"]?.lesson1 || false);
    } catch (error) {
      console.error("Progress fetch failed:", error);
    }
  };

  const markComplete = async () => {
    if (!walletAddress) return;
    try {
      await axios.post(`/api/progress/${walletAddress}/nft-mastery`, { lessonId: "lesson1", completed: true });
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
              <Link href="/nft-mastery" className="flex items-center space-x-1">
                <ArrowLeft size={16} />
                <span>Back to Lessons</span>
              </Link>
            </Button>
          </div>
          <header className="text-center pt-16">
            <h1 className="text-4xl font-bold text-cyan-400 mb-2">Minting Your First NFT</h1>
            <p className="text-md text-gray-400">Lesson 1: NFT Mastery</p>
          </header>
        </div>
        <main className="w-full max-w-2xl text-left">
          <h2 className="text-2xl font-bold text-purple-400 mb-4">Introduction</h2>
          <p className="text-gray-300 mb-4">
            Minting an NFT creates a unique digital asset on the blockchain. This lesson covers how to mint an NFT on Solana using a platform like Holaplex.
          </p>
          <h3 className="text-xl font-bold text-cyan-400 mb-2">Step 1: Prepare Your Artwork</h3>
          <p className="text-gray-300 mb-4">
            - Create or choose a digital file (e.g., PNG, GIF).<br />
            - Ensure it's high-quality and under 10MB.<br />
            - Add metadata (name, description) in a JSON file.
          </p>
          <h3 className="text-xl font-bold text-cyan-400 mb-2">Step 2: Set Up Holaplex</h3>
          <p className="text-gray-300 mb-4">
            - Visit <a href="https://holaplex.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">holaplex.com</a> and connect your Phantom wallet.<br />
            - Create a new NFT project and upload your artwork.<br />
            - Set royalty percentages and minting details.
          </p>
          <h3 className="text-xl font-bold text-cyan-400 mb-2">Step 3: Mint the NFT</h3>
          <p className="text-gray-300 mb-4">
            - Confirm the minting transaction in Phantom.<br />
            - Pay the small SOL gas fee.<br />
            - Verify the NFT in your wallet or on Solscan.
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