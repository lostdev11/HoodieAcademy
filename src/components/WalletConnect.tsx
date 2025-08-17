"use client";
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Wallet } from 'lucide-react';

export default function WalletConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Try to auto-connect to previously authorized wallet
    const autoConnect = async () => {
      const sol = typeof window !== 'undefined' ? window.solana : undefined;
      
      if (sol?.isPhantom) {
        try {
          const res = await sol.connect({ onlyIfTrusted: true });
          const addr = res?.publicKey?.toString() ?? sol.publicKey?.toString();
          if (addr) {
            setWalletAddress(addr);
            setIsConnected(true);
          }
        } catch (error) {
          // User hasn't authorized this site yet, which is fine
          console.log('Auto-connect failed (not authorized yet):', error);
        }
      }
    };
    
    autoConnect();
  }, []);

  const connectWallet = async () => {
    const sol = typeof window !== 'undefined' ? window.solana : undefined;

    if (!sol?.isPhantom) {
      alert('Please install Phantom wallet');
      return;
    }

    try {
      setIsConnecting(true);
      const res = await sol.connect();
      const addr = res?.publicKey?.toString() ?? sol.publicKey?.toString();
      if (addr) {
        setWalletAddress(addr);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    const sol = typeof window !== 'undefined' ? window.solana : undefined;

    try {
      if (sol?.disconnect) {
        await sol.disconnect();
      }
    } catch (e) {
      console.error("disconnect error", e);
    } finally {
      setIsConnected(false);
      setWalletAddress(null);
    }
  };

  if (isConnected && walletAddress) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-300">
          {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
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
    <Button
      variant="outline"
      size="sm"
      onClick={connectWallet}
      disabled={isConnecting}
      className="border-amber-500/50 text-amber-300 hover:bg-amber-500/20"
    >
      <Wallet className="w-4 h-4 mr-2" />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}
