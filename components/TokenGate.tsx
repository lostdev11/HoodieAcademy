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
  const [isWalletInstalled, setIsWalletInstalled] = useState(false);

  const WIFHOODIE_COLLECTION_ID = "H3mnaqNFFNwqRfEiWFsRTgprCvG4tYFfmNezGEVnaMuQ";
  const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;

  const WALLET_INSTALL_LINKS = {
    Phantom: "https://phantom.app/download",
    Solflare: "https://solflare.com/download",
    MagicEden: "https://wallet.magiceden.io/",
  };

  console.log("TokenGate component initialized");
  console.log("Environment variables:", {
    NEXT_PUBLIC_HELIUS_API_KEY: process.env.NEXT_PUBLIC_HELIUS_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
  });
  console.log("HELIUS_API_KEY:", HELIUS_API_KEY || "undefined"); // Debug line

  useEffect(() => {
    const checkWalletInstalled = () => {
      const { solana } = window as any;
      if (!solana) {
        setIsWalletInstalled(false);
        return;
      }

      switch (selectedWallet) {
        case "Phantom":
          setIsWalletInstalled(!!solana.isPhantom);
          break;
        case "Solflare":
          setIsWalletInstalled(!!solana.isSolflare);
          break;
        case "MagicEden":
          setIsWalletInstalled(!!solana.isMagicEden);
          break;
        default:
          setIsWalletInstalled(false);
      }
    };

    checkWalletInstalled();
  }, [selectedWallet]);

  const connectWallet = async () => {
    try {
      const { solana } = window as any;
      if (!solana) {
        throw new Error("No wallet provider detected. Please install a Solana wallet.");
      }

      let walletProvider;
      switch (selectedWallet) {
        case "Phantom":
          walletProvider = solana.isPhantom;
          break;
        case "Solflare":
          walletProvider = solana.isSolflare;
          break;
        case "MagicEden":
          walletProvider = solana.isMagicEden;
          break;
        default:
          throw new Error("Unsupported wallet selected");
      }

      if (!walletProvider) {
        throw new Error(`${selectedWallet} wallet is not installed. Please install it first.`);
      }

      const response = await solana.connect();
      setWalletAddress(response.publicKey.toString());
      setError(null);
    } catch (error: any) {
      console.error("Wallet connection failed:", error);
      setError(error.message || "Failed to connect wallet");
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
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}
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
          {!isWalletInstalled ? (
            <div className="space-y-4">
              <p className="text-yellow-400 mb-2">
                {selectedWallet} wallet is not installed. Please install it first:
              </p>
              <Button
                asChild
                className="bg-gradient-to-r from-green-600 to-purple-600 text-white hover:from-green-500 hover:to-purple-500"
              >
                <a href={WALLET_INSTALL_LINKS[selectedWallet as keyof typeof WALLET_INSTALL_LINKS]} target="_blank" rel="noopener noreferrer">
                  Install {selectedWallet} Wallet
                </a>
              </Button>
            </div>
          ) : (
            <Button
              onClick={connectWallet}
              className="bg-gradient-to-r from-green-600 to-purple-600 text-white hover:from-green-500 hover:to-purple-500"
            >
              Connect {selectedWallet} Wallet
            </Button>
          )}
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
          <p className="text-gray-300 mb-4">You need a WifHoodie NFT to access this content.</p>
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