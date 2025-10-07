'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, BookOpen, Trophy, Settings, Shield, BarChart3, 
  Target, Megaphone, Bell, Database, Activity, Zap, 
  FileText, Star, CheckCircle
} from 'lucide-react';

export default function AdminUnrestrictedPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Check if wallet is connected
    const checkWallet = () => {
      if (typeof window !== 'undefined' && window.solana?.publicKey) {
        const wallet = window.solana.publicKey.toString();
        setWalletAddress(wallet);
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

  const connectWallet = async () => {
    try {
      if (typeof window !== 'undefined' && window.solana) {
        await window.solana.connect();
        if (window.solana.publicKey) {
          const wallet = window.solana.publicKey.toString();
          setWalletAddress(wallet);
        }
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-400 mr-3" />
              <h1 className="text-xl font-semibold">Admin Dashboard (Unrestricted)</h1>
            </div>
            <div className="flex items-center space-x-4">
              {walletAddress ? (
                <span className="text-sm text-slate-300">
                  {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                </span>
              ) : (
                <Button onClick={connectWallet} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="bounties" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Bounties
            </TabsTrigger>
            <TabsTrigger value="tracking" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Tracking
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Total Users</p>
                      <p className="text-2xl font-bold">1,234</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Active Courses</p>
                      <p className="text-2xl font-bold">45</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Open Bounties</p>
                      <p className="text-2xl font-bold">12</p>
                    </div>
                    <Trophy className="h-8 w-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Live Users</p>
                      <p className="text-2xl font-bold">89</p>
                    </div>
                    <Activity className="h-8 w-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-800">
              <CardHeader>
                <CardTitle>🎉 Welcome to the Unrestricted Admin Dashboard!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 mb-4">
                  This is a bypassed version of the admin dashboard that doesn't check any permissions.
                  You can access all admin features here.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Available Features:</h3>
                    <ul className="text-sm text-slate-400 space-y-1">
                      <li>✅ User Management</li>
                      <li>✅ Course Management</li>
                      <li>✅ Bounty Management</li>
                      <li>✅ Analytics & Tracking</li>
                      <li>✅ System Settings</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Quick Actions:</h3>
                    <div className="space-y-2">
                      <Button size="sm" className="w-full">View All Users</Button>
                      <Button size="sm" className="w-full">Create New Bounty</Button>
                      <Button size="sm" className="w-full">System Analytics</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  User management features would go here. This is the unrestricted access version.
                </p>
                <div className="mt-4">
                  <Button>View All Users</Button>
                  <Button className="ml-2" variant="outline">Export User Data</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <Card className="bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Course Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Course management features would go here. This is the unrestricted access version.
                </p>
                <div className="mt-4">
                  <Button>Create New Course</Button>
                  <Button className="ml-2" variant="outline">Import Courses</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bounties Tab */}
          <TabsContent value="bounties" className="space-y-6">
            <Card className="bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Bounty Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Bounty management features would go here. This is the unrestricted access version.
                </p>
                <div className="mt-4">
                  <Button>Create New Bounty</Button>
                  <Button className="ml-2" variant="outline">Review Submissions</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tracking Tab */}
          <TabsContent value="tracking" className="space-y-6">
            <Card className="bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  User Tracking & Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  This is where the new user tracking dashboard would be integrated.
                </p>
                <div className="mt-4">
                  <Button>View Live Users</Button>
                  <Button className="ml-2" variant="outline">Analytics Report</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  System Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  System settings and configuration would go here.
                </p>
                <div className="mt-4">
                  <Button>System Configuration</Button>
                  <Button className="ml-2" variant="outline">Database Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
