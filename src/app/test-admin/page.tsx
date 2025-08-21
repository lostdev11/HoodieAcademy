'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageLayout from "@/components/layouts/PageLayout";
import { CardFeedItem, InfoCard } from "@/components/layouts/CardFeedLayout";
import { academyNavigationSections } from "@/components/layouts/NavigationDrawer";
import { isCurrentUserAdmin } from "@/lib/utils";

export default function TestAdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setLoading(true);
        
        // Get wallet address
        const storedWallet = localStorage.getItem('walletAddress');
        if (storedWallet) {
          setWalletAddress(storedWallet);
        }

        // Check admin status
        const adminStatus = await isCurrentUserAdmin();
        setIsAdmin(adminStatus);
        
        console.log('TestAdmin: Admin status:', adminStatus);
        console.log('TestAdmin: Wallet address:', storedWallet);
      } catch (error) {
        console.error('TestAdmin: Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  if (loading) {
    return (
      <PageLayout title="Testing Admin Access" subtitle="Loading...">
        <CardFeedItem title="Loading">
          <p>Checking admin status...</p>
        </CardFeedItem>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Admin Access Test"
      subtitle="Testing admin detection and navigation"
      navigationSections={academyNavigationSections}
      navigationDrawerTitle="Test Navigation"
      navigationDrawerSubtitle="Should show admin tools for admin users"
    >
      <InfoCard
        title="Admin Status Check"
        icon="🔍"
        variant={isAdmin ? 'success' : 'warning'}
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className={`text-2xl font-bold mb-2 ${isAdmin ? 'text-green-400' : 'text-yellow-400'}`}>
              {isAdmin ? '✅ ADMIN ACCESS GRANTED' : '❌ NOT AN ADMIN'}
            </div>
            <p className="text-gray-300">
              {isAdmin 
                ? 'You should see admin tools in the navigation drawer on the right.' 
                : 'You will not see admin tools in the navigation drawer.'
              }
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-slate-700/30 rounded">
              <div className="font-semibold text-cyan-400">Wallet Address</div>
              <div className="text-gray-300 font-mono text-xs break-all">
                {walletAddress || 'Not connected'}
              </div>
            </div>
            
            <div className="p-3 bg-slate-700/30 rounded">
              <div className="font-semibold text-cyan-400">Admin Status</div>
              <div className={`font-bold ${isAdmin ? 'text-green-400' : 'text-red-400'}`}>
                {isAdmin ? 'TRUE' : 'FALSE'}
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
            >
              Refresh Admin Status
            </Button>
          </div>
        </div>
      </InfoCard>

      <InfoCard
        title="Navigation Drawer Test"
        icon="🧭"
        variant="default"
      >
        <div className="space-y-3">
          <p className="text-gray-300">
            Look at the navigation drawer on the right side of this page. 
            {isAdmin 
              ? ' You should see an "Admin Tools" section with admin-only navigation items.' 
              : ' You should NOT see any admin tools or admin-only navigation items.'
            }
          </p>
          
          <div className="p-3 bg-slate-700/30 rounded">
            <div className="font-semibold text-cyan-400 mb-2">Expected Behavior:</div>
            <ul className="text-sm text-gray-300 space-y-1">
              {isAdmin ? (
                <>
                  <li>✅ Admin Tools section visible</li>
                  <li>✅ Admin Dashboard link visible</li>
                  <li>✅ User Management link visible</li>
                  <li>✅ Course Management link visible</li>
                  <li>✅ Placement Progress link visible</li>
                </>
              ) : (
                <>
                  <li>❌ Admin Tools section hidden</li>
                  <li>❌ All admin-only links hidden</li>
                  <li>✅ Regular navigation items visible</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </InfoCard>

      <InfoCard
        title="Debug Information"
        icon="🐛"
        variant="default"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-slate-700/30 rounded">
              <div className="font-semibold text-cyan-400 mb-2">Session Storage:</div>
              <div className="text-gray-300 font-mono text-xs break-all">
                {typeof window !== 'undefined' ? sessionStorage.getItem('adminAuthenticated') || 'null' : 'N/A'}
              </div>
            </div>
            
            <div className="p-3 bg-slate-700/30 rounded">
              <div className="font-semibold text-cyan-400 mb-2">Local Storage:</div>
              <div className="text-gray-300 font-mono text-xs break-all">
                {typeof window !== 'undefined' ? localStorage.getItem('walletAddress') || 'null' : 'N/A'}
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <Button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  console.log('Session Storage:', sessionStorage.getItem('adminAuthenticated'));
                  console.log('Local Storage wallet:', localStorage.getItem('walletAddress'));
                  console.log('Admin status from function:', isAdmin);
                }
              }}
              variant="outline"
              size="sm"
              className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
            >
              Log Debug Info to Console
            </Button>
          </div>
        </div>
      </InfoCard>
    </PageLayout>
  );
}
