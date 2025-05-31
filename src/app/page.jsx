"use client";
import { useState, useEffect } from "react";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import SocialWaitingArea from "@/components/SocialWaitingArea";
import Link from "next/link";

export default function Home() {
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

  return (
    <div className="flex flex-col items-center min-h-screen py-8 px-4 bg-background text-foreground">
      <header className="text-center mb-8">
        <h1 className="text-5xl font-bold text-cyan-400">Hoodie Academy</h1>
        <p className="text-lg text-muted-foreground mt-2">Your Web3 Learning Hub</p>
      </header>
      <main className="w-full max-w-5xl">
        {!walletAddress ? (
          <div className="text-center">
            <p className="text-foreground mb-4">
              Welcome to Hoodie Academy! Connect your wallet to join the elite or chat with degens below.
            </p>
            <SocialWaitingArea isSecret={false} />
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
              className="bg-gradient-to-r from-green-600 to-purple-600 text-white"
            >
              Connect {selectedWallet} Wallet
            </Button>
          </div>
        ) : loading ? (
          <p className="text-foreground">Checking access...</p>
        ) : isHolder || hasPaid ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full text-center"
          >
            <h2 className="text-3xl font-bold text-accent mb-4">Welcome, Verified Hoodie!</h2>
            <SocialWaitingArea isSecret={true} />
            <div className="mt-8">
              <h3 className="text-2xl font-bold text-cyan-400 mb-4">Access Your Courses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { path: "/wallet-wizardry", name: "Wallet Wizardry" },
                  { path: "/nft-mastery", name: "NFT Mastery" },
                  { path: "/community-strategy", name: "Community Strategy" },
                  { path: "/meme-coin-mania", name: "Meme Coin Mania" },
                  { path: "/crypto-x-influence", name: "Crypto X Influence" }
                ].map((course) => (
                  <Button
                    key={course.path}
                    asChild
                    className="bg-gradient-to-r from-green-600 to-purple-600 text-white"
                  >
                    <Link href={course.path}>{course.name}</Link>
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <SocialWaitingArea isSecret={false} />
            <p className="text-foreground mb-4 mt-4">
              You need a WifHoodie NFT or a 0.05 SOL payment to access courses.
            </p>
            <Button
              onClick={sendSolPayment}
              className="bg-gradient-to-r from-green-600 to-purple-600 text-white mb-4"
              disabled={loading}
            >
              Pay 0.05 SOL
            </Button>
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
          </motion.div>
        )}
      </main>
      <footer className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">#StayBuilding #StayHODLing</p>
      </footer>
    </div>
  );
} 