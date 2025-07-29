import Link from 'next/link';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';

export default function Navigation() {
  const {
    wallet,
    isAdmin,
    loading,
    error,
    connectWallet,
    disconnectWallet
  } = useWalletSupabase();

  return (
    <nav className="flex space-x-4 text-white bg-black p-4 items-center">
      <Link href="/">Home</Link>
      <Link href="/courses">Courses</Link>
      <Link href="/lore-narrative-crafting" className="text-green-400">📚 Lore</Link>
      <Link href="/creators" className="text-pink-400">🎨 Creators</Link>
      <Link href="/dojo/logs" className="text-purple-400">📜 Dojo Logs</Link>
      {isAdmin && (
        <Link href="/admin" className="text-green-400">Admin</Link>
      )}
      {wallet ? (
        <>
          <span className="ml-4 text-cyan-300 font-mono">{wallet.slice(0, 6)}...{wallet.slice(-4)}</span>
          <button onClick={disconnectWallet} className="ml-2 text-red-400 hover:underline">Disconnect</button>
        </>
      ) : (
        <button onClick={connectWallet} className="ml-4 bg-cyan-600 px-3 py-1 rounded hover:bg-cyan-500">Connect Wallet</button>
      )}
      {loading && <span className="ml-2 text-yellow-400">Connecting...</span>}
      {error && <span className="ml-2 text-red-400">{error}</span>}
    </nav>
  );
} 