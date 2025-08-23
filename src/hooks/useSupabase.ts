'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseClient';

let supabaseClient: ReturnType<typeof getSupabaseBrowser> | null = null;

export function useSupabase() {
  if (!supabaseClient) {
    supabaseClient = getSupabaseBrowser();
  }

  return supabaseClient;
}

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = getSupabaseBrowser();
  }
  return supabaseClient;
}
