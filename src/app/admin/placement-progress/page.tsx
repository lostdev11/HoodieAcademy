"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { fetchUserByWallet } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

// PlacementProgress type (adjust fields as needed)
interface PlacementProgress {
  id: string;
  wallet_address: string;
  started_at: string | null;
  completed_at: string | null;
  score: number | null;
  approved: boolean | null;
  display_name?: string | null;
}

const APPROVAL_OPTIONS = [
  { value: "all", label: "All" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
];

export default function PlacementProgressAdminPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<PlacementProgress[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  // Get wallet address from Phantom/localStorage
  useEffect(() => {
    const getWallet = () => {
      if (typeof window !== "undefined" && window.solana?.publicKey) {
        const address = window.solana.publicKey.toString();
        setWalletAddress(address);
        return address;
      }
      const stored = localStorage.getItem("connectedWallet") || localStorage.getItem("walletAddress");
      if (stored) {
        setWalletAddress(stored);
        return stored;
      }
      setWalletAddress(null);
      return null;
    };
    getWallet();
    const interval = setInterval(getWallet, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check admin status
  useEffect(() => {
    if (!walletAddress) return;
    fetchUserByWallet(walletAddress).then((user) => {
      setIsAdmin(user?.is_admin === true);
    }).catch(() => setIsAdmin(false));
  }, [walletAddress]);

  // Fetch placement progress data
  useEffect(() => {
    if (isAdmin !== true) return;
    setLoading(true);
    const fetchData = async () => {
      // Join placement_progress with users for display_name
      const { data, error } = await supabase
        .from("placement_progress")
        .select("id, wallet_address, started_at, completed_at, score, approved, users(display_name)")
        .order("started_at", { ascending: false });
      if (error) {
        setProgressData([]);
        setLoading(false);
        return;
      }
      // Map display_name from joined users
      const mapped = (data as any[]).map((row) => ({
        ...row,
        display_name: row.users?.display_name || "",
      }));
      setProgressData(mapped);
      setLoading(false);
    };
    fetchData();
  }, [isAdmin]);

  // Approve/Reject actions
  const handleApproval = async (id: string, approved: boolean) => {
    setActionLoading(id + approved);
    const { error } = await supabase
      .from("placement_progress")
      .update({ approved })
      .eq("id", id);
    if (!error) {
      setProgressData((prev) =>
        prev.map((row) => (row.id === id ? { ...row, approved } : row))
      );
    }
    setActionLoading(null);
  };

  // Filtering and searching
  const filteredData = useMemo(() => {
    return progressData.filter((row) => {
      // Filter by approval status
      if (filterStatus === "approved" && row.approved !== true) return false;
      if (filterStatus === "pending" && row.approved !== null) return false;
      if (filterStatus === "rejected" && row.approved !== false) return false;
      // Filter by wallet address search
      if (search && !row.wallet_address.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [progressData, filterStatus, search]);

  // Sort by started_at or completed_at (most recent first)
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aDate = a.completed_at || a.started_at || "";
      const bDate = b.completed_at || b.started_at || "";
      return bDate.localeCompare(aDate);
    });
  }, [filteredData]);

  // Admin protection
  if (isAdmin === null || loading) {
    return <div className="p-8 text-center"><Loader2 className="animate-spin inline mr-2" />Loading...</div>;
  }
  if (isAdmin === false) {
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-400">
        Access denied. You must be an admin to view this page.<br />
        <small>Wallet: {walletAddress || "Not connected"}</small>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                Admin Home
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Placement Progress</h1>
          </div>
          <Badge variant="outline" className="border-green-500 text-green-400">Admin Access</Badge>
        </div>
        <Card className="bg-slate-800/50 border-cyan-500/30 mb-8">
          <CardHeader>
            <CardTitle className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <span>Placement Progress Overview</span>
              <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APPROVAL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Search wallet address..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64"
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Wallet Address</TableHead>
                    <TableHead>Started At</TableHead>
                    <TableHead>Completed At</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Approval Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-400">No data found.</TableCell>
                    </TableRow>
                  ) : (
                    sortedData.map((row) => {
                      let statusBadge;
                      if (row.approved === true) statusBadge = <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Approved</Badge>;
                      else if (row.approved === false) statusBadge = <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
                      else statusBadge = <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;

                      // Bonus: highlight not started/in progress
                      let progressBadge = null;
                      if (!row.started_at) progressBadge = <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30 ml-2">Not Started</Badge>;
                      else if (row.started_at && !row.completed_at) progressBadge = <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 ml-2">In Progress</Badge>;

                      return (
                        <TableRow key={row.id}>
                          <TableCell>{row.display_name || <span className="text-gray-400">Unknown</span>}</TableCell>
                          <TableCell className="font-mono text-xs break-all">{row.wallet_address}</TableCell>
                          <TableCell>{row.started_at ? new Date(row.started_at).toLocaleString() : <span className="text-gray-400">-</span>}{progressBadge}</TableCell>
                          <TableCell>{row.completed_at ? new Date(row.completed_at).toLocaleString() : <span className="text-gray-400">-</span>}</TableCell>
                          <TableCell>{row.score ?? <span className="text-gray-400">-</span>}</TableCell>
                          <TableCell>{statusBadge}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={row.approved === true ? "outline" : "default"}
                                disabled={row.approved === true || actionLoading === row.id + "true"}
                                onClick={() => handleApproval(row.id, true)}
                              >
                                {actionLoading === row.id + "true" ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle className="w-4 h-4 mr-1" />} Approve
                              </Button>
                              <Button
                                size="sm"
                                variant={row.approved === false ? "outline" : "destructive"}
                                disabled={row.approved === false || actionLoading === row.id + "false"}
                                onClick={() => handleApproval(row.id, false)}
                              >
                                {actionLoading === row.id + "false" ? <Loader2 className="animate-spin w-4 h-4" /> : <XCircle className="w-4 h-4 mr-1" />} Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 