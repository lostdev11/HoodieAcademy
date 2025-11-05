"use client";
import React, { useState, useEffect } from 'react';
import { getSolana, getSolflareProvider, hasSolflare } from '@/utils/wallet-utils';
import { Button } from "@/components/ui/button";
import { Wallet, ChevronDown, Twitter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from 'next/image';

interface WalletInfo {
  name: string;
  icon: string;
  isInstalled: () => boolean;
  connect: () => Promise<string | null>;
  disconnect: () => Promise<void>;
  isConnected: () => boolean;
  getPublicKey: () => string | null;
}

interface Founder {
  name: string;
  xHandle: string;
  pfp: string;
}

// Founder Card Component with error handling
function FounderCard({ founder }: { founder: Founder }) {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(founder.pfp);

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      setImageSrc(`https://ui-avatars.com/api/?name=${encodeURIComponent(founder.name)}&background=amber&color=000&size=64`);
    }
  };

  return (
    <a
      href={`https://x.com/${founder.xHandle.replace('@', '')}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:bg-gray-700/50 hover:border-amber-500/30 transition-all duration-200 group"
    >
      <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-amber-500/20 group-hover:ring-amber-500/40 transition-all">
        <Image
          src={imageSrc}
          alt={founder.name}
          fill
          className="object-cover"
          unoptimized={imageError}
          onError={handleImageError}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate group-hover:text-amber-300 transition-colors">
          {founder.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Twitter className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-400 transition-colors" />
          <p className="text-xs text-gray-400 truncate group-hover:text-amber-400/80 transition-colors">
            {founder.xHandle}
          </p>
        </div>
      </div>
    </a>
  );
}

export default function WalletConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentWallet, setCurrentWallet] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Founders data - update with actual founder information
  const founders: Founder[] = [
    {
      name: 'Founder 1',
      xHandle: '@founder1',
      pfp: '/api/placeholder/64/64', // Replace with actual profile picture URLs
    },
    {
      name: 'Founder 2',
      xHandle: '@founder2',
      pfp: '/api/placeholder/64/64',
    },
    {
      name: 'Founder 3',
      xHandle: '@founder3',
      pfp: '/api/placeholder/64/64',
    },
  ];

  // Wallet configurations
  const wallets: Record<string, WalletInfo> = {
    phantom: {
      name: 'Phantom',
      icon: '👻',
      isInstalled: () => {
        const installed = typeof window !== 'undefined' && !!window.solana?.isPhantom;
        console.log('Phantom installed check:', installed);
        return installed;
      },
      connect: async () => {
        const sol = window.solana;
        if (!sol?.isPhantom) throw new Error('Phantom not installed');
        const res = await sol.connect();
        return res?.publicKey?.toString() ?? sol.publicKey?.toString() ?? null;
      },
      disconnect: async () => {
        const sol = window.solana;
        if (sol?.disconnect) await sol.disconnect();
      },
      isConnected: () => {
        // Be defensive across wallet providers and typings
        const sol = (typeof window !== 'undefined' ? (window as any).solana : null);
        return Boolean(sol?.isConnected ?? sol?.publicKey);
      },
      getPublicKey: () => {
        const sol = window.solana;
        return sol?.publicKey?.toString() ?? null;
      }
    },
    solflare: {
      name: 'Solflare',
      icon: '🔥',
      isInstalled: () => {
        const installed = typeof window !== 'undefined' && !!window.solflare;
        return installed;
      },
      connect: async () => {
        const solflare = window.solflare;
        if (!solflare) throw new Error('Solflare not installed');
        const res = await solflare.connect();
        return res?.publicKey?.toString() ?? solflare.publicKey?.toString() ?? null;
      },
      disconnect: async () => {
        const solflare = window.solflare;
        if (solflare?.disconnect) await solflare.disconnect();
      },
      isConnected: () => {
        // Be defensive across wallet providers and typings
        const solflare = (typeof window !== 'undefined' ? (window as any).solflare : null);
        return Boolean(solflare?.isConnected ?? solflare?.publicKey);
      },
      getPublicKey: () => {
        const solflare = window.solflare;
        return solflare?.publicKey?.toString() ?? null;
      }
    }
  };

  useEffect(() => {
    // Check wallet availability
    const checkWallets = () => {
      const debug = Object.entries(wallets).map(([key, wallet]) => {
        const installed = wallet.isInstalled();
        return `${key}: ${installed ? '✅' : '❌'}`;
      }).join(', ');
      setDebugInfo(debug);
    };

    checkWallets();
    
    // Try to auto-connect to previously authorized wallet
    const autoConnect = async () => {
      for (const [key, wallet] of Object.entries(wallets)) {
        if (wallet.isInstalled() && wallet.isConnected()) {
          const addr = wallet.getPublicKey();
          if (addr) {
            setWalletAddress(addr);
            setIsConnected(true);
            setCurrentWallet(key);
            break;
          }
        }
      }
    };
    
    autoConnect();
  }, []);

  const connectWallet = async (walletKey: string) => {
    const wallet = wallets[walletKey];
    if (!wallet) return;

    if (!wallet.isInstalled()) {
      alert(`Please install ${wallet.name} wallet`);
      return;
    }

    try {
      setIsConnecting(true);
      const addr = await wallet.connect();
      if (addr) {
        setWalletAddress(addr);
        setIsConnected(true);
        setCurrentWallet(walletKey);
      }
    } catch (error) {
      console.error(`Failed to connect ${wallet.name}:`, error);
      alert(`Failed to connect ${wallet.name}: ${error}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    if (currentWallet && wallets[currentWallet]) {
      try {
        await wallets[currentWallet].disconnect();
      } catch (e) {
        console.error("disconnect error", e);
      }
    }
    
    setIsConnected(false);
    setWalletAddress(null);
    setCurrentWallet(null);
  };

  if (isConnected && walletAddress) {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2 w-full sm:w-auto">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-gray-300 font-mono">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </span>
          <span className="text-base sm:text-xs text-amber-400">
            {currentWallet ? wallets[currentWallet]?.icon : '🔗'}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={disconnectWallet}
          className="border-amber-500/50 text-amber-300 hover:bg-amber-500/20 w-full sm:w-auto min-h-[44px] sm:min-h-[36px] touch-manipulation"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Debug info - remove this in production */}
      {debugInfo && (
        <div className="text-xs text-gray-500 mb-2">
          Debug: {debugInfo}
        </div>
      )}
      
      {/* Mobile: Show buttons directly, Desktop: Use dropdown */}
      <div className="sm:hidden space-y-2">
        {/* Mobile view - Full width buttons */}
        {Object.entries(wallets).map(([key, wallet]) => (
          <Button
            key={key}
            onClick={() => connectWallet(key)}
            disabled={isConnecting || !wallet.isInstalled()}
            className="w-full min-h-[56px] border-amber-500/50 text-amber-300 hover:bg-amber-500/20 bg-gray-800 touch-manipulation text-base font-medium"
            variant="outline"
          >
            <span className="mr-3 text-xl">{wallet.icon}</span>
            <span className="flex-1 text-left">{wallet.name}</span>
            {!wallet.isInstalled() && (
              <span className="text-xs text-gray-400">(Not installed)</span>
            )}
          </Button>
        ))}
      </div>
      
      {/* Desktop view - Dropdown */}
      <div className="hidden sm:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isConnecting}
              className="border-amber-500/50 text-amber-300 hover:bg-amber-500/20"
            >
              <Wallet className="w-4 h-4 mr-2" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-gray-800 border-gray-700 min-w-[200px]">
            {Object.entries(wallets).map(([key, wallet]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => connectWallet(key)}
                disabled={!wallet.isInstalled()}
                className="text-gray-200 hover:bg-gray-700 cursor-pointer py-3"
              >
                <span className="mr-2 text-lg">{wallet.icon}</span>
                <span>{wallet.name}</span>
                {!wallet.isInstalled() && (
                  <span className="ml-2 text-xs text-gray-400">(Not installed)</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Founders Section */}
      <div className="mt-6 pt-6 border-t border-gray-700/50">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <span className="text-amber-400">✨</span>
          Founders
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {founders.map((founder, index) => (
            <FounderCard key={index} founder={founder} />
          ))}
        </div>
      </div>
    </div>
  );
}
