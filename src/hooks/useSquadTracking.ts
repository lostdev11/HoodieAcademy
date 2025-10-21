'use client';

import { useState, useEffect, useCallback } from 'react';

export interface SquadMember {
  walletAddress: string;
  displayName: string;
  squad: string;
  totalXP: number;
  level: number;
  joinedSquadAt: string;
  daysInSquad: number;
  lastActive: string | null;
  squadLocked: boolean;
  daysUntilUnlock: number;
}

export interface SquadStats {
  totalMembers: number;
  activeMembers: number;
  totalSquadXP: number;
  avgXPPerMember: number;
  lockedMembers: number;
  topContributor: {
    displayName: string;
    totalXP: number;
    level: number;
  } | null;
}

export function useSquadMembers(squadName: string | null) {
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [stats, setStats] = useState<SquadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!squadName || squadName === 'Unassigned') {
      setMembers([]);
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/squads/members?squad=${squadName}&sortBy=xp`);
      const data = await response.json();

      if (data.success) {
        setMembers(data.members || []);
        setStats(data.statistics || null);
      } else {
        setError(data.error || 'Failed to fetch squad members');
      }
    } catch (err) {
      console.error('Error fetching squad members:', err);
      setError('Failed to fetch squad members');
    } finally {
      setLoading(false);
    }
  }, [squadName]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    stats,
    loading,
    error,
    refresh: fetchMembers
  };
}

export function useSquadRankings(metric: 'xp' | 'members' | 'activity' | 'avg_xp' = 'xp', period: 'all' | 'week' | 'month' = 'all') {
  const [rankings, setRankings] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRankings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/squads/rankings?metric=${metric}&period=${period}`);
      const data = await response.json();

      if (data.success) {
        setRankings(data.rankings || []);
        setGlobalStats(data.statistics || null);
      } else {
        setError(data.error || 'Failed to fetch squad rankings');
      }
    } catch (err) {
      console.error('Error fetching squad rankings:', err);
      setError('Failed to fetch squad rankings');
    } finally {
      setLoading(false);
    }
  }, [metric, period]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  return {
    rankings,
    globalStats,
    loading,
    error,
    refresh: fetchRankings
  };
}

export function useSquadStats(squadName: string | null, detailed: boolean = false) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!squadName || squadName === 'Unassigned') {
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/squads/stats?squad=${squadName}&detailed=${detailed}`);
      const data = await response.json();

      if (data.success) {
        setStats(data);
      } else {
        setError(data.error || 'Failed to fetch squad stats');
      }
    } catch (err) {
      console.error('Error fetching squad stats:', err);
      setError('Failed to fetch squad stats');
    } finally {
      setLoading(false);
    }
  }, [squadName, detailed]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats
  };
}

