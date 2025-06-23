"use client";
import React from 'react';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Wallet } from 'lucide-react';

interface TokenGateProps {
  children: React.ReactNode;
}

const TokenGate: React.FC<TokenGateProps> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isHolder, setIsHolder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const WIFHOODIE_COLLECTION_ID = "H3mnaqNFFNwqRfEiWFsRTgprCvG4tYFfmNezGEVnaMuQ";

  const connectWallet = async () => {
    try {
      const { solana } = window;
      if (!solana) {
        throw new Error("Please install Phantom wallet to access this course.");
      }
      
      const response = await solana.connect();
      setWalletAddress(response.publicKey.toString());
      setError(null);
    } catch (error: any) {
      console.error("Wallet connection failed:", error);
      setError(`Wallet connection failed: ${error.message || error}`);
    }
  };

  const checkWifHoodieOwnership = async () => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      // For demo purposes, we'll simulate the check
      // In production, you would use Helius API or similar
      const hasWifHoodie = Math.random() > 0.5; // Simulate 50% chance of having NFT
      setIsHolder(hasWifHoodie);
      setError(null);
    } catch (error: any) {
      console.error("NFT check failed:", error);
      setError(`NFT verification failed: ${error.message}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (walletAddress) checkWifHoodieOwnership();
  }, [walletAddress]);

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-[hsl(var(--background))]">
      {error && <p className="text-red-400 mb-4">{error}</p>}
      {!walletAddress ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8 bg-[hsl(var(--card))] rounded-xl shadow-lg border border-pink-600 neon-border-pink"
        >
          <h2 className="text-2xl font-bold text-[hsl(var(--primary))] mb-4">Course Access Required</h2>
          <p className="text-[hsl(var(--muted-foreground))] mb-6">
            Connect your wallet to verify your WifHoodie NFT and access this course.
          </p>
          <Button
            onClick={connectWallet}
            className="bg-gradient-to-r from-green-600 to-purple-600 text-white hover:from-green-500 hover:to-purple-500 px-8 py-3 flex items-center gap-2"
          >
            <Wallet size={20} />
            Connect Phantom Wallet
          </Button>
        </motion.div>
      ) : loading ? (
        <div className="text-center p-8 bg-[hsl(var(--card))] rounded-xl shadow-lg border border-pink-600 neon-border-pink">
          <p className="text-[hsl(var(--muted-foreground))]">Verifying your WifHoodie NFT...</p>
        </div>
      ) : isHolder ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          {children}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center p-8 bg-[hsl(var(--card))] rounded-xl shadow-lg border border-pink-600 neon-border-pink"
        >
          <h2 className="text-2xl font-bold text-[hsl(var(--primary))] mb-4">WifHoodie NFT Required</h2>
          <p className="text-[hsl(var(--muted-foreground))] mb-6">
            You need to own a WifHoodie NFT to access this course.
          </p>
          <Button
            asChild
            className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-400 hover:to-purple-400 px-8 py-3"
          >
            <a href="https://magiceden.io/marketplace/wifhoodie" target="_blank" rel="noopener noreferrer">
              Get WifHoodie NFT
            </a>
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default TokenGate; 