"use client";
      import { useState, useEffect } from "react";
      import axios from "axios";
      import { Button } from "@/components/ui/button";
      import { motion } from "framer-motion";

      interface TokenGateProps {
        children: React.ReactNode;
      }

      const TokenGate = ({ children }: TokenGateProps) => {
        const [walletAddress, setWalletAddress] = useState<string | null>(null);
        const [isHolder, setIsHolder] = useState(false);
        const [loading, setLoading] = useState(false);
        const [selectedWallet, setSelectedWallet] = useState("Phantom");
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

        useEffect(() => {
          if (walletAddress) checkWifHoodieOwnership();
        }, [walletAddress]);

        return (
          <div className="flex flex-col items-center justify-center w-full">
            {error && <p className="text-red-400 mb-4">{error}</p>}
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
                className="text-center"
              >
                <Button
                  asChild
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white mb-4 hover:from-cyan-400 hover:to-purple-400"
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