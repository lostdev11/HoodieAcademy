'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function AdminDirectPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [overrideCode, setOverrideCode] = useState('');
  const [showOverride, setShowOverride] = useState(false);

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
    
    // Store in localStorage for other components
    localStorage.setItem('hoodie_academy_wallet', wallet);
    localStorage.setItem('hoodie_academy_is_admin', isAdminWallet.toString());
    
    console.log('🔍 Direct admin check:', { wallet, isAdmin: isAdminWallet });
  };

  const connectWallet = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && window.solana) {
        await window.solana.connect();
        if (window.solana.publicKey) {
          const wallet = window.solana.publicKey.toString();
          setWalletAddress(wallet);
          checkAdminStatus(wallet);
        }
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = () => {
    if (OVERRIDE_CODES.includes(overrideCode)) {
      setIsAdmin(true);
      localStorage.setItem('hoodie_academy_is_admin', 'true');
      setShowOverride(false);
      console.log('🔧 Admin override activated with code:', overrideCode);
    } else {
      alert('Invalid override code. Try: admin123, hoodie2024, or bypass');
    }
  };

  const forceAdmin = () => {
    setIsAdmin(true);
    localStorage.setItem('hoodie_academy_is_admin', 'true');
    console.log('🔧 Admin forced to true');
  };

  const goToAdmin = () => {
    window.location.href = '/admin-dashboard';
  };

  const goToAdminForce = () => {
    window.location.href = '/admin-force';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Direct Admin Access</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-800">
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Wallet:</strong> {walletAddress || 'Not connected'}</p>
              <p><strong>Admin Status:</strong> {isAdmin ? '✅ TRUE' : '❌ FALSE'}</p>
              <p><strong>Is Admin Wallet:</strong> {walletAddress ? (adminWallets.includes(walletAddress) ? '✅ YES' : '❌ NO') : 'N/A'}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={connectWallet} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </Button>
              <Button 
                onClick={() => setShowOverride(!showOverride)} 
                variant="outline" 
                className="w-full"
              >
                {showOverride ? 'Hide Override' : 'Show Override Options'}
              </Button>
              <Button 
                onClick={forceAdmin} 
                variant="destructive" 
                className="w-full"
                disabled={!walletAddress}
              >
                Force Admin = True
              </Button>
            </CardContent>
          </Card>
        </div>

        {showOverride && (
          <Card className="bg-slate-800 mb-8">
            <CardHeader>
              <CardTitle>Override Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="override-code">Override Code</Label>
                <Input
                  id="override-code"
                  type="password"
                  value={overrideCode}
                  onChange={(e) => setOverrideCode(e.target.value)}
                  placeholder="Enter override code"
                />
                <p className="text-sm text-slate-400 mt-1">
                  Valid codes: admin123, hoodie2024, bypass
                </p>
              </div>
              <Button onClick={handleOverride} className="w-full">
                Activate Override
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="bg-slate-800 mb-8">
          <CardHeader>
            <CardTitle>Admin Wallets (Hardcoded)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {adminWallets.map((wallet, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-sm font-mono bg-slate-700 px-2 py-1 rounded">
                    {wallet}
                  </span>
                  {wallet === walletAddress && (
                    <Badge variant="default">Current</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {isAdmin ? (
          <Card className="bg-green-900 border-green-700">
            <CardHeader>
              <CardTitle className="text-green-400">✅ Admin Access Granted</CardTitle>
            </CardHeader>
            <CardContent>
              <p>You have admin access! You can now access the admin dashboard.</p>
              <div className="flex space-x-2 mt-4">
                <Button 
                  onClick={goToAdmin} 
                  className="bg-green-600 hover:bg-green-700"
                >
                  Go to Admin Dashboard
                </Button>
                <Button 
                  onClick={goToAdminForce} 
                  variant="outline"
                >
                  Go to Admin Force Page
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-red-900 border-red-700">
            <CardHeader>
              <CardTitle className="text-red-400">❌ Admin Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Connect your wallet and use the override options above if needed.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}