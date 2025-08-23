'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Shield, Users } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, logout } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleWalletLogin = async () => {
    setIsConnecting(true);
    try {
      // This will trigger wallet connection through useAuth
      // The actual login logic is handled in the useAuth hook
      await login({} as any); // Pass empty object, the hook will handle wallet connection
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Hoodie Academy
          </CardTitle>
          <CardDescription className="text-gray-600">
            Connect your wallet to access the academy
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button 
            onClick={handleWalletLogin}
            disabled={isConnecting}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3"
          >
            <Wallet className="w-5 h-5 mr-2" />
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
          
          <div className="text-center text-sm text-gray-500">
            <p>No account needed - just connect your wallet</p>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-1" />
                Secure
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                Community
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
