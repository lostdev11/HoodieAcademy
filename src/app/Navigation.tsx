'use client';

import { OptimizedLink } from '@/components/ui/optimized-link';
import { OptimizedButton } from '@/components/ui/optimized-button';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import { usePrefetchCommonRoutes } from '@/lib/route-prefetch';

export default function Navigation() {
  const {
    wallet,
    isAdmin,
    loading,
    error,
    connectWallet,
    disconnectWallet
  } = useWalletSupabase();

  // Prefetch common routes for faster navigation
  usePrefetchCommonRoutes();

  return (
    <nav className="flex space-x-4 text-white bg-black p-4 items-center">
      <OptimizedLink href="/" prefetchOnHover>Home</OptimizedLink>
      <OptimizedLink href="/courses" prefetchOnHover>Courses</OptimizedLink>
      <OptimizedLink href="/lore-narrative-crafting" className="text-green-400" prefetchOnHover>
        📚 Lore
      </OptimizedLink>
      <OptimizedLink href="/creators" className="text-pink-400" prefetchOnHover>
        🎨 Creators
      </OptimizedLink>
      <OptimizedLink href="/dojo/logs" className="text-purple-400" prefetchOnHover>
        📜 Dojo Logs
      </OptimizedLink>
      <OptimizedLink href="/retailstar-incentives" className="text-orange-400" prefetchOnHover>
        🛍️ Incentives
      </OptimizedLink>
      {isAdmin && (
        <OptimizedLink href="/admin-dashboard" className="text-green-400" prefetchOnHover>
          Admin Dashboard
        </OptimizedLink>
      )}
      {wallet ? (
        <>
          <span className="ml-4 text-cyan-300 font-mono">{wallet.slice(0, 6)}...{wallet.slice(-4)}</span>
          <OptimizedButton 
            onClick={disconnectWallet} 
            variant="ghost"
            size="sm"
            className="ml-2 text-red-400 hover:text-red-300"
          >
            Disconnect
          </OptimizedButton>
        </>
      ) : (
        <OptimizedButton 
          onClick={connectWallet}
          isLoading={loading}
          loadingText="Connecting..."
          size="sm"
          className="ml-4 bg-cyan-600 px-3 py-1 rounded hover:bg-cyan-500"
        >
          Connect Wallet
        </OptimizedButton>
      )}
      {error && <span className="ml-2 text-red-400">{error}</span>}
    </nav>
  );
} 