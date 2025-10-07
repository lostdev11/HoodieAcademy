'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminBypassPage() {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [overrideCode, setOverrideCode] = useState('');
  const [showOverride, setShowOverride] = useState(false);
  const router = useRouter();

  // Hardcoded admin wallets
  const adminWallets = [
    'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
    'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
    '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
    '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
  ];

  // Override codes
  const OVERRIDE_CODES = ['admin123', 'hoodie2024', 'bypass'];

  useEffect(() => {
    // Check if wallet is already connected
    const checkWallet = () => {
      if (typeof window !== 'undefined' && window.solana?.publicKey) {
        const wallet = window.solana.publicKey.toString();
        setWalletAddress(wallet);
        checkAdminStatus(wallet);
      }
    };

    checkWallet();
    
    // Listen for wallet changes
    const handleWalletChange = () => {
      checkWallet();
    };

    window.addEventListener('walletChange', handleWalletChange);
    return () => window.removeEventListener('walletChange', handleWalletChange);
  }, []);

  const checkAdminStatus = (wallet: string) => {
    const isAdminWallet = adminWallets.includes(wallet);
    setIsAdmin(isAdminWallet);
    console.log(`Admin check for ${wallet}: ${isAdminWallet}`);
  };

  const handleWalletInput = (value: string) => {
    setWalletAddress(value);
    if (value.length > 40) { // Basic wallet address length check
      checkAdminStatus(value);
    }
  };

  const handleOverride = () => {
    if (OVERRIDE_CODES.includes(overrideCode)) {
      // Set admin status in localStorage
      localStorage.setItem('hoodie_academy_is_admin', 'true');
      localStorage.setItem('hoodie_academy_wallet', walletAddress);
      setIsAdmin(true);
      setShowOverride(false);
      setOverrideCode('');
    } else {
      alert('Invalid override code');
    }
  };

  const grantAdminAccess = () => {
    if (walletAddress) {
      // Set admin status in localStorage
      localStorage.setItem('hoodie_academy_is_admin', 'true');
      localStorage.setItem('hoodie_academy_wallet', walletAddress);
      setIsAdmin(true);
      
      // Redirect to admin dashboard
      setTimeout(() => {
        router.push('/admin');
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-400" />
            Admin Access Bypass
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wallet Address Input */}
          <div className="space-y-2">
            <Label htmlFor="wallet">Wallet Address</Label>
            <Input
              id="wallet"
              type="text"
              value={walletAddress}
              onChange={(e) => handleWalletInput(e.target.value)}
              placeholder="Enter wallet address or connect wallet"
              className="bg-slate-700 border-slate-600 text-white"
            />
            {walletAddress && (
              <div className="flex items-center gap-2">
                <code className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
                  {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                </code>
                {isAdmin ? (
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-red-400 border-red-400">
                    <XCircle className="w-3 h-3 mr-1" />
                    Not Admin
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Admin Wallets List */}
          <div className="space-y-2">
            <Label>Configured Admin Wallets</Label>
            <div className="grid grid-cols-1 gap-2">
              {adminWallets.map((wallet, index) => (
                <div key={wallet} className="flex items-center justify-between p-2 bg-slate-700 rounded">
                  <code className="text-xs text-slate-300">
                    {wallet.slice(0, 8)}...{wallet.slice(-6)}
                  </code>
                  {walletAddress === wallet && (
                    <Badge variant="outline" className="text-blue-400 border-blue-400">
                      Current
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {walletAddress && (
            <div className="space-y-4">
              {isAdmin ? (
                <div className="p-4 bg-green-900/20 border border-green-500 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Admin Access Granted</span>
                  </div>
                  <p className="text-sm text-green-300">
                    This wallet has admin privileges. You can now access the admin dashboard.
                  </p>
                  <Button 
                    onClick={() => router.push('/admin')}
                    className="mt-3 bg-green-600 hover:bg-green-700"
                  >
                    Go to Admin Dashboard
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">No Admin Access</span>
                    </div>
                    <p className="text-sm text-red-300">
                      This wallet is not in the admin list. You can use an override code or contact an admin.
                    </p>
                  </div>

                  {/* Override Section */}
                  <div className="space-y-2">
                    <Button 
                      onClick={() => setShowOverride(!showOverride)}
                      variant="outline"
                      size="sm"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Use Override Code
                    </Button>
                    
                    {showOverride && (
                      <div className="space-y-2">
                        <Label htmlFor="override">Override Code</Label>
                        <Input
                          id="override"
                          type="password"
                          value={overrideCode}
                          onChange={(e) => setOverrideCode(e.target.value)}
                          placeholder="Enter override code"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                        <Button 
                          onClick={handleOverride}
                          disabled={!overrideCode}
                          className="w-full"
                        >
                          Apply Override
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Force Admin Access */}
                  <Button 
                    onClick={grantAdminAccess}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Force Admin Access (Temporary)
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Instructions</span>
            </div>
            <ul className="text-sm text-blue-300 space-y-1">
              <li>• Connect your wallet or enter a wallet address manually</li>
              <li>• If your wallet is in the admin list, you'll get automatic access</li>
              <li>• Use override codes for emergency access</li>
              <li>• Force admin access is temporary and will reset on page reload</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}