
"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const TokenGate = ({ 
  children, 
  requiredCollectionAddress,
  deniedAccessMessage = "Access Denied. You need the required NFT to view this content.",
  mintLink = "https://magiceden.us/marketplace/wifhoodies", 
  mintLinkText = "Magic Eden" 
}) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isHolder, setIsHolder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState("Phantom");
  const [error, setError] = useState(null);

  const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;

  const connectWallet = async () => {
    setError(null);
    try {
      const { solana } = window;
      let provider;

      if (selectedWallet === "Phantom" && solana && solana.isPhantom) {
        provider = solana;
      } else if (selectedWallet === "Solflare" && solana && solana.isSolflare) {
        provider = solana;
      } else if (selectedWallet === "MagicEden" && solana) {
         if (solana.isPhantom || solana.isSolflare || solana.isBackpack) { 
            provider = solana;
        } else {
            const message = `Compatible Solana wallet (e.g., Phantom, Solflare) needed for Magic Eden not found.`;
            setError(message);
            alert(message);
            return;
        }
      } else {
        const message = `Please install or select a compatible ${selectedWallet} wallet.`;
        setError(message);
        alert(message);
        return;
      }

      if (provider) {
        const response = await provider.connect({ onlyIfTrusted: false });
        setWalletAddress(response.publicKey.toString());
      }
    } catch (err) {
      console.error("Wallet connection failed:", err);
      const message = "Failed to connect wallet. Please try again.";
      setError(message);
      // alert(message); // Alert can be disruptive, error state is preferred
    }
  };

  const checkNFTOwnership = useCallback(async () => {
    if (!walletAddress || !HELIUS_API_KEY || !requiredCollectionAddress) {
      if(!HELIUS_API_KEY) console.error("Helius API key is missing. Ensure NEXT_PUBLIC_HELIUS_API_KEY is set.");
      if(!requiredCollectionAddress) console.error("Required collection address is missing for TokenGate component.");
      setIsHolder(false); // Ensure isHolder is false if prerequisites are not met
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
        {
          jsonrpc: "2.0",
          id: "my-id",
          method: "getAssetsByOwner",
          params: {
            ownerAddress: walletAddress,
            page: 1,
            limit: 1000,
            displayOptions: {
              showCollectionMetadata: true,
            },
          },
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const nfts = response.data.result?.items || [];
      const hasRequiredNFT = nfts.some((nft) =>
        nft.grouping?.find(
          (group) => group.group_key === 'collection' && group.group_value === requiredCollectionAddress
        )
      );
      setIsHolder(hasRequiredNFT);
      if (!hasRequiredNFT) {
        setError(deniedAccessMessage);
      }
    } catch (err) {
      console.error("NFT check failed:", err);
      if (axios.isAxiosError(err) && err.response) {
        console.error("Error response data:", err.response.data);
      }
      const message = "Failed to verify NFT ownership. Please ensure you are on the correct network or try again.";
      setError(message);
      // alert(message); // Alert can be disruptive
    }
    setLoading(false);
  }, [walletAddress, HELIUS_API_KEY, requiredCollectionAddress, deniedAccessMessage]);

  useEffect(() => {
    if (walletAddress) {
      checkNFTOwnership();
    } else {
      // Reset if wallet is disconnected
      setIsHolder(false);
      setLoading(false);
      setError(null);
    }
  }, [walletAddress, checkNFTOwnership]);

  if (!HELIUS_API_KEY || !requiredCollectionAddress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-8 px-4 bg-background text-foreground">
        <div className="text-center p-6 bg-card rounded-xl shadow-lg border-2 neon-border-orange">
          <p className="text-red-400 text-lg">
            TokenGate component is not configured correctly. Missing API key or collection address.
          </p>
          <p className="text-sm text-muted-foreground mt-2">Please contact the site administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {!walletAddress ? (
        <div className="flex flex-col items-center justify-center min-h-screen py-8 px-4 bg-background text-foreground">
            <div className="text-center p-6 bg-card rounded-xl shadow-lg border-2 neon-border-cyan max-w-md w-full">
            <p className="text-foreground mb-4 text-lg">
                Connect your wallet to access this content!
            </p>
            <div className="mb-4">
                <label htmlFor="wallet-select-tokengate-main" className="sr-only">Select Wallet</label>
                <select
                id="wallet-select-tokengate-main"
                value={selectedWallet}
                onChange={(e) => setSelectedWallet(e.target.value)}
                className="bg-muted border border-input text-foreground rounded-lg px-4 py-3 mb-6 w-full text-base focus:ring-2 focus:ring-accent"
                >
                <option value="Phantom">Phantom</option>
                <option value="Solflare">Solflare</option>
                <option value="MagicEden">Magic Eden (via Phantom/Solflare)</option>
                </select>
            </div>
            <Button
                onClick={connectWallet}
                className="w-full px-6 py-3 rounded-lg shadow-lg bg-gradient-to-r from-green-500 to-purple-600 hover:from-green-600 hover:to-purple-700 text-white text-base font-semibold"
                disabled={loading}
            >
                {loading ? "Connecting..." : `Connect ${selectedWallet}`}
            </Button>
            {error && <p className="text-red-400 mt-4">{error}</p>}
            </div>
        </div>
      ) : loading ? (
         <div className="flex flex-col items-center justify-center min-h-screen py-8 px-4 bg-background text-foreground">
            <div className="flex flex-col items-center justify-center text-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-foreground text-lg">Checking NFT ownership...</p>
            </div>
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
        <div className="flex flex-col items-center justify-center min-h-screen py-8 px-4 bg-background text-foreground">
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center p-6 bg-card rounded-xl shadow-lg border-2 neon-border-orange max-w-md w-full"
            >
            <p className="text-red-400 text-lg">
                {error || deniedAccessMessage}
            </p>
            {mintLink && (
                <p className="text-muted-foreground mt-2">
                    Mint one at{" "}
                    <a
                        href={mintLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                    >
                    {mintLinkText}
                    </a>
                    !
                </p>
            )}
            <Button onClick={() => {setWalletAddress(null); setIsHolder(false); setLoading(false); setError(null);}} variant="outline" className="mt-4">
                Try a different wallet
            </Button>
            </motion.div>
        </div>
      )}
    </div>
  );
};

export default TokenGate;

    