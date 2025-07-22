import { useParams } from 'react-router-dom';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';
import { useEffect } from 'react';

export default function CoursePage() {
  const params = useParams();
  const courseId = params?.slug;
  const {
    wallet,
    loading,
    error,
    connectWallet,
    trackCourseStart,
    trackCourseCompletion
  } = useWalletSupabase();

  useEffect(() => {
    if (wallet && courseId) {
      trackCourseStart(courseId);
    }
  }, [wallet, courseId, trackCourseStart]);

  const markComplete = async () => {
    if (!wallet || !courseId) return;
    await trackCourseCompletion(courseId);
    alert('🎉 Course marked as complete!');
  };

  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-4">Course: {courseId}</h1>
      {wallet ? (
        <span className="text-cyan-300 font-mono">{wallet.slice(0, 6)}...{wallet.slice(-4)}</span>
      ) : (
        <button onClick={connectWallet} className="bg-cyan-600 px-4 py-2 rounded mt-2 hover:bg-cyan-500">Connect Wallet</button>
      )}
      {loading && <span className="ml-2 text-yellow-400">Connecting...</span>}
      {error && <span className="ml-2 text-red-400">{error}</span>}
      {/* Course content goes here */}
      <button
        onClick={markComplete}
        className="bg-green-600 px-4 py-2 rounded mt-6 hover:bg-green-500"
        disabled={!wallet || loading}
      >
        Mark as Complete
      </button>
    </div>
  );
} 