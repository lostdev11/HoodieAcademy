"use client";
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Wallet, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WalletInfo {
  name: string;
  icon: string;
  isInstalled: () => boolean;
  connect: () => Promise<string | null>;
  disconnect: () => Promise<void>;
  isConnected: () => boolean;
  getPublicKey: () => string | null;
}

export default function WalletConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentWallet, setCurrentWallet] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

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
        console.log('Solflare installed check:', installed, 'window.solflare:', window.solflare);
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
    // Debug wallet detection
    const debugWallets = () => {
      const debug = Object.entries(wallets).map(([key, wallet]) => {
        const installed = wallet.isInstalled();
        return `${key}: ${installed ? '✅' : '❌'}`;
      }).join(', ');
      setDebugInfo(debug);
      console.log('Wallet detection debug:', debug);
    };

    debugWallets();
    
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
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-300">
          {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
        </span>
        <span className="text-xs text-amber-400">
          {currentWallet ? wallets[currentWallet]?.icon : '🔗'}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={disconnectWallet}
          className="border-amber-500/50 text-amber-300 hover:bg-amber-500/20"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Debug info - remove this in production */}
      {debugInfo && (
        <div className="text-xs text-gray-500 mb-2">
          Debug: {debugInfo}
        </div>
      )}
      
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
        <DropdownMenuContent className="bg-gray-800 border-gray-700">
          {Object.entries(wallets).map(([key, wallet]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => connectWallet(key)}
              className="text-gray-200 hover:bg-gray-700 cursor-pointer"
            >
              <span className="mr-2">{wallet.icon}</span>
              <span>{wallet.name}</span>
              {!wallet.isInstalled() && (
                <span className="ml-2 text-xs text-gray-400">(Not installed)</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
