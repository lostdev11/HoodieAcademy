'use client';
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
            setCompleted(response.data.courses?.["sns"]?.lesson2 || false);
          } catch (error) {
            console.error("Progress fetch failed:", error);
          }
        };

        const markComplete = async () => {
          if (!walletAddress) return;
          try {
            await axios.post(`/api/progress/${walletAddress}/sns`, { lessonId: "lesson2", completed: true });
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
                    <Link href="/sns" className="flex items-center space-x-1">
                      <ArrowLeft size={16} />
                      <span>Back to Lessons</span>
                    </Link>
                  </Button>
                </div>
                <header className="text-center pt-16">
                  <h1 className="text-4xl font-bold text-cyan-400 mb-2">Mastering the $SNS Token</h1>
                  <p className="text-md text-gray-400">Lesson 2: Solana Name Service (SNS)</p>
                </header>
              </div>
              <main className="w-full max-w-2xl text-left">
                <h2 className="text-2xl font-bold text-purple-400 mb-4">Introduction</h2>
                <p className="text-gray-300 mb-4">
                  The $SNS token empowers .sol domain holders to shape the Solana Name Service. This lesson explores the LFG campaign and $SNS rewards.[](https://docs.sns.id/collection/tokenomics/sns-token)
                </p>
                <h3 className="text-xl font-bold text-cyan-400 mb-2">Step 1: Understand $SNS</h3>
                <p className="text-gray-300 mb-4">
                  - $SNS is a community token for .sol holders to govern SNS.<br />
                  - 4 billion tokens (40% of supply) are claimable via Genesis Airdrop and LFG Campaign.<br />
                  - Airdrop: 2 billion tokens for ~275,000 wallets holding .sol domains (snapshot-based).[](https://docs.sns.id/collection/tokenomics/sns-token)
                </p>
                <h3 className="text-xl font-bold text-cyan-400 mb-2">Step 2: Join the LFG Campaign</h3>
                <p className="text-gray-300 mb-4">
                  - Earn "dots" by registering .sol domains (post-May 1, 2025), updating profiles, or referring friends.<br />
                  - Use SNS Manager to track dots and claim rewards.<br />
                  - Higher badge tiers (Bronze to Diamond) unlock bigger rewards.[](https://docs.sns.id/collection/tokenomics/sns-token)
                </p>
                <h3 className="text-xl font-bold text-cyan-400 mb-2">Step 3: Use Referral Codes</h3>
                <p className="text-gray-300 mb-4">
                  - Hold a .sol domain to generate a referral code at sns.id.<br />
                  - Share your code to earn 10% of your referral's dots (retroactive).<br />
                  - Enter a referral code before generating your own to earn 1,000 bonus dots.[](https://docs.sns.id/collection/tokenomics/sns-token)
                </p>
                <Button
                  onClick={markComplete}
                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white mt-4 hover:from-blue-500 to:hover:to-blue-700"
                  disabled={completed}
                >
                  {completed ? "Completed" : "Mark as Complete"}
                </Button>
              </main>
              <footer className="mt-12 text-center">
                <p className="text-sm text-gray-400">...</p>
              </footer>
            </div>
          </TokenGate>
        );
      }