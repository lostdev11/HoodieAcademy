"use client";
import { useState, useEffect, useCallback } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

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
        name: "Solflare",
        description: "Solana wallet with staking and hardware support.",
        url: "https://solflare.com",
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

  const WIFHOODIE_COLLECTION_ADDRESS = "6bRhotj6T2ducLXdMneXCXUYW1ye4bRZCTHatxZKutS5";
  const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;

  const connectWallet = async () => {
    try {
      const { solana }: any = window; 
      if (selectedWallet === "Phantom" && solana && solana.isPhantom) {
        const response = await solana.connect();
        setWalletAddress(response.publicKey.toString());
      } else if (selectedWallet === "Solflare" && solana && solana.isSolflare) {
        const response = await solana.connect();
        setWalletAddress(response.publicKey.toString());
      } else if (selectedWallet === "MagicEden" && solana) {
        if (solana.isPhantom || solana.isSolflare || solana.isBackpack ) {
            const response = await solana.connect();
            setWalletAddress(response.publicKey.toString());
        } else {
            alert("Compatible Solana wallet (like Phantom or Solflare) needed for Magic Eden connection not found.");
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
    if (!walletAddress || !HELIUS_API_KEY) {
      if(!HELIUS_API_KEY) console.error("Helius API key is missing. Ensure NEXT_PUBLIC_HELIUS_API_KEY is set.");
      return;
    }
    setLoading(true);
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
              showCollectionMetadata: true 
            }
          },
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      const nfts = response.data.result?.items || [];
      const hasWifHoodie = nfts.some((nft: any) => 
        nft.grouping?.find((group: any) => group.group_key === 'collection' && group.group_value === WIFHOODIE_COLLECTION_ADDRESS)
      );
      setIsHolder(hasWifHoodie);
      if (!hasWifHoodie && nfts.length > 0) {
        console.log("User owns NFTs, but not from the WifHoodie collection:", WIFHOODIE_COLLECTION_ADDRESS);
        console.log("Owned NFTs collections:", nfts.map((nft:any) => nft.grouping?.find((group: any) => group.group_key === 'collection')?.group_value).filter(Boolean));
      } else if (nfts.length === 0) {
        console.log("User owns no NFTs according to Helius.");
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
  }, [walletAddress, HELIUS_API_KEY]);

  useEffect(() => {
    if (walletAddress) {
      checkWifHoodieOwnership();
    }
  }, [walletAddress, checkWifHoodieOwnership]);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-8 px-4 md:px-8 bg-background text-foreground">
      <div className="w-full max-w-5xl mb-8 relative">
        <div className="absolute top-0 left-0 z-10 pt-4 pl-4 md:pt-0 md:pl-0">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="bg-card hover:bg-muted text-accent hover:text-accent-foreground border-accent"
          >
            <Link href="/" className="flex items-center space-x-1">
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </Link>
          </Button>
        </div>
        <header className="text-center pt-16 md:pt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 mb-2">
            Great Hoodie Hall
          </h1>
          <p className="text-md md:text-lg text-muted-foreground mt-2">
            Your gateway to Web3 wisdom.
          </p>
        </header>
      </div>

      <main className="flex flex-col items-center justify-center w-full max-w-5xl space-y-8">
        {!walletAddress ? (
          <div className="text-center p-6 bg-card rounded-xl shadow-lg border-2 neon-border-cyan">
            <p className="text-foreground mb-4 text-lg">Connect your wallet to verify WifHoodie NFT ownership and access exclusive content!</p>
            <select
              value={selectedWallet}
              onChange={(e) => setSelectedWallet(e.target.value)}
              className="bg-muted border border-input text-foreground rounded-lg px-4 py-3 mb-6 w-full max-w-xs text-base focus:ring-2 focus:ring-accent"
            >
              <option value="Phantom">Phantom</option>
              <option value="Solflare">Solflare</option>
              <option value="MagicEden">Magic Eden (via Phantom/Solflare)</option>
            </select>
            <Button
              onClick={connectWallet}
              className="w-full max-w-xs px-6 py-3 rounded-lg shadow-lg bg-gradient-to-r from-green-500 to-purple-600 hover:from-green-600 hover:to-purple-700 text-white text-base font-semibold"
            >
              Connect {selectedWallet} Wallet
            </Button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center text-center p-6">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-foreground text-lg">Verifying your WifHoodie NFT ownership...</p>
          </div>
        ) : isHolder ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <section className="w-full max-w-2xl text-center p-4 bg-card rounded-xl shadow-md border neon-border-green mx-auto">
              <h2 className="text-2xl font-bold text-green-400">Welcome, WifHoodie Holder!</h2>
              <p className="text-foreground mt-1">You have unlocked the Great Hoodie Hall.</p>
            </section>
            
            <section className="w-full max-w-2xl text-center mt-8 mx-auto">
              <h2 className="text-xl font-semibold text-accent mb-2">Hoodie-Verse Lore</h2>
              <p className="text-md text-foreground">
                The Wallet Wall in the Great Hoodie Hall was forged to protect the "First Thread" keys, securing the Hoodie-Verse's origins.
              </p>
            </section>

            <section className="w-full max-w-4xl mt-10 mx-auto">
              <h2 className="text-3xl font-bold text-primary mb-6 text-center">
                Crypto Lingo Glossary: Speak the Web3 Language
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {glossaryTerms.map((item) => (
                  <div key={item.term} className="bg-card p-6 rounded-xl shadow-lg border-2 neon-border-cyan hover:shadow-[0_0_20px_theme(colors.cyan.400)] transition-all duration-300">
                    <h3 className="text-xl font-bold text-primary mb-2">{item.term}</h3>
                    <p className="text-foreground">{item.definition}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="w-full max-w-4xl mt-10 mx-auto">
              <h2 className="text-3xl font-bold text-primary mb-6 text-center">
                Essential Web3 Tools: Gear Up for the Hoodie-Verse
              </h2>
              {categorizedResources.map((category) => (
                <div key={category.chainName} className="mb-10">
                  <h3 className="text-2xl font-semibold text-accent mb-4 text-center md:text-left">{category.chainName}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.resources.map((tool) => (
                      <div key={tool.name} className="bg-card p-6 rounded-xl shadow-lg border-2 neon-border-cyan hover:shadow-[0_0_20px_theme(colors.cyan.400)] transition-all duration-300">
                        <h4 className="text-xl font-bold text-primary mb-2">
                          <a href={tool.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {tool.name}
                          </a>
                        </h4>
                        <p className="text-foreground">{tool.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center p-6 bg-card rounded-xl shadow-lg border-2 neon-border-orange"
          >
            <p className="text-foreground text-lg">
              Access Denied. You need a WifHoodie NFT to enter the Great Hoodie Hall.
            </p>
            <p className="text-muted-foreground mt-2">
              Mint one at <a href="https://magiceden.us/marketplace/wifhoodies" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">WifHoodie on Magic Eden</a>!
            </p>
          </motion.div>
        )}
      </main>

      <footer className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          #StayBuilding #StayHODLing
        </p>
      </footer>
    </div>
  );
}

    