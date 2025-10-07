'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Users, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { userDataSync } from '@/lib/user-data-sync';
import { supabase } from '@/lib/supabase';

interface UserConnectionTestProps {
  className?: string;
}

export default function UserConnectionTest({ className = '' }: UserConnectionTestProps) {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [userCount, setUserCount] = useState(0);

  const testUserCreation = async () => {
    setTesting(true);
    try {
      // Test wallet address (you can change this)
      const testWalletAddress = 'test-wallet-' + Date.now();
      
      console.log('🧪 Testing user creation with wallet:', testWalletAddress);
      
      // Test the user sync service
      const result = await userDataSync.syncUserOnWalletConnect(testWalletAddress, {
        display_name: `Test User ${Date.now()}`,
        squad: 'Test Squad',
        bio: 'This is a test user created for testing purposes'
      });
      
      console.log('✅ User sync result:', result);
      
      // Verify user was created
      const { data: createdUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', testWalletAddress)
        .single();
      
      if (error) {
        throw new Error(`Failed to verify user creation: ${error.message}`);
      }
      
      console.log('✅ User verified in database:', createdUser);
      
      // Get current user count
      const { data: allUsers, error: countError } = await supabase
        .from('users')
        .select('wallet_address');
      
      if (countError) {
        throw new Error(`Failed to get user count: ${countError.message}`);
      }
      
      setUserCount(allUsers?.length || 0);
      
      setTestResults({
        success: true,
        testWallet: testWalletAddress,
        createdUser,
        totalUsers: allUsers?.length || 0,
        message: 'User creation test successful!'
      });
      
    } catch (error) {
      console.error('❌ User creation test failed:', error);
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'User creation test failed!'
      });
    } finally {
      setTesting(false);
    }
  };

  const getCurrentUserCount = async () => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('wallet_address');
      
      if (error) {
        console.error('Error getting user count:', error);
        return;
      }
      
      setUserCount(users?.length || 0);
      console.log('📊 Current user count:', users?.length || 0);
    } catch (error) {
      console.error('Error getting user count:', error);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Connection Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Current Users in Database</p>
                <p className="text-2xl font-bold text-white">{userCount}</p>
              </div>
              <Button
                onClick={getCurrentUserCount}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Check Count
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={testUserCreation}
                disabled={testing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {testing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wallet className="w-4 h-4 mr-2" />
                )}
                {testing ? 'Testing...' : 'Test User Creation'}
              </Button>
            </div>

            {testResults && (
              <div className="mt-4 p-4 bg-slate-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {testResults.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={`font-medium ${testResults.success ? 'text-green-400' : 'text-red-400'}`}>
                    {testResults.message}
                  </span>
                </div>
                
                {testResults.success ? (
                  <div className="space-y-2 text-sm">
                    <p><strong>Test Wallet:</strong> {testResults.testWallet}</p>
                    <p><strong>Created User:</strong> {testResults.createdUser?.display_name}</p>
                    <p><strong>Total Users:</strong> {testResults.totalUsers}</p>
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      ✅ Test Passed
                    </Badge>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p><strong>Error:</strong> {testResults.error}</p>
                    <Badge variant="outline" className="text-red-400 border-red-400">
                      ❌ Test Failed
                    </Badge>
                  </div>
                )}
              </div>
            )}

            <div className="text-xs text-slate-500">
              This test creates a temporary user to verify the user creation system is working properly.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
