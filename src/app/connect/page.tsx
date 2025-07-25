'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function ConnectPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();

  // Simulate wallet connection logic
  const handleConnect = async () => {
    setIsConnecting(true);
    // Simulate async wallet connection (replace with real logic)
    setTimeout(() => {
      // Save a dummy wallet address to localStorage (replace with real wallet address)
      localStorage.setItem('walletAddress', '0x1234567890abcdef');
      setIsConnecting(false);
      router.push('/');
    }, 1200);
  };

  useEffect(() => {
    // If already connected, redirect to home
    if (typeof window !== 'undefined' && localStorage.getItem('walletAddress')) {
      router.replace('/');
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-6">Connect Your Wallet</h1>
      <p className="text-lg text-muted-foreground mb-8">To access Hoodie Academy, please connect your wallet.</p>
      <Button onClick={handleConnect} disabled={isConnecting} className="px-8 py-4 text-lg">
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    </div>
  );
} 