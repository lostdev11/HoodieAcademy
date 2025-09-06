'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminOverrideProps {
  children: React.ReactNode;
  walletAddress: string | null;
}

export default function AdminOverride({ children, walletAddress }: AdminOverrideProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [overrideMode, setOverrideMode] = useState(false);
  const [overrideCode, setOverrideCode] = useState('');

  // Hardcoded admin wallets
  const adminWallets = [
    'JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU',
    'qg7pNNZq7qDQuc6Xkd1x4NvS2VM3aHtCqHEzucZxRGA',
    '7vswdZFphxbtd1tCB5EhLNn2khiDiKmQEehSNUFHjz7M',
    '63B9jg8iBy9pf4W4VDizbQnBD45QujmzbHyGRtHxknr7'
  ];

  // Override code (simple password)
  const ADMIN_OVERRIDE_CODE = 'admin123';

  useEffect(() => {
    if (walletAddress) {
      const isAdminWallet = adminWallets.includes(walletAddress);
      setIsAdmin(isAdminWallet);
      
      // Store in localStorage
      localStorage.setItem('hoodie_academy_is_admin', isAdminWallet.toString());
      
      console.log('🔍 AdminOverride check:', { wallet: walletAddress, isAdmin: isAdminWallet });
    } else {
      setIsAdmin(false);
    }
  }, [walletAddress]);

  const handleOverride = () => {
    if (overrideCode === ADMIN_OVERRIDE_CODE) {
      setIsAdmin(true);
      localStorage.setItem('hoodie_academy_is_admin', 'true');
      setOverrideMode(false);
      console.log('🔧 Admin override activated');
    } else {
      alert('Invalid override code');
    }
  };

  const forceAdmin = () => {
    setIsAdmin(true);
    localStorage.setItem('hoodie_academy_is_admin', 'true');
    console.log('🔧 Admin forced to true');
  };

  if (!walletAddress) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
          <p className="text-slate-400 mb-6">
            Please connect your wallet to access the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Admin Access Required</h1>
          <p className="text-slate-400 mb-6">
            This wallet ({walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}) does not have admin privileges.
          </p>
          
          <div className="space-y-4">
            <Button 
              onClick={() => setOverrideMode(!overrideMode)} 
              variant="outline"
              className="w-full"
            >
              {overrideMode ? 'Hide Override' : 'Show Override Options'}
            </Button>
            
            {overrideMode && (
              <Card className="bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-sm">Admin Override</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <Label htmlFor="override-code">Override Code</Label>
                    <Input
                      id="override-code"
                      type="password"
                      value={overrideCode}
                      onChange={(e) => setOverrideCode(e.target.value)}
                      placeholder="Enter override code"
                    />
                  </div>
                  <Button onClick={handleOverride} className="w-full">
                    Activate Override
                  </Button>
                  <Button onClick={forceAdmin} variant="destructive" className="w-full">
                    Force Admin (No Code)
                  </Button>
                </CardContent>
              </Card>
            )}
            
            <Button onClick={() => window.location.href = '/'} variant="outline">
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
