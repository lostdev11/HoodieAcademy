"use client";
export const dynamic = "force-static";
import { useState, useEffect, useCallback } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

// Existing glossary and resource data
const glossaryTerms = [
  {
    term: "HODL",
    definition: "Holding onto crypto despite market volatility, a degen's badge of honor.",
  },
  {
    term: "Rug Pull",
    definition: "A scam where developers abandon a project, leaving investors with worthless tokens.",
  },
  {
    term: "Gas Fees",
    definition: "Costs for Ethereum transactions, like fuel for your blockchain ride.",
  },
  {
    term: "NFT",
    definition: "Non-Fungible Token, a unique digital asset proving ownership on the blockchain.",
  },
  {
    term: "DAO",
    definition: "Decentralized Autonomous Organization, a community-run entity with no central boss.",
  },
  {
    term: "FOMO",
    definition: "Fear of Missing Out, the urge to jump into a hyped coin or NFT drop.",
  },
  {
    term: "Whale",
    definition: "A big player with massive crypto holdings, moving markets with their trades.",
  },
  {
    term: "Degen",
    definition: "A bold Web3 adventurer chasing high-risk, high-reward opportunities.",
  },
  {
    term: "KOL",
    definition: "Key Opinion Leader, an influencer shaping market sentiment and often shilling coins.",
  },
  {
    term: "ATH",
    definition: "All-Time High, the absolute peak price a crypto has ever reached. FOMO incoming?",
  },
  {
    term: "Chad",
    definition: "A confident, often successful crypto trader known for making bold moves (and gains).",
  },
  {
    term: "Aped",
    definition: "To dive headfirst and invest heavily into a coin, typically driven by hype rather than research.",
  },
  {
    term: "Port",
    definition: "Short for portfolio; your collection of crypto investments, for better or worse.",
  },
  {
    term: "Clipped",
    definition: "Executing a trade for a quick profit, sometimes small, like a sniper hit. Can also refer to getting only part of an order filled.",
  },
  {
    term: "TPO",
    definition: "Time Price Opportunity, a market profile charting concept highlighting price levels with significant trading activity.",
  },
  {
    term: "Bullish",
    definition: "Expecting prices to rise; a positive market sentiment. Go long and prosper!",
  },
  {
    term: "Bearish",
    definition: "Expecting prices to fall; a negative market sentiment. Time to hibernate or short?",
  },
];

interface Resource {
  name: string;
  description: string;
  url: string;
}

interface ChainResources {
  chainName: string;
  resources: Resource[];
}

const categorizedResources: ChainResources[] = [
  {
    chainName: "General Web3 Tools",
    resources: [
      {
        name: "Coingecko",
        description: "Crypto price tracker for memecoins and more.",
        url: "https://www.coingecko.com",
      },
      {
        name: "Snapshot",
        description: "DAO voting platform for decentralized governance.",
        url: "https://snapshot.org",
      },
    ],
  },
  {
    chainName: "Bitcoin Ecosystem",
    resources: [
      {
        name: "Blockstream Explorer (Bitcoin)",
        description: "Explore Bitcoin blocks and transactions.",
        url: "https://blockstream.info/",
      },
      {
        name: "Bitcoin.org",
        description: "Official website for Bitcoin information.",
        url: "https://bitcoin.org/",
      },
    ],
  },
  {
    chainName: "Ethereum Ecosystem",
    resources: [
      {
        name: "MetaMask",
        description: "Ethereum wallet for dApps and NFTs.",
        url: "https://metamask.io",
      },
      {
        name: "OpenSea",
        description: "Leading NFT marketplace for trading digital collectibles (ETH, Polygon, etc.).",
        url: "https://opensea.io",
      },
      {
        name: "Etherscan",
        description: "Block explorer for the Ethereum network.",
        url: "https://etherscan.io/",
      },
    ],
  },
  {
    chainName: "Solana Ecosystem",
    resources: [
      {
        name: "Phantom",
        description: "Solana wallet for fast, secure transactions.",
        url: "https://phantom.app",
      },
      {
        name: "Magic Eden",
        description: "Solana's top NFT marketplace with cross-chain support.",
        url: "https://magiceden.io",
      },
      {
        name: "Solana Explorer",
        description: "Track Solana transactions and blocks.",
        url: "https://explorer.solana.com",
      },
      {
        name: "Sol Incinerator",
        description: "Burn unwanted SPL tokens and recover SOL.",
        url: "https://solincinerator.com/",
      },
      {
        name: "Jupiter Aggregator (JUP)",
        description: "Solana's leading swap aggregator.",
        url: "https://jup.ag/",
      },
      {
        name: "letsbonk.fun",
        description: "Trade memecoins on the Solana network.",
        url: "https://letsbonk.fun",
      },
      {
        name: "pump.fun",
        description: "Launch and trade new memecoins instantly.",
        url: "https://pump.fun",
      },
      {
        name: "rugs.fun",
        description: "Engage in Solana-based casino games.",
        url: "https://rugs.fun",
      },
      {
        name: "solpot.com",
        description: "Provably fair casino games on Solana.",
        url: "https://solpot.com",
      },
    ],
  },
  {
    chainName: "Base Ecosystem",
    resources: [
      {
        name: "Basescan",
        description: "Block explorer for the Base network (L2).",
        url: "https://basescan.org/",
      },
      {
        name: "Base Official",
        description: "Learn about Coinbase's L2 network.",
        url: "https://base.org/",
      },
    ],
  },
  {
    chainName: "Sui Ecosystem",
    resources: [
      {
        name: "Sui Explorer",
        description: "Official block explorer for the Sui network.",
        url: "https://suiexplorer.com/",
      },
      {
        name: "Sui Official",
        description: "Learn about the Sui blockchain.",
        url: "https://sui.io/",
      },
    ],
  },
  {
    chainName: "ApeCoin (Ape Chain)",
    resources: [
      {
        name: "ApeCoin DAO",
        description: "Official website for ApeCoin and its governance.",
        url: "https://apecoin.com/",
      },
      {
        name: "ApeChain by Horizen",
        description: "Dedicated ApeCoin blockchain powered by Horizen.",
        url: "https://www.horizen.io/apechain/",
      },
    ],
  },
  {
    chainName: "Sei Ecosystem",
    resources: [
      {
        name: "Seiscan",
        description: "Block explorer for the Sei network.",
        url: "https://www.seiscan.app/",
      },
      {
        name: "Sei Network Official",
        description: "Learn about the Sei blockchain.",
        url: "https://www.sei.io/",
      },
    ],
  },
  {
    chainName: "Avalanche (Avax) Ecosystem",
    resources: [
      {
        name: "Snowtrace (C-Chain Explorer)",
        description: "Block explorer for the Avalanche C-Chain.",
        url: "https://snowtrace.io/",
      },
      {
        name: "Avalanche Official",
        description: "Learn about the Avalanche platform.",
        url: "https://www.avax.network/",
      },
    ],
  },
];


export default function GreatHoodieHall() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isHolder, setIsHolder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState("Phantom"); // Default to Phantom
  const [currentTime, setCurrentTime] = useState<string>("");

  const WIFHOODIE_COLLECTION_ADDRESS = "6bRhotj6T2ducLXdMneXCXUYW1ye4bRZCTHatxZKutS5";
  const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;

  const connectWallet = async () => {
    try {
      const { solana }: any = window; 
      if (selectedWallet === "Phantom" && solana && solana.isPhantom) {
        const response = await solana.connect();
        setWalletAddress(response.publicKey.toString());
      } else if (selectedWallet === "MagicEden" && solana) {
        if (solana.isPhantom || solana.isBackpack ) {
            const response = await solana.connect();
            setWalletAddress(response.publicKey.toString());
        } else {
            alert("Compatible Solana wallet (like Phantom) needed for Magic Eden connection not found.");
        }
      } else {
        alert(`Please install or select a compatible ${selectedWallet} wallet!`);
      }
    } catch (error) {
      console.error("Wallet connection failed:", error);
      alert("Failed to connect wallet.");
    }
  };

  const checkWifHoodieOwnership = useCallback(async () => {
    if (!walletAddress) {
      console.error("No wallet address provided.");
      return;
    }
    setLoading(true);
    try {
      // Use our server-side API route to avoid CORS issues
              const response = await axios.post('/.netlify/functions/nft-verification', {
        walletAddress
      }, {
        headers: { 
          'Content-Type': 'application/json'
        }
      });
      
      const hasWifHoodie = response.data.isHolder;
      console.log("Does the wallet hold a WifHoodie NFT?", hasWifHoodie);
      console.log("NFTs found:", response.data.nftsFound);
      console.log("API used:", response.data.apiUsed);
      
      setIsHolder(hasWifHoodie);
      if (!hasWifHoodie && response.data.nftsFound > 0) {
        console.log("User owns NFTs, but not from the WifHoodie collection");
        console.log("Sample NFTs:", response.data.nfts);
      } else if (response.data.nftsFound === 0) {
        console.log("User owns no NFTs according to the API.");
      }

    } catch (error) {
      console.error("NFT check failed:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
      }
      alert("Failed to verify WifHoodie NFT.");
    }
    setLoading(false);
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      checkWifHoodieOwnership();
    }
  }, [walletAddress, checkWifHoodieOwnership]);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900 to-slate-900"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="relative z-10 p-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            asChild
            variant="outline"
            className="bg-slate-800/50 hover:bg-slate-700/50 text-cyan-400 hover:text-cyan-300 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300"
          >
            <Link href="/courses">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent glow-text">
            The Great Hoodie Hall
          </h1>
          <p className="text-xl text-gray-300 mb-2">Glossary, Resources & More</p>
          <p className="text-cyan-300 text-lg">
            Current Time: <span className="text-green-400 font-mono">{currentTime}</span>
          </p>
        </div>
        {/* Main content: glossary, resources, wallet, etc. */}
        <div className="grid md:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Glossary */}
          <Card className="bg-slate-800/80 border-2 border-cyan-500/40 backdrop-blur-sm shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-cyan-400 mb-4 glow-text">Web3 Glossary</h2>
              <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {glossaryTerms.map((item) => (
                  <li key={item.term}>
                    <span className="text-pink-400 font-semibold">{item.term}:</span> <span className="text-gray-300">{item.definition}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          {/* Resources */}
          <Card className="bg-slate-800/80 border-2 border-pink-500/40 backdrop-blur-sm shadow-[0_0_30px_rgba(236,72,153,0.3)]">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-pink-400 mb-4 glow-text">Resources</h2>
              <ul className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {categorizedResources.map((cat) => (
                  <li key={cat.chainName}>
                    <span className="text-cyan-400 font-semibold">{cat.chainName}</span>
                    <ul className="ml-4 mt-1 space-y-1">
                      {cat.resources.map((res) => (
                        <li key={res.name}>
                          <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
                            {res.name}
                          </a>
                          <span className="text-gray-300 ml-2">- {res.description}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        {/* Footer hashtags */}
        <div className="mt-12 text-cyan-400/70 text-sm text-center">#StayBuilding #StayHODLing</div>
      </div>
      <style jsx global>{`
        .glow-text {
          text-shadow: 0 0 10px currentColor;
        }
      `}</style>
    </div>
  );
}

    