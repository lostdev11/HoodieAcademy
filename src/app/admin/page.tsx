'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboard from "./AdminDashboard";
import { getSupabaseBrowser } from '@/lib/supabaseClient';
import { checkAdminStatusDirect } from '@/lib/admin-check';

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    courses: [],
    announcements: [],
    events: [],
    bounties: [],
    allSubmissions: [],
    globalSettings: {},
    featureFlags: []
  });

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Get wallet address from Phantom or localStorage
        const sol = typeof window !== 'undefined' ? window.solana : undefined;
        let wallet = null;
        
        if (sol?.publicKey) {
          wallet = sol.publicKey.toString();
        } else {
          wallet = localStorage.getItem('walletAddress') || localStorage.getItem('connectedWallet');
        }

        if (!wallet) {
          console.log('No wallet connected');
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        setWalletAddress(wallet);
        console.log('Checking admin status for wallet:', wallet.slice(0, 8) + '...');

        // Check admin status
        const adminStatus = await checkAdminStatusDirect(wallet);
        setIsAdmin(adminStatus);

        if (!adminStatus) {
          console.log('User is not admin, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }

        // Fetch admin data
        const supabase = getSupabaseBrowser();
        
        // Fetch courses
        const { data: courses } = await supabase
          .from("courses")
          .select("id,title,emoji,squad,level,access,description,totalLessons,category,created_at,updated_at,is_visible,is_published")
          .order("created_at", { ascending: true });

        // Fetch announcements
        const { data: announcements } = await supabase
          .from("announcements")
          .select("id,title,content,starts_at,ends_at,is_published,created_at,updated_at")
          .order("created_at", { ascending: false });

        // Fetch events
        const { data: events } = await supabase
          .from("events")
          .select("id,title,description,type,date,time,created_at,updated_at")
          .order("created_at", { ascending: false });

        // Fetch bounties
        const { data: bounties } = await supabase
          .from("bounties")
          .select("id,title,short_desc,reward,deadline,link_to,image,squad_tag,status,hidden,submissions,created_at,updated_at")
          .order("created_at", { ascending: false });

        // Fetch all submissions
        const { data: allSubmissions } = await supabase
          .from("submissions")
          .select("id,title,description,squad,bounty_id,wallet_address,image_url,status,upvotes,total_upvotes,created_at,updated_at")
          .order("created_at", { ascending: false });

        // Fetch global settings
        const { data: globalSettings } = await supabase
          .from("global_settings")
          .select("*")
          .maybeSingle();

        // Fetch feature flags
        const { data: featureFlags } = await supabase
          .from("feature_flags")
          .select("*");

        setData({
          courses: courses || [],
          announcements: announcements || [],
          events: events || [],
          bounties: bounties || [],
          allSubmissions: allSubmissions || [],
          globalSettings: globalSettings || {},
          featureFlags: featureFlags || []
        });

      } catch (error) {
        console.error('Error checking admin access:', error);
        setIsAdmin(false);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p>Access denied. Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminDashboard
      initialCourses={data.courses}
      initialAnnouncements={data.announcements}
      initialEvents={data.events}
      initialBounties={data.bounties}
      initialSubmissions={data.allSubmissions}
      initialGlobalSettings={data.globalSettings}
      initialFeatureFlags={data.featureFlags}
    />
  );
}