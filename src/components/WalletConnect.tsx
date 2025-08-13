"use client";
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Wallet } from 'lucide-react';

declare global {
  interface Window {
    solana?: any;
  }
}

export default function WalletConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check if wallet is already connected
    if (typeof window !== 'undefined' && window.solana?.isConnected) {
      setIsConnected(true);
      setWalletAddress(window.solana.publicKey?.toString() || null);
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.solana) {
      alert('Please install Phantom wallet');
      return;
    }

    try {
      setIsConnecting(true);
      const response = await window.solana.connect();
      setIsConnected(true);
      setWalletAddress(response.publicKey.toString());
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    if (typeof window !== 'undefined' && window.solana) {
      window.solana.disconnect();
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
