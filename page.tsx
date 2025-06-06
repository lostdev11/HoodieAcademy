"use client";
    import { useState, useEffect } from "react";
    import axios from "axios";
    import { Button } from "@/components/ui/button";
    import { motion } from "framer-motion";
    import Link from "next/link";
    import SocialInteraction from "@/components/SocialInteraction";

    interface NftAsset {
      id: string;
    }

    interface LeaderboardEntry {
      walletAddress: string;
      completionDate: string;
    }

    export default function Home() {
      const [walletAddress, setWalletAddress] = useState<string | null>(null);
      const [isHolder, setIsHolder] = useState(false);
      const [loading, setLoading] = useState(false);
      const [selectedWallet, setSelectedWallet] = useState("Phantom");
      const [progress, setProgress] = useState<any | null>(null);
      const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

      const WIFHOODIE_MINT_ADDRESS = "3eed65d7e8c4961926d3205f77ed0a6b04f808fc102ee4937fc78c04706b0088";
      const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

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
          } else {
            alert(`Please install ${selectedWallet} wallet!`);
          }
        } catch (error) {
          console.error("Wallet connection failed:", error);
          alert(`Wallet connection failed: ${error instanceof Error ? error.message : error}`);
        }
      };

      const checkWifHoodieOwnership = async () => {
        if (!walletAddress) return;
        setLoading(true);
        try {
          const response = await axios.post(
            `https://api.helius.xyz/v0/addresses/${walletAddress}/assets?api-key=${HELIUS_API_KEY}`,
            {
              content: {
                mint: WIFHOODIE_MINT_ADDRESS
              }
            }
          );
          const nfts: NftAsset[] = response.data.assets || [];
          const hasWifHoodie = nfts.some(nft => nft.id === WIFHOODIE_MINT_ADDRESS);
          setIsHolder(hasWifHoodie);
        } catch (error) {
          console.error("NFT check failed:", error);
          alert(`NFT verification failed: ${error instanceof Error ? error.message : error}`);
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
        <div className="flex flex-col items-center min-h-screen py-8 px-4 bg-gray-900 text-gray-300">
          <header className="text-center mb-8">
            <h1 className="text-5xl font-bold text-cyan-400">Hoodie Academy</h1>
            <p className="text-lg text-gray-400 mt-2">Your Web3 Learning Hub for Hoodies</p>
          </header>
          <main className="w-full max-w-5xl">
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
                  <SocialInteraction isVerified={isHolder} />
                </motion.div>
                <div className="mt-8">
                  <h3 className="text-2xl font-bold text-cyan-400 mb-4">Your Course Progress</h3>
                  {progress ? (
                    <div className="grid grid-cols-1 gap-4">
                      {Object.entries(progress).map(([course, completed]) => (
                        <div key={course} className="bg-gray-800 p-4 rounded-lg">
                          <span className="text-gray-300">{course.replace("-", " ").toUpperCase()}: </span>
                          <span className={completed ? "text-green-400" : "text-red-400"}>
                            {completed ? "Completed" : "In Progress"}
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
                      {leaderboard.slice(0, 10).map((entry: LeaderboardEntry, index) => (
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
                      { path: "/technical-analysis", name: "Technical Analysis" }
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
                {leaderboard.some((entry: LeaderboardEntry) => entry.walletAddress === walletAddress) && (
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
      );
    } 