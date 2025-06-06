
'use client'

import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { useEffect, useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay"
import Link from 'next/link';


export default function Home() {
  const [currentTime, setCurrentTime] = useState<string | null>(null);

  useEffect(() => {
    // This will only run on the client, after initial hydration
    setCurrentTime(new Date().toLocaleTimeString());

    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-accent">
          Hoodie Academy: Learn Hard, HODL Harder
        </h1>
        <p className="text-md md:text-lg text-muted-foreground mt-2">
          {currentTime ? `Current Time: ${currentTime}` : 'Loading time...'}
        </p>
      </header>

      <main className="flex flex-col items-center justify-center px-4 md:px-8">
        <section className="mb-8 text-center">
          <p className="text-lg md:text-xl text-foreground">
            Welcome to <span className="text-secondary font-semibold">Hoodie Academy</span>, the premier Web3 learning center.
            Dive into the world of <span className="text-primary">NFTs</span>,{' '}
            <span className="text-primary">meme coins</span>, and <span className="text-primary">crypto culture</span> with our
            cutting-edge courses.
          </p>
          <div className="mt-4 w-full max-w-md md:max-w-lg lg:max-w-xl mx-auto">
            <Carousel
              plugins={[
                Autoplay({
                  delay: 3000, // Change slide every 3 seconds
                  stopOnInteraction: true,
                }),
              ]}
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                <CarouselItem>
                  <div className="p-1">
                      <Image
                        src="/hoodie-logo.png"
                        alt="Hoodie Academy Logo"
                        width={400}
                        height={200}
                        className="rounded-lg shadow-md w-full h-auto object-contain"
                        data-ai-hint="hoodie logo"
                      />
                  </div>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex"/>
              <CarouselNext className="hidden md:flex"/>
            </Carousel>
          </div>
        </section>

        <section className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4">
          <Button variant="secondary">
            <Link href="/courses">Explore Courses</Link>
          </Button>
          <Button variant="outline">
            <Link href="/great-hoodie-hall">Discover the Great Hoodie Hall</Link>
          </Button>
        </section>
      </main>

      <footer className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          #StayBuilding #StayHODLing
        </p>
      </footer>
    </div>
  );
}
"use client";
      import { useState, useEffect } from "react";
      import axios from "axios";
      import { Button } from "@/components/ui/button";
      import { motion } from "framer-motion";
      import Link from "next/link";
      import TokenGate from "@/components/TokenGate";

      export default function Home() {
        const [walletAddress, setWalletAddress] = useState<string | null>(null);
        const [isHolder, setIsHolder] = useState(false);
        const [loading, setLoading] = useState(false);
        const [selectedWallet, setSelectedWallet] = useState("Phantom");
        const [progress, setProgress] = useState<Record<string, any> | null>(null);
        const [leaderboard, setLeaderboard] = useState<any[]>([]);
        const [error, setError] = useState<string | null>(null);

        const WIFHOODIE_COLLECTION_ID = "H3mnaqNFFNwqRfEiWFsRTgprCvG4tYFfmNezGEVnaMuQ";
        const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

        console.log("HELIUS_API_KEY:", HELIUS_API_KEY || "undefined"); // Debug line

        const connectWallet = async () => {
          try {
            const { solana } = window;
            if (!solana) {
              throw new Error("No wallet provider detected. Install Phantom, Solflare, or Magic Eden Wallet.");
            }
            if (
              (selectedWallet === "Phantom" && solana.isPhantom) ||
              (selectedWallet === "Solflare" && solana.isSolflare) ||
              (selectedWallet === "MagicEden" && solana.isMagicEden)
            ) {
              const response = await solana.connect();
              setWalletAddress(response.publicKey.toString());
              setError(null);
            } else {
              throw new Error(`Please install ${selectedWallet} wallet!`);
            }
          } catch (error: any) {
            console.error("Wallet connection failed:", error);
            setError(`Wallet connection failed: ${error.message || error}`);
          }
        };

        const checkWifHoodieOwnership = async () => {
          if (!walletAddress) return;
          if (!HELIUS_API_KEY) {
            setError("Helius API key is missing. Please check your environment configuration.");
            setLoading(false);
            return;
          }
          setLoading(true);
          try {
            const response = await axios.post(
              `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
              {
                jsonrpc: "2.0",
                id: 1,
                method: "getAssetsByOwner",
                params: {
                  ownerAddress: walletAddress,
                  page: 1,
                  limit: 1000
                }
              }
            );
            const nfts = response.data.result.items || [];
            const hasWifHoodie = nfts.some((nft: any) =>
              nft.grouping?.some((group: any) => group.group_key === "collection" && group.group_value === WIFHOODIE_COLLECTION_ID)
            );
            setIsHolder(hasWifHoodie);
            setError(null);
          } catch (error: any) {
            console.error("NFT check failed:", error);
            setError(`NFT verification failed: ${error.response?.status || error.message}`);
          }
          setLoading(false);
        };

        const fetchProgress = async () => {
          if (!walletAddress) return;
          try {
            const response = await axios.get(`/api/progress/${walletAddress}`);
            setProgress(response.data.courses || {});
          } catch (error) {
            console.error("Progress fetch failed:", error);
          }
        };

        const fetchLeaderboard = async () => {
          try {
            const response = await axios.get("/api/leaderboard");
            setLeaderboard(response.data);
          } catch (error) {
            console.error("Leaderboard fetch failed:", error);
          }
        };

        useEffect(() => {
          if (walletAddress) {
            checkWifHoodieOwnership();
            fetchProgress();
          }
          fetchLeaderboard();
        }, [walletAddress]);

        return (
          <TokenGate>
            <div className="flex flex-col items-center min-h-screen py-8 px-4 bg-gray-900 text-gray-300">
              <header className="text-center mb-8">
                <h1 className="text-5xl font-bold text-cyan-400">Hoodie Academy</h1>
                <p className="text-lg text-gray-400 mt-2">Your Web3 Learning Hub for Hoodies</p>
              </header>
              <main className="w-full max-w-5xl">
                {error && <p className="text-red-400 mb-4 text-center">{error}</p>}
                {!walletAddress ? (
                  <div className="text-center">
                    <p className="text-gray-300 mb-4">
                      Connect your wallet to verify your WifHoodie NFT and access Hoodie Academy.
                    </p>
                    <select
                      value={selectedWallet}
                      onChange={(e) => setSelectedWallet(e.target.value)}
                      className="bg-gradient-to-r from-green-600 to-purple-600 text-white rounded-lg px-4 py-2 mb-4 mt-4"
                    >
                      <option value="Phantom">Phantom</option>
                      <option value="Solflare">Solflare</option>
                      <option value="MagicEden">Magic Eden Wallet</option>
                    </select>
                    <Button
                      onClick={connectWallet}
                      className="bg-gradient-to-r from-green-600 to-purple-600 text-white hover:from-green-500 hover:to-purple-500"
                    >
                      Connect {selectedWallet} Wallet
                    </Button>
                  </div>
                ) : loading ? (
                  <div className="text-center">
                    <p className="text-gray-300">Verifying access...</p>
                  </div>
                ) : isHolder ? (
                  <div className="w-full text-center">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <h2 className="text-3xl font-bold text-purple-400 mb-4">Welcome, Verified Hoodie!</h2>
                    </motion.div>
                    <div className="mt-8">
                      <h3 className="text-2xl font-bold text-cyan-400 mb-4">Your Course Progress</h3>
                      {progress ? (
                        <div className="grid grid-cols-1 gap-4">
                          {Object.entries(progress).map(([course, lessons]: [string, any]) => (
                            <div key={course} className="bg-gray-800 p-4 rounded-lg">
                              <span className="text-gray-300">{course.replace("-", " ").toUpperCase()}: </span>
                              <span className={Object.values(lessons).every((l: boolean) => l) ? "text-green-400" : "text-red-400"}>
                                {Object.values(lessons).every((l: boolean) => l) ? "Completed" : "In Progress"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-300">No progress data available.</p>
                      )}
                    </div>
                    <div className="mt-8">
                      <h3 className="text-2xl font-bold text-cyan-400 mb-4">Top 10 Learners</h3>
                      {leaderboard.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                          {leaderboard.slice(0, 10).map((entry, index) => (
                            <div key={index} className="bg-gray-800 p-4 rounded-lg">
                              <span className="text-gray-300">#{index + 1}: {entry.walletAddress.slice(0, 8)}...</span>
                              <span className="text-green-400 ml-2">Completed: {new Date(entry.completionDate).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-300">No learners have completed all courses yet.</p>
                      )}
                    </div>
                    <div className="mt-8">
                      <h3 className="text-2xl font-bold text-cyan-400 mb-4">Access Your Courses</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { path: "/wallet-wizardry", name: "Wallet Wizardry" },
                          { path: "/nft-mastery", name: "NFT Mastery" },
                          { path: "/community-strategy", name: "Community Strategy" },
                          { path: "/meme-coin-mania", name: "Meme Coin Mania" },
                          { path: "/crypto-x-influence", name: "Crypto X Influence" },
                          { path: "/technical-analysis", name: "Technical Analysis" },
                          { path: "/sns", name: "Solana Name Service (SNS)" }
                        ].map((course) => (
                          <Button
                            key={course.path}
                            asChild
                            className="bg-gradient-to-r from-green-600 to-purple-600 text-white hover:from-green-500 hover:to-purple-500"
                          >
                            <Link href={course.path}>{course.name}</Link>
                          </Button>
                        ))}
                      </div>
                    </div>
                    {leaderboard.some(entry => entry.walletAddress === walletAddress) && (
                      <div className="mt-8">
                        <Button
                          asChild
                          className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white mb-4 hover:from-cyan-400 hover:to-purple-400"
                        >
                          <Link href="/great-hoodie-hall">Enter Great Hoodie Hall</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <Button
                      asChild
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white mb-4 hover:from-cyan-400 hover:to-purple-400"
                    >
                      <a href="https://magiceden.io/marketplace/wifhoodie" target="_blank" rel="noopener noreferrer">
                        Get WifHoodie NFT
                      </a>
                    </Button>
                  </div>
                )}
              </main>
              <footer className="mt-12 text-center">
                <p className="text-sm text-gray-400">#StayBuilding #StayHODLing</p>
              </footer>
            </div>
          </TokenGate>
        );
      }