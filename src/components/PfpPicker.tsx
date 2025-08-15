'use client';

import type { SolanaWallet } from '../lib/phantom';
import { getWallet, ensureConnected } from '../lib/phantom';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useState } from 'react';

export default function PfpPicker() {
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

  const ensureWallet = async () => {
    const wallet = getWallet();
    if (wallet) {
      // Check if already connected by looking at publicKey existence
      if (!wallet.publicKey) {
        await ensureConnected(wallet);
      }
      const addr = wallet.publicKey?.toString() ?? null;
      setWalletAddress(addr);
      return addr;
    }
    return null;
  };

  const handlePfpSelect = async (pfpPath: string) => {
    const addr = await ensureWallet();
    if (addr) {
      setSelectedPfp(pfpPath);
      // Here you can add logic to save the selected PFP to the user's profile
      console.log(`Selected PFP: ${pfpPath} for wallet: ${addr}`);
    }
  };

  const handleConnectWallet = async () => {
    const addr = await ensureWallet();
    if (addr) {
      console.log('Wallet connected:', addr);
    }
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
