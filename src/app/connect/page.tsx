'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Wallet, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ConnectPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already connected
    const walletAddress = localStorage.getItem('userWalletAddress') || 
                         localStorage.getItem('connectedWallet') || 
                         localStorage.getItem('walletAddress');
    
    if (walletAddress) {
      setIsConnected(true);
      // Redirect to home after a short delay
      setTimeout(() => {
        router.replace('/');
      }, 2000);
    }
  }, [router]);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Check if Phantom wallet is available
      if (typeof window !== 'undefined' && window.solana?.isPhantom) {
        const response = await window.solana.connect();
        const walletAddress = response.publicKey.toString();
        
        // Store wallet address in localStorage
        localStorage.setItem('userWalletAddress', walletAddress);
        localStorage.setItem('connectedWallet', walletAddress);
        localStorage.setItem('walletAddress', walletAddress);
        
        setIsConnected(true);
        console.log('✅ Wallet connected:', walletAddress);
        
        // Redirect to home
        router.push('/');
      } else {
        setError('Phantom wallet not found. Please install Phantom wallet to access Hoodie Academy.');
      }
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      if (err.code === 4001) {
        setError('Connection was rejected. Please try again.');
      } else {
        setError('Failed to connect wallet. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  if (isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Card className="max-w-md w-full bg-slate-800/50 border-2 border-green-500/30 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-400 mb-2">Wallet Connected!</h1>
            <p className="text-gray-300 mb-4">Redirecting to Hoodie Academy...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Card className="max-w-md w-full bg-slate-800/50 border-2 border-cyan-500/30 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Welcome to Hoodie Academy
            </h1>
            <p className="text-gray-300 text-lg">
              Connect your wallet to start your Web3 learning journey
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">Connection Error</span>
              </div>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <Button
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white py-3 text-lg font-semibold"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5 mr-2" />
                  Connect Phantom Wallet
                </>
              )}
            </Button>

            <div className="text-sm text-gray-400">
              <p>Don't have Phantom wallet?</p>
              <a 
                href="https://phantom.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                Download Phantom Wallet
              </a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-600">
            <p className="text-xs text-gray-500">
              By connecting your wallet, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 