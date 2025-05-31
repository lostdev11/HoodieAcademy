"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import axios from "axios";
import SocialWaitingArea from "./SocialWaitingArea";

declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
    solflare?: any;
  }
}

type WalletProviderOption = 'metamask' | 'phantom' | 'solflare';

interface TokenGateProps {
  requiredToken?: string;
  requiredAmount?: number;
  onAccessGranted?: () => void;
  children: React.ReactNode;
}

const TokenGate = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isHolder, setIsHolder] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState("Phantom");
  const [paymentStatus, setPaymentStatus] = useState(null);

  const WIFHOODIE_COLLECTION_ADDRESS = "H3mnaqNFFNwqRfEiWFsRTgprCvG4tYFfmNezGEVnaMuQ";
  const JUPDADDY_ADDRESS = "qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA";
  const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
  const PAYMENT_AMOUNT = 0.05 * LAMPORTS_PER_SOL;
  const connection = new Connection("https://api.mainnet-beta.solana.com");

  const connectWallet = async () => {
    try {
      const { solana } = window;
      if (
        (selectedWallet === "Phantom" && solana && solana.isPhantom) ||
        (selectedWallet === "Solflare" && solana && solana.isSolflare) ||
        (selectedWallet === "MagicEden" && solana && solana.isMagicEden)
      ) {
        const response = await solana.connect();
        setWalletAddress(response.publicKey.toString());
      } else {
        alert(`Please install ${selectedWallet} wallet!`);
      }
    } catch (error) {
      console.error("Wallet connection failed:", error);
      alert("Failed to connect wallet.");
    }
  };

  const checkWifHoodieOwnership = async () => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      const response = await axios.post(
        `https://api.helius.xyz/v0/addresses/${walletAddress}/assets?api-key=${HELIUS_API_KEY}`,
        { content: { collection: WIFHOODIE_COLLECTION_ADDRESS } }
      );
      const nfts = response.data.assets || [];
      const hasWifHoodie = nfts.some(nft => nft.collection === WIFHOODIE_COLLECTION_ADDRESS);
      setIsHolder(hasWifHoodie);
    } catch (error) {
      console.error("NFT check failed:", error);
      alert("Failed to verify WifHoodie NFT.");
    }
    setLoading(false);
  };

  const sendSolPayment = async () => {
    if (!walletAddress) {
      alert("Please connect your wallet first!");
      return;
    }
    setLoading(true);
    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(walletAddress),
          toPubkey: new PublicKey(JUPDADDY_ADDRESS),
          lamports: PAYMENT_AMOUNT,
        })
      );
      transaction.feePayer = new PublicKey(walletAddress);
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const { solana } = window;
      const signedTransaction = await solana.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(signature);
      setHasPaid(true);
      setPaymentStatus("Payment successful! Access granted.");
    } catch (error) {
      console.error("Payment failed:", error);
      setPaymentStatus("Payment failed. Please try again.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (walletAddress) checkWifHoodieOwnership();
  }, [walletAddress]);

  if (!walletAddress) {
    return (
      <div className="flex flex-col items-center min-h-screen py-8 px-4 bg-background text-foreground">
        <div className="text-center">
          <p className="text-foreground mb-4">
            Connect your wallet to access this content.
          </p>
          <select
            value={selectedWallet}
            onChange={(e) => setSelectedWallet(e.target.value)}
            className="bg-gradient-to-r from-green-600 to-purple-600 text-white rounded-lg px-4 py-2 mb-4"
          >
            <option value="Phantom">Phantom</option>
            <option value="Solflare">Solflare</option>
            <option value="MagicEden">Magic Eden Wallet</option>
          </select>
          <button
            onClick={connectWallet}
            className="bg-gradient-to-r from-green-600 to-purple-600 text-white px-6 py-2 rounded-lg"
          >
            Connect {selectedWallet} Wallet
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-foreground">Checking access...</p>
      </div>
    );
  }

  if (!isHolder && !hasPaid) {
    return (
      <div className="flex flex-col items-center min-h-screen py-8 px-4 bg-background text-foreground">
        <div className="text-center">
          <p className="text-foreground mb-4">
            You need a WifHoodie NFT or a 0.05 SOL payment to access this content.
          </p>
          <button
            onClick={sendSolPayment}
            className="bg-gradient-to-r from-green-600 to-purple-600 text-white px-6 py-2 rounded-lg mb-4"
            disabled={loading}
          >
            Pay 0.05 SOL
          </button>
          <p>
            Or mint a WifHoodie NFT at{" "}
            <a
              href="https://magiceden.io/marketplace/wifhoodie"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline"
            >
              Magic Eden
            </a>
            !
          </p>
          {paymentStatus && <p className="text-foreground mt-4">{paymentStatus}</p>}
        </div>
      </div>
    );
  }

  return children;
};

export default TokenGate; 