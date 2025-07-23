import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export const createServerSupabaseClient = () => {
  return createServerComponentClient<Database>({ cookies })
} 