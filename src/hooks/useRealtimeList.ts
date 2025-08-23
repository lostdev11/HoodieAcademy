"use client";
import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseClient';

export function useRealtimeList<T>(
  tableName: string,
  initialData: T[] = []
) {
  const [data, setData] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    const channel = supabase
      .channel(`${tableName}-realtime`)
      .on("postgres_changes", { event: "*", schema: "public", table: tableName }, (payload: any) => {
        const row = (payload.new ?? payload.old) as T;
        setData((prev) => {
          if (payload.eventType === "INSERT") {
            // avoid duplicates
            if (prev.some((item) => item === row)) return prev;
            return [row, ...prev];
          } else if (payload.eventType === "UPDATE") {
            return prev.map((item) => (item === payload.old ? row : item));
          } else if (payload.eventType === "DELETE") {
            return prev.filter((item) => item !== payload.old);
          }
          return prev;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName]);

  return { data, setData, isLoading, error };
}
