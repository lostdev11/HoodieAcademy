'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminForcePage() {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    // Check if wallet is already connected
    if (typeof window !== 'undefined') {
      const storedWallet = localStorage.getItem('hoodie_academy_wallet');
      const storedAdmin = localStorage.getItem('hoodie_academy_is_admin');
      
      if (storedWallet) {
        setWalletAddress(storedWallet);
      }
      
      if (storedAdmin === 'true') {
        setIsAdmin(true);
      }
      
      // Also check Phantom wallet
      if (window.solana?.publicKey) {
        const phantomWallet = window.solana.publicKey.toString();
        setWalletAddress(phantomWallet);
      }
    }
  }, []);

  const forceAdminAccess = () => {
    if (typeof window !== 'undefined') {
      // Set admin status in localStorage
      localStorage.setItem('hoodie_academy_is_admin', 'true');
      if (walletAddress) {
        localStorage.setItem('hoodie_academy_wallet', walletAddress);
      }
      
      setIsAdmin(true);
      
      // Show success message
      alert('Admin access granted! Redirecting to admin dashboard...');
      
      // Redirect to admin dashboard
      setTimeout(() => {
        router.push('/admin');
      }, 1000);
    }
  };

  const checkAdminStatus = () => {
    const adminWallets = [
      'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
      'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
      '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
      '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
    ];
    
    return adminWallets.includes(walletAddress);
  };

  const shouldBeAdmin = checkAdminStatus();

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-400" />
            Force Admin Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Current Status */}
          <div className="space-y-4">
            <div className="p-4 bg-slate-700 rounded-lg">
              <h3 className="font-medium text-white mb-2">Current Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Wallet:</span>
                  <code className="text-xs bg-slate-600 px-2 py-1 rounded">
                    {walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` : 'Not detected'}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Should be Admin:</span>
                  <Badge variant={shouldBeAdmin ? "default" : "secondary"} className={shouldBeAdmin ? "bg-green-600" : "bg-red-600"}>
                    {shouldBeAdmin ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Current Status:</span>
                  <Badge variant={isAdmin ? "default" : "secondary"} className={isAdmin ? "bg-green-600" : "bg-red-600"}>
                    {isAdmin ? 'Admin' : 'Not Admin'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {walletAddress ? (
            <div className="space-y-4">
              {shouldBeAdmin ? (
                <div className="p-4 bg-green-900/20 border border-green-500 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Wallet is in Admin List</span>
                  </div>
                  <p className="text-sm text-green-300">
                    Your wallet ({walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}) is configured as an admin wallet.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">Wallet Not in Admin List</span>
                  </div>
                  <p className="text-sm text-red-300">
                    Your wallet is not in the configured admin wallets list.
                  </p>
                </div>
              )}

              <Button 
                onClick={forceAdminAccess}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Shield className="w-4 h-4 mr-2" />
                Force Admin Access
              </Button>
            </div>
          ) : (
            <div className="p-4 bg-yellow-900/20 border border-yellow-500 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-400 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">No Wallet Detected</span>
              </div>
              <p className="text-sm text-yellow-300">
                Please connect your wallet first, then refresh this page.
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Instructions</span>
            </div>
            <ul className="text-sm text-blue-300 space-y-1">
              <li>1. Connect your wallet</li>
              <li>2. Refresh this page</li>
              <li>3. Click "Force Admin Access"</li>
              <li>4. You'll be redirected to admin dashboard</li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="flex gap-2">
            <Button 
              onClick={() => router.push('/admin-debug')} 
              variant="outline" 
              className="flex-1"
            >
              Debug Page
            </Button>
            <Button 
              onClick={() => router.push('/admin-bypass')} 
              variant="outline" 
              className="flex-1"
            >
              Bypass Page
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}