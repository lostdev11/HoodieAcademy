
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input"; 

const glossaryTerms = [
  {
    term: "HODL",
    definition: "Holding onto crypto despite market volatility, a degen’s badge of honor.",
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
        description: "Solana’s top NFT marketplace with cross-chain support.",
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


const COURSE_LOCAL_STORAGE_KEYS = {
  WALLET_WIZARDRY: "walletWizardryProgress",
  NFT_MASTERY: "nftMasteryProgress",
  MEME_COIN_MANIA: "memeCoinManiaProgress",
  CRYPTO_X_INFLUENCE: "cryptoXInfluenceProgress",
  COMMUNITY_STRATEGY: "communityStrategyProgress",
};

const ALL_COURSE_KEYS_FOR_HALL_ACCESS = [
    COURSE_LOCAL_STORAGE_KEYS.WALLET_WIZARDRY,
    COURSE_LOCAL_STORAGE_KEYS.NFT_MASTERY,
    COURSE_LOCAL_STORAGE_KEYS.MEME_COIN_MANIA,
    COURSE_LOCAL_STORAGE_KEYS.CRYPTO_X_INFLUENCE,
    COURSE_LOCAL_STORAGE_KEYS.COMMUNITY_STRATEGY,
];

const COURSE_LESSON_COUNTS: Record<string, number> = {
    [COURSE_LOCAL_STORAGE_KEYS.WALLET_WIZARDRY]: 4,
    [COURSE_LOCAL_STORAGE_KEYS.NFT_MASTERY]: 4,
    [COURSE_LOCAL_STORAGE_KEYS.MEME_COIN_MANIA]: 4,
    [COURSE_LOCAL_STORAGE_KEYS.CRYPTO_X_INFLUENCE]: 4,
    [COURSE_LOCAL_STORAGE_KEYS.COMMUNITY_STRATEGY]: 4,
};

const ADMIN_PASSWORD = "darkhoodie";

export default function GreatHoodieHall() {
  const router = useRouter();
  const [isAllowedByCourses, setIsAllowedByCourses] = useState(false);
  const [isAdminBypass, setIsAdminBypass] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [passwordAttempt, setPasswordAttempt] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const checkAllCoursesCompleted = () => {
      if (typeof window !== 'undefined') {
        return ALL_COURSE_KEYS_FOR_HALL_ACCESS.every(key => {
          const savedStatus = localStorage.getItem(key);
          if (savedStatus) {
            try {
              const parsedStatus: Array<'locked' | 'unlocked' | 'completed'> = JSON.parse(savedStatus);
              const totalLessonsForCourse = COURSE_LESSON_COUNTS[key] || 0;
              return parsedStatus.length === totalLessonsForCourse && parsedStatus.every(status => status === 'completed');
            } catch (e) {
              console.error("Failed to parse course progress from localStorage for key:", key, e);
              return false;
            }
          }
          return false;
        });
      }
      return false;
    };

    const allCompleted = checkAllCoursesCompleted();
    setIsAllowedByCourses(allCompleted);
    setIsLoading(false);
  }, []);

  const handlePasswordSubmit = () => {
    if (passwordAttempt === ADMIN_PASSWORD) {
      setIsAdminBypass(true);
      setPasswordError("");
      setShowPasswordInput(false);
    } else {
      setPasswordError("Incorrect password. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-8 px-4 bg-background text-foreground">
        <p>Verifying your achievements...</p>
      </div>
    );
  }

  if (!isAllowedByCourses && !isAdminBypass) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-8 px-4 bg-background text-foreground">
        <LockKeyhole size={48} className="mb-4 text-red-500"/>
        <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">You must complete all courses on The Hoodie Path to enter the Great Hoodie Hall.</p>
        <Button asChild className="mb-4">
          <Link href="/courses">Return to Courses</Link>
        </Button>
        
        {!showPasswordInput && (
          <Button variant="outline" onClick={() => setShowPasswordInput(true)}>
            Admin Access
          </Button>
        )}

        {showPasswordInput && (
          <div className="mt-4 flex flex-col items-center space-y-2 w-full max-w-xs">
            <Input 
              type="password"
              placeholder="Enter admin password"
              value={passwordAttempt}
              onChange={(e) => setPasswordAttempt(e.target.value)}
              className="text-center"
            />
            <Button onClick={handlePasswordSubmit} className="w-full">Submit Password</Button>
            {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-8 px-4 md:px-8 bg-background text-foreground">
      <div className="w-full max-w-5xl mb-8 relative">
        <div className="absolute top-0 left-0 z-10 pt-4 pl-4 md:pt-0 md:pl-0">
          <Button variant="outline" size="sm" asChild className="bg-card hover:bg-muted text-accent hover:text-accent-foreground border-accent">
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

      <main className="flex flex-col items-center justify-center w-full max-w-5xl space-y-12">
        <section className="w-full max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-accent">Hoodie-Verse Lore</h2>
          <p className="text-lg text-foreground">
            The Wallet Wall in the Great Hoodie Hall was forged to protect the “First Thread” keys, securing the Hoodie-Verse’s origins.
          </p>
        </section>

        <section className="w-full max-w-4xl">
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

        <section className="w-full max-w-4xl">
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
      </main>

      <footer className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          #StayBuilding #StayHODLing
        </p>
      </footer>
    </div>
  );
}

