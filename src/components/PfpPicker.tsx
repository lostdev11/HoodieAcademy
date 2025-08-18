'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PfpPicker() {
  const [selectedPfp, setSelectedPfp] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [pfpOptions] = useState([
    '/pfp1.png',
    '/pfp2.png',
    '/pfp3.png',
    '/pfp4.png',
    '/pfp5.png',
    '/pfp6.png'
  ]);

  useEffect(() => {
    let cancelled = false;

    const checkWalletConnection = () => {
      const savedWalletAddress = localStorage.getItem('walletAddress');
      const sessionData = sessionStorage.getItem('wifhoodie_verification');
      
      if (savedWalletAddress && sessionData) {
        try {
          const session = JSON.parse(sessionData);
          const now = Date.now();
          const sessionAge = now - session.timestamp;
          const sessionValid = sessionAge < 24 * 60 * 60 * 1000; // 24 hours
          
          if (sessionValid && session.walletAddress === savedWalletAddress && session.isHolder) {
            if (!cancelled) {
              setWalletAddress(savedWalletAddress);
            }
          } else {
            if (!cancelled) {
              setWalletAddress(null);
            }
          }
        } catch (error) {
          console.error("❌ Debug: Error parsing session data:", error);
          if (!cancelled) {
            setWalletAddress(null);
          }
        }
      } else {
        if (!cancelled) {
          setWalletAddress(null);
        }
      }
    };

    // Check wallet connection on mount
    checkWalletConnection();

    // Listen for storage changes (when wallet connects/disconnects)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'walletAddress' || e.key === 'wifhoodie_verification') {
        checkWalletConnection();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for changes
    const interval = setInterval(checkWalletConnection, 1000);
    
    return () => {
      cancelled = true;
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handlePfpSelect = async (pfpPath: string) => {
    if (walletAddress) {
      setSelectedPfp(pfpPath);
      // Here you can add logic to save the selected PFP to the user's profile
      console.log(`Selected PFP: ${pfpPath} for wallet: ${walletAddress}`);
    }
  };

  const handleConnectWallet = async () => {
    // Redirect to dashboard to connect wallet
    window.location.href = '/';
  };

  return (
    <Card className="bg-slate-800/80 border-2 border-cyan-500/40 backdrop-blur-sm shadow-[0_0_30px_rgba(6,182,212,0.3)]">
      <CardHeader>
        <CardTitle className="text-cyan-400">Profile Picture Picker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!walletAddress ? (
          <div className="text-center">
            <p className="text-gray-300 mb-4">Connect your wallet to select a profile picture</p>
            <Button 
              onClick={handleConnectWallet}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
            >
              Connect Wallet
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center mb-4">
              <p className="text-green-400">Wallet Connected: {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {pfpOptions.map((pfp, index) => (
                <div
                  key={index}
                  className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    selectedPfp === pfp 
                      ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)]' 
                      : 'border-gray-600 hover:border-cyan-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  }`}
                  onClick={() => handlePfpSelect(pfp)}
                >
                  <div className="w-full h-24 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    PFP {index + 1}
                  </div>
                </div>
              ))}
            </div>
            {selectedPfp && (
              <div className="text-center mt-4">
                <p className="text-cyan-400">Selected: {selectedPfp.split('/').pop()}</p>
                <Button 
                  className="mt-2 bg-gradient-to-r from-green-600 to-purple-600 hover:from-green-500 hover:to-purple-500"
                  onClick={() => console.log('Saving PFP selection...')}
                >
                  Save Selection
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
