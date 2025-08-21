'use client';

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
            setCompleted(response.data.courses?.["sns"]?.lesson1 || false);
          } catch (error) {
            console.error("Progress fetch failed:", error);
          }
        };

        const markComplete = async () => {
          if (!walletAddress) return;
          try {
            await axios.post(`/api/progress/${walletAddress}/sns`, { lessonId: "lesson1", completed: true });
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
                  <h1 className="text-4xl font-bold text-cyan-400 mb-2">Registering .sol Domains</h1>
                  <p className="text-md text-gray-400">Lesson 1: Solana Name Service (SNS)</p>
                </header>
              </div>
              <main className="w-full max-w-2xl text-left">
                <h2 className="text-2xl font-bold text-purple-400 mb-4">Introduction</h2>
                <p className="text-gray-300 mb-4">
                  .sol domains are decentralized identities on Solana, managed by the Solana Name Service (SNS). This lesson covers how to register and enhance your .sol domain.[](https://docs.sns.id/collection/tokenomics/sns-token)
                </p>
                <h3 className="text-xl font-bold text-cyan-400 mb-2">Step 1: Register a .sol Domain</h3>
                <p className="text-gray-300 mb-4">
                  - Visit <a href="https://sns.id" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">sns.id</a> and connect your Phantom wallet.<br />
                  - Search for a .sol domain (e.g., yourname.sol).<br />
                  - Pay a one-time fee (~0.01 SOL or more, based on storage size) and approve the transaction.[](https://docs.sns.id/collection/solana-name-service/register)
                </p>
                <h3 className="text-xl font-bold text-cyan-400 mb-2">Step 2: Set Up Your Profile</h3>
                <p className="text-gray-300 mb-4">
                  - Set your domain as primary in your SNS profile.<br />
                  - Upload an avatar image for your domain.<br />
                  - Link your X and Telegram accounts to earn Identity Badges.[](https://docs.sns.id/collection/tokenomics/sns-token)
                </p>
                <h3 className="text-xl font-bold text-cyan-400 mb-2">Step 3: Manage Your Domain</h3>
                <p className="text-gray-300 mb-4">
                  - Use SNS Manager (available on Backpack or Solana Mobile) to manage records.<br />
                  - Ensure records are not stale by updating after transfers.<br />
                  - Register multiple domains to one wallet address.[](https://docs.sns.id/collection/solana-name-service/records)[](https://docs.sns.id/collection/solana-name-service/register)
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